import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { API_BASE_URL, getAuthHeaders, isFirebaseConfigured, storage } from './firebase';

const FURB_REF_IMAGE_MODULES = import.meta.glob<string>(
  '../ai_ref/**/*.{png,jpg,jpeg,webp,avif,PNG,JPG,JPEG,WEBP,AVIF}',
  { eager: true, query: '?url', import: 'default' },
);

export type ProductAiShotType = 'furb_individual' | 'furb_group' | 'studio_gradient';

export interface FurbReferenceAsset {
  id: string;
  path: string;
  label: string;
  url: string;
}

export interface InlineImagePayload {
  mimeType: string;
  data: string;
}

export interface CompressedUploadAsset extends InlineImagePayload {
  dataUrl: string;
  avgLuminance: number;
}

export interface ProductAiShotPlan {
  id: string;
  shotType: ProductAiShotType;
  label: string;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9';
  prompt: string;
  referenceAsset?: FurbReferenceAsset;
  referenceLabel?: string;
}

export interface GeneratedProductAiImageResult {
  id: string;
  shotType: ProductAiShotType;
  label: string;
  mimeType: string;
  dataUrl: string;
  referenceLabel?: string;
  promptUsed: string;
}

const PERSON_GENDER_ROLES = [
  'uma acadêmica de medicina jovem adulta',
  'um acadêmico de medicina jovem adulto',
];

const SKIN_TONES = [
  'de pele clara com rubor natural',
  'de pele morena clara dourada',
  'de pele parda brasileira',
  'de pele negra retinta',
  'de pele amarela / descendência asiática',
];

const HAIR_STYLES = [
  'cabelo liso castanho-escuro natural',
  'cabelo ondulado castanho médio solto',
  'cabelo cacheado volumoso escuro',
  'cabelo crespo curto bem cuidado',
  'cabelo loiro escuro médio natural',
  'cabelo preso em coque despojado de rotina universitária',
  'cabelo ruivo acobreado ondulado',
];

const EYEWEAR_DETAILS = [
  'usando óculos de grau modernos de armação leve',
  'sem óculos, olhar expressivo e natural',
  'sem óculos',
];

const EXPRESSIONS = [
  'com sorriso espontâneo olhando para a câmera',
  'em pose natural descontraída durante o intervalo entre aulas',
  'conversando de forma natural com postura confiante',
];

const WARDROBE_COMPLEMENTS = [
  'combinando naturalmente com calça jeans azul clara e tênis casual limpo',
  'usando calça de sarja bege neutra e mochila universitária discreta nas costas',
  'vestindo peça neutra discreta de apoio (como calça escura de alfaiataria leve), sem cobrir ou obstruir o produto',
];

const FURB_FALLBACK_ENVIRONMENTS = [
  'área externa arborizada de campus universitário brasileiro com arquitetura moderna em tijolos/concreto claro e luz da tarde',
  'corredor universitário amplo com iluminação natural e ambiente estudantil acadêmico limpo',
  'pátio de convivência universitário com bancos de madeira, vegetação atlântica e luz natural suave',
];

const DARK_PRODUCT_CONTRAST_GRADIENTS = [
  'gradiente radial suave e limpo em tons claros de marfim quente (#fbf7ec) para bege areia suave (#eadfc5), criando alto contraste contra cores escuras',
  'gradiente linear suave e minimalista de branco gelo (#f6f9fc) para cinza azulado claríssimo (#dde7f0), oferecendo recorte nítido e alto contraste',
  'gradiente suave de cinza pérola luminoso (#f5f5f4) para champanhe fosco claro (#e6e1d3), estúdio minimalista sem texturas ruidosas',
];

const LIGHT_PRODUCT_CONTRAST_GRADIENTS = [
  'gradiente radial suave em tons profundos de verde esmeralda escuro (#0f3325) para verde floresta suave (#1c563f), criando alto contraste contra peças claras',
  'gradiente linear suave em tons profundos de azul-ardósia noturno (#10233d) para azul petróleo escuro (#1c3d66), com altíssimo contraste para produtos claros',
  'gradiente suave e minimalista de grafite escuro (#1a1d22) para chumbo acetinado (#2b313a), destacando perfeitamente produtos claros',
];

function pick<T>(arr: readonly T[], rng: () => number): T {
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(rng() * arr.length)));
  return arr[idx];
}

