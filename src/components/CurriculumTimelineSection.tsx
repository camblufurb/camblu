import { useMemo, useRef, useState } from 'react';
import {
  CURRICULUM_MATRIX_PDF_URL,
  CURRICULUM_META,
  CURRICULUM_OPTATIVAS_7TH,
  CURRICULUM_PHASES,
  TIMELINE_TRACKS,
  type CurriculumCategoryId,
  type CurriculumSubject,
  type CurriculumTimelineTrack,
  type TimelineBarSegment,
} from '../data/curriculumMatrix';
import { Icon } from './Icon';

type CategoryFilter = 'todos' | CurriculumCategoryId;

type InspectorSelection =
  | { kind: 'phase'; phaseNumber: number }
  | { kind: 'segment'; track: CurriculumTimelineTrack; segment: TimelineBarSegment };

const CATEGORY_CHIPS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'todos', label: 'Toda a Matriz (1ª–12ª)', icon: 'view_timeline' },
  { id: 'basico', label: 'Morfofuncional & Básico', icon: 'science' },
  { id: 'integracao', label: 'Comunidade, MFC & Pesquisa', icon: 'groups' },
  { id: 'clinica', label: 'Semiologia & Clínica Médica', icon: 'stethoscope' },
  { id: 'cirurgia', label: 'Cirurgia & Urgências', icon: 'medical_services' },
  { id: 'internato', label: 'Internato & Ciclos Finais', icon: 'local_hospital' },
];

function collectSegmentSubjects(segment: TimelineBarSegment): { phase: number; subject: CurriculumSubject }[] {
  const namesSet = new Set(segment.subjectNames);
  const rows: { phase: number; subject: CurriculumSubject }[] = [];
  for (const phaseNum of segment.phases) {
    const phaseObj = CURRICULUM_PHASES.find((p) => p.phase === phaseNum);
    if (!phaseObj) continue;
    for (const sub of phaseObj.subjects) {
      if (namesSet.has(sub.name)) {
        rows.push({ phase: phaseNum, subject: sub });
      }
    }
  }
  return rows;
}

/**
 * Interactive horizontal 12-semester curriculum timeline sourced from
 * FURB Medicina Matrix 2025.1.022-0 (Parecer 037/2024).
 */
