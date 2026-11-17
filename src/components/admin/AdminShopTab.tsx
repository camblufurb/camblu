import { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../ToastProvider';
import { Icon } from '../Icon';
import { buildWhatsappUrl, formatBrlFromCents } from '../../lib/validators';
import type { ShopOrder, ShopProduct } from '../../types/domain';

export function AdminShopTab() {
  const { products, orders, saveProduct, addOrder, updateOrder } = useAppData();
  const { notify } = useToast();

  // Novo produto
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('55.00');
  const [prodCategory, setProdCategory] = useState('Vestuário');
  const [prodImage, setProdImage] = useState('');
  const [prodSizesText, setProdSizesText] = useState('P:10,M:15,G:10,GG:5');

  // Venda externa ou Doação
  const [extProductId, setExtProductId] = useState(products[0]?.id || '');
  const [extSize, setExtSize] = useState(products[0]?.sizes[0]?.size || 'Único');
  const [extQty, setExtQty] = useState(1);
  const [extType, setExtType] = useState<'externo_pix' | 'doacao'>('externo_pix');
  const [extBuyerName, setExtBuyerName] = useState('');
  const [extBuyerPhone, setExtBuyerPhone] = useState('');
  const [extNotes, setExtNotes] = useState('');

  const [deliveryFilter, setDeliveryFilter] = useState<'todos' | 'pendentes' | 'entregues'>('pendentes');

  const selectedExtProduct = products.find((p) => p.id === extProductId) || products[0];

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

    const product: ShopProduct = {
      id: `prod-${Date.now().toString(36)}`,
      name: prodName.trim(),
      description: prodDesc.trim() || 'Produto oficial CAMBLU.',
      priceCents,
      images: prodImage.trim() ? [prodImage.trim()] : [],
      category: prodCategory,
      sizes,
      active: true,
    };

    await saveProduct(product);
    setProdName('');
    setProdDesc('');
    notify('Produto salvo no catálogo da Lojinha!');
  };

  const handleRegisterExternalOrDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExtProduct) return;
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
          quantity: extQty,
          unitPriceCents: unit,
        },
      ],
      subtotalCents: unit * extQty,
      discountCents: 0,
      totalCents: unit * extQty,
      paymentMethod: extType,
      paymentStatus: extType === 'doacao' ? 'donation' : 'paid',
      delivered: true,
      deliveredAt: new Date().toISOString(),
      notes: extNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addOrder(order);
    setExtBuyerName('');
    setExtBuyerPhone('');
    setExtNotes('');
    notify(
      extType === 'doacao'
        ? 'Doação / saída registrada e estoque atualizado!'
        : 'Venda externa registrada e estoque atualizado!',
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (deliveryFilter === 'pendentes') return !o.delivered;
    if (deliveryFilter === 'entregues') return o.delivered;
    return true;
  });

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Checklist de Entrega + Link WhatsApp (3.4) */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2>Checklist de Entregas da Lojinha (WhatsApp)</h2>
            <p className="text-muted">
              Controle entregas pendentes e abra conversa direta no WhatsApp do comprador.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {(['pendentes', 'entregues', 'todos'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className="m3-chip"
                aria-pressed={deliveryFilter === f}
                onClick={() => setDeliveryFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="m3-card m3-card--tonal"
              style={{
                padding: '1rem',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBlockEnd: '0.3rem' }}>
                  <span className={`m3-badge ${order.delivered ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                    {order.delivered ? 'Entregue' : 'Aguardando Entrega'}
                  </span>
                  <span className="m3-badge">{order.paymentMethod}</span>
                </div>
                <strong>{order.buyerName}</strong>
                <span className="m3-body-medium" style={{ display: 'block', fontSize: '0.88rem' }}>
                  {order.items.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', ')} · Total:{' '}
                  {formatBrlFromCents(order.totalCents)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                {order.buyerPhone && (
                  <a
                    href={buildWhatsappUrl(
                      order.buyerPhone,
                      `Olá ${order.buyerName.split(' ')[0]}! Seu pedido da Lojinha CAMBLU está pronto para entrega.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="m3-btn m3-btn--blue"
                  >
                    <Icon name="chat" size={18} />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  className={`m3-btn ${order.delivered ? 'm3-btn--outlined' : 'm3-btn--filled'}`}
                  onClick={() =>
                    updateOrder({
                      ...order,
                      delivered: !order.delivered,
                      deliveredAt: !order.delivered ? new Date().toISOString() : null,
                    })
                  }
                >
                  <Icon name={order.delivered ? 'undo' : 'check_circle'} size={18} />
                  <span>{order.delivered ? 'Desmarcar' : 'Marcar Entregue'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Lançar Venda Externa / Doação (3.3) */}
      <form onSubmit={handleRegisterExternalOrDonation} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Lançar Doação ou Venda Externa no Estoque</h2>
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

      {/* Adicionar Novo Produto */}
      <form onSubmit={handleSaveProduct} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Cadastrar Novo Produto na Lojinha</h2>
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
            <label htmlFor="p-price">Valor (R$, taxas Stripe inclusas)</label>
            <input id="p-price" className="m3-input" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="p-sizes">Tamanhos e estoque (ex.: P:10,M:15,G:10)</label>
            <input id="p-sizes" className="m3-input" value={prodSizesText} onChange={(e) => setProdSizesText(e.target.value)} />
          </div>
        </div>
        <div className="m3-field">
          <label htmlFor="p-img">URL da foto principal (opcional)</label>
          <input id="p-img" type="url" className="m3-input" value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
        </div>
        <div className="m3-field">
          <label htmlFor="p-desc">Descrição</label>
          <textarea id="p-desc" className="m3-textarea" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
        </div>
        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name="add_business" size={18} />
          <span>Adicionar Produto</span>
        </button>
      </form>
    </div>
  );
}
