import type { CambluEvent, MembershipCycle, MembershipTier } from '../types/domain';

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

/**
 * Returns the numeric tier code from 0 (no active plan) to 4 (Lendário).
 */
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

export interface ClubPerkEntry {
  text: string;
  icon: string;
  isNewAtTier?: boolean;
}

export interface ClubPlanInfo {
  tier: Exclude<MembershipTier, 'none'>;
  name: string;
  levelLabel: string;
  tagline: string;
  icon: string;
  themeColor: string;
  glowColor: string;
  accentColor: string;
  gradientCss: string;
  monthlyCents: number;
  semesterCents: number;
  shimmer: boolean;
  popular?: boolean;
  benefits: string[];
  perks: ClubPerkEntry[];
}

export interface ClubComparisonRow {
  feature: string;
  comum: string | boolean;
  raro: string | boolean;
  epico: string | boolean;
  lendario: string | boolean;
}

export const CLUB_PLANS: ClubPlanInfo[] = [
  {
    tier: 'comum',
    name: 'Comum',
    levelLabel: 'Nível 1 · Essencial',
    tagline: 'Entrada no Clube com Carteirinha de Estudante digital, descontos fixos na Lojinha, eventos e benefícios de calouro.',
    icon: 'verified',
    themeColor: '#22a06b',
    glowColor: 'rgb(34 160 107 / 0.24)',
    accentColor: '#c7ecd9',
    gradientCss: 'linear-gradient(145deg, #0c3b28 0%, #176645 60%, #22a06b 100%)',
    monthlyCents: 350,
    semesterCents: 2000,
    shimmer: false,
    benefits: [
      'Carteirinha de Estudante Digital com QR Code de autenticidade (FURB)',
      '10% de desconto automático na Lojinha Oficial CAMBLU',
      '10% de desconto em todos os eventos pagos e na SECIMED',
      'Camiseta oficial gratuita exclusiva para calouros',
    ],
    perks: [
      { text: 'Carteirinha de Estudante Digital com QR Code de validação (FURB)', icon: 'badge', isNewAtTier: true },
      { text: '10% de desconto automático na Lojinha Oficial CAMBLU', icon: 'shopping_bag', isNewAtTier: true },
      { text: '10% de desconto em todos os eventos pagos e na SECIMED', icon: 'confirmation_number', isNewAtTier: true },
      { text: 'Camiseta oficial gratuita exclusiva para calouros', icon: 'checkroom', isNewAtTier: true },
    ],
  },
  {
    tier: 'raro',
    name: 'Raro',
    levelLabel: 'Nível 2 · Mais Escolhido',
    tagline: 'Todo o pacote Comum somado à entrada gratuita nos eventos CAMBLU (com ou sem Coffee).',
    icon: 'bolt',
    themeColor: '#3b82f7',
    glowColor: 'rgb(59 130 247 / 0.28)',
    accentColor: '#dbe9ff',
    gradientCss: 'linear-gradient(145deg, #0b265a 0%, #1d55b8 55%, #3b82f7 100%)',
    monthlyCents: 700,
    semesterCents: 4000,
    shimmer: false,
    popular: true,
    benefits: [
      'Todos os benefícios do plano Comum',
      'Ingresso gratuito em todos os eventos do CAMBLU com ou sem Coffee (exceto SECIMED)',
      'Acesso às parcerias Spaiq e Gorit PRO',
    ],
    perks: [
      { text: 'Ingresso gratuito em todos os eventos do CAMBLU, com ou sem Coffee (exceto SECIMED)', icon: 'confirmation_number', isNewAtTier: true },
      { text: 'Acesso às parcerias acadêmicas Spaiq e Gorit PRO', icon: 'auto_stories', isNewAtTier: true },
      { text: 'Carteirinha de Estudante Digital com QR Code de validação (FURB)', icon: 'badge' },
      { text: '10% de desconto automático na Lojinha Oficial CAMBLU', icon: 'shopping_bag' },
      { text: '10% de desconto na inscrição da SECIMED', icon: 'science' },
      { text: 'Camiseta oficial gratuita exclusiva para calouros', icon: 'checkroom' },
    ],
  },
  {
    tier: 'epico',
    name: 'Épico',
    levelLabel: 'Nível 3 · Passe Total',
    tagline: 'Entrada livre em TODOS os eventos (incluindo SECIMED) + consumação gratuita.',
    icon: 'diamond',
    themeColor: '#7c3aed',
    glowColor: 'rgb(124 58 237 / 0.30)',
    accentColor: '#ede9fe',
    gradientCss: 'linear-gradient(145deg, #270e59 0%, #5523b5 58%, #7c3aed 100%)',
    monthlyCents: 1500,
    semesterCents: 8400,
    shimmer: false,
    benefits: [
      'Todos os benefícios do plano Raro',
      'Ingresso grátis em TODOS os eventos do CAMBLU (incluindo SECIMED)',
      '1 comida ou bebida grátis em qualquer evento do CAMBLU',
    ],
    perks: [
      { text: 'Ingresso gratuito na SECIMED — Semana Científica de Medicina FURB', icon: 'science', isNewAtTier: true },
      { text: '1 comida ou bebida grátis em qualquer evento do CAMBLU', icon: 'restaurant', isNewAtTier: true },
      { text: 'Ingresso gratuito em TODOS os demais eventos com ou sem Coffee', icon: 'celebration' },
      { text: 'Carteirinha de Estudante Digital com QR Code de validação (FURB)', icon: 'badge' },
      { text: '10% de desconto automático na Lojinha Oficial CAMBLU', icon: 'shopping_bag' },
      { text: 'Simpósios e eventos CAMBLU com Coffee 100% gratuitos', icon: 'local_cafe' },
      { text: 'Camiseta oficial gratuita exclusiva para calouros', icon: 'checkroom' },
      { text: 'Acesso às parcerias acadêmicas Spaiq e Gorit PRO', icon: 'auto_stories' },
    ],
  },
  {
    tier: 'lendario',
    name: 'Lendário',
    levelLabel: 'Nível 4 · Ultra Premium',
    tagline: 'O nível máximo do Clube com todos os eventos, consumação e prioridade total.',
    icon: 'workspace_premium',
    themeColor: '#d4a117',
    glowColor: 'rgb(212 161 23 / 0.38)',
    accentColor: '#fbf3d5',
    gradientCss: 'linear-gradient(145deg, #2a1d02 0%, #684b06 62%, #a67a0d 100%)',
    monthlyCents: 5000,
    semesterCents: 30000,
    shimmer: true,
    benefits: [
      'Todos os benefícios do plano Épico',
      'Acesso prioritário a benefícios exclusivos futuros',
    ],
    perks: [
      { text: '[COMING SOON]', icon: 'workspace_premium', isNewAtTier: true },
      { text: 'Ingresso gratuito na SECIMED — Semana Científica de Medicina FURB', icon: 'science' },
      { text: '1 comida ou bebida grátis em qualquer evento do CAMBLU', icon: 'restaurant' },
      { text: 'Ingresso gratuito em TODOS os demais eventos com ou sem Coffee', icon: 'celebration' },
      { text: 'Carteirinha de Estudante Digital com QR Code de validação (FURB)', icon: 'badge' },
      { text: '10% de desconto automático na Lojinha Oficial CAMBLU', icon: 'shopping_bag' },
      { text: 'Simpósios e eventos CAMBLU com Coffee 100% gratuitos', icon: 'local_cafe' },
      { text: 'Camiseta oficial gratuita exclusiva para calouros', icon: 'checkroom' },
      { text: 'Acesso às parcerias acadêmicas Spaiq e Gorit PRO', icon: 'auto_stories' },
    ],
  },
];

