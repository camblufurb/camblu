import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { calculateEventTicketPrice } from '../lib/clubPricing';
import { formatBrlFromCents } from '../lib/validators';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';

export function EventsPage() {
  const { events } = useAppData();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<'todos' | 'presencial' | 'virtual' | 'secimed' | 'camblu_coffee'>('todos');

  const visibleEvents = useMemo(() => {
    return events
      .filter((e) => e.published)
      .filter((e) => {
        if (filter === 'todos') return true;
        if (filter === 'presencial' || filter === 'virtual') return e.mode === filter;
        if (filter === 'secimed') return e.isSecimed;
        return e.hasCoffee && !e.isSecimed;
      });
  }, [events, filter]);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="confirmation_number" size={16} />
            Ingressos, QR Codes & Certificados AACCs
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Eventos CAMBLU</h1>
          <p style={{ color: '#dceddf' }}>
            Garanta sua vaga com pagamento via Stripe (PIX, Cartão, Google Pay e Apple Pay — todas as taxas já
            inclusas). Assinantes do Clube CAMBLU recebem descontos ou gratuidade automáticos!
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
          { id: 'secimed', label: 'SECIMED' },
          { id: 'camblu_coffee', label: 'Com Coffee (Clube Raro+)' },
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

      <div className="grid-cards">
        {visibleEvents.map((ev) => {
          const baseLot = ev.lots.find((l) => l.active) || ev.lots[0];
          const pricing = baseLot
            ? calculateEventTicketPrice(
                baseLot.priceCents,
                ev,
                profile?.membershipTier || 'none',
                Boolean(profile?.membershipActive),
              )
            : null;
          const totalAvailable = ev.lots.reduce((acc, l) => acc + Math.max(0, l.totalQuantity - l.soldQuantity), 0);
          const maxHours = baseLot
            ? baseLot.qrDefinitions.reduce((acc, q) => acc + q.certificateHours, 0)
            : 0;

          return (
            <article
              key={ev.id}
              className="m3-card m3-card--interactive"
              style={{ display: 'grid', gap: '0.85rem', alignContent: 'space-between' }}
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
                  <span
                    className="m3-badge m3-badge--gold"
                    style={{ position: 'absolute', insetBlockStart: '0.65rem', insetInlineStart: '0.65rem' }}
                  >
                    {ev.mode === 'virtual' ? 'Evento Virtual' : 'Presencial'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span className="m3-badge m3-badge--blue">Até {maxHours}h de certificado</span>
                  <span className="m3-badge">{totalAvailable} vagas restantes</span>
                </div>

                <h2 className="m3-title-large">{ev.title}</h2>
                <p className="m3-body-medium">{ev.locationShort}</p>
                <p className="m3-body-medium" style={{ fontSize: '0.86rem' }}>
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
                <Link to={`/eventos/${ev.slug}`} className="m3-btn m3-btn--filled">
                  <span>Ver & Comprar</span>
                  <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <SponsorsStrip />
    </section>
  );
}
