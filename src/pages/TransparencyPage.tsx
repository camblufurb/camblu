import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { aggregateDirectionCategories } from '../lib/transparencyPosterGenerator';
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
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // 5.2: Saldo atual NÃO é exibido no front — apenas entradas, saídas, categorias e heatmap!
  const monthlyStats = useMemo(() => {
    return MONTH_ORDER.map((sheet) => {
      const items = transparencyEntries.filter((e) => e.sheet === sheet);
      const receitas = items.filter((e) => e.type === 'receita').reduce((s, e) => s + e.amountCents, 0);
      const despesas = items.filter((e) => e.type === 'despesa').reduce((s, e) => s + e.amountCents, 0);
      return { sheet, receitas, despesas, count: items.length };
    }).filter((m) => m.receitas > 0 || m.despesas > 0);
  }, [transparencyEntries]);

  // Heatmap desconsidera a SECIMED para não distorcer a intensidade dos meses regulares
  const heatmapMonths = useMemo(
    () => monthlyStats.filter((m) => m.sheet.toLowerCase() !== 'secimed'),
    [monthlyStats],
  );

  const maxMonthlyVal = Math.max(1, ...monthlyStats.flatMap((m) => [m.receitas, m.despesas]));
  const maxHeatmapVal = Math.max(1, ...heatmapMonths.flatMap((m) => [m.receitas, m.despesas]));

  const incomeCategories = useMemo(
    () => aggregateDirectionCategories(transparencyEntries, 'receita'),
    [transparencyEntries],
  );

  const expenseCategories = useMemo(
    () => aggregateDirectionCategories(transparencyEntries, 'despesa'),
    [transparencyEntries],
  );

  const maxIncomeCat = Math.max(1, ...incomeCategories.map((c) => c.cents));
  const maxExpenseCat = Math.max(1, ...expenseCategories.map((c) => c.cents));

  const availableCategories = useMemo(
    () =>
      Array.from(new Set(transparencyEntries.map((e) => e.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [transparencyEntries],
  );

  const filteredEntries = useMemo(() => {
    return transparencyEntries
      .filter((e) => selectedSheet === 'Todos' || e.sheet === selectedSheet)
      .filter((e) => selectedType === 'todos' || e.type === selectedType)
      .filter((e) => selectedCategory === 'Todas' || e.category === selectedCategory)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transparencyEntries, selectedSheet, selectedType, selectedCategory]);

  const totalReceitasPeriod = transparencyEntries
    .filter((e) => e.type === 'receita')
    .reduce((s, e) => s + e.amountCents, 0);
  const totalDespesasPeriod = transparencyEntries
    .filter((e) => e.type === 'despesa')
    .reduce((s, e) => s + e.amountCents, 0);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest page-hero-card">
        <div className="page-hero-inner">
          <AnimatedClimateTitle tone="light" accessibleHeading="Transparência & Atas de Reunião">
            TRANSPARÊNCIA
          </AnimatedClimateTitle>
          <p className="page-hero-desc">
            Acompanhe mensalmente todas as receitas, investimentos em projetos, gastos por categoria e mapa de calor das
            movimentações do CAMBLU e da SECIMED.
          </p>

          <div className="page-hero-actions">
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
        </div>
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

      {/* Gráfico mensal: Entradas x Saídas por Mês / SECIMED */}
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

      {/* Gráficos por Categoria Unificada (Entradas e Saídas) */}
      <div className="grid-two">
        <article className="m3-card" style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div>
            <h2>Entradas por Categoria</h2>
            <p className="text-muted">
              Origens das receitas agrupadas em {incomeCategories.length} categorias consolidadas.
            </p>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {incomeCategories.map((c) => (
              <div key={`in-${c.label}`} style={{ display: 'grid', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.86rem' }}>
                  <strong>
                    {c.label} <span className="text-muted">({c.percent}%)</span>
                  </strong>
                  <span>{formatBrlFromCents(c.cents)}</span>
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
                      inlineSize: `${Math.max(3, Math.min(100, (c.cents / maxIncomeCat) * 100))}%`,
                      background: 'var(--md-sys-color-success)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="m3-card" style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div>
            <h2>Saídas por Categoria</h2>
            <p className="text-muted">
              Investimentos e custeio agrupados em {expenseCategories.length} categorias consolidadas.
            </p>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {expenseCategories.map((c) => (
              <div key={`out-${c.label}`} style={{ display: 'grid', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.86rem' }}>
                  <strong>
                    {c.label} <span className="text-muted">({c.percent}%)</span>
                  </strong>
                  <span>{formatBrlFromCents(c.cents)}</span>
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
                      inlineSize: `${Math.max(3, Math.min(100, (c.cents / maxExpenseCat) * 100))}%`,
                      background: 'var(--camblu-action-blue)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Heatmap de Meses com mais Entradas e Saídas (sem SECIMED) */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Heatmap de Intensidade Financeira por Mês</h2>
          <p className="text-muted">
            Intensidade visual indicando os meses regulares com maior volume de entradas e saídas (desconsiderando SECIMED).
          </p>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Período</th>
                <th scope="col" style={{ textAlign: 'center' }}>Entradas</th>
                <th scope="col" style={{ textAlign: 'center' }}>Saídas</th>
                <th scope="col" style={{ textAlign: 'center' }}>Lançamentos</th>
              </tr>
            </thead>
            <tbody>
              {heatmapMonths.map((m) => {
                const inAlpha = 0.12 + 0.78 * (m.receitas / maxHeatmapVal);
                const outAlpha = 0.12 + 0.78 * (m.despesas / maxHeatmapVal);
                return (
                  <tr key={m.sheet}>
                    <th scope="row">{m.sheet}</th>
                    <td
                      style={{
                        textAlign: 'center',
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
                        background: `rgb(59 130 247 / ${outAlpha.toFixed(2)})`,
                        color: outAlpha > 0.48 ? '#ffffff' : 'inherit',
                        fontWeight: 650,
                      }}
                    >
                      {formatBrlFromCents(m.despesas)}
                    </td>
                    <td style={{ textAlign: 'center' }}>{m.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* 10 Últimas Movimentações + Link para a Planilha Google Completa */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2>Movimentações Registradas (10 mais recentes)</h2>
            <p className="text-muted">
              Exibindo {Math.min(10, filteredEntries.length)} de {filteredEntries.length} movimentações neste filtro.
            </p>
          </div>
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
            <select
              className="m3-select"
              style={{ inlineSize: 'auto' }}
              aria-label="Filtrar por categoria"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Todas">Todas as categorias ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Aba</th>
                <th scope="col">Categoria</th>
                <th scope="col">Descrição</th>
                <th scope="col" style={{ textAlign: 'end' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.slice(0, 10).map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                  <td>{e.sheet}</td>
                  <td>
                    <span className="m3-badge">{e.category}</span>
                  </td>
                  <td>{e.description}</td>
                  <td
                    style={{
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

        {transparencyMeta.spreadsheetUrl && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <a
              href={transparencyMeta.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="m3-btn m3-btn--blue"
            >
              <Icon name="table_view" size={18} />
              <span>Ver mais na planilha completa (Google Sheets)</span>
            </a>
          </div>
        )}
      </article>
    </section>
  );
}
