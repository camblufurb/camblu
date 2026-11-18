import { describe, expect, it, vi } from 'vitest';
import {
  buildDynamicProductShotPlans,
  chooseHighContrastStudioGradient,
  pickRandomFurbReferences,
  type FurbReferenceAsset,
} from '../productAiStudio';
import {
  GEMINI_IMAGE_MODEL,
  generateProductImagesWithNanoBanana,
} from '../../../functions/src/productImageGenerator';

describe('productAiStudio & gemini-nano-banana-2.1 generator', () => {
  const sampleRefs: FurbReferenceAsset[] = [
    { id: 'r1', path: '../ai_ref/bloco-j.jpg', label: 'bloco j', url: '/assets/bloco-j.jpg' },
    { id: 'r2', path: '../ai_ref/biblioteca.jpg', label: 'biblioteca', url: '/assets/biblioteca.jpg' },
    { id: 'r3', path: '../ai_ref/campus-verde.jpg', label: 'campus verde', url: '/assets/campus-verde.jpg' },
  ];

  it('draws unique random FURB campus references across shots when enough references exist', () => {
    const seq = [0.2, 0.7, 0.4];
    let i = 0;
    const picked = pickRandomFurbReferences(sampleRefs, 2, () => seq[i++ % seq.length]);
    expect(picked).toHaveLength(2);
    expect(picked[0]?.id).not.toBe(picked[1]?.id);
  });

  it('picks high-contrast studio gradients opposite to product brightness', () => {
    const forDark = chooseHighContrastStudioGradient(0.18, 'Moletom Verde Botânico', 'Moletom escuro', () => 0.1);
    expect(forDark.tone).toBe('light_bg');
    expect(forDark.description).toMatch(/tons claros/i);

    const forLight = chooseHighContrastStudioGradient(0.82, 'Camiseta Off-White', 'Malha branca', () => 0.1);
    expect(forLight.tone).toBe('dark_bg');
    expect(forLight.description).toMatch(/tons profundos/i);
  });

  it('builds dynamic randomized individual, group, and studio shot plans', () => {
    const plans = buildDynamicProductShotPlans({
      productName: 'Moletom MEDFURB',
      productDescription: 'Verde botânico com bordado dourado',
      productCategory: 'Vestuário',
      avgLuminance: 0.22,
      selectedShots: ['furb_individual', 'furb_group', 'studio_gradient'],
      customNotes: 'Destacar capuz',
      furbRefs: sampleRefs,
      rng: () => 0.5,
    });

    expect(plans).toHaveLength(3);
    expect(plans[0].shotType).toBe('furb_individual');
    expect(plans[0].referenceLabel).toBeTruthy();
    expect(plans[0].prompt).toContain('Destacar capuz');

    expect(plans[1].shotType).toBe('furb_group');
    expect(plans[1].prompt).toContain('Pessoa 1:');
    expect(plans[1].prompt).toContain('Pessoa 2:');

    expect(plans[2].shotType).toBe('studio_gradient');
    expect(plans[2].referenceAsset).toBeUndefined();
    expect(plans[2].prompt).toMatch(/gradiente/i);

    const studio3 = buildDynamicProductShotPlans({
      productName: 'Garrafa Térmica',
      productDescription: 'Verde fosco 500ml',
      productCategory: 'Acessórios',
      avgLuminance: 0.2,
      selectedShots: ['studio_gradient', 'studio_gradient', 'studio_gradient'],
      furbRefs: sampleRefs,
      rng: () => 0.1,
    });
    expect(studio3).toHaveLength(3);
    expect(new Set(studio3.map((s) => s.prompt)).size).toBe(3);
  });

  it('calls gemini-nano-banana-2.1 with product and FURB reference inlineData and parses returned image', async () => {
    const requests: Array<{ url: string; body: string }> = [];
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), body: String(init?.body || '') });
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: 'AQIDBA==',
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const result = await generateProductImagesWithNanoBanana({
      productImages: [{ mimeType: 'image/jpeg', data: 'QUJD' }],
      shots: [
        {
          id: 's1',
          shotType: 'furb_individual',
          label: 'Individual na FURB',
          prompt: 'Foto editorial no campus FURB',
          aspectRatio: '1:1',
          referenceLabel: 'bloco j',
          referenceImage: { mimeType: 'image/jpeg', data: 'REVG' },
        },
        {
          id: 's2',
          shotType: 'studio_gradient',
          label: 'Estúdio',
          prompt: 'Produto isolado em gradiente claro',
          aspectRatio: '1:1',
        },
      ],
      apiKey: 'secret-key',
      fetchImpl: mockFetch,
    });

    expect(requests).toHaveLength(2);
    expect(requests[0].url).toContain(`${GEMINI_IMAGE_MODEL}:generateContent`);
    expect(JSON.parse(requests[0].body).contents[0].parts).toHaveLength(3);
    expect(JSON.parse(requests[1].body).contents[0].parts).toHaveLength(2);
    expect(result.model).toBe('gemini-nano-banana-2.1');
    expect(result.images[0].dataUrl).toBe('data:image/png;base64,AQIDBA==');
    expect(result.images[0].referenceLabel).toBe('bloco j');
  });
});
