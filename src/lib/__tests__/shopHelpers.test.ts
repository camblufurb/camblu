import { describe, expect, it } from 'vitest';
import { PRODUCTS_SEED } from '../../data/catalogSeeds';
import { buildProductGallery, findProductBySlug, getProductSlug, slugifyProductName } from '../shopHelpers';

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
});