function formatReferenceLabel(filePath: string): string {
  const filename = filePath.split('/').pop() || 'campus-furb';
  const base = filename.replace(/\.[^.]+$/, '');
  return base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Campus FURB';
}

/**
 * Lists all FURB location reference images placed inside `src/ai_ref/`.
 */
export function getAvailableFurbReferences(): FurbReferenceAsset[] {
  return Object.entries(FURB_REF_IMAGE_MODULES)
    .map(([path, url], idx) => ({
      id: `furb-ref-${idx}`,
      path,
      label: formatReferenceLabel(path),
      url,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Randomly draws `count` FURB campus references, avoiding duplicates whenever enough files exist.
 */
export function pickRandomFurbReferences(
  refs: readonly FurbReferenceAsset[],
  count: number,
  rng: () => number = Math.random,
): Array<FurbReferenceAsset | undefined> {
  if (count <= 0) return [];
  if (refs.length === 0) return Array.from({ length: count }, () => undefined);

  const pool = [...refs];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const chosen: FurbReferenceAsset[] = [];
  for (let i = 0; i < count; i += 1) {
    chosen.push(pool[i % pool.length]);
  }
  return chosen;
}

export function sampleRandomPersonDescription(rng: () => number = Math.random): string {
  return [
    pick(PERSON_GENDER_ROLES, rng),
    pick(SKIN_TONES, rng),
    pick(HAIR_STYLES, rng),
    pick(EYEWEAR_DETAILS, rng),
    pick(EXPRESSIONS, rng),
    pick(WARDROBE_COMPLEMENTS, rng),
  ].join(', ');
}

export function chooseHighContrastStudioGradient(
  avgLuminance: number,
  productName: string,
  productDesc: string,
  rng: () => number = Math.random,
  variantIndex = 0,
): { tone: 'light_bg' | 'dark_bg'; description: string } {
  const lower = `${productName} ${productDesc}`.toLowerCase();
  const hintsLightProduct =
    avgLuminance >= 0.56 ||
    /\b(branc[oa]|off[- ]?white|bege|creme|claro|marfim)\b/.test(lower);
  const hintsDarkProduct =
    avgLuminance < 0.45 ||
    /\b(verde|preto|escuro|marinho|botanico|inox)\b/.test(lower);

  const useDarkBg = hintsLightProduct && !hintsDarkProduct ? true : hintsLightProduct && avgLuminance >= 0.56;
  const list = useDarkBg ? LIGHT_PRODUCT_CONTRAST_GRADIENTS : DARK_PRODUCT_CONTRAST_GRADIENTS;
  const startIdx = Math.floor(rng() * list.length);
  const pickedDesc = list[(startIdx + variantIndex) % list.length];
  return useDarkBg
    ? { tone: 'dark_bg', description: pickedDesc }
    : { tone: 'light_bg', description: pickedDesc };
}

const STUDIO_ANGLES = [
  'ângulo frontal centralizado simétrico com ótima margem respirando nas bordas',
  'ângulo levemente em 3/4 destacando profundidade, corte e caimento/relevo',
  'enquadramento aproximado limpo valorizando costura, textura e acabamento do brasão/gravação',
];

/**
 * Builds dynamic, randomized Gemini Nano Banana 2.1 prompts for FURB individual/group photos
 * and clean high-contrast studio gradient product shots.
 */
export function buildDynamicProductShotPlans(params: {
  productName: string;
  productDescription: string;
  productCategory: string;
  avgLuminance: number;
  selectedShots: ProductAiShotType[];
  customNotes?: string;
  furbRefs?: readonly FurbReferenceAsset[];
  rng?: () => number;
}): ProductAiShotPlan[] {
  const {
    productName,
    productDescription,
    productCategory,
    avgLuminance,
    selectedShots,
    customNotes,
    furbRefs = getAvailableFurbReferences(),
    rng = Math.random,
  } = params;

  const campusShotsCount = selectedShots.filter((s) => s !== 'studio_gradient').length;
  const drawnRefs = pickRandomFurbReferences(furbRefs, campusShotsCount, rng);
  let campusCursor = 0;
  let studioCursor = 0;

  const extra = customNotes?.trim() ? ` Detalhe adicional prioritário: ${customNotes.trim()}.` : '';
  const productAnchor =
    `Fidelidade absoluta ao produto "${productName || productCategory}" mostrado na(s) foto(s) de referência do produto: ` +
    'preserve exatamente as cores reais, tecido/material, modelagem, logotipo, bordado, estampa ou gravação sem inventar alterações na peça. ' +
    (productDescription ? `Contexto do item: ${productDescription.slice(0, 220)}.` : '');

  return selectedShots.map((shotType, idx) => {
    if (shotType === 'furb_individual') {
      const refAsset = drawnRefs[campusCursor++];
      const person = sampleRandomPersonDescription(rng);
      const envDirective = refAsset
        ? `Ambientado fielmente no local da foto de referência do campus FURB fornecida ("${refAsset.label}"), mantendo a arquitetura, piso, vegetação e iluminação natural desse ambiente.`
        : `Ambientado em ${pick(FURB_FALLBACK_ENVIRONMENTS, rng)}.`;

      return {
        id: `shot-${idx + 1}-individual`,
        shotType,
        label: refAsset ? `Individual na FURB (${refAsset.label})` : 'Individual na FURB',
        aspectRatio: '1:1',
        referenceAsset: refAsset,
        referenceLabel: refAsset?.label,
        prompt: [
          'Fotografia editorial realista de catálogo acadêmico (35mm, foco natural no sujeito, cores autênticas, zero texto ou marca d’água).',
          productAnchor,
          `Sujeito principal em plano americano / meio corpo: ${person}, vestindo ou portando o produto com total visibilidade frontal.`,
          envDirective,
          extra,
        ]
          .filter(Boolean)
          .join(' '),
      };
    }

    if (shotType === 'furb_group') {
      const refAsset = drawnRefs[campusCursor++];
      const groupSize = rng() >= 0.45 ? 3 : 2;
      const people = Array.from({ length: groupSize }, (_, pIdx) => `Pessoa ${pIdx + 1}: ${sampleRandomPersonDescription(rng)}`).join('; ');
      const envDirective = refAsset
        ? `Ambientado fielmente no cenário da foto de referência do campus FURB fornecida ("${refAsset.label}"), preservando a ambientação, luz e estrutura do local.`
        : `Ambientado em ${pick(FURB_FALLBACK_ENVIRONMENTS, rng)}.`;

      return {
        id: `shot-${idx + 1}-grupo`,
        shotType,
        label: refAsset ? `Grupo na FURB (${refAsset.label})` : 'Grupo na FURB',
        aspectRatio: '1:1',
        referenceAsset: refAsset,
        referenceLabel: refAsset?.label,
        prompt: [
          'Fotografia editorial realista espontânea de grupo universitário (câmera full-frame, profundidade de campo natural, iluminação diurna autêntica, zero texto ou bordas).',
          productAnchor,
          `Cena em grupo com ${groupSize} estudantes de medicina interagindo naturalmente lado a lado (${people}). Todos ou o membro em primeiro plano utilizam o produto em destaque claro.`,
          envDirective,
          extra,
        ]
          .filter(Boolean)
          .join(' '),
      };
    }

    const studioVariant = studioCursor++;
    const gradientSpec = chooseHighContrastStudioGradient(
      avgLuminance,
      productName,
      productDescription,
      rng,
      studioVariant,
    );
    const angleDirective = STUDIO_ANGLES[studioVariant % STUDIO_ANGLES.length];
    return {
      id: `shot-${idx + 1}-studio`,
      shotType: 'studio_gradient',
      label: 'Produto isolado',
      aspectRatio: '1:1',
      prompt: [
        'Fotografia de estúdio comercial minimalista de alta definição centrada EXCLUSIVAMENTE no produto isolado (sem pessoas, sem texto, sem rótulos, sem objetos extras).',
        productAnchor,
        `Composição em ${angleDirective}.`,
        `Fundo simples e limpo utilizando ${gradientSpec.description}.`,
        'Iluminação de estúdio suave difusa destacando textura do tecido/aço, costura/bordado e contorno perfeito com sombra de contato sutil na base.',
        extra,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
}

function loadBrowserImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível ler o arquivo de imagem selecionado.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Falha ao ler arquivo local.'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo local.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an uploaded File or local asset URL to a clean JPEG base64 payload (`<= maxEdge`),
 * also measuring central brightness luminance (`0..1`) for automatic contrast background pairing.
 */
export async function compressImageToInlinePayload(
  source: File | string,
  maxEdge = 1024,
): Promise<CompressedUploadAsset> {
  const srcUrl = typeof source === 'string' ? source : await readFileAsDataUrl(source);
  const img = await loadBrowserImage(srcUrl);

  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const targetW = Math.max(1, Math.round((img.naturalWidth || maxEdge) * scale));
  const targetH = Math.max(1, Math.round((img.naturalHeight || maxEdge) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível no navegador.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Sample central 50% patch to estimate product luminance reliably
  const sx = Math.floor(targetW * 0.25);
  const sy = Math.floor(targetH * 0.25);
  const sw = Math.max(1, Math.floor(targetW * 0.5));
  const sh = Math.max(1, Math.floor(targetH * 0.5));
  const { data: pixels } = ctx.getImageData(sx, sy, sw, sh);
  let lumSum = 0;
  const step = 4 * 8;
  let samples = 0;
  for (let i = 0; i < pixels.length; i += step) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;
    lumSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    samples += 1;
  }
  const avgLuminance = samples > 0 ? lumSum / samples : 0.4;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
  const base64 = dataUrl.split(',')[1] || '';

  return {
    mimeType: 'image/jpeg',
    data: base64,
    dataUrl,
    avgLuminance,
  };
}

/**
 * Calls the admin-authenticated backend endpoint using `gemini-nano-banana-2.1`
 * to synthesize product photography conditioned on product photos + drawn FURB campus references.
 */
export async function requestNanoBananaProductImages(params: {
  productImages?: InlineImagePayload[];
  productImageUrls?: string[];
  plans: ProductAiShotPlan[];
}): Promise<{ model: string; images: GeneratedProductAiImageResult[] }> {
  const uniqueUrls = Array.from(
    new Set(
      params.plans
        .map((p) => p.referenceAsset?.url)
        .filter((u): u is string => Boolean(u)),
    ),
  );

  const compressedRefsByUrl = new Map<string, InlineImagePayload>();
  await Promise.all(
    uniqueUrls.map(async (url) => {
      const asset = await compressImageToInlinePayload(url, 960);
      compressedRefsByUrl.set(url, { mimeType: asset.mimeType, data: asset.data });
    }),
  );

  const shots = params.plans.map((plan) => ({
    id: plan.id,
    shotType: plan.shotType,
    label: plan.label,
    prompt: plan.prompt,
    aspectRatio: plan.aspectRatio,
    referenceLabel: plan.referenceLabel,
    referenceImage: plan.referenceAsset ? compressedRefsByUrl.get(plan.referenceAsset.url) : undefined,
  }));

  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/shop/generate-images`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productImages: params.productImages,
      productImageUrls: params.productImageUrls,
      shots,
    }),
  });

  if (!res.ok) {
    const errPayload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errPayload.error || `Erro HTTP ${res.status} ao gerar imagens com gemini-nano-banana-2.1.`);
  }

  return (await res.json()) as { model: string; images: GeneratedProductAiImageResult[] };
}

/**
 * Generates an engaging PT-BR catalog description for a CAMBLU shop item
 * using the backend `gemini-flash-lite-latest` endpoint.
 */
export async function requestProductDescriptionWithGemini(params: {
  name: string;
  category?: string;
  sizes?: Array<{ size: string; stock?: number }>;
  details?: string[];
  currentDescription?: string;
  productImages?: InlineImagePayload[];
  productImageUrls?: string[];
}): Promise<{ description: string; model: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/shop/generate-description`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errPayload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errPayload.error || `Erro HTTP ${res.status} ao gerar descrição com gemini-flash-lite-latest.`);
  }

  return (await res.json()) as { description: string; model: string };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Persists a `data:` gallery image into Firebase Storage (`public/products/<productId>/...`)
 * when Firebase is configured, keeping Firestore documents fast and small.
 */
export async function persistProductGalleryImage(
  urlOrDataUrl: string,
  productKey: string,
  index: number,
): Promise<string> {
  const trimmed = urlOrDataUrl.trim();
  if (!trimmed || !trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  if (!isFirebaseConfigured || !storage) {
    return trimmed;
  }

  const blob = dataUrlToBlob(trimmed);
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
  const safeKey = productKey.replace(/[^a-zA-Z0-9_-]/g, '') || 'item';
  const path = `public/products/${safeKey}/${Date.now()}-${index}.${ext}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, blob, {
    contentType: blob.type || 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(fileRef);
}
