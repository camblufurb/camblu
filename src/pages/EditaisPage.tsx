import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Icon } from '../components/Icon';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import type { EditalItem } from '../types/domain';

const SECTION_CONFIG: { status: EditalItem['status']; heading: string; badgeClass: string; badgeLabel: string }[] = [
  { status: 'aberto', heading: 'Editais Abertos', badgeClass: 'm3-badge--success', badgeLabel: 'Inscrições Abertas' },
  { status: 'em_breve', heading: 'Em Breve', badgeClass: 'm3-badge--blue', badgeLabel: 'Em breve' },
  { status: 'encerrado', heading: 'Encerrados', badgeClass: '', badgeLabel: 'Encerrado' },
];

/**
 * Displays official CAMBLU funding and election notices grouped into open, upcoming, and closed sections.
 */
export function EditaisPage() {
  const { editais } = useAppData();
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberto' | 'em_breve' | 'encerrado'>('todos');

  const sections = useMemo(() => {
    return SECTION_CONFIG
      .filter((sec) => statusFilter === 'todos' || sec.status === statusFilter)
      .map((sec) => ({
        ...sec,
        items: editais.filter((e) => e.status === sec.status),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [editais, statusFilter]);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest page-hero-card">
        <div className="page-hero-inner">
          <AnimatedClimateTitle tone="light">
            Editais
          </AnimatedClimateTitle>
          <p className="page-hero-desc">
            Programas de apoio acadêmico e financeiro (E-PAF, E-PAATC, E-PAFLIEC), eleições estudantis e chamadas da
            SECIMED com download direto do edital oficial em PDF.
          </p>
        </div>
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

      {sections.length === 0 ? (
        <div className="m3-card m3-card--tonal">
          <p className="text-muted">Nenhum edital encontrado nesta categoria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {sections.map((section) => (
            <div key={section.status} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2>{section.heading}</h2>
                <span className={`m3-badge ${section.badgeClass}`}>{section.items.length}</span>
              </div>

              <div className="grid-two">
                {section.items.map((ed) => (
                  <article key={ed.id} className="m3-card" style={{ display: 'grid', gap: '0.9rem', alignContent: 'space-between' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                        <span className="m3-label-small" style={{ color: 'var(--md-sys-color-primary)' }}>
                          {ed.program}
                        </span>
                        <span className={`m3-badge ${section.badgeClass}`}>{section.badgeLabel}</span>
                        <span className="text-muted" style={{ fontSize: '0.84rem' }}>
                          Prazo: {ed.deadline}
                        </span>
                      </div>
                      <h3>{ed.title}</h3>
                      <p className="text-muted">{ed.summary}</p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                      <a href={ed.pdfUrl} target="_blank" rel="noreferrer" className="m3-btn m3-btn--outlined">
                        <Icon name="picture_as_pdf" size={18} />
                        <span>Abrir Edital (PDF)</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
