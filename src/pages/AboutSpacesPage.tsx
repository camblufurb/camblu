import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { M3Carousel } from '../components/M3Carousel';
import { M3Dialog } from '../components/M3Dialog';
import { Icon } from '../components/Icon';
import { SPACES_DATA } from '../data/institutional';
import type { GestaoMember } from '../types/domain';

const CAMBLU_PILLARS = [
  {
    icon: 'groups',
    title: 'Reuniões Semanais Abertas',
    description:
      'Toda pauta acadêmica e estudantil passa por reuniões democráticas abertas a qualquer estudante de Medicina da FURB, com atas publicadas em Transparência.',
  },
  {
    icon: 'gavel',
    title: 'Representação nos Conselhos',
    description:
      'Assento discente ativo junto à Coordenação do Curso, Colegiado, Departamento de Medicina e articulação conjunta com o DCE FURB.',
  },
  {
    icon: 'science',
    title: 'Fomento Científico & Ligas',
    description:
      'Coordenação do calendário das Ligas Acadêmicas, realização anual da SECIMED, publicação dos Anais (ISSN) e patrocínio via editais E-PAF, E-PAATC e E-PAFLIEC.',
  },
  {
    icon: 'storefront',
    title: 'Gestão Financeira, Lojinha & Clube',
    description:
      'Reinvestimento transparente de receitas em infraestrutura do Edifício Cristina, bolsas estudantis, recepção de calouros e projetos do curso.',
  },
];

const STATUTORY_GOALS = [
  'Promover debates, palestras, seminários, jornadas, eventos culturais e esportivos.',
  'Fiscalizar e garantir a atualização do acervo bibliográfico e infraestrutura do curso.',
  'Incentivar a formação ética, crítica, humanística, científica e política dos acadêmicos.',
  'Manter diálogo constante com entidades representativas nacionais e internacionais (IFMSA, DCE, AAARIH).',
  'Lutar pelo aperfeiçoamento contínuo da graduação e indissociabilidade entre ensino, pesquisa e extensão.',
  'Realizar reuniões semanais democráticas e abertas a todos os estudantes de Medicina da FURB.',
];

function buildMarqueeRowMembers(members: GestaoMember[], rowIndex: number): GestaoMember[] {
  if (members.length === 0) return [];
  const subset = members.filter((_, i) => i % 3 === rowIndex);
  const source = subset.length > 0 ? subset : members;
  const repeated: GestaoMember[] = [];
  while (repeated.length < 8) {
    repeated.push(...source);
  }
  return repeated;
}

/**
 * Displays CAMBLU's institutional mission, current leadership rolling portrait gallery,
 * statutory structure, and Edifício Cristina student spaces.
 */
