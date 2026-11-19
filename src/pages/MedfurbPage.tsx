import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { CurriculumTimelineSection } from '../components/CurriculumTimelineSection';
import { MEDFURB_DATA } from '../data/institutional';

const SECTION_ANCHORS = [
  { id: 'sec-saeme', label: 'Acreditação SAEME', icon: 'verified' },
  { id: 'sec-diretoria', label: 'Diretoria & Colegiado', icon: 'account_tree' },
  { id: 'sec-infraestrutura', label: 'Infraestrutura', icon: 'apartment' },
  { id: 'sec-auxilio', label: 'Auxílio Estudantil', icon: 'payments' },
  { id: 'sec-estagios', label: 'Estágios Optativos', icon: 'local_hospital' },
  { id: 'sec-tcc', label: 'TCC', icon: 'science' },
  { id: 'sec-contatos', label: 'Contatos Oficiais', icon: 'call' },
  { id: 'sec-matriz', label: 'Matriz Curricular', icon: 'view_timeline' },
];

const MEDFURB_KPIS = [
  {
    figure: `${MEDFURB_DATA.anniversaryYears} anos`,
    title: 'Tradição na formação médica em Blumenau',
    detail: `Curso fundado em ${MEDFURB_DATA.foundedDate}, com ensino humanizado voltado à prática clínica.`,
  },
  {
    figure: `${MEDFURB_DATA.graduatedClasses} turmas`,
    title: 'Egressos atuando em todo o país',
    detail: `Atualmente recebendo a ${MEDFURB_DATA.currentFreshmenClass}, com vestibular ACAFE semestral.`,
  },
  {
    figure: '80 critérios',
    title: 'Único curso em SC com selo SAEME',
    detail: `Acreditado pelo CFM/WFME desde ${MEDFURB_DATA.saeme.accreditedSince}, válido até ${MEDFURB_DATA.saeme.validUntil}.`,
  },
];

