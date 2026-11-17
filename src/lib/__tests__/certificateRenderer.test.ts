import { describe, expect, it } from 'vitest';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../certificateRenderer';

describe('certificateRenderer template defaults', () => {
  it('defines normalized coordinate percentages within 0..100 bounds', () => {
    const { fields } = DEFAULT_CERTIFICATE_TEMPLATE;
    for (const pos of [fields.name, fields.cpf, fields.hours, fields.code]) {
      expect(pos.xPercent).toBeGreaterThanOrEqual(0);
      expect(pos.xPercent).toBeLessThanOrEqual(100);
      expect(pos.yPercent).toBeGreaterThanOrEqual(0);
      expect(pos.yPercent).toBeLessThanOrEqual(100);
      expect(pos.fontSizePt).toBeGreaterThan(8);
    }
    expect(fields.qr?.sizePercent).toBeGreaterThan(0);
  });
});
