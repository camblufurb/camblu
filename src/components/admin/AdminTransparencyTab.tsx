import { useMemo, useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../ToastProvider';
import { Icon } from '../Icon';
import {
  generateTransparencyPostSlides,
  type TransparencyPosterSlide,
} from '../../lib/transparencyPosterGenerator';
import { formatBrlFromCents } from '../../lib/validators';
import type { TransparencyType } from '../../types/domain';

const SHEETS = [
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

export function AdminTransparencyTab() {
  const {
    transparencyEntries,
    transparencyMeta,
    addTransparencyEntry,
    deleteTransparencyEntry,
    updateTransparencyMeta,
  } = useAppData();
  const { notify } = useToast();

  const [sheet, setSheet] = useState('Outubro');
  const [date, setDate] = useState('2026-11-16');
  const [type, setType] = useState<TransparencyType>('despesa');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amountReais, setAmountReais] = useState('');

  const [driveUrl, setDriveUrl] = useState(transparencyMeta.driveMinutesUrl);
  const [posterMonth, setPosterMonth] = useState('Outubro');
  const [slides, setSlides] = useState<TransparencyPosterSlide[]>([]);

  const sheetEntries = useMemo(
    () => transparencyEntries.filter((e) => e.sheet === sheet).sort((a, b) => b.date.localeCompare(a.date)),
    [transparencyEntries, sheet],
  );

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

  const handleGenerate4Posts = () => {
    const targetEntries = transparencyEntries.filter((e) => e.sheet === posterMonth);
    const generated = generateTransparencyPostSlides(
      `${posterMonth} 2026`,
      targetEntries,
      transparencyMeta.investedBalanceCents,
    );
    setSlides(generated);
    notify(`4 imagens geradas para o post mensal de ${posterMonth}!`);
  };

  const downloadSlide = (slide: TransparencyPosterSlide) => {
    const a = document.createElement('a');
    a.href = slide.dataUrl;
    a.download = `transparencia-camblu-${posterMonth.toLowerCase()}-slide-${slide.index}.png`;
    a.click();
  };

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Saldo Exclusivo do /back (5.2) */}
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
          <strong style={{ fontSize: '2rem' }}>
            {formatBrlFromCents(transparencyMeta.projectedBalanceCents)}
          </strong>
        </div>

        <div className="m3-card m3-card--tonal">
          <span style={{ display: 'block', fontSize: '0.88rem' }}>Investido (Renda Fixa)</span>
          <strong style={{ fontSize: '2rem' }}>
            {formatBrlFromCents(transparencyMeta.investedBalanceCents)}
          </strong>
        </div>
      </div>

      {/* Link Drive de Atas de Reunião (5.5) */}
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

      {/* Planilha de Lançamento (5.1) */}
      <form onSubmit={handleAddEntry} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2 className="m3-title-large">Planilha Financeira (Lançar Movimentação)</h2>

        <div className="grid-cards">
          <div className="m3-field">
            <label htmlFor="tr-sheet">Mês / Aba (inclui SECIMED)</label>
            <select id="tr-sheet" className="m3-select" value={sheet} onChange={(e) => setSheet(e.target.value)}>
              {SHEETS.map((s) => (
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
            <label htmlFor="tr-cat">Categoria (digitável, salva sugestões automáticas)</label>
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
            <input
              id="tr-desc"
              className="m3-input"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="m3-field">
            <label htmlFor="tr-val">Valor (R$)</label>
            <input
              id="tr-val"
              className="m3-input"
              required
              placeholder="Ex.: 150.00"
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name="add" size={18} />
          <span>Adicionar na Planilha ({sheet})</span>
        </button>

        <div style={{ overflowX: 'auto', marginBlockStart: '0.5rem' }}>
          <table style={{ inlineSize: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBlockEnd: '2px solid var(--md-sys-color-outline-variant)' }}>
                <th scope="col" style={{ textAlign: 'start', padding: '0.5rem' }}>Data</th>
                <th scope="col" style={{ textAlign: 'start', padding: '0.5rem' }}>Categoria</th>
                <th scope="col" style={{ textAlign: 'start', padding: '0.5rem' }}>Descrição</th>
                <th scope="col" style={{ textAlign: 'end', padding: '0.5rem' }}>Valor</th>
                <th scope="col" style={{ textAlign: 'end', padding: '0.5rem' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {sheetEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <td style={{ padding: '0.5rem' }}>{entry.date}</td>
                  <td style={{ padding: '0.5rem' }}>{entry.category}</td>
                  <td style={{ padding: '0.5rem' }}>{entry.description}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'end', fontWeight: 700 }}>
                    {entry.type === 'receita' ? '+' : '-'}
                    {formatBrlFromCents(entry.amountCents)}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'end' }}>
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

      {/* Exportador 4 Imagens do Post Mensal (5.4) */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2 className="m3-title-large">Exportador das 4 Imagens do Post Mensal (Instagram 1080×1350)</h2>
            <p className="m3-body-medium">
              Gera automaticamente o carrossel de 4 cards da transparência todo dia 1º de cada mês.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="m3-select"
              style={{ inlineSize: 'auto' }}
              value={posterMonth}
              onChange={(e) => setPosterMonth(e.target.value)}
              aria-label="Mês do post de transparência"
            >
              {SHEETS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" className="m3-btn m3-btn--gold" onClick={handleGenerate4Posts}>
              <Icon name="auto_awesome" size={18} />
              <span>Gerar 4 Imagens</span>
            </button>
          </div>
        </div>

        {slides.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="m3-btn m3-btn--blue"
                onClick={() => slides.forEach((s) => downloadSlide(s))}
              >
                <Icon name="download" size={18} />
                <span>Baixar Todas as 4 Imagens (PNG)</span>
              </button>
            </div>
            <div className="grid-cards">
              {slides.map((s) => (
                <div key={s.index} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.6rem', padding: '0.85rem' }}>
                  <img
                    src={s.dataUrl}
                    alt={`Slide ${s.index}: ${s.title}`}
                    style={{ borderRadius: 'var(--md-sys-shape-corner-md)', inlineSize: '100%' }}
                  />
                  <button type="button" className="m3-btn m3-btn--outlined" onClick={() => downloadSlide(s)}>
                    <Icon name="download" size={17} />
                    <span>Baixar Slide {s.index} ({s.title})</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </article>
    </div>
  );
}