export const CLUB_COMPARISON_ROWS: ClubComparisonRow[] = [
  { feature: 'Carteirinha de Estudante Digital com QR Code (FURB)', comum: true, raro: true, epico: true, lendario: true },
  { feature: '10% de desconto automático na Lojinha', comum: true, raro: true, epico: true, lendario: true },
  { feature: 'Camiseta oficial grátis para calouros', comum: true, raro: true, epico: true, lendario: true },
  { feature: 'Parcerias acadêmicas Spaiq & Gorit PRO', comum: false, raro: true, epico: true, lendario: true },
  { feature: 'Desconto nos eventos pagos e SECIMED', comum: '10% off', raro: '10% SECIMED', epico: '100% Grátis', lendario: '100% Grátis' },
  { feature: 'Entrada gratuita em todos os eventos do CAMBLU (com ou sem Coffee)', comum: false, raro: true, epico: true, lendario: true },
  { feature: 'Ingresso gratuito na SECIMED', comum: false, raro: false, epico: true, lendario: true },
  { feature: '1 comida ou bebida grátis por evento CAMBLU', comum: false, raro: false, epico: true, lendario: true },
  { feature: 'Prioridade em novos benefícios exclusivos', comum: false, raro: false, epico: false, lendario: true },
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

  if (tier === 'raro' && !event.isSecimed) {
    return {
      finalCents: 0,
      discountCents: basePriceCents,
      reason: 'Gratuidade Clube Raro (Evento CAMBLU)',
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
