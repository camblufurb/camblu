import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FloatingCartPill } from '../components/FloatingCartPill';
import { Icon } from '../components/Icon';
import { ShopCartDialog } from '../components/ShopCartDialog';
import { SponsorsStrip } from '../components/SponsorLogos';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useShopCart } from '../context/ShopCartContext';
import { calculateShopPrice } from '../lib/clubPricing';
import { CAMBLU_CLEAN_CREST_URL, getProductSlug } from '../lib/shopHelpers';
import { formatBrlFromCents } from '../lib/validators';

export function ShopPage() {
  const { products } = useAppData();
  const { profile } = useAuth();
  const { totalItemsCount, setCartOpen } = useShopCart();

  const [category, setCategory] = useState('Todos');

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(products.filter((p) => p.active).map((p) => p.category)))],
    [products],
  );

  const visibleProducts = useMemo(
    () => products.filter((p) => p.active && (category === 'Todos' || p.category === category)),
    [products, category],
  );

  return (
    <section
      className="page-section container m3-reveal"
      style={{ display: 'grid', gap: '2rem', paddingBlockEnd: totalItemsCount > 0 ? '5.5rem' : undefined }}
    >
      <div
        className="m3-card m3-card--forest"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
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

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
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
          const productUrl = `/lojinha/${getProductSlug(prod)}`;
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
                <Link
                  to={productUrl}
                  style={{
                    aspectRatio: '4 / 3',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    overflow: 'hidden',
                    background:
                      prod.images[0]
                        ? 'var(--md-sys-color-surface-container)'
                        : 'linear-gradient(145deg, #0f3325, #174936)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#edd16e',
                    textDecoration: 'none',
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
                    <img
                      src={CAMBLU_CLEAN_CREST_URL}
                      alt={prod.name}
                      style={{ inlineSize: '5.5rem', blockSize: '5.5rem', objectFit: 'contain' }}
                    />
                  )}
                </Link>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span className="m3-badge">{prod.category}</span>
                  <span className={`m3-badge ${totalStock > 0 ? 'm3-badge--blue' : 'm3-badge--error'}`}>
                    {totalStock > 0 ? `${totalStock} em estoque` : 'Esgotado'}
                  </span>
                </div>

                <h2>
                  <Link to={productUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {prod.name}
                  </Link>
                </h2>
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
                <Link to={productUrl} className="m3-btn m3-btn--blue">
                  <Icon name="arrow_forward" size={18} />
                  <span>{totalStock === 0 ? 'Detalhes' : 'Ver produto'}</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <SponsorsStrip />
      <FloatingCartPill />
      <ShopCartDialog />
    </section>
  );
}
