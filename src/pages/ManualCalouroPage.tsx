import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { FRESHMAN_CHECKLIST, MANUAL_CHAPTERS, MANUAL_PDF_URL } from '../data/manualCalouro';

const CHECKLIST_KEY = 'camblu.freshman.checklist';

const QUICK_PATHWAYS = [
  {
    to: '/perfil',
    title: 'Cadastro & Camiseta',
    detail: 'Informe sua turma e tamanho da camiseta de calouro.',
    icon: 'checkroom',
    bg: '#e3eeff',
    accent: '#3b82f7',
  },
  {
    to: '/medfurb/instituicoes',
    title: 'Entidades MEDFURB',
    detail: 'CAMBLU, AAARIH, DCE FURB e IFMSA Brazil.',
    icon: 'groups',
    bg: '#ebf8f1',
    accent: '#22a06b',
  },
  {
    to: '/ligas',
    title: '35 Ligas Acadêmicas',
    detail: 'Explore ensino, pesquisa e extensão desde a 1ª fase.',
    icon: 'biotech',
    bg: '#fbf3d5',
    accent: '#9c7206',
  },
  {
    to: '/calendario',
    title: 'Calendário & Sistemas',
    detail: 'Datas oficiais, DION, AVA3 e controle de AACCs.',
    icon: 'calendar_month',
    bg: '#ede9fe',
    accent: '#6d28d9',
  },
];

