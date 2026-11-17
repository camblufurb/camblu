import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import type { ShopOrder, ShopProduct } from '../../types/domain';

export function AdminShopStockPage() {
  const { products, saveProduct, addOrder } = useAppData();
  const { notify } = useToast();

  const [filterMode, setFilterMode] = useState<'todos' | 'baixo' | 'esgotado'>('todos');
  const [search, setSearch] = useState('');

  // Venda externa ou Doação
  const [extProductId, setExtProductId] = useState(products[0]?.id || '');
  const [extSize, setExtSize] = useState(products[0]?.sizes[0]?.size || 'Único');
  const [extQty, setExtQty] = useState(1);
  const [extType, setExtType] = useState<'externo_pix' | 'doacao'>('externo_pix');
  const [extBuyerName, setExtBuyerName] = useState('');
  const [extBuyerPhone, setExtBuyerPhone] = useState('');
  const [extNotes, setExtNotes] = useState('');

  const selectedExtProduct = products.find((p) => p.id === extProductId) || products[0];

  const visibleProducts = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesText = !clean || `${p.name} ${p.category}`.toLowerCase().includes(clean);
      if (!matchesText) return false;
      if (filterMode === 'baixo') return p.sizes.some((s) => s.stock <= 5);
      if (filterMode === 'esgotado') return p.sizes.some((s) => s.stock <= 0);
      return true;
    });
  }, [products, search, filterMode]);

  const adjustVariantStock = async (product: ShopProduct, sizeName: string, nextStock: number) => {
    const sanitized = Math.max(0, Math.round(nextStock));
    await saveProduct({
      ...product,
      sizes: product.sizes.map((s) => (s.size === sizeName ? { ...s, stock: sanitized } : s)),
    });
    notify(`Estoque de "${product.name}" (${sizeName}) atualizado para ${sanitized}.`);
  };

  const handleRegisterExternalOrDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExtProduct) return;
    const qty = Math.max(1, extQty);
    const unit = extType === 'doacao' ? 0 : selectedExtProduct.priceCents;

    const order: ShopOrder = {
      id: `ord-${Date.now().toString(36)}`,
      buyerUid: 'manual-back',
      buyerName: extBuyerName.trim() || (extType === 'doacao' ? 'Doação / Brinde Calouro' : 'Venda Presencial'),
      buyerEmail: 'presencial@camblu.org',
      buyerPhone: extBuyerPhone,
      items: [
        {
          productId: selectedExtProduct.id,
          productName: selectedExtProduct.name,
          size: extSize,
          quantity: qty,
          unitPriceCents: unit,
        },
      ],
      subtotalCents: unit * qty,
      discountCents: 0,
      totalCents: unit * qty,
      paymentMethod: extType,
      paymentStatus: extType === 'doacao' ? 'donation' : 'paid',
      delivered: true,
      deliveredAt: new Date().toISOString(),
      notes: extNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addOrder(order);
    await saveProduct({
      ...selectedExtProduct,
      sizes: selectedExtProduct.sizes.map((s) =>
        s.size === extSize ? { ...s, stock: Math.max(0, s.stock - qty) } : s,
      ),
    });

    setExtBuyerName('');
    setExtBuyerPhone('');
    setExtNotes('');
    setExtQty(1);
    notify(
      extType === 'doacao'
        ? 'Doação / saída registrada e estoque atualizado!'
        : 'Venda externa registrada e estoque atualizado!',
    );
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.75rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Controle de Estoque da Lojinha</h1>
        <p className="text-muted">
          Ajuste quantidades por tamanho diretamente na grade e registre saídas externas ou doações de calouros.
        </p>
      </header>

      <article className="m3-card" style={{ display: 'grid', gap: '1.1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {([
              { id: 'todos', label: 'Todos os produtos' },
              { id: 'baixo', label: 'Estoque baixo (≤ 5)' },
              { id: 'esgotado', label: 'Com variação esgotada' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                className="m3-chip"
                aria-pressed={filterMode === item.id}
                onClick={() => setFilterMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="m3-input"
            style={{ maxInlineSize: '18rem' }}
            placeholder="Filtrar produto..."
            aria-label="Filtrar produto no estoque"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {visibleProducts.map((product) => {
            const totalUnits = product.sizes.reduce((acc, s) => acc + s.stock, 0);
            return (
              <div
                key={product.id}
                className="m3-card m3-card--tonal"
                style={{ padding: '1rem 1.15rem', display: 'grid', gap: '0.85rem' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{product.name}</strong>
                    <span className="text-muted" style={{ fontSize: '0.84rem' }}>
                      {product.category} · Total em grade: {totalUnits} un · {product.active ? 'Visível no catálogo' : 'Pausado'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {product.sizes.map((variant) => (
                    <div
                      key={variant.size}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.45rem 0.7rem',
                        borderRadius: 'var(--md-sys-shape-corner-md)',
                        background: 'var(--md-sys-color-surface-container-lowest)',
                        border:
                          variant.stock <= 5
                            ? '1px solid var(--md-sys-color-error)'
                            : '1px solid var(--md-sys-color-outline-variant)',
                      }}
                    >
                      <strong style={{ minInlineSize: '2rem', fontSize: '0.88rem' }}>{variant.size}</strong>
                      <button
                        type="button"
                        className="m3-icon-btn"
                        style={{ minInlineSize: '32px', minBlockSize: '32px' }}
                        aria-label={`Diminuir estoque ${product.name} ${variant.size}`}
                        onClick={() => adjustVariantStock(product, variant.size, variant.stock - 1)}
                      >
                        <Icon name="remove" size={16} />
                      </button>
                      <span style={{ minInlineSize: '2rem', textAlign: 'center', fontWeight: 750 }}>
                        {variant.stock}
                      </span>
                      <button
                        type="button"
                        className="m3-icon-btn"
                        style={{ minInlineSize: '32px', minBlockSize: '32px' }}
                        aria-label={`Aumentar estoque ${product.name} ${variant.size}`}
                        onClick={() => adjustVariantStock(product, variant.size, variant.stock + 1)}
                      >
                        <Icon name="add" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <form onSubmit={handleRegisterExternalOrDonation} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Lançar Venda Externa ou Doação (Baixa Automática)</h2>
        <div className="grid-cards">
          <div className="m3-field">
            <label htmlFor="ext-prod">Produto</label>
            <select
              id="ext-prod"
              className="m3-select"
              value={extProductId}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setExtProductId(e.target.value);
                if (p?.sizes[0]) setExtSize(p.sizes[0].size);
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="m3-field">
            <label htmlFor="ext-size">Tamanho</label>
            <select id="ext-size" className="m3-select" value={extSize} onChange={(e) => setExtSize(e.target.value)}>
              {(selectedExtProduct?.sizes || []).map((s) => (
                <option key={s.size} value={s.size}>
                  {s.size} (estoque: {s.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="m3-field">
            <label htmlFor="ext-qty">Quantidade</label>
            <input
              id="ext-qty"
              type="number"
              min={1}
              className="m3-input"
              value={extQty}
              onChange={(e) => setExtQty(Number(e.target.value))}
            />
          </div>
          <div className="m3-field">
            <label htmlFor="ext-type">Tipo de saída</label>
            <select
              id="ext-type"
              className="m3-select"
              value={extType}
              onChange={(e) => setExtType(e.target.value as 'externo_pix' | 'doacao')}
            >
              <option value="externo_pix">Venda Externa (PIX/Dinheiro)</option>
              <option value="doacao">Doação / Calouro / Cortesia</option>
            </select>
          </div>
        </div>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ext-buyer">Nome do comprador / recebedor</label>
            <input id="ext-buyer" className="m3-input" value={extBuyerName} onChange={(e) => setExtBuyerName(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ext-phone">WhatsApp (opcional)</label>
            <input id="ext-phone" className="m3-input" value={extBuyerPhone} onChange={(e) => setExtBuyerPhone(e.target.value)} />
          </div>
        </div>

        <div className="m3-field">
          <label htmlFor="ext-notes">Observação</label>
          <input id="ext-notes" className="m3-input" value={extNotes} onChange={(e) => setExtNotes(e.target.value)} />
        </div>

        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name="inventory" size={18} />
          <span>Registrar Baixa de Estoque</span>
        </button>
      </form>
    </div>
  );
}
