import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { PAYMENT_METHOD_LABELS } from '../lib/adminStats';
import { formatBrlFromCents } from '../lib/validators';

export function MyShopOrdersPage() {
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const { orders } = useAppData();

  const myOrders = useMemo(() => {
    if (!profile) return [];
    const email = profile.email.toLowerCase();
    return [...orders]
      .filter((o) => o.buyerUid === profile.uid || o.buyerEmail.toLowerCase() === email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, profile]);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center', display: 'grid', gap: '0.9rem' }}>
          <Icon name="receipt_long" size={44} className="m3-badge--blue" />
          <h1>Entre para ver suas Compras da Lojinha</h1>
          <p className="text-muted">
            Seus pedidos, descontos do Clube CAMBLU e status de entrega no campus ficam vinculados à sua conta Google.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            style={{ justifySelf: 'center' }}
            onClick={() => signInWithGoogle(isDemoMode ? 'student' : undefined)}
          >
            <Icon name="login" size={18} />
            <span>Entrar com Google</span>
          </button>
        </div>
      </section>
    );
  }

  const totalSpentCents = myOrders.reduce((acc, o) => acc + o.totalCents, 0);
  const totalSavedCents = myOrders.reduce((acc, o) => acc + o.discountCents, 0);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1>Minhas Compras na Lojinha</h1>
          <p className="text-muted">
            Acompanhe pedidos oficiais da MEDFURB realizados por <strong>{profile.name}</strong> e o andamento da retirada.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/meus-ingressos/historico" className="m3-btn m3-btn--outlined">
            <Icon name="confirmation_number" size={18} />
            <span>Histórico de Ingressos</span>
          </Link>
          <Link to="/lojinha" className="m3-btn m3-btn--blue">
            <Icon name="shopping_bag" size={18} />
            <span>Ir para a Lojinha</span>
          </Link>
        </div>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Pedidos Realizados</span>
          <strong className="admin-kpi-value">{myOrders.length}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Total Investido</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(totalSpentCents)}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Economia no Clube</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(totalSavedCents)}</strong>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
          <h2>Você ainda não realizou compras na Lojinha</h2>
          <p className="text-muted">Explore moletons, camisetas, garrafas e acessórios oficiais com retirada no campus.</p>
          <Link to="/lojinha" className="m3-btn m3-btn--filled">
            Explorar Lojinha
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {myOrders.map((order) => (
            <article key={order.id} className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                  <span className={`m3-badge ${order.delivered ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                    {order.delivered ? 'Entregue' : 'Aguardando Retirada'}
                  </span>
                  <span className="m3-badge">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                  <span className="text-muted" style={{ fontSize: '0.84rem' }}>
                    Pedido em {new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <strong style={{ fontSize: '1.15rem', color: 'var(--md-sys-color-primary)' }}>
                  {formatBrlFromCents(order.totalCents)}
                </strong>
              </div>

              <div style={{ display: 'grid', gap: '0.4rem' }}>
                {order.items.map((item, idx) => (
                  <div
                    key={`${order.id}-${item.productId}-${idx}`}
                    className="m3-card m3-card--tonal"
                    style={{
                      padding: '0.65rem 0.9rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <span>
                      <strong>{item.quantity}x</strong> {item.productName} · Tamanho <strong>{item.size}</strong>
                    </span>
                    <span>{formatBrlFromCents(item.unitPriceCents * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {(order.discountCents > 0 || order.notes || order.deliveredAt) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.84rem' }} className="text-muted">
                  {order.discountCents > 0 && (
                    <span>Desconto Clube aplicado: -{formatBrlFromCents(order.discountCents)}</span>
                  )}
                  {order.notes && <span>Observação: {order.notes}</span>}
                  {order.deliveredAt && (
                    <span>Entregue em {new Date(order.deliveredAt).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
