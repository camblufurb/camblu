import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../ToastProvider';
import { Icon } from '../Icon';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../../lib/certificateRenderer';
import { formatBrlFromCents, slugify } from '../../lib/validators';
import { API_BASE_URL, getAuthHeaders, isFirebaseConfigured } from '../../lib/firebase';
import type { CambluEvent, CertificateRecord, CertificateTemplateConfig, EventLot, EventQrDefinition } from '../../types/domain';

type TemplateFieldKey = 'name' | 'cpf' | 'event' | 'hours' | 'date' | 'code';

export function AdminEventsTab() {
  const { events, tickets, certificates, saveEvent, updateTicket, upsertCertificate } = useAppData();
  const { notify } = useToast();

  // New / Edit Event state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(120);
  const [mode, setMode] = useState<'presencial' | 'virtual'>('presencial');
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

  // QR Scanner state
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Certificate Template Editor state
  const [certEventId, setCertEventId] = useState<string>(events[0]?.id || '');
  const [activeField, setActiveField] = useState<TemplateFieldKey>('name');
  const targetEvent = events.find((e) => e.id === certEventId) || events[0];
  const [tplConfig, setTplConfig] = useState<CertificateTemplateConfig>(
    () => targetEvent?.certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE,
  );

  useEffect(() => {
    if (targetEvent) {
      setTplConfig(targetEvent.certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE);
    }
  }, [certEventId, targetEvent]);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

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
      mapsUrl: mode === 'presencial' ? mapsUrl.trim() : undefined,
      virtualAccessUrl: mode === 'virtual' ? virtualAccessUrl.trim() : undefined,
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
    setTitle('');
    setDescription('');
    notify('Evento publicado com sucesso!');
  };

  const validateQrCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    if (isFirebaseConfigured) {
      try {
        const res = await fetch(`${API_BASE_URL}/tickets/checkin`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({ qrCode: code }),
        });
        if (res.ok) {
          const data = (await res.json()) as { ownerName: string; totalHours: number };
          setManualCode('');
          notify(`Presença confirmada: ${data.ownerName} (Total ${data.totalHours}h)!`);
          return;
        }
      } catch {
        // fallback to client store if Functions not yet deployed
      }
    }

    const ticket = tickets.find((t) => t.qrInstances.some((q) => q.qrCode === code));
    if (!ticket) {
      notify(`QR Code "${code}" não encontrado.`, 'error');
      return;
    }

    const qrItem = ticket.qrInstances.find((q) => q.qrCode === code)!;
    if (qrItem.checkedInAt) {
      notify(`QR Code já validado anteriormente para ${ticket.ownerName}.`, 'info');
      return;
    }

    const updatedInstances = ticket.qrInstances.map((q) =>
      q.qrCode === code
        ? { ...q, checkedInAt: new Date().toISOString(), checkedInBy: 'camblufurb@gmail.com' }
        : q,
    );
    const updatedTicket = { ...ticket, qrInstances: updatedInstances };
    await updateTicket(updatedTicket);

    // Soma horas de todos os QRs validados neste evento e emite/atualiza certificado automático!
    const totalHours = updatedInstances
      .filter((q) => Boolean(q.checkedInAt))
      .reduce((acc, q) => acc + q.certificateHours, 0);

    const existingCert = certificates.find(
      (c) => c.ticketId === ticket.id && c.eventId === ticket.eventId,
    );
    const ev = events.find((e) => e.id === ticket.eventId);

    const certRecord: CertificateRecord = {
      id: existingCert?.id || `cert-${ticket.id}`,
      code: existingCert?.code || `CAMBLU-${new Date().getFullYear()}-${ticket.id.slice(-5).toUpperCase()}`,
      ticketId: ticket.id,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDateLabel: ev
        ? new Date(ev.startAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })
        : 'Blumenau/SC',
      ownerUid: ticket.ownerUid,
      ownerName: ticket.ownerName,
      ownerCpf: ticket.ownerCpf,
      totalHours,
      issuedAt: new Date().toISOString(),
      templateConfig: ev?.certificateTemplate,
    };

    await upsertCertificate(certRecord);
    setManualCode('');
    notify(`Presença confirmada: ${ticket.ownerName} (+${qrItem.certificateHours}h -> Total ${totalHours}h)!`);
  };

  const startCameraScanner = async () => {
    try {
      setScanning(true);
      const scanner = new Html5Qrcode('camblu-qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          validateQrCode(decoded);
        },
        () => {},
      );
    } catch {
      setScanning(false);
      notify('Câmera indisponível neste dispositivo. Use o campo de código manual abaixo.', 'info');
    }
  };

  const stopCameraScanner = async () => {
    await scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  const handleUploadCanvaPng = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        setTplConfig((prev) => ({
          ...prev,
          templateImageUrl: reader.result as string,
          templateWidthPx: img.naturalWidth || 1754,
          templateHeightPx: img.naturalHeight || 1240,
        }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const yPercent = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setTplConfig((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [activeField]: {
          ...prev.fields[activeField],
          xPercent,
          yPercent,
        },
      },
    }));
  };

  const handleSaveTemplate = async () => {
    if (!targetEvent) return;
    await saveEvent({ ...targetEvent, certificateTemplate: tplConfig });
    notify(`Template de certificado salvo para "${targetEvent.title}"!`);
  };

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Leitor de QR Code na Portaria */}
      <article className="m3-card m3-card--gold" style={{ display: 'grid', gap: '1rem' }}>
        <h2 className="m3-title-large">Validação de Ingressos & Presença por QR Code</h2>
        <p className="m3-body-medium" style={{ color: '#2b2100' }}>
          Leia o QR Code do participante com a câmera ou digite o código abaixo para validar entrada e liberar horas
          de certificado automaticamente.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {!scanning ? (
            <button type="button" className="m3-btn m3-btn--filled" onClick={startCameraScanner}>
              <Icon name="qr_code_scanner" size={18} />
              <span>Abrir Câmera QR</span>
            </button>
          ) : (
            <button type="button" className="m3-btn m3-btn--outlined" onClick={stopCameraScanner}>
              <Icon name="stop_circle" size={18} />
              <span>Parar Câmera</span>
            </button>
          )}
          <input
            type="text"
            className="m3-input"
            style={{ flex: '1 1 16rem', background: '#ffffff', color: '#141d18' }}
            placeholder="Ou cole o código (ex.: CAMBLU-SECIMED-WS-M98224)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            onClick={() => validateQrCode(manualCode)}
          >
            Validar Código
          </button>
        </div>

        <div id="camblu-qr-reader" style={{ maxInlineSize: '22rem' }} />
      </article>

      {/* Criar Novo Evento */}
      <form onSubmit={handleCreateEvent} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <h2 className="m3-title-large">Criar Novo Evento (Lotes, QR Codes & Carga Horária)</h2>

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
          {mode === 'presencial' ? (
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
          ) : (
            <div className="m3-field">
              <label htmlFor="ev-vlink">Link de acesso virtual (liberado próximo ao evento)</label>
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
              <label htmlFor="lot-price">Valor (R$, taxas inclusas)</label>
              <input id="lot-price" className="m3-input" value={lotPriceReais} onChange={(e) => setLotPriceReais(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="lot-qty">Ingressos disponíveis</label>
              <input id="lot-qty" type="number" className="m3-input" value={lotQuantity} onChange={(e) => setLotQuantity(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Editor Visual de Template de Certificado (Canva PNG) */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2 className="m3-title-large">Editor Visual de Certificados (Template PNG do Canva)</h2>
            <p className="m3-body-medium">
              Exporte sua arte do Canva em <strong>PNG de alta resolução (A4 paisagem)</strong>, selecione um campo e
              clique na imagem onde o dado deve aparecer.
            </p>
          </div>
          <select
            className="m3-select"
            style={{ inlineSize: 'auto' }}
            value={certEventId}
            onChange={(e) => setCertEventId(e.target.value)}
            aria-label="Evento do certificado"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleUploadCanvaPng(e.target.files?.[0])} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {(['name', 'cpf', 'event', 'hours', 'date', 'code'] as TemplateFieldKey[]).map((fk) => (
              <button
                key={fk}
                type="button"
                className="m3-chip"
                aria-pressed={activeField === fk}
                onClick={() => setActiveField(fk)}
              >
                Posicionar: {fk.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={handleTemplateClick}
          role="button"
          tabIndex={0}
          aria-label="Área clicável para posicionar campos do certificado"
          style={{
            position: 'relative',
            inlineSize: '100%',
            aspectRatio: `${tplConfig.templateWidthPx} / ${tplConfig.templateHeightPx}`,
            background: tplConfig.templateImageUrl
              ? `url("${tplConfig.templateImageUrl}") center / cover no-repeat`
              : 'linear-gradient(135deg, #fbfcf9, #e1ebe4)',
            border: '2px dashed var(--md-sys-color-primary)',
            borderRadius: 'var(--md-sys-shape-corner-md)',
            cursor: 'crosshair',
            overflow: 'hidden',
          }}
        >
          {(['name', 'cpf', 'event', 'hours', 'date', 'code'] as TemplateFieldKey[]).map((fk) => {
            const pos = tplConfig.fields[fk];
            return (
              <span
                key={fk}
                style={{
                  position: 'absolute',
                  left: `${pos.xPercent}%`,
                  top: `${pos.yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  padding: '0.18rem 0.5rem',
                  borderRadius: '0.4rem',
                  background: activeField === fk ? '#3b82f7' : 'rgb(15 51 37 / 0.85)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {`{${fk}} (${pos.xPercent}%, ${pos.yPercent}%)`}
              </span>
            );
          })}
        </div>

        <button type="button" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }} onClick={handleSaveTemplate}>
          <Icon name="save" size={18} />
          <span>Salvar Posições no Evento</span>
        </button>
      </article>

      {/* Lista rápida de eventos existentes */}
      <article className="m3-card">
        <h3 className="m3-title-medium" style={{ marginBlockEnd: '0.75rem' }}>
          Eventos Cadastrados ({events.length})
        </h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '0.5rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--md-sys-shape-corner-md)',
                background: 'var(--md-sys-color-surface-container-low)',
              }}
            >
              <strong>{ev.title}</strong>
              <span>
                {ev.lots.reduce((a, l) => a + l.soldQuantity, 0)} vendidos ·{' '}
                {formatBrlFromCents(ev.lots[0]?.priceCents || 0)}
              </span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
