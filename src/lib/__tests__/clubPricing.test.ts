import { describe, expect, it } from 'vitest';
import { calculateEventTicketPrice, calculateShopPrice } from '../clubPricing';

describe('clubPricing', () => {
  const secimedEvent = { isSecimed: true, hasCoffee: true, category: 'secimed' as const };
  const coffeeEvent = { isSecimed: false, hasCoffee: true, category: 'camblu_coffee' as const };

  it('gives 10% off on shop for any active club tier', () => {
    expect(calculateShopPrice(10000, 'comum', true)).toEqual({ totalCents: 9000, discountCents: 1000 });
    expect(calculateShopPrice(10000, 'lendario', true)).toEqual({ totalCents: 9000, discountCents: 1000 });
    expect(calculateShopPrice(10000, 'raro', false)).toEqual({ totalCents: 10000, discountCents: 0 });
  });

  it('applies exact tier rules to SECIMED and CAMBLU coffee events', () => {
    // Comum gets 10% on both
    expect(calculateEventTicketPrice(5000, coffeeEvent, 'comum', true).finalCents).toBe(4500);
    expect(calculateEventTicketPrice(6500, secimedEvent, 'comum', true).finalCents).toBe(5850);

    // Raro gets free coffee event (non-SECIMED), 10% on SECIMED
    expect(calculateEventTicketPrice(5000, coffeeEvent, 'raro', true).finalCents).toBe(0);
    expect(calculateEventTicketPrice(6500, secimedEvent, 'raro', true).finalCents).toBe(5850);

    // Épico & Lendário get all events free including SECIMED
    expect(calculateEventTicketPrice(6500, secimedEvent, 'epico', true).finalCents).toBe(0);
    expect(calculateEventTicketPrice(6500, secimedEvent, 'lendario', true).finalCents).toBe(0);
  });
});
