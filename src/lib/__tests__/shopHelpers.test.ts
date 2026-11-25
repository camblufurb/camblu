import { describe, expect, it } from 'vitest';
import { PRODUCTS_SEED } from '../../data/catalogSeeds';
import {
  buildProductGallery,
  findProductBySlug,
  getProductSlug,
  selectHeroMosaicProducts,
  slugifyProductName,
} from '../shopHelpers';
import type { ShopOrder, ShopProduct } from '../../types/domain';

describe('shopHelpers', () => {
  it('slugifies Brazilian Portuguese product titles cleanly', () => {
    expect(slugifyProductName('Moletom Oficial MEDFURB · Edição Verde')).toBe('moletom-oficial-medfurb-edicao-verde');
  });

  it('finds products by friendly slug, id, or generated slug', () => {
    const first = PRODUCTS_SEED[0];
    expect(findProductBySlug(PRODUCTS_SEED, getProductSlug(first))?.id).toBe(first.id);
    expect(findProductBySlug(PRODUCTS_SEED, first.id)?.id).toBe(first.id);
    expect(findProductBySlug(PRODUCTS_SEED, 'inexistente')).toBeUndefined();
  });

  it('builds 3 editorial gallery frames when no uploaded photo exists', () => {
    const gallery = buildProductGallery(PRODUCTS_SEED[0]);
    expect(gallery.length).toBe(3);
    expect(gallery[0].label).toBeTruthy();
  });

  it('orders hero mosaic as: newest, top 2 best-sellers last month, least sold', () => {
    const now = Date.parse('2026-11-25T12:00:00.000Z');
    const mkProd = (id: string, createdAt: string): ShopProduct => ({
      ...PRODUCTS_SEED[0],
      id,
      name: `Produto ${id}`,
      createdAt,
      active: true,
    });
    const prods = [
      mkProd('old-best-1', '2026-01-01T00:00:00.000Z'),
      mkProd('old-best-2', '2026-02-01T00:00:00.000Z'),
      mkProd('old-mid', '2026-03-01T00:00:00.000Z'),
      mkProd('old-least', '2026-04-01T00:00:00.000Z'),
      mkProd('newest', '2026-11-24T00:00:00.000Z'),
    ];
    const orders: ShopOrder[] = [
      {
        id: 'o1',
        buyerUid: 'u1',
        buyerName: 'A',
        buyerEmail: 'a@b.com',
        buyerPhone: '47999',
        items: [
          { productId: 'old-best-1', productName: 'P1', size: 'M', quantity: 10, unitPriceCents: 1000 },
          { productId: 'old-best-2', productName: 'P2', size: 'M', quantity: 6, unitPriceCents: 1000 },
          { productId: 'old-mid', productName: 'P3', size: 'M', quantity: 3, unitPriceCents: 1000 },
          { productId: 'old-least', productName: 'P4', size: 'M', quantity: 1, unitPriceCents: 1000 },
        ],
        subtotalCents: 1000,
        discountCents: 0,
        totalCents: 1000,
        paymentMethod: 'stripe_pix',
        paymentStatus: 'paid',
        delivered: true,
        createdAt: '2026-11-20T10:00:00.000Z',
      },
    ];

    const mosaic = selectHeroMosaicProducts(prods, orders, now);
    expect(mosaic.map((p) => p.id)).toEqual(['newest', 'old-best-1', 'old-best-2', 'old-least']);
  });
});