export function ManualCalouroPage() {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(MANUAL_CHAPTERS[0].id);
  const [checked, setChecked] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggleItem = (item: string) => {
    setChecked((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const progressPercent = Math.round((checked.length / FRESHMAN_CHECKLIST.length) * 100);

  const filteredChapters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MANUAL_CHAPTERS;
    return MANUAL_CHAPTERS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.blocks.some(
          (b) =>
            b.heading.toLowerCase().includes(q) ||
            b.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
            b.bullets?.some((li) => li.toLowerCase().includes(q)),
        ),
    );
  }, [search]);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2.25rem' }}>
      {/* Hero Editorial estilo Google Careers / Build Your Future */}
      <div className="calouro-hero m3-motion-hero">
        <div className="m3-hero-copy" style={{ display: 'grid', gap: '1.15rem' }}>
          <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
            MEDFURB · Guia do Calouro · Turma LXIII
          </span>
          <h1>Manual do Calouro</h1>
          <p className="text-muted">
            Tudo o que você precisa para começar sua graduação com segurança: entidades estudantis, Cerimônia do Jaleco, linhagens, sistemas acadêmicos (DION e AVA3), metas de AACCs, auxílios e saúde mental.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingBlockStart: '0.25rem' }}>
            <a href="#checklist-calouro" className="m3-btn m3-btn--blue">
              <Icon name="checklist" size={19} />
              <span>Checklist de Boas-Vindas</span>
            </a>
            <a href={MANUAL_PDF_URL} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
              <Icon name="picture_as_pdf" size={19} />
              <span>Baixar PDF Completo</span>
            </a>
          </div>
        </div>

        <div className="calouro-bento-tiles m3-hero-emblem" aria-label="Caminhos rápidos do calouro">
          {QUICK_PATHWAYS.map((tile) => (
            <Link key={tile.to} to={tile.to} className="calouro-bento-tile" style={{ background: tile.bg }}>
              <span
                style={{
                  inlineSize: '2.5rem',
                  blockSize: '2.5rem',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                  background: '#ffffff',
                  color: tile.accent,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name={tile.icon} size={22} />
              </span>
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <strong style={{ fontSize: '0.96rem' }}>{tile.title}</strong>
                <span className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.35 }}>
                  {tile.detail}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Galeria com espaços reservados para fotos reais da MEDFURB */}
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <h2>Momentos da Vida Acadêmica na MEDFURB</h2>
          <p className="text-muted">
            Espaços reservados para as fotos oficiais da recepção, Cerimônia do Jaleco, Hospital Universitário e espaços do CAMBLU.
          </p>
        </div>

        <div className="grid-cards">
          {[
            { icon: 'celebration', title: 'Recepção & Integração', caption: 'Foto: Recepção dos Calouros / Sunset AAARIH' },
            { icon: 'checkroom', title: 'Cerimônia do Jaleco', caption: 'Foto: Entrega solene dos jalecos aos ingressantes' },
            { icon: 'local_hospital', title: 'Hospital Universitário & Campus', caption: 'Foto: Prática clínica e Policlínica FURB' },
            { icon: 'apartment', title: 'Salas no Edifício Cristina', caption: 'Foto: Convivência e Coworking exclusivos' },
          ].map((slot) => (
            <figure
              key={slot.title}
              style={{
                margin: 0,
                aspectRatio: '16 / 10',
                borderRadius: 'var(--md-sys-shape-corner-lg)',
                border: '2px dashed var(--md-sys-color-outline-variant)',
                background: 'var(--md-sys-color-surface-container-low)',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                padding: '1rem',
                gap: '0.35rem',
                alignContent: 'center',
              }}
            >
              <Icon name={slot.icon} size={32} className="m3-badge--blue" />
              <strong style={{ fontSize: '0.94rem' }}>{slot.title}</strong>
              <figcaption className="text-muted" style={{ fontSize: '0.78rem' }}>
                {slot.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </article>

      {/* Onboarding Progress Tracker */}
      <article id="checklist-calouro" className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <h2>Primeiros Passos na MEDFURB</h2>
            <p className="text-muted">
              Acompanhe o progresso dos itens essenciais da sua recepção — salvo automaticamente no dispositivo.
            </p>
          </div>
          <strong style={{ color: 'var(--camblu-action-blue)', fontSize: '1.05rem' }}>
            {checked.length} de {FRESHMAN_CHECKLIST.length} ({progressPercent}%)
          </strong>
        </div>

        <div className="admin-bar-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="admin-bar-fill"
            style={{
              inlineSize: `${Math.max(4, progressPercent)}%`,
              background: 'var(--camblu-action-blue)',
            }}
          />
        </div>

        <div className="grid-two">
          {FRESHMAN_CHECKLIST.map((item) => {
            const done = checked.includes(item);
            return (
              <label key={item} className="calouro-checklist-label" data-done={done ? 'true' : 'false'}>
                <input type="checkbox" checked={done} onChange={() => toggleItem(item)} />
                <span style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.8 : 1 }}>
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      </article>

      {/* Busca + Índice de Capítulos */}
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 20rem' }}>
            <label htmlFor="manual-search" className="visually-hidden">
              Pesquisar no Manual do Calouro
            </label>
            <input
              id="manual-search"
              type="search"
              className="m3-input"
              placeholder="Buscar no guia (ex.: DION, AACC, SAEME, Linhagens, Intermed, Auxílio)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/perfil" className="m3-btn m3-btn--tonal">
            <Icon name="checkroom" size={18} />
            <span>Completar Perfil & Camiseta</span>
          </Link>
        </div>

        <nav aria-label="Capítulos do Manual do Calouro" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {filteredChapters.map((chap) => (
            <a
              key={chap.id}
              href={`#${chap.id}`}
              className={`m3-chip ${activeId === chap.id ? 'is-selected' : ''}`}
              style={{ textDecoration: 'none' }}
              onClick={() => setActiveId(chap.id)}
            >
              <Icon name={chap.icon} size={17} />
              <span>{chap.title}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Capítulos em Layout Editorial Assimétrico (estilo Google Build Your Future) */}
      <div style={{ display: 'grid', gap: '1.35rem' }}>
        {filteredChapters.length === 0 ? (
          <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
            <h2>Nenhum capítulo encontrado</h2>
            <p className="text-muted">Tente buscar outro termo como DION, AVA3, SAEME, AAARIH ou AACC.</p>
            <button type="button" className="m3-btn m3-btn--blue" onClick={() => setSearch('')}>
              Mostrar todos os capítulos
            </button>
          </div>
        ) : (
          filteredChapters.map((chap, idx) => (
            <article key={chap.id} id={chap.id} className="calouro-chapter-band m3-motion-stagger" style={{ '--stagger-i': idx } as React.CSSProperties}>
              <aside className="calouro-chapter-aside" style={{ display: 'grid', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      inlineSize: '2.75rem',
                      blockSize: '2.75rem',
                      borderRadius: 'var(--md-sys-shape-corner-md)',
                      background: 'var(--camblu-action-blue-container)',
                      color: 'var(--camblu-action-blue)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={chap.icon} size={22} />
                  </div>
                  <span className="m3-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Capítulo {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <h2>{chap.title}</h2>
                <p className="text-muted">{chap.summary}</p>
              </aside>

              <div style={{ display: 'grid', gap: '1.1rem' }}>
                {chap.blocks.map((block) => (
                  <div
                    key={block.heading}
                    className="m3-card m3-card--tonal"
                    style={{ padding: '1.15rem 1.25rem', display: 'grid', gap: '0.6rem' }}
                  >
                    <h3>{block.heading}</h3>
                    {block.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {block.bullets && (
                      <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.4rem' }}>
                        {block.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                    {block.links && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', paddingBlockStart: '0.35rem' }}>
                        {block.links.map((lk) => (
                          <a
                            key={lk.url}
                            href={lk.url}
                            target="_blank"
                            rel="noreferrer"
                            className="m3-btn m3-btn--blue"
                            style={{ minBlockSize: '40px' }}
                          >
                            <Icon name="open_in_new" size={17} />
                            <span>{lk.label}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
