import { describe, expect, it } from 'vitest';
import { buildCalendarMilestones } from '../calendarMilestones';

describe('calendarMilestones', () => {
  it('hides milestones older than or equal to 3 days and sorts remaining from closest to farthest', () => {
    const now = new Date(2026, 10, 18, 12, 0, 0); // 2026-11-18 local

    const events = [
      { id: 'old-4', slug: 'old-4', title: 'Evento 4 dias atras', startAt: '2026-11-14T18:00:00-03:00', published: true },
      { id: 'old-3', slug: 'old-3', title: 'Evento exatamente 3 dias atras', startAt: '2026-11-15T18:00:00-03:00', published: true },
      { id: 'old-2', slug: 'old-2', title: 'Evento 2 dias atras', startAt: '2026-11-16T18:00:00-03:00', published: true },
      { id: 'today', slug: 'today', title: 'Evento hoje', startAt: '2026-11-18T19:00:00-03:00', published: true },
      { id: 'far', slug: 'far', title: 'Evento distante', startAt: '2026-12-05T19:00:00-03:00', published: true },
      { id: 'draft', slug: 'draft', title: 'Rascunho', startAt: '2026-11-19T19:00:00-03:00', published: false },
    ];

    const editais = [
      { id: 'ed-old', title: 'Edital antigo', program: 'Eleições', deadline: '2026-11-06' },
      { id: 'ed-tomorrow', title: 'Edital amanhã', program: 'E-PAF', deadline: '2026-11-19' },
      { id: 'ed-yesterday', title: 'Edital ontem', program: 'E-PAATC', deadline: '2026-11-17' },
    ];

    const items = buildCalendarMilestones(events, editais, now, 3);

    expect(items.map((i) => i.id)).toEqual([
      'today',        // 0 dias
      'ed-tomorrow',  // +1 dia (empate com -1, futuro antes)
      'ed-yesterday', // -1 dia
      'old-2',        // -2 dias
      'far',          // +17 dias
    ]);
    expect(items[0].relativeLabel).toBe('Hoje');
    expect(items[1].relativeLabel).toBe('Amanhã');
    expect(items[2].relativeLabel).toBe('Ontem');
    expect(items[3].relativeLabel).toBe('Há 2 dias');
    expect(items[4].relativeLabel).toBe('Em 17 dias');
  });
});
