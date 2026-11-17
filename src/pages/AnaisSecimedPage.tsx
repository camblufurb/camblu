import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { SECIMED_INFO } from '../data/institutional';

export function AnaisSecimedPage() {
  const { anais } = useAppData();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...anais]
      .sort((a, b) => b.year - a.year)
      .filter(
        (ed) =>
          !q ||
          ed.editionTitle.toLowerCase().includes(q) ||
          ed.summary.toLowerCase().includes(q) ||
          String(ed.year).includes(q),
      );
  }, [anais, search]);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'grid', gap: '0.85rem' }}>
        <span className="m3-label-large" style={{ color: '#f1de97' }}>
          ISSN {SECIMED_INFO.issn} · Acesso Aberto CC BY-NC 4.0 · Publicação Gratuita
        </span>

        <h1>Anais da Semana Científica de Medicina (SECIMED)</h1>
        <p style={{ color: '#dceddf' }}>
          Publicação científica oficial do curso de Medicina da FURB reunindo os trabalhos e resumos aprovados e
          apresentados na SECIMED, promovendo ciência aberta e intercâmbio acadêmico gratuito.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <a href={SECIMED_INFO.zenodoUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--gold">
            <Icon name="open_in_new" size={18} />
            <span>Comunidade no Zenodo</span>
          </a>
          <Link to="/secimed" className="m3-btn m3-btn--outlined" style={{ color: '#ffffff', borderColor: 'rgb(255 255 255 / 0.35)' }}>
            <Icon name="science" size={18} />
            <span>Sobre a SECIMED</span>
          </Link>
        </div>
      </div>

      {/* Repositório de Edições Submetidas no /back */}
      <div className="m3-card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2>Edições Publicadas (PDF)</h2>
            <p className="text-muted">Anais submetidos e indexados pela Comissão Editorial do CAMBLU.</p>
          </div>
          <input
            type="search"
            className="m3-input"
            style={{ maxInlineSize: '20rem' }}
            placeholder="Filtrar por edição ou ano..."
            aria-label="Filtrar anais por ano ou título"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid-two">
          {filtered.map((ed) => (
            <article key={ed.id} className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', alignContent: 'space-between' }}>
              <div>
                <span className="m3-label-small text-muted" style={{ display: 'block', marginBlockEnd: '0.35rem' }}>
                  Edição {ed.year} · ISSN {ed.issn}
                </span>
                <h3 style={{ marginBlockEnd: '0.35rem' }}>
                  {ed.editionTitle}
                </h3>
                <p className="text-muted">{ed.summary}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                <a href={ed.pdfUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--filled">
                  <Icon name="picture_as_pdf" size={18} />
                  <span>Abrir Anais (PDF)</span>
                </a>
                {ed.zenodoUrl && (
                  <a href={ed.zenodoUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
                    <Icon name="open_in_new" size={18} />
                    <span>Zenodo</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Corpo Editorial & Normas */}
      <div className="grid-two">
        <div className="m3-card" style={{ display: 'grid', gap: '0.75rem' }}>
          <h2>Comissão Organizadora & Corpo Editorial</h2>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem', display: 'grid', gap: '0.4rem' }}>
            {SECIMED_INFO.editorialBoard.map((b) => (
              <li key={b.role + b.name}>
                <strong>{b.role}:</strong> {b.name}
              </li>
            ))}
          </ul>
          <h3 style={{ marginBlockStart: '0.5rem' }}>
            Política Editorial & Direitos Autorais
          </h3>
          <p className="text-muted">
            Submissões de ensino, extensão e pesquisa em acesso aberto imediato sob licença{' '}
            <strong>{SECIMED_INFO.license}</strong>, sem cobrança de taxas (APCs), com direitos mantidos pelos autores.
          </p>
        </div>

        <div className="m3-card" style={{ display: 'grid', gap: '0.75rem' }}>
          <h2>Revisão Duplo-Cega por Pares (10 Critérios)</h2>
          <p className="text-muted">
            Após triagem inicial (Desk Review), cada resumo passa por dois pareceristas independentes avaliando 0 /
            0,5 / 1,0 ponto por critério:
          </p>
          <ol style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: '0.3rem', fontSize: '0.92rem' }}>
            {SECIMED_INFO.evaluationCriteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </div>
      </div>

      <SponsorsStrip />
    </section>
  );
}
