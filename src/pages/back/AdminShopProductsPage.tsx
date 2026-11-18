import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { M3Dialog } from '../../components/M3Dialog';
import { M3SplitButton } from '../../components/M3SplitButton';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import {
  buildDynamicProductShotPlans,
  compressImageToInlinePayload,
  getAvailableFurbReferences,
  persistProductGalleryImage,
  requestNanoBananaProductImages,
  requestProductDescriptionWithGemini,
  type CompressedUploadAsset,
  type GeneratedProductAiImageResult,
  type ProductAiShotType,
} from '../../lib/productAiStudio';
import { getProductSlug, slugifyProductName } from '../../lib/shopHelpers';
import { formatBrlFromCents } from '../../lib/validators';
import type { ProductSizeStock, ShopProduct, ShopProductImageBlocks } from '../../types/domain';

type BlockKey = ProductAiShotType;

type BlockImagesMap = Record<BlockKey, string[]>;
type BlockOptionsMap = Record<BlockKey, GeneratedProductAiImageResult[]>;

const PRESET_SHOP_CATEGORIES = [
  'Camisetas',
  'Inverno',
  'Papelaria',
  'Acessórios',
] as const;

const OTHER_CATEGORY_VALUE = '__other__';

const DEFAULT_PRODUCT_SIZES: ProductSizeStock[] = [
  { size: 'P', stock: 10 },
  { size: 'M', stock: 15 },
  { size: 'G', stock: 10 },
  { size: 'GG', stock: 5 },
];

const SIZE_SUGGESTIONS = [
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  'XXG',
  'Único',
  'Baby Look P',
  'Baby Look M',
  'Baby Look G',
];

const BLOCK_SPECS: Array<{ key: BlockKey; title: string }> = [
  { key: 'furb_individual', title: '1. Estudante sozinho' },
  { key: 'furb_group', title: '2. Grupo de pessoas' },
  { key: 'studio_gradient', title: '3. Produto isolado' },
];

const EMPTY_BLOCKS: BlockImagesMap = {
  furb_individual: [],
  furb_group: [],
  studio_gradient: [],
};

const EMPTY_OPTIONS: BlockOptionsMap = {
  furb_individual: [],
  furb_group: [],
  studio_gradient: [],
};

function resolveInitialBlocks(product: ShopProduct): BlockImagesMap {
  if (product.imageBlocks) {
    return {
      furb_individual: [...(product.imageBlocks.furb_individual || [])],
      furb_group: [...(product.imageBlocks.furb_group || [])],
      studio_gradient: [...(product.imageBlocks.studio_gradient || [])],
    };
  }
  const blocks: BlockImagesMap = {
    furb_individual: [],
    furb_group: [],
    studio_gradient: [],
  };
  for (const url of product.images || []) {
    if (url.includes('furb_individual')) blocks.furb_individual.push(url);
    else if (url.includes('furb_group')) blocks.furb_group.push(url);
    else blocks.studio_gradient.push(url);
  }
  return blocks;
}

