import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import type { AnaisEdition } from '../../types/domain';

/**
 * Admin page to publish SECIMED proceedings editions with custom PDF link and cover image upload.
 */
export function AdminAnaisPage() {
  const { anais, saveAnais } = useAppData();
  const { notify } = useToast();

  const [anaisTitle, setAnaisTitle] = useState('');
  const [anaisYear, setAnaisYear] = useState(2026);
  const [anaisPdf, setAnaisPdf] = useState('');
  const [anaisCover, setAnaisCover] = useState('');
  const [anaisSummary, setAnaisSummary] = useState('');

  const handleCoverUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAnaisCover(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAnais = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anaisTitle.trim()) return;
    const rec: AnaisEdition = {
      id: `anais-${Date.now().toString(36)}`,
      editionTitle: anaisTitle.trim(),
      year: anaisYear,
      issn: '3086-612X',
      summary: anaisSummary.trim() || 'Anais publicados em acesso aberto sob licença CC BY-NC 4.0.',
      pdfUrl: anaisPdf.trim() || 'https://drive.google.com/',
      coverImageUrl: anaisCover.trim() || undefined,
      zenodoUrl: 'https://zenodo.org/communities/secimedfurb/',
      publishedAt: new Date().toISOString().slice(0, 10),
    };
    await saveAnais(rec);
    setAnaisTitle('');
    setAnaisPdf('');
    setAnaisCover('');
    setAnaisSummary('');
    notify('Edição dos Anais publicada em /secimed/anais-secimed!');
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Anais SECIMED (ISSN 3086-612X)</h1>
        <p className="text-muted">Submeta cada edição com sua capa própria e link direto para o PDF oficial.</p>
      </header>

      <div className="grid-two">
        <form onSubmit={handleSaveAnais} className="m3-card" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
          <h2>Nova Edição</h2>
          <div className="m3-field">
            <label htmlFor="an-title">Título da edição</label>
            <input id="an-title" className="m3-input" required value={anaisTitle} onChange={(e) => setAnaisTitle(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="an-year">Ano</label>
            <input id="an-year" type="number" className="m3-input" value={anaisYear} onChange={(e) => setAnaisYear(Number(e.target.value))} />
          </div>
          <div className="m3-field">
            <label htmlFor="an-pdf">URL do PDF próprio desta edição</label>
            <input id="an-pdf" type="url" className="m3-input" required placeholder="https://..." value={anaisPdf} onChange={(e) => setAnaisPdf(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="an-cover-file">Upload de imagem de capa dos Anais</label>
            <input
              id="an-cover-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleCoverUpload(e.target.files?.[0])}
            />
          </div>
          {anaisCover && (
            <img
              src={anaisCover}
              alt="Prévia da capa dos Anais"
              style={{
                maxInlineSize: '14rem',
                aspectRatio: '16 / 10',
                objectFit: 'cover',
                borderRadius: 'var(--md-sys-shape-corner-md)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            />
          )}
          <div className="m3-field">
            <label htmlFor="an-sum">Resumo editorial</label>
            <textarea id="an-sum" className="m3-textarea" value={anaisSummary} onChange={(e) => setAnaisSummary(e.target.value)} />
          </div>
          <button type="submit" className="m3-btn m3-btn--blue" style={{ justifySelf: 'start' }}>
            <Icon name="menu_book" size={18} />
            <span>Publicar Edição</span>
          </button>
        </form>

        <article className="m3-card" style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
          <h2>Edições Publicadas ({anais.length})</h2>
          {anais.map((item) => (
            <div key={item.id} className="m3-card m3-card--tonal" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {item.coverImageUrl && (
                <img
                  src={item.coverImageUrl}
                  alt={item.editionTitle}
                  style={{ inlineSize: '4.5rem', blockSize: '3rem', objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }}
                />
              )}
              <div style={{ minInlineSize: 0 }}>
                <strong style={{ display: 'block' }}>{item.editionTitle}</strong>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                  Ano {item.year} · ISSN {item.issn}
                </span>
              </div>
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}
