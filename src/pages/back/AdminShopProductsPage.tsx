import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { getProductSlug, slugifyProductName } from '../../lib/shopHelpers';
import { formatBrlFromCents } from '../../lib/validators';
import type { ShopProduct } from '../../types/domain';

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

  const resetForm = () => {
    setEditingId(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('55.00');
    setProdCategory('Vestuário');
    setProdImage('');
    setProdSizesText('P:10,M:15,G:10,GG:5');
    setProdDetailsText('');
  };

  const loadForEdit = (product: ShopProduct) => {
    setEditingId(product.id);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice((product.priceCents / 100).toFixed(2));
    setProdCategory(product.category);
    setProdImage(product.images.join(', '));
    setProdSizesText(product.sizes.map((s) => `${s.size}:${s.stock}`).join(','));
    setProdDetailsText((product.details || []).join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const priceCents = Math.max(0, Math.round(Number(prodPrice.replace(',', '.')) * 100));
    const sizes = prodSizesText
      .split(',')
      .map((pair) => {
        const [sz, st] = pair.split(':').map((x) => x.trim());
        return { size: sz || 'Único', stock: Number(st) || 0 };
      })
      .filter((s) => s.size);

    const images = prodImage
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    const details = prodDetailsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const existing = editingId ? products.find((p) => p.id === editingId) : undefined;
    const id = existing?.id || `prod-${Date.now().toString(36)}`;
    const product: ShopProduct = {
      ...(existing || {}),
      id,
      slug: existing?.slug || `${slugifyProductName(prodName.trim())}-${id.slice(-4)}`,
      name: prodName.trim(),
      description: prodDesc.trim() || 'Produto oficial CAMBLU.',
      priceCents,
      images,
      details: details.length ? details : undefined,
      category: prodCategory.trim() || 'Vestuário',
      sizes,
      active: existing ? existing.active : true,
    };

    await saveProduct(product);
    resetForm();
    notify(existing ? 'Produto atualizado no catálogo!' : 'Produto publicado na Lojinha!');
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
          Cadastre novos itens ou selecione qualquer produto abaixo para editar nome, preço, fotos, grade e visibilidade.
        </p>
      </header>

      <form onSubmit={handleSaveProduct} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
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
        <div className="m3-field">
          <label htmlFor="p-img">URLs das fotos da galeria (separe por vírgula ou quebra de linha, opcional)</label>
          <input id="p-img" className="m3-input" placeholder="https://.../foto1.jpg, https://.../foto2.jpg" value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
        </div>
        <div className="m3-field">
          <label htmlFor="p-desc">Descrição</label>
          <textarea id="p-desc" className="m3-textarea" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
        </div>
        <div className="m3-field">
          <label htmlFor="p-details">Especificações para "Mais detalhes" (uma por linha, opcional)</label>
          <textarea id="p-details" className="m3-textarea" style={{ minBlockSize: '5rem' }} value={prodDetailsText} onChange={(e) => setProdDetailsText(e.target.value)} />
        </div>
        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name={editingId ? 'save' : 'add_business'} size={18} />
          <span>{editingId ? 'Salvar Alterações' : 'Adicionar Produto'}</span>
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
