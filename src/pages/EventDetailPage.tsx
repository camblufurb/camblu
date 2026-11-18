import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';
import { calculateEventTicketPrice } from '../lib/clubPricing';
import { formatBrlFromCents } from '../lib/validators';
import { API_BASE_URL, getAuthHeaders } from '../lib/firebase';
import { logError, logInfo } from '../lib/logger';
import type { EventLot, Ticket } from '../types/domain';

export function EventDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { events, tickets, addTicket, saveEvent } = useAppData();
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const { notify } = useToast();

  const event = events.find((e) => e.slug === slug || e.id === slug);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      document.title = `${event.title} | CAMBLU Eventos`;
      if (!selectedLotId && event.lots[0]) {
        setSelectedLotId(event.lots[0].id);
      }
    }
  }, [event, selectedLotId]);

  if (!event) {
    return (
      <section className="page-section container">
        <div className="m3-card">
          <h1>Evento não encontrado</h1>
          <p className="text-muted" style={{ marginBlock: '0.5rem 1rem' }}>
            O evento solicitado pode ter sido encerrado ou movido.
          </p>
          <Link to="/eventos" className="m3-btn m3-btn--filled">
            Voltar para Eventos
          </Link>
        </div>
      </section>
    );
  }

  const activeLot: EventLot | undefined = event.lots.find((l) => l.id === selectedLotId) || event.lots[0];
  const pricing = activeLot
    ? calculateEventTicketPrice(
        activeLot.priceCents,
        event,
        profile?.membershipTier || 'none',
        Boolean(profile?.membershipActive),
      )
    : { finalCents: 0, discountCents: 0 };

  const userAlreadyHasTicket = Boolean(
    profile && tickets.some((t) => t.eventId === event.id && t.ownerUid === profile.uid),
  );

  const shareUrl = `${window.location.origin}/eventos/${event.slug}`;

  const handleCopyShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url: shareUrl });
        return;
      } catch {
        // segue para cópia na área de transferência
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify('Link do evento copiado!');
    } catch {
      notify('Copie o endereço da página para compartilhar.', 'info');
    }
  };

  const handleCheckout = async () => {
    if (!profile) {
      await signInWithGoogle(isDemoMode ? 'student' : undefined);
      return;
    }
    if (!profile.profileCompleted) {
      notify('Complete seu CPF e telefone no Perfil antes de emitir ingressos.', 'info');
      navigate('/perfil');
      return;
    }
    if (!activeLot) return;
    if (activeLot.soldQuantity >= activeLot.totalQuantity) {
      notify('Este lote já está esgotado.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Se pagamento for maior que zero e não estivermos em modo demo local, chama Cloud Function Stripe
      if (!isDemoMode) {
        logInfo('Eventos', 'Iniciando checkout de ingresso via /api/checkout/event', {
          eventId: event.id,
          lotId: activeLot.id,
        });
        const res = await fetch(`${API_BASE_URL}/checkout/event`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            eventId: event.id,
            lotId: activeLot.id,
          }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error((payload as { error?: string }).error || `Falha HTTP ${res.status} ao iniciar pagamento.`);
        }
        const data = (await res.json()) as { checkoutUrl?: string; freeIssued?: boolean };
        if (data.checkoutUrl) {
          logInfo('Eventos', 'Sessão Stripe Evento criada; redirecionando');
          window.location.href = data.checkoutUrl;
          return;
        }
        if (data.freeIssued) {
          logInfo('Eventos', 'Ingresso gratuito emitido pelo Clube CAMBLU');
          notify('Ingresso gratuito emitido pelo Clube CAMBLU!');
          navigate('/meus-ingressos');
          return;
        }
      }

      // Emissão gratuita (Clube Raro/Épico/Lendário) ou emissão simulada em modo pré-deploy
      const now = new Date().toISOString();
      const ticketId = `tkt-${Date.now().toString(36)}`;
      const newTicket: Ticket = {
        id: ticketId,
        eventId: event.id,
        eventSlug: event.slug,
        eventTitle: event.title,
        lotId: activeLot.id,
        lotName: activeLot.name,
        ownerUid: profile.uid,
        ownerName: profile.name,
        ownerCpf: profile.cpf,
        ownerEmail: profile.email,
        paidCents: pricing.finalCents,
        discountReason: pricing.reason,
        status: 'valid',
        purchasedAt: now,
        transferHistory: [],
        qrInstances: activeLot.qrDefinitions.map((q, idx) => ({
          qrCode: `CAMBLU-${event.slug.slice(0, 8).toUpperCase()}-${idx + 1}-${ticketId.slice(-5).toUpperCase()}`,
          definitionId: q.id,
          label: q.label,
          dateTime: q.dateTime,
          certificateHours: q.certificateHours,
          checkedInAt: null,
        })),
      };

      await addTicket(newTicket);
      await saveEvent({
        ...event,
        lots: event.lots.map((l) =>
          l.id === activeLot.id ? { ...l, soldQuantity: l.soldQuantity + 1 } : l,
        ),
      });

      notify('Ingresso emitido! Seus QR Codes já estão disponíveis em Meus Ingressos.');
      navigate('/meus-ingressos');
    } catch (err) {
      logError('Eventos', 'EventDetailPage -> handlePurchase', err, {
        eventId: event.id,
        lotId: activeLot.id,
      });
      notify('Não foi possível concluir a compra do ingresso.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isPastEvent = Boolean(
    event.archived ||
      (event.endAt && !Number.isNaN(new Date(event.endAt).getTime()) && new Date(event.endAt).getTime() < Date.now()),
  );

  const revealVirtualLink =
    (event.mode === 'virtual' || event.mode === 'misto') &&
    event.virtualAccessUrl &&
    userAlreadyHasTicket &&
    (!event.virtualRevealAt || new Date() >= new Date(event.virtualRevealAt));

  const modeLabel =
    event.mode === 'misto'
      ? 'Híbrido (Presencial + Virtual)'
      : event.mode === 'virtual'
        ? 'Evento Virtual'
        : 'Evento Presencial';

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/eventos" className="m3-btn m3-btn--text">
          <Icon name="arrow_back" size={18} />
          <span>Voltar aos Eventos</span>
        </Link>

        <button type="button" className="m3-btn m3-btn--outlined" onClick={handleCopyShareLink}>
          <Icon name="share" size={18} />
          <span>Compartilhar</span>
        </button>
      </div>

      <div className={isPastEvent ? undefined : 'grid-two'}>
        <div style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
          <div
            style={{
              aspectRatio: '16 / 9',
              borderRadius: 'var(--md-sys-shape-corner-xl)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #071b13, #174936)',
              display: 'grid',
              placeItems: 'center',
              color: '#edd16e',
            }}
          >
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon name={event.mode === 'virtual' ? 'videocam' : 'festival'} size={64} />
            )}
          </div>

          <div className="m3-card" style={{ display: 'grid', gap: '0.9rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem', fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              <strong style={{ color: 'var(--camblu-action-blue)' }}>{modeLabel}</strong>
              {!isPastEvent && (
                <>
                  <span>·</span>
                  <span>Capacidade máxima: {event.maxCapacity} pessoas</span>
                </>
              )}
              {event.hasCoffee && (
                <>
                  <span>·</span>
                  <span>Inclui Coffee</span>
                </>
              )}
            </div>

            <h1>{event.title}</h1>
            <p>{event.description}</p>

            <div
              style={{
                padding: '0.95rem 1rem',
                borderRadius: 'var(--md-sys-shape-corner-md)',
                background: 'var(--md-sys-color-surface-container-low)',
                display: 'grid',
                gap: '0.45rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="schedule" size={19} className="m3-badge--blue" />
                <span>
                  {new Date(event.startAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="location_on" size={19} className="m3-badge--blue" />
                <span>{event.locationShort}</span>
              </div>
              {event.mapsUrl && (
                <a href={event.mapsUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--text" style={{ justifySelf: 'start', paddingInline: 0 }}>
                  <Icon name="map" size={18} />
                  <span>Abrir localização no Google Maps</span>
                </a>
              )}
            </div>

            {isPastEvent && (
              <div className="m3-card m3-card--tonal" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <h2 style={{ marginBlockEnd: '0.25rem' }}>Evento Encerrado — Certificados</h2>
                  <p className="text-muted">
                    Emita ou baixe em PDF o certificado correspondente às presenças validadas neste evento.
                  </p>
                </div>
                <Link to="/certificados" className="m3-btn m3-btn--filled">
                  <Icon name="workspace_premium" size={18} />
                  <span>Baixar Certificado</span>
                </Link>
              </div>
            )}

            {(event.mode === 'virtual' || event.mode === 'misto') && !isPastEvent && (
              <div className="m3-card m3-card--tonal">
                <h2 style={{ marginBlockEnd: '0.35rem' }}>
                  Acesso à Sala Virtual
                </h2>
                {revealVirtualLink ? (
                  <a href={event.virtualAccessUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--blue">
                    <Icon name="videocam" size={18} />
                    <span>Entrar na transmissão agora</span>
                  </a>
                ) : (
                  <p className="text-muted">
                    O link de acesso fica visível aqui para portadores de ingresso próximo ao horário do evento.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {!isPastEvent && (
          <aside className="m3-card" style={{ display: 'grid', gap: '1.15rem', alignContent: 'start' }}>
          <h2>Escolha seu Lote & QR Codes</h2>

          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {event.lots.map((lot) => {
              const remaining = Math.max(0, lot.totalQuantity - lot.soldQuantity);
              const selected = activeLot?.id === lot.id;
              return (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => setSelectedLotId(lot.id)}
                  className="m3-card m3-card--tonal"
                  style={{
                    textAlign: 'start',
                    cursor: 'pointer',
                    borderColor: selected ? 'var(--camblu-action-blue)' : 'var(--md-sys-color-outline-variant)',
                    borderWidth: selected ? '2px' : '1px',
                    display: 'grid',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{lot.name}</strong>
                    <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                      {formatBrlFromCents(lot.priceCents)}
                    </strong>
                  </div>
                  <span className="m3-body-medium">
                    {remaining} disponíveis · {lot.qrCodesPerTicket} QR code(s) por ingresso
                  </span>
                </button>
              );
            })}
          </div>

          {activeLot && (
            <>
              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                  background: 'var(--md-sys-color-surface-container-low)',
                  display: 'grid',
                  gap: '0.45rem',
                }}
              >
                <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
                  QR Codes & Horas de Certificado incluídos neste lote
                </span>
                {activeLot.qrDefinitions.map((qr) => (
                  <div
                    key={qr.id}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.88rem' }}
                  >
                    <span>
                      {qr.label} ({new Date(qr.dateTime).toLocaleDateString('pt-BR')})
                    </span>
                    <strong>+{qr.certificateHours}h</strong>
                  </div>
                ))}
              </div>

              <div className="m3-card m3-card--gold" style={{ display: 'grid', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Valor do ingresso</span>
                  <strong style={{ fontSize: '1.35rem' }}>
                    {pricing.finalCents === 0 ? 'Gratuito' : formatBrlFromCents(pricing.finalCents)}
                  </strong>
                </div>
                {pricing.reason && (
                  <span className="m3-label-large" style={{ color: 'var(--md-sys-color-success)' }}>
                    {pricing.reason}
                  </span>
                )}
              </div>

              {pricing.finalCents > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    background: 'var(--md-sys-color-surface-container-low)',
                    fontSize: '0.84rem',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <Icon name="credit_card" size={18} className="m3-badge--blue" />
                  <span>
                    No Stripe você poderá pagar com <strong>PIX, Cartão de Crédito, Apple Pay ou Google Pay</strong>.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="m3-btn m3-btn--filled"
                disabled={submitting || activeLot.soldQuantity >= activeLot.totalQuantity}
                onClick={handleCheckout}
              >
                <Icon name={pricing.finalCents === 0 ? 'confirmation_number' : 'lock'} size={19} />
                <span>
                  {activeLot.soldQuantity >= activeLot.totalQuantity
                    ? 'Lote Esgotado'
                    : submitting
                      ? 'Processando...'
                      : pricing.finalCents === 0
                        ? 'Resgatar Ingresso pelo Clube'
                        : 'Finalizar Inscrição'}
                </span>
              </button>
            </>
          )}
        </aside>
        )}
      </div>
    </section>
  );
}
