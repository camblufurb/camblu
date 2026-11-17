import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { FURB_INSTITUTIONS, HOME_CAROUSEL_SLIDES } from '../data/institutional';
import { M3Carousel } from '../components/M3Carousel';
import { ExpressiveShapeFrame, M3_SHAPE_ROTATION } from '../components/ExpressiveShapeFrame';
import { Icon } from '../components/Icon';
import { CambluCrest, SponsorsStrip } from '../components/SponsorLogos';
import { formatBrlFromCents } from '../lib/validators';

export function HomePage() {
  const { events, editais } = useAppData();

  const carouselItems = HOME_CAROUSEL_SLIDES.map((s) => ({
    id: s.id,
    title: s.title,
    content: (
      <div
        style={{
          minBlockSize: 'clamp(16rem, 28vw, 22rem)',
          padding: 'clamp(1.5rem, 3.5vw, 2.75rem)',
          background: `radial-gradient(circle at 88% 18%, rgb(237 209 110 / 0.28), transparent 46%), linear-gradient(135deg, ${s.accent}, #071b13)`,
          color: '#ffffff',
          display: 'grid',
          alignContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span className="m3-badge m3-badge--gold">
            <Icon name={s.icon} size={16} />
            {s.badge}
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid rgb(255 255 255 / 0.25)',
              color: '#f1de97',
            }}
          >
            Espaço reservado para foto real
          </span>
        </div>

        <div style={{ maxInlineSize: '42rem' }}>
          <h2 style={{ color: '#ffffff', marginBlockEnd: '0.55rem' }}>{s.title}</h2>
          <p style={{ color: '#dfeee5' }}>{s.subtitle}</p>
        </div>
      </div>
    ),
  }));

  const quickShortcuts = [
    { to: '/eventos', title: 'Eventos & Ingressos', desc: 'Lotes, PIX, QR codes e certificados', icon: 'confirmation_number' },
    { to: '/lojinha', title: 'Lojinha CAMBLU', desc: 'Moletons, camisetas, garrafas e kits', icon: 'shopping_bag' },
    { to: '/clube', title: 'Clube CAMBLU', desc: 'Comum, Raro, Épico e Lendário', icon: 'workspace_premium' },
    { to: '/transparencia', title: 'Transparência', desc: 'Gráficos financeiros, heatmap e atas', icon: 'monitoring' },
    { to: '/ligas', title: '35 Ligas Acadêmicas', desc: 'Explore especialidades e Instagrams', icon: 'biotech' },
    { to: '/secimed/anais-secimed', title: 'SECIMED & Anais', desc: 'Anais científicos ISSN 3086-612X', icon: 'menu_book' },
    { to: '/manual-do-calouro', title: 'Manual do Calouro', desc: 'Guia completo MEDFURB 2026', icon: 'school' },
    { to: '/demandas', title: 'Demandas & CAMBLU Mulher', desc: 'Canal direto e acolhimento seguro', icon: 'support_agent' },
  ];

  const featuredEvents = events.filter((e) => e.published).slice(0, 3);
  const openEditais = editais.filter((ed) => ed.status === 'aberto');

  return (
    <div>
      {/* Expressive Hero */}
      <section className="page-section container m3-reveal">
        <div
          className="m3-card m3-card--forest"
          style={{
            padding: 'clamp(1.75rem, 4vw, 3.5rem)',
            borderRadius: 'var(--md-sys-shape-corner-xl)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            background:
              'radial-gradient(circle at 92% 14%, rgb(237 209 110 / 0.25), transparent 40%), linear-gradient(140deg, #071b13 0%, #0f3325 56%, #184b37 100%)',
          }}
        >
          <div style={{ display: 'grid', gap: '1.35rem', maxInlineSize: '46rem', flex: '1 1 22rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="m3-badge m3-badge--gold">
                <Icon name="verified" size={15} />
                Medicina FURB · Fundado em 1990
              </span>
              <span
                className="m3-badge"
                style={{ background: 'rgb(255 255 255 / 0.14)', color: '#f1de97' }}
              >
                Único curso em SC com Acreditação SAEME
              </span>
            </div>

            <h1 style={{ color: '#ffffff' }}>
              Centro Acadêmico de Medicina de Blumenau
            </h1>

            <p className="m3-body-large" style={{ color: '#dceddf' }}>
              Entidade sem fins lucrativos e apartidária dedicada a ser a voz dos estudantes de Medicina da FURB —
              conectando representação democrática, ciência, eventos, transparência financeira e acolhimento.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link to="/eventos" className="m3-btn m3-btn--gold">
                <Icon name="confirmation_number" size={19} />
                <span>Explorar Eventos</span>
              </Link>
              <Link to="/clube" className="m3-btn m3-btn--blue">
                <Icon name="workspace_premium" size={19} />
                <span>Conhecer Clube CAMBLU</span>
              </Link>
              <Link
                to="/manual-do-calouro"
                className="m3-btn m3-btn--outlined"
                style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.36)' }}
              >
                <Icon name="school" size={19} />
                <span>Manual do Calouro</span>
              </Link>
            </div>
          </div>

          <div
            style={{
              flex: '0 0 auto',
              marginInline: 'auto',
              padding: '1rem',
              borderRadius: '9999px',
              background: 'rgb(255 255 255 / 0.06)',
              border: '1px solid rgb(237 209 110 / 0.28)',
            }}
          >
            <CambluCrest size={156} variant="clean" />
          </div>
        </div>
      </section>

      {/* M3 Visual Carousel (Placeholders ready for photos) */}
      <section className="container m3-reveal" style={{ paddingBlockEnd: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: '0.75rem', marginBlockEnd: '1rem' }}>
          <div>
            <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
              Destaques CAMBLU
            </span>
            <h2>Vida acadêmica e espaços da MEDFURB</h2>
          </div>
          <Link to="/sobre" className="m3-btn m3-btn--text">
            <span>Ver sobre o CAMBLU e espaços</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        </div>
        <M3Carousel label="Destaques do CAMBLU e MEDFURB" items={carouselItems} />
      </section>

      {/* Representação Estudantil FURB */}
      <section className="page-section" style={{ background: 'var(--md-sys-color-surface-container-low)' }}>
        <div className="container m3-reveal">
          <div style={{ marginBlockEnd: '1.5rem' }}>
            <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
              Representação Estudantil
            </span>
            <h2>As instituições estudantis da Medicina FURB</h2>
            <p className="m3-body-medium">
              Conheça como CAMBLU, IFMSA Brazil FURB, DCE e Atlética AAARIH trabalham juntos na formação acadêmica,
              esportiva, científica e política.
            </p>
          </div>

          <div className="grid-cards">
            {FURB_INSTITUTIONS.map((inst, idx) => (
              <article
                key={inst.id}
                className="m3-card m3-card--interactive m3-shape-card"
                style={{ display: 'grid', gap: '0.9rem', alignContent: 'start' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <ExpressiveShapeFrame shape={M3_SHAPE_ROTATION[idx % M3_SHAPE_ROTATION.length]} maxWidth="4.25rem">
                    <div
                      style={{
                        inlineSize: '100%',
                        blockSize: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        background: idx % 2 === 0 ? 'var(--camblu-forest-900)' : 'var(--camblu-action-blue)',
                        color: idx % 2 === 0 ? '#edd16e' : '#ffffff',
                      }}
                    >
                      <Icon name={inst.icon} size={28} />
                    </div>
                  </ExpressiveShapeFrame>
                  <div>
                    <span className="m3-badge">{inst.founded}</span>
                    <h3 className="m3-title-large" style={{ marginBlockStart: '0.25rem' }}>
                      {inst.acronym}
                    </h3>
                  </div>
                </div>

                <p className="m3-body-medium" style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                  {inst.name}
                </p>
                <p className="m3-body-medium">{inst.summary}</p>
                <ul style={{ margin: 0, paddingInlineStart: '1.1rem', display: 'grid', gap: '0.25rem', fontSize: '0.86rem' }}>
                  {inst.pillars.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Quick Directory */}
      <section className="page-section container m3-reveal">
        <div style={{ marginBlockEnd: '1.5rem' }}>
          <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
            Ecossistema Completo
          </span>
          <h2>Acesse todas as áreas do portal</h2>
        </div>

        <div className="grid-cards">
          {quickShortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="m3-card m3-card--interactive"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.9rem',
              }}
            >
              <div
                style={{
                  inlineSize: '2.9rem',
                  blockSize: '2.9rem',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                  background: 'var(--camblu-action-blue-container)',
                  color: 'var(--camblu-action-blue)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={item.icon} size={24} />
              </div>
              <div>
                <h3 className="m3-title-medium" style={{ marginBlockEnd: '0.2rem' }}>
                  {item.title}
                </h3>
                <p className="m3-body-medium">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Eventos & Editais Highlights */}
      <section className="page-section container m3-reveal">
        <div className="grid-two">
          <div className="m3-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '1rem' }}>
              <h2 className="m3-title-large">Próximos Eventos</h2>
              <Link to="/eventos" className="m3-btn m3-btn--text">
                Ver todos
              </Link>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {featuredEvents.map((ev) => {
                const lowestLot = ev.lots[0];
                return (
                  <Link
                    key={ev.id}
                    to={`/eventos/${ev.slug}`}
                    className="m3-card m3-card--tonal m3-card--interactive"
                    style={{ textDecoration: 'none', color: 'inherit', padding: '1rem', display: 'grid', gap: '0.35rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="m3-badge m3-badge--blue">
                        {ev.mode === 'virtual' ? 'Online' : 'Presencial'}
                      </span>
                      {lowestLot && (
                        <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                          {formatBrlFromCents(lowestLot.priceCents)}
                        </strong>
                      )}
                    </div>
                    <strong>{ev.title}</strong>
                    <span className="m3-body-medium">{ev.locationShort}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="m3-card m3-card--gold">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '1rem' }}>
              <h2 className="m3-title-large">Editais Abertos & Documentos</h2>
              <Link to="/editais" className="m3-btn m3-btn--text">
                Ver editais
              </Link>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {openEditais.map((ed) => (
                <div
                  key={ed.id}
                  style={{
                    background: 'rgb(255 255 255 / 0.65)',
                    color: '#241c00',
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                  }}
                >
                  <span className="m3-badge m3-badge--success" style={{ marginBlockEnd: '0.35rem' }}>
                    {ed.program} · Aberto até {ed.deadline}
                  </span>
                  <strong style={{ display: 'block', marginBlockEnd: '0.2rem' }}>{ed.title}</strong>
                  <span style={{ fontSize: '0.86rem' }}>{ed.summary}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBlockEnd: '3rem' }}>
        <SponsorsStrip />
      </section>
    </div>
  );
}
