import { useId, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { formatBrlFromCents } from '../../lib/validators';

export const TRANSPARENCY_SHEETS = [
  'Dezembro',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'SECIMED',
];

export function AdminTransparencyFinancePage() {
  const {
    transparencyEntries,
    transparencyMeta,
    updateTransparencyMeta,
    syncTransparencySheet,
  } = useAppData();
  const { notify } = useToast();
  const tableCaptionId = useId();

  const [sheet, setSheet] = useState('Outubro');
  const [driveUrl, setDriveUrl] = useState(transparencyMeta.driveMinutesUrl);
  const [sheetUrl, setSheetUrl] = useState(transparencyMeta.spreadsheetUrl || '');
  const [syncingSheet, setSyncingSheet] = useState(false);

  const sheetEntries = useMemo(
    () => transparencyEntries.filter((e) => e.sheet === sheet).sort((a, b) => b.date.localeCompare(a.date)),
    [transparencyEntries, sheet],
  );

  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of transparencyEntries) {
      const cat = entry.category || 'Sem categoria';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [transparencyEntries]);

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Financeiro, Planilha & Atas</h1>
        <p className="text-muted">
          Consulte saldos restritos à Diretoria, sincronize a planilha Google oficial com categorização em segundo plano e atualize o Drive das atas.
        </p>
      </header>

      <div className="grid-cards">
        <div className="m3-card m3-card--forest">
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.45rem' }}>
            <Icon name="lock" size={14} />
            Visível apenas no /back
          </span>
          <span style={{ display: 'block', fontSize: '0.88rem', color: '#dceddf' }}>Saldo Atual em Conta</span>
          <strong style={{ fontSize: '2rem', color: '#ffffff' }}>
            {formatBrlFromCents(transparencyMeta.currentBalanceCents)}
          </strong>
        </div>

        <div className="m3-card m3-card--gold">
          <span style={{ display: 'block', fontSize: '0.88rem' }}>Saldo Projetado</span>
          <strong style={{ fontSize: '2rem' }}>{formatBrlFromCents(transparencyMeta.projectedBalanceCents)}</strong>
        </div>

        <div className="m3-card m3-card--tonal">
          <span style={{ display: 'block', fontSize: '0.88rem' }}>Investido (Renda Fixa)</span>
          <strong style={{ fontSize: '2rem' }}>{formatBrlFromCents(transparencyMeta.investedBalanceCents)}</strong>
        </div>
      </div>

      <div className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
          <div className="m3-field" style={{ flex: '1 1 20rem' }}>
            <label htmlFor="google-sheet-url">Planilha Google Oficial da Gestão Atual (leitura pública)</label>
            <input
              id="google-sheet-url"
              type="url"
              className="m3-input"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            disabled={syncingSheet}
            onClick={async () => {
              setSyncingSheet(true);
              try {
                const res = await syncTransparencySheet(sheetUrl.trim());
                if (res.usedAi) {
                  notify(
                    `Planilha salva, sincronizada (${res.count} lançamentos) e categorizada em ${res.categoriesCount} categorias!`,
                  );
                } else if (res.warning) {
                  notify(
                    `Planilha sincronizada (${res.count} itens), porém Gemini falhou: ${res.warning}`,
                    'info',
                  );
                } else {
                  notify(`Planilha sincronizada com sucesso (${res.count} lançamentos importados)!`);
                }
              } catch (err) {
                notify(err instanceof Error ? err.message : 'Erro ao importar planilha.', 'error');
              } finally {
                setSyncingSheet(false);
              }
            }}
          >
            <Icon name="sync" size={18} />
            <span>{syncingSheet ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          {sheetUrl && (
            <a href={sheetUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
              <Icon name="open_in_new" size={17} />
              <span>Abrir planilha</span>
            </a>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {transparencyMeta.lastSyncedAt && (
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Última sincronização: {new Date(transparencyMeta.lastSyncedAt).toLocaleString('pt-BR')}
            </span>
          )}
          {transparencyMeta.aiCategorizationModel && (
            <span className="m3-badge m3-badge--blue">
              <Icon name="auto_awesome" size={14} />
              {transparencyMeta.aiCategorizationModel} · {categoryDistribution.length} categorias ativas
            </span>
          )}
        </div>
        {categoryDistribution.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {categoryDistribution.map(([catName, qty]) => (
              <span key={catName} className="m3-badge">
                {catName} ({qty})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="m3-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
        <div className="m3-field" style={{ flex: '1 1 20rem' }}>
          <label htmlFor="drive-minutes-url">Link da pasta do Drive com Atas de Reunião</label>
          <input
            id="drive-minutes-url"
            type="url"
            className="m3-input"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="m3-btn m3-btn--filled"
          onClick={async () => {
            await updateTransparencyMeta({
              ...transparencyMeta,
              driveMinutesUrl: driveUrl.trim(),
              updatedAt: new Date().toISOString(),
            });
            notify('Link das Atas atualizado no portal!');
          }}
        >
          <Icon name="save" size={18} />
          <span>Salvar Link</span>
        </button>
      </div>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2>Lançamentos Sincronizados da Planilha</h2>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.86rem' }}>
              Dados lidos automaticamente da planilha oficial por aba mensal. Para ajustar categorias dos posts, use Recategorizar em Posts Mensais.
            </p>
          </div>
          <div className="m3-field" style={{ minInlineSize: '12rem', margin: 0 }}>
            <label htmlFor="tr-sheet">Mês / Aba (inclui SECIMED)</label>
            <select id="tr-sheet" className="m3-select" value={sheet} onChange={(e) => setSheet(e.target.value)}>
              {TRANSPARENCY_SHEETS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
          <table className="admin-table">
            <caption id={tableCaptionId} className="visually-hidden">
              Lançamentos financeiros sincronizados da aba {sheet}
            </caption>
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'end' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {sheetEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    Nenhum lançamento encontrado para {sheet}.
                  </td>
                </tr>
              ) : (
                sheetEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.category}</td>
                    <th>{entry.description}</th>
                    <td style={{ textAlign: 'end', fontWeight: 700 }}>
                      {entry.type === 'receita' ? '+' : '-'}
                      {formatBrlFromCents(entry.amountCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