export function AdminShopProductsPage() {
  const { products, saveProduct } = useAppData();
  const { notify } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('55.00');
  const [prodCategory, setProdCategory] = useState<string>('Camisetas');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [prodSizes, setProdSizes] = useState<ProductSizeStock[]>(() =>
    DEFAULT_PRODUCT_SIZES.map((item) => ({ ...item })),
  );
  const [prodDetailsText, setProdDetailsText] = useState('');

  const [imageBlocks, setImageBlocks] = useState<BlockImagesMap>(EMPTY_BLOCKS);
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [blockAiOptions, setBlockAiOptions] = useState<BlockOptionsMap>(EMPTY_OPTIONS);
  const [generatingBlocks, setGeneratingBlocks] = useState<Record<BlockKey, boolean>>({
    furb_individual: false,
    furb_group: false,
    studio_gradient: false,
  });
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Auto-loaded product reference images (up to 4) across generations on this product
  const [aiRefAssets, setAiRefAssets] = useState<CompressedUploadAsset[]>([]);
  const [aiRefUrls, setAiRefUrls] = useState<string[]>([]);
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [pendingGenerateBlock, setPendingGenerateBlock] = useState<BlockKey | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    blockKey: BlockKey;
    blockTitle: string;
    dataUrl: string;
    label: string;
    canAdd: boolean;
  } | null>(null);

  const fileInputRefs = useRef<Record<BlockKey, HTMLInputElement | null>>({
    furb_individual: null,
    furb_group: null,
    studio_gradient: null,
  });

  const furbReferences = useMemo(() => getAvailableFurbReferences(), []);

  const categoryOptions = useMemo(() => {
    const merged = new Set<string>(PRESET_SHOP_CATEGORIES);
    for (const p of products) {
      const cat = p.category?.trim();
      if (cat) merged.add(cat);
    }
    return Array.from(merged);
  }, [products]);

  const effectiveCategory =
    prodCategory === OTHER_CATEGORY_VALUE ? customCategory.trim() : prodCategory.trim();

  const orderedFlatImages = useMemo(() => {
    const all = [
      ...imageBlocks.furb_individual,
      ...imageBlocks.furb_group,
      ...imageBlocks.studio_gradient,
    ];
    const unique = Array.from(new Set(all.filter(Boolean)));
    if (coverUrl && unique.includes(coverUrl)) {
      return [coverUrl, ...unique.filter((u) => u !== coverUrl)];
    }
    return unique;
  }, [coverUrl, imageBlocks]);

  const effectiveCover = orderedFlatImages[0] || '';
  const anyBlockGenerating = Object.values(generatingBlocks).some(Boolean);
  const activeRefItems = useMemo(
    () => [
      ...aiRefUrls.map((url, idx) => ({ kind: 'url' as const, index: idx, preview: url })),
      ...aiRefAssets.map((asset, idx) => ({ kind: 'asset' as const, index: idx, preview: asset.dataUrl })),
    ],
    [aiRefAssets, aiRefUrls],
  );

  const resetForm = () => {
    setEditingId(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('55.00');
    setProdCategory('Camisetas');
    setCustomCategory('');
    setProdSizes(DEFAULT_PRODUCT_SIZES.map((item) => ({ ...item })));
    setProdDetailsText('');
    setImageBlocks({ furb_individual: [], furb_group: [], studio_gradient: [] });
    setCoverUrl('');
    setBlockAiOptions({ furb_individual: [], furb_group: [], studio_gradient: [] });
    setAiRefAssets([]);
    setAiRefUrls([]);
    setPendingGenerateBlock(null);
    setRefDialogOpen(false);
  };

  const loadForEdit = (product: ShopProduct) => {
    const resolved = resolveInitialBlocks(product);
    setEditingId(product.id);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice((product.priceCents / 100).toFixed(2));
    const trimmedCategory = product.category?.trim() || 'Camisetas';
    if (categoryOptions.includes(trimmedCategory)) {
      setProdCategory(trimmedCategory);
      setCustomCategory('');
    } else {
      setProdCategory(OTHER_CATEGORY_VALUE);
      setCustomCategory(trimmedCategory);
    }
    setProdSizes(
      product.sizes.length
        ? product.sizes.map((s) => ({ size: s.size, stock: Number(s.stock) || 0 }))
        : [{ size: 'Único', stock: 0 }],
    );
    setProdDetailsText((product.details || []).join('\n'));
    setImageBlocks(resolved);
    setCoverUrl(product.images[0] || '');
    setBlockAiOptions({ furb_individual: [], furb_group: [], studio_gradient: [] });
    setAiRefAssets([]);
    const loadedRefs = product.aiReferenceImageUrls?.length
      ? product.aiReferenceImageUrls.filter(Boolean).slice(0, 4)
      : product.aiReferenceImageUrl
        ? [product.aiReferenceImageUrl]
        : [];
    setAiRefUrls(loadedRefs);
    setPendingGenerateBlock(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addImagesToBlock = (blockKey: BlockKey, urls: string[]) => {
    const clean = urls.map((u) => u.trim()).filter(Boolean);
    if (clean.length === 0) return;
    setImageBlocks((prev) => {
      const nextList = Array.from(new Set([...prev[blockKey], ...clean]));
      return { ...prev, [blockKey]: nextList };
    });
    if (!coverUrl && !orderedFlatImages[0]) {
      setCoverUrl(clean[0]);
    }
  };

  const removeImageFromBlock = (blockKey: BlockKey, targetUrl: string) => {
    setImageBlocks((prev) => ({
      ...prev,
      [blockKey]: prev[blockKey].filter((u) => u !== targetUrl),
    }));
    if (coverUrl === targetUrl) {
      setCoverUrl('');
    }
  };

  const handleUploadFilesForBlock = async (blockKey: BlockKey, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const dataUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const compressed = await compressImageToInlinePayload(file, 1024);
        dataUrls.push(compressed.dataUrl);
      }
      addImagesToBlock(blockKey, dataUrls);
      notify(`${dataUrls.length} imagem(ns) adicionada(s) ao bloco.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao processar arquivo de imagem.', 'error');
    }
  };

  const runGenerateForBlock = async (
    blockKey: BlockKey,
    overrideAssets?: CompressedUploadAsset[],
  ) => {
    const assetsToUse = overrideAssets || aiRefAssets;
    const storedRefUrls = aiRefUrls.map((u) => u.trim()).filter(Boolean);
    if (assetsToUse.length === 0 && storedRefUrls.length === 0) {
      setPendingGenerateBlock(blockKey);
      setRefDialogOpen(true);
      return;
    }

    setGeneratingBlocks((prev) => ({ ...prev, [blockKey]: true }));
    try {
      const avgLuminance =
        assetsToUse.length > 0
          ? assetsToUse.reduce((acc, a) => acc + a.avgLuminance, 0) / assetsToUse.length
          : 0.35;
      const plans = buildDynamicProductShotPlans({
        productName: prodName.trim() || 'Produto Oficial CAMBLU',
        productDescription: prodDesc.trim(),
        productCategory: effectiveCategory || 'Camisetas',
        avgLuminance,
        selectedShots: [blockKey],
        furbRefs: furbReferences,
      });

      const response = await requestNanoBananaProductImages({
        productImages: assetsToUse.length
          ? assetsToUse.slice(0, 4).map((a) => ({ mimeType: a.mimeType, data: a.data }))
          : undefined,
        productImageUrls: storedRefUrls.length ? storedRefUrls.slice(0, 4) : undefined,
        plans,
      });

      setBlockAiOptions((prev) => ({
        ...prev,
        [blockKey]: response.images,
      }));
      notify(`Exemplo gerado para "${BLOCK_SPECS.find((b) => b.key === blockKey)?.title}". Clique na imagem para ampliar ou em + para adicionar.`);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Falha ao gerar opções com gemini-nano-banana-2.1.',
        'error',
      );
    } finally {
      setGeneratingBlocks((prev) => ({ ...prev, [blockKey]: false }));
    }
  };

  const handleReferenceFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, 4 - (aiRefUrls.length + aiRefAssets.length));
    if (remainingSlots === 0) {
      notify('Limite máximo de 4 imagens de referência por produto atingido. Remova uma antes de adicionar outra.', 'info');
      return;
    }
    try {
      const compressedList: CompressedUploadAsset[] = [];
      for (const file of Array.from(files).slice(0, remainingSlots)) {
        compressedList.push(await compressImageToInlinePayload(file, 1024));
      }
      const nextAssets = [...aiRefAssets, ...compressedList].slice(0, 4);
      setAiRefAssets(nextAssets);
      notify(`${compressedList.length} imagem(ns) de referência adicionada(s) (${aiRefUrls.length + nextAssets.length}/4).`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao ler imagem(ns) de referência.', 'error');
    }
  };

  const handleRemoveReferenceItem = (kind: 'url' | 'asset', index: number) => {
    if (kind === 'url') {
      setAiRefUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAiRefAssets((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleGenerateDescription = async () => {
    if (!prodName.trim()) {
      notify('Informe o nome do produto antes de gerar a descrição com IA.', 'info');
      return;
    }
    setGeneratingDesc(true);
    try {
      const details = prodDetailsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const res = await requestProductDescriptionWithGemini({
        name: prodName.trim(),
        category: effectiveCategory || 'Camisetas',
        sizes: prodSizes,
        details,
        currentDescription: prodDesc.trim(),
        productImages: aiRefAssets.length
          ? aiRefAssets.slice(0, 4).map((a) => ({ mimeType: a.mimeType, data: a.data }))
          : undefined,
        productImageUrls: aiRefUrls.length ? aiRefUrls.slice(0, 4) : undefined,
      });
      setProdDesc(res.description);
      notify(`Descrição gerada com ${res.model}!`);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : 'Falha ao gerar descrição com gemini-flash-lite-latest.',
        'error',
      );
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleAddSizeRow = () => {
    setProdSizes((prev) => [...prev, { size: '', stock: 0 }]);
  };

  const handleUpdateSizeRow = (index: number, patch: Partial<ProductSizeStock>) => {
    setProdSizes((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const handleRemoveSizeRow = (index: number) => {
    setProdSizes((prev) => {
      if (prev.length <= 1) {
        return [{ size: '', stock: 0 }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    if (prodCategory === OTHER_CATEGORY_VALUE && !customCategory.trim()) {
      notify('Digite o nome da nova categoria em "outro - escreva".', 'error');
      return;
    }
    const sizes = prodSizes
      .map((item) => ({
        size: item.size.trim(),
        stock: Math.max(0, Math.floor(Number(item.stock) || 0)),
      }))
      .filter((s) => s.size);

    if (sizes.length === 0) {
      notify('Adicione pelo menos um tamanho e estoque para o produto.', 'error');
      return;
    }

    setSavingProduct(true);
    try {
      const priceCents = Math.max(0, Math.round(Number(prodPrice.replace(',', '.')) * 100));

      const details = prodDetailsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const existing = editingId ? products.find((p) => p.id === editingId) : undefined;
      const id = existing?.id || `prod-${Date.now().toString(36)}`;

      const persistSlotList = async (slot: BlockKey, urls: string[]) =>
        Promise.all(
          urls.map((u, idx) => persistProductGalleryImage(u, `${id}/${slot}`, idx)),
        );

      const [soloUrls, groupUrls, isolatedUrls, persistedRefUrls] = await Promise.all([
        persistSlotList('furb_individual', imageBlocks.furb_individual),
        persistSlotList('furb_group', imageBlocks.furb_group),
        persistSlotList('studio_gradient', imageBlocks.studio_gradient),
        Promise.all(
          aiRefAssets.map((asset, idx) =>
            persistProductGalleryImage(asset.dataUrl, `${id}/reference`, idx),
          ),
        ).then((uploadedUrls) =>
          Array.from(new Set([...aiRefUrls, ...uploadedUrls].filter(Boolean))).slice(0, 4),
        ),
      ]);

      const persistedBlocks: ShopProductImageBlocks = {
        furb_individual: soloUrls,
        furb_group: groupUrls,
        studio_gradient: isolatedUrls,
      };

      // Map old temporary URLs to newly persisted Storage URLs cleanly to keep cover ordering
      const urlUpgradeMap = new Map<string, string>();
      imageBlocks.furb_individual.forEach((orig, i) => {
        if (soloUrls[i]) urlUpgradeMap.set(orig, soloUrls[i]);
      });
      imageBlocks.furb_group.forEach((orig, i) => {
        if (groupUrls[i]) urlUpgradeMap.set(orig, groupUrls[i]);
      });
      imageBlocks.studio_gradient.forEach((orig, i) => {
        if (isolatedUrls[i]) urlUpgradeMap.set(orig, isolatedUrls[i]);
      });

      const resolvedCover = coverUrl ? urlUpgradeMap.get(coverUrl) || coverUrl : '';
      const combined = Array.from(new Set([...soloUrls, ...groupUrls, ...isolatedUrls].filter(Boolean)));
      const finalImages =
        resolvedCover && combined.includes(resolvedCover)
          ? [resolvedCover, ...combined.filter((u) => u !== resolvedCover)]
          : combined;

      const product: ShopProduct = {
        ...(existing || {}),
        id,
        slug: existing?.slug || `${slugifyProductName(prodName.trim())}-${id.slice(-4)}`,
        name: prodName.trim(),
        description: prodDesc.trim() || 'Produto oficial CAMBLU.',
        priceCents,
        images: finalImages,
        imageBlocks: persistedBlocks,
        aiReferenceImageUrl: persistedRefUrls[0] || undefined,
        aiReferenceImageUrls: persistedRefUrls.length ? persistedRefUrls : undefined,
        details: details.length ? details : undefined,
        category: effectiveCategory || 'Camisetas',
        sizes,
        active: existing ? existing.active : true,
      };

      await saveProduct(product);
      resetForm();
      notify(existing ? 'Produto atualizado no catálogo!' : 'Produto publicado na Lojinha!');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar imagens/produto.', 'error');
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
      </header>

      <form onSubmit={handleSaveProduct} className="m3-card" style={{ display: 'grid', gap: '1.25rem' }}>
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
            <select
              id="p-cat"
              className="m3-select"
              value={prodCategory}
              onChange={(e) => setProdCategory(e.target.value)}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value={OTHER_CATEGORY_VALUE}>outro - escreva</option>
            </select>
          </div>
        </div>

        {prodCategory === OTHER_CATEGORY_VALUE && (
          <div className="m3-field m3-motion-panel">
            <label htmlFor="p-cat-custom">Nova categoria</label>
            <input
              id="p-cat-custom"
              className="m3-input"
              required
              placeholder="Escreva o nome da categoria..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>
        )}

        <div className="m3-field" style={{ maxInlineSize: '360px' }}>
          <label htmlFor="p-price">Valor de venda (R$)</label>
          <input id="p-price" className="m3-input" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
        </div>

        <section aria-label="Tamanhos e estoque" style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Tamanhos e estoque</label>
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              style={{ minBlockSize: '36px', padding: '0.35rem 0.85rem', fontSize: '0.84rem' }}
              onClick={handleAddSizeRow}
            >
              <Icon name="add" />
              Adicionar tamanho
            </button>
          </div>

          <div className="m3-surface-soft" style={{ display: 'grid', gap: '0.65rem', padding: '0.85rem' }}>
            {prodSizes.map((row, index) => (
              <div
                key={`size-row-${index}`}
                className="m3-motion-panel"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px, 1.4fr) minmax(90px, 0.8fr) auto',
                  gap: '0.6rem',
                  alignItems: 'end',
                }}
              >
                <div className="m3-field" style={{ margin: 0 }}>
                  <label htmlFor={`p-size-name-${index}`}>Tamanho</label>
                  <input
                    id={`p-size-name-${index}`}
                    className="m3-input"
                    list="camblu-size-suggestions"
                    required
                    placeholder="Ex.: P, M, G, Único"
                    value={row.size}
                    onChange={(e) => handleUpdateSizeRow(index, { size: e.target.value })}
                  />
                </div>
                <div className="m3-field" style={{ margin: 0 }}>
                  <label htmlFor={`p-size-stock-${index}`}>Estoque</label>
                  <input
                    id={`p-size-stock-${index}`}
                    type="number"
                    min={0}
                    step={1}
                    className="m3-input"
                    required
                    value={Number.isFinite(row.stock) ? row.stock : 0}
                    onChange={(e) =>
                      handleUpdateSizeRow(index, {
                        stock: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="m3-btn m3-btn--outlined"
                  aria-label={`Remover tamanho ${row.size || index + 1}`}
                  title="Remover tamanho"
                  style={{ minBlockSize: '42px', padding: '0.35rem 0.65rem' }}
                  onClick={() => handleRemoveSizeRow(index)}
                >
                  <Icon name="delete" />
                </button>
              </div>
            ))}
          </div>

          <datalist id="camblu-size-suggestions">
            {SIZE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </section>

        {/* Sessão Galeria do produto com 3 blocos */}
        <section aria-label="Galeria do produto" style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Galeria do produto</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              {activeRefItems.map((item, idx) => (
                <img
                  key={`${item.kind}-${item.index}`}
                  src={item.preview}
                  alt={`Referência ${idx + 1} do produto`}
                  style={{
                    inlineSize: '34px',
                    blockSize: '34px',
                    objectFit: 'cover',
                    borderRadius: 'var(--md-sys-shape-corner-sm)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                  }}
                />
              ))}
              {activeRefItems.length > 0 && (
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {activeRefItems.length}/4 referência(s) ativa(s)
                </span>
              )}
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                style={{ minBlockSize: '32px', padding: '0.2rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => {
                  setPendingGenerateBlock(null);
                  setRefDialogOpen(true);
                }}
              >
                {activeRefItems.length > 0 ? 'Gerenciar referências' : 'Adicionar referências'}
              </button>
            </div>
          </div>

          <div className="gallery-blocks-grid">
            {BLOCK_SPECS.map((block) => {
              const blockUrls = imageBlocks[block.key];
              const aiOptions = blockAiOptions[block.key];
              const isBusy = generatingBlocks[block.key];

              return (
                <article key={block.key} className="gallery-block-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{block.title}</strong>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {blockUrls.length} imagem(ns)
                      </span>
                    </div>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[block.key] = el;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
                      onChange={(e) => {
                        void handleUploadFilesForBlock(block.key, e.target.files);
                        e.currentTarget.value = '';
                      }}
                    />

                    <M3SplitButton
                      primaryLabel={isBusy ? 'Gerando...' : 'Gerar'}
                      primaryIcon="auto_awesome"
                      loading={isBusy}
                      disabled={savingProduct}
                      menuAriaLabel={`Opções para ${block.title}`}
                      onPrimaryClick={() => {
                        void runGenerateForBlock(block.key);
                      }}
                      menuItems={[
                        {
                          id: `${block.key}-generate`,
                          label: 'Gerar',
                          icon: 'auto_awesome',
                          onClick: () => {
                            void runGenerateForBlock(block.key);
                          },
                        },
                        {
                          id: `${block.key}-upload`,
                          label: 'Upload',
                          icon: 'upload',
                          onClick: () => fileInputRefs.current[block.key]?.click(),
                        },
                      ]}
                    />
                  </div>

                  {blockUrls.length > 0 && (
                    <div className="gallery-block-thumbs">
                      {blockUrls.map((url, idx) => {
                        const isCover = url === effectiveCover;
                        return (
                          <div key={`${block.key}-${idx}-${url.slice(0, 32)}`} className="gallery-thumb-card">
                            <button
                              type="button"
                              className="gallery-ai-zoom-trigger"
                              aria-label={`Ampliar ${block.title} — foto ${idx + 1}`}
                              onClick={() =>
                                setPreviewImage({
                                  blockKey: block.key,
                                  blockTitle: block.title,
                                  dataUrl: url,
                                  label: `${block.title} — foto ${idx + 1}`,
                                  canAdd: false,
                                })
                              }
                            >
                              <img src={url} alt={`${block.title} — foto ${idx + 1}`} />
                            </button>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.2rem' }}>
                              {isCover ? (
                                <span className="m3-badge m3-badge--blue" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                                  Capa
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="m3-btn m3-btn--outlined"
                                  style={{ minBlockSize: '26px', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                                  onClick={() => setCoverUrl(url)}
                                >
                                  Capa
                                </button>
                              )}
                              <button
                                type="button"
                                className="m3-icon-btn"
                                style={{ inlineSize: '28px', blockSize: '28px' }}
                                aria-label={`Remover foto ${idx + 1} de ${block.title}`}
                                onClick={() => removeImageFromBlock(block.key, url)}
                              >
                                <Icon name="delete" size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {aiOptions.length > 0 && (
                    <div className="gallery-ai-options-panel">
                      <span className="m3-label-small text-muted">
                        Exemplo gerado (clique para ampliar)
                      </span>
                      <div className="gallery-ai-options-grid">
                        {aiOptions.map((opt) => {
                          const added = blockUrls.includes(opt.dataUrl);
                          return (
                            <div key={opt.id} className="gallery-ai-option-item">
                              <button
                                type="button"
                                className="gallery-ai-zoom-trigger"
                                aria-label={`Ampliar imagem gerada: ${opt.label}`}
                                title="Clique para ampliar"
                                onClick={() =>
                                  setPreviewImage({
                                    blockKey: block.key,
                                    blockTitle: block.title,
                                    dataUrl: opt.dataUrl,
                                    label: opt.label,
                                    canAdd: !added,
                                  })
                                }
                              >
                                <img src={opt.dataUrl} alt={opt.label} />
                                <span className="gallery-ai-zoom-hint" aria-hidden="true">
                                  <Icon name="zoom_in" size={15} />
                                </span>
                              </button>
                              <button
                                type="button"
                                className="gallery-ai-add-btn"
                                data-added={added ? 'true' : 'false'}
                                aria-label={added ? 'Adicionada à galeria' : 'Adicionar opção à galeria'}
                                title={added ? 'Adicionada à galeria' : 'Adicionar à galeria'}
                                onClick={() => {
                                  if (!added) {
                                    addImagesToBlock(block.key, [opt.dataUrl]);
                                  }
                                }}
                              >
                                <Icon name={added ? 'check' : 'add'} size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <div className="m3-field">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="p-desc" style={{ margin: 0 }}>Descrição</label>
            <button
              type="button"
              className="m3-btn m3-btn--blue"
              style={{ minBlockSize: '36px', padding: '0.35rem 0.85rem', fontSize: '0.84rem' }}
              disabled={generatingDesc || savingProduct}
              onClick={handleGenerateDescription}
            >
              <Icon name="auto_awesome" size={16} />
              <span>{generatingDesc ? 'Gerando descrição...' : 'Gerar descrição com IA'}</span>
            </button>
          </div>
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
          disabled={savingProduct || anyBlockGenerating}
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

      <M3Dialog
        open={refDialogOpen}
        onClose={() => {
          setRefDialogOpen(false);
          setPendingGenerateBlock(null);
        }}
        title="Imagens de referência do produto (até 4)"
      >
        <div className="m3-motion-panel" style={{ display: 'grid', gap: '1rem' }}>
          <p className="text-muted" style={{ margin: 0 }}>
            Envie uma ou mais fotos reais deste produto (frente, costas, detalhes) para servir de base ao modelo. Elas ficam salvas e são carregadas automaticamente em todas as gerações deste item.
          </p>

          {activeRefItems.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {activeRefItems.map((item, idx) => (
                <div key={`ref-dlg-${item.kind}-${item.index}`} className="gallery-thumb-card" style={{ inlineSize: '92px' }}>
                  <img src={item.preview} alt={`Referência ${idx + 1}`} />
                  <button
                    type="button"
                    className="m3-icon-btn"
                    style={{ inlineSize: '28px', blockSize: '28px', justifySelf: 'end' }}
                    aria-label={`Remover referência ${idx + 1}`}
                    onClick={() => handleRemoveReferenceItem(item.kind, item.index)}
                  >
                    <Icon name="delete" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="m3-field">
            <label htmlFor="p-ai-ref-upload">Adicionar imagens de referência (PNG, JPG ou WebP — máx. 4)</label>
            <input
              id="p-ai-ref-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={activeRefItems.length >= 4}
              onChange={(e) => {
                void handleReferenceFilesSelected(e.target.files);
                e.currentTarget.value = '';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              onClick={() => {
                setRefDialogOpen(false);
                setPendingGenerateBlock(null);
              }}
            >
              Fechar
            </button>
            {pendingGenerateBlock && activeRefItems.length > 0 && (
              <button
                type="button"
                className="m3-btn m3-btn--blue"
                onClick={() => {
                  const target = pendingGenerateBlock;
                  setPendingGenerateBlock(null);
                  setRefDialogOpen(false);
                  void runGenerateForBlock(target);
                }}
              >
                <Icon name="auto_awesome" size={18} />
                <span>Gerar imagem agora</span>
              </button>
            )}
          </div>
        </div>
      </M3Dialog>

      <M3Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        wide
        title={previewImage ? `${previewImage.blockTitle} · ${previewImage.label}` : 'Visualizar imagem'}
      >
        {previewImage && (
          <div className="m3-motion-panel" style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}>
            <img
              src={previewImage.dataUrl}
              alt={previewImage.label}
              style={{
                maxInlineSize: '100%',
                maxBlockSize: '68vh',
                objectFit: 'contain',
                borderRadius: 'var(--md-sys-shape-corner-md)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'flex-end', inlineSize: '100%' }}>
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                onClick={() => setPreviewImage(null)}
              >
                Fechar
              </button>
              {previewImage.canAdd && (
                <button
                  type="button"
                  className="m3-btn m3-btn--blue"
                  onClick={() => {
                    addImagesToBlock(previewImage.blockKey, [previewImage.dataUrl]);
                    setPreviewImage(null);
                    notify(`Imagem adicionada ao bloco "${previewImage.blockTitle}".`);
                  }}
                >
                  <Icon name="add" size={18} />
                  <span>Adicionar à galeria</span>
                </button>
              )}
            </div>
          </div>
        )}
      </M3Dialog>

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
