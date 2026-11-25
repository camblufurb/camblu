import { isMemberSubscriptionValid } from './adminStats';
import type {
  ClubPromotion,
  ClubPromotionTurmaProgress,
  TShirtSize,
  UserProfile,
} from '../types/domain';

const TSHIRT_SIZE_ORDER: readonly string[] = [
  'XXG',
  'XG',
  'GG',
  'G',
  'M',
  'P',
  'PP',
  'Baby Look G',
  'Baby Look M',
  'Baby Look P',
];

function getTshirtSortWeight(size?: TShirtSize | string): number {
  if (!size) return TSHIRT_SIZE_ORDER.length + 1;
  const idx = TSHIRT_SIZE_ORDER.indexOf(size);
  return idx === -1 ? TSHIRT_SIZE_ORDER.length : idx;
}

/**
 * Infere a data em que a assinatura atual do Clube CAMBLU foi iniciada.
 * Prioriza `membershipSubscribedAt`, depois calcula a partir de `membershipValidUntil`
 * subtraindo o ciclo (1 ou 6 meses), e por fim usa `updatedAt`.
 */
export function getMemberSubscriptionStartDate(member: UserProfile): Date | null {
  if (member.membershipSubscribedAt) {
    const parsed = new Date(member.membershipSubscribedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (member.membershipValidUntil) {
    const validUntil = new Date(member.membershipValidUntil);
    if (!Number.isNaN(validUntil.getTime())) {
      const inferred = new Date(validUntil);
      const months = member.membershipCycle === 'semestral' ? 6 : 1;
      inferred.setMonth(inferred.getMonth() - months);
      return inferred;
    }
  }

  if (member.updatedAt) {
    const updated = new Date(member.updatedAt);
    if (!Number.isNaN(updated.getTime())) return updated;
  }

  return null;
}

function parsePromotionStartBoundary(startDate: string): Date | null {
  if (!startDate) return null;
  // Support YYYY-MM-DD as local/UTC start of day (00:00:00)
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())
    ? `${startDate.trim()}T00:00:00`
    : startDate;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isMemberEligibleForPromotion(member: UserProfile, promo: ClubPromotion): boolean {
  if (!isMemberSubscriptionValid(member)) return false;
  if (member.affiliation !== 'FURB' || !member.turma) return false;

  const cleanTurma = member.turma.trim();
  if (!promo.turmas.includes(cleanTurma)) return false;

  const startBoundary = parsePromotionStartBoundary(promo.startDate);
  if (!startBoundary) return true;

  const subDate = getMemberSubscriptionStartDate(member);
  if (!subDate) return false;

  return subDate.getTime() >= startBoundary.getTime();
}

export interface PromotionTurmaResult extends ClubPromotionTurmaProgress {
  subscribers: UserProfile[];
}

export function computePromotionProgress(
  promo: ClubPromotion,
  members: UserProfile[],
): PromotionTurmaResult[] {
  const grouped = new Map<string, UserProfile[]>();
  for (const turma of promo.turmas) {
    grouped.set(turma, []);
  }

  for (const member of members) {
    if (!isMemberEligibleForPromotion(member, promo)) continue;
    const turma = (member.turma || '').trim();
    const list = grouped.get(turma);
    if (list) {
      list.push(member);
    }
  }

  const goal = Math.max(1, promo.goalCount || 1);
  const results: PromotionTurmaResult[] = promo.turmas.map((turma) => {
    const subscribers = grouped.get(turma) || [];
    const count = subscribers.length;
    const percent = Math.min(100, Math.round((count / goal) * 100));
    return {
      turma,
      count,
      goalCount: goal,
      percent,
      goalReached: count >= goal,
      subscribers,
    };
  });

  // Leaderboard order: highest count first, then numeric/alpha turma
  return results.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.turma.localeCompare(b.turma, 'pt-BR', { numeric: true });
  });
}

/**
 * Gera a lista em TXT separada por turma e ordenada por tamanho de camiseta
 * (quando `isTshirtPrize` for true) ou em ordem alfabética.
 */
export function generatePromotionTxtList(promo: ClubPromotion, members: UserProfile[]): string {
  const progress = computePromotionProgress(promo, members);
  const byTurmaOrder = [...progress].sort((a, b) =>
    a.turma.localeCompare(b.turma, 'pt-BR', { numeric: true }),
  );

  const lines: string[] = [];

  for (const entry of byTurmaOrder) {
    lines.push(`# TURMA ${entry.turma}`);
    if (entry.subscribers.length === 0) {
      lines.push('(Nenhum assinante elegível até o momento)');
      continue;
    }

    const sortedSubscribers = [...entry.subscribers].sort((a, b) => {
      if (promo.isTshirtPrize) {
        const weightDiff = getTshirtSortWeight(a.tshirtSize) - getTshirtSortWeight(b.tshirtSize);
        if (weightDiff !== 0) return weightDiff;
      }
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });

    sortedSubscribers.forEach((member, idx) => {
      if (promo.isTshirtPrize) {
        const sizeLabel = member.tshirtSize || 'Sem tamanho';
        lines.push(`${idx + 1}.${member.name} | ${sizeLabel}`);
      } else {
        lines.push(`${idx + 1}.${member.name}`);
      }
    });
  }

  return lines.join('\n');
}

export function extractAvailableTurmas(members: UserProfile[]): string[] {
  const set = new Set<string>();
  for (const m of members) {
    if (m.affiliation === 'FURB' && m.turma?.trim()) {
      set.add(m.turma.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}
