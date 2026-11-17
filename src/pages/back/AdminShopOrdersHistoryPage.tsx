import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useAppData } from '../../context/AppDataContext';
import { computeShopStats, PAYMENT_METHOD_LABELS } from '../../lib/adminStats';
import { formatBrlFromCents } from '../../lib/validators';
import type { ShopOrder } from '../../types/domain';

export function AdminShopOrdersHistoryPage() {
  const { products, orders } = useAppData();
  const [methodFilter, setMethodFilter] = useState<'all' | ShopOrder['paymentMethod']>('all');
  const [search, setSearch] = useState('');
  const tableCaptionId = useId();

  const stats = useMemo(() => computeShopStats(products, orders), [products, orders]);

  const filteredOrders = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((order) => {
        if (methodFilter !== 'all' && order.paymentMethod !== methodFilter) return false;
        if (!clean) return true;
        const items = order.items.map((i) => `${i.productName} ${i.size}`).join(' ');
        return `${order.id} ${order.buyerName} ${order.buyerEmail} ${items}`.toLowerCase().includes(clean);
      });
  }, [orders, methodFilter, search]);

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <h1>Histórico de Compras da Lojinha</h1>
          <p className="text-muted">
            Registro cronológico completo de pedidos online, vendas presenciais e doações da Lojinha CAMBLU.
          </p>
        </div>
        <Link to="/back/lojinha/entregas" className="m3-btn m3-btn--outlined">
          <Icon name="local_shipping" size={18} />
          <span>Ir para Entregas</span>
        </Link>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Pedidos Registrados</span>
          <strong className="admin-kpi-value">{stats.totalOrders}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Receita Bruta</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(stats.grossRevenueCents)}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Descontos Clube</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(stats.discountsGrantedCents)}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Total Líquido Recebido</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(stats.netRevenueCents)}</strong>
        </div>
      </div>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {([
              { id: 'all', label: `Todos (${orders.length})` },
              { id: 'stripe_pix', label: 'PIX Online' },
              { id: 'stripe_card', label: 'Cartão' },
              { id: 'externo_pix', label: 'Presencial' },
              { id: 'doacao', label: 'Doações' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                className="m3-chip"
                aria-pressed={methodFilter === item.id}
                onClick={() => setMethodFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="m3-input"
            style={{ maxInlineSize: '18rem' }}
            placeholder="Buscar comprador ou produto..."
            aria-label="Buscar compra da lojinha"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-muted">Nenhuma compra encontrada para este filtro.</p>
        ) : (
          <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
            <table className="admin-table">
              <caption id={tableCaptionId} className="visually-hidden">
                Histórico completo de pedidos e vendas da Lojinha
              </caption>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Comprador</th>
                  <th>Itens</th>
                  <th>Pagamento</th>
                  <th>Desconto</th>
                  <th>Total</th>
                  <th>Entrega</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <th>
                      <span style={{ display: 'block' }}>{order.buyerName}</span>
                      <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                        {order.buyerEmail}
                      </span>
                    </th>
                    <td>
                      {order.items.map((item, idx) => (
                        <span key={`${order.id}-${item.productId}-${idx}`} style={{ display: 'block' }}>
                          {item.quantity}x {item.productName} ({item.size})
                        </span>
                      ))}
                    </td>
                    <td>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</td>
                    <td>{order.discountCents > 0 ? `-${formatBrlFromCents(order.discountCents)}` : '—'}</td>
                    <td><strong>{formatBrlFromCents(order.totalCents)}</strong></td>
                    <td>
                      <span className={`m3-badge ${order.delivered ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                        {order.delivered ? 'Entregue' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