export function CurriculumTimelineSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<CategoryFilter>('todos');
  const [selection, setSelection] = useState<InspectorSelection>({ kind: 'phase', phaseNumber: 1 });

  const visibleTracks = useMemo(() => {
    if (filter === 'todos') return TIMELINE_TRACKS;
    if (filter === 'internato') {
      return TIMELINE_TRACKS.filter(
        (t) => t.category === 'internato' || t.segments.some((s) => s.phases.some((p) => p >= 9)),
      );
    }
    return TIMELINE_TRACKS.filter((t) => t.category === filter);
  }, [filter]);

  const scrollTimeline = (direction: -1 | 1) => {
    const node = scrollContainerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.65), behavior: 'smooth' });
  };

  const selectedPhaseObj =
    selection.kind === 'phase'
      ? CURRICULUM_PHASES.find((p) => p.phase === selection.phaseNumber) || CURRICULUM_PHASES[0]
      : null;

  const selectedSegmentSubjects =
    selection.kind === 'segment' ? collectSegmentSubjects(selection.segment) : [];

  const showOptativesList =
    (selection.kind === 'phase' && selection.phaseNumber === 7) ||
    (selection.kind === 'segment' && selection.segment.subjectNames.includes('Disciplina Optativa'));

  return (
    <section id="sec-matriz" className="page-section container" style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
        <div style={{ maxInlineSize: '48rem', display: 'grid', gap: '0.4rem' }}>
          <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
            Currículo {CURRICULUM_META.curriculumCode} · {CURRICULUM_META.approvalOpinion}
          </span>
          <h2>Linha do Tempo dos Semestres & Matérias</h2>
          <p className="text-muted">
            Visualize como as disciplinas e eixos formativos avançam da 1ª à 12ª fase ({CURRICULUM_META.totalHours.toLocaleString('pt-BR')}h totais).
            Clique em qualquer barra ou semestre para conferir carga horária e pré-requisitos oficiais.
          </p>
        </div>

        <a
          href={CURRICULUM_MATRIX_PDF_URL}
          target="_blank"
          rel="noreferrer"
          className="m3-btn m3-btn--outlined"
        >
          <Icon name="picture_as_pdf" size={18} />
          <span>Matriz Oficial FURB (PDF)</span>
        </a>
      </div>

      {/* Resumo de métricas oficiais da matriz */}
      <div className="matriz-meta-pills">
        <span className="m3-badge">Total: {CURRICULUM_META.totalHours.toLocaleString('pt-BR')}h ({CURRICULUM_META.totalCredits} CA)</span>
        <span className="m3-badge m3-badge--blue">Teórica: {CURRICULUM_META.totalTheoryHours.toLocaleString('pt-BR')}h · Prática: {CURRICULUM_META.totalPracticeHours.toLocaleString('pt-BR')}h</span>
        <span className="m3-badge">Extensão: {CURRICULUM_META.totalExtensionHours.toLocaleString('pt-BR')}h</span>
        <span className="m3-badge m3-badge--gold">Ativ. Complementares: {CURRICULUM_META.complementaryHours}h</span>
      </div>

      {/* Filtros + controles de rolagem horizontal */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }} role="group" aria-label="Filtrar linha do tempo por eixo curricular">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="m3-chip"
              aria-pressed={filter === chip.id}
              onClick={() => setFilter(chip.id)}
            >
              <Icon name={chip.icon} size={17} />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        <div className="matriz-scroll-controls">
          <span className="m3-label-small text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Icon name="swipe" size={16} />
            <span>1ª à 12ª Fase</span>
          </span>
          <button
            type="button"
            className="m3-icon-btn"
            aria-label="Rolar matriz para fases anteriores"
            onClick={() => scrollTimeline(-1)}
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <button
            type="button"
            className="m3-icon-btn"
            aria-label="Rolar matriz para próximas fases"
            onClick={() => scrollTimeline(1)}
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      </div>

      {/* Palco Gantt Horizontal (scroll horizontal contido dentro do card) */}
      <div className="m3-card matriz-stage-card">
        <div className="matriz-legend" aria-label="Legenda dos eixos curriculares">
          <span className="matriz-legend-item">
            <span className="matriz-dot matriz-dot--basico" aria-hidden="true" />
            Morfofuncional & Básico
          </span>
          <span className="matriz-legend-item">
            <span className="matriz-dot matriz-dot--integracao" aria-hidden="true" />
            Comunidade & Pesquisa
          </span>
          <span className="matriz-legend-item">
            <span className="matriz-dot matriz-dot--clinica" aria-hidden="true" />
            Clínica Médica (Especialidades)
          </span>
          <span className="matriz-legend-item">
            <span className="matriz-dot matriz-dot--cirurgia" aria-hidden="true" />
            Cirurgia & Urgências
          </span>
          <span className="matriz-legend-item">
            <span className="matriz-dot matriz-dot--internato" aria-hidden="true" />
            Internato
          </span>
        </div>

        <div ref={scrollContainerRef} className="matriz-scroll-viewport" tabIndex={0} aria-label="Linha do tempo horizontal dos 12 semestres de Medicina">
          <div className="matriz-canvas">
            {/* Faixa macro dos 3 ciclos */}
            <div className="matriz-cycles-row" aria-hidden="true">
              <div className="matriz-cycle-banner matriz-cycle-banner--basico" style={{ gridColumn: '1 / span 4' }}>
                Ciclo Básico · 1ª a 4ª Fase
              </div>
              <div className="matriz-cycle-banner matriz-cycle-banner--clinico" style={{ gridColumn: '5 / span 4' }}>
                Ciclo Clínico · 5ª a 8ª Fase
              </div>
              <div className="matriz-cycle-banner matriz-cycle-banner--internato" style={{ gridColumn: '9 / span 4' }}>
                Internato Médico · 9ª a 12ª Fase
              </div>
            </div>

            {/* Cabeçalhos clicáveis das 12 fases */}
            <div className="matriz-phases-header" role="group" aria-label="Selecionar fase para ver disciplinas">
              {CURRICULUM_PHASES.map((phase) => {
                const isSelected = selection.kind === 'phase' && selection.phaseNumber === phase.phase;
                const isHighlightedBySeg =
                  selection.kind === 'segment' && selection.segment.phases.includes(phase.phase);
                return (
                  <button
                    key={phase.phase}
                    type="button"
                    className={`matriz-phase-btn ${isSelected ? 'is-selected' : ''} ${isHighlightedBySeg ? 'is-seg-active' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelection({ kind: 'phase', phaseNumber: phase.phase })}
                  >
                    <strong>{phase.label}</strong>
                    <span>{phase.totalHours}h</span>
                  </button>
                );
              })}
            </div>

            {/* Trilhas horizontais com barras finas contendo apenas o nome da matéria */}
            <div className="matriz-tracks-list">
              {visibleTracks.map((track) => {
                const minPhase = Math.min(...track.segments.map((s) => s.startPhase));
                const maxPhase = Math.max(...track.segments.map((s) => s.endPhase));
                const hasSplitRail = track.segments.length > 1;

                return (
                  <div key={track.id} className="matriz-track-grid">
                    {/* Guias verticais das 12 colunas de semestre */}
                    {CURRICULUM_PHASES.map((p) => (
                      <div
                        key={p.phase}
                        className={`matriz-grid-col ${
                          selection.kind === 'phase' && selection.phaseNumber === p.phase ? 'is-col-selected' : ''
                        }`}
                        style={{ gridColumn: `${p.phase} / span 1` }}
                        aria-hidden="true"
                      />
                    ))}

                    {/* Trilho conector discreto entre blocos descontínuos (ex.: F7-9 até F12) */}
                    {hasSplitRail && (
                      <div
                        className="matriz-track-rail"
                        style={{ gridColumn: `${minPhase} / span ${maxPhase - minPhase + 1}` }}
                        aria-hidden="true"
                      />
                    )}

                    {/* Barras coloridas finas posicionadas exatamente nos semestres da matéria */}
                    {track.segments.map((seg) => {
                      const spanCount = seg.endPhase - seg.startPhase + 1;
                      const isSegSelected =
                        selection.kind === 'segment' && selection.segment.id === seg.id;
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          className={`matriz-bar matriz-bar--${track.category} ${
                            spanCount === 1 ? 'matriz-bar--single' : ''
                          } ${isSegSelected ? 'is-selected' : ''}`}
                          style={{ gridColumn: `${seg.startPhase} / span ${spanCount}` }}
                          aria-pressed={isSegSelected}
                          title={`${seg.label} (${seg.hoursLabel})`}
                          onClick={() => setSelection({ kind: 'segment', track, segment: seg })}
                        >
                          <span className="matriz-bar-label">{seg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inspetor interativo abaixo da matriz */}
      <article className="m3-card m3-card--tonal matriz-inspector" aria-live="polite">
        {selectedPhaseObj ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gap: '0.2rem' }}>
                <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
                  {selectedPhaseObj.cycle} · Matriz FURB 2025.1
                </span>
                <h3>{selectedPhaseObj.label} — Componentes Curriculares ({selectedPhaseObj.subjects.length})</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                <span className="m3-badge m3-badge--blue">{selectedPhaseObj.totalHours}h totais ({selectedPhaseObj.credits} CA)</span>
                <span className="m3-badge">T: {selectedPhaseObj.theoryHours}h · P: {selectedPhaseObj.practiceHours}h</span>
                {selectedPhaseObj.extensionHours > 0 && (
                  <span className="m3-badge">Ext: {selectedPhaseObj.extensionHours}h</span>
                )}
                {selectedPhaseObj.eadHours > 0 && (
                  <span className="m3-badge">EaD: {selectedPhaseObj.eadHours}h</span>
                )}
              </div>
            </div>

            <div className="matriz-subjects-grid">
              {selectedPhaseObj.subjects.map((sub) => (
                <div key={sub.name} className="m3-card matriz-subject-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.94rem' }}>{sub.name}</strong>
                    <span className="m3-badge">{sub.totalHours}h</span>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Eixo {sub.eixo} · T {sub.theoryHours}h / P {sub.practiceHours}h · {sub.credits} CA
                    {sub.extensionHours ? ` · Ext ${sub.extensionHours}h` : ''}
                    {sub.eadHours ? ` · EaD ${sub.eadHours}h` : ''}
                  </span>
                  {sub.group && (
                    <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
                      {sub.group}
                    </span>
                  )}
                  {sub.prerequisites && (
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      Pré-req.: {sub.prerequisites}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : selection.kind === 'segment' ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
                  {selection.track.categoryLabel} · {selection.track.title}
                </span>
                <h3>{selection.segment.label} ({selection.segment.hoursLabel})</h3>
                <p className="text-muted">{selection.segment.detailSummary}</p>
              </div>
              <button
                type="button"
                className="m3-btn m3-btn--outlined"
                onClick={() => setSelection({ kind: 'phase', phaseNumber: selection.segment.startPhase })}
              >
                <Icon name="calendar_view_week" size={18} />
                <span>Ver toda a {selection.segment.startPhase}ª Fase</span>
              </button>
            </div>

            <div className="matriz-subjects-grid">
              {selectedSegmentSubjects.map(({ phase, subject }) => (
                <div key={`${phase}-${subject.name}`} className="m3-card matriz-subject-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.94rem' }}>{subject.name}</strong>
                    <span className="m3-badge m3-badge--blue">{phase}ª Fase · {subject.totalHours}h</span>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    T {subject.theoryHours}h / P {subject.practiceHours}h · {subject.credits} CA
                    {subject.extensionHours ? ` · Ext ${subject.extensionHours}h` : ''}
                    {subject.eadHours ? ` · EaD ${subject.eadHours}h` : ''}
                  </span>
                  {subject.prerequisites && (
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      Pré-req.: {subject.prerequisites}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showOptativesList && (
          <div style={{ display: 'grid', gap: '0.65rem', paddingBlockStart: '0.75rem', borderBlockStart: '1px solid var(--md-sys-color-outline-variant)' }}>
            <span className="m3-label-large" style={{ color: 'var(--camblu-action-blue)' }}>
              Disciplinas Optativas Ofertadas para 7ª Fase (36h · 2 CA cada)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {CURRICULUM_OPTATIVAS_7TH.map((opt) => (
                <span key={opt.name} className="m3-badge" title={opt.prerequisites ? `Pré-requisito: ${opt.prerequisites}` : undefined}>
                  {opt.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
