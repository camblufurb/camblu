import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import {
  buildDynamicProductShotPlans,
  compressImageToInlinePayload,
  getAvailableFurbReferences,
  persistProductGalleryImage,
  requestNanoBananaProductImages,
  type CompressedUploadAsset,
  type GeneratedProductAiImageResult,
  type ProductAiShotType,
} from '../../lib/productAiStudio';
import { getProductSlug, slugifyProductName } from '../../lib/shopHelpers';
import { formatBrlFromCents } from '../../lib/validators';
import type { ShopProduct } from '../../types/domain';

interface UploadedSourcePhoto {
  id: string;
  name: string;
  asset: CompressedUploadAsset;
}

const SHOT_OPTIONS: Array<{ type: ProductAiShotType; label: string; helper: string }> = [
  {
    type: 'furb_individual',
    label: 'Individual na FURB',
    helper: 'Sorteia estudante e foto de referência em src/ai_ref',
  },
  {
    type: 'furb_group',
    label: 'Grupo na FURB (2–3 pessoas)',
    helper: 'Sorteia características diversas em ambiente da FURB',
  },
  {
    type: 'studio_gradient',
    label: 'Fundo simples (gradiente alto contraste)',
    helper: 'Calcula gradiente suave de alto contraste contra o produto',
  },
];

