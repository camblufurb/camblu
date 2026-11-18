import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EVENT_PALETTE,
  DEFAULT_SECIMED_PALETTE,
  generateHarmonyPalette,
  getContrastRatio,
  getReadableTextColor,
  hexToHsl,
  hslToHex,
  normalizeHex,
  resolveEventPalette,
} from '../colorHarmony';

describe('colorHarmony', () => {
  it('normalizes 3-digit and 6-digit hex codes safely', () => {
    expect(normalizeHex('#3B82F7')).toBe('#3b82f7');
    expect(normalizeHex('abc')).toBe('#aabbcc');
    expect(normalizeHex('invalid', '#0f3325')).toBe('#0f3325');
  });

  it('round-trips vivid hex through HSL conversion within rounding tolerance', () => {
    const hsl = hexToHsl('#3b82f7');
    expect(hsl.h).toBeGreaterThanOrEqual(214);
    expect(hsl.h).toBeLessThanOrEqual(220);
    const hex = hslToHex(hsl.h, hsl.s, hsl.l);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('generates distinct harmony palettes for triad, complementary, and square rules', () => {
    const triad = generateHarmonyPalette('#3b82f7', 'triad', 'light');
    expect(triad.primary).not.toBe(triad.secondary1);
    expect(triad.secondary1).not.toBe(triad.secondary2);
    expect(getContrastRatio('#111c16', triad.background)).toBeGreaterThan(10);

    const darkBg = generateHarmonyPalette('#3b82f7', 'complementary', 'dark');
    expect(getReadableTextColor(darkBg.background)).toBe('#ffffff');
  });

  it('resolves event palette across explicit palette, legacy secimedPalette, and fallbacks', () => {
    expect(resolveEventPalette(null)).toEqual(DEFAULT_EVENT_PALETTE);
    expect(resolveEventPalette({ isSecimed: true })).toEqual(DEFAULT_SECIMED_PALETTE);
    expect(
      resolveEventPalette({
        isSecimed: true,
        secimedPalette: { primary: '#111111', secondary1: '#222222', secondary2: '#333333', background: '#eeeeee' },
      }).primary,
    ).toBe('#111111');
    expect(
      resolveEventPalette({
        isSecimed: false,
        palette: { primary: '#123456', secondary1: '#654321', secondary2: '#abcdef', background: '#fafafa' },
      }).primary,
    ).toBe('#123456');
  });
});
