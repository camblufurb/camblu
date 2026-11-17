import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useAppData } from '../../context/AppDataContext';
import { computeClubStats, computeEventStats, computeShopStats } from '../../lib/adminStats';
import { formatBrlFromCents } from '../../lib/validators';

export function AdminDashboardPage() {
  const { products, orders, adminMembers, tickets, events, certificates, transparencyMeta, demands } = useAppData();

  const shopStats = useMemo(() => computeShopStats(products, orders), [products, orders]);
  const clubStats = useMemo(
    () => computeClubStats(adminMembers, orders, tickets),
    [adminMembers, orders, tickets],
  );

  const maxProductUnits = Math.max(1, ...shopStats.topProducts.map((p) => p.unitsSold));
  const maxClubTierCount = Math.max(1, ...clubStats.tierBreakdown.map((t) => t.membersCount));

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.75rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Dashboard — Estatísticas da Lojinha & Clube CAMBLU</h1>
        <p className="text-muted">
          Acompanhe receitas, pedidos, níveis de estoque, assinaturas ativas do Clube e acesse cada função operacional em sua página dedicada.
        </p>
      </header>

      {/* Bloco 1: Estatísticas da Lojinha */}
      <article className="m3-card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <h2>Estatísticas da Lojinha</h2>
            <p className="text-muted">Resumo comercial, entregas pendentes e saúde do estoque oficial.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link to="/back/lojinha/estoque" className="m3-btn m3-btn--outlined" style={{ minBlockSize: '40px' }}>
              <Icon name="inventory_2" size={18} />
              <span>Estoque</span>
            </Link>
            <Link to="/back/lojinha/produtos" className="m3-btn m3-btn--outlined" style={{ minBlockSize: '40px' }}>
              <Icon name="shopping_bag" size={18} />
              <span>Produtos</span>
            </Link>
            <Link to="/back/lojinha/entregas" className="m3-btn m3-btn--blue" style={{ minBlockSize: '40px' }}>
              <Icon name="local_shipping" size={18} />
              <span>Entregas ({shopStats.pendingDeliveries})</span>
            </Link>
          </div>
        </div>

        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Receita Líquida da Lojinha</span>
            <strong className="admin-kpi-value">{formatBrlFromCents(shopStats.netRevenueCents)}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Ticket médio: {formatBrlFromCents(shopStats.averageTicketCents)}
            </span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Pedidos & Saídas</span>
            <strong className="admin-kpi-value">{shopStats.totalOrders}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {shopStats.unitsSold} vendidos · {shopStats.donatedUnits} doações/brindes
            </span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Entregas Pendentes</span>
            <strong className="admin-kpi-value">{shopStats.pendingDeliveries}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {shopStats.deliveredOrders} já entregues
            </span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Unidades em Estoque</span>
            <strong className="admin-kpi-value">{shopStats.totalStockUnits}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {shopStats.lowStockVariants.length} variações com estoque ≤ 5
            </span>
          </div>
        </div>

        <div className="grid-two">
          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
            <h3>Produtos mais vendidos</h3>
            {shopStats.topProducts.length === 0 ? (
              <p className="text-muted">Ainda não há vendas registradas para ranqueamento.</p>
            ) : (
              <div className="admin-bar-list">
                {shopStats.topProducts.map((item) => (
                  <div key={item.productId} className="admin-bar-row">
                    <div className="admin-bar-head">
                      <strong>{item.productName}</strong>
                      <span>
                        {item.unitsSold} un · {formatBrlFromCents(item.revenueCents)}
                      </span>
                    </div>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{
                          inlineSize: `${Math.max(8, Math.round((item.unitsSold / maxProductUnits) * 100))}%`,
                          background: 'var(--camblu-action-blue)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
            <h3>Receita por forma de pagamento & estoque crítico</h3>
            {shopStats.paymentBreakdown.length === 0 ? (
              <p className="text-muted">Nenhuma transação registrada até o momento.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                {shopStats.paymentBreakdown.map((row) => (
                  <div
                    key={row.method}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      fontSize: '0.88rem',
                      paddingBlock: '0.25rem',
                      borderBlockEnd: '1px solid var(--md-sys-color-outline-variant)',
                    }}
                  >
                    <span>
                      {row.label} ({row.ordersCount})
                    </span>
                    <strong>{formatBrlFromCents(row.revenueCents)}</strong>
                  </div>
                ))}
              </div>
            )}

            {shopStats.lowStockVariants.length > 0 && (
              <div style={{ display: 'grid', gap: '0.4rem', paddingBlockStart: '0.35rem' }}>
                <strong style={{ fontSize: '0.86rem' }}>Alerta de reposição ({shopStats.lowStockVariants.length})</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {shopStats.lowStockVariants.slice(0, 6).map((v) => (
                    <span
                      key={`${v.productId}-${v.size}`}
                      className={`m3-badge ${v.stock === 0 ? 'm3-badge--error' : 'm3-badge--gold'}`}
                    >
                      {v.productName.split(' ')[0]} ({v.size}): {v.stock}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Bloco 2: Estatísticas do Clube CAMBLU */}
      <article className="m3-card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <h2>Estatísticas do Clube CAMBLU</h2>
            <p className="text-muted">Assinaturas ativas, distribuição por tier, receita mensal recorrente e economia gerada.</p>
          </div>
          <Link to="/back/clube" className="m3-btn m3-btn--blue" style={{ minBlockSize: '40px' }}>
            <Icon name="workspace_premium" size={18} />
            <span>Ver Todos os Sócios</span>
          </Link>
        </div>

        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Sócios Ativos no Clube</span>
            <strong className="admin-kpi-value">{clubStats.activeSubscribers}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              de {clubStats.totalRegisteredUsers} cadastros ({clubStats.conversionRatePercent}% adesão)
            </span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Receita Mensal Estimada (MRR)</span>
            <strong className="admin-kpi-value">{formatBrlFromCents(clubStats.mrrCents)}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Projeção anual: {formatBrlFromCents(clubStats.projectedAnnualCents)}
            </span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Descontos Gerados aos Sócios</span>
            <strong className="admin-kpi-value">{formatBrlFromCents(clubStats.totalDiscountsSavedCents)}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Somando Lojinha e Ingressos
            </span>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Calouros Cadastrados</span>
            <strong className="admin-kpi-value">{clubStats.calourosCount}</strong>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              elegíveis ao benefício da camiseta
            </span>
          </div>
        </div>

        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.9rem' }}>
          <h3>Distribuição de assinantes por plano</h3>
          <div className="admin-bar-list">
            {clubStats.tierBreakdown.map((tier) => (
              <div key={tier.tier} className="admin-bar-row">
                <div className="admin-bar-head">
                  <strong>
                    Clube {tier.name} · {tier.membersCount} sócio{tier.membersCount === 1 ? '' : 's'}
                  </strong>
                  <span>
                    {tier.monthlyCount} mensais · {tier.semesterCount} semestrais · MRR{' '}
                    {formatBrlFromCents(tier.mrrCents)}
                  </span>
                </div>
                <div className="admin-bar-track">
                  <div
                    className="admin-bar-fill"
                    style={{
                      inlineSize:
                        tier.membersCount > 0
                          ? `${Math.max(10, Math.round((tier.membersCount / maxClubTierCount) * 100))}%`
                          : '0%',
                      background: tier.themeColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Bloco 3: Atalhos Rápidos de Eventos e Financeiro */}
      <div className="grid-two">
        <article className="m3-card" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Eventos em Andamento ({events.length})</h2>
            <Link to="/back/eventos" className="m3-btn m3-btn--text">
              Ver todos
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {events.slice(0, 3).map((ev) => {
              const evStats = computeEventStats(ev, tickets, certificates);
              return (
                <div
                  key={ev.id}
                  className="m3-card m3-card--tonal"
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.94rem' }}>{ev.title}</strong>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      {evStats.soldCount}/{evStats.totalCapacity} ingressos · {evStats.checkedInQrCount} check-ins QR
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Link to={`/back/eventos/${ev.id}/qr`} className="m3-btn m3-btn--blue" style={{ minBlockSize: '36px', paddingInline: '0.8rem' }}>
                      <Icon name="qr_code_scanner" size={16} />
                      <span>QR</span>
                    </Link>
                    <Link to={`/back/eventos/${ev.id}`} className="m3-btn m3-btn--outlined" style={{ minBlockSize: '36px', paddingInline: '0.8rem' }}>
                      Gerenciar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="m3-card" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Saúde Financeira & Ouvidoria</h2>
            <Link to="/back/transparencia" className="m3-btn m3-btn--text">
              Abrir financeiro
            </Link>
          </div>
          <div className="admin-kpi-grid">
            <div className="m3-card m3-card--forest" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#dceddf', display: 'block' }}>Saldo Atual em Conta</span>
              <strong style={{ fontSize: '1.5rem', color: '#ffffff' }}>
                {formatBrlFromCents(transparencyMeta.currentBalanceCents)}
              </strong>
            </div>
            <div className="m3-card m3-card--tonal" style={{ padding: '1rem' }}>
              <span className="admin-kpi-label">Demandas Recebidas</span>
              <strong className="admin-kpi-value">{demands.length}</strong>
              <Link to="/back/demandas" style={{ fontSize: '0.82rem', color: 'var(--camblu-action-blue)' }}>
                Ver registro completo
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
