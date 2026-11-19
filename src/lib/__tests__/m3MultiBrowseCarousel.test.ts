import { describe, expect, it } from 'vitest';
import {
  computeInfiniteMultiBrowseMetrics,
  computeM3MultiBrowseMetrics,
} from '../m3MultiBrowseCarousel';

describe('m3MultiBrowseCarousel', () => {
  it('renders Large, Medium, and Small frames cleanly for 4+ items and fades scrolled-off edges', () => {
    const start = computeM3MultiBrowseMetrics(4, 0, 360, 8);
    expect(start).toHaveLength(4);
    expect(start[0].sizeRole).toBe('large');
    expect(start[1].sizeRole).toBe('medium');
    expect(start[2].sizeRole).toBe('small');
    expect(start[3].sizeRole).toBe('hidden');
    expect(start[3].widthPx).toBe(0);
    expect(start[3].opacity).toBe(0);

    const mid = computeM3MultiBrowseMetrics(4, 1, 360, 8);
    expect(mid[0].sizeRole).toBe('hidden');
    expect(mid[0].widthPx).toBe(0);
    expect(mid[1].sizeRole).toBe('large');
    expect(mid[2].sizeRole).toBe('medium');
    expect(mid[3].sizeRole).toBe('small');

    const end = computeM3MultiBrowseMetrics(4, 3, 360, 8);
    expect(end[1].sizeRole).toBe('small');
    expect(end[2].sizeRole).toBe('medium');
    expect(end[3].sizeRole).toBe('large');
  });

  it('fills total container width continuously across fractional scroll progress without jumps', () => {
    const width = 390;
    for (const p of [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3]) {
      const metrics = computeM3MultiBrowseMetrics(5, p, width, 8);
      const total = metrics.reduce((acc, m) => acc + m.widthPx + m.marginEndPx, 0);
      expect(Math.abs(total - width)).toBeLessThan(1);
    }
  });

  it('handles 1-item and 2-item galleries gracefully', () => {
    const one = computeM3MultiBrowseMetrics(1, 0, 360, 8);
    expect(one[0].widthPx).toBe(360);
    expect(one[0].sizeRole).toBe('large');

    const twoStart = computeM3MultiBrowseMetrics(2, 0, 360, 8);
    expect(twoStart[0].widthPx).toBeGreaterThan(twoStart[1].widthPx);
    const twoEnd = computeM3MultiBrowseMetrics(2, 1, 360, 8);
    expect(twoEnd[1].widthPx).toBeGreaterThan(twoEnd[0].widthPx);
  });

  it('produces identical Multi-Browse layouts across infinite wrap cycles with zero jump', () => {
    const baseCount = 4;
    const totalDom = baseCount * 3;
    const pCycle1 = computeInfiniteMultiBrowseMetrics(totalDom, baseCount, 390, 8);
    const pCycle2 = computeInfiniteMultiBrowseMetrics(totalDom, baseCount * 2, 390, 8);

    // At p = N (cycle 1 start) and p = 2N (cycle 2 start), visible slots match identically
    expect(pCycle1[baseCount].sizeRole).toBe('large');
    expect(pCycle1[baseCount + 1].sizeRole).toBe('medium');
    expect(pCycle1[baseCount + 2].sizeRole).toBe('small');

    expect(pCycle2[baseCount * 2].widthPx).toBeCloseTo(pCycle1[baseCount].widthPx, 1);
    expect(pCycle2[baseCount * 2 + 1].widthPx).toBeCloseTo(pCycle1[baseCount + 1].widthPx, 1);
    expect(pCycle2[baseCount * 2 + 2].widthPx).toBeCloseTo(pCycle1[baseCount + 2].widthPx, 1);

    // Every fractional position across the loop fills 100% of container width
    for (const p of [3.2, 4, 4.75, 5.5, 6.25, 7, 7.8]) {
      const m = computeInfiniteMultiBrowseMetrics(totalDom, p, 390, 8);
      const sum = m.reduce((acc, item) => acc + item.widthPx + item.marginEndPx, 0);
      expect(Math.abs(sum - 390)).toBeLessThan(1);
    }
  });
});
