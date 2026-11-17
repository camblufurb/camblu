import { useNavigate } from 'react-router-dom';
import { useShopCart } from '../context/ShopCartContext';
import { formatBrlFromCents } from '../lib/validators';
import { Icon } from './Icon';
import { M3Dialog } from './M3Dialog';

export function ShopCartDialog() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    paymentMethod,
    setPaymentMethod,
    submitting,
    subtotalCents,
    discountCents,
    totalCents,
    updateQuantity,
    removeFromCart,
    checkout,
  } = useShopCart();
  const navigate = useNavigate();

  return (
    <M3Dialog open={cartOpen} onClose={() => setCartOpen(false)} title="Minha Sacola — Lojinha CAMBLU">
      {cart.length === 0 ? (
        <p className="text-muted">Sua sacola está vazia.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {cart.map((item) => (
            <div
              key={`${item.product.id}-${item.size}-${item.colorName || ''}`}
              className="m3-card m3-card--tonal"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div>
                <strong>{item.product.name}</strong>
                <span className="m3-body-medium" style={{ display: 'block', fontSize: '0.84rem' }}>
                  Tamanho: {item.size}
                  {item.colorName ? ` · Cor: ${item.colorName}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  className="m3-icon-btn"
                  aria-label={`Diminuir quantidade de ${item.product.name}`}
                  style={{ minInlineSize: '34px', minBlockSize: '34px', padding: '0.25rem' }}
                  onClick={() => updateQuantity(item.product.id, item.size, item.colorName, -1)}
                >
                  <Icon name="remove" size={16} />
                </button>
                <strong style={{ minInlineSize: '1.5rem', textAlign: 'center' }}>{item.quantity}</strong>
                <button
                  type="button"
                  className="m3-icon-btn"
                  aria-label={`Aumentar quantidade de ${item.product.name}`}
                  style={{ minInlineSize: '34px', minBlockSize: '34px', padding: '0.25rem' }}
                  onClick={() => updateQuantity(item.product.id, item.size, item.colorName, 1)}
                >
                  <Icon name="add" size={16} />
                </button>

                <strong style={{ marginInlineStart: '0.35rem' }}>
                  {formatBrlFromCents(item.product.priceCents * item.quantity)}
                </strong>

                <button
                  type="button"
                  className="m3-icon-btn"
                  aria-label="Remover item"
                  onClick={() => removeFromCart(item.product.id, item.size, item.colorName)}
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>
            </div>
          ))}

          <div className="m3-card m3-card--gold" style={{ display: 'grid', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>{formatBrlFromCents(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--md-sys-color-success)' }}>
                <span>Desconto Clube CAMBLU (10%)</span>
                <strong>-{formatBrlFromCents(discountCents)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem' }}>
              <strong>Total</strong>
              <strong>{formatBrlFromCents(totalCents)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="m3-chip"
              aria-pressed={paymentMethod === 'stripe_pix'}
              onClick={() => setPaymentMethod('stripe_pix')}
            >
              <Icon name="qr_code" size={17} />
              <span>PIX</span>
            </button>
            <button
              type="button"
              className="m3-chip"
              aria-pressed={paymentMethod === 'stripe_card'}
              onClick={() => setPaymentMethod('stripe_card')}
            >
              <Icon name="credit_card" size={17} />
              <span>Cartão / Apple & Google Pay</span>
            </button>
          </div>

          <button
            type="button"
            className="m3-btn m3-btn--blue"
            disabled={submitting}
            onClick={() => checkout(() => navigate('/perfil'))}
          >
            <Icon name="lock" size={18} />
            <span>{submitting ? 'Abrindo pagamento...' : 'Finalizar Pedido'}</span>
          </button>
        </div>
      )}
    </M3Dialog>
  );
}
