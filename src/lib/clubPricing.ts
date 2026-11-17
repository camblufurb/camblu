import type { CambluEvent, MembershipCycle, MembershipTier } from '../types/domain';

export interface ClubPlanInfo {
  tier: Exclude<MembershipTier, 'none'>;
  name: string;
  themeColor: string;
  accentColor: string;
  monthlyCents: number;
  semesterCents: number;
  shimmer: boolean;
  benefits: string[];
}

export const CLUB_PLANS: ClubPlanInfo[] = [
  {
    tier: 'comum',
    name: 'Comum',
    themeColor: '#22a06b',
    accentColor: '#c7ecd9',
    monthlyCents: 350,
    semesterCents: 2000,
    shimmer: false,
    benefits: [
      '10% de desconto na Lojinha e em todos os eventos do CAMBLU',
      'Camiseta grátis exclusiva para calouros',
      'Acesso ao Spaiq e Gorit PRO (integração final em breve)',
    ],
  },
  {
    tier: 'raro',
    name: 'Raro',
    themeColor: '#3b82f7',
    accentColor: '#dbe9ff',
    monthlyCents: 700,
    semesterCents: 4000,
    shimmer: false,
    benefits: [
      'Todos os benefícios do plano Comum',
      'Ingresso grátis para eventos do CAMBLU com Coffee (exceto SECIMED)',
    ],
  },
  {
    tier: 'epico',
    name: 'Épico',
    themeColor: '#7c3aed',
    accentColor: '#ede9fe',
    monthlyCents: 1500,
    semesterCents: 8400,
    shimmer: false,
    benefits: [
      'Todos os benefícios do plano Raro',
      'Ingresso grátis em TODOS os eventos do CAMBLU (incluindo SECIMED)',
      '1 comida ou bebida grátis em qualquer evento do CAMBLU',
    ],
  },
  {
    tier: 'lendario',
    name: 'Lendário',
    themeColor: '#d4a117',
    accentColor: '#fbf3d5',
    monthlyCents: 5000,
    semesterCents: 30000,
    shimmer: true,
    benefits: [
      'Todos os benefícios do plano Épico',
      'Cartão Lendário dourado com efeito shimmer dinâmico no portal e celular',
      'COMING SOON: benefícios exclusivos adicionais',
    ],
  },
];

export function getPlanPriceCents(tier: Exclude<MembershipTier, 'none'>, cycle: MembershipCycle): number {
  const plan = CLUB_PLANS.find((p) => p.tier === tier);
  if (!plan) return 0;
  return cycle === 'mensal' ? plan.monthlyCents : plan.semesterCents;
}

export function calculateEventTicketPrice(
  basePriceCents: number,
  event: Pick<CambluEvent, 'isSecimed' | 'hasCoffee' | 'category'>,
  tier: MembershipTier,
  membershipActive: boolean,
): { finalCents: number; discountCents: number; reason?: string } {
  if (!membershipActive || tier === 'none') {
    return { finalCents: basePriceCents, discountCents: 0 };
  }

  if (tier === 'lendario' || tier === 'epico') {
    return {
      finalCents: 0,
      discountCents: basePriceCents,
      reason: `Gratuidade Clube ${tier === 'lendario' ? 'Lendário' : 'Épico'} (100%)`,
    };
  }

  const isCoffeeNonSecimed = !event.isSecimed && (event.hasCoffee || event.category === 'camblu_coffee');
  if (tier === 'raro' && isCoffeeNonSecimed) {
    return {
      finalCents: 0,
      discountCents: basePriceCents,
      reason: 'Gratuidade Clube Raro (Evento CAMBLU com Coffee)',
    };
  }

  const discountCents = Math.round(basePriceCents * 0.1);
  return {
    finalCents: Math.max(0, basePriceCents - discountCents),
    discountCents,
    reason: `Desconto Clube ${tier.charAt(0).toUpperCase() + tier.slice(1)} (10%)`,
  };
}

export function calculateShopPrice(
  subtotalCents: number,
  tier: MembershipTier,
  membershipActive: boolean,
): { totalCents: number; discountCents: number } {
  if (!membershipActive || tier === 'none') {
    return { totalCents: subtotalCents, discountCents: 0 };
  }
  const discountCents = Math.round(subtotalCents * 0.1);
  return {
    totalCents: Math.max(0, subtotalCents - discountCents),
    discountCents,
  };
}
