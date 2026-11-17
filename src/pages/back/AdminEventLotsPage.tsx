import { useEffect, useState } from 'react';
import { useAdminEvent } from '../../components/admin/AdminEventShell';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { formatBrlFromCents } from '../../lib/validators';
import type { EventLot, EventQrDefinition } from '../../types/domain';

function centsToDecimalInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function parseDecimalReaisToCents(raw: string): number {
  const sanitized = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(sanitized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100));
}

export function AdminEventLotsPage() {
  const event = useAdminEvent();
  const { saveEvent } = useAppData();
  const { notify } = useToast();

  const [lots, setLots] = useState<EventLot[]>(event.lots);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [newLotName, setNewLotName] = useState('');
  const [newLotPriceReais, setNewLotPriceReais] = useState('45,00');
  const [newLotQty, setNewLotQty] = useState(80);
  const [newQrDefs, setNewQrDefs] = useState<EventQrDefinition[]>([
    {
      id: `qr-new-1`,
      label: 'Credenciamento Único',
      dateTime: event.startAt.slice(0, 16),
      certificateHours: 4,
    },
  ]);

  useEffect(() => {
    setLots(event.lots);
    const nextInputs: Record<string, string> = {};
    event.lots.forEach((l) => {
      nextInputs[l.id] = centsToDecimalInput(l.priceCents);
    });
    setPriceInputs(nextInputs);
  }, [event]);

  const handleSaveLots = async (updatedLots: EventLot[], message: string) => {
    setLots(updatedLots);
    await saveEvent({ ...event, lots: updatedLots });
    notify(message);
  };

  const updateLotField = <K extends keyof EventLot>(index: number, field: K, value: EventLot[K]) => {
    setLots((prev) => prev.map((l, idx) => (idx === index ? { ...l, [field]: value } : l)));
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLotName.trim()) {
      notify('Informe o nome do novo lote.', 'error');
      return;
    }
    const priceCents = parseDecimalReaisToCents(newLotPriceReais);
    const lot: EventLot = {
      id: `lot-${Date.now().toString(36)}`,
      name: newLotName.trim(),
      priceCents,
      totalQuantity: Math.max(1, Number(newLotQty) || 50),
      soldQuantity: 0,
      qrCodesPerTicket: newQrDefs.length,
      qrDefinitions: newQrDefs,
      active: true,
    };

    await handleSaveLots([...lots, lot], `Lote "${lot.name}" adicionado a ${event.title}!`);
    setNewLotName('');
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2>Lotes Cadastrados ({lots.length})</h2>
            <p className="text-muted">Ajuste preço, disponibilidade, status ativo e horas de cada sessão QR.</p>
          </div>
          <button
            type="button"
            className="m3-btn m3-btn--filled"
            onClick={() => handleSaveLots(lots, 'Alterações nos lotes salvas com sucesso!')}
          >
            <Icon name="save" size={18} />
            <span>Salvar Todos os Lotes</span>
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {lots.map((lot, idx) => {
            const remaining = Math.max(0, lot.totalQuantity - lot.soldQuantity);
            return (
              <div key={lot.id} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.85rem', padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`m3-badge ${lot.active ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                      {lot.active ? 'Ativo' : 'Pausado'}
                    </span>
                    <strong>{lot.name}</strong>
                    <span className="text-muted" style={{ fontSize: '0.84rem' }}>
                      {lot.soldQuantity} vendidos · {remaining} disponíveis · {formatBrlFromCents(lot.priceCents)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="m3-btn m3-btn--outlined"
                    style={{ minBlockSize: '36px' }}
                    onClick={() =>
                      handleSaveLots(
                        lots.map((item, i) => (i === idx ? { ...item, active: !item.active } : item)),
                        lot.active ? `Lote "${lot.name}" pausado.` : `Lote "${lot.name}" ativado!`,
                      )
                    }
                  >
                    <Icon name={lot.active ? 'pause_circle' : 'play_circle'} size={17} />
                    <span>{lot.active ? 'Pausar' : 'Ativar'}</span>
                  </button>
                </div>

                <div className="grid-cards">
                  <div className="m3-field">
                    <label htmlFor={`lot-n-${lot.id}`}>Nome do lote</label>
                    <input
                      id={`lot-n-${lot.id}`}
                      className="m3-input"
                      value={lot.name}
                      onChange={(e) => updateLotField(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="m3-field">
                    <label htmlFor={`lot-p-${lot.id}`}>Preço em R$ (use . ou , nos centavos)</label>
                    <input
                      id={`lot-p-${lot.id}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex.: 65,00 ou 65.50"
                      className="m3-input"
                      value={priceInputs[lot.id] ?? centsToDecimalInput(lot.priceCents)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setPriceInputs((prev) => ({ ...prev, [lot.id]: raw }));
                        updateLotField(idx, 'priceCents', parseDecimalReaisToCents(raw));
                      }}
                    />
                  </div>
                  <div className="m3-field">
                    <label htmlFor={`lot-q-${lot.id}`}>Quantidade total</label>
                    <input
                      id={`lot-q-${lot.id}`}
                      type="number"
                      min={lot.soldQuantity}
                      className="m3-input"
                      value={lot.totalQuantity}
                      onChange={(e) =>
                        updateLotField(idx, 'totalQuantity', Math.max(lot.soldQuantity, Number(e.target.value) || 0))
                      }
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  <strong style={{ fontSize: '0.84rem' }}>QR Codes deste lote ({lot.qrDefinitions.length})</strong>
                  {lot.qrDefinitions.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        fontSize: '0.84rem',
                        padding: '0.45rem 0.7rem',
                        borderRadius: 'var(--md-sys-shape-corner-sm)',
                        background: 'var(--md-sys-color-surface-container-lowest)',
                      }}
                    >
                      <span>{q.label}</span>
                      <strong>{q.certificateHours}h de certificado</strong>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <form onSubmit={handleAddLot} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Adicionar Novo Lote ao Evento</h2>
        <div className="grid-cards">
          <div className="m3-field">
            <label htmlFor="new-lot-name">Nome do lote</label>
            <input
              id="new-lot-name"
              className="m3-input"
              required
              placeholder="Ex.: 2º Lote Acadêmicos"
              value={newLotName}
              onChange={(e) => setNewLotName(e.target.value)}
            />
          </div>
          <div className="m3-field">
            <label htmlFor="new-lot-price">Valor em R$ (use . ou ,)</label>
            <input
              id="new-lot-price"
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 45,00 ou 45.50"
              className="m3-input"
              value={newLotPriceReais}
              onChange={(e) => setNewLotPriceReais(e.target.value)}
            />
          </div>
          <div className="m3-field">
            <label htmlFor="new-lot-qty">Quantidade disponível</label>
            <input
              id="new-lot-qty"
              type="number"
              min={1}
              className="m3-input"
              value={newLotQty}
              onChange={(e) => setNewLotQty(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="m3-label-large">Sessões QR do lote ({newQrDefs.length})</span>
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              onClick={() =>
                setNewQrDefs((prev) => [
                  ...prev,
                  {
                    id: `qr-${Date.now().toString(36)}-${prev.length + 1}`,
                    label: `Sessão ${prev.length + 1}`,
                    dateTime: event.startAt.slice(0, 16),
                    certificateHours: 2,
                  },
                ])
              }
            >
              <Icon name="add" size={18} />
              <span>Adicionar Sessão QR</span>
            </button>
          </div>
          {newQrDefs.map((q, idx) => (
            <div key={q.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <input
                type="text"
                className="m3-input"
                style={{ flex: '2 1 12rem' }}
                value={q.label}
                onChange={(e) =>
                  setNewQrDefs((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                }
              />
              <input
                type="datetime-local"
                className="m3-input"
                style={{ flex: '1 1 11rem' }}
                value={q.dateTime.slice(0, 16)}
                onChange={(e) =>
                  setNewQrDefs((prev) => prev.map((x, i) => (i === idx ? { ...x, dateTime: e.target.value } : x)))
                }
              />
              <input
                type="number"
                className="m3-input"
                style={{ flex: '0 1 7rem' }}
                aria-label="Horas de certificado"
                value={q.certificateHours}
                onChange={(e) =>
                  setNewQrDefs((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, certificateHours: Number(e.target.value) } : x)),
                  )
                }
              />
            </div>
          ))}
        </div>

        <button type="submit" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
          <Icon name="add_circle" size={18} />
          <span>Adicionar Lote</span>
        </button>
      </form>
    </div>
  );
}
