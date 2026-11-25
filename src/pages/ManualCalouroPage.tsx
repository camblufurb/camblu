import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExpressiveShapeFrame, M3_SHAPE_ROTATION } from '../components/ExpressiveShapeFrame';
import { Icon } from '../components/Icon';
import {
  FRESHMAN_CHECKLIST,
  MANUAL_CHAPTERS,
  MANUAL_PDF_URL,
  type ManualPhotoPlaceholder,
} from '../data/manualCalouro';
import type { M3ShapeVariant } from '../types/domain';

const TOP_GALLERY_SLOTS: {
  icon: string;
  title: string;
  caption: string;
  shape: M3ShapeVariant;
}[] = [
  { icon: 'celebration', title: 'Recepção & Integração', caption: 'Foto: Recepção dos Calouros / Sunset AAARIH', shape: 'arch' },
  { icon: 'checkroom', title: 'Cerimônia do Jaleco', caption: 'Foto: Entrega solene dos jalecos aos ingressantes', shape: 'clover4' },
  { icon: 'local_hospital', title: 'Hospital Universitário & Campus', caption: 'Foto: Prática clínica e Policlínica FURB', shape: 'sunny' },
  { icon: 'apartment', title: 'Salas no Edifício Cristina', caption: 'Foto: Convivência e Coworking exclusivos', shape: 'flower' },
];

const INLINE_PHOTO_SHAPES: M3ShapeVariant[] = [
  'clover4',
  'arch',
  'flower',
  'clover8',
  'gem',
  'pill',
  'sunny',
  'squircle',
  'circle',
  'clover4',
];

function ManualPhotoPlaceholderCard({
  slot,
  shape,
  hoverRotateDeg = 4,
  top = false,
}: {
  slot: Pick<ManualPhotoPlaceholder, 'icon' | 'title' | 'caption'>;
  shape: M3ShapeVariant;
  hoverRotateDeg?: number;
  top?: boolean;
}) {
  return (
    <figure className={`calouro-photo-placeholder m3-shape-card ${top ? 'calouro-photo-placeholder--top' : ''}`}>
      <div className="calouro-shaped-frame-wrap">
        <ExpressiveShapeFrame shape={shape} maxWidth={top ? '9.5rem' : '10.5rem'} hoverRotateDeg={hoverRotateDeg}>
          <div className="calouro-shaped-canvas" aria-hidden="true">
            <div style={{ display: 'grid', placeItems: 'center', gap: '0.25rem' }}>
              <Icon name={slot.icon} size={34} />
              <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)', fontSize: '0.68rem' }}>
                Espaço de foto
              </span>
            </div>
          </div>
        </ExpressiveShapeFrame>
      </div>

      <div className="calouro-photo-copy">
        <strong style={{ fontSize: '0.96rem' }}>{slot.title}</strong>
        <figcaption className="text-muted" style={{ fontSize: '0.82rem', maxInlineSize: 'min(100%, 40ch)' }}>
          {slot.caption}
        </figcaption>
      </div>
    </figure>
  );
}

const CHECKLIST_KEY = 'camblu.freshman.checklist';

