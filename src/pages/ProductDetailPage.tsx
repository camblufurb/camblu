import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FloatingCartPill } from '../components/FloatingCartPill';
import { Icon } from '../components/Icon';
import { ShopCartDialog } from '../components/ShopCartDialog';
import { SponsorsStrip } from '../components/SponsorLogos';
import { useToast } from '../components/ToastProvider';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useShopCart } from '../context/ShopCartContext';
import { PRODUCTS_SEED } from '../data/catalogSeeds';
import { calculateShopPrice } from '../lib/clubPricing';
import {
  buildProductGallery,
  CAMBLU_CLEAN_CREST_URL,
  findProductBySlug,
  getProductSlug,
} from '../lib/shopHelpers';
import { formatBrlFromCents } from '../lib/validators';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products } = useAppData();
  const { profile } = useAuth();
  const { addToCart, isFavorite, toggleFavorite, totalItemsCount, setCartOpen } = useShopCart();
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
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const gallery = useMemo(() => (product ? buildProductGallery(product) : []), [product]);

  const orderedGallery = useMemo(() => {
    if (gallery.length <= 1 || activeSlideIndex === 0) return gallery;
    const active = gallery[activeSlideIndex];
    const rest = gallery.filter((_, idx) => idx !== activeSlideIndex);
    return [active, ...rest];
  }, [gallery, activeSlideIndex]);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} | Lojinha CAMBLU`;
    const firstAvailableSize = product.sizes.find((s) => s.stock > 0)?.size || product.sizes[0]?.size || 'Único';
    setSelectedSize(firstAvailableSize);
    setSelectedColorName(product.colors?.[0]?.name || '');
    setActiveSlideIndex(0);
  }, [product]);

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

  const favorited = isFavorite(product.id);

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
        {/* Coluna Esquerda: Galeria Editorial M3 (swipe horizontal no mobile, empilhada no desktop) */}
        <div className="product-gallery" aria-label={`Galeria de imagens de ${product.name}`}>
          {orderedGallery.map((slide) => {
            const originalIndex = gallery.findIndex((g) => g.id === slide.id);
            const isActive = originalIndex === activeSlideIndex;
            return (
              <button
                key={slide.id}
                type="button"
                className="product-gallery__frame"
                data-active={isActive ? 'true' : 'false'}
                aria-label={`${slide.label} — ampliar visualização`}
                aria-pressed={isActive}
                onClick={() => setActiveSlideIndex(originalIndex >= 0 ? originalIndex : 0)}
              >
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.caption}
                    style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="product-gallery__editorial" style={{ background: slide.gradient }}>
                    <div style={{ display: 'grid', placeItems: 'center', gap: '0.75rem' }}>
                      {slide.showCrest ? (
                        <img src={CAMBLU_CLEAN_CREST_URL} alt="" className="product-gallery__crest" />
                      ) : (
                        <span style={{ color: slide.accentHex || '#0f3325', display: 'inline-flex' }}>
                          <Icon name={slide.iconName || 'checkroom'} size={64} />
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: slide.accentHex || '#ffffff',
                          maxInlineSize: '26ch',
                        }}
                      >
                        {slide.caption}
                      </span>
                    </div>
                  </div>
                )}
                <span className="product-gallery__tag">{slide.label}</span>
              </button>
            );
          })}
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

          {/* CTA Principal (#3b82f7) + Favoritar + Compartilhar */}
          <div className="product-cta-row">
            <button
              type="button"
              className="m3-btn m3-btn--blue product-cta-main"
              disabled={totalStock === 0 || activeSizeStock <= 0}
              onClick={() => addToCart(product, selectedSize, selectedColorName || undefined)}
            >
              <Icon name="shopping_bag" size={20} />
              <span>{totalStock === 0 ? 'Esgotado' : 'Adicionar à sacola'}</span>
            </button>

            <button
              type="button"
              className="product-cta-fav"
              aria-label={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              aria-pressed={favorited}
              onClick={() => toggleFavorite(product)}
            >
              <Icon name="favorite" size={22} filled={favorited} />
            </button>

            <button
              type="button"
              className="product-cta-fav"
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
                  retirada presencial na sala do CAMBLU (Campus 1 — Bloco C), sem custo de frete.
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

      <SponsorsStrip />
      <FloatingCartPill />
      <ShopCartDialog />
    </section>
  );
}
