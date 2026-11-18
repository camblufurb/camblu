import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { buildCalendarMilestones } from '../lib/calendarMilestones';

export function CalendarPage() {
  const { events, editais } = useAppData();

  const googleCalAddUrl =
    'https://calendar.google.com/calendar/u/0?cid=Y2FtYmx1ZnVyYkBnbWFpbC5jb20';
  const googleCalEmbedUrl =
    'https://calendar.google.com/calendar/embed?src=camblufurb%40gmail.com&ctz=America%2FSao_Paulo&showTitle=0&showPrint=0';

  const agendaItems = useMemo(
    () => buildCalendarMilestones(events, editais),
    [events, editais],
  );

  const downloadIcs = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CAMBLU FURB//Portal Oficial//PT-BR',
      ...agendaItems.flatMap((item) => {
        const dt = item.date.replace(/-/g, '');
        return [
          'BEGIN:VEVENT',
          `UID:${item.id}@camblu.org`,
          `DTSTART;VALUE=DATE:${dt}`,
          `SUMMARY:${item.title}`,
          `DESCRIPTION:${item.kind} - CAMBLU Medicina FURB`,
          'END:VEVENT',
        ];
      }),
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendario-camblu.ics';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest page-hero-card">
        <div className="page-hero-inner">
          <AnimatedClimateTitle tone="light" accessibleHeading="Calendário Acadêmico CAMBLU">
            Calendário
          </AnimatedClimateTitle>
          <p className="page-hero-desc">
            Agenda integrada oficial do CAMBLU (`camblufurb@gmail.com`) reunindo atividades das 35 ligas
            acadêmicas, eventos do curso e prazos de editais.
          </p>

          <div className="page-hero-actions">
            <a href={googleCalAddUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--gold">
              <Icon name="add_to_queue" size={18} />
              <span>Adicionar ao Google Agenda</span>
            </a>
            <button type="button" className="m3-btn m3-btn--blue" onClick={downloadIcs}>
              <Icon name="download" size={18} />
              <span>Exportar (.ics)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid-two">
        <div className="m3-card" style={{ padding: '0.75rem', overflow: 'hidden' }}>
          <iframe
            title="Calendário Oficial do CAMBLU e Ligas Acadêmicas"
            src={googleCalEmbedUrl}
            style={{ border: 0, inlineSize: '100%', blockSize: '34rem', borderRadius: 'var(--md-sys-shape-corner-md)' }}
            loading="lazy"
          />
        </div>

        <div className="m3-card" style={{ display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
          <div>
            <h2>Próximos Marcos no Portal</h2>
            <p className="text-muted" style={{ fontSize: '0.84rem' }}>
              Ordenados do mais próximo ao mais distante (marcos encerrados há 3 dias ou mais são ocultados).
            </p>
          </div>
          {agendaItems.length === 0 ? (
            <div className="m3-card m3-card--tonal" style={{ padding: '1rem' }}>
              <span className="text-muted">Nenhum marco próximo cadastrado no momento.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {agendaItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="m3-card m3-card--tonal m3-card--interactive"
                  style={{ textDecoration: 'none', color: 'inherit', padding: '0.9rem 1rem', display: 'grid', gap: '0.25rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
                      {item.kind} · {item.relativeLabel}
                    </span>
                    <strong style={{ fontSize: '0.85rem' }}>{item.displayDate}</strong>
                  </div>
                  <strong>{item.title}</strong>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
