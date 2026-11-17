import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FloatingCartPill } from '../components/FloatingCartPill';
import { Icon } from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useShopCart } from '../context/ShopCartContext';
import { calculateShopPrice } from '../lib/clubPricing';
import { CAMBLU_CLEAN_CREST_URL, getProductSlug } from '../lib/shopHelpers';
import { formatBrlFromCents } from '../lib/validators';

/**
 * Official CAMBLU merchandise shop featuring a Fivebucks-inspired outlet hero,
 * asymmetric Material You Expressive showcase, photographic divider band,
 * and full clickable catalog cards.
 */
export function ShopPage() {
  const { products } = useAppData();
  const { profile } = useAuth();
  const { totalItemsCount, setCartOpen } = useShopCart();

  const [category, setCategory] = useState('Todos');

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(activeProducts.map((p) => p.category)))],
    [activeProducts],
  );

  const visibleProducts = useMemo(
    () => activeProducts.filter((p) => category === 'Todos' || p.category === category),
    [activeProducts, category],
  );

  const heroMosaicProducts = activeProducts.slice(0, 4);

  return (
    <section
      className="page-section container m3-reveal"
      style={{ display: 'grid', gap: '2.25rem', paddingBlockEnd: totalItemsCount > 0 ? '5.5rem' : undefined }}
    >
      {/* Hero estilo Fivebucks Outlet: LOJINHA à esquerda + 4 produtos à direita */}
      <div className="shop-fivebucks-hero">
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <span className="m3-label-large" style={{ color: '#f1de97' }}>
            CAMBLU · Medicina FURB
          </span>
          <h1 style={{ color: '#ffffff', letterSpacing: '0.03em' }}>LOJINHA</h1>
          <p style={{ color: '#dceddf' }}>
            Moletons, camisetas, garrafas térmicas e tirantes oficiais da MEDFURB com pagamento via PIX/Cartão e retirada no campus.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            <button type="button" className="m3-btn m3-btn--gold" onClick={() => setCartOpen(true)}>
              <Icon name="shopping_cart" size={19} />
              <span>Sacola ({totalItemsCount})</span>
            </button>
            {!profile?.membershipActive && (
              <Link to="/clube" className="m3-btn m3-btn--outlined" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.35)' }}>
                <Icon name="workspace_premium" size={18} />
                <span>10% off no Clube</span>
              </Link>
            )}
          </div>
        </div>

        <div className="shop-fivebucks-mosaic" aria-label="Destaques da Lojinha">
          {heroMosaicProducts.map((prod) => (
            <Link key={prod.id} to={`/lojinha/${getProductSlug(prod)}`} className="shop-mosaic-tile">
              <div
                style={{
                  aspectRatio: '3 / 4',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                  overflow: 'hidden',
                  background: prod.images[0]
                    ? 'var(--md-sys-color-surface-container-lowest)'
                    : 'linear-gradient(155deg, #0b241a, #216148)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: prod.images[0] ? 0 : '0.75rem',
                }}
              >
                {prod.images[0] ? (
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={CAMBLU_CLEAN_CREST_URL}
                    alt={prod.name}
                    style={{ inlineSize: '3.5rem', blockSize: '3.5rem', objectFit: 'contain' }}
                  />
                )}
              </div>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prod.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Categorias */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }} role="group" aria-label="Filtrar produtos por categoria">
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

      {/* Vitrine Assimétrica Material You Expressive (cards inteiros clicáveis) */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <h2>Destaques da Coleção</h2>
        <div className="shop-asymmetric-grid">
          {visibleProducts.map((prod, idx) => {
            const productUrl = `/lojinha/${getProductSlug(prod)}`;
            const clubPreview = calculateShopPrice(
              prod.priceCents,
              profile?.membershipTier || 'none',
              Boolean(profile?.membershipActive),
            );
            const spanClass =
              idx % 4 === 0
                ? 'shop-asymmetric-item--wide'
                : idx % 4 === 1
                  ? 'shop-asymmetric-item--tall'
                  : 'shop-asymmetric-item--half';

            return (
              <Link
                key={`featured-${prod.id}`}
                to={productUrl}
                className={`m3-card m3-card--interactive shop-card-link ${spanClass}`}
                style={{
                  borderRadius: 'var(--md-sys-shape-corner-xl)',
                  background:
                    idx % 3 === 0
                      ? 'var(--md-sys-color-surface-container-lowest)'
                      : idx % 3 === 1
                        ? 'var(--md-sys-color-primary-container)'
                        : 'var(--camblu-action-blue-container)',
                }}
              >
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div
                    style={{
                      aspectRatio: idx % 4 === 0 ? '16 / 9' : '4 / 3',
                      borderRadius: 'var(--md-sys-shape-corner-lg)',
                      overflow: 'hidden',
                      background: prod.images[0]
                        ? 'var(--md-sys-color-surface-container-lowest)'
                        : 'linear-gradient(145deg, #0f3325, #174936)',
                      display: 'grid',
                      placeItems: 'center',
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
                  </div>
                  <span className="m3-label-small">{prod.category}</span>
                  <h3>{prod.name}</h3>
                  <p className="text-muted">{prod.description}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', paddingBlockStart: '0.5rem', borderBlockStart: '1px solid rgb(15 51 37 / 0.14)' }}>
                  <div>
                    {clubPreview.discountCents > 0 && (
                      <span style={{ fontSize: '0.8rem', textDecoration: 'line-through', opacity: 0.72, marginInlineEnd: '0.45rem' }}>
                        {formatBrlFromCents(prod.priceCents)}
                      </span>
                    )}
                    <strong style={{ fontSize: '1.2rem', color: 'var(--md-sys-color-primary)' }}>
                      {formatBrlFromCents(clubPreview.totalCents)}
                    </strong>
                  </div>
                  <Icon name="arrow_forward" size={18} className="m3-badge--blue" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Divisor editorial com espaço para fotos da Lojinha */}
      <article className="m3-card m3-card--gold" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Na Rotina da MEDFURB</h2>
          <p>
            Produtos desenvolvidos especialmente para o dia a dia entre salas de aula, Edifício Cristina, ambulatórios e plantões.
          </p>
        </div>
        <div className="grid-cards">
          {[
            { icon: 'checkroom', label: 'Foto Editorial: Moletom e Vestuário no Campus' },
            { icon: 'local_cafe', label: 'Foto Editorial: Garrafa Térmica e Acessórios' },
            { icon: 'badge', label: 'Foto Editorial: Tirante MEDFURB nos Estágios' },
          ].map((photo) => (
            <div
              key={photo.label}
              style={{
                aspectRatio: '16 / 10',
                borderRadius: 'var(--md-sys-shape-corner-lg)',
                background: 'rgb(255 255 255 / 0.65)',
                border: '2px dashed #6d5809',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                padding: '1rem',
                gap: '0.35rem',
                alignContent: 'center',
              }}
            >
              <Icon name={photo.icon} size={30} />
              <span style={{ fontSize: '0.82rem', fontWeight: 650 }}>{photo.label}</span>
            </div>
          ))}
        </div>
      </article>

      {/* Catálogo Convencional Completo (cards inteiros clicáveis, sem botão Ver produto) */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <h2>Catálogo Completo ({visibleProducts.length})</h2>
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
              <Link
                key={prod.id}
                to={productUrl}
                className="m3-card m3-card--interactive shop-card-link"
              >
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <div
                    style={{
                      aspectRatio: '4 / 3',
                      borderRadius: 'var(--md-sys-shape-corner-md)',
                      overflow: 'hidden',
                      background: prod.images[0]
                        ? 'var(--md-sys-color-surface-container)'
                        : 'linear-gradient(145deg, #0f3325, #174936)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#edd16e',
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
                  </div>

                  <span
                    className="m3-label-small"
                    style={{ color: totalStock > 0 ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-error)' }}
                  >
                    {prod.category} · {totalStock > 0 ? `${totalStock} disponíveis` : 'Esgotado'}
                  </span>

                  <h3>{prod.name}</h3>
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
                  <Icon name="arrow_forward" size={18} className="m3-badge--blue" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <FloatingCartPill />
    </section>
  );
}
