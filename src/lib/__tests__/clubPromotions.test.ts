import { describe, expect, it } from 'vitest';
import {
  computePromotionProgress,
  extractAvailableTurmas,
  generatePromotionTxtList,
} from '../clubPromotions';
import type { ClubPromotion, UserProfile } from '../../types/domain';

function makeMember(overrides: Partial<UserProfile>): UserProfile {
  return {
    uid: 'u-1',
    name: 'Usuário Teste',
    email: 'teste@furb.br',
    cpf: '52998224725',
    phone: '47999999999',
    affiliation: 'FURB',
    turma: '63',
    isCalouro: false,
    membershipTier: 'raro',
    membershipCycle: 'mensal',
    membershipSubscribedAt: '2026-11-10T12:00:00.000Z',
    membershipValidUntil: '2099-01-01T00:00:00.000Z',
    membershipActive: true,
    role: 'student',
    profileCompleted: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-11-10T12:00:00.000Z',
    ...overrides,
  };
}

const BASE_PROMO: ClubPromotion = {
  id: 'promo-1',
  title: 'Desafio 2026',
  startDate: '2026-11-01',
  goalCount: 2,
  turmas: ['62', '63'],
  prizeName: 'Camiseta Exclusiva',
  isTshirtPrize: true,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

describe('clubPromotions', () => {
  it('counts only active FURB subscribers in competing turmas from startDate onward', () => {
    const members: UserProfile[] = [
      makeMember({ uid: '1', name: 'Ana', turma: '63', tshirtSize: 'P' }),
      makeMember({ uid: '2', name: 'Bruno', turma: '63', tshirtSize: 'GG' }),
      // Before startDate -> excluded
      makeMember({
        uid: '3',
        name: 'Carlos',
        turma: '63',
        membershipSubscribedAt: '2026-10-20T10:00:00.000Z',
      }),
      // Inactive -> excluded
      makeMember({ uid: '4', name: 'Dani', turma: '62', membershipActive: false, membershipTier: 'none' }),
      // Turma not in promo -> excluded
      makeMember({ uid: '5', name: 'Edu', turma: '60' }),
      // Valid in turma 62
      makeMember({ uid: '6', name: 'Fernanda', turma: '62', tshirtSize: 'M' }),
    ];

    const progress = computePromotionProgress(BASE_PROMO, members);
    expect(progress).toHaveLength(2);
    expect(progress[0]).toMatchObject({ turma: '63', count: 2, goalReached: true, percent: 100 });
    expect(progress[1]).toMatchObject({ turma: '62', count: 1, goalReached: false, percent: 50 });
  });

  it('generates TXT sorted by t-shirt size when isTshirtPrize is true', () => {
    const members: UserProfile[] = [
      makeMember({ uid: '1', name: 'Usuário P', turma: '63', tshirtSize: 'P' }),
      makeMember({ uid: '2', name: 'Usuário GG', turma: '63', tshirtSize: 'GG' }),
      makeMember({ uid: '3', name: 'Usuário G', turma: '63', tshirtSize: 'G' }),
      makeMember({ uid: '4', name: 'Usuário M', turma: '62', tshirtSize: 'M' }),
    ];

    const txt = generatePromotionTxtList(BASE_PROMO, members);
    expect(txt).toBe(
      [
        '# TURMA 62',
        '1.Usuário M | M',
        '# TURMA 63',
        '1.Usuário GG | GG',
        '2.Usuário G | G',
        '3.Usuário P | P',
      ].join('\n'),
    );
  });

  it('generates TXT sorted alphabetically without size when isTshirtPrize is false', () => {
    const promoNoTshirt: ClubPromotion = {
      ...BASE_PROMO,
      prizeName: 'Churrasco da Turma',
      isTshirtPrize: false,
    };
    const members: UserProfile[] = [
      makeMember({ uid: '1', name: 'Zeca', turma: '63', tshirtSize: 'P' }),
      makeMember({ uid: '2', name: 'Ana', turma: '63', tshirtSize: 'GG' }),
    ];

    const txt = generatePromotionTxtList(promoNoTshirt, members);
    expect(txt).toBe(
      ['# TURMA 62', '(Nenhum assinante elegível até o momento)', '# TURMA 63', '1.Ana', '2.Zeca'].join('\n'),
    );
  });

  it('extracts sorted unique FURB turmas', () => {
    const members: UserProfile[] = [
      makeMember({ uid: '1', turma: '63' }),
      makeMember({ uid: '2', turma: '60' }),
      makeMember({ uid: '3', turma: '63' }),
      makeMember({ uid: '4', affiliation: 'externo', turma: '' }),
    ];
    expect(extractAvailableTurmas(members)).toEqual(['60', '63']);
  });
});
