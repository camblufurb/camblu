import { describe, expect, it, vi } from 'vitest';
import {
  categorizeTransparencyEntriesWithGemini,
  GEMINI_CATEGORIZER_MODEL,
  normalizeCategoryLabel,
  type CategorizableTransparencyEntry,
} from '../../../functions/src/transparencyCategorizer';

describe('transparencyCategorizer (gemini-flash-lite-latest)', () => {
  it('sanitizes and truncates category labels cleanly', () => {
    expect(normalizeCategoryLabel('  "Lojinha & Produtos"  ')).toBe('Lojinha & Produtos');
    expect(normalizeCategoryLabel('')).toBe('');
    expect(normalizeCategoryLabel('Categoria Extremamente Longa Que Passa Do Limite Permitido').length).toBeLessThanOrEqual(36);
  });

  it('rejects empty API key and handles empty entry lists cleanly', async () => {
    await expect(categorizeTransparencyEntriesWithGemini([], '')).rejects.toThrow(/GEMINI_API_KEY/);
    const emptyRes = await categorizeTransparencyEntriesWithGemini([], 'fake-key');
    expect(emptyRes).toEqual({
      model: GEMINI_CATEGORIZER_MODEL,
      categories: [],
      assignments: {},
    });
  });

  it('calls gemini-flash-lite-latest, canonicalizes categories across batches, and fills missing IDs', async () => {
    const entries: CategorizableTransparencyEntry[] = [
      { id: 'e1', sheet: 'Março', date: '2026-03-01', type: 'despesa', description: '50% camiseta calouros', amountCents: 48196 },
      { id: 'e2', sheet: 'Março', date: '2026-03-31', type: 'receita', description: 'Lojinha - Vendas no pix', amountCents: 39100 },
      { id: 'e3', sheet: 'Abril', date: '2026-04-10', type: 'despesa', description: 'filantropia dia da família', amountCents: 12500 },
    ];

    const calls: Array<{ url: string; body: string }> = [];
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, body: String(init?.body || '') });

      const batchNum = calls.length;
      const bodyJson =
        batchNum === 1
          ? {
              categories: ['Lojinha & Produtos', 'Filantropia'],
              assignments: [
                { id: 'e1', category: 'Lojinha & Produtos' },
                { id: 'e2', category: 'lojinha & produtos' },
              ],
            }
          : {
              categories: ['Filantropia'],
              assignments: [],
            };

      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(bodyJson) }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const result = await categorizeTransparencyEntriesWithGemini(entries, 'test-secret-key', mockFetch, 2);

    expect(calls).toHaveLength(2);
    expect(calls[0].url).toContain('gemini-flash-lite-latest:generateContent');
    expect(calls[1].body).toContain('Lojinha & Produtos');
    expect(result.model).toBe('gemini-flash-lite-latest');
    expect(result.assignments).toEqual({
      e1: 'Lojinha & Produtos',
      e2: 'Lojinha & Produtos',
      e3: 'Filantropia',
    });
    expect(result.categories).toEqual(['Filantropia', 'Lojinha & Produtos']);
  });
});
