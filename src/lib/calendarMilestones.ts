import type { CambluEvent, EditalItem } from '../types/domain';

export interface CalendarMilestone {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM/YYYY
  title: string;
  kind: string;
  to: string;
  daysFromToday: number;
  relativeLabel: string;
}

const MS_PER_DAY = 86_400_000;

function parseIsoDayUtcMs(rawDate: string): number | null {
  const clean = String(rawDate || '').trim().slice(0, 10);
  const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const ms = Date.UTC(year, month - 1, day);
  return Number.isFinite(ms) ? ms : null;
}

function getLocalTodayUtcMs(now: Date): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatBrDate(isoDay: string): string {
  const [y, m, d] = isoDay.split('-');
  if (!y || !m || !d) return isoDay;
  return `${d}/${m}/${y}`;
}

export function formatRelativeDayLabel(daysFromToday: number): string {
  if (daysFromToday === 0) return 'Hoje';
  if (daysFromToday === 1) return 'Amanhã';
  if (daysFromToday === -1) return 'Ontem';
  if (daysFromToday > 1) return `Em ${daysFromToday} dias`;
  return `Há ${Math.abs(daysFromToday)} dias`;
}

/**
 * Builds portal calendar milestones sorted from closest to today to farthest,
 * hiding items that passed `maxPastDays` (default 3) or more days ago.
 */
export function buildCalendarMilestones(
  events: ReadonlyArray<Pick<CambluEvent, 'id' | 'slug' | 'title' | 'startAt' | 'published'>>,
  editais: ReadonlyArray<Pick<EditalItem, 'id' | 'title' | 'program' | 'deadline'>>,
  now: Date = new Date(),
  maxPastDays = 3,
): CalendarMilestone[] {
  const todayMs = getLocalTodayUtcMs(now);

  const rawItems = [
    ...events
      .filter((e) => e.published)
      .map((e) => ({
        id: e.id,
        date: e.startAt.slice(0, 10),
        title: e.title,
        kind: 'Evento CAMBLU',
        to: `/eventos/${e.slug}`,
      })),
    ...editais.map((ed) => ({
      id: ed.id,
      date: ed.deadline.slice(0, 10),
      title: `Prazo: ${ed.title}`,
      kind: `Edital ${ed.program}`,
      to: '/editais',
    })),
  ];

  const filtered: CalendarMilestone[] = [];
  for (const item of rawItems) {
    const itemMs = parseIsoDayUtcMs(item.date);
    if (itemMs === null) continue;
    const daysFromToday = Math.round((itemMs - todayMs) / MS_PER_DAY);
    if (daysFromToday <= -maxPastDays) continue;

    filtered.push({
      ...item,
      displayDate: formatBrDate(item.date),
      daysFromToday,
      relativeLabel: formatRelativeDayLabel(daysFromToday),
    });
  }

  return filtered.sort((a, b) => {
    const distDiff = Math.abs(a.daysFromToday) - Math.abs(b.daysFromToday);
    if (distDiff !== 0) return distDiff;
    // Prefer today/upcoming before past on equal distance
    if (a.daysFromToday !== b.daysFromToday) return b.daysFromToday - a.daysFromToday;
    return a.title.localeCompare(b.title, 'pt-BR');
  });
}
