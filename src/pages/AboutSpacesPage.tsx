import { Link } from 'react-router-dom';
import { M3Carousel } from '../components/M3Carousel';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { SPACES_DATA } from '../data/institutional';

export function AboutSpacesPage() {
  const spaceSlides = SPACES_DATA.map((space, index) => ({
    id: space.id,
    title: space.name,
    content: (
      <div
        style={{
          minBlockSize: 'clamp(17rem, 30vw, 23rem)',
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          background:
            index === 0
              ? 'linear-gradient(135deg, #0f3325, #1b563e)'
              : index === 1
                ? 'linear-gradient(135deg, #132a4f, #224b8f)'
                : 'linear-gradient(135deg, #3c2f05, #69540c)',
          color: '#ffffff',
          display: 'grid',
          alignContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="m3-badge m3-badge--gold">
            <Icon name={space.icon} size={16} />
            {space.location}
          </span>
          <span className="m3-badge" style={{ background: 'rgb(255 255 255 / 0.16)', color: '#ffffff' }}>
            Placeholder foto real · {space.status}
          </span>
        </div>

        <div>
          <h3 style={{ color: '#ffffff', fontSize: 'clamp(1.35rem, 2.2vw, 1.9rem)', marginBlockEnd: '0.5rem' }}>
            {space.name}
          </h3>
          <p style={{ color: '#e8f1eb', marginBlockEnd: '0.85rem' }}>{space.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {space.highlights.map((h) => (
              <span
                key={h}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.28rem 0.7rem',
                  borderRadius: '9999px',
                  background: 'rgb(255 255 255 / 0.14)',
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  }));

  const statutoryGoals = [
    'Promover debates, palestras, seminários, jornadas, eventos culturais e esportivos.',
    'Fiscalizar e garantir a atualização do acervo bibliográfico e infraestrutura do curso.',
    'Incentivar a formação ética, crítica, humanística, científica e política dos acadêmicos.',
    'Manter diálogo constante com entidades representativas nacionais e internacionais (IFMSA, DCE, AAARIH).',
    'Lutar pelo aperfeiçoamento contínuo da graduação e indissociabilidade entre ensino, pesquisa e extensão.',
    'Realizar reuniões semanais democráticas e abertas a todos os estudantes de Medicina da FURB.',
  ];

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2.5rem' }}>
      <div className="m3-card m3-card--forest">
        <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.75rem' }}>
          <Icon name="apartment" size={16} />
          Institucional & Patrimônio
        </span>
        <h1 style={{ marginBlockEnd: '0.6rem' }}>Sobre o CAMBLU e Nossos Espaços</h1>
        <p className="m3-body-large" style={{ color: '#dceddf' }}>
          Fundado em 1990, o Centro Acadêmico de Medicina de Blumenau atua como ponte direta entre alunos,
          coordenação do curso, professores, DCE e conselhos superiores — além de manter três espaços físicos
          exclusivos no Edifício Cristina.
        </p>
      </div>

      <div>
        <div style={{ marginBlockEnd: '1rem' }}>
          <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
            Patrimônio Estudantil · Edifício Cristina
          </span>
          <h2>Espaços do CAMBLU (Carrossel Interativo)</h2>
          <p className="m3-body-medium">
            Solicite a senha atualizada de acesso diretamente com um integrante da gestão ou pelo Instagram{' '}
            <a href="https://www.instagram.com/camblufurb/" target="_blank" rel="noreferrer">
              @camblufurb
            </a>
            .
          </p>
        </div>

        <M3Carousel label="Espaços físicos do CAMBLU" items={spaceSlides} />
      </div>

      <div className="grid-two">
        <div className="m3-card">
          <h2 className="m3-title-large" style={{ marginBlockEnd: '0.75rem' }}>
            Objetivos Estatutários
          </h2>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.5rem' }}>
            {statutoryGoals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>

        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
          <h2 className="m3-title-large">Participe das Reuniões & Conheça a FURB</h2>
          <p className="m3-body-medium">
            Todas as pautas acadêmicas são debatidas de forma democrática em reuniões semanais abertas. Você também
            pode enviar sugestões ou problemas de turma diretamente pela página de demandas.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            <Link to="/medfurb" className="m3-btn m3-btn--filled">
              <Icon name="medical_services" size={18} />
              <span>Sobre a MEDFURB</span>
            </Link>
            <Link to="/gestoes" className="m3-btn m3-btn--blue">
              <Icon name="groups" size={18} />
              <span>Histórico de Gestões</span>
            </Link>
            <Link to="/demandas" className="m3-btn m3-btn--outlined">
              <Icon name="support_agent" size={18} />
              <span>Enviar Demanda</span>
            </Link>
          </div>
        </div>
      </div>

      <SponsorsStrip />
    </section>
  );
}
