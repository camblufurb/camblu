import { describe, expect, it } from 'vitest';
import { absolutizeMediaUrl, normalizePathname, resolveRouteSeo } from '../seo';
import type { CambluEvent, ShopProduct } from '../../types/domain';

describe('SEO and Social Preview helpers', () => {
  const origin = 'https://www.camblu.org';

  it('normalizes trailing slashes and resolves public route metadata cleanly', () => {
    expect(normalizePathname('/secimed/')).toBe('/secimed');
    expect(normalizePathname('/clube/?tab=mensal#planos')).toBe('/clube');

    const home = resolveRouteSeo('/', origin);
    expect(home.robots).toBe('index, follow');
    expect(home.canonicalUrl).toBe('https://www.camblu.org/');
    expect(home.imageUrl).toBe('https://www.camblu.org/og-cover.png');
    expect(home.jsonLd?.['@type']).toBe('EducationalOrganization');

    const secimed = resolveRouteSeo('/secimed/', origin);
    expect(secimed.title).toContain('SECIMED');
    expect(secimed.robots).toBe('index, follow');
    expect(secimed.canonicalUrl).toBe('https://www.camblu.org/secimed');
  });

  it('marks transactional, member-card, and admin paths as noindex, nofollow', () => {
    for (const path of ['/back/eventos', '/perfil', '/clube/cartao', '/clube/cartao/validar/uid-123', '/certificados/validar/abc']) {
      const meta = resolveRouteSeo(path, origin);
      expect(meta.robots).toBe('noindex, nofollow');
      expect(meta.imageUrl).toBe('https://www.camblu.org/og-cover.png');
    }
  });

  it('builds Event and Product structured SEO metadata and ignores data URIs for og:image', () => {
    expect(absolutizeMediaUrl('/assets/foto.jpg', origin)).toBe('https://www.camblu.org/assets/foto.jpg');
    expect(absolutizeMediaUrl('data:image/png;base64,abc', origin)).toBeUndefined();

    const sampleEvent: CambluEvent = {
      id: 'ev-1',
      slug: 'secimed-2026',
      title: 'XVII SECIMED FURB',
      category: 'secimed',
      isSecimed: true,
      hasCoffee: true,
      maxCapacity: 250,
      mode: 'presencial',
      startAt: '2026-10-14T08:00:00.000Z',
      endAt: '2026-10-16T18:00:00.000Z',
      locationShort: 'Campus I FURB',
      description: 'Semana Científica do curso de Medicina.',
      imageUrl: 'https://storage.googleapis.com/camblu/secimed.jpg',
      lots: [],
      published: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const eventMeta = resolveRouteSeo('/eventos/secimed-2026', origin, { events: [sampleEvent] });
    expect(eventMeta.title).toBe('XVII SECIMED FURB | CAMBLU Eventos');
    expect(eventMeta.imageUrl).toBe('https://storage.googleapis.com/camblu/secimed.jpg');
    expect(eventMeta.jsonLd?.['@type']).toBe('Event');

    const sampleProduct: ShopProduct = {
      id: 'prod-1',
      slug: 'moletom-furb',
      name: 'Moletom MEDFURB Verde',
      category: 'Vestuário',
      description: 'Moletom oficial bordado.',
      priceCents: 18900,
      images: ['data:image/png;base64,stub'],
      sizes: [{ size: 'M', stock: 5 }],
      active: true,
    };

    const prodMeta = resolveRouteSeo('/lojinha/moletom-furb', origin, { products: [sampleProduct] });
    expect(prodMeta.title).toBe('Moletom MEDFURB Verde | Lojinha CAMBLU');
    expect(prodMeta.imageUrl).toBe('https://www.camblu.org/og-cover.png');
    expect(prodMeta.ogType).toBe('product');
    expect(prodMeta.jsonLd?.['@type']).toBe('Product');
  });
});
