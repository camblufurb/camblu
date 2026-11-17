import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdminEvent } from '../../components/admin/AdminEventShell';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { validateTicketQrCheckin, type CheckinValidationResult } from '../../lib/adminCheckin';
import { digitsOnly, formatCpf } from '../../lib/validators';

export function AdminEventQrPage() {
  const event = useAdminEvent();
  const { events, tickets, certificates, updateTicket, upsertCertificate } = useAppData();
  const { notify } = useToast();

  const [cpfInput, setCpfInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<CheckinValidationResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const cleanCpfQuery = digitsOnly(cpfInput);

  const matchingEventTickets = useMemo(() => {
    if (cleanCpfQuery.length < 3) return [];
    return tickets.filter(
      (t) => t.eventId === event.id && digitsOnly(t.ownerCpf).includes(cleanCpfQuery),
    );
  }, [tickets, event.id, cleanCpfQuery]);

  const hasTicketsOnlyInOtherEvents = useMemo(() => {
    if (cleanCpfQuery.length < 11 || matchingEventTickets.length > 0) return false;
    return tickets.some(
      (t) => t.eventId !== event.id && digitsOnly(t.ownerCpf) === cleanCpfQuery,
    );
  }, [tickets, event.id, cleanCpfQuery, matchingEventTickets.length]);

  const pendingParticipantsSample = useMemo(() => {
    const seen = new Set<string>();
    return tickets
      .filter((t) => t.eventId === event.id && t.qrInstances.some((q) => !q.checkedInAt))
      .filter((t) => {
        const cpf = digitsOnly(t.ownerCpf);
        if (!cpf || seen.has(cpf)) return false;
        seen.add(cpf);
        return true;
      })
      .slice(0, 4);
  }, [tickets, event.id]);

  const eventCheckins = useMemo(() => {
    return tickets
      .filter((t) => t.eventId === event.id)
      .flatMap((t) =>
        t.qrInstances
          .filter((q) => Boolean(q.checkedInAt))
          .map((q) => ({
            qrCode: q.qrCode,
            ownerName: t.ownerName,
            ownerCpf: t.ownerCpf,
            label: q.label,
            certificateHours: q.certificateHours,
            checkedInAt: q.checkedInAt!,
          })),
      )
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
  }, [tickets, event.id]);

  const handleValidateQrCode = async (rawCode: string) => {
    const result = await validateTicketQrCheckin({
      rawCode,
      expectedEventId: event.id,
      events,
      tickets,
      certificates,
      updateTicket,
      upsertCertificate,
    });
    setLastResult(result);
    if (result.status === 'ok') {
      notify(result.message);
    } else if (result.status === 'already') {
      notify(result.message, 'info');
    } else {
      notify(result.message, 'error');
    }
  };

  const startCameraScanner = async () => {
    try {
      setScanning(true);
      const scanner = new Html5Qrcode('camblu-event-qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decoded) => {
          handleValidateQrCode(decoded);
        },
        () => {},
      );
    } catch {
      setScanning(false);
      notify('Câmera indisponível neste dispositivo. Busque o participante pelo CPF abaixo.', 'info');
    }
  };

  const stopCameraScanner = async () => {
    await scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <article className="m3-card m3-card--gold" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Portaria: Leitor QR Code & Busca por CPF</h2>
          <p style={{ color: '#2b2100' }}>
            Leia o QR Code pela câmera ou digite o <strong>CPF do participante</strong> para listar os ingressos de{' '}
            <strong>{event.title}</strong> e confirmar a presença na hora.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
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
            type="search"
            inputMode="numeric"
            className="m3-input"
            style={{ flex: '1 1 18rem', background: '#ffffff', color: '#141d18' }}
            placeholder="Digite o CPF do participante (ex.: 529.982.247-25)"
            aria-label="Buscar ingressos por CPF"
            value={cpfInput}
            onChange={(e) => setCpfInput(e.target.value)}
          />
          {cpfInput && (
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              style={{ background: '#ffffff' }}
              onClick={() => setCpfInput('')}
            >
              Limpar
            </button>
          )}
        </div>

        <div id="camblu-event-qr-reader" style={{ maxInlineSize: '22rem' }} />

        {pendingParticipantsSample.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 650 }}>Participantes com QRs pendentes:</span>
            {pendingParticipantsSample.map((t) => (
              <button
                key={t.id}
                type="button"
                className="m3-chip"
                style={{ background: '#ffffff' }}
                onClick={() => setCpfInput(formatCpf(t.ownerCpf))}
              >
                {t.ownerName.split(' ')[0]} · {formatCpf(t.ownerCpf)}
              </button>
            ))}
          </div>
        )}

        {lastResult && (
          <div
            className="m3-card"
            style={{
              padding: '0.85rem 1rem',
              borderColor:
                lastResult.status === 'ok'
                  ? 'var(--md-sys-color-success)'
                  : lastResult.status === 'already'
                    ? 'var(--camblu-action-blue)'
                    : 'var(--md-sys-color-error)',
            }}
          >
            <strong>{lastResult.message}</strong>
          </div>
        )}

        {cleanCpfQuery.length >= 3 && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {matchingEventTickets.length === 0 ? (
              <div className="m3-card" style={{ padding: '0.95rem 1.1rem' }}>
                <p className="text-muted">
                  {hasTicketsOnlyInOtherEvents
                    ? `O CPF ${formatCpf(cleanCpfQuery)} possui ingressos apenas em outro evento, não em "${event.title}".`
                    : `Nenhum ingresso encontrado em "${event.title}" para o CPF informado.`}
                </p>
              </div>
            ) : (
              matchingEventTickets.map((ticket) => (
                <div key={ticket.id} className="m3-card" style={{ display: 'grid', gap: '0.75rem', padding: '1rem 1.15rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <div>
                      <strong>{ticket.ownerName}</strong>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.84rem' }}>
                        CPF {formatCpf(ticket.ownerCpf)} · {ticket.lotName} · {ticket.ownerEmail}
                      </span>
                    </div>
                    <span className="m3-badge m3-badge--blue">{ticket.qrInstances.length} QR(s)</span>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {ticket.qrInstances.map((q) => (
                      <div
                        key={q.qrCode}
                        className="m3-card m3-card--tonal"
                        style={{
                          padding: '0.7rem 0.9rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.65rem',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.92rem', display: 'block' }}>{q.label}</strong>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {new Date(q.dateTime).toLocaleString('pt-BR')} · Carga horária: {q.certificateHours}h
                          </span>
                        </div>

                        {q.checkedInAt ? (
                          <span className="m3-badge m3-badge--success">
                            <Icon name="check_circle" size={15} />
                            Confirmado em {new Date(q.checkedInAt).toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="m3-btn m3-btn--blue"
                            style={{ minBlockSize: '38px' }}
                            onClick={() => handleValidateQrCode(q.qrCode)}
                          >
                            <Icon name="how_to_reg" size={17} />
                            <span>Confirmar Presença (+{q.certificateHours}h)</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </article>

      <article className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
        <h2>Últimos Check-ins Confirmados ({eventCheckins.length})</h2>
        {eventCheckins.length === 0 ? (
          <p className="text-muted">Nenhuma leitura realizada ainda neste evento.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {eventCheckins.map((item) => (
              <div
                key={item.qrCode}
                className="m3-card m3-card--tonal"
                style={{
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{item.ownerName}</strong>
                  <span className="text-muted" style={{ display: 'block', fontSize: '0.82rem' }}>
                    CPF {formatCpf(item.ownerCpf)} · {item.label}
                  </span>
                </div>
                <span className="m3-badge m3-badge--success">
                  +{item.certificateHours}h · {new Date(item.checkedInAt).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
