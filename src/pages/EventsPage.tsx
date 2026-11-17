import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { calculateEventTicketPrice } from '../lib/clubPricing';
import { formatBrlFromCents } from '../lib/validators';
import { Icon } from '../components/Icon';
import type { CambluEvent } from '../types/domain';

function isEventPast(ev: CambluEvent, nowMs: number): boolean {
  if (ev.archived) return true;
  const endMs = new Date(ev.endAt || ev.startAt).getTime();
  return Number.isFinite(endMs) && endMs < nowMs;
}

function getModeLabel(mode: CambluEvent['mode']): string {
  if (mode === 'virtual') return 'Evento Virtual';
  if (mode === 'misto') return 'Híbrido (Presencial + Virtual)';
  return 'Presencial';
}

/**
 * Public catalog of CAMBLU academic events separating active sales from archived past events.
 */
export function EventsPage() {
  const { events } = useAppData();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<'todos' | 'presencial' | 'virtual' | 'misto' | 'secimed'>('todos');

  const nowMs = Date.now();

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const filtered = events
      .filter((e) => e.published)
      .filter((e) => {
        if (filter === 'todos') return true;
        if (filter === 'secimed') return e.isSecimed;
        if (filter === 'misto') return e.mode === 'misto';
        return e.mode === filter || e.mode === 'misto';
      });

    const upcoming = filtered
      .filter((e) => !isEventPast(e, nowMs))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    const past = filtered
      .filter((e) => isEventPast(e, nowMs))
      .sort((a, b) => b.startAt.localeCompare(a.startAt));

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, filter, nowMs]);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Eventos CAMBLU</h1>
          <p style={{ color: '#dceddf' }}>
            Confira os simpósios, jornadas científicas e encontros da Medicina FURB, garanta seu ingresso com QR Code e
            emita seus certificados de horas complementares (AACCs).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/meus-ingressos" className="m3-btn m3-btn--gold">
            <Icon name="qr_code_2" size={18} />
            <span>Meus Ingressos</span>
          </Link>
          <Link to="/certificados" className="m3-btn m3-btn--blue">
            <Icon name="workspace_premium" size={18} />
            <span>Certificados</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Filtrar eventos">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'presencial', label: 'Presenciais' },
          { id: 'virtual', label: 'Virtuais' },
          { id: 'misto', label: 'Presencial + Virtual' },
          { id: 'secimed', label: 'SECIMED' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className="m3-chip"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id as typeof filter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Próximos Eventos / Inscrições Abertas */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <h2>Próximos Eventos</h2>
        {upcomingEvents.length === 0 ? (
          <div className="m3-card m3-card--tonal">
            <p className="text-muted">Nenhum evento futuro encontrado neste filtro no momento.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {upcomingEvents.map((ev) => {
              const baseLot = ev.lots.find((l) => l.active) || ev.lots[0];
              const pricing = baseLot
                ? calculateEventTicketPrice(
                    baseLot.priceCents,
                    ev,
                    profile?.membershipTier || 'none',
                    Boolean(profile?.membershipActive),
                  )
                : null;
              const maxHours = baseLot
                ? baseLot.qrDefinitions.reduce((acc, q) => acc + q.certificateHours, 0)
                : 0;

              return (
                <Link
                  key={ev.id}
                  to={`/eventos/${ev.slug}`}
                  className="m3-card m3-card--interactive shop-card-link"
                >
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    <div
                      style={{
                        aspectRatio: '16 / 9',
                        borderRadius: 'var(--md-sys-shape-corner-md)',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #0f3325, #1f5c44)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#edd16e',
                        position: 'relative',
                      }}
                    >
                      {ev.imageUrl ? (
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      ) : (
                        <Icon name={ev.mode === 'virtual' ? 'videocam' : 'event_available'} size={48} />
                      )}
                    </div>

                    <span className="m3-label-small text-muted">
                      {getModeLabel(ev.mode)} · Até {maxHours}h de certificado
                    </span>

                    <h3>{ev.title}</h3>
                    <p className="text-muted">{ev.locationShort}</p>
                    <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                      {new Date(ev.startAt).toLocaleString('pt-BR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>

                  <div
                    style={{
                      paddingBlockStart: '0.75rem',
                      borderBlockStart: '1px solid var(--md-sys-color-outline-variant)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      {pricing && baseLot && (
                        <>
                          {pricing.discountCents > 0 && (
                            <span
                              style={{
                                fontSize: '0.8rem',
                                textDecoration: 'line-through',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                display: 'block',
                              }}
                            >
                              {formatBrlFromCents(baseLot.priceCents)}
                            </span>
                          )}
                          <strong style={{ fontSize: '1.15rem', color: 'var(--md-sys-color-primary)' }}>
                            {pricing.finalCents === 0 ? 'Gratuito (Clube)' : formatBrlFromCents(pricing.finalCents)}
                          </strong>
                        </>
                      )}
                    </div>
                    <span className="m3-badge m3-badge--blue">
                      Ver detalhes <Icon name="arrow_forward" size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Arquivo de Eventos Passados */}
      {pastEvents.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <h2>Eventos Realizados (Arquivo & Certificados)</h2>
            <p className="text-muted">
              Eventos anteriores já encerrados. Acesse qualquer edição para visualizar detalhes e baixar seu certificado.
            </p>
          </div>
          <div className="grid-cards">
            {pastEvents.map((ev) => (
              <Link
                key={ev.id}
                to={`/eventos/${ev.slug}`}
                className="m3-card m3-card--tonal m3-card--interactive shop-card-link"
              >
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      borderRadius: 'var(--md-sys-shape-corner-md)',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #2b3530, #174936)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#f1de97',
                    }}
                  >
                    {ev.imageUrl ? (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <Icon name="history" size={44} />
                    )}
                  </div>
                  <span className="m3-badge" style={{ justifySelf: 'start' }}>
                    Encerrado · {getModeLabel(ev.mode)}
                  </span>
                  <h3>{ev.title}</h3>
                  <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                    {new Date(ev.startAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })} · {ev.locationShort}
                  </p>
                </div>

                <div
                  style={{
                    paddingBlockStart: '0.65rem',
                    borderBlockStart: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 680, color: 'var(--camblu-action-blue)', fontSize: '0.88rem' }}>
                    Ver evento & certificado
                  </span>
                  <Icon name="workspace_premium" size={18} className="m3-badge--blue" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