const QUICK_PATHWAYS: {
  to: string;
  title: string;
  detail: string;
  icon: string;
  shape: M3ShapeVariant;
  bg: string;
  accent: string;
}[] = [
  {
    to: '/perfil',
    title: 'Cadastro & Camiseta',
    detail: 'Informe sua turma e tamanho da camiseta de calouro.',
    icon: 'checkroom',
    shape: 'clover4',
    bg: '#d4f3e4',
    accent: '#166547',
  },
  {
    to: '/medfurb/instituicoes',
    title: 'Entidades MEDFURB',
    detail: 'CAMBLU, AAARIH, DCE FURB e IFMSA Brazil.',
    icon: 'groups',
    shape: 'sunny',
    bg: '#ebf8f1',
    accent: '#22a06b',
  },
  {
    to: '/ligas',
    title: '35 Ligas Acadêmicas',
    detail: 'Explore ensino, pesquisa e extensão desde a 1ª fase.',
    icon: 'biotech',
    shape: 'flower',
    bg: '#fbf3d5',
    accent: '#9c7206',
  },
  {
    to: '/calendario',
    title: 'Calendário & Sistemas',
    detail: 'Datas oficiais, DION, AVA3 e controle de AACCs.',
    icon: 'calendar_month',
    shape: 'gem',
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
            b.bullets?.some((li) => li.toLowerCase().includes(q)) ||
            b.photoSlot?.title.toLowerCase().includes(q) ||
            b.photoSlot?.caption.toLowerCase().includes(q) ||
            b.links?.some((lk) => lk.label.toLowerCase().includes(q)),
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
          {QUICK_PATHWAYS.map((tile, tIdx) => (
            <Link key={tile.to} to={tile.to} className="calouro-bento-tile m3-shape-card" style={{ background: tile.bg }}>
              <div className="calouro-icon-shape-wrap">
                <ExpressiveShapeFrame shape={tile.shape} maxWidth="2.85rem" hoverRotateDeg={tIdx % 2 === 0 ? 6 : -6}>
                  <div
                    className="calouro-icon-shape-inner"
                    style={{ background: '#ffffff', color: tile.accent }}
                    aria-hidden="true"
                  >
                    <Icon name={tile.icon} size={22} />
                  </div>
                </ExpressiveShapeFrame>
              </div>
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
          {TOP_GALLERY_SLOTS.map((slot, sIdx) => (
            <ManualPhotoPlaceholderCard
              key={slot.title}
              slot={slot}
              shape={slot.shape}
              hoverRotateDeg={sIdx % 2 === 0 ? 5 : -5}
              top
            />
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
          filteredChapters.map((chap, idx) => {
            const iconShape = M3_SHAPE_ROTATION[(idx + 2) % M3_SHAPE_ROTATION.length];
            const photoShape = INLINE_PHOTO_SHAPES[idx % INLINE_PHOTO_SHAPES.length];
            const rotateDeg = idx % 2 === 0 ? 5 : -5;
            return (
              <article key={chap.id} id={chap.id} className="calouro-chapter-band m3-motion-stagger" style={{ '--stagger-i': idx } as React.CSSProperties}>
                <aside className="calouro-chapter-aside m3-shape-card" style={{ display: 'grid', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="calouro-icon-shape-wrap">
                      <ExpressiveShapeFrame shape={iconShape} maxWidth="2.85rem" hoverRotateDeg={rotateDeg}>
                        <div
                          className="calouro-icon-shape-inner"
                          style={{ background: 'var(--camblu-action-blue-container)', color: 'var(--camblu-action-blue)' }}
                          aria-hidden="true"
                        >
                          <Icon name={chap.icon} size={22} />
                        </div>
                      </ExpressiveShapeFrame>
                    </div>
                    <span className="m3-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Capítulo {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h2>{chap.title}</h2>
                  <p className="text-muted">{chap.summary}</p>
                </aside>

                <div className="calouro-chapter-content">
                  {chap.blocks.map((block) => {
                    const photoInsertIdx = block.photoSlot
                      ? Math.min(block.photoSlot.afterParagraphIndex ?? 0, Math.max(0, block.paragraphs.length - 1))
                      : -1;
                    return (
                      <div key={block.heading} className="m3-card m3-card--tonal calouro-block-card">
                        <h3>{block.heading}</h3>
                        {block.paragraphs.length === 0 && block.photoSlot && (
                          <ManualPhotoPlaceholderCard
                            slot={block.photoSlot}
                            shape={photoShape}
                            hoverRotateDeg={rotateDeg}
                          />
                        )}
                        {block.paragraphs.map((p, pIdx) => (
                          <Fragment key={p}>
                            <p>{p}</p>
                            {block.photoSlot && photoInsertIdx === pIdx && (
                              <ManualPhotoPlaceholderCard
                                slot={block.photoSlot}
                                shape={photoShape}
                                hoverRotateDeg={rotateDeg}
                              />
                            )}
                          </Fragment>
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
                          {block.links.map((lk) =>
                            lk.url.startsWith('/') ? (
                              <Link
                                key={lk.url}
                                to={lk.url}
                                className="m3-btn m3-btn--blue"
                                style={{ minBlockSize: '40px' }}
                              >
                                <Icon name="arrow_forward" size={17} />
                                <span>{lk.label}</span>
                              </Link>
                            ) : (
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
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
            );
          })
        )}
      </div>
    </section>
  );
}
