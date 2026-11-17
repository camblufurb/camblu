export type MembershipTier = 'none' | 'comum' | 'raro' | 'epico' | 'lendario';
export type MembershipCycle = 'mensal' | 'semestral';

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
  const isCoffeeNonSecimed = !event.isSecimed && (event.hasCoffee || event.category === 'camblu_coffee');
  if (tier === 'raro' && isCoffeeNonSecimed) {
    return {
      finalCents: 0,
      discountCents: baseCents,
      reason: 'Gratuidade Clube Raro (Evento CAMBLU com Coffee)',
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
