export type MembershipTier = 'none' | 'comum' | 'raro' | 'epico' | 'lendario';
export type MembershipCycle = 'mensal' | 'semestral';
export type MembershipTierCode = 0 | 1 | 2 | 3 | 4;

export const MEMBERSHIP_TIER_CODE_MAP: Record<MembershipTier, MembershipTierCode> = {
  none: 0,
  comum: 1,
  raro: 2,
  epico: 3,
  lendario: 4,
};

export const MEMBERSHIP_TIER_NAME_MAP: Record<MembershipTier, string> = {
  none: 'Sem plano ativo',
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
};

export function getMembershipTierCode(
  tier: MembershipTier | string | undefined | null,
  active: boolean,
): MembershipTierCode {
  if (!active || !tier || tier === 'none') return 0;
  if (tier in MEMBERSHIP_TIER_CODE_MAP) {
    return MEMBERSHIP_TIER_CODE_MAP[tier as MembershipTier];
  }
  return 0;
}

export const CLUB_PRICE_MAP: Record<Exclude<MembershipTier, 'none'>, Record<MembershipCycle, number>> = {
  comum: { mensal: 350, semestral: 2000 },
  raro: { mensal: 700, semestral: 4000 },
  epico: { mensal: 1500, semestral: 8400 },
  lendario: { mensal: 5000, semestral: 30000 },
};

export function computeEventPricing(
  baseCents: number,
  event: { isSecimed?: boolean; hasCoffee?: boolean; category?: string },
  tier: MembershipTier,
  active: boolean,
): { finalCents: number; discountCents: number; reason?: string } {
  if (!active || tier === 'none') {
    return { finalCents: baseCents, discountCents: 0 };
  }
  if (tier === 'lendario' || tier === 'epico') {
    return {
      finalCents: 0,
      discountCents: baseCents,
      reason: `Gratuidade Clube ${tier === 'lendario' ? 'Lendário' : 'Épico'} (100%)`,
    };
  }
  if (tier === 'raro' && !event.isSecimed) {
    return {
      finalCents: 0,
      discountCents: baseCents,
      reason: 'Gratuidade Clube Raro (Evento CAMBLU)',
    };
  }
  const discountCents = Math.round(baseCents * 0.1);
  return {
    finalCents: Math.max(0, baseCents - discountCents),
    discountCents,
    reason: `Desconto Clube ${tier} (10%)`,
  };
}

export function computeShopPricing(subtotalCents: number, tier: MembershipTier, active: boolean) {
  if (!active || tier === 'none') {
    return { totalCents: subtotalCents, discountCents: 0 };
  }
  const discountCents = Math.round(subtotalCents * 0.1);
  return { totalCents: Math.max(0, subtotalCents - discountCents), discountCents };
}
