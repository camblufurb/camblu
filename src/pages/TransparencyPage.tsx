import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { formatBrlFromCents } from '../lib/validators';

const MONTH_ORDER = [
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

export function TransparencyPage() {
  const { transparencyEntries, transparencyMeta } = useAppData();
  const [selectedSheet, setSelectedSheet] = useState('Todos');
  const [selectedType, setSelectedType] = useState<'todos' | 'receita' | 'despesa'>('todos');

  // 5.2: Saldo atual NÃO é exibido no front — apenas entradas, saídas, categorias e heatmap!
  const monthlyStats = useMemo(() => {
    return MONTH_ORDER.map((sheet) => {
      const items = transparencyEntries.filter((e) => e.sheet === sheet);
      const receitas = items.filter((e) => e.type === 'receita').reduce((s, e) => s + e.amountCents, 0);
      const despesas = items.filter((e) => e.type === 'despesa').reduce((s, e) => s + e.amountCents, 0);
      return { sheet, receitas, despesas, count: items.length };
    }).filter((m) => m.receitas > 0 || m.despesas > 0);
  }, [transparencyEntries]);

  const maxMonthlyVal = Math.max(1, ...monthlyStats.flatMap((m) => [m.receitas, m.despesas]));

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { receitas: number; despesas: number }>();
    for (const e of transparencyEntries) {
      const curr = map.get(e.category) || { receitas: 0, despesas: 0 };
      if (e.type === 'receita') curr.receitas += e.amountCents;
      if (e.type === 'despesa') curr.despesas += e.amountCents;
      map.set(e.category, curr);
    }
    return Array.from(map.entries())
      .map(([category, vals]) => ({ category, ...vals }))
      .sort((a, b) => b.despesas + b.receitas - (a.despesas + a.receitas));
  }, [transparencyEntries]);

  const maxExpenseCat = Math.max(1, ...categoryTotals.map((c) => c.despesas));

  const filteredEntries = useMemo(() => {
    return transparencyEntries
      .filter((e) => selectedSheet === 'Todos' || e.sheet === selectedSheet)
      .filter((e) => selectedType === 'todos' || e.type === selectedType)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transparencyEntries, selectedSheet, selectedType]);

  const totalReceitasPeriod = transparencyEntries
    .filter((e) => e.type === 'receita')
    .reduce((s, e) => s + e.amountCents, 0);
  const totalDespesasPeriod = transparencyEntries
    .filter((e) => e.type === 'despesa')
    .reduce((s, e) => s + e.amountCents, 0);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Transparência & Atas de Reunião</h1>
          <p style={{ color: '#dceddf' }}>
            Acompanhe mensalmente todas as receitas, investimentos em projetos, gastos por categoria e mapa de calor das
            movimentações do CAMBLU e da SECIMED.
          </p>
        </div>

        <a
          href={transparencyMeta.driveMinutesUrl}
          target="_blank"
          rel="noreferrer"
          className="m3-btn m3-btn--gold"
        >
          <Icon name="folder_shared" size={19} />
          <span>Atas de Reunião (Drive)</span>
        </a>
      </div>

      {/* KPIs sem saldo atual (conforme requisito 5.2) */}
      <div className="grid-two">
        <div className="m3-card m3-card--tonal">
          <span className="m3-label-small" style={{ color: 'var(--md-sys-color-success)' }}>
            Total de Entradas no Período
          </span>
          <strong style={{ display: 'block', fontSize: '2rem', marginBlockStart: '0.25rem' }}>
            {formatBrlFromCents(totalReceitasPeriod)}
          </strong>
        </div>
        <div className="m3-card m3-card--tonal">
          <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
            Total de Saídas / Investimentos em Ações
          </span>
          <strong style={{ display: 'block', fontSize: '2rem', marginBlockStart: '0.25rem' }}>
            {formatBrlFromCents(totalDespesasPeriod)}
          </strong>
        </div>
      </div>

      {/* Gráficos: Gasto e Receita por Mês + Categorias */}
      <div className="grid-two">
        <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <h2>Entradas x Saídas por Mês / SECIMED</h2>
            <p className="text-muted">Comparativo mensal do fluxo de caixa operacional.</p>
          </div>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {monthlyStats.map((m) => (
              <div key={m.sheet} style={{ display: 'grid', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <strong>{m.sheet}</strong>
                  <span>
                    +{formatBrlFromCents(m.receitas)} / -{formatBrlFromCents(m.despesas)}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '0.2rem' }}>
                  <div
                    style={{
                      blockSize: '8px',
                      inlineSize: `${Math.max(2, (m.receitas / maxMonthlyVal) * 100)}%`,
                      borderRadius: '9999px',
                      background: 'var(--md-sys-color-success)',
                    }}
                    title={`Receitas: ${formatBrlFromCents(m.receitas)}`}
                  />
                  <div
                    style={{
                      blockSize: '8px',
                      inlineSize: `${Math.max(2, (m.despesas / maxMonthlyVal) * 100)}%`,
                      borderRadius: '9999px',
                      background: 'var(--camblu-action-blue)',
                    }}
                    title={`Despesas: ${formatBrlFromCents(m.despesas)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="m3-card" style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div>
            <h2>Gastos por Categoria</h2>
            <p className="text-muted">Distribuição das despesas entre projetos e custeio.</p>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {categoryTotals.map((c) => (
              <div key={c.category} style={{ display: 'grid', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                  <strong>{c.category}</strong>
                  <span>{formatBrlFromCents(c.despesas)}</span>
                </div>
                <div
                  style={{
                    blockSize: '10px',
                    inlineSize: '100%',
                    borderRadius: '9999px',
                    background: 'var(--md-sys-color-surface-container-high)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      blockSize: '100%',
                      inlineSize: `${Math.min(100, (c.despesas / maxExpenseCat) * 100)}%`,
                      background: 'var(--md-sys-color-primary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Heatmap de Meses com mais Entradas e Saídas */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Heatmap de Intensidade Financeira por Mês</h2>
          <p className="text-muted">
            Intensidade visual indicando os meses com maior volume de entradas e saídas.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ inlineSize: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'start', padding: '0.5rem' }}>Período</th>
                <th scope="col" style={{ textAlign: 'center', padding: '0.5rem' }}>Entradas</th>
                <th scope="col" style={{ textAlign: 'center', padding: '0.5rem' }}>Saídas</th>
                <th scope="col" style={{ textAlign: 'center', padding: '0.5rem' }}>Lançamentos</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((m) => {
                const inAlpha = 0.12 + 0.78 * (m.receitas / maxMonthlyVal);
                const outAlpha = 0.12 + 0.78 * (m.despesas / maxMonthlyVal);
                return (
                  <tr key={m.sheet} style={{ borderBlockStart: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <th scope="row" style={{ textAlign: 'start', padding: '0.55rem' }}>{m.sheet}</th>
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '0.55rem',
                        background: `rgb(20 108 67 / ${inAlpha.toFixed(2)})`,
                        color: inAlpha > 0.48 ? '#ffffff' : 'inherit',
                        fontWeight: 650,
                      }}
                    >
                      {formatBrlFromCents(m.receitas)}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '0.55rem',
                        background: `rgb(59 130 247 / ${outAlpha.toFixed(2)})`,
                        color: outAlpha > 0.48 ? '#ffffff' : 'inherit',
                        fontWeight: 650,
                      }}
                    >
                      {formatBrlFromCents(m.despesas)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.55rem' }}>{m.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* Movimentações Detalhadas */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <h2>Movimentações Registradas</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <select
              className="m3-select"
              style={{ inlineSize: 'auto' }}
              aria-label="Filtrar por mês ou aba"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
            >
              <option value="Todos">Todos os períodos</option>
              {MONTH_ORDER.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="m3-select"
              style={{ inlineSize: 'auto' }}
              aria-label="Filtrar por tipo de movimentação"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
            >
              <option value="todos">Entradas e Saídas</option>
              <option value="receita">Apenas Entradas</option>
              <option value="despesa">Apenas Saídas</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ inlineSize: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBlockEnd: '2px solid var(--md-sys-color-outline-variant)' }}>
                <th scope="col" style={{ textAlign: 'start', padding: '0.55rem' }}>Data</th>
                <th scope="col" style={{ textAlign: 'start', padding: '0.55rem' }}>Aba</th>
                <th scope="col" style={{ textAlign: 'start', padding: '0.55rem' }}>Categoria</th>
                <th scope="col" style={{ textAlign: 'start', padding: '0.55rem' }}>Descrição</th>
                <th scope="col" style={{ textAlign: 'end', padding: '0.55rem' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e) => (
                <tr key={e.id} style={{ borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <td style={{ padding: '0.55rem', whiteSpace: 'nowrap' }}>{e.date}</td>
                  <td style={{ padding: '0.55rem' }}>{e.sheet}</td>
                  <td style={{ padding: '0.55rem' }}>
                    <span className="m3-badge">{e.category}</span>
                  </td>
                  <td style={{ padding: '0.55rem' }}>{e.description}</td>
                  <td
                    style={{
                      padding: '0.55rem',
                      textAlign: 'end',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      color: e.type === 'receita' ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-on-surface)',
                    }}
                  >
                    {e.type === 'receita' ? '+' : '-'}
                    {formatBrlFromCents(e.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <SponsorsStrip />
    </section>
  );
}
