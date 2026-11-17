import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { M3Carousel } from '../components/M3Carousel';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { SECIMED_INFO } from '../data/institutional';

export function SecimedPage() {
  const { events } = useAppData();
  const secimedEvents = events.filter((e) => e.isSecimed && e.published);

  const pastEditionSlides = [
    {
      id: 'sec-2025',
      title: 'XXII SECIMED — Palestras Magnas & Casos Clínicos',
      subtitle: 'Auditório principal lotado com médicos convidados, discussões multiprofissionais e sorteio de brindes.',
      badge: 'Edição 2025',
      bg: 'linear-gradient(135deg, #0f3325, #1e5740)',
    },
    {
      id: 'sec-ws',
      title: 'Workshops Práticos das Ligas Acadêmicas',
      subtitle: 'Sutura, atendimento ao trauma, vias aéreas, interpretação de ECG e semiologia prática.',
      badge: 'Workshops & Ligas',
      bg: 'linear-gradient(135deg, #0d2b66, #285eb8)',
    },
    {
      id: 'sec-orais',
      title: 'Mostra de Trabalhos Científicos e Banners',
      subtitle: 'Discentes apresentando pesquisas e relatos de caso avaliados com premiação e publicação nos Anais.',
      badge: 'Produção Científica',
      bg: 'linear-gradient(135deg, #3c2f05, #6c550b)',
    },
  ].map((item) => ({
    id: item.id,
    title: item.title,
    content: (
      <div
        style={{
          minBlockSize: '18rem',
          padding: '2rem',
          background: item.bg,
          color: '#ffffff',
          display: 'grid',
          alignContent: 'space-between',
        }}
      >
        <span className="m3-label-small" style={{ color: '#f1de97' }}>
          {item.badge}
        </span>
        <div>
          <h3 style={{ color: '#ffffff', marginBlockEnd: '0.45rem' }}>{item.title}</h3>
          <p style={{ color: '#e5eee8' }}>{item.subtitle}</p>
        </div>
      </div>
    ),
  }));

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'grid', gap: '1rem' }}>
        <span className="m3-label-large" style={{ color: '#f1de97' }}>
          Desde {SECIMED_INFO.since} · Anais ISSN {SECIMED_INFO.issn}
        </span>

        <h1>Semana Científica de Medicina — SECIMED</h1>
        <p style={{ color: '#dceddf' }}>
          Organizada anualmente pelo CAMBLU desde 2002, a SECIMED reúne cinco dias de ciência médica, apresentações
          de trabalhos acadêmicos (banners e comunicações orais), palestras, rodas de conversa, coffee breaks e
          workshops conduzidos pelas ligas acadêmicas.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to={secimedEvents[0] ? `/eventos/${secimedEvents[0].slug}` : '/eventos'} className="m3-btn m3-btn--gold">
            <Icon name="confirmation_number" size={19} />
            <span>Comprar Ingressos SECIMED</span>
          </Link>
          <Link to="/secimed/anais-secimed" className="m3-btn m3-btn--blue">
            <Icon name="menu_book" size={19} />
            <span>Acessar Anais SECIMED</span>
          </Link>
          <a href={SECIMED_INFO.instagramUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.35)' }}>
            <Icon name="open_in_new" size={18} />
            <span>{SECIMED_INFO.instagramHandle}</span>
          </a>
        </div>
      </div>

      <div>
        <h2 style={{ marginBlockEnd: '1rem' }}>Memórias das Edições Anteriores</h2>
        <M3Carousel label="Galeria de edições passadas da SECIMED" items={pastEditionSlides} />
      </div>

      <SponsorsStrip />
    </section>
  );
}
