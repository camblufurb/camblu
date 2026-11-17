import type { MembershipTier, UserProfile } from '../types/domain';

export interface CardTilt {
  x: number;
  y: number;
}

export interface MemberCardAppearance {
  background: string;
  foreground: string;
  avatarRing: string;
  avatarFallbackBg: string;
}

const DEFAULT_APPEARANCE: MemberCardAppearance = {
  background: 'linear-gradient(135deg, #2b3530, #141c18)',
  foreground: '#ffffff',
  avatarRing: 'rgb(255 255 255 / 0.5)',
  avatarFallbackBg: 'rgb(255 255 255 / 0.16)',
};

const TIER_APPEARANCE_MAP: Record<Exclude<MembershipTier, 'none'>, MemberCardAppearance> = {
  comum: {
    background: 'linear-gradient(135deg, #1a7a51, #26b879)',
    foreground: '#ffffff',
    avatarRing: 'rgb(255 255 255 / 0.6)',
    avatarFallbackBg: 'rgb(255 255 255 / 0.18)',
  },
  raro: {
    background: 'linear-gradient(135deg, #154399, #3b82f7)',
    foreground: '#ffffff',
    avatarRing: 'rgb(255 255 255 / 0.65)',
    avatarFallbackBg: 'rgb(255 255 255 / 0.18)',
  },
  epico: {
    background: 'linear-gradient(135deg, #4b1d95, #8b5cf6)',
    foreground: '#ffffff',
    avatarRing: 'rgb(255 255 255 / 0.65)',
    avatarFallbackBg: 'rgb(255 255 255 / 0.18)',
  },
  lendario: {
    background: 'linear-gradient(135deg, #735404, #edd16e 55%, #b8890e)',
    foreground: '#1f1600',
    avatarRing: 'rgb(31 22 0 / 0.35)',
    avatarFallbackBg: 'rgb(31 22 0 / 0.14)',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Resolves the color palette for a member's digital card according to active membership status and tier.
 */
export function getMemberCardAppearance(
  tier: MembershipTier | undefined,
  active: boolean,
): MemberCardAppearance {
  if (!active || !tier || tier === 'none') {
    return DEFAULT_APPEARANCE;
  }
  return TIER_APPEARANCE_MAP[tier] ?? DEFAULT_APPEARANCE;
}

/**
 * Computes clamped tilt coordinates from device gyroscope orientation angles.
 * Returns null when orientation axes are unavailable (e.g. desktop browsers without sensors).
 */
export function tiltFromDeviceOrientation(
  gamma: number | null | undefined,
  beta: number | null | undefined,
): CardTilt | null {
  if (gamma === null || gamma === undefined || beta === null || beta === undefined) {
    return null;
  }
  if (!Number.isFinite(gamma) || !Number.isFinite(beta)) {
    return null;
  }
  return {
    x: clamp(gamma, -18, 18),
    y: clamp(beta - 35, -18, 18),
  };
}

/**
 * Computes normalized pointer tilt coordinates relative to the card bounding box.
 */
export function tiltFromPointer(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): CardTilt {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }
  const rx = ((clientX - rect.left) / rect.width - 0.5) * 26;
  const ry = ((clientY - rect.top) / rect.height - 0.5) * 26;
  return {
    x: clamp(rx, -18, 18),
    y: clamp(ry, -18, 18),
  };
}

/**
 * Returns a trimmed Google account photo URL when present, or undefined if blank.
 */
export function resolveMemberPhotoUrl(profile: Pick<UserProfile, 'photoURL'> | null | undefined): string | undefined {
  const url = profile?.photoURL?.trim();
  return url ? url : undefined;
}
