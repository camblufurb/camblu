import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { ExpressiveShapeFrame } from '../components/ExpressiveShapeFrame';
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
        <h3>{member.name}</h3>
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
          <span className="m3-label-large" style={{ display: 'block', marginBlockEnd: '0.4rem', color: '#f1de97' }}>
            Representação Discente
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>
            {currentTerm.chapaName} ({currentTerm.year})
          </h1>
          {currentTerm.mission && <p style={{ color: '#dceddf' }}>{currentTerm.mission}</p>}
        </div>

        <div className="m3-field" style={{ minInlineSize: 'min(100%, 18rem)' }}>
          <label htmlFor="gestao-select" style={{ color: '#f1de97' }}>
            Selecionar gestão
          </label>
          <select
            id="gestao-select"
            className="m3-select"
            value={currentTerm.id}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              background: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-on-surface)',
              borderColor: 'rgb(237 209 110 / 0.5)',
            }}
          >
            {sortedTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.year} · {term.chapaName} ({term.members.length} membros)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Presidência e Tesouraria no topo */}
      <div>
        <h2 style={{ marginBlockEnd: '1rem' }}>
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
        <h2 style={{ marginBlockEnd: '1rem' }}>
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
          <h2 style={{ marginBlockEnd: '0.65rem' }}>
            Principais Propostas da {currentTerm.chapaName}
          </h2>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.35rem' }}>
            {currentTerm.proposals.map((prop) => (
              <li key={prop}>{prop}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
