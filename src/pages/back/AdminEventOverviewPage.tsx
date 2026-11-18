import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EventColorWheelPicker } from '../../components/admin/EventColorWheelPicker';
import { useAdminEvent } from '../../components/admin/AdminEventShell';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import {
  DEFAULT_EVENT_PALETTE,
  DEFAULT_SECIMED_PALETTE,
  resolveEventPalette,
} from '../../lib/colorHarmony';
import type { EventPaletteConfig } from '../../types/domain';

const SECIMED_FEATURE_SLOTS = [
  { id: 'palestras', label: 'Palestras Magnas' },
  { id: 'workshops', label: 'Workshops Práticos' },
  { id: 'rodas', label: 'Rodas de Conversa' },
  { id: 'trabalhos', label: 'Mostra Científica' },
  { id: 'networking', label: 'Networking' },
  { id: 'coffee', label: 'Coffee Break' },
  { id: 'brindes', label: 'Brindes & Sorteios' },
];

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '2026-12-10T19:00';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Admin event general configuration including hybrid modes, archival toggle,
 * and SECIMED custom 4-color theme + feature photo management.
 */
export function AdminEventOverviewPage() {
  const event = useAdminEvent();
  const { saveEvent } = useAppData();
  const { notify } = useToast();

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [imageUrl, setImageUrl] = useState(event.imageUrl);
  const [maxCapacity, setMaxCapacity] = useState(event.maxCapacity);
  const [mode, setMode] = useState<'presencial' | 'virtual' | 'misto'>(event.mode);
  const [locationShort, setLocationShort] = useState(event.locationShort);
  const [mapsUrl, setMapsUrl] = useState(event.mapsUrl || '');
  const [virtualAccessUrl, setVirtualAccessUrl] = useState(event.virtualAccessUrl || '');
  const [startAt, setStartAt] = useState(() => toLocalInputValue(event.startAt));
  const [hasCoffee, setHasCoffee] = useState(event.hasCoffee);
  const [isSecimed, setIsSecimed] = useState(event.isSecimed);
  const [published, setPublished] = useState(event.published);
  const [archived, setArchived] = useState(Boolean(event.archived));
  const [eventPalette, setEventPalette] = useState<EventPaletteConfig>(
    () => resolveEventPalette(event),
  );
  const [secimedFeaturePhotos, setSecimedFeaturePhotos] = useState<Record<string, string>>(
    () => event.secimedFeaturePhotos || {},
  );

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description);
    setImageUrl(event.imageUrl);
    setMaxCapacity(event.maxCapacity);
    setMode(event.mode);
    setLocationShort(event.locationShort);
    setMapsUrl(event.mapsUrl || '');
    setVirtualAccessUrl(event.virtualAccessUrl || '');
    setStartAt(toLocalInputValue(event.startAt));
    setHasCoffee(event.hasCoffee);
    setIsSecimed(event.isSecimed);
    setPublished(event.published);
    setArchived(Boolean(event.archived));
    setEventPalette(resolveEventPalette(event));
    setSecimedFeaturePhotos(event.secimedFeaturePhotos || {});
  }, [event]);

  const handleFeaturePhotoUpload = (slotId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setSecimedFeaturePhotos((prev) => ({ ...prev, [slotId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEvent({
      ...event,
      title: title.trim() || event.title,
      description: description.trim() || event.description,
      imageUrl: imageUrl.trim(),
      maxCapacity: Number(maxCapacity) || event.maxCapacity,
      mode,
      locationShort: locationShort.trim(),
      mapsUrl: mode === 'presencial' || mode === 'misto' ? mapsUrl.trim() || undefined : undefined,
      virtualAccessUrl: mode === 'virtual' || mode === 'misto' ? virtualAccessUrl.trim() || undefined : undefined,
      category: isSecimed ? 'secimed' : hasCoffee ? 'camblu_coffee' : 'academico',
      hasCoffee,
      isSecimed,
      published,
      archived,
      palette: eventPalette,
      secimedPalette: isSecimed ? eventPalette : undefined,
      secimedFeaturePhotos: isSecimed ? secimedFeaturePhotos : undefined,
      startAt: new Date(startAt).toISOString(),
    });
    notify('Informações do evento atualizadas!');
  };

  const basePath = `/back/eventos/${event.id}`;

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="grid-cards">
        <Link to={`${basePath}/lotes`} className="m3-card m3-card--interactive" style={{ textDecoration: 'none', display: 'grid', gap: '0.35rem' }}>
          <Icon name="confirmation_number" size={24} className="m3-badge--blue" />
          <h3>Lotes & Sessões QR</h3>
          <p className="text-muted">Gerenciar {event.lots.length} lote(s), preços e cargas horárias.</p>
        </Link>
        <Link to={`${basePath}/participantes`} className="m3-card m3-card--interactive" style={{ textDecoration: 'none', display: 'grid', gap: '0.35rem' }}>
          <Icon name="group" size={24} className="m3-badge--blue" />
          <h3>Participantes</h3>
          <p className="text-muted">Consultar ingressos emitidos, CPFs e confirmar presenças.</p>
        </Link>
        <Link to={`${basePath}/certificados`} className="m3-card m3-card--interactive" style={{ textDecoration: 'none', display: 'grid', gap: '0.35rem' }}>
          <Icon name="workspace_premium" size={24} className="m3-badge--blue" />
          <h3>Certificados</h3>
          <p className="text-muted">Posicionar arte Canva PNG e revisar certificados emitidos.</p>
        </Link>
        <Link to={`${basePath}/qr`} className="m3-card m3-card--interactive" style={{ textDecoration: 'none', display: 'grid', gap: '0.35rem' }}>
          <Icon name="qr_code_scanner" size={24} className="m3-badge--blue" />
          <h3>Ler QR Code</h3>
          <p className="text-muted">Validar entradas na portaria pela câmera ou CPF.</p>
        </Link>
      </div>

      <form onSubmit={handleSave} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2>Editar Dados Gerais do Evento</h2>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ed-ev-title">Título do evento</label>
            <input id="ed-ev-title" className="m3-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-ev-img">URL da imagem de capa</label>
            <input id="ed-ev-img" type="url" className="m3-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
        </div>

        <div className="m3-field">
          <label htmlFor="ed-ev-desc">Descrição</label>
          <textarea id="ed-ev-desc" className="m3-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ed-ev-cap">Capacidade máxima</label>
            <input id="ed-ev-cap" type="number" className="m3-input" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-ev-start">Data e hora de início</label>
            <input id="ed-ev-start" type="datetime-local" className="m3-input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
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
            <span>Inclui Coffee Break (informativo)</span>
          </label>
          <label className="m3-chip">
            <input type="checkbox" checked={isSecimed} onChange={(e) => setIsSecimed(e.target.checked)} />
            <span>SECIMED (Grátis Épico/Lendário · 10% Raro)</span>
          </label>
          <label className="m3-chip">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>Publicado no portal</span>
          </label>
          <label className="m3-chip">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            <span>Arquivar evento no catálogo</span>
          </label>
        </div>

        <div className="grid-two">
          <div className="m3-field">
            <label htmlFor="ed-ev-loc">Local curto</label>
            <input id="ed-ev-loc" className="m3-input" value={locationShort} onChange={(e) => setLocationShort(e.target.value)} />
          </div>
          {(mode === 'presencial' || mode === 'misto') && (
            <div className="m3-field">
              <label htmlFor="ed-ev-maps">Google Maps</label>
              <input id="ed-ev-maps" type="url" className="m3-input" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
            </div>
          )}
          {(mode === 'virtual' || mode === 'misto') && (
            <div className="m3-field">
              <label htmlFor="ed-ev-vlink">Link de acesso virtual</label>
              <input id="ed-ev-vlink" type="url" className="m3-input" value={virtualAccessUrl} onChange={(e) => setVirtualAccessUrl(e.target.value)} />
            </div>
          )}
        </div>

        <EventColorWheelPicker
          value={eventPalette}
          onChange={setEventPalette}
          defaultPalette={isSecimed ? DEFAULT_SECIMED_PALETTE : DEFAULT_EVENT_PALETTE}
          eventTitlePreview={title}
          hasCoffeePreview={hasCoffee}
        />

        {isSecimed && (
          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h3>Fotos dos Destaques na Página /secimed</h3>
              <p className="text-muted">Envie imagens específicas para cada bloco temático da edição da SECIMED.</p>
            </div>

            <div className="grid-two">
              {SECIMED_FEATURE_SLOTS.map((slot) => (
                <div key={slot.id} className="m3-field">
                  <label htmlFor={`secimed-pic-${slot.id}`}>Foto: {slot.label}</label>
                  <input
                    id={`secimed-pic-${slot.id}`}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleFeaturePhotoUpload(slot.id, e.target.files?.[0])}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
          <Icon name="save" size={18} />
          <span>Salvar Alterações do Evento</span>
        </button>
      </form>
    </div>
  );
}
