import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { FRESHMAN_CHECKLIST, MANUAL_CHAPTERS, MANUAL_PDF_URL } from '../data/manualCalouro';

const CHECKLIST_KEY = 'camblu.freshman.checklist';

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
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="school" size={16} />
            MEDFURB 2026 · Turma LXIII
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Manual do Calouro</h1>
          <p style={{ color: '#dceddf' }}>
            Tudo o que você precisa saber nos primeiros semestres: entidades estudantis, Cerimônia do Jaleco,
            linhagens, Portal Acadêmico, DION, AVA3, AACCs, auxílios e saúde mental.
          </p>
        </div>

        <a href={MANUAL_PDF_URL} target="_blank" rel="noreferrer" className="m3-btn m3-btn--gold">
          <Icon name="picture_as_pdf" size={19} />
          <span>Baixar PDF Completo</span>
        </a>
      </div>

      {/* Checklist interativo */}
      <div className="m3-card m3-card--gold" style={{ display: 'grid', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 className="m3-title-large">Checklist dos Primeiros Passos</h2>
          <span className="m3-badge m3-badge--blue">
            {checked.length} de {FRESHMAN_CHECKLIST.length} concluídos
          </span>
        </div>
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          {FRESHMAN_CHECKLIST.map((item) => {
            const done = checked.includes(item);
            return (
              <label
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--md-sys-shape-corner-md)',
                  background: 'rgb(255 255 255 / 0.65)',
                  color: '#241c00',
                  cursor: 'pointer',
                  textDecoration: done ? 'line-through' : 'none',
                  opacity: done ? 0.75 : 1,
                }}
              >
                <input type="checkbox" checked={done} onChange={() => toggleItem(item)} />
                <span>{item}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 18rem' }}>
            <label htmlFor="manual-search" className="visually-hidden">
              Pesquisar no Manual do Calouro
            </label>
            <input
              id="manual-search"
              type="search"
              className="m3-input"
              placeholder="Pesquisar tema (ex.: DION, AACC, SAEME, Linhagens, Intermed)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/perfil" className="m3-btn m3-btn--tonal">
            <Icon name="checkroom" size={18} />
            <span>Informar tamanho da camiseta no Perfil</span>
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

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filteredChapters.map((chap) => (
            <article key={chap.id} id={chap.id} className="m3-card" style={{ display: 'grid', gap: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    inlineSize: '2.75rem',
                    blockSize: '2.75rem',
                    borderRadius: 'var(--md-sys-shape-corner-md)',
                    background: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name={chap.icon} size={22} />
                </div>
                <div>
                  <h2 className="m3-title-large">{chap.title}</h2>
                  <p className="m3-body-medium">{chap.summary}</p>
                </div>
              </div>

              {chap.blocks.map((block) => (
                <div key={block.heading} style={{ display: 'grid', gap: '0.55rem' }}>
                  <h3 className="m3-title-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                    {block.heading}
                  </h3>
                  {block.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {block.bullets && (
                    <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.35rem' }}>
                      {block.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {block.links && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBlockStart: '0.35rem' }}>
                      {block.links.map((lk) => (
                        <a
                          key={lk.url}
                          href={lk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="m3-btn m3-btn--outlined"
                        >
                          <Icon name="open_in_new" size={17} />
                          <span>{lk.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </article>
          ))}
        </div>
      </div>

      <SponsorsStrip />
    </section>
  );
}
