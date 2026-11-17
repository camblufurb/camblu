import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { MEDFURB_DATA } from '../data/institutional';

type MedTab = 'saeme' | 'diretoria' | 'infraestrutura' | 'auxilio' | 'estagios' | 'tcc';

export function MedfurbPage() {
  const [tab, setTab] = useState<MedTab>('saeme');

  const tabs: { id: MedTab; label: string; icon: string }[] = [
    { id: 'saeme', label: 'Acreditação SAEME', icon: 'verified' },
    { id: 'diretoria', label: 'Diretoria & Colegiado', icon: 'account_tree' },
    { id: 'infraestrutura', label: 'Infraestrutura', icon: 'apartment' },
    { id: 'auxilio', label: 'Auxílio Estudantil', icon: 'payments' },
    { id: 'estagios', label: 'Estágios Optativos', icon: 'local_hospital' },
    { id: 'tcc', label: 'TCC', icon: 'science' },
  ];

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest">
        <span className="m3-label-large" style={{ display: 'block', marginBlockEnd: '0.45rem', color: '#f1de97' }}>
          Curso de Medicina FURB · Desde {MEDFURB_DATA.foundedDate}
        </span>
        <h1 style={{ marginBlockEnd: '0.55rem' }}>Sobre a MEDFURB</h1>
        <p style={{ color: '#dceddf' }}>
          São {MEDFURB_DATA.anniversaryYears} anos formando médicos clínicos gerais humanizados em Blumenau, com{' '}
          {MEDFURB_DATA.graduatedClasses} turmas formadas, Hospital Universitário próprio e o selo internacional
          SAEME.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBlockStart: '1rem', fontSize: '0.9rem', color: '#f1de97' }}>
          <span>Departamento: {MEDFURB_DATA.departmentEmail}</span>
          <span>·</span>
          <span>Telefone: {MEDFURB_DATA.departmentPhone}</span>
          <span>·</span>
          <span>Vestibular ACAFE (junho e novembro)</span>
        </div>
        <div style={{ marginBlockStart: '1.15rem' }}>
          <Link to="/medfurb/instituicoes" className="m3-btn m3-btn--gold">
            <Icon name="handshake" size={18} />
            <span>Conhecer Instituições Estudantis</span>
          </Link>
        </div>
      </div>

      <div role="tablist" aria-label="Seções sobre a MEDFURB" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`m3-chip ${tab === item.id ? 'is-selected' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'saeme' && (
        <div className="m3-card m3-card--gold" style={{ display: 'grid', gap: '1rem' }}>
          <span className="m3-label-large" style={{ color: '#2b2100' }}>
            Acreditado desde {MEDFURB_DATA.saeme.accreditedSince} · Válido até {MEDFURB_DATA.saeme.validUntil} ·{' '}
            {MEDFURB_DATA.saeme.criteriaCount} critérios avaliados
          </span>
          <h2>Acreditação Internacional SAEME (CFM / WFME)</h2>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.5rem' }}>
            {MEDFURB_DATA.saeme.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p style={{ color: '#2b2100' }}>
            O processo envolveu autoavaliação institucional e avaliação presencial in loco por comissão formada por
            três médicos e representação estudantil (USP), seguindo parâmetros da Federação Mundial para Educação
            Médica.
          </p>
        </div>
      )}

      {tab === 'diretoria' && (
        <div className="grid-two">
          <div className="m3-card">
            <h2 style={{ marginBlockEnd: '0.9rem' }}>
              Diretoria & Coordenação FURB
            </h2>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {MEDFURB_DATA.directors.map((d) => (
                <div
                  key={d.role}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    background: 'var(--md-sys-color-surface-container-low)',
                  }}
                >
                  <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)', display: 'block' }}>
                    {d.role}
                  </span>
                  <strong>{d.name}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="m3-card">
            <h2 style={{ marginBlockEnd: '0.9rem' }}>
              Membros do Colegiado de Medicina
            </h2>
            <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.45rem' }}>
              {MEDFURB_DATA.collegiumMembers.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'infraestrutura' && (
        <div className="m3-card">
          <h2 style={{ marginBlockEnd: '0.9rem' }}>
            Laboratórios, Hospitais & Espaços de Ensino
          </h2>
          <div className="grid-cards">
            {MEDFURB_DATA.infrastructure.map((item) => (
              <div key={item} className="m3-card m3-card--tonal" style={{ padding: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Icon name="check_circle" className="m3-badge--blue" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'auxilio' && (
        <div className="grid-cards">
          {MEDFURB_DATA.studentAid.map((aid) => (
            <article key={aid.name} className="m3-card" style={{ display: 'grid', gap: '0.65rem', alignContent: 'space-between' }}>
              <div>
                <h2 style={{ marginBlockEnd: '0.45rem' }}>
                  {aid.name}
                </h2>
                <p className="text-muted">{aid.summary}</p>
              </div>
              <a href={aid.url} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
                <Icon name="open_in_new" size={18} />
                <span>Edital e detalhes na FURB</span>
              </a>
            </article>
          ))}
        </div>
      )}

      {tab === 'estagios' && (
        <div className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
          <h2>Estágios Optativos (Internato)</h2>
          <p>{MEDFURB_DATA.optionalInternships.description}</p>
          <p className="text-muted">{MEDFURB_DATA.optionalInternships.tips}</p>
          <div>
            <h3 style={{ marginBlockEnd: '0.5rem' }}>
              Algumas instituições procuradas por acadêmicos MEDFURB:
            </h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.35rem' }}>
              {MEDFURB_DATA.optionalInternships.hospitals.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'tcc' && (
        <div className="grid-two">
          <div className="m3-card" style={{ display: 'grid', gap: '0.75rem' }}>
            <h2>Trabalho de Conclusão de Curso (TCC)</h2>
            <p>{MEDFURB_DATA.tcc.description}</p>
            <h3>Requisitos para escolha do orientador:</h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.35rem' }}>
              {MEDFURB_DATA.tcc.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.6rem', alignContent: 'start' }}>
            <h3>Coordenação e Disciplinas de Pesquisa</h3>
            {MEDFURB_DATA.tcc.contacts.map((c) => (
              <p key={c} style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {c}
              </p>
            ))}
          </div>
        </div>
      )}

      <SponsorsStrip />
    </section>
  );
}
