import { callGeminiGenerateContent, type GeminiAuthInput } from './geminiClient.js';
import type { InlineImagePayload } from './productImageGenerator.js';

export const GEMINI_DESCRIPTION_MODEL = 'gemini-flash-lite-latest';

export interface ProductDescriptionInput {
  name: string;
  category?: string;
  sizes?: Array<{ size: string; stock?: number }>;
  details?: string[];
  currentDescription?: string;
  productImages?: InlineImagePayload[];
  apiKey: GeminiAuthInput;
}

/**
 * Generates an engaging, direct Portuguese catalog description for a CAMBLU shop product
 * using `gemini-flash-lite-latest`, optionally conditioned on a reference product image.
 */
export async function generateProductDescriptionWithFlashLite(
  input: ProductDescriptionInput,
): Promise<{ description: string; model: string }> {
  const cleanName = input.name.trim();
  if (!cleanName) {
    throw new Error('Informe o nome do produto antes de gerar a descrição com IA.');
  }

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  if (Array.isArray(input.productImages)) {
    for (const img of input.productImages.slice(0, 2)) {
      if (img?.mimeType && img?.data) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
    }
  }

  const sizeList = (input.sizes || [])
    .map((s) => s.size?.trim())
    .filter(Boolean)
    .join(', ');
  const detailsList = (input.details || []).map((d) => d.trim()).filter(Boolean);

  const promptLines = [
    'Você é redator(a) oficial da Lojinha do CAMBLU (Centro Acadêmico de Medicina de Blumenau — MEDFURB).',
    'Escreva uma descrição comercial envolvente, clara e natural em português do Brasil para este produto oficial.',
    `Produto: ${cleanName}`,
    input.category ? `Categoria: ${input.category}` : '',
    sizeList ? `Tamanhos disponíveis: ${sizeList}` : '',
    detailsList.length ? `Especificações já informadas: ${detailsList.join(' | ')}` : '',
    input.currentDescription?.trim()
      ? `Rascunho atual (melhore e deixe mais atrativo sem perder fatos): ${input.currentDescription.trim()}`
      : '',
    'Regras obrigatórias:',
    '- Escreva em 2 a 4 frases corridas e diretas (máximo ~380 caracteres), prontas para o card/página de compra.',
    '- Destaque conforto, acabamento, identidade acadêmica Medicina FURB / CAMBLU e praticidade no dia a dia universitário.',
    '- Não invente preços, porcentagens de desconto ou composições de tecido que não foram informadas.',
    '- Não use emojis, hashtags, títulos, aspas em volta do texto ou formatação Markdown.',
  ].filter(Boolean);

  parts.push({ text: promptLines.join('\n') });

  const { payload, resolvedModel } = await callGeminiGenerateContent({
    model: GEMINI_DESCRIPTION_MODEL,
    auth: input.apiKey,
    body: {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: 320,
      },
    },
  });

  const text = (payload.candidates || [])
    .flatMap((c) => c.content?.parts || [])
    .map((p) => p.text || '')
    .join('')
    .trim()
    .replace(/^["“]|["”]$/g, '');

  if (!text) {
    throw new Error(`Resposta vazia do modelo ${resolvedModel}.`);
  }

  return {
    description: text,
    model: resolvedModel || GEMINI_DESCRIPTION_MODEL,
  };
}
