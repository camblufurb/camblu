import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { ExpressiveShapeFrame } from '../components/ExpressiveShapeFrame';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import type { GestaoCargo, GestaoMember } from '../types/domain';

const TOP_LEADERSHIP_CARGOS: GestaoCargo[] = ['Presidente', 'Vice-Presidente', 'Tesoureiro(a)'];

function MemberCard({
  member,
  index,
  featured = false,
}: {
  member: GestaoMember;
  index: number;
  featured?: boolean;
}) {
  return (
    <article
      className={`m3-card m3-card--interactive m3-shape-card ${featured ? 'm3-card--gold' : ''}`}
      style={{
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        gap: '0.85rem',
        padding: featured ? '1.65rem 1.25rem' : '1.25rem 1rem',
      }}
    >
      <ExpressiveShapeFrame
        shape={member.shape}
        maxWidth={featured ? '9.75rem' : '7.75rem'}
        hoverRotateDeg={index % 2 === 0 ? 5 : -5}
      >
        <img src={member.photoUrl} alt={`Foto de ${member.name} — ${member.cargo}`} loading="lazy" />
      </ExpressiveShapeFrame>

      <div style={{ display: 'grid', gap: '0.25rem' }}>
        <span className={`m3-badge ${featured ? 'm3-badge--blue' : ''}`}>{member.cargo}</span>
        <h3 className={featured ? 'm3-title-large' : 'm3-title-medium'}>{member.name}</h3>
        {member.instagram && (
          <a
            href={
              member.instagram.startsWith('http')
                ? member.instagram
                : `https://www.instagram.com/${member.instagram.replace('@', '')}/`
            }
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.84rem', fontWeight: 600 }}
          >
            {member.instagram.startsWith('@') ? member.instagram : `@${member.instagram}`}
          </a>
        )}
      </div>
    </article>
  );
}

export function GestoesPage() {
  const { gestoes } = useAppData();
  const sortedTerms = useMemo(() => [...gestoes].sort((a, b) => b.year - a.year), [gestoes]);
  const [selectedId, setSelectedId] = useState<string>(() => sortedTerms[0]?.id || '');

  const currentTerm = sortedTerms.find((g) => g.id === selectedId) || sortedTerms[0];

  const { topMembers, otherMembers } = useMemo(() => {
    if (!currentTerm) return { topMembers: [], otherMembers: [] };
    const top = TOP_LEADERSHIP_CARGOS.flatMap((cargo) =>
      currentTerm.members.filter((m) => m.cargo === cargo),
    );
    const others = currentTerm.members.filter((m) => !TOP_LEADERSHIP_CARGOS.includes(m.cargo));
    return { topMembers: top, otherMembers: others };
  }, [currentTerm]);

  if (!currentTerm) return null;

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '44rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="groups" size={16} />
            Histórico de Representação Discente
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>
            {currentTerm.chapaName} ({currentTerm.year})
          </h1>
          {currentTerm.mission && <p style={{ color: '#dceddf' }}>{currentTerm.mission}</p>}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Selecionar ano da gestão">
          {sortedTerms.map((term) => (
            <button
              key={term.id}
              type="button"
              className={`m3-btn ${term.id === currentTerm.id ? 'm3-btn--gold' : 'm3-btn--outlined'}`}
              style={term.id !== currentTerm.id ? { color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.35)' } : undefined}
              aria-pressed={term.id === currentTerm.id}
              onClick={() => setSelectedId(term.id)}
            >
              {term.year} · {term.chapaName}
            </button>
          ))}
        </div>
      </div>

      {/* Presidência e Tesouraria no topo */}
      <div>
        <h2 className="m3-title-large" style={{ marginBlockEnd: '1rem' }}>
          Presidência & Tesouraria
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
            gap: '1.25rem',
          }}
        >
          {topMembers.map((member, idx) => (
            <MemberCard key={member.id} member={member} index={idx} featured />
          ))}
        </div>
      </div>

      {/* Demais Diretorias & Treineiros abaixo */}
      <div>
        <h2 className="m3-title-large" style={{ marginBlockEnd: '1rem' }}>
          Diretorias & Integrantes
        </h2>
        <div className="grid-cards">
          {otherMembers.map((member, idx) => (
            <MemberCard key={member.id} member={member} index={idx + 3} />
          ))}
        </div>
      </div>

      {currentTerm.proposals && currentTerm.proposals.length > 0 && (
        <div className="m3-card m3-card--tonal">
          <h2 className="m3-title-large" style={{ marginBlockEnd: '0.65rem' }}>
            Principais Propostas da {currentTerm.chapaName}
          </h2>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.35rem' }}>
            {currentTerm.proposals.map((prop) => (
              <li key={prop}>{prop}</li>
            ))}
          </ul>
        </div>
      )}

      <SponsorsStrip />
    </section>
  );
}
