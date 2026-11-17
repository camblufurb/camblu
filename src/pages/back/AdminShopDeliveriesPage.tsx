import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { buildWhatsappUrl, formatBrlFromCents } from '../../lib/validators';

export function AdminShopDeliveriesPage() {
  const { orders, updateOrder } = useAppData();
  const { notify } = useToast();

  const [deliveryFilter, setDeliveryFilter] = useState<'todos' | 'pendentes' | 'entregues'>('pendentes');
  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (deliveryFilter === 'pendentes' && o.delivered) return false;
      if (deliveryFilter === 'entregues' && !o.delivered) return false;
      if (!clean) return true;
      const itemsText = o.items.map((i) => `${i.productName} ${i.size}`).join(' ');
      return `${o.buyerName} ${o.buyerEmail} ${o.buyerPhone} ${itemsText}`.toLowerCase().includes(clean);
    });
  }, [orders, deliveryFilter, search]);

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Entregas da Lojinha</h1>
        <p className="text-muted">
          Gerencie retiradas e entregas presenciais no campus com contato rápido via WhatsApp.
        </p>
      </header>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {([
              { id: 'pendentes', label: `Pendentes (${orders.filter((o) => !o.delivered).length})` },
              { id: 'entregues', label: `Entregues (${orders.filter((o) => o.delivered).length})` },
              { id: 'todos', label: `Todos (${orders.length})` },
            ] as const).map((f) => (
              <button
                key={f.id}
                type="button"
                className="m3-chip"
                aria-pressed={deliveryFilter === f.id}
                onClick={() => setDeliveryFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            className="m3-input"
            style={{ maxInlineSize: '18rem' }}
            placeholder="Buscar comprador ou produto..."
            aria-label="Buscar entrega"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-muted">Nenhum pedido encontrado com esse filtro.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="m3-card m3-card--tonal"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'grid', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBlockEnd: '0.15rem' }}>
                    <span className={`m3-badge ${order.delivered ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                      {order.delivered ? 'Entregue' : 'Aguardando Entrega'}
                    </span>
                    <span className="m3-badge">{order.paymentMethod}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <strong>{order.buyerName}</strong>
                  <span style={{ fontSize: '0.88rem' }}>
                    {order.items.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', ')} · Total:{' '}
                    <strong>{formatBrlFromCents(order.totalCents)}</strong>
                  </span>
                  {order.notes && (
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      Obs.: {order.notes}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                  {order.buyerPhone && (
                    <a
                      href={buildWhatsappUrl(
                        order.buyerPhone,
                        `Olá ${order.buyerName.split(' ')[0]}! Seu pedido da Lojinha CAMBLU está pronto para entrega.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="m3-btn m3-btn--blue"
                    >
                      <Icon name="chat" size={18} />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    className={`m3-btn ${order.delivered ? 'm3-btn--outlined' : 'm3-btn--filled'}`}
                    onClick={async () => {
                      const next = !order.delivered;
                      await updateOrder({
                        ...order,
                        delivered: next,
                        deliveredAt: next ? new Date().toISOString() : null,
                      });
                      notify(next ? 'Entrega confirmada!' : 'Pedido marcado como pendente.');
                    }}
                  >
                    <Icon name={order.delivered ? 'undo' : 'check_circle'} size={18} />
                    <span>{order.delivered ? 'Desmarcar' : 'Marcar Entregue'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
