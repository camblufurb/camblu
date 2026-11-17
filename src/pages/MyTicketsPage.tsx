import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../components/ToastProvider';
import { M3Dialog } from '../components/M3Dialog';
import { Icon } from '../components/Icon';
import { digitsOnly, formatCpf, isValidCpf } from '../lib/validators';
import type { Ticket, TicketQrInstance } from '../types/domain';
import { API_BASE_URL, getAuthHeaders } from '../lib/firebase';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function QrLargeDialogCanvas({ qr, eventTitle }: { qr: TicketQrInstance; eventTitle: string }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(qr.qrCode, { width: 320, margin: 2, color: { dark: '#0f3325', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => {});
  }, [qr.qrCode]);

  return (
    <div style={{ display: 'grid', gap: '1rem', justifyItems: 'center', textAlign: 'center' }}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Code ${qr.qrCode}`}
          width={240}
          height={240}
          style={{
            borderRadius: 'var(--md-sys-shape-corner-lg)',
            border: '2px solid var(--md-sys-color-outline-variant)',
            background: '#ffffff',
            padding: '0.5rem',
          }}
        />
      ) : (
        <div style={{ inlineSize: 240, blockSize: 240, display: 'grid', placeItems: 'center' }}>Gerando QR...</div>
      )}
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        <strong>{qr.label}</strong>
        <span className="text-muted">{eventTitle}</span>
        <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
          {new Date(qr.dateTime).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })} · +{qr.certificateHours}h
        </span>
        <code style={{ fontSize: '0.82rem', padding: '0.25rem 0.65rem', borderRadius: '0.4rem', background: 'var(--md-sys-color-surface-container)' }}>
          {qr.qrCode}
        </code>
      </div>
    </div>
  );
}

/**
 * Displays active student tickets (< 7 days past event end) with event preview or session calendar tiles
 * that open the scannable QR Code modal on tap/click.
 */
export function MyTicketsPage() {
  const { profile, signInWithGoogle, isDemoMode, findDemoUserByCpf } = useAuth();
  const { tickets, events, updateTicket } = useAppData();
  const { notify } = useToast();

  const [transferTargetTicket, setTransferTargetTicket] = useState<Ticket | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<{ ticketTitle: string; qr: TicketQrInstance } | null>(null);
  const [recipientCpf, setRecipientCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [transferring, setTransferring] = useState(false);

  const { activeTickets, archivedOldCount } = useMemo(() => {
    if (!profile) return { activeTickets: [], archivedOldCount: 0 };
    const cleanCpf = digitsOnly(profile.cpf);
    const mine = tickets.filter(
      (t) => t.ownerUid === profile.uid || (cleanCpf && digitsOnly(t.ownerCpf) === cleanCpf),
    );
    const nowMs = Date.now();
    const active: Ticket[] = [];
    let oldCount = 0;

    for (const t of mine) {
      const ev = events.find((e) => e.id === t.eventId);
      const lastQrTime = t.qrInstances.reduce(
        (max, q) => Math.max(max, new Date(q.dateTime).getTime() || 0),
        0,
      );
      const refEndMs = ev ? new Date(ev.endAt || ev.startAt).getTime() : lastQrTime;
      if (Number.isFinite(refEndMs) && refEndMs > 0 && nowMs - refEndMs > SEVEN_DAYS_MS) {
        oldCount += 1;
      } else {
        active.push(t);
      }
    }
    return { activeTickets: active, archivedOldCount: oldCount };
  }, [events, profile, tickets]);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center', display: 'grid', gap: '0.85rem' }}>
          <h1>Entre para ver seus Ingressos</h1>
          <p className="text-muted" style={{ marginInline: 'auto' }}>
            Seus QR Codes de acesso e a transferência de ingressos por CPF ficam vinculados à sua conta Google.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            style={{ justifySelf: 'center' }}
            onClick={() => signInWithGoogle(isDemoMode ? 'student' : undefined)}
          >
            <Icon name="login" size={18} />
            <span>Entrar com Google</span>
          </button>
        </div>
      </section>
    );
  }

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetTicket) return;
    setCpfError('');

    if (!isValidCpf(recipientCpf)) {
      setCpfError('Digite um CPF válido com 11 dígitos.');
      return;
    }

    const cleanRecipient = digitsOnly(recipientCpf);
    if (cleanRecipient === digitsOnly(profile.cpf)) {
      setCpfError('Você já é o titular atual deste ingresso.');
      return;
    }

    setTransferring(true);
    try {
      if (!isDemoMode) {
        const res = await fetch(`${API_BASE_URL}/tickets/transfer`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            ticketId: transferTargetTicket.id,
            toCpf: cleanRecipient,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || 'Falha na transferência.');
        }
        const updated = (await res.json()) as { ticket: Ticket };
        await updateTicket(updated.ticket);
      } else {
        const destUser = findDemoUserByCpf(cleanRecipient);
        if (!destUser) {
          setCpfError('Nenhuma conta cadastrada encontrada com este CPF (tente 390.533.447-05 no modo demo).');
          setTransferring(false);
          return;
        }
        const updated: Ticket = {
          ...transferTargetTicket,
          ownerUid: destUser.uid,
          ownerName: destUser.name,
          ownerCpf: destUser.cpf,
          ownerEmail: destUser.email,
          transferHistory: [
            ...transferTargetTicket.transferHistory,
            {
              fromUid: profile.uid,
              fromCpf: profile.cpf,
              toUid: destUser.uid,
              toCpf: destUser.cpf,
              transferredAt: new Date().toISOString(),
            },
          ],
        };
        await updateTicket(updated);
      }

      notify('Ingresso transferido com sucesso!');
      setTransferTargetTicket(null);
      setRecipientCpf('');
    } catch (err) {
      setCpfError(err instanceof Error ? err.message : 'Erro ao transferir ingresso.');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1>Meus Ingressos Ativos</h1>
          <p className="text-muted">
            Toque em qualquer sessão abaixo para abrir seu QR Code na tela no momento do credenciamento.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/meus-ingressos/historico" className="m3-btn m3-btn--outlined">
            <Icon name="history" size={18} />
            <span>Histórico de Compras</span>
          </Link>
          <Link to="/eventos" className="m3-btn m3-btn--tonal">
            <Icon name="explore" size={18} />
            <span>Explorar Eventos</span>
          </Link>
          <Link to="/certificados" className="m3-btn m3-btn--blue">
            <Icon name="workspace_premium" size={18} />
            <span>Ver Certificados</span>
          </Link>
        </div>
      </div>

      {archivedOldCount > 0 && (
        <div className="m3-card m3-card--tonal" style={{ padding: '0.9rem 1.15rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <span className="m3-body-medium">
            {archivedOldCount} ingresso(s) de eventos realizados há mais de 1 semana foram movidos para o histórico.
          </span>
          <Link to="/meus-ingressos/historico" className="m3-btn m3-btn--text" style={{ paddingInline: 0 }}>
            <span>Abrir Histórico de Ingressos</span>
            <Icon name="arrow_forward" size={17} />
          </Link>
        </div>
      )}

      {activeTickets.length === 0 ? (
        <div className="m3-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', display: 'grid', gap: '0.75rem', justifyItems: 'center' }}>
          <Icon name="confirmation_number" size={44} />
          <h2>Nenhum ingresso ativo no momento</h2>
          <p className="text-muted" style={{ marginInline: 'auto' }}>
            Ingressos de próximos eventos ou realizados nos últimos 7 dias aparecem aqui. Compras antigas ficam salvas no Histórico.
          </p>
          <Link to="/eventos" className="m3-btn m3-btn--filled">
            Ir para Eventos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {activeTickets.map((ticket) => {
            const ev = events.find((e) => e.id === ticket.eventId);
            const anyCheckedIn = ticket.qrInstances.some((q) => Boolean(q.checkedInAt));
            const multipleQrs = ticket.qrInstances.length > 1;
            return (
              <article key={ticket.id} className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBlockEnd: '0.4rem' }}>
                      <span className="m3-badge m3-badge--blue">{ticket.lotName}</span>
                      <span className="m3-badge">Titular: {ticket.ownerName}</span>
                    </div>
                    <h2>{ticket.eventTitle}</h2>
                    {ticket.discountReason && (
                      <span className="m3-body-medium" style={{ display: 'block', marginBlockStart: '0.2rem' }}>
                        {ticket.discountReason}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                    {(ev?.mode === 'virtual' || ev?.mode === 'misto') && ev.virtualAccessUrl && (
                      <a href={ev.virtualAccessUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--blue">
                        <Icon name="videocam" size={18} />
                        <span>Acessar Sala Virtual</span>
                      </a>
                    )}
                    <button
                      type="button"
                      className="m3-btn m3-btn--outlined"
                      disabled={anyCheckedIn}
                      title={anyCheckedIn ? 'Ingressos com presença já registrada não podem ser transferidos.' : undefined}
                      onClick={() => {
                        setTransferTargetTicket(ticket);
                        setRecipientCpf('');
                        setCpfError('');
                      }}
                    >
                      <Icon name="swap_horiz" size={18} />
                      <span>Transferir via CPF</span>
                    </button>
                  </div>
                </div>

                <div className="grid-cards">
                  {ticket.qrInstances.map((qr) => {
                    const dt = new Date(qr.dateTime);
                    const dayNum = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
                    const monthShort = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();

                    return (
                      <button
                        key={qr.qrCode}
                        type="button"
                        className="m3-card m3-card--tonal m3-card--interactive"
                        onClick={() => setActiveQrModal({ ticketTitle: ticket.eventTitle, qr })}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.9rem',
                          alignItems: 'center',
                          padding: '1rem',
                          textAlign: 'start',
                          cursor: 'pointer',
                        }}
                      >
                        {!multipleQrs && ev?.imageUrl ? (
                          <img
                            src={ev.imageUrl}
                            alt={ticket.eventTitle}
                            style={{
                              inlineSize: '5.5rem',
                              blockSize: '5.5rem',
                              borderRadius: 'var(--md-sys-shape-corner-md)',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              inlineSize: '5.5rem',
                              blockSize: '5.5rem',
                              borderRadius: 'var(--md-sys-shape-corner-md)',
                              background: 'linear-gradient(135deg, var(--camblu-forest-900), var(--camblu-forest-700))',
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              padding: '0.35rem',
                              textAlign: 'center',
                            }}
                          >
                            {multipleQrs ? (
                              <div style={{ display: 'grid', lineHeight: 1.05 }}>
                                <span style={{ fontSize: '0.7rem', color: '#edd16e', fontWeight: 750 }}>{monthShort}</span>
                                <strong style={{ fontSize: '1.6rem' }}>{dayNum}</strong>
                                <Icon name="calendar_today" size={14} />
                              </div>
                            ) : (
                              <Icon name="qr_code_2" size={34} />
                            )}
                          </div>
                        )}

                        <div style={{ flex: '1 1 10rem', display: 'grid', gap: '0.28rem', minInlineSize: 0 }}>
                          <span
                            className={`m3-badge ${qr.checkedInAt ? 'm3-badge--success' : 'm3-badge--gold'}`}
                            style={{ justifySelf: 'start' }}
                          >
                            <Icon name={qr.checkedInAt ? 'verified' : 'qr_code_2'} size={15} />
                            {qr.checkedInAt ? 'Presença validada' : 'Tocar para abrir QR Code'}
                          </span>
                          <strong>{qr.label}</strong>
                          <span className="m3-body-medium" style={{ fontSize: '0.84rem' }}>
                            {dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                            Libera +{qr.certificateHours}h de certificado
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal QR Code para Portaria */}
      <M3Dialog
        open={Boolean(activeQrModal)}
        onClose={() => setActiveQrModal(null)}
        title={activeQrModal ? activeQrModal.qr.label : 'QR Code do Ingresso'}
      >
        {activeQrModal && (
          <QrLargeDialogCanvas qr={activeQrModal.qr} eventTitle={activeQrModal.ticketTitle} />
        )}
      </M3Dialog>

      {/* Modal Transferência CPF */}
      <M3Dialog
        open={Boolean(transferTargetTicket)}
        onClose={() => setTransferTargetTicket(null)}
        title="Transferir Ingresso por CPF"
      >
        {transferTargetTicket && (
          <form onSubmit={handleTransferSubmit} style={{ display: 'grid', gap: '1rem' }} noValidate>
            <p className="text-muted">
              Você está transferindo <strong>{transferTargetTicket.eventTitle}</strong> ({transferTargetTicket.lotName}).
              O destinatário precisa possuir uma conta cadastrada neste portal com o CPF informado.
            </p>
            <div className="m3-field">
              <label htmlFor="transfer-cpf">CPF do destinatário</label>
              <input
                id="transfer-cpf"
                type="text"
                inputMode="numeric"
                className="m3-input"
                placeholder="000.000.000-00"
                required
                aria-invalid={cpfError ? 'true' : 'false'}
                aria-describedby={cpfError ? 'transfer-cpf-error' : undefined}
                value={recipientCpf}
                onChange={(e) => {
                  setRecipientCpf(formatCpf(e.target.value));
                  setCpfError('');
                }}
              />
              <span id="transfer-cpf-error" className="m3-error-msg" data-visible={Boolean(cpfError)}>
                <Icon name="error" size={16} />
                {cpfError}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button type="button" className="m3-btn m3-btn--outlined" onClick={() => setTransferTargetTicket(null)}>
                Cancelar
              </button>
              <button type="submit" className="m3-btn m3-btn--filled" disabled={transferring}>
                <Icon name="swap_horiz" size={18} />
                <span>{transferring ? 'Transferindo...' : 'Confirmar Transferência'}</span>
              </button>
            </div>
          </form>
        )}
      </M3Dialog>
    </section>
  );
}
