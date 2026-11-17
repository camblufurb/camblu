import { describe, expect, it } from 'vitest';
import {
  getMemberCardAppearance,
  resolveMemberPhotoUrl,
  tiltFromDeviceOrientation,
  tiltFromPointer,
} from '../memberCard';

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
});
