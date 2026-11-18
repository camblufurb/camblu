export const GEMINI_IMAGE_MODEL = 'gemini-nano-banana-2.1';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const ALLOWED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

export interface InlineImagePayload {
  mimeType: string;
  data: string; // base64 without data: prefix
}

export interface ProductAiShotRequest {
  id: string;
  shotType: 'furb_individual' | 'furb_group' | 'studio_gradient';
  label: string;
  prompt: string;
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9';
  referenceLabel?: string;
  referenceImage?: InlineImagePayload;
}

export interface GeneratedProductAiImage {
  id: string;
  shotType: ProductAiShotRequest['shotType'];
  label: string;
  mimeType: string;
  dataUrl: string;
  referenceLabel?: string;
  promptUsed: string;
}

function assertValidImage(img: InlineImagePayload, label: string): InlineImagePayload {
  const mimeType = String(img.mimeType || '').trim().toLowerCase();
  if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
    throw new Error(`Formato inválido em ${label} (${mimeType || 'desconhecido'}). Use PNG, JPEG ou WebP.`);
  }
  const cleanData = String(img.data || '').replace(/\s+/g, '');
  if (!cleanData || cleanData.length > 6_000_000) {
    throw new Error(`Tamanho inválido de imagem em ${label}.`);
  }
  return { mimeType, data: cleanData };
}

/**
 * Generates final e-commerce/editorial images for a product using `gemini-nano-banana-2.1`,
 * conditioning on the raw product photo(s) and an optional randomly picked FURB campus reference image.
 */
export async function generateSingleProductShotWithNanoBanana(params: {
  productImages: InlineImagePayload[];
  shot: ProductAiShotRequest;
  apiKey: string;
  fetchImpl?: typeof fetch;
}): Promise<GeneratedProductAiImage> {
  const { productImages, shot, apiKey, fetchImpl = fetch } = params;
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  if (!Array.isArray(productImages) || productImages.length === 0) {
    throw new Error('Envie pelo menos uma foto base do produto para gerar as imagens com IA.');
  }

  const validProducts = productImages.slice(0, 4).map((img, i) => assertValidImage(img, `produto #${i + 1}`));
  const validReference = shot.referenceImage
    ? assertValidImage(shot.referenceImage, 'referência FURB')
    : undefined;

  const parts: Array<{ text: string } | { inlineData: InlineImagePayload }> = [
    ...validProducts.map((img) => ({ inlineData: img })),
  ];
  if (validReference) {
    parts.push({ inlineData: validReference });
  }
  parts.push({ text: shot.prompt.trim().slice(0, 4000) });

  const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(GEMINI_IMAGE_MODEL)}:generateContent`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: shot.aspectRatio || '1:1',
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini (${GEMINI_IMAGE_MODEL}) HTTP ${response.status}: ${errText.slice(0, 260)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: { mimeType?: string; data?: string };
        }>;
      };
    }>;
  };

  const imagePart = payload.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  );
  if (!imagePart?.inlineData?.data) {
    throw new Error(`O modelo ${GEMINI_IMAGE_MODEL} não retornou dados de imagem para "${shot.label}".`);
  }

  const outMime = imagePart.inlineData.mimeType || 'image/png';
  return {
    id: shot.id,
    shotType: shot.shotType,
    label: shot.label,
    mimeType: outMime,
    dataUrl: `data:${outMime};base64,${imagePart.inlineData.data}`,
    referenceLabel: shot.referenceLabel,
    promptUsed: shot.prompt,
  };
}

export async function generateProductImagesWithNanoBanana(params: {
  productImages: InlineImagePayload[];
  shots: ProductAiShotRequest[];
  apiKey: string;
  fetchImpl?: typeof fetch;
}): Promise<{ model: string; images: GeneratedProductAiImage[] }> {
  const { productImages, shots, apiKey, fetchImpl = fetch } = params;
  if (!Array.isArray(shots) || shots.length === 0 || shots.length > 4) {
    throw new Error('Solicite entre 1 e 4 variações de imagem por geração.');
  }

  const images = await Promise.all(
    shots.map((shot) =>
      generateSingleProductShotWithNanoBanana({
        productImages,
        shot,
        apiKey,
        fetchImpl,
      }),
    ),
  );

  return {
    model: GEMINI_IMAGE_MODEL,
    images,
  };
}
