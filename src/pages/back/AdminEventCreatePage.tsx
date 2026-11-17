import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { slugify } from '../../lib/validators';
import type { CambluEvent, EventLot, EventQrDefinition } from '../../types/domain';

export function AdminEventCreatePage() {
  const { saveEvent } = useAppData();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(120);
  const [mode, setMode] = useState<'presencial' | 'virtual' | 'misto'>('presencial');
  const [locationShort, setLocationShort] = useState('Auditório Bloco J — FURB Campus 1');
  const [mapsUrl, setMapsUrl] = useState('https://maps.google.com/?q=FURB+Blumenau');
  const [virtualAccessUrl, setVirtualAccessUrl] = useState('');
  const [startAt, setStartAt] = useState('2026-12-10T19:00');
  const [isSecimed, setIsSecimed] = useState(false);
  const [hasCoffee, setHasCoffee] = useState(true);

  const [lotName, setLotName] = useState('1º Lote');
  const [lotPriceReais, setLotPriceReais] = useState('35.00');
  const [lotQuantity, setLotQuantity] = useState(100);
  const [qrDefs, setQrDefs] = useState<EventQrDefinition[]>([
    { id: 'qr-1', label: 'Credenciamento Único', dateTime: '2026-12-10T19:00', certificateHours: 4 },
  ]);

  const handleAddQrDef = () => {
    setQrDefs((prev) => [
      ...prev,
      {
        id: `qr-${prev.length + 1}`,
        label: `Sessão ${prev.length + 1}`,
        dateTime: startAt,
        certificateHours: 2,
      },
    ]);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notify('Informe o nome do evento.', 'error');
      return;
    }

    const priceCents = Math.max(0, Math.round(Number(lotPriceReais.replace(',', '.')) * 100));
    const lot: EventLot = {
      id: `lot-${Date.now().toString(36)}`,
      name: lotName.trim() || 'Lote Único',
      priceCents,
      totalQuantity: Number(lotQuantity) || 50,
      soldQuantity: 0,
      qrCodesPerTicket: qrDefs.length,
      qrDefinitions: qrDefs,
      active: true,
    };

    const newEv: CambluEvent = {
      id: `evt-${Date.now().toString(36)}`,
      slug: slugify(title),
      title: title.trim(),
      description: description.trim() || 'Evento oficial organizado pelo CAMBLU — Medicina FURB.',
      imageUrl: imageUrl.trim(),
      maxCapacity: Number(maxCapacity) || 100,
      mode,
      locationShort: locationShort.trim(),
      mapsUrl: mode === 'presencial' || mode === 'misto' ? mapsUrl.trim() || undefined : undefined,
      virtualAccessUrl: mode === 'virtual' || mode === 'misto' ? virtualAccessUrl.trim() || undefined : undefined,
      category: isSecimed ? 'secimed' : hasCoffee ? 'camblu_coffee' : 'academico',
      isSecimed,
      hasCoffee,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(startAt).toISOString(),
      lots: [lot],
      published: true,
      createdAt: new Date().toISOString(),
    };

    await saveEvent(newEv);
    notify('Evento publicado com sucesso!');
    navigate(`/back/eventos/${newEv.id}`);
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Criar Novo Evento</h1>
        <p className="text-muted">
          Defina as informações iniciais, o primeiro lote e os QR Codes de presença com carga horária. Após publicar, você poderá gerenciar tudo na página do evento.
        </p>
      </header>

      <form onSubmit={handleCreateEvent} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ev-title">Nome do evento</label>
            <input
              id="ev-title"
              type="text"
              className="m3-input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="m3-field">
            <label htmlFor="ev-img">URL da imagem de capa (opcional)</label>
            <input
              id="ev-img"
              type="url"
              className="m3-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="m3-field">
          <label htmlFor="ev-desc">Descrição do evento</label>
          <textarea
            id="ev-desc"
            className="m3-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ev-cap">Capacidade máxima</label>
            <input
              id="ev-cap"
              type="number"
              className="m3-input"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
            />
          </div>
          <div className="m3-field">
            <label htmlFor="ev-start">Data e hora</label>
            <input
              id="ev-start"
              type="datetime-local"
              className="m3-input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <label className="m3-chip">
            <input type="radio" checked={mode === 'presencial'} onChange={() => setMode('presencial')} />
            <span>Presencial</span>
          </label>
          <label className="m3-chip">
            <input type="radio" checked={mode === 'virtual'} onChange={() => setMode('virtual')} />
            <span>Virtual</span>
          </label>
          <label className="m3-chip">
            <input type="radio" checked={mode === 'misto'} onChange={() => setMode('misto')} />
            <span>Misto (Presencial + Virtual)</span>
          </label>
          <label className="m3-chip">
            <input type="checkbox" checked={hasCoffee} onChange={(e) => setHasCoffee(e.target.checked)} />
            <span>Tem Coffee (Clube Raro grátis)</span>
          </label>
          <label className="m3-chip">
            <input type="checkbox" checked={isSecimed} onChange={(e) => setIsSecimed(e.target.checked)} />
            <span>SECIMED (Grátis Épico/Lendário)</span>
          </label>
        </div>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ev-loc">Descrição curta do local</label>
            <input
              id="ev-loc"
              type="text"
              className="m3-input"
              value={locationShort}
              onChange={(e) => setLocationShort(e.target.value)}
            />
          </div>
          {(mode === 'presencial' || mode === 'misto') && (
            <div className="m3-field">
              <label htmlFor="ev-maps">Link do Google Maps</label>
              <input
                id="ev-maps"
                type="url"
                className="m3-input"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
              />
            </div>
          )}
          {(mode === 'virtual' || mode === 'misto') && (
            <div className="m3-field">
              <label htmlFor="ev-vlink">Link de acesso virtual</label>
              <input
                id="ev-vlink"
                type="url"
                className="m3-input"
                value={virtualAccessUrl}
                onChange={(e) => setVirtualAccessUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', padding: '1rem' }}>
          <strong>Configuração do Lote Inicial & QR Codes</strong>
          <div className="grid-cards">
            <div className="m3-field">
              <label htmlFor="lot-name">Nome do lote</label>
              <input id="lot-name" className="m3-input" value={lotName} onChange={(e) => setLotName(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="lot-price">Valor do lote (R$)</label>
              <input id="lot-price" className="m3-input" value={lotPriceReais} onChange={(e) => setLotPriceReais(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="lot-qty">Ingressos disponíveis</label>
              <input id="lot-qty" type="number" className="m3-input" value={lotQuantity} onChange={(e) => setLotQuantity(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="m3-label-large">QR Codes por ingresso ({qrDefs.length})</span>
              <button type="button" className="m3-btn m3-btn--outlined" onClick={handleAddQrDef}>
                <Icon name="add" size={18} />
                <span>Adicionar QR Code</span>
              </button>
            </div>
            {qrDefs.map((q, idx) => (
              <div key={q.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="m3-input"
                  style={{ flex: '2 1 12rem' }}
                  value={q.label}
                  onChange={(e) =>
                    setQrDefs((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Rótulo do QR (ex.: Dia 1)"
                />
                <input
                  type="datetime-local"
                  className="m3-input"
                  style={{ flex: '1 1 11rem' }}
                  value={q.dateTime.slice(0, 16)}
                  onChange={(e) =>
                    setQrDefs((prev) => prev.map((x, i) => (i === idx ? { ...x, dateTime: e.target.value } : x)))
                  }
                />
                <input
                  type="number"
                  className="m3-input"
                  style={{ flex: '0 1 7rem' }}
                  value={q.certificateHours}
                  onChange={(e) =>
                    setQrDefs((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, certificateHours: Number(e.target.value) } : x)),
                    )
                  }
                  aria-label="Horas de certificado"
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name="add_circle" size={19} />
          <span>Publicar Evento</span>
        </button>
      </form>
    </div>
  );
}
