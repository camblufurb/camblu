import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';

export function CalendarPage() {
  const { events, editais } = useAppData();

  const googleCalAddUrl =
    'https://calendar.google.com/calendar/u/0?cid=Y2FtYmx1ZnVyYkBnbWFpbC5jb20';
  const googleCalEmbedUrl =
    'https://calendar.google.com/calendar/embed?src=camblufurb%40gmail.com&ctz=America%2FSao_Paulo&showTitle=0&showPrint=0';

  const agendaItems = [
    ...events
      .filter((e) => e.published)
      .map((e) => ({
        id: e.id,
        date: e.startAt.slice(0, 10),
        title: e.title,
        kind: 'Evento CAMBLU',
        to: `/eventos/${e.slug}`,
      })),
    ...editais.map((ed) => ({
      id: ed.id,
      date: ed.deadline,
      title: `Prazo: ${ed.title}`,
      kind: `Edital ${ed.program}`,
      to: '/editais',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

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
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="calendar_month" size={16} />
            CAMBLU · Ligas Acadêmicas · Editais
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Calendário Acadêmico</h1>
          <p style={{ color: '#dceddf' }}>
            Agenda integrada oficial do CAMBLU (`camblufurb@gmail.com`) reunindo atividades das 35 ligas
            acadêmicas, eventos do curso e prazos de editais.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
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
          <h2 className="m3-title-large">Próximos Marcos no Portal</h2>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {agendaItems.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="m3-card m3-card--tonal m3-card--interactive"
                style={{ textDecoration: 'none', color: 'inherit', padding: '0.9rem 1rem', display: 'grid', gap: '0.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="m3-badge m3-badge--blue">{item.kind}</span>
                  <strong style={{ fontSize: '0.85rem' }}>{item.date}</strong>
                </div>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <SponsorsStrip />
    </section>
  );
}