export function AboutSpacesPage() {
  const { gestoes } = useAppData();
  const [selectedMember, setSelectedMember] = useState<GestaoMember | null>(null);

  const currentTerm = useMemo(
    () => [...gestoes].sort((a, b) => b.year - a.year)[0],
    [gestoes],
  );

  const marqueeRows = useMemo(() => {
    const members = currentTerm?.members || [];
    return [
      { id: 'row-1', speedSeconds: 28, reverse: false, items: buildMarqueeRowMembers(members, 0) },
      { id: 'row-2', speedSeconds: 38, reverse: true, items: buildMarqueeRowMembers(members, 1) },
      { id: 'row-3', speedSeconds: 32, reverse: false, items: buildMarqueeRowMembers(members, 2) },
    ];
  }, [currentTerm]);

  const spaceSlides = SPACES_DATA.map((space, index) => ({
    id: space.id,
    title: space.name,
    content: (
      <div
        style={{
          minBlockSize: 'clamp(16rem, 30vw, 22rem)',
          padding: 'clamp(1.25rem, 3vw, 2.5rem)',
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
          <span className="m3-label-large" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#edd16e' }}>
            <Icon name={space.icon} size={18} />
            {space.location}
          </span>
          <span className="m3-label-small" style={{ color: '#e8f1eb' }}>
            {space.status}
          </span>
        </div>

        <div>
          <h3 style={{ color: '#ffffff', marginBlockEnd: '0.5rem' }}>
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

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2.5rem' }}>
      <div className="m3-card m3-card--forest sobre-hero">
        <div style={{ display: 'grid', gap: '0.85rem', maxInlineSize: '48rem' }}>
          <span className="m3-label-large" style={{ color: '#f1de97' }}>
            Centro Acadêmico de Medicina de Blumenau · Desde 1990
          </span>
          <h1 style={{ color: '#ffffff' }}>Sobre o CAMBLU e Nossos Espaços</h1>
          <p style={{ color: '#dceddf' }}>
            Fundado em 1990, o CAMBLU atua de forma apartidária e sem fins lucrativos como ponte direta entre os
            acadêmicos de Medicina da FURB, a coordenação do curso, os conselhos superiores e a sociedade — além de
            manter três espaços físicos exclusivos no Edifício Cristina.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <Link to="/gestoes" className="m3-btn m3-btn--gold">
            <Icon name="groups" size={18} />
            <span>Ver Gestões Completas</span>
          </Link>
          <Link to="/demandas" className="m3-btn m3-btn--blue">
            <Icon name="support_agent" size={18} />
            <span>Enviar Demanda</span>
          </Link>
        </div>
      </div>

      {/* Como o CAMBLU funciona no dia a dia */}
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gap: '0.35rem', maxInlineSize: '46rem' }}>
          <h2>Como o CAMBLU funciona</h2>
          <p className="text-muted">
            Organizado em diretorias eleitas anualmente pelos estudantes, o Centro Acadêmico combina representação
            institucional, infraestrutura estudantil, editais de incentivo e acolhimento.
          </p>
        </div>

        <div className="grid-cards">
          {CAMBLU_PILLARS.map((pillar) => (
            <article key={pillar.title} className="m3-card" style={{ display: 'grid', gap: '0.65rem', alignContent: 'start' }}>
              <div
                style={{
                  inlineSize: '2.75rem',
                  blockSize: '2.75rem',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                  background: 'var(--camblu-action-blue-container)',
                  color: 'var(--camblu-action-blue)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name={pillar.icon} size={22} />
              </div>
              <h3>{pillar.title}</h3>
              <p className="text-muted">{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Gestão Atual — Roll de fotos circulares em 3 fileiras */}
      {currentTerm && currentTerm.members.length > 0 && (
        <article className="m3-card" style={{ display: 'grid', gap: '1.25rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <h2>Gestão Atual ({currentTerm.chapaName} · {currentTerm.year})</h2>
              <p className="text-muted">
                Clique em qualquer foto para visualizar o nome e o cargo do integrante na diretoria.
              </p>
            </div>
            <Link to="/gestoes" className="m3-btn m3-btn--outlined">
              <Icon name="badge" size={18} />
              <span>Ver todas as gestões</span>
            </Link>
          </div>

          <div className="sobre-marquee-wrap" aria-label={`Diretores da gestão ${currentTerm.chapaName}`}>
            {marqueeRows.map((row) => (
              <div key={row.id} className="sobre-marquee-row">
                <div
                  className="sobre-marquee-track"
                  data-reverse={row.reverse ? 'true' : 'false'}
                  style={{ '--marquee-duration': `${row.speedSeconds}s` } as React.CSSProperties}
                >
                  {[...row.items, ...row.items].map((member, copyIdx) => (
                    <button
                      key={`${row.id}-${member.id}-${copyIdx}`}
                      type="button"
                      className="sobre-member-btn"
                      aria-label={`${member.name} — ${member.cargo}`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <img
                        className="sobre-member-avatar"
                        src={member.photoUrl}
                        alt={member.name}
                        loading="eager"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Espaços Físicos */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2>Espaços do CAMBLU</h2>
          <p className="text-muted">
            Solicite a senha atualizada de acesso diretamente com um integrante da gestão ou pelo Instagram{' '}
            <a href="https://www.instagram.com/camblufurb/" target="_blank" rel="noreferrer">
              @camblufurb
            </a>
            .
          </p>
        </div>

        <M3Carousel label="Espaços físicos do CAMBLU" items={spaceSlides} />
      </div>

      {/* Objetivos Estatutários + CTA */}
      <div className="grid-two">
        <div className="m3-card">
          <h2 style={{ marginBlockEnd: '0.75rem' }}>
            Objetivos Estatutários
          </h2>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.5rem' }}>
            {STATUTORY_GOALS.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </div>

        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
          <h2>Participe das Reuniões & Conheça a FURB</h2>
          <p className="text-muted">
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

      <M3Dialog
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || 'Integrante da Gestão'}
      >
        {selectedMember && (
          <div style={{ display: 'grid', gap: '1rem', justifyItems: 'center', textAlign: 'center' }}>
            <img
              src={selectedMember.photoUrl}
              alt={selectedMember.name}
              style={{
                inlineSize: '8.5rem',
                blockSize: '8.5rem',
                borderRadius: '9999px',
                objectFit: 'cover',
                border: '3px solid var(--camblu-action-blue)',
                boxShadow: 'var(--elevation-2)',
              }}
            />
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <span className="m3-badge m3-badge--blue" style={{ justifySelf: 'center' }}>
                {selectedMember.cargo}
              </span>
              <h3>{selectedMember.name}</h3>
              {currentTerm && (
                <p className="text-muted">
                  {currentTerm.chapaName} ({currentTerm.year})
                </p>
              )}
            </div>
            {selectedMember.instagram && (
              <a
                href={
                  selectedMember.instagram.startsWith('http')
                    ? selectedMember.instagram
                    : `https://www.instagram.com/${selectedMember.instagram.replace('@', '')}/`
                }
                target="_blank"
                rel="noreferrer"
                className="m3-btn m3-btn--outlined"
              >
                <Icon name="open_in_new" size={17} />
                <span>
                  {selectedMember.instagram.startsWith('@')
                    ? selectedMember.instagram
                    : `@${selectedMember.instagram}`}
                </span>
              </a>
            )}
          </div>
        )}
      </M3Dialog>
    </section>
  );
}
