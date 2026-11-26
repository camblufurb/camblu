import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FloatingCartPill } from '../components/FloatingCartPill';
import { Icon } from '../components/Icon';
import { M3Dialog } from '../components/M3Dialog';
import { useToast } from '../components/ToastProvider';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useShopCart } from '../context/ShopCartContext';
import { PRODUCTS_SEED } from '../data/catalogSeeds';
import { calculateShopPrice } from '../lib/clubPricing';
import { computeInfiniteMultiBrowseMetrics } from '../lib/m3MultiBrowseCarousel';
import {
  buildProductGallery,
  CAMBLU_CLEAN_CREST_URL,
  findProductBySlug,
  getProductSlug,
  type GallerySlide,
} from '../lib/shopHelpers';
import { formatBrlFromCents } from '../lib/validators';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products } = useAppData();
  const { profile } = useAuth();
  const { addToCart, totalItemsCount, setCartOpen } = useShopCart();
  const { notify } = useToast();

  const rawProduct = findProductBySlug(products, slug);
  const product = useMemo(() => {
    if (!rawProduct) return undefined;
    const seedMatch = PRODUCTS_SEED.find((s) => s.id === rawProduct.id);
    return seedMatch
      ? {
          ...seedMatch,
          ...rawProduct,
          colors: rawProduct.colors?.length ? rawProduct.colors : seedMatch.colors,
          details: rawProduct.details?.length ? rawProduct.details : seedMatch.details,
          careNotes: rawProduct.careNotes || seedMatch.careNotes,
          slug: rawProduct.slug || seedMatch.slug,
        }
      : rawProduct;
  }, [rawProduct]);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColorName, setSelectedColorName] = useState('');
  const [lightboxSlide, setLightboxSlide] = useState<GallerySlide | null>(null);
  const [isMobileCarousel, setIsMobileCarousel] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 57.99rem)').matches : false,
  );
  const [scrollerWidth, setScrollerWidth] = useState(360);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const initializedProductLoopRef = useRef<string | null>(null);

  const gallery = useMemo(() => (product ? buildProductGallery(product) : []), [product]);
  const isMobileLooped = isMobileCarousel && gallery.length >= 2;
  const displayTrackItems = useMemo(() => {
    if (!isMobileLooped) {
      return gallery.map((slide, idx) => ({ key: slide.id, slide, realIdx: idx }));
    }
    return [0, 1, 2].flatMap((cycle) =>
      gallery.map((slide, idx) => ({
        key: `${slide.id}-loop-${cycle}`,
        slide,
        realIdx: idx,
      })),
    );
  }, [gallery, isMobileLooped]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobileQuery = window.matchMedia('(max-width: 57.99rem)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncQueries = () => {
      setIsMobileCarousel(mobileQuery.matches);
      setPrefersReducedMotion(motionQuery.matches);
    };
    syncQueries();
    mobileQuery.addEventListener('change', syncQueries);
    motionQuery.addEventListener('change', syncQueries);
    return () => {
      mobileQuery.removeEventListener('change', syncQueries);
      motionQuery.removeEventListener('change', syncQueries);
    };
  }, []);

  const snapStepPx = Math.max(110, Math.round(scrollerWidth * 0.45));

  const syncMobileScrollMetrics = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !isMobileCarousel) return;
    const width = el.clientWidth || 360;
    const step = Math.max(110, Math.round(width * 0.45));
    setScrollerWidth(width);

    const baseCount = gallery.length;
    if (baseCount < 2) {
      setScrollProgress(0);
      return;
    }

    const rawP = el.scrollLeft / step;
    if (rawP < baseCount * 0.5) {
      const shifted = el.scrollLeft + baseCount * step;
      el.style.scrollSnapType = 'none';
      el.scrollLeft = shifted;
      window.requestAnimationFrame(() => {
        el.style.scrollSnapType = '';
      });
      setScrollProgress(shifted / step);
      return;
    }
    if (rawP >= baseCount * 2.5) {
      const shifted = el.scrollLeft - baseCount * step;
      el.style.scrollSnapType = 'none';
      el.scrollLeft = shifted;
      window.requestAnimationFrame(() => {
        el.style.scrollSnapType = '';
      });
      setScrollProgress(shifted / step);
      return;
    }

    setScrollProgress(Math.max(0, Math.min(baseCount * 3 - 1, rawP)));
  }, [gallery.length, isMobileCarousel]);

  useEffect(() => {
    if (!isMobileCarousel) return;
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth || 360;
    const step = Math.max(110, Math.round(width * 0.45));
    if (gallery.length >= 2) {
      const initKey = `${product?.id || ''}:${gallery.length}`;
      if (initializedProductLoopRef.current !== initKey) {
        initializedProductLoopRef.current = initKey;
        el.style.scrollSnapType = 'none';
        el.scrollLeft = gallery.length * step;
        window.requestAnimationFrame(() => {
          el.style.scrollSnapType = '';
        });
      }
    }
    syncMobileScrollMetrics();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => syncMobileScrollMetrics());
    observer.observe(el);
    return () => observer.disconnect();
  }, [gallery.length, isMobileCarousel, product?.id, syncMobileScrollMetrics]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const mobileMetrics = useMemo(() => {
    if (!isMobileCarousel || displayTrackItems.length === 0) return null;
    return computeInfiniteMultiBrowseMetrics(displayTrackItems.length, scrollProgress, scrollerWidth, 8);
  }, [displayTrackItems.length, isMobileCarousel, scrollProgress, scrollerWidth]);

  useEffect(() => {
    if (!product) return;
    const firstAvailableSize = product.sizes.find((s) => s.stock > 0)?.size || product.sizes[0]?.size || 'Único';
    setSelectedSize(firstAvailableSize);
    setSelectedColorName(product.colors?.[0]?.name || '');
    setLightboxSlide(null);
    initializedProductLoopRef.current = null;
    if (scrollerRef.current && isMobileCarousel && gallery.length >= 2) {
      const width = scrollerRef.current.clientWidth || 360;
      const step = Math.max(110, Math.round(width * 0.45));
      scrollerRef.current.style.scrollSnapType = 'none';
      scrollerRef.current.scrollLeft = gallery.length * step;
      window.requestAnimationFrame(() => {
        if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = '';
      });
      setScrollProgress(gallery.length);
    } else {
      setScrollProgress(0);
    }
  }, [gallery.length, isMobileCarousel, product]);

  if (!product) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '38rem', marginInline: 'auto', display: 'grid', gap: '1rem' }}>
          <h1>Produto não encontrado</h1>
          <p className="text-muted">
            O item solicitado não está mais disponível ou teve seu endereço alterado.
          </p>
          <Link to="/lojinha" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
            <Icon name="arrow_back" size={18} />
            <span>Voltar para a Lojinha</span>
          </Link>
        </div>
      </section>
    );
  }

  const totalStock = product.sizes.reduce((acc, s) => acc + s.stock, 0);
  const activeSizeStock = product.sizes.find((s) => s.size === selectedSize)?.stock ?? 0;

  const clubPricing = calculateShopPrice(
    product.priceCents,
    profile?.membershipTier || 'none',
    Boolean(profile?.membershipActive),
  );

  const relatedProducts = products
    .filter((p) => p.active && p.id !== product.id)
    .slice(0, 3);

  const handleShareLink = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: shareUrl });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('Link do produto copiado!');
    } catch {
      notify('Compartilhe a URL desta página.', 'info');
    }
  };

  const renderPriceBlock = () => (
    <div style={{ textAlign: 'end' }}>
      {clubPricing.discountCents > 0 && (
        <span
          style={{
            display: 'block',
            fontSize: '0.82rem',
            textDecoration: 'line-through',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {formatBrlFromCents(product.priceCents)}
        </span>
      )}
      <span className="product-price-readout">{formatBrlFromCents(clubPricing.totalCents)}</span>
    </div>
  );

  return (
    <section
      className="page-section container m3-reveal"
      style={{ display: 'grid', gap: '2rem', paddingBlockEnd: totalItemsCount > 0 ? '5.5rem' : undefined }}
    >
      {/* Cabeçalho compacto Mobile (<58rem) igual à referência Material 3 Expressive */}
      <div className="product-mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="m3-icon-btn"
            aria-label="Voltar para a Lojinha"
            onClick={() => navigate('/lojinha')}
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <span className="m3-label-large text-muted">{product.category}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {renderPriceBlock()}
          <button
            type="button"
            className="m3-icon-btn"
            aria-label={`Abrir sacola (${totalItemsCount} itens)`}
            onClick={() => setCartOpen(true)}
          >
            <Icon name="shopping_cart" size={20} />
          </button>
        </div>
      </div>

      {/* Trilha Mobile */}
      <nav className="product-breadcrumbs product-mobile-topbar" aria-label="Navegação da Lojinha">
        <Link to="/lojinha">Lojinha</Link>
        <span aria-hidden="true">›</span>
        <span>{product.category}</span>
        <span aria-hidden="true">›</span>
        <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 650 }}>{product.name}</span>
      </nav>

      {/* Grade principal 2 colunas no Desktop (Galeria à esquerda / Compra & Acordeões à direita) */}
      <div className="product-page-grid">
        {/* Coluna Esquerda: M3 Multi-Browse Carousel no mobile (<58rem) e pilha editorial no desktop */}
        <div className="product-gallery-mobile-wrap">
          <div
            ref={scrollerRef}
            className="product-gallery-scroller"
            onScroll={() => {
              if (!isMobileCarousel) return;
              if (scrollRafRef.current !== null) return;
              scrollRafRef.current = window.requestAnimationFrame(() => {
                scrollRafRef.current = null;
                syncMobileScrollMetrics();
              });
            }}
          >
            <div
              className="product-gallery-stage"
              style={
                isMobileLooped
                  ? { inlineSize: `${scrollerWidth + (displayTrackItems.length - 1) * snapStepPx}px` }
                  : undefined
              }
            >
              <div
                className="product-gallery"
                aria-label={`Galeria de imagens de ${product.name}`}
                style={isMobileCarousel ? { inlineSize: `${scrollerWidth}px` } : undefined}
              >
                {displayTrackItems.map((item, idx) => {
                  const metric = mobileMetrics?.[idx];
                  const frameStyle: CSSProperties | undefined = metric
                    ? {
                        flex: `0 0 ${metric.widthPx}px`,
                        marginInlineEnd: `${metric.marginEndPx}px`,
                        opacity: metric.opacity,
                        transform: prefersReducedMotion ? 'none' : `scale(${metric.scale})`,
                        pointerEvents: metric.isHidden ? 'none' : 'auto',
                        borderWidth: metric.isHidden ? '0px' : undefined,
                      }
                    : undefined;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className="product-gallery__frame"
                      data-size-role={metric?.sizeRole}
                      tabIndex={metric?.isHidden ? -1 : 0}
                      aria-hidden={metric?.isHidden || undefined}
                      style={frameStyle}
                      aria-label={`Ampliar foto ${item.realIdx + 1} de ${product.name}`}
                      onClick={() => setLightboxSlide(item.slide)}
                    >
                      {item.slide.imageUrl ? (
                        <img
                          src={item.slide.imageUrl}
                          alt={`${product.name} — foto ${item.realIdx + 1}`}
                          style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="product-gallery__editorial" style={{ background: item.slide.gradient }}>
                          <div style={{ display: 'grid', placeItems: 'center', gap: '0.75rem' }}>
                            {item.slide.showCrest ? (
                              <img src={CAMBLU_CLEAN_CREST_URL} alt="" className="product-gallery__crest" />
                            ) : (
                              <span style={{ color: item.slide.accentHex || '#0f3325', display: 'inline-flex' }}>
                                <Icon name={item.slide.iconName || 'checkroom'} size={64} />
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: item.slide.accentHex || '#ffffff',
                                maxInlineSize: '26ch',
                              }}
                            >
                              {item.slide.caption}
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isMobileLooped && (
                <div className="product-gallery-snap-rail" aria-hidden="true">
                  {displayTrackItems.map((item, idx) => (
                    <span
                      key={`snap-${item.key}`}
                      className="product-gallery-snap-stop"
                      style={{
                        inlineSize:
                          idx === displayTrackItems.length - 1 ? `${scrollerWidth}px` : `${snapStepPx}px`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="product-gallery-mobile-dots" role="tablist" aria-label="Selecionar imagem da galeria">
              {gallery.map((slide, idx) => {
                const currentIdx = ((Math.round(scrollProgress) % gallery.length) + gallery.length) % gallery.length;
                const activeDot = currentIdx === idx;
                return (
                  <button
                    key={`dot-${slide.id}`}
                    type="button"
                    className="m3-carousel-marker"
                    aria-label={`Ir para imagem ${idx + 1} de ${gallery.length}`}
                    aria-current={activeDot ? 'true' : undefined}
                    onClick={() => {
                      const base = gallery.length;
                      let delta = idx - currentIdx;
                      if (delta > base / 2) delta -= base;
                      if (delta < -base / 2) delta += base;
                      const targetStep = Math.round(scrollProgress) + delta;
                      scrollerRef.current?.scrollTo({
                        left: targetStep * snapStepPx,
                        behavior: prefersReducedMotion ? 'auto' : 'smooth',
                      });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita: Breadcrumb + Preço, Título h1, Descrição p, Tamanho, Cor, CTA + Acordeões */}
        <div className="product-info-col">
          <div className="product-desktop-header">
            <nav className="product-breadcrumbs" aria-label="Navegação da Lojinha">
              <Link to="/lojinha">Lojinha CAMBLU</Link>
              <span aria-hidden="true">›</span>
              <Link to={`/lojinha`}>{product.category}</Link>
              <span aria-hidden="true">›</span>
              <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 650 }}>Detalhes</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {clubPricing.discountCents > 0 && (
                <span className="m3-label-small" style={{ color: 'var(--md-sys-color-success)' }}>
                  Clube -10%
                </span>
              )}
              {renderPriceBlock()}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.55rem' }}>
            <h1>{product.name}</h1>
            <p className="text-muted">{product.description}</p>
          </div>

          {/* Seletor de Tamanho (Chips estilizados conforme guideline) */}
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <div className="product-option-row">
              <span className="product-option-label">Tamanho</span>
              <div className="product-size-chips" role="group" aria-label="Selecionar tamanho">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={s.stock <= 0}
                    className="product-size-chip"
                    aria-pressed={selectedSize === s.size}
                    onClick={() => setSelectedSize(s.size)}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
            <span className="m3-field-hint" style={{ paddingInlineStart: '0.15rem' }}>
              {totalStock === 0
                ? 'Produto temporariamente esgotado.'
                : activeSizeStock > 0
                  ? `${activeSizeStock} unidades disponíveis no tamanho ${selectedSize}`
                  : `Tamanho ${selectedSize} esgotado — selecione outro tamanho`}
            </span>
          </div>

          {/* Seletor de Cor / Edição (Squircle swatches como no guideline) */}
          {product.colors && product.colors.length > 0 && (
            <div className="product-option-row">
              <span className="product-option-label">Cor</span>
              <div className="product-color-swatches" role="group" aria-label="Selecionar cor ou acabamento">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className="product-color-swatch"
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                    title={color.name}
                    aria-pressed={selectedColorName === color.name}
                    onClick={() => setSelectedColorName(color.name)}
                  />
                ))}
                {selectedColorName && (
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {selectedColorName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* CTA Principal (#3b82f7) + Compartilhar */}
          <div className="product-cta-row">
            <button
              type="button"
              className="m3-btn m3-btn--blue btn-primary-25d product-cta-main"
              disabled={totalStock === 0 || activeSizeStock <= 0}
              onClick={() => addToCart(product, selectedSize, selectedColorName || undefined)}
            >
              <Icon name="shopping_bag" size={20} />
              <span>{totalStock === 0 ? 'Esgotado' : 'Adicionar à sacola'}</span>
            </button>

            <button
              type="button"
              className="product-cta-secondary"
              aria-label="Copiar link do produto"
              onClick={handleShareLink}
            >
              <Icon name="share" size={20} />
            </button>
          </div>

          {!profile?.membershipActive && (
            <div
              className="m3-card m3-card--gold"
              style={{
                padding: '0.85rem 1.05rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 650 }}>
                Assinantes do Clube CAMBLU pagam{' '}
                <strong>{formatBrlFromCents(Math.round(product.priceCents * 0.9))}</strong> (10% OFF).
              </span>
              <Link to="/clube" className="m3-btn m3-btn--filled" style={{ minBlockSize: '36px', paddingBlock: '0.35rem' }}>
                Conhecer o Clube
              </Link>
            </div>
          )}

          {/* Acordeões M3 Expressive (Mais detalhes + Retirada & Entregas) */}
          <div className="product-accordion" aria-label="Informações complementares do produto">
            <details className="product-accordion-item" open>
              <summary>
                <span>Mais detalhes</span>
                <Icon name="keyboard_arrow_down" size={22} className="product-accordion-chevron" />
              </summary>
              <div className="product-accordion-body">
                {product.details && product.details.length > 0 && (
                  <ul className="product-accordion-list">
                    {product.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
                {product.careNotes && <p className="text-muted">{product.careNotes}</p>}
              </div>
            </details>

            <details className="product-accordion-item">
              <summary>
                <span>Retirada na FURB, Trocas & Pagamento</span>
                <Icon name="keyboard_arrow_down" size={22} className="product-accordion-chevron" />
              </summary>
              <div className="product-accordion-body">
                <p className="text-muted">
                  Após a confirmação do pagamento (PIX ou Cartão), a Diretoria de Patrimônio combina pelo WhatsApp a
                  retirada presencial.
                </p>
                <p className="text-muted">
                  Trocas de tamanho podem ser solicitadas em até 7 dias corridos, mediante disponibilidade em estoque.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Outros Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <section style={{ display: 'grid', gap: '1rem', paddingBlockStart: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2>Outros itens da Lojinha</h2>
            <Link to="/lojinha" className="m3-btn m3-btn--text">
              <span>Ver catálogo completo</span>
              <Icon name="arrow_forward" size={18} />
            </Link>
          </div>

          <div className="grid-cards">
            {relatedProducts.map((item) => {
              const relUrl = `/lojinha/${getProductSlug(item)}`;
              return (
                <article
                  key={item.id}
                  className="m3-card m3-card--interactive"
                  style={{ display: 'grid', gap: '0.75rem', alignContent: 'space-between' }}
                >
                  <div style={{ display: 'grid', gap: '0.55rem' }}>
                    <Link
                      to={relUrl}
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        aspectRatio: '16 / 10',
                        borderRadius: 'var(--md-sys-shape-corner-md)',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #0f3325, #174936)',
                        color: '#edd16e',
                        textDecoration: 'none',
                      }}
                    >
                      {item.images[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <img
                          src={CAMBLU_CLEAN_CREST_URL}
                          alt={item.name}
                          style={{ inlineSize: '4.25rem', blockSize: '4.25rem', objectFit: 'contain' }}
                        />
                      )}
                    </Link>
                    <span className="m3-label-small text-muted" style={{ justifySelf: 'start' }}>
                      {item.category}
                    </span>
                    <h3>{item.name}</h3>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                      {formatBrlFromCents(item.priceCents)}
                    </strong>
                    <Link to={relUrl} className="m3-btn m3-btn--tonal" style={{ minBlockSize: '40px' }}>
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <M3Dialog
        open={Boolean(lightboxSlide)}
        onClose={() => setLightboxSlide(null)}
        wide
        title={product.name}
      >
        {lightboxSlide && (
          <div className="m3-motion-panel" style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}>
            {lightboxSlide.imageUrl ? (
              <img
                src={lightboxSlide.imageUrl}
                alt={product.name}
                style={{
                  maxInlineSize: '100%',
                  maxBlockSize: '74vh',
                  objectFit: 'contain',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                }}
              />
            ) : (
              <div
                className="product-gallery__editorial"
                style={{
                  background: lightboxSlide.gradient,
                  borderRadius: 'var(--md-sys-shape-corner-lg)',
                  minBlockSize: '20rem',
                  inlineSize: '100%',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <div style={{ display: 'grid', placeItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                  {lightboxSlide.showCrest ? (
                    <img src={CAMBLU_CLEAN_CREST_URL} alt="" className="product-gallery__crest" />
                  ) : (
                    <span style={{ color: lightboxSlide.accentHex || '#0f3325', display: 'inline-flex' }}>
                      <Icon name={lightboxSlide.iconName || 'checkroom'} size={72} />
                    </span>
                  )}
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: lightboxSlide.accentHex || '#ffffff' }}>
                    {lightboxSlide.caption}
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', inlineSize: '100%' }}>
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                onClick={() => setLightboxSlide(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </M3Dialog>

      <FloatingCartPill />
    </section>
  );
}
