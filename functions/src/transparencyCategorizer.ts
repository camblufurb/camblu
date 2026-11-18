export const GEMINI_CATEGORIZER_MODEL = 'gemini-flash-lite-latest';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_BATCH_SIZE = 150;
const MAX_CATEGORY_LENGTH = 36;

export type TransparencyEntryDirection = 'receita' | 'despesa' | 'ativo' | 'passivo';

export interface CategorizableTransparencyEntry {
  id: string;
  sheet: string;
  date: string;
  type: TransparencyEntryDirection;
  description: string;
  amountCents: number;
  category?: string;
}

export interface GeminiCategorizationResult {
  model: string;
  categories: string[];
  assignments: Record<string, string>;
}

interface GeminiStructuredPayload {
  categories?: string[];
  assignments?: Array<{ id?: string; category?: string }>;
}

function foldKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Sanitizes a category label returned by the LLM or user input into a concise single-line title.
 */
export function normalizeCategoryLabel(raw: unknown): string {
  const cleaned = String(raw ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .replace(/^["'`-]+|["'`-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  if (cleaned.length <= MAX_CATEGORY_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_CATEGORY_LENGTH).trim();
}

function fallbackCategoryForEntry(entry: CategorizableTransparencyEntry): string {
  const text = foldKey(`${entry.description} ${entry.category || ''}`);
  if (text.includes('patrocin')) return 'Patrocínios';
  if (text.includes('lojinha') || text.includes('camiseta') || text.includes('moletom') || text.includes('garrafinh')) {
    return 'Lojinha & Produtos';
  }
  if (text.includes('clube')) return 'Clube CAMBLU';
  if (text.includes('filantrop') || text.includes('doacao') || text.includes('doacoes')) return 'Filantropia';
  if (
    text.includes('sala') ||
    text.includes('convivencia') ||
    text.includes('coworking') ||
    text.includes('reforma') ||
    text.includes('piso') ||
    text.includes('microondas') ||
    text.includes('impressora') ||
    text.includes('tonner')
  ) {
    return 'Espaços & Patrimônio';
  }
  if (
    text.includes('coffee') ||
    text.includes('janta') ||
    text.includes('cuca') ||
    text.includes('bombom') ||
    text.includes('suco') ||
    text.includes('cafe')
  ) {
    return 'Alimentação & Coffee';
  }
  if (
    text.includes('secimed') ||
    text.includes('cheers') ||
    text.includes('ingresso') ||
    text.includes('carnamed') ||
    text.includes('recepcao') ||
    text.includes('epaf') ||
    text.includes('evento') ||
    text.includes('backdrop')
  ) {
    return 'Eventos & Projetos';
  }
  return 'Administrativo & Financeiro';
}

function registerCanonicalCategory(
  canonicalByKey: Map<string, string>,
  rawLabel: unknown,
): string {
  const label = normalizeCategoryLabel(rawLabel);
  if (!label) return '';
  const key = foldKey(label);
  const existing = canonicalByKey.get(key);
  if (existing) return existing;
  canonicalByKey.set(key, label);
  return label;
}

function buildPrompt(
  batch: CategorizableTransparencyEntry[],
  lockedCategories: string[],
): string {
  const compactItems = batch.map((e) => ({
    id: e.id,
    aba: e.sheet,
    tipo: e.type,
    valor: Number((Math.abs(e.amountCents || 0) / 100).toFixed(2)),
    descricao: e.description,
  }));

  const taxonomyConstraint =
    lockedCategories.length > 0
      ? `USE EXCLUSIVAMENTE uma destas categorias já definidas (reaproveite-as ao máximo; só crie uma nova se for estritamente impossível encaixar): ${JSON.stringify(lockedCategories)}.`
      : `Crie a MENOR quantidade possível de categorias globais (objetivo: 5 a 8 categorias no máximo cobrindo TODOS os itens).`;

  return [
    'Você é o analista contábil do CAMBLU (Centro Acadêmico de Medicina da FURB).',
    'Sua tarefa é categorizar TODOS os lançamentos financeiros (entradas e saídas) abaixo em categorias limpas, curtas e padronizadas em português para alimentar os gráficos de barras e pizza do portal de transparência.',
    taxonomyConstraint,
    'Regras obrigatórias:',
    '1. Minimize ao máximo o número total de categorias: agrupe itens semelhantes na mesma categoria macro.',
    '2. Classifique pela natureza financeira real da descrição (ex.: Lojinha/camisetas/garrafinhas; Clube CAMBLU; Patrocínios; Eventos & Recepção; Alimentação & Coffee; Espaços & Patrimônio; Filantropia; Administrativo & Financeiro), sem criar uma única categoria genérica com o nome da aba (ex.: não coloque todos os itens diferentes da aba SECIMED juntos só como "SECIMED"; separe patrocínios, ingressos, alimentação/coffee e estrutura/materiais usando as mesmas categorias globais do restante da planilha).',
    '3. Compartilhe o mesmo nome de categoria entre entradas (receita) e saídas (despesa) da mesma frente (ex.: venda e compra de estoque ficam em "Lojinha & Produtos"), para manter o total de categorias mínimo.',
    '4. Nomes curtos (1 a 3 palavras, no máximo 32 caracteres, sem emojis). Evite "Geral" ou "Outros".',
    '5. Retorne exatamente um assignment { "id", "category" } para CADA id enviado, preservando os IDs exatos.',
    '',
    `Lançamentos (${compactItems.length}):`,
    JSON.stringify(compactItems),
  ].join('\n');
}

function parseGeminiJsonPayload(text: string): GeminiStructuredPayload {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(trimmed) as GeminiStructuredPayload;
}

/**
 * Categorizes transparency inflows and outflows using Gemini (`gemini-flash-lite-latest`)
 * into the smallest cohesive set of categories suitable for site and poster charts.
 */
export async function categorizeTransparencyEntriesWithGemini(
  entries: CategorizableTransparencyEntry[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<GeminiCategorizationResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  if (entries.length === 0) {
    return { model: GEMINI_CATEGORIZER_MODEL, categories: [], assignments: {} };
  }

  const canonicalByKey = new Map<string, string>();
  const assignments: Record<string, string> = {};
  const lockedCategories: string[] = [];

  for (let start = 0; start < entries.length; start += batchSize) {
    const batch = entries.slice(start, start + batchSize);
    const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(GEMINI_CATEGORIZER_MODEL)}:generateContent`;

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(batch, lockedCategories) }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              categories: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              assignments: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    category: { type: 'STRING' },
                  },
                  required: ['id', 'category'],
                },
              },
            },
            required: ['categories', 'assignments'],
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 240)}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();
    if (!rawText) {
      throw new Error('Resposta vazia do modelo gemini-flash-lite-latest.');
    }

    const parsed = parseGeminiJsonPayload(rawText);
    for (const declared of parsed.categories || []) {
      const canon = registerCanonicalCategory(canonicalByKey, declared);
      if (canon && !lockedCategories.includes(canon)) {
        lockedCategories.push(canon);
      }
    }

    for (const item of parsed.assignments || []) {
      const id = String(item.id || '').trim();
      if (!id) continue;
      const canon = registerCanonicalCategory(canonicalByKey, item.category);
      if (canon) {
        assignments[id] = canon;
        if (!lockedCategories.includes(canon)) {
          lockedCategories.push(canon);
        }
      }
    }
  }

  for (const entry of entries) {
    if (!assignments[entry.id]) {
      const fallback = registerCanonicalCategory(canonicalByKey, fallbackCategoryForEntry(entry));
      assignments[entry.id] = fallback || 'Administrativo & Financeiro';
    }
  }

  const usedCategories = Array.from(new Set(Object.values(assignments))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );

  return {
    model: GEMINI_CATEGORIZER_MODEL,
    categories: usedCategories,
    assignments,
  };
}
