import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { LIGAS_CREATE_DRIVE_URL } from '../data/ligas';
import { ExpressiveShapeFrame } from '../components/ExpressiveShapeFrame';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';

export function LigasPage() {
  const { ligas } = useAppData();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<string>('Todas');

  const areas = ['Todas', 'Clínica', 'Cirúrgica', 'Saúde Coletiva & Mental', 'Pediatria & GO', 'Diagnóstico & Básicas'];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ligas.filter((l) => {
      const matchArea = area === 'Todas' || l.area === area;
      const matchText =
        !q ||
        l.acronym.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.instagramHandle.toLowerCase().includes(q);
      return matchArea && matchText;
    });
  }, [ligas, search, area]);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="biotech" size={16} />
            Ensino · Pesquisa · Extensão
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Catálogo de Ligas Acadêmicas</h1>
          <p style={{ color: '#dceddf' }}>
            A MEDFURB conta com {ligas.length} Ligas Acadêmicas ativas aprovadas pelo DAEX. O CAMBLU organiza o
            calendário unificado e impulsiona grandes eventos por meio do edital PAF-Ligas.
          </p>
        </div>
        <a
          href={LIGAS_CREATE_DRIVE_URL}
          target="_blank"
          rel="noreferrer"
          className="m3-btn m3-btn--gold"
        >
          <Icon name="folder_open" size={19} />
          <span>Manual: Como criar uma Liga</span>
        </a>
      </div>

      <div className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 18rem' }}>
            <label htmlFor="ligas-search" className="visually-hidden">
              Buscar liga por sigla ou especialidade
            </label>
            <input
              id="ligas-search"
              type="search"
              className="m3-input"
              placeholder="Buscar por sigla (ex.: LACC, LIORTE) ou área médica..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="m3-badge m3-badge--blue">{filtered.length} ligas exibidas</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }} role="group" aria-label="Filtrar por área">
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              className="m3-chip"
              aria-pressed={area === a}
              onClick={() => setArea(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-cards">
        {filtered.map((liga, idx) => (
          <article
            key={liga.id}
            className="m3-card m3-card--interactive m3-shape-card"
            style={{ display: 'grid', gap: '0.9rem', alignContent: 'space-between', textAlign: 'center' }}
          >
            <div style={{ display: 'grid', placeItems: 'center', gap: '0.75rem' }}>
              <ExpressiveShapeFrame
                shape={liga.shape}
                maxWidth="7.5rem"
                hoverRotateDeg={idx % 2 === 0 ? 6 : -6}
              >
                {liga.logoUrl ? (
                  <img src={liga.logoUrl} alt={`Logo ${liga.acronym}`} loading="lazy" />
                ) : (
                  <div
                    style={{
                      inlineSize: '100%',
                      blockSize: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      background:
                        idx % 3 === 0
                          ? 'linear-gradient(135deg, #0f3325, #1f6047)'
                          : idx % 3 === 1
                            ? 'linear-gradient(135deg, #173b78, #3b82f7)'
                            : 'linear-gradient(135deg, #5d4a07, #c29b22)',
                      color: '#ffffff',
                      padding: '0.5rem',
                    }}
                  >
                    <strong style={{ fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{liga.acronym}</strong>
                  </div>
                )}
              </ExpressiveShapeFrame>

              <div>
                <span className="m3-badge" style={{ marginBlockEnd: '0.35rem' }}>
                  {liga.area}
                </span>
                <h2>{liga.acronym}</h2>
                <p className="text-muted">{liga.name}</p>
              </div>
            </div>

            <a
              href={liga.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="m3-btn m3-btn--tonal"
              style={{ inlineSize: '100%' }}
            >
              <Icon name="open_in_new" size={18} />
              <span>{liga.instagramHandle}</span>
            </a>
          </article>
        ))}
      </div>

      <SponsorsStrip />
    </section>
  );
}
