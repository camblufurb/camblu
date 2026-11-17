import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import type { EditalItem } from '../../types/domain';

export function AdminEditaisPage() {
  const { editais, saveEdital, deleteEdital } = useAppData();
  const { notify } = useToast();

  const [edTitle, setEdTitle] = useState('');
  const [edProgram, setEdProgram] = useState('E-PAF');
  const [edCustomProgram, setEdCustomProgram] = useState('');
  const [edStatus, setEdStatus] = useState<EditalItem['status']>('aberto');
  const [edDeadline, setEdDeadline] = useState('2026-12-20');
  const [edPdfUrl, setEdPdfUrl] = useState('');
  const [edFormsUrl, setEdFormsUrl] = useState('');
  const [edSummary, setEdSummary] = useState('');

  const handleSaveEdital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edTitle.trim()) return;
    const resolvedProgram =
      edProgram === 'Outro' ? edCustomProgram.trim() || 'Outro' : edProgram;
    await saveEdital({
      id: `ed-${Date.now().toString(36)}`,
      title: edTitle.trim(),
      program: resolvedProgram,
      status: edStatus,
      deadline: edDeadline,
      pdfUrl: edPdfUrl.trim() || 'https://www.camblu.org/editais',
      formsUrl: edFormsUrl.trim() || 'https://docs.google.com/forms/',
      summary: edSummary.trim() || 'Confira o edital oficial publicado pelo CAMBLU.',
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    setEdTitle('');
    setEdSummary('');
    setEdCustomProgram('');
    notify('Edital publicado!');
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Editais (PDF + Google Forms)</h1>
        <p className="text-muted">Publique e gerencie editais de fomento científico, ligas e seleções no portal.</p>
      </header>

      <div className="grid-two">
        <form onSubmit={handleSaveEdital} className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
          <h2>Novo Edital</h2>
          <div className="m3-field">
            <label htmlFor="ed-title">Título do edital</label>
            <input id="ed-title" className="m3-input" required value={edTitle} onChange={(e) => setEdTitle(e.target.value)} />
          </div>
          <div className="grid-two">
            <div className="m3-field">
              <label htmlFor="ed-prog">Programa</label>
              <select id="ed-prog" className="m3-select" value={edProgram} onChange={(e) => setEdProgram(e.target.value)}>
                {['E-PAF', 'E-PAATC', 'E-PAFLIEC', 'SECIMED', 'Eleições', 'Outro'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="m3-field">
              <label htmlFor="ed-st">Status</label>
              <select id="ed-st" className="m3-select" value={edStatus} onChange={(e) => setEdStatus(e.target.value as EditalItem['status'])}>
                <option value="aberto">Aberto</option>
                <option value="em_breve">Em breve</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>
          {edProgram === 'Outro' && (
            <div className="m3-field">
              <label htmlFor="ed-prog-custom">Nome do programa personalizado</label>
              <input
                id="ed-prog-custom"
                className="m3-input"
                required
                placeholder="Digite o nome do programa ou edital..."
                value={edCustomProgram}
                onChange={(e) => setEdCustomProgram(e.target.value)}
              />
            </div>
          )}
          <div className="m3-field">
            <label htmlFor="ed-dead">Prazo final</label>
            <input id="ed-dead" type="date" className="m3-input" value={edDeadline} onChange={(e) => setEdDeadline(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-pdf">Link do PDF</label>
            <input id="ed-pdf" type="url" className="m3-input" value={edPdfUrl} onChange={(e) => setEdPdfUrl(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-forms">Link do Google Forms</label>
            <input id="ed-forms" type="url" className="m3-input" value={edFormsUrl} onChange={(e) => setEdFormsUrl(e.target.value)} />
          </div>
          <div className="m3-field">
            <label htmlFor="ed-sum">Resumo</label>
            <textarea id="ed-sum" className="m3-textarea" value={edSummary} onChange={(e) => setEdSummary(e.target.value)} />
          </div>
          <button type="submit" className="m3-btn m3-btn--filled" style={{ justifySelf: 'start' }}>
            <Icon name="publish" size={18} />
            <span>Publicar Edital</span>
          </button>
        </form>

        <article className="m3-card" style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
          <h2>Editais Cadastrados ({editais.length})</h2>
          {editais.map((ed) => (
            <div
              key={ed.id}
              className="m3-card m3-card--tonal"
              style={{ padding: '0.8rem 0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem' }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>{ed.title}</strong>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {ed.program} · {ed.status} · prazo {ed.deadline}
                </span>
              </div>
              <button type="button" className="m3-icon-btn" aria-label={`Excluir ${ed.title}`} onClick={() => deleteEdital(ed.id)}>
                <Icon name="delete" size={17} />
              </button>
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}
