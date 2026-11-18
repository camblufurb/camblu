import { describe, expect, it } from 'vitest';
import { buildMarqueeRowItems, getMemberInitials, sortGestaoTermsDesc } from '../gestoes';
import type { GestaoMember, GestaoTerm } from '../../types/domain';

describe('sortGestaoTermsDesc', () => {
  it('places the newest year and most recently registered term first', () => {
    const seed2024: GestaoTerm = {
      id: 'gestao-2024',
      year: 2024,
      chapaName: 'Renovação',
      members: [],
    };
    const seed2026: GestaoTerm = {
      id: 'gestao-2026',
      year: 2026,
      chapaName: 'Resolução',
      members: [],
    };
    const newerSameYear: GestaoTerm = {
      id: 'gestao-2026-mabc1234',
      year: 2026,
      chapaName: 'Nova Chapa 2026',
      members: [],
      createdAt: '2026-11-18T10:00:00.000Z',
    };
    const future2027: GestaoTerm = {
      id: 'gestao-2027-mabc9999',
      year: 2027,
      chapaName: 'Futuro 2027',
      members: [],
    };

    const ordered = sortGestaoTermsDesc([seed2024, seed2026, newerSameYear, future2027]);
    expect(ordered.map((g) => g.id)).toEqual([
      'gestao-2027-mabc9999',
      'gestao-2026-mabc1234',
      'gestao-2026',
      'gestao-2024',
    ]);
  });

  it('fills marquee rows cleanly with at least 24 items even for small member lists', () => {
    const fewMembers: GestaoMember[] = [
      { id: 'm1', name: 'Ana Silva', cargo: 'Presidente', photoUrl: '/a.webp', shape: 'circle' },
      { id: 'm2', name: 'Bruno Souza', cargo: 'Vice-Presidente', photoUrl: '/b.webp', shape: 'flower' },
    ];
    expect(buildMarqueeRowItems([], 0)).toEqual([]);
    const row0 = buildMarqueeRowItems(fewMembers, 0);
    const row2 = buildMarqueeRowItems(fewMembers, 2);
    expect(row0.length).toBeGreaterThanOrEqual(24);
    expect(row2.length).toBeGreaterThanOrEqual(24);
    expect(getMemberInitials('Marina Schorr Caesar')).toBe('MC');
  });
});
