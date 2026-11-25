import type { CambluEvent, EventPaletteConfig } from '../types/domain';

export type HarmonyRule =
  | 'analogous'
  | 'monochromatic'
  | 'triad'
  | 'complementary'
  | 'split_complementary'
  | 'square'
  | 'compound'
  | 'custom';

export interface HarmonyRuleMeta {
  id: HarmonyRule;
  label: string;
  hint: string;
}

export const HARMONY_RULES: HarmonyRuleMeta[] = [
  { id: 'analogous', label: 'Análoga', hint: 'Cores vizinhas no círculo cromático' },
  { id: 'monochromatic', label: 'Monocromática', hint: 'Variações tonais de um mesmo matiz' },
  { id: 'triad', label: 'Tríade', hint: 'Três tons equidistantes em 120°' },
  { id: 'complementary', label: 'Complementar', hint: 'Contraste direto oposto (180°)' },
  { id: 'split_complementary', label: 'Comp. Dividida', hint: 'Base + dois tons adjacentes ao oposto' },
  { id: 'square', label: 'Quadrado', hint: 'Quatro matizes em intervalos de 90°' },
  { id: 'compound', label: 'Composta', hint: 'Combinação equilibrada quente + fria' },
  { id: 'custom', label: 'Personalizada', hint: 'Arraste cada pino livremente' },
];

export const DEFAULT_EVENT_PALETTE: EventPaletteConfig = {
  primary: '#0f3325',
  secondary1: '#166547',
  secondary2: '#edd16e',
  background: '#f3f7f4',
};

export const DEFAULT_SECIMED_PALETTE: EventPaletteConfig = {
  primary: '#5f2841',
  secondary1: '#dc8987',
  secondary2: '#a0af6c',
  background: '#f2efe6',
};

export function resolveEventPalette(
  event?: Pick<CambluEvent, 'palette' | 'secimedPalette' | 'isSecimed'> | null,
): EventPaletteConfig {
  if (event?.palette) return event.palette;
  if (event?.secimedPalette) return event.secimedPalette;
  if (event?.isSecimed) return DEFAULT_SECIMED_PALETTE;
  return DEFAULT_EVENT_PALETTE;
}

export function normalizeHex(input: string, fallback = '#166547'): string {
  const clean = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const expanded = clean
      .split('')
      .map((c) => c + c)
      .join('');
    return `#${expanded.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean.toLowerCase()}`;
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = normalizeHex(hex);
  const num = parseInt(safe.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r: rRaw, g: gRaw, b: bRaw } = hexToRgb(hex);
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return {
    h: Math.round((h / 6) * 360) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;

  if (ss === 0) {
    const val = ll * 255;
    return rgbToHex(val, val, val);
  }

  const hue2rgb = (p: number, q: number, tRaw: number) => {
    let t = tRaw;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const r = hue2rgb(p, q, hh / 360 + 1 / 3);
  const g = hue2rgb(p, q, hh / 360);
  const b = hue2rgb(p, q, hh / 360 - 1 / 3);

  return rgbToHex(r * 255, g * 255, b * 255);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getReadableTextColor(bgHex: string): string {
  const light = '#ffffff';
  const dark = '#111c16';
  return getContrastRatio(bgHex, light) >= getContrastRatio(bgHex, dark) ? light : dark;
}

export function generateHarmonyPalette(
  baseHex: string,
  rule: Exclude<HarmonyRule, 'custom'>,
  bgTone: 'light' | 'dark' = 'light',
): EventPaletteConfig {
  const { h, s, l } = hexToHsl(baseHex);
  const sat = Math.max(28, Math.min(92, s));
  const lightBase = Math.max(22, Math.min(62, l));
  const bgHue = (h + (rule === 'complementary' ? 180 : 12)) % 360;
  const bg =
    bgTone === 'dark'
      ? hslToHex(bgHue, Math.min(28, Math.max(12, Math.round(sat * 0.35))), 12)
      : hslToHex(bgHue, Math.min(26, Math.max(10, Math.round(sat * 0.3))), 95);

  const primary = hslToHex(h, sat, lightBase);

  switch (rule) {
    case 'analogous':
      return {
        primary,
        secondary1: hslToHex(h + 32, Math.max(30, sat - 6), Math.min(72, lightBase + 10)),
        secondary2: hslToHex(h - 32, Math.max(28, sat - 10), Math.max(26, lightBase + 4)),
        background: bg,
      };
    case 'monochromatic':
      return {
        primary,
        secondary1: hslToHex(h, Math.max(22, sat - 14), Math.min(76, lightBase + 22)),
        secondary2: hslToHex(h, Math.min(95, sat + 10), Math.max(18, lightBase - 14)),
        background: bg,
      };
    case 'triad':
      return {
        primary,
        secondary1: hslToHex(h + 120, Math.max(35, sat - 4), Math.min(68, lightBase + 8)),
        secondary2: hslToHex(h + 240, Math.max(35, sat - 8), Math.min(66, lightBase + 6)),
        background: bg,
      };
    case 'complementary':
      return {
        primary,
        secondary1: hslToHex(h + 180, Math.max(35, sat - 4), Math.min(68, lightBase + 6)),
        secondary2: hslToHex(h + 18, Math.max(28, sat - 16), Math.min(76, lightBase + 18)),
        background: bg,
      };
    case 'split_complementary':
      return {
        primary,
        secondary1: hslToHex(h + 150, Math.max(35, sat - 5), Math.min(68, lightBase + 8)),
        secondary2: hslToHex(h + 210, Math.max(35, sat - 5), Math.min(64, lightBase + 4)),
        background: bg,
      };
    case 'square':
      return {
        primary,
        secondary1: hslToHex(h + 90, Math.max(34, sat - 6), Math.min(68, lightBase + 8)),
        secondary2: hslToHex(h + 180, Math.max(34, sat - 6), Math.min(66, lightBase + 6)),
        background:
          bgTone === 'dark'
            ? hslToHex(h + 270, 26, 13)
            : hslToHex(h + 270, 22, 94),
      };
    case 'compound':
      return {
        primary,
        secondary1: hslToHex(h + 28, Math.max(32, sat - 8), Math.min(72, lightBase + 14)),
        secondary2: hslToHex(h + 165, Math.max(38, sat - 2), Math.min(62, lightBase + 4)),
        background: bg,
      };
  }
}

export function generateRandomHarmonyPalette(
  rule: Exclude<HarmonyRule, 'custom'> = 'analogous',
  bgTone: 'light' | 'dark' = 'light',
): EventPaletteConfig {
  const randomHue = Math.floor(Math.random() * 360);
  const randomSat = 48 + Math.floor(Math.random() * 36);
  const randomLight = 32 + Math.floor(Math.random() * 20);
  return generateHarmonyPalette(hslToHex(randomHue, randomSat, randomLight), rule, bgTone);
}
