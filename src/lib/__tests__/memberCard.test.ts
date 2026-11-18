import { describe, expect, it } from 'vitest';
import {
  buildMemberCardValidationUrl,
  buildMemberCardVerificationFromProfile,
  getMemberCardAppearance,
  resolveMemberPhotoUrl,
  tiltFromDeviceOrientation,
  tiltFromPointer,
} from '../memberCard';
import type { UserProfile } from '../../types/domain';

describe('memberCard helpers', () => {
  it('computes clamped tilt from device orientation and ignores null/invalid readings', () => {
    expect(tiltFromDeviceOrientation(null, 40)).toBeNull();
    expect(tiltFromDeviceOrientation(10, undefined)).toBeNull();
    expect(tiltFromDeviceOrientation(Number.NaN, 35)).toBeNull();
    expect(tiltFromDeviceOrientation(12, 45)).toEqual({ x: 12, y: 10 });
    expect(tiltFromDeviceOrientation(-40, 80)).toEqual({ x: -18, y: 18 });
    expect(tiltFromDeviceOrientation(30, -10)).toEqual({ x: 18, y: -18 });
  });

  it('computes normalized tilt from pointer position inside card bounds', () => {
    const rect = { left: 100, top: 200, width: 400, height: 250 };
    expect(tiltFromPointer(300, 325, rect)).toEqual({ x: 0, y: 0 });
    expect(tiltFromPointer(500, 450, rect)).toEqual({ x: 13, y: 13 });
    expect(tiltFromPointer(100, 200, rect)).toEqual({ x: -13, y: -13 });
    expect(tiltFromPointer(150, 220, { left: 0, top: 0, width: 0, height: 100 })).toEqual({ x: 0, y: 0 });
  });

  it('returns distinct card appearance per tier and high-contrast gold foreground for lendario', () => {
    const inactive = getMemberCardAppearance('raro', false);
    const raro = getMemberCardAppearance('raro', true);
    const lendario = getMemberCardAppearance('lendario', true);

    expect(inactive.foreground).toBe('#ffffff');
    expect(raro.background).not.toBe(inactive.background);
    expect(lendario.foreground).toBe('#1f1600');
  });

  it('resolves non-empty trimmed photoURL or returns undefined', () => {
    expect(resolveMemberPhotoUrl({ photoURL: '  https://lh3.googleusercontent.com/avatar.jpg  ' })).toBe(
      'https://lh3.googleusercontent.com/avatar.jpg',
    );
    expect(resolveMemberPhotoUrl({ photoURL: '   ' })).toBeUndefined();
    expect(resolveMemberPhotoUrl(null)).toBeUndefined();
  });

  it('builds public validation URL pointing to /clube/cartao/validar/:uid', () => {
    expect(buildMemberCardValidationUrl('uid-abc-123', 'https://camblu.org/')).toBe(
      'https://camblu.org/clube/cartao/validar/uid-abc-123',
    );
    expect(buildMemberCardValidationUrl('uid with space', 'https://camblu.web.app')).toBe(
      'https://camblu.web.app/clube/cartao/validar/uid%20with%20space',
    );
  });

  it('validates active FURB student profile and rejects inactive or external profiles as student ID', () => {
    const baseUser: UserProfile = {
      uid: 'usr-furb-63',
      name: 'Marina Souza',
      email: 'marina@furb.br',
      photoURL: 'https://lh3.googleusercontent.com/marina.jpg',
      cpf: '529.982.247-25',
      phone: '47999887766',
      affiliation: 'FURB',
      turma: '63',
      isCalouro: true,
      membershipTier: 'comum',
      membershipCycle: 'semestral',
      membershipActive: true,
      membershipValidUntil: '2028-01-01T00:00:00.000Z',
      role: 'student',
      profileCompleted: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const nowMs = Date.parse('2026-11-18T12:00:00.000Z');
    const validRes = buildMemberCardVerificationFromProfile(baseUser, nowMs);
    expect(validRes).toMatchObject({
      found: true,
      valid: true,
      active: true,
      tier: 'comum',
      tierCode: 1,
      tierName: 'Comum',
      name: 'Marina Souza',
      cpf: '52998224725',
      photoURL: 'https://lh3.googleusercontent.com/marina.jpg',
      institution: 'FURB',
      course: 'Medicina',
      turma: '63',
    });

    const inactiveRes = buildMemberCardVerificationFromProfile(
      { ...baseUser, membershipActive: false, membershipTier: 'none' },
      nowMs,
    );
    expect(inactiveRes).toMatchObject({
      found: true,
      valid: false,
      active: false,
      tierCode: 0,
      cpf: '',
    });

    const externalRes = buildMemberCardVerificationFromProfile(
      { ...baseUser, affiliation: 'externo', membershipTier: 'raro' },
      nowMs,
    );
    expect(externalRes).toMatchObject({
      found: true,
      valid: false,
      active: true,
      tier: 'raro',
      tierCode: 2,
      institution: 'Externo (sem vínculo FURB)',
    });

    expect(buildMemberCardVerificationFromProfile(null, nowMs)).toMatchObject({
      found: false,
      valid: false,
      tierCode: 0,
    });
  });
});
