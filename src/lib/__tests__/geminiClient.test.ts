import { describe, expect, it, vi } from 'vitest';
import { callGeminiGenerateContent, resolveVertexModelCandidates } from '../../../functions/src/geminiClient';

describe('geminiClient (Vertex AI Postpaid ADC + fallback)', () => {
  it('resolves Vertex AI model candidate aliases accurately', () => {
    expect(resolveVertexModelCandidates('gemini-flash-lite-latest')).toEqual([
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
    ]);
    expect(resolveVertexModelCandidates('gemini-flash-latest')).toEqual([
      'gemini-flash-latest',
      'gemini-3-flash-preview',
      'gemini-3-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash-001',
    ]);
    expect(resolveVertexModelCandidates('gemini-nano-banana-2.1')).toEqual([
      'gemini-nano-banana-2.1',
      'gemini-3.1-flash-image-preview',
      'gemini-2.5-flash-image',
      'gemini-2.5-flash-image-preview',
    ]);
  });

  it('calls Vertex AI global and regional endpoints using OAuth Bearer ADC and handles 404 fallback', async () => {
    const calls: Array<{ url: string; authHeader: string | null }> = [];
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      calls.push({ url: String(input), authHeader: headers.get('Authorization') });
      if (calls.length === 1) {
        return new Response(JSON.stringify({ error: { code: 404 } }), { status: 404 });
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const result = await callGeminiGenerateContent({
      model: 'gemini-flash-lite-latest',
      auth: {
        mode: 'vertex-adc',
        projectId: 'camblu',
        getAccessToken: async () => 'oauth-test-token',
      },
      body: { contents: [{ role: 'user', parts: [{ text: 'ping' }] }] },
      fetchImpl: mockFetch,
    });

    expect(calls).toHaveLength(2);
    expect(calls[0].url).toContain(
      'https://aiplatform.googleapis.com/v1/projects/camblu/locations/global/publishers/google/models/gemini-flash-lite-latest:generateContent',
    );
    expect(calls[0].authHeader).toBe('Bearer oauth-test-token');
    expect(calls[1].url).toContain(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/camblu/locations/us-central1/publishers/google/models/gemini-flash-lite-latest:generateContent',
    );
    expect(result.transport).toBe('vertex-adc');
    expect(result.resolvedModel).toBe('gemini-flash-lite-latest');
  });
});
