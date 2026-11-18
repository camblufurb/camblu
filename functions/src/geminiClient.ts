const AI_STUDIO_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const VERTEX_AI_BASE = 'https://aiplatform.googleapis.com/v1';

export type GeminiAuthInput =
  | string
  | {
      mode: 'vertex-adc' | 'api-key';
      projectId?: string;
      apiKey?: string;
      getAccessToken?: () => Promise<string>;
    };

export interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }>;
    };
  }>;
}

export interface GeminiCallResult {
  payload: GeminiGenerateContentResponse;
  resolvedModel: string;
  transport: 'vertex-adc' | 'ai-studio';
}

let cachedToken: { token: string; expiresAtMs: number } | null = null;

async function getDefaultVertexAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAtMs - 60_000) {
    return cachedToken.token;
  }
  const { applicationDefault } = await import('firebase-admin/app');
  const tokenRes = await applicationDefault().getAccessToken();
  const token = tokenRes.access_token;
  if (!token) {
    throw new Error('Não foi possível obter token OAuth ADC da Service Account para o Vertex AI.');
  }
  const ttlMs = (tokenRes.expires_in || 3600) * 1000;
  cachedToken = { token, expiresAtMs: Date.now() + ttlMs };
  return token;
}

/**
 * Maps generic Gemini model aliases to their canonical Vertex AI publisher model candidates.
 */
export function resolveVertexModelCandidates(requestedModel: string): string[] {
  if (requestedModel === 'gemini-flash-lite-latest') {
    return ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest'];
  }
  if (requestedModel === 'gemini-flash-latest') {
    return ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-flash-latest'];
  }
  if (requestedModel === 'gemini-nano-banana-2.1') {
    return ['gemini-nano-banana-2.1', 'gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
  }
  return [requestedModel];
}

/**
 * Shared Gemini `generateContent` transport supporting:
 * - Vertex AI OAuth/ADC (uses Google Cloud Postpaid billing & credits natively in Cloud Functions)
 * - API-key transport (`generativelanguage.googleapis.com`, preserved for explicit keys & unit tests)
 */
export async function callGeminiGenerateContent(params: {
  model: string;
  auth: GeminiAuthInput;
  body: Record<string, unknown>;
  fetchImpl?: typeof fetch;
}): Promise<GeminiCallResult> {
  const { model, auth, body, fetchImpl = fetch } = params;

  if (typeof auth === 'string' || auth.mode === 'api-key') {
    const apiKey = (typeof auth === 'string' ? auth : auth.apiKey || '').trim();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no servidor.');
    }

    const endpoint = `${AI_STUDIO_BASE}/${encodeURIComponent(model)}:generateContent`;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 260)}`);
    }

    return {
      payload: (await response.json()) as GeminiGenerateContentResponse,
      resolvedModel: model,
      transport: 'ai-studio',
    };
  }

  const projectId = (auth.projectId || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'camblu').trim();
  const accessToken = auth.getAccessToken ? await auth.getAccessToken() : await getDefaultVertexAccessToken();

  const candidates = resolveVertexModelCandidates(model);
  const locations = ['global', 'us-central1'] as const;
  let lastError = 'Nenhum endpoint Vertex AI respondeu com sucesso.';

  for (const candidateModel of candidates) {
    for (const location of locations) {
      const endpoint = `${VERTEX_AI_BASE}/projects/${encodeURIComponent(projectId)}/locations/${location}/publishers/google/models/${encodeURIComponent(candidateModel)}:generateContent`;
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return {
          payload: (await response.json()) as GeminiGenerateContentResponse,
          resolvedModel: candidateModel,
          transport: 'vertex-adc',
        };
      }

      const errText = await response.text().catch(() => '');
      lastError = `Vertex AI (${candidateModel} @ ${location}) HTTP ${response.status}: ${errText.slice(0, 260)}`;

      // Try next location/model only when model ID or regional availability returned 404;
      // surface permission/quota/invalid-argument errors immediately without redundant retries.
      if (response.status !== 404) {
        throw new Error(lastError);
      }
    }
  }

  throw new Error(lastError);
}
