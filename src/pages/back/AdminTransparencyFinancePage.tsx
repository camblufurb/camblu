import { useId, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { formatBrlFromCents } from '../../lib/validators';
import type { TransparencyType } from '../../types/domain';

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
    addTransparencyEntry,
    deleteTransparencyEntry,
    updateTransparencyMeta,
    syncTransparencySheet,
    categorizeTransparencyWithGemini,
  } = useAppData();
  const { notify } = useToast();
  const tableCaptionId = useId();

  const [sheet, setSheet] = useState('Outubro');
  const [date, setDate] = useState('2026-11-16');
  const [type, setType] = useState<TransparencyType>('despesa');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amountReais, setAmountReais] = useState('');
  const [driveUrl, setDriveUrl] = useState(transparencyMeta.driveMinutesUrl);
  const [sheetUrl, setSheetUrl] = useState(transparencyMeta.spreadsheetUrl || '');
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [categorizingAi, setCategorizingAi] = useState(false);

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

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(Number(amountReais.replace(',', '.')) * 100);
    if (!description.trim() || !category.trim() || !Number.isFinite(amountCents) || amountCents <= 0) {
      notify('Preencha data, categoria, descrição e valor válido.', 'error');
      return;
    }

    await addTransparencyEntry({
      id: `tr-${Date.now().toString(36)}`,
      sheet,
      year: Number(date.slice(0, 4)) || 2026,
      date,
      type,
      category: category.trim(),
      description: description.trim(),
      amountCents,
      createdAt: new Date().toISOString(),
    });

    setDescription('');
    setAmountReais('');
    notify('Movimentação lançada e categoria salva para próximas sugestões!');
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Financeiro, Planilha & Atas</h1>
        <p className="text-muted">
          Consulte saldos restritos à Diretoria, atualize o Drive das atas e lance movimentações por mês.
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
            disabled={syncingSheet || categorizingAi}
            onClick={async () => {
              setSyncingSheet(true);
              try {
                const res = await syncTransparencySheet(sheetUrl.trim());
                if (res.usedAi) {
                  notify(
                    `Planilha sincronizada (${res.count} lançamentos) e agrupada em ${res.categoriesCount} categorias via Gemini Flash-Lite!`,
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
            <span>{syncingSheet ? 'Importando & Categorizando...' : 'Salvar, Sincronizar & Categorizar'}</span>
          </button>
          <button
            type="button"
            className="m3-btn m3-btn--gold"
            disabled={categorizingAi || syncingSheet || transparencyEntries.length === 0}
            onClick={async () => {
              setCategorizingAi(true);
              try {
                const res = await categorizeTransparencyWithGemini();
                notify(
                  `${res.count} lançamentos categorizados em ${res.categories.length} categorias (${res.model})!`,
                );
              } catch (err) {
                notify(err instanceof Error ? err.message : 'Erro ao categorizar com Gemini.', 'error');
              } finally {
                setCategorizingAi(false);
              }
            }}
          >
            <Icon name="auto_awesome" size={18} />
            <span>{categorizingAi ? 'Categorizando com Gemini...' : 'Categorizar com Gemini AI'}</span>
          </button>
          {sheetUrl && (
            <a href={sheetUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
              <Icon name="open_in_new" size={17} />
              <span>Abrir Planilha</span>
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

      <form onSubmit={handleAddEntry} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Planilha Financeira (Lançar Movimentação)</h2>

        <div className="grid-cards">
          <div className="m3-field">
            <label htmlFor="tr-sheet">Mês / Aba (inclui SECIMED)</label>
            <select id="tr-sheet" className="m3-select" value={sheet} onChange={(e) => setSheet(e.target.value)}>
              {TRANSPARENCY_SHEETS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="m3-field">
            <label htmlFor="tr-date">Data</label>
            <input id="tr-date" type="date" className="m3-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="tr-type">Natureza</label>
            <select
              id="tr-type"
              className="m3-select"
              value={type}
              onChange={(e) => setType(e.target.value as TransparencyType)}
            >
              <option value="receita">Receita (+)</option>
              <option value="despesa">Despesa (-)</option>
              <option value="ativo">Ativo</option>
              <option value="passivo">Passivo</option>
            </select>
          </div>
        </div>

        <div className="grid-cards">
          <div className="m3-field">
            <label htmlFor="tr-cat">Categoria</label>
            <input
              id="tr-cat"
              list="camblu-transparency-categories"
              className="m3-input"
              required
              placeholder="Ex.: Lojinha & Produtos, Filantropia, SECIMED..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="camblu-transparency-categories">
              {transparencyMeta.savedCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="m3-field">
            <label htmlFor="tr-desc">Descrição</label>
            <input id="tr-desc" className="m3-input" required value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="tr-val">Valor (R$)</label>
            <input id="tr-val" className="m3-input" required placeholder="Ex.: 150.00" value={amountReais} onChange={(e) => setAmountReais(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name="add" size={18} />
          <span>Adicionar na Planilha ({sheet})</span>
        </button>

        <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
          <table className="admin-table">
            <caption id={tableCaptionId} className="visually-hidden">
              Lançamentos financeiros da aba {sheet}
            </caption>
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'end' }}>Valor</th>
                <th style={{ textAlign: 'end' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {sheetEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.category}</td>
                  <th>{entry.description}</th>
                  <td style={{ textAlign: 'end', fontWeight: 700 }}>
                    {entry.type === 'receita' ? '+' : '-'}
                    {formatBrlFromCents(entry.amountCents)}
                  </td>
                  <td style={{ textAlign: 'end' }}>
                    <button
                      type="button"
                      className="m3-icon-btn"
                      aria-label={`Remover ${entry.description}`}
                      onClick={() => deleteTransparencyEntry(entry.id)}
                    >
                      <Icon name="delete" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
}
