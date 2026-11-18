import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { M3Dialog } from '../../components/M3Dialog';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import type { GeminiMonthAuditResult } from '../../lib/googleSheetsTransparency';
import {
  aggregateForPie,
  generateTransparencyPostSlides,
  type TransparencyPosterSlide,
} from '../../lib/transparencyPosterGenerator';
import { formatBrlFromCents } from '../../lib/validators';
import type { TransparencyEntry } from '../../types/domain';
import { TRANSPARENCY_SHEETS } from './AdminTransparencyFinancePage';

const TYPE_LABELS: Record<TransparencyEntry['type'], string> = {
  receita: 'Entrada (+)',
  despesa: 'Saída (-)',
  ativo: 'Ativo / Repasse (fora do saldo mensal)',
  passivo: 'Passivo',
};

function triggerSlideDownload(slide: TransparencyPosterSlide, monthLabel: string) {
  const a = document.createElement('a');
  a.href = slide.dataUrl;
  a.download = `transparencia-camblu-${monthLabel.toLowerCase()}-slide-${slide.index}.png`;
  a.click();
}

/**
 * Generates and downloads the 3 monthly transparency carousel images (1080x1350).
 * On download, audits the month's spreadsheet import & calculation accuracy via `gemini-flash-lite-latest`
 * and escalates to `gemini-flash-latest` to explain discrepancies & request permission before applying fixes.
 */
