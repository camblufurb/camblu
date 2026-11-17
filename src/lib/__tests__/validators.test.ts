import { describe, expect, it } from 'vitest';
import {
  buildWhatsappUrl,
  digitsOnly,
  formatBrlFromCents,
  formatCpf,
  formatPhoneBr,
  isDigitsOnlyString,
  isValidCpf,
  slugify,
} from '../validators';

describe('validators', () => {
  it('validates real and invalid CPFs correctly', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
  });

  it('formats CPF, phone, WhatsApp URL, BRL currency and slugify', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
    expect(formatPhoneBr('47999998888')).toBe('(47) 99999-8888');
    expect(buildWhatsappUrl('(47) 99999-8888')).toBe('https://wa.me/5547999998888');
    expect(digitsOnly('(47) 3321-0277')).toBe('4733210277');
    expect(isDigitsOnlyString('63')).toBe(true);
    expect(isDigitsOnlyString('LXIII')).toBe(false);
    expect(formatBrlFromCents(350)).toContain('3,50');
    expect(slugify('XXIII SECIMED — Blumenau 2026!')).toBe('xxiii-secimed-blumenau-2026');
  });
});
