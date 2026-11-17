import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';

export function EditaisPage() {
  const { editais } = useAppData();
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberto' | 'em_breve' | 'encerrado'>('todos');

  const filtered = useMemo(
    () => editais.filter((e) => statusFilter === 'todos' || e.status === statusFilter),
    [editais, statusFilter],
  );

  const badgeForStatus = (status: string) => {
    if (status === 'aberto') return { cls: 'm3-badge--success', text: 'Inscrições Abertas' };
    if (status === 'em_breve') return { cls: 'm3-badge--blue', text: 'Em breve' };
    return { cls: '', text: 'Encerrado' };
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest">
        <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
          <Icon name="description" size={16} />
          Fomento Científico & Institucional
        </span>
        <h1 style={{ marginBlockEnd: '0.5rem' }}>Editais do CAMBLU</h1>
        <p style={{ color: '#dceddf' }}>
          Programas de apoio acadêmico e financeiro (E-PAF, E-PAATC, E-PAFLIEC), eleições estudantis e chamadas da
          SECIMED com download direto do edital em PDF e formulário oficial para envio de documentos.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} role="group" aria-label="Filtrar editais por status">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'aberto', label: 'Abertos' },
          { id: 'em_breve', label: 'Em breve' },
          { id: 'encerrado', label: 'Encerrados' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className="m3-chip"
            aria-pressed={statusFilter === f.id}
            onClick={() => setStatusFilter(f.id as typeof statusFilter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid-two">
        {filtered.map((ed) => {
          const st = badgeForStatus(ed.status);
          return (
            <article key={ed.id} className="m3-card" style={{ display: 'grid', gap: '0.9rem', alignContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                  <span className="m3-badge m3-badge--gold">{ed.program}</span>
                  <span className={`m3-badge ${st.cls}`}>{st.text}</span>
                  <span className="m3-body-medium" style={{ fontSize: '0.84rem' }}>
                    Prazo: {ed.deadline}
                  </span>
                </div>
                <h2>{ed.title}</h2>
                <p className="text-muted">{ed.summary}</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                <a href={ed.pdfUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
                  <Icon name="picture_as_pdf" size={18} />
                  <span>Abrir Edital (PDF)</span>
                </a>
                <a href={ed.formsUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--filled">
                  <Icon name="assignment_turned_in" size={18} />
                  <span>Inscrever / Enviar Documentos</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <SponsorsStrip />
    </section>
  );
}
