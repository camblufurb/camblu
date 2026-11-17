import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { M3Dialog } from '../components/M3Dialog';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { calculateShopPrice } from '../lib/clubPricing';
import { formatBrlFromCents } from '../lib/validators';
import { API_BASE_URL, getAuthHeaders } from '../lib/firebase';
import type { ShopOrder, ShopOrderItem, ShopProduct } from '../types/domain';

interface CartEntry {
  product: ShopProduct;
  size: string;
  quantity: number;
}

export function ShopPage() {
  const { products, addOrder } = useAppData();
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [category, setCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'stripe_pix' | 'stripe_card'>('stripe_pix');
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(products.filter((p) => p.active).map((p) => p.category)))],
    [products],
  );

  const visibleProducts = useMemo(
    () => products.filter((p) => p.active && (category === 'Todos' || p.category === category)),
    [products, category],
  );

  const subtotalCents = cart.reduce((acc, item) => acc + item.product.priceCents * item.quantity, 0);
  const { totalCents, discountCents } = calculateShopPrice(
    subtotalCents,
    profile?.membershipTier || 'none',
    Boolean(profile?.membershipActive),
  );

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const openProductModal = (prod: ShopProduct) => {
    const firstAvailable = prod.sizes.find((s) => s.stock > 0)?.size || prod.sizes[0]?.size || 'Único';
    setSelectedProduct(prod);
    setSelectedSize(firstAvailable);
  };

  const addToCart = (product: ShopProduct, size: string) => {
    const sizeInfo = product.sizes.find((s) => s.size === size);
    if (!sizeInfo || sizeInfo.stock <= 0) {
      notify('Tamanho sem estoque no momento.', 'error');
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id && i.size === size);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const nextQty = Math.min(sizeInfo.stock, copy[existingIdx].quantity + 1);
        copy[existingIdx] = { ...copy[existingIdx], quantity: nextQty };
        return copy;
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    setSelectedProduct(null);
    notify(`${product.name} (${size}) adicionado à sacola!`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!profile) {
      await signInWithGoogle(isDemoMode ? 'student' : undefined);
      return;
    }
    if (!profile.profileCompleted) {
      notify('Complete seu WhatsApp e CPF no Perfil antes de finalizar a compra.', 'info');
      setCartOpen(false);
      navigate('/perfil');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems: ShopOrderItem[] = cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        size: c.size,
        quantity: c.quantity,
        unitPriceCents: c.product.priceCents,
      }));

      if (!isDemoMode) {
        const res = await fetch(`${API_BASE_URL}/checkout/shop`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            items: orderItems,
            paymentMethod,
          }),
        });
        if (!res.ok) throw new Error('Falha ao criar sessão de checkout.');
        const data = (await res.json()) as { checkoutUrl?: string };
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      const newOrder: ShopOrder = {
        id: `ord-${Date.now().toString(36)}`,
        buyerUid: profile.uid,
        buyerName: profile.name,
        buyerEmail: profile.email,
        buyerPhone: profile.phone,
        items: orderItems,
        subtotalCents,
        discountCents,
        totalCents,
        paymentMethod,
        paymentStatus: 'paid',
        delivered: false,
        createdAt: new Date().toISOString(),
      };
      await addOrder(newOrder);
      setCart([]);
      setCartOpen(false);
      notify('Pedido confirmado! A equipe do CAMBLU combinará a entrega pelo WhatsApp.');
    } catch {
      notify('Erro ao processar pedido da Lojinha.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="shopping_bag" size={16} />
            Produtos Oficiais MEDFURB
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Lojinha do CAMBLU</h1>
          <p style={{ color: '#dceddf' }}>
            Pagamento via Stripe com PIX, Cartão, Google Pay e Apple Pay (taxas já inclusas no preço).{' '}
            {profile?.membershipActive
              ? 'Seu desconto de 10% do Clube CAMBLU está ativo automaticamente!'
              : 'Membros do Clube CAMBLU ganham 10% de desconto em toda a loja.'}
          </p>
        </div>

        <button type="button" className="m3-btn m3-btn--gold" onClick={() => setCartOpen(true)}>
          <Icon name="shopping_cart" size={19} />
          <span>Sacola ({totalItemsCount})</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }} role="group" aria-label="Filtrar produtos">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="m3-chip"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {!profile?.membershipActive && (
          <Link to="/clube" className="m3-btn m3-btn--text">
            <Icon name="workspace_premium" size={18} />
            <span>Ganhe 10% assinando o Clube CAMBLU</span>
          </Link>
        )}
      </div>

      <div className="grid-cards">
        {visibleProducts.map((prod) => {
          const totalStock = prod.sizes.reduce((acc, s) => acc + s.stock, 0);
          const clubPreview = calculateShopPrice(
            prod.priceCents,
            profile?.membershipTier || 'none',
            Boolean(profile?.membershipActive),
          );
          return (
            <article
              key={prod.id}
              className="m3-card m3-card--interactive"
              style={{ display: 'grid', gap: '0.85rem', alignContent: 'space-between' }}
            >
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                <div
                  style={{
                    aspectRatio: '4 / 3',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, var(--md-sys-color-surface-container), var(--md-sys-color-primary-container))',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  {prod.images[0] ? (
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <Icon name="checkroom" size={52} />
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span className="m3-badge">{prod.category}</span>
                  <span className={`m3-badge ${totalStock > 0 ? 'm3-badge--blue' : 'm3-badge--error'}`}>
                    {totalStock > 0 ? `${totalStock} em estoque` : 'Esgotado'}
                  </span>
                </div>

                <h2>{prod.name}</h2>
                <p className="text-muted">{prod.description}</p>
              </div>

              <div
                style={{
                  paddingBlockStart: '0.75rem',
                  borderBlockStart: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div>
                  {clubPreview.discountCents > 0 && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        textDecoration: 'line-through',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        display: 'block',
                      }}
                    >
                      {formatBrlFromCents(prod.priceCents)}
                    </span>
                  )}
                  <strong style={{ fontSize: '1.15rem', color: 'var(--md-sys-color-primary)' }}>
                    {formatBrlFromCents(clubPreview.totalCents)}
                  </strong>
                </div>
                <button
                  type="button"
                  className="m3-btn m3-btn--filled"
                  disabled={totalStock === 0}
                  onClick={() => openProductModal(prod)}
                >
                  <Icon name="add_shopping_cart" size={18} />
                  <span>Escolher</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de Seleção de Tamanho */}
      <M3Dialog
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Produto'}
      >
        {selectedProduct && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <p className="text-muted">{selectedProduct.description}</p>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <span className="m3-label-large">Selecione o tamanho</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedProduct.sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={s.stock <= 0}
                    className="m3-chip"
                    aria-pressed={selectedSize === s.size}
                    onClick={() => setSelectedSize(s.size)}
                  >
                    {s.size} ({s.stock})
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <strong style={{ fontSize: '1.2rem' }}>{formatBrlFromCents(selectedProduct.priceCents)}</strong>
              <button
                type="button"
                className="m3-btn m3-btn--filled"
                onClick={() => addToCart(selectedProduct, selectedSize)}
              >
                <Icon name="add_shopping_cart" size={18} />
                <span>Adicionar à Sacola</span>
              </button>
            </div>
          </div>
        )}
      </M3Dialog>

      {/* Modal da Sacola / Checkout Stripe */}
      <M3Dialog open={cartOpen} onClose={() => setCartOpen(false)} title="Minha Sacola — Lojinha CAMBLU">
        {cart.length === 0 ? (
          <p className="text-muted">Sua sacola está vazia.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="m3-card m3-card--tonal"
                style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}
              >
                <div>
                  <strong>{item.product.name}</strong>
                  <span className="m3-body-medium" style={{ display: 'block', fontSize: '0.84rem' }}>
                    Tamanho: {item.size} · Qtd: {item.quantity}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{formatBrlFromCents(item.product.priceCents * item.quantity)}</strong>
                  <button
                    type="button"
                    className="m3-icon-btn"
                    aria-label="Remover item"
                    onClick={() =>
                      setCart((prev) =>
                        prev.filter((x) => !(x.product.id === item.product.id && x.size === item.size)),
                      )
                    }
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
                <strong>Total (taxas inclusas)</strong>
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
                <span>PIX (Stripe)</span>
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
              className="m3-btn m3-btn--filled"
              disabled={submitting}
              onClick={handleCheckout}
            >
              <Icon name="lock" size={18} />
              <span>{submitting ? 'Abrindo pagamento...' : 'Finalizar Pedido'}</span>
            </button>
          </div>
        )}
      </M3Dialog>

      <SponsorsStrip />
    </section>
  );
}
