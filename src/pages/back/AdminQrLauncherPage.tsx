import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import type { CambluEvent } from '../../types/domain';

/**
 * Dedicated QR Scanner launcher sorted by proximity to today's date,
 * allowing admins to jump straight into check-in and manually hide completed events.
 */
export function AdminQrLauncherPage() {
  const { events, saveEvent } = useAppData();
  const { notify } = useToast();
  const [showHidden, setShowHidden] = useState(false);

  const nowMs = Date.now();

  const orderedEvents = useMemo(() => {
    return [...events]
      .filter((e) => showHidden || !e.qrScannerHidden)
      .sort((a, b) => {
        const diffA = Math.abs(new Date(a.startAt).getTime() - nowMs);
        const diffB = Math.abs(new Date(b.startAt).getTime() - nowMs);
        return diffA - diffB;
      });
  }, [events, nowMs, showHidden]);

  const hiddenCount = useMemo(
    () => events.filter((e) => Boolean(e.qrScannerHidden)).length,
    [events],
  );

  const toggleHide = async (ev: CambluEvent) => {
    const nextHidden = !ev.qrScannerHidden;
    await saveEvent({ ...ev, qrScannerHidden: nextHidden });
    notify(
      nextHidden
        ? `"${ev.title}" ocultado da lista rápida de portaria.`
        : `"${ev.title}" reexibido na lista de portaria.`,
      'info',
    );
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <h1>Leitor de QR Code (Portaria & CPF)</h1>
          <p className="text-muted">
            Eventos ordenados do mais próximo ao mais distante da data atual. Os eventos só somem quando você ocultar manualmente.
          </p>
        </div>

        {hiddenCount > 0 && (
          <button
            type="button"
            className="m3-btn m3-btn--outlined"
            onClick={() => setShowHidden((s) => !s)}
          >
            <Icon name={showHidden ? 'visibility_off' : 'visibility'} size={18} />
            <span>{showHidden ? 'Esconder Ocultos' : `Ver Ocultos (${hiddenCount})`}</span>
          </button>
        )}
      </header>

      {orderedEvents.length === 0 ? (
        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
          <p className="text-muted">Nenhum evento visível no leitor de QR Code.</p>
          {hiddenCount > 0 && (
            <button type="button" className="m3-btn m3-btn--filled" onClick={() => setShowHidden(true)}>
              Mostrar {hiddenCount} evento(s) oculto(s)
            </button>
          )}
        </div>
      ) : (
        <div className="grid-cards">
          {orderedEvents.map((ev) => {
            const eventDate = new Date(ev.startAt);
            const daysDelta = Math.round((eventDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));
            const deltaText =
              daysDelta === 0
                ? 'Hoje'
                : daysDelta > 0
                  ? `Em ${daysDelta} dia(s)`
                  : `Há ${Math.abs(daysDelta)} dia(s)`;

            return (
              <article
                key={ev.id}
                className="m3-card"
                style={{
                  display: 'grid',
                  gap: '0.85rem',
                  alignContent: 'space-between',
                  opacity: ev.qrScannerHidden ? 0.68 : 1,
                }}
              >
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`m3-badge ${Math.abs(daysDelta) <= 7 ? 'm3-badge--blue' : ''}`}>
                      {deltaText}
                    </span>
                    {ev.qrScannerHidden && <span className="m3-badge">Oculto</span>}
                  </div>
                  <h3>{ev.title}</h3>
                  <p className="text-muted" style={{ fontSize: '0.86rem' }}>
                    {eventDate.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })} · {ev.locationShort}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <Link to={`/back/eventos/${ev.id}/qr`} className="m3-btn m3-btn--blue" style={{ flex: '1 1 auto' }}>
                    <Icon name="qr_code_scanner" size={18} />
                    <span>Abrir Leitor</span>
                  </Link>
                  <button
                    type="button"
                    className="m3-btn m3-btn--outlined"
                    onClick={() => toggleHide(ev)}
                    title={ev.qrScannerHidden ? 'Reexibir na lista rápida' : 'Ocultar manualmente da lista'}
                  >
                    <Icon name={ev.qrScannerHidden ? 'visibility' : 'visibility_off'} size={18} />
                    <span>{ev.qrScannerHidden ? 'Reexibir' : 'Ocultar'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