export function AdminShopProductsPage() {
  const { products, saveProduct } = useAppData();
  const { notify } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('55.00');
  const [prodCategory, setProdCategory] = useState('Vestuário');
  const [prodImage, setProdImage] = useState('');
  const [prodSizesText, setProdSizesText] = useState('P:10,M:15,G:10,GG:5');
  const [prodDetailsText, setProdDetailsText] = useState('');

  const [sourcePhotos, setSourcePhotos] = useState<UploadedSourcePhoto[]>([]);
  const [selectedShotTypes, setSelectedShotTypes] = useState<ProductAiShotType[]>([
    'furb_individual',
    'furb_group',
    'studio_gradient',
  ]);
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedProductAiImageResult[]>([]);

  const furbReferences = useMemo(() => getAvailableFurbReferences(), []);

  const galleryImages = useMemo(
    () =>
      prodImage
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean),
    [prodImage],
  );

  const setGalleryImagesList = (next: string[]) => {
    const unique = Array.from(new Set(next.map((u) => u.trim()).filter(Boolean)));
    setProdImage(unique.join('\n'));
  };

  const resetForm = () => {
    setEditingId(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('55.00');
    setProdCategory('Vestuário');
    setProdImage('');
    setProdSizesText('P:10,M:15,G:10,GG:5');
    setProdDetailsText('');
    setSourcePhotos([]);
    setGeneratedResults([]);
    setAiCustomNotes('');
  };

  const loadForEdit = (product: ShopProduct) => {
    setEditingId(product.id);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice((product.priceCents / 100).toFixed(2));
    setProdCategory(product.category);
    setProdImage(product.images.join('\n'));
    setProdSizesText(product.sizes.map((s) => `${s.size}:${s.stock}`).join(','));
    setProdDetailsText((product.details || []).join('\n'));
    setSourcePhotos([]);
    setGeneratedResults([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadProductFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded: UploadedSourcePhoto[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const asset = await compressImageToInlinePayload(file, 1024);
        uploaded.push({
          id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          asset,
        });
      }
      setSourcePhotos((prev) => [...prev, ...uploaded].slice(0, 6));
      notify(`${uploaded.length} foto(s) carregada(s). Você pode usar direto na galeria ou gerar versões finais com IA!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao processar foto enviada.', 'error');
    }
  };

  const toggleShotType = (shotType: ProductAiShotType) => {
    setSelectedShotTypes((prev) =>
      prev.includes(shotType) ? prev.filter((item) => item !== shotType) : [...prev, shotType],
    );
  };

  const handleGenerateWithAi = async () => {
    if (sourcePhotos.length === 0) {
      notify('Faça upload de pelo menos 1 foto base do produto antes de gerar com IA.', 'error');
      return;
    }
    if (selectedShotTypes.length === 0) {
      notify('Selecione ao menos um tipo de imagem final para gerar.', 'error');
      return;
    }

    setGeneratingAi(true);
    try {
      const avgLuminance =
        sourcePhotos.reduce((acc, item) => acc + item.asset.avgLuminance, 0) / sourcePhotos.length;

      const plans = buildDynamicProductShotPlans({
        productName: prodName.trim() || 'Produto Oficial CAMBLU',
        productDescription: prodDesc.trim(),
        productCategory: prodCategory.trim(),
        avgLuminance,
        selectedShots: selectedShotTypes,
        customNotes: aiCustomNotes,
        furbRefs: furbReferences,
      });

      const response = await requestNanoBananaProductImages({
        productImages: sourcePhotos.map((p) => ({
          mimeType: p.asset.mimeType,
          data: p.asset.data,
        })),
        plans,
      });

      setGeneratedResults(response.images);
      setGalleryImagesList([...galleryImages, ...response.images.map((img) => img.dataUrl)]);
      notify(`${response.images.length} imagem(ns) gerada(s) com ${response.model} e adicionada(s) à galeria!`);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Falha ao gerar imagens com gemini-nano-banana-2.1.',
        'error',
      );
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    setSavingProduct(true);
    try {
      const priceCents = Math.max(0, Math.round(Number(prodPrice.replace(',', '.')) * 100));
      const sizes = prodSizesText
        .split(',')
        .map((pair) => {
          const [sz, st] = pair.split(':').map((x) => x.trim());
          return { size: sz || 'Único', stock: Number(st) || 0 };
        })
        .filter((s) => s.size);

      const details = prodDetailsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const existing = editingId ? products.find((p) => p.id === editingId) : undefined;
      const id = existing?.id || `prod-${Date.now().toString(36)}`;
      const persistedImages = await Promise.all(
        galleryImages.map((img, idx) => persistProductGalleryImage(img, id, idx)),
      );

      const product: ShopProduct = {
        ...(existing || {}),
        id,
        slug: existing?.slug || `${slugifyProductName(prodName.trim())}-${id.slice(-4)}`,
        name: prodName.trim(),
        description: prodDesc.trim() || 'Produto oficial CAMBLU.',
        priceCents,
        images: persistedImages,
        details: details.length ? details : undefined,
        category: prodCategory.trim() || 'Vestuário',
        sizes,
        active: existing ? existing.active : true,
      };

      await saveProduct(product);
      resetForm();
      notify(existing ? 'Produto atualizado no catálogo!' : 'Produto publicado na Lojinha!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar imagens/produto no Storage.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleActive = async (product: ShopProduct) => {
    await saveProduct({ ...product, active: !product.active });
    notify(product.active ? `"${product.name}" pausado no catálogo.` : `"${product.name}" reativado na Lojinha!`);
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.75rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Produtos da Lojinha</h1>
        <p className="text-muted">
          Cadastre novos itens com upload direto das fotos, geração de fotos finais em ambientes da FURB e estúdio via{' '}
          <code>gemini-nano-banana-2.1</code>, grade de estoque e visibilidade.
        </p>
      </header>

      <form onSubmit={handleSaveProduct} className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2>{editingId ? 'Editar Produto Selecionado' : 'Cadastrar Novo Produto'}</h2>
          {editingId && (
            <button type="button" className="m3-btn m3-btn--outlined" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="p-name">Nome do produto</label>
            <input id="p-name" className="m3-input" required value={prodName} onChange={(e) => setProdName(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="p-cat">Categoria</label>
            <input id="p-cat" className="m3-input" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} />
          </div>
        </div>
        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="p-price">Valor de venda (R$)</label>
            <input id="p-price" className="m3-input" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="p-sizes">Tamanhos e estoque (ex.: P:10,M:15,G:10)</label>
            <input id="p-sizes" className="m3-input" value={prodSizesText} onChange={(e) => setProdSizesText(e.target.value)} />
          </div>
        </div>

        {/* Upload de fotos base do produto + Estúdio IA Nano Banana 2.1 */}
        <section
          aria-label="Upload e Estúdio IA de Imagens"
          className="m3-card m3-card--tonal"
          style={{ display: 'grid', gap: '1rem' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              <h3 style={{ marginBlockEnd: '0.15rem' }}>Fotos do Produto & Estúdio IA (Nano Banana 2.1)</h3>
              <p className="text-muted" style={{ fontSize: '0.86rem' }}>
                Envie fotos reais do item para publicar direto ou gerar imagens finais na FURB e em estúdio de alto contraste.
              </p>
            </div>
            <span className="m3-badge m3-badge--blue">
              <Icon name="location_on" size={14} />
              {furbReferences.length > 0
                ? `${furbReferences.length} referência(s) FURB em src/ai_ref`
                : 'src/ai_ref sem fotos ainda (usará descrição FURB)'}
            </span>
          </div>

          <div className="m3-field">
            <label htmlFor="p-upload-files">Upload de imagens do produto (PNG, JPG ou WebP)</label>
            <input
              id="p-upload-files"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                void handleUploadProductFiles(e.target.files);
                e.currentTarget.value = '';
              }}
            />
          </div>

          {sourcePhotos.length > 0 && (
            <div className="m3-motion-panel" style={{ display: 'grid', gap: '0.65rem' }}>
              <span className="m3-label-small">Fotos enviadas ({sourcePhotos.length})</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {sourcePhotos.map((item) => {
                  const alreadyInGallery = galleryImages.includes(item.asset.dataUrl);
                  return (
                    <div
                      key={item.id}
                      className="m3-card"
                      style={{ padding: '0.55rem', inlineSize: '10.5rem', display: 'grid', gap: '0.45rem' }}
                    >
                      <img
                        src={item.asset.dataUrl}
                        alt={item.name}
                        style={{
                          inlineSize: '100%',
                          aspectRatio: '1 / 1',
                          objectFit: 'cover',
                          borderRadius: 'var(--md-sys-shape-corner-sm)',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="m3-btn m3-btn--outlined"
                          style={{ minBlockSize: '30px', padding: '0.2rem 0.5rem', fontSize: '0.74rem', flex: 1 }}
                          disabled={alreadyInGallery}
                          onClick={() => setGalleryImagesList([...galleryImages, item.asset.dataUrl])}
                        >
                          {alreadyInGallery ? 'Na galeria' : 'Usar na galeria'}
                        </button>
                        <button
                          type="button"
                          className="m3-icon-btn"
                          aria-label={`Remover foto base ${item.name}`}
                          onClick={() =>
                            setSourcePhotos((prev) => prev.filter((p) => p.id !== item.id))
                          }
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.55rem' }}>
            <span className="m3-label-small">Variações finais para gerar com gemini-nano-banana-2.1</span>
            <div style={{ display: 'grid', gap: '0.45rem' }}>
              {SHOT_OPTIONS.map((opt) => (
                <label
                  key={opt.type}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedShotTypes.includes(opt.type)}
                    onChange={() => toggleShotType(opt.type)}
                  />
                  <span>
                    <strong>{opt.label}</strong>{' '}
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      — {opt.helper}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="m3-field">
            <label htmlFor="p-ai-notes">Instrução visual adicional para IA (opcional)</label>
            <input
              id="p-ai-notes"
              className="m3-input"
              placeholder="Ex.: Destacar o bordado frontal dourado e textura do moletom"
              value={aiCustomNotes}
              onChange={(e) => setAiCustomNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            <button
              type="button"
              className="m3-btn m3-btn--gold"
              disabled={generatingAi || savingProduct || sourcePhotos.length === 0}
              onClick={handleGenerateWithAi}
            >
              <Icon name={generatingAi ? 'hourglass_top' : 'auto_awesome'} size={18} />
              <span>
                {generatingAi
                  ? 'Gerando imagens com gemini-nano-banana-2.1...'
                  : 'Gerar imagens finais com IA (gemini-nano-banana-2.1)'}
              </span>
            </button>
          </div>

          {generatedResults.length > 0 && (
            <div className="m3-motion-panel" style={{ display: 'grid', gap: '0.65rem' }}>
              <span className="m3-label-small">Resultados gerados na última rodada ({generatedResults.length})</span>
              <div className="grid-cards">
                {generatedResults.map((gen) => (
                  <div key={gen.id} className="m3-card" style={{ padding: '0.75rem', display: 'grid', gap: '0.45rem' }}>
                    <img
                      src={gen.dataUrl}
                      alt={gen.label}
                      style={{
                        inlineSize: '100%',
                        aspectRatio: '1 / 1',
                        objectFit: 'cover',
                        borderRadius: 'var(--md-sys-shape-corner-md)',
                      }}
                    />
                    <strong style={{ fontSize: '0.85rem' }}>{gen.label}</strong>
                    <details>
                      <summary style={{ cursor: 'pointer', fontSize: '0.78rem' }} className="text-muted">
                        Prompt dinâmico sorteado
                      </summary>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginBlockStart: '0.3rem' }}>
                        {gen.promptUsed}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {galleryImages.length > 0 && (
          <div className="m3-motion-panel" style={{ display: 'grid', gap: '0.55rem' }}>
            <span className="m3-label-small">Prévia da Galeria Final do Produto ({galleryImages.length})</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {galleryImages.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl.slice(0, 48)}-${idx}`}
                  className="m3-card m3-card--tonal"
                  style={{ padding: '0.55rem', inlineSize: '10.5rem', display: 'grid', gap: '0.4rem' }}
                >
                  <img
                    src={imgUrl}
                    alt={`Imagem ${idx + 1} do produto`}
                    style={{
                      inlineSize: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: 'var(--md-sys-shape-corner-sm)',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem' }}>
                    {idx === 0 ? (
                      <span className="m3-badge m3-badge--blue">Capa</span>
                    ) : (
                      <button
                        type="button"
                        className="m3-btn m3-btn--outlined"
                        style={{ minBlockSize: '28px', padding: '0.15rem 0.45rem', fontSize: '0.72rem' }}
                        onClick={() => {
                          const reordered = [imgUrl, ...galleryImages.filter((_, i) => i !== idx)];
                          setGalleryImagesList(reordered);
                        }}
                      >
                        Definir capa
                      </button>
                    )}
                    <button
                      type="button"
                      className="m3-icon-btn"
                      aria-label={`Remover imagem ${idx + 1} da galeria`}
                      onClick={() => setGalleryImagesList(galleryImages.filter((_, i) => i !== idx))}
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="m3-field">
          <label htmlFor="p-img">URLs da galeria (opcional — preenchido automaticamente por uploads ou IA)</label>
          <textarea
            id="p-img"
            className="m3-textarea"
            style={{ minBlockSize: '4.25rem' }}
            placeholder="https://.../foto1.jpg (uma por linha ou separadas por vírgula)"
            value={prodImage}
            onChange={(e) => setProdImage(e.target.value)}
          />
        </div>
        <div className="m3-field">
          <label htmlFor="p-desc">Descrição</label>
          <textarea id="p-desc" className="m3-textarea" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
        </div>
        <div className="m3-field">
          <label htmlFor="p-details">Especificações para "Mais detalhes" (uma por linha, opcional)</label>
          <textarea id="p-details" className="m3-textarea" style={{ minBlockSize: '5rem' }} value={prodDetailsText} onChange={(e) => setProdDetailsText(e.target.value)} />
        </div>
        <button
          type="submit"
          className="m3-btn m3-btn--filled"
          style={{ justifySelf: 'start' }}
          disabled={savingProduct || generatingAi}
        >
          <Icon name={editingId ? 'save' : 'add_business'} size={18} />
          <span>
            {savingProduct
              ? 'Salvando imagens e produto...'
              : editingId
                ? 'Salvar Alterações'
                : 'Adicionar Produto'}
          </span>
        </button>
      </form>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Catálogo Cadastrado ({products.length})</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {products.map((product) => {
            const stock = product.sizes.reduce((acc, s) => acc + s.stock, 0);
            return (
              <div
                key={product.id}
                className="m3-card m3-card--tonal"
                style={{
                  padding: '0.95rem 1.1rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBlockEnd: '0.25rem' }}>
                    <span className={`m3-badge ${product.active ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                      {product.active ? 'Ativo' : 'Pausado'}
                    </span>
                    <span className="m3-badge">{product.category}</span>
                    {product.images.length > 0 && (
                      <span className="m3-badge m3-badge--blue">{product.images.length} foto(s)</span>
                    )}
                  </div>
                  <strong style={{ display: 'block' }}>{product.name}</strong>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {formatBrlFromCents(product.priceCents)} · {stock} un em {product.sizes.length} tamanho(s)
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  <Link
                    to={`/lojinha/${getProductSlug(product)}`}
                    className="m3-btn m3-btn--outlined"
                    style={{ minBlockSize: '38px' }}
                  >
                    <Icon name="open_in_new" size={16} />
                    <span>Ver</span>
                  </Link>
                  <button
                    type="button"
                    className="m3-btn m3-btn--blue"
                    style={{ minBlockSize: '38px' }}
                    onClick={() => loadForEdit(product)}
                  >
                    <Icon name="edit" size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="m3-btn m3-btn--outlined"
                    style={{ minBlockSize: '38px' }}
                    onClick={() => handleToggleActive(product)}
                  >
                    <Icon name={product.active ? 'pause_circle' : 'play_circle'} size={16} />
                    <span>{product.active ? 'Pausar' : 'Reativar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}
