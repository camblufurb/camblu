import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExpressiveShapeFrame } from '../../components/ExpressiveShapeFrame';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import type { LigaAcademica } from '../../types/domain';

/**
 * Admin management for FURB Medicine academic leagues including custom logo upload.
 */
export function AdminLigasPage() {
  const { ligas, saveLiga } = useAppData();
  const { notify } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [ligaAcronym, setLigaAcronym] = useState('');
  const [ligaName, setLigaName] = useState('');
  const [ligaArea, setLigaArea] = useState<LigaAcademica['area']>('Clínica');
  const [ligaInsta, setLigaInsta] = useState('');
  const [ligaLogo, setLigaLogo] = useState('');

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLigaLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const startEditLiga = (liga: LigaAcademica) => {
    setEditingId(liga.id);
    setLigaAcronym(liga.acronym);
    setLigaName(liga.name);
    setLigaArea(liga.area);
    setLigaInsta(liga.instagramHandle);
    setLigaLogo(liga.logoUrl || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setLigaAcronym('');
    setLigaName('');
    setLigaArea('Clínica');
    setLigaInsta('');
    setLigaLogo('');
  };

  const handleSaveLiga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ligaAcronym.trim() || !ligaName.trim()) return;
    const handle = ligaInsta.trim()
      ? ligaInsta.trim().startsWith('@')
        ? ligaInsta.trim()
        : `@${ligaInsta.trim()}`
      : `@${ligaAcronym.trim().toLowerCase()}furb`;
    const existing = editingId ? ligas.find((l) => l.id === editingId) : undefined;
    await saveLiga({
      id: editingId || ligaAcronym.toLowerCase().replace(/[^a-z0-9]/g, ''),
      acronym: ligaAcronym.trim().toUpperCase(),
      name: ligaName.trim(),
      area: ligaArea,
      instagramHandle: handle,
      instagramUrl: `https://www.instagram.com/${handle.replace('@', '')}/`,
      logoUrl: ligaLogo.trim() || undefined,
      shape: existing?.shape || 'squircle',
    });
    resetForm();
    notify('Liga acadêmica salva no catálogo!');
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <h1>Ligas Acadêmicas ({ligas.length})</h1>
          <p className="text-muted">Cadastre ou edite ligas médicas com upload direto da imagem da logo.</p>
        </div>
        <Link to="/ligas" className="m3-btn m3-btn--outlined">
          <Icon name="open_in_new" size={17} />
          <span>Ver Diretório Público</span>
        </Link>
      </header>

      <div className="grid-two">
        <form onSubmit={handleSaveLiga} className="m3-card" style={{ display: 'grid', gap: '0.85rem', alignContent: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <h2>{editingId ? `Editar ${ligaAcronym}` : 'Adicionar Liga Acadêmica'}</h2>
            {editingId && (
              <button type="button" className="m3-btn m3-btn--text" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="lg-acr">Sigla</label>
              <input id="lg-acr" className="m3-input" required value={ligaAcronym} onChange={(e) => setLigaAcronym(e.target.value)} />
            </div>
            <div className="m3-field">
              <label htmlFor="lg-area">Área</label>
              <select id="lg-area" className="m3-select" value={ligaArea} onChange={(e) => setLigaArea(e.target.value as LigaAcademica['area'])}>
                {['Clínica', 'Cirúrgica', 'Saúde Coletiva & Mental', 'Pediatria & GO', 'Diagnóstico & Básicas'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="m3-field">
            <label htmlFor="lg-name">Nome completo</label>
            <input id="lg-name" className="m3-input" required value={ligaName} onChange={(e) => setLigaName(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="lg-insta">Instagram</label>
            <input id="lg-insta" className="m3-input" placeholder="@ligafurb" value={ligaInsta} onChange={(e) => setLigaInsta(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="lg-logo-upload">Upload da imagem de logo da liga</label>
            <input
              id="lg-logo-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            />
          </div>
          {ligaLogo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ExpressiveShapeFrame shape="squircle" maxWidth="4.5rem" fit="logo">
                <img src={ligaLogo} alt="Prévia da logo da liga" />
              </ExpressiveShapeFrame>
              <span className="m3-badge m3-badge--success">Logo carregada</span>
            </div>
          )}
          <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
            <Icon name="biotech" size={18} />
            <span>{editingId ? 'Salvar Alterações' : 'Salvar Liga'}</span>
          </button>
        </form>

        <article className="m3-card" style={{ display: 'grid', gap: '0.6rem', alignContent: 'start', maxBlockSize: '34rem', overflowY: 'auto' }}>
          <h2>Catálogo Atual (clique para editar/trocar logo)</h2>
          {ligas.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => startEditLiga(l)}
              className="m3-card m3-card--tonal m3-card--interactive"
              style={{
                padding: '0.7rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'start',
                cursor: 'pointer',
              }}
            >
              {l.logoUrl && (
                <img
                  src={l.logoUrl}
                  alt={l.acronym}
                  style={{ inlineSize: '2.5rem', blockSize: '2.5rem', objectFit: 'contain', borderRadius: '0.5rem', flexShrink: 0 }}
                />
              )}
              <div style={{ minInlineSize: 0 }}>
                <strong>{l.acronym}</strong> · {l.name}
                <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>
                  {l.area} · {l.instagramHandle}
                </span>
              </div>
            </button>
          ))}
        </article>
      </div>
    </div>
  );
}