export function AdminTransparencyPostsPage() {
  const {
    transparencyEntries,
    transparencyMeta,
    categorizeTransparencyWithGemini,
    auditTransparencyMonth,
    applyTransparencyMonthFix,
  } = useAppData();
  const { notify } = useToast();

  const [posterMonth, setPosterMonth] = useState('Outubro');
  const [slides, setSlides] = useState<TransparencyPosterSlide[]>([]);
  const [categorizingAi, setCategorizingAi] = useState(false);
  const [auditingMonth, setAuditingMonth] = useState(false);
  const [applyingFix, setApplyingFix] = useState(false);
  const [auditResult, setAuditResult] = useState<GeminiMonthAuditResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSlidesToDownload, setPendingSlidesToDownload] = useState<TransparencyPosterSlide[] | null>(null);
  const [verifiedSnapshotKey, setVerifiedSnapshotKey] = useState<string>('');

  const targetEntries = useMemo(
    () => transparencyEntries.filter((e) => e.sheet === posterMonth),
    [transparencyEntries, posterMonth],
  );

  const monthYear = targetEntries[0]?.year || 2026;
  const snapshotKey = useMemo(
    () =>
      `${posterMonth}:${targetEntries
        .map((e) => `${e.id}|${e.type}|${e.category}|${e.amountCents}`)
        .join(';')}`,
    [posterMonth, targetEntries],
  );

  const incomeSlices = useMemo(
    () => aggregateForPie(targetEntries.filter((e) => e.type === 'receita')),
    [targetEntries],
  );

  const expenseSlices = useMemo(
    () => aggregateForPie(targetEntries.filter((e) => e.type === 'despesa')),
    [targetEntries],
  );

  const executeDownloads = (items: TransparencyPosterSlide[]) => {
    items.forEach((s) => triggerSlideDownload(s, posterMonth));
  };

  const handleGeneratePosts = () => {
    const generated = generateTransparencyPostSlides(`${posterMonth} ${monthYear}`, targetEntries);
    setSlides(generated);
    setAuditResult(null);
    setVerifiedSnapshotKey('');
    notify(`3 imagens geradas para o post mensal de ${posterMonth}!`);
  };

  const handleCategorizeAi = async () => {
    setCategorizingAi(true);
    try {
      const res = await categorizeTransparencyWithGemini();
      notify(
        `Categorias atualizadas via ${res.model} (${res.categories.length} categorias). Gere os slides novamente para aplicar nos gráficos!`,
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao categorizar lançamentos com Gemini.', 'error');
    } finally {
      setCategorizingAi(false);
    }
  };

  const handleDownloadWithAudit = async (requestedSlides: TransparencyPosterSlide[]) => {
    if (requestedSlides.length === 0) return;

    // If this exact month snapshot was already verified/approved cleanly in this session, download right away.
    if (verifiedSnapshotKey === snapshotKey) {
      executeDownloads(requestedSlides);
      return;
    }

    setAuditingMonth(true);
    try {
      const result = await auditTransparencyMonth(posterMonth);
      setAuditResult(result);

      if (result.status === 'ok') {
        setVerifiedSnapshotKey(snapshotKey);
        executeDownloads(requestedSlides);
        notify(`Conferência ${result.auditModel}: cálculos de ${posterMonth} validados com sucesso!`);
        return;
      }

      // Discrepancy found: hold download, show root-cause + proposed fix from gemini-flash-latest, ask permission
      setPendingSlidesToDownload(requestedSlides);
      setDialogOpen(true);
      notify(
        `Divergência encontrada em ${posterMonth}. Revise a explicação e autorize a correção antes do download.`,
        'info',
      );
    } catch (err) {
      notify(
        err instanceof Error
          ? `Auditoria Gemini indisponível (${err.message}). Você pode baixar novamente para prosseguir.`
          : 'Erro ao conferir cálculos com Gemini.',
        'error',
      );
      setVerifiedSnapshotKey(snapshotKey);
    } finally {
      setAuditingMonth(false);
    }
  };

  const handleApproveAndApplyFix = async () => {
    if (!auditResult?.proposal) return;
    setApplyingFix(true);
    try {
      const fixedEntries = await applyTransparencyMonthFix(
        posterMonth,
        auditResult.proposal.proposedEntries,
      );
      const regeneratedYear = fixedEntries[0]?.year || monthYear;
      const regenerated = generateTransparencyPostSlides(`${posterMonth} ${regeneratedYear}`, fixedEntries);
      setSlides(regenerated);

      const nextKey = `${posterMonth}:${fixedEntries
        .map((e) => `${e.id}|${e.type}|${e.category}|${e.amountCents}`)
        .join(';')}`;
      setVerifiedSnapshotKey(nextKey);
      setDialogOpen(false);

      const toDownload =
        pendingSlidesToDownload && pendingSlidesToDownload.length === 1
          ? regenerated.filter((s) => s.index === pendingSlidesToDownload[0].index)
          : regenerated;
      setPendingSlidesToDownload(null);
      executeDownloads(toDownload);

      notify(
        `Correção de ${auditResult.fixerModel || 'gemini-flash-latest'} aplicada! Slides de ${posterMonth} regenerados e baixados.`,
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao aplicar correção na transparência.', 'error');
    } finally {
      setApplyingFix(false);
    }
  };

  const handleDownloadWithoutFix = () => {
    const toDownload = pendingSlidesToDownload || slides;
    setVerifiedSnapshotKey(snapshotKey);
    setDialogOpen(false);
    setPendingSlidesToDownload(null);
    if (toDownload.length > 0) {
      executeDownloads(toDownload);
    }
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Posts Mensais de Transparência (Instagram 1080×1350)</h1>
        <p className="text-muted">
          Gere o carrossel de 3 cards (Resultado do mês + gráficos de pizza de Entradas e Saídas). Ao baixar, o{' '}
          <code>gemini-flash-lite-latest</code> confere os cálculos da planilha e aciona o{' '}
          <code>gemini-flash-latest</code> caso encontre qualquer divergência.
        </p>
      </header>

      <article className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <select
            className="m3-select"
            style={{ inlineSize: 'auto' }}
            value={posterMonth}
            onChange={(e) => {
              setPosterMonth(e.target.value);
              setAuditResult(null);
            }}
            aria-label="Mês do post de transparência"
          >
            {TRANSPARENCY_SHEETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className="m3-btn m3-btn--gold" onClick={handleGeneratePosts}>
            <Icon name="auto_awesome" size={18} />
            <span>Gerar 3 Imagens</span>
          </button>
          <button
            type="button"
            className="m3-btn m3-btn--outlined"
            disabled={categorizingAi || transparencyEntries.length === 0}
            onClick={handleCategorizeAi}
          >
            <Icon name="psychology" size={18} />
            <span>{categorizingAi ? 'Categorizando...' : 'Recategorizar (Gemini)'}</span>
          </button>
          {slides.length > 0 && (
            <button
              type="button"
              className="m3-btn m3-btn--blue"
              disabled={auditingMonth || applyingFix}
              onClick={() => handleDownloadWithAudit(slides)}
            >
              <Icon name={auditingMonth ? 'hourglass_top' : 'download'} size={18} />
              <span>
                {auditingMonth ? 'Conferindo cálculos (Flash-Lite)...' : 'Conferir & Baixar Todas (PNG)'}
              </span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            {targetEntries.length} lançamentos em {posterMonth} {monthYear} · {incomeSlices.length} categoria(s) de entrada ·{' '}
            {expenseSlices.length} categoria(s) de saída
          </span>
          {transparencyMeta.aiCategorizationModel && (
            <span className="m3-badge m3-badge--blue">{transparencyMeta.aiCategorizationModel}</span>
          )}
          {auditResult?.status === 'ok' && (
            <span className="m3-badge" style={{ background: '#dcfce7', color: '#14532d' }}>
              <Icon name="verified" size={14} />
              Conferido ({auditResult.auditModel})
            </span>
          )}
          {auditResult?.status === 'discrepancy_found' && (
            <button
              type="button"
              className="m3-badge"
              style={{ background: '#fef3c7', color: '#78350f', border: '1px solid #f59e0b', cursor: 'pointer' }}
              onClick={() => setDialogOpen(true)}
            >
              <Icon name="warning" size={14} />
              Divergência pendente · Revisar solução ({auditResult.fixerModel})
            </button>
          )}
        </div>

        {(incomeSlices.length > 0 || expenseSlices.length > 0) && (
          <div className="grid-two">
            <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.45rem', alignContent: 'start' }}>
              <strong style={{ fontSize: '0.9rem' }}>Fatias de Entradas ({posterMonth})</strong>
              {incomeSlices.length === 0 ? (
                <span className="text-muted" style={{ fontSize: '0.84rem' }}>Sem entradas no período.</span>
              ) : (
                incomeSlices.map((s) => (
                  <div key={`p-in-${s.label}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span>{s.label} ({s.percent}%)</span>
                    <strong>{formatBrlFromCents(s.cents)}</strong>
                  </div>
                ))
              )}
            </div>
            <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.45rem', alignContent: 'start' }}>
              <strong style={{ fontSize: '0.9rem' }}>Fatias de Saídas ({posterMonth})</strong>
              {expenseSlices.length === 0 ? (
                <span className="text-muted" style={{ fontSize: '0.84rem' }}>Sem saídas no período.</span>
              ) : (
                expenseSlices.map((s) => (
                  <div key={`p-out-${s.label}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span>{s.label} ({s.percent}%)</span>
                    <strong>{formatBrlFromCents(s.cents)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {slides.length > 0 && (
          <div className="grid-cards">
            {slides.map((s) => (
              <div key={s.index} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.6rem', padding: '0.85rem' }}>
                <img
                  src={s.dataUrl}
                  alt={`Slide ${s.index}: ${s.title}`}
                  style={{ borderRadius: 'var(--md-sys-shape-corner-md)', inlineSize: '100%' }}
                />
                <button
                  type="button"
                  className="m3-btn m3-btn--outlined"
                  disabled={auditingMonth || applyingFix}
                  onClick={() => handleDownloadWithAudit([s])}
                >
                  <Icon name="download" size={17} />
                  <span>
                    {auditingMonth ? 'Conferindo...' : `Baixar Slide ${s.index} (${s.title})`}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </article>

      <M3Dialog
        open={dialogOpen && Boolean(auditResult?.proposal)}
        onClose={() => setDialogOpen(false)}
        wide
        title={`Auditoria de ${posterMonth} · Divergência detectada`}
      >
        {auditResult?.proposal && (
          <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <span className="m3-badge m3-badge--blue">
                Auditoria: {auditResult.auditModel}
              </span>
              {auditResult.fixerModel && (
                <span className="m3-badge m3-badge--gold">
                  Correção: {auditResult.fixerModel}
                </span>
              )}
            </div>

            <div
              className="m3-card"
              style={{
                borderColor: '#f59e0b',
                background: 'color-mix(in oklab, #fef3c7 55%, var(--md-sys-color-surface))',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <strong>Onde está o erro encontrado</strong>
              <p style={{ margin: 0, fontWeight: 650 }}>{auditResult.proposal.errorLocation}</p>
              <p className="text-muted" style={{ margin: 0 }}>{auditResult.proposal.explanation}</p>
              {auditResult.audit.discrepancies.length > 0 && (
                <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.25rem', fontSize: '0.88rem' }}>
                  {auditResult.audit.discrepancies.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.65rem' }}>
              <strong>Solução proposta & ajuste nas fontes/fórmulas</strong>
              <p style={{ margin: 0 }}>{auditResult.proposal.proposedSolution}</p>
              {auditResult.proposal.dataSourceChanges.length > 0 && (
                <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.25rem', fontSize: '0.88rem' }}>
                  {auditResult.proposal.dataSourceChanges.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.86rem' }}>
                <div>
                  <strong>Fórmula de Entradas:</strong> {auditResult.proposal.formulaChanges.inflowsFormula}
                </div>
                <div>
                  <strong>Fórmula de Saídas:</strong> {auditResult.proposal.formulaChanges.outflowsFormula}
                </div>
                <div>
                  <strong>Resultado Líquido:</strong> {auditResult.proposal.formulaChanges.netResultFormula}
                </div>
                {auditResult.proposal.formulaChanges.notes && (
                  <div className="text-muted">{auditResult.proposal.formulaChanges.notes}</div>
                )}
              </div>
            </div>

            <div className="grid-two">
              <div className="m3-card" style={{ display: 'grid', gap: '0.35rem' }}>
                <span className="m3-label-small text-muted">Cálculo Atual (com divergência)</span>
                <div>Entradas: <strong>{formatBrlFromCents(auditResult.currentSnapshot.totalInCents)}</strong></div>
                <div>Saídas: <strong>{formatBrlFromCents(auditResult.currentSnapshot.totalOutCents)}</strong></div>
                <div>
                  Resultado:{' '}
                  <strong>
                    {auditResult.currentSnapshot.netResultCents >= 0 ? '+' : '-'}
                    {formatBrlFromCents(Math.abs(auditResult.currentSnapshot.netResultCents))}
                  </strong>
                </div>
              </div>
              <div className="m3-card" style={{ borderColor: 'var(--md-sys-color-success)', display: 'grid', gap: '0.35rem' }}>
                <span className="m3-label-small" style={{ color: 'var(--md-sys-color-success)' }}>
                  Cálculo Proposto ({auditResult.fixerModel})
                </span>
                <div>Entradas: <strong>{formatBrlFromCents(auditResult.proposal.proposedTotals.totalInCents)}</strong></div>
                <div>Saídas: <strong>{formatBrlFromCents(auditResult.proposal.proposedTotals.totalOutCents)}</strong></div>
                <div>
                  Resultado:{' '}
                  <strong>
                    {auditResult.proposal.proposedTotals.netResultCents >= 0 ? '+' : '-'}
                    {formatBrlFromCents(Math.abs(auditResult.proposal.proposedTotals.netResultCents))}
                  </strong>
                </div>
              </div>
            </div>

            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 650, fontSize: '0.9rem' }}>
                Ver lançamentos corrigidos propostos ({auditResult.proposal.proposedEntries.length} itens)
              </summary>
              <div className="table-wrapper" style={{ marginBlockStart: '0.6rem', maxBlockSize: '14rem', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th style={{ textAlign: 'end' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditResult.proposal.proposedEntries.map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>{TYPE_LABELS[item.type]}</td>
                        <td>{item.category}</td>
                        <td>{item.description}</td>
                        <td style={{ textAlign: 'end' }}>{formatBrlFromCents(item.amountCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                disabled={applyingFix}
                onClick={handleDownloadWithoutFix}
              >
                <span>Ignorar e baixar imagens atuais</span>
              </button>
              <button
                type="button"
                className="m3-btn m3-btn--blue"
                disabled={applyingFix}
                onClick={handleApproveAndApplyFix}
              >
                <Icon name="check_circle" size={18} />
                <span>
                  {applyingFix ? 'Aplicando & Regenerando...' : 'Permitir, Aplicar Correção e Baixar'}
                </span>
              </button>
            </div>
          </div>
        )}
      </M3Dialog>
    </div>
  );
}