export function MedfurbPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '0.5rem', overflowX: 'clip' }}>
      {/* 1. Hero Editorial + Contatos + Navegação por Pills em Âncora */}
      <section className="page-section container m3-motion-hero" style={{ display: 'grid', gap: '1.5rem' }}>
        <div
          className="m3-card m3-card--forest page-hero-card"
          style={{
            background:
              'radial-gradient(circle at 88% 18%, rgb(237 209 110 / 0.22), transparent 44%), linear-gradient(140deg, #071b13 0%, #0f3325 60%, #174936 100%)',
          }}
        >
          <div className="m3-hero-copy page-hero-inner">
            <span className="m3-label-large" style={{ color: '#f1de97' }}>
              Medicina FURB · Fundado em {MEDFURB_DATA.foundedDate}
            </span>
            <AnimatedClimateTitle tone="light" accessibleHeading="Sobre a MEDFURB">
              MedFURB
            </AnimatedClimateTitle>
            <p className="page-hero-desc">
              Hospital Universitário próprio, acreditação internacional SAEME e estrutura integrada de ensino, pesquisa e
              extensão em saúde para formação médica generalista em Blumenau.
            </p>
            <div className="page-hero-actions">
              <Link to="/medfurb/instituicoes" className="m3-btn m3-btn--gold">
                <Icon name="handshake" size={18} />
                <span>Instituições Estudantis</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Pills exclusivas para navegar até os pontos da página */}
        <nav aria-label="Navegação rápida pelos tópicos da MEDFURB" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {SECTION_ANCHORS.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="m3-chip" style={{ textDecoration: 'none' }}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </section>

      {/* 2. Faixa de Marcos / Métricas (Estilo Workspace Retail) */}
      <section className="page-section container" style={{ paddingBlockStart: '0.75rem', display: 'grid', gap: '1.5rem' }}>
        <h2>A Medicina FURB em números e marcos oficiais</h2>
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))' }}>
          {MEDFURB_KPIS.map((kpi, idx) => (
            <article
              key={kpi.figure}
              className="m3-card m3-card--tonal m3-motion-stagger"
              style={{ '--stagger-i': idx, display: 'grid', gap: '0.5rem', alignContent: 'start' } as React.CSSProperties}
            >
              <strong style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)', color: 'var(--camblu-action-blue)' }}>
                {kpi.figure}
              </strong>
              <h3>{kpi.title}</h3>
              <p className="text-muted">{kpi.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Seção SAEME (Layout Alternado 2 Colunas — Texto + Painel Dourado) */}
      <section id="sec-saeme" className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container grid-two" style={{ alignItems: 'center' }}>
          <div className="m3-motion-from-start" style={{ display: 'grid', gap: '0.85rem' }}>
            <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
              Reconhecimento CFM / WFME
            </span>
            <h2>Acreditação Internacional SAEME</h2>
            <p>
              O curso passou por autoavaliação institucional e avaliação presencial in loco por comissão formada por três
              médicos e representação estudantil (USP), seguindo parâmetros internacionais da Federação Mundial para
              Educação Médica (WFME).
            </p>
            <p className="text-muted">
              Acertado entre os 44 cursos certificados no país, o selo fortalece convênios acadêmicos e abre portas para
              estágios e validações internacionais.
            </p>
          </div>

          <div className="m3-card m3-card--gold m3-motion-from-end" style={{ display: 'grid', gap: '0.85rem' }}>
            <h3>Destaques da Certificação</h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.55rem' }}>
              {MEDFURB_DATA.saeme.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <span className="m3-label-large" style={{ color: '#2b2100' }}>
              Válido até {MEDFURB_DATA.saeme.validUntil} · {MEDFURB_DATA.saeme.criteriaCount} critérios avaliados
            </span>
          </div>
        </div>
      </section>

      {/* 4. Seção Diretoria & Colegiado (Alternado Direita/Esquerda) */}
      <section id="sec-diretoria" className="page-section container" style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="m3-motion-from-start" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.45rem' }}>
          <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
            Governança Acadêmica
          </span>
          <h2>Diretoria, Coordenação e Colegiado do Curso</h2>
          <p className="text-muted">
            Conheça os gestores do curso na FURB e a composição docente e discente do Colegiado de Medicina.
          </p>
        </div>

        <div className="grid-two" style={{ alignItems: 'start' }}>
          <div className="m3-card m3-motion-from-start" style={{ display: 'grid', gap: '0.75rem' }}>
            <h3>Diretoria & Reitoria FURB</h3>
            <div style={{ display: 'grid', gap: '0.55rem' }}>
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

          <div className="m3-card m3-card--tonal m3-motion-from-end" style={{ display: 'grid', gap: '0.85rem' }}>
            <h3>Membros do Colegiado de Medicina</h3>
            <p className="text-muted">
              Instância deliberativa responsável por pautas curriculares, matriz de disciplinas e decisões pedagógicas do
              curso, com participação estudantil representada pelo CAMBLU.
            </p>
            <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.45rem' }}>
              {MEDFURB_DATA.collegiumMembers.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Seção Infraestrutura (Showcase em Grade Clean) */}
      <section id="sec-infraestrutura" className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="m3-motion-from-end" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.45rem' }}>
            <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
              Campi, Laboratórios & Campos de Prática
            </span>
            <h2>Infraestrutura de Ensino e Pesquisa</h2>
            <p className="text-muted">
              Estrutura distribuída entre o Campus 1, o Campus 5 (Hospital Universitário) e os espaços exclusivos dos
              acadêmicos no Edifício Cristina.
            </p>
          </div>

          <div className="grid-cards">
            {MEDFURB_DATA.infrastructure.map((item, idx) => (
              <div
                key={item}
                className="m3-card m3-motion-stagger"
                style={
                  {
                    '--stagger-i': idx,
                    padding: '1.1rem',
                    display: 'flex',
                    gap: '0.7rem',
                    alignItems: 'flex-start',
                  } as React.CSSProperties
                }
              >
                <Icon name="check_circle" size={22} className="m3-badge--blue" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Seção Auxílio Estudantil (4 Cards com CTA Externo) */}
      <section id="sec-auxilio" className="page-section container" style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="m3-motion-from-start" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.45rem' }}>
          <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
            Permanência Estudantil
          </span>
          <h2>Auxílios, Bolsas e Financiamentos FURB</h2>
          <p className="text-muted">
            Programas estaduais e créditos educativos próprios da universidade para apoiar a continuidade dos estudos.
          </p>
        </div>

        <div className="grid-two">
          {MEDFURB_DATA.studentAid.map((aid, idx) => (
            <article
              key={aid.name}
              className="m3-card m3-card--interactive m3-motion-stagger"
              style={
                {
                  '--stagger-i': idx,
                  display: 'grid',
                  gap: '0.85rem',
                  alignContent: 'space-between',
                } as React.CSSProperties
              }
            >
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <h3>{aid.name}</h3>
                  {aid.badge && (
                    <span
                      className="m3-badge m3-badge--gold"
                      style={{ flexShrink: 0 }}
                      title="Patrocinador institucional"
                    >
                      {aid.badge}
                    </span>
                  )}
                </div>
                <p className="text-muted">{aid.summary}</p>
              </div>
              <a
                href={aid.url}
                target="_blank"
                rel="noreferrer"
                className="m3-btn m3-btn--text"
                style={{ justifySelf: 'start', paddingInlineStart: 0 }}
              >
                <span>{aid.linkLabel}</span>
                <Icon name="open_in_new" size={18} />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* 7. Seção Estágios Optativos (Split Asymmetric Showcase) */}
      <section id="sec-estagios" className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container grid-two" style={{ alignItems: 'start' }}>
          <div className="m3-motion-from-start" style={{ display: 'grid', gap: '0.85rem' }}>
            <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
              Internato · 12ª Fase
            </span>
            <h2>Estágios Optativos no Brasil e Exterior</h2>
            <p>{MEDFURB_DATA.optionalInternships.description}</p>
            <p className="text-muted">{MEDFURB_DATA.optionalInternships.tips}</p>
          </div>

          <div className="m3-card m3-motion-from-end" style={{ display: 'grid', gap: '0.75rem' }}>
            <h3>Instituições frequentemente procuradas</h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.4rem' }}>
              {MEDFURB_DATA.optionalInternships.hospitals.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8. Seção TCC (Split Asymmetric Invertido) */}
      <section id="sec-tcc" className="page-section container" style={{ display: 'grid', gap: '1.75rem' }}>
        <div className="grid-two" style={{ alignItems: 'start' }}>
          <div className="m3-card m3-card--tonal m3-motion-from-start" style={{ display: 'grid', gap: '0.75rem' }}>
            <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
              6ª à 8ª Fase
            </span>
            <h2>Trabalho de Conclusão de Curso (TCC)</h2>
            <p>{MEDFURB_DATA.tcc.description}</p>
            <h3>Requisitos para escolha do orientador</h3>
            <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.35rem' }}>
              {MEDFURB_DATA.tcc.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="m3-card m3-motion-from-end" style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
            <h3>Coordenação e Disciplinas de Pesquisa</h3>
            <p className="text-muted">
              Entre em contato com os docentes responsáveis de acordo com a fase em andamento:
            </p>
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {MEDFURB_DATA.tcc.contacts.map((c) => (
                <p
                  key={c}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    background: 'var(--md-sys-color-surface-container-low)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  {c}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. Seção Contatos Oficiais do Curso */}
      <section id="sec-contatos" className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="m3-motion-from-start" style={{ maxInlineSize: '46rem', display: 'grid', gap: '0.45rem' }}>
            <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
              Atendimento & Secretaria
            </span>
            <h2>Contatos Oficiais da Medicina FURB</h2>
            <p className="text-muted">
              Canais diretos do Departamento de Medicina e informações sobre o ingresso pelo vestibular.
            </p>
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))' }}>
            <article className="m3-card m3-motion-stagger" style={{ '--stagger-i': 0, display: 'grid', gap: '0.55rem', alignContent: 'start' } as React.CSSProperties}>
              <span className="m3-label-large" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--camblu-action-blue)' }}>
                <Icon name="mail" size={19} />
                Departamento de Medicina
              </span>
              <a href={`mailto:${MEDFURB_DATA.departmentEmail}`} style={{ fontSize: '1.05rem', fontWeight: 700, overflowWrap: 'anywhere' }}>
                {MEDFURB_DATA.departmentEmail}
              </a>
              <p className="text-muted">Atendimento institucional e demandas acadêmicas da graduação.</p>
            </article>

            <article className="m3-card m3-motion-stagger" style={{ '--stagger-i': 1, display: 'grid', gap: '0.55rem', alignContent: 'start' } as React.CSSProperties}>
              <span className="m3-label-large" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--camblu-action-blue)' }}>
                <Icon name="call" size={19} />
                Telefone da Secretaria
              </span>
              <a href={`tel:${MEDFURB_DATA.departmentPhone.replace(/\D/g, '')}`} style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {MEDFURB_DATA.departmentPhone}
              </a>
              <p className="text-muted">Contato telefônico direto com a secretaria do curso na FURB.</p>
            </article>

            <article className="m3-card m3-motion-stagger" style={{ '--stagger-i': 2, display: 'grid', gap: '0.55rem', alignContent: 'start' } as React.CSSProperties}>
              <span className="m3-label-large" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--camblu-action-blue)' }}>
                <Icon name="school" size={19} />
                Ingresso na Graduação
              </span>
              <strong>Vestibular ACAFE (junho e novembro)</strong>
              <p className="text-muted">Seleções semestrais com ingresso de novas turmas a cada semestre letivo.</p>
            </article>
          </div>
        </div>
      </section>

      {/* 10. Linha do Tempo Horizontal da Matriz Curricular 2025.1 */}
      <CurriculumTimelineSection />
    </div>
  );
}
