import { describe, expect, it, vi } from 'vitest';
import { callGeminiGenerateContent, resolveVertexModelCandidates } from '../../../functions/src/geminiClient';

describe('geminiClient (Vertex AI Postpaid ADC + fallback)', () => {
  it('resolves Vertex AI model candidate aliases accurately', () => {
    expect(resolveVertexModelCandidates('gemini-flash-lite-latest')).toEqual([
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite-001',
      'gemini-2.0-flash-lite',
    ]);
    expect(resolveVertexModelCandidates('gemini-flash-latest')).toEqual([
      'gemini-2.5-flash',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash',
      'gemini-3-flash-preview',
    ]);
    expect(resolveVertexModelCandidates('gemini-nano-banana-2.1')).toEqual([
      'gemini-nano-banana-2.1',
      'gemini-3.1-flash-image-preview',
      'gemini-2.5-flash-image',
      'gemini-2.5-flash-image-preview',
    ]);
  });

  it('calls Vertex AI regional and global endpoints using OAuth Bearer ADC and handles 404 fallback', async () => {
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
      'https://us-central1-aiplatform.googleapis.com/v1/projects/camblu/locations/us-central1/publishers/google/models/gemini-2.5-flash-lite:generateContent',
    );
    expect(calls[0].authHeader).toBe('Bearer oauth-test-token');
    expect(calls[1].url).toContain(
      'https://aiplatform.googleapis.com/v1/projects/camblu/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent',
    );
    expect(result.transport).toBe('vertex-adc');
    expect(result.resolvedModel).toBe('gemini-2.5-flash-lite');
  });
});
