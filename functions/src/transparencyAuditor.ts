import {
  normalizeCategoryLabel,
  type CategorizableTransparencyEntry,
  type TransparencyEntryDirection,
} from './transparencyCategorizer.js';

export const AUDIT_FLASH_LITE_MODEL = 'gemini-flash-lite-latest';
export const FIXER_FLASH_MODEL = 'gemini-flash-latest';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface MonthCalculationSnapshot {
  totalInCents: number;
  totalOutCents: number;
  netResultCents: number;
  ativoCents: number;
  passivoCents: number;
  entriesCount: number;
}

export interface MonthAuditInput {
  monthSheet: string;
  entries: CategorizableTransparencyEntry[];
  overviewCsv?: string;
  monthCsv?: string;
}

export interface FlashLiteAuditReport {
  isAccurate: boolean;
  severity: 'ok' | 'warning' | 'error';
  summary: string;
  discrepancies: string[];
}

export interface MonthFixProposal {
  errorLocation: string;
  explanation: string;
  proposedSolution: string;
  dataSourceChanges: string[];
  formulaChanges: {
    inflowsFormula: string;
    outflowsFormula: string;
    netResultFormula: string;
    notes: string;
  };
  proposedEntries: CategorizableTransparencyEntry[];
  proposedTotals: {
    totalInCents: number;
    totalOutCents: number;
    netResultCents: number;
  };
}

export interface MonthAuditResponse {
  status: 'ok' | 'discrepancy_found';
  monthSheet: string;
  auditModel: string;
  fixerModel: string | null;
  checkedAt: string;
  currentSnapshot: MonthCalculationSnapshot;
  audit: FlashLiteAuditReport;
  proposal: MonthFixProposal | null;
}

function parseJsonResponse<T>(rawText: string): T {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function callGeminiStructuredJson<T>(params: {
  model: string;
  apiKey: string;
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  fetchImpl?: typeof fetch;
}): Promise<T> {
  const {
    model,
    apiKey,
    prompt,
    schema,
    temperature = 0,
    fetchImpl = fetch,
  } = params;

  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }

  const endpoint = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini (${model}) HTTP ${response.status}: ${errText.slice(0, 240)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error(`Resposta vazia do modelo ${model}.`);
  }

  return parseJsonResponse<T>(text);
}

/**
 * Computes deterministic inflow, outflow, net result, and asset/liability totals in cents.
 */
export function computeMonthSnapshot(
  entries: ReadonlyArray<Pick<CategorizableTransparencyEntry, 'type' | 'amountCents'>>,
): MonthCalculationSnapshot {
  let totalInCents = 0;
  let totalOutCents = 0;
  let ativoCents = 0;
  let passivoCents = 0;

  for (const e of entries) {
    const val = Math.abs(Math.round(Number(e.amountCents) || 0));
    if (e.type === 'receita') totalInCents += val;
    else if (e.type === 'despesa') totalOutCents += val;
    else if (e.type === 'ativo') ativoCents += val;
    else if (e.type === 'passivo') passivoCents += val;
  }

  return {
    totalInCents,
    totalOutCents,
    netResultCents: totalInCents - totalOutCents,
    ativoCents,
    passivoCents,
    entriesCount: entries.length,
  };
}

function buildCompactImportedView(entries: CategorizableTransparencyEntry[]) {
  return entries.map((e) => ({
    id: e.id,
    data: e.date,
    tipo: e.type,
    categoria: e.category || '',
    descricao: e.description,
    valorReais: Number(((Math.abs(e.amountCents) || 0) / 100).toFixed(2)),
    valorCents: Math.abs(e.amountCents) || 0,
  }));
}

function formatCentsReais(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return `${sign}R$ ${(Math.abs(cents) / 100).toFixed(2).replace('.', ',')}`;
}

/**
 * Stage 1: Uses `gemini-flash-lite-latest` to audit whether imported entries and chart formulas
 * match the raw Google Sheet tab and `overview` summary without double counting or misclassifications.
 */
export async function auditMonthWithFlashLite(
  input: MonthAuditInput,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ snapshot: MonthCalculationSnapshot; report: FlashLiteAuditReport }> {
  const snapshot = computeMonthSnapshot(input.entries);
  const compactEntries = buildCompactImportedView(input.entries);

  const prompt = [
    'Você é o auditor financeiro automatizado do CAMBLU (Medicina FURB).',
    `Audite a aba/mês "${input.monthSheet}" comparando os dados brutos da planilha Google Sheets com os lançamentos e cálculos atualmente importados pelo sistema para gerar as imagens da transparência.`,
    '',
    'Cálculos atuais do sistema para este período:',
    `- Entradas (soma de type="receita"): ${formatCentsReais(snapshot.totalInCents)} (${snapshot.totalInCents} cents)`,
    `- Saídas (soma de type="despesa"): ${formatCentsReais(snapshot.totalOutCents)} (${snapshot.totalOutCents} cents)`,
    `- Resultado do Mês (Entradas - Saídas): ${formatCentsReais(snapshot.netResultCents)}`,
    `- Ativos/Transferências excluídos dos gráficos de entradas/saídas: ${formatCentsReais(snapshot.ativoCents)}`,
    `- Passivos excluídos: ${formatCentsReais(snapshot.passivoCents)}`,
    `- Quantidade de lançamentos importados no mês: ${snapshot.entriesCount}`,
    '',
    'Lançamentos atualmente importados:',
    JSON.stringify(compactEntries),
    '',
    input.overviewCsv ? `CSV bruto da aba overview:\n${input.overviewCsv.slice(0, 6000)}\n` : 'CSV da aba overview indisponível.\n',
    input.monthCsv ? `CSV bruto da aba "${input.monthSheet}":\n${input.monthCsv.slice(0, 12000)}\n` : `CSV bruto da aba "${input.monthSheet}" indisponível.\n`,
    'Verifique rigorosamente:',
    '1. Se a soma de Entradas e Saídas importadas bate com a aba overview (quando houver linha correspondente) e com as linhas reais da aba.',
    '2. Se existe dupla contagem (ex.: uma linha resumo como "Patrocínios R$ 13.500" somada junto com a tabela detalhada dos patrocinadores individuais que também somam R$ 13.500).',
    '3. Se linhas de saldo herdado ("Herança da gestão anterior"), repasse interno ou "transferência" (ex.: Cotas Viacredi) estão classificadas no tipo errado inflando entradas ou saídas operacionais do mês.',
    '4. Se alguma linha financeira válida da aba foi ignorada ou importada com tipo/valor errado.',
    'Responda isAccurate=true APENAS se não houver divergências relevantes de cálculo ou importação; caso contrário, isAccurate=false e liste cada divergência encontrada em português.',
  ].join('\n');

  const schema = {
    type: 'OBJECT',
    properties: {
      isAccurate: { type: 'BOOLEAN' },
      severity: { type: 'STRING', enum: ['ok', 'warning', 'error'] },
      summary: { type: 'STRING' },
      discrepancies: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['isAccurate', 'severity', 'summary', 'discrepancies'],
  };

  const raw = await callGeminiStructuredJson<FlashLiteAuditReport>({
    model: AUDIT_FLASH_LITE_MODEL,
    apiKey,
    prompt,
    schema,
    temperature: 0,
    fetchImpl,
  });

  const discrepancies = (raw.discrepancies || []).map((d) => String(d).trim()).filter(Boolean);
  const isAccurate = Boolean(raw.isAccurate) && discrepancies.length === 0;

  return {
    snapshot,
    report: {
      isAccurate,
      severity: isAccurate ? 'ok' : raw.severity === 'warning' ? 'warning' : 'error',
      summary: String(raw.summary || (isAccurate ? 'Importação e cálculos validados sem divergências.' : 'Divergência detectada nos cálculos do mês.')).trim(),
      discrepancies,
    },
  };
}

/**
 * Stage 2: Uses `gemini-flash-latest` to inspect discrepancies found in Stage 1,
 * explain where the error lives in the data sources or formulas, and propose fixed entries + formulas.
 */
export async function proposeMonthFixWithFlashLatest(
  input: MonthAuditInput,
  snapshot: MonthCalculationSnapshot,
  audit: FlashLiteAuditReport,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<MonthFixProposal> {
  const compactEntries = buildCompactImportedView(input.entries);
  const existingCategories = Array.from(
    new Set(input.entries.map((e) => normalizeCategoryLabel(e.category)).filter(Boolean)),
  );

  const prompt = [
    'Você é o engenheiro financeiro sênior responsável pela Transparência do CAMBLU (Medicina FURB).',
    `A auditoria inicial (gemini-flash-lite-latest) identificou divergências na aba "${input.monthSheet}":`,
    `Resumo da auditoria: ${audit.summary}`,
    `Divergências detectadas: ${JSON.stringify(audit.discrepancies)}`,
    '',
    'Cálculos atuais do sistema (com problema):',
    `- Entradas atuais: ${formatCentsReais(snapshot.totalInCents)}`,
    `- Saídas atuais: ${formatCentsReais(snapshot.totalOutCents)}`,
    `- Resultado atual: ${formatCentsReais(snapshot.netResultCents)}`,
    '',
    'Lançamentos atualmente importados no sistema:',
    JSON.stringify(compactEntries),
    '',
    existingCategories.length > 0
      ? `Categorias já padronizadas no portal (reutilize-as sempre que possível para manter o menor número possível de categorias): ${JSON.stringify(existingCategories)}`
      : '',
    input.overviewCsv ? `CSV bruto da aba overview:\n${input.overviewCsv.slice(0, 6000)}\n` : '',
    input.monthCsv ? `CSV bruto da aba "${input.monthSheet}":\n${input.monthCsv.slice(0, 12000)}\n` : '',
    'Sua missão:',
    '1. Explicar com clareza onde exatamente está o erro (na fonte de dados da planilha, no parser/importação ou na fórmula aplicada) em `errorLocation` e `explanation`.',
    '2. Descrever a solução proposta em `proposedSolution`, `dataSourceChanges` e `formulaChanges` (`inflowsFormula`, `outflowsFormula`, `netResultFormula`, `notes`).',
    '3. Gerar `proposedEntries` com a lista FINAL corrigida dos lançamentos deste mês (mantendo os IDs existentes sempre que o lançamento continuar existindo, reclassificando `type` para `ativo` quando for herança de caixa/transferência/cotas que não deve distorcer entradas/saídas operacionais, removendo linhas de subtotal/resumo duplicadas caso a tabela detalhada já exista na mesma aba, ou corrigindo valores/tipos/faltantes para que `sum(receita)` e `sum(despesa)` batam exatamente com os números reais da planilha/overview!).',
    '4. Use nomes de categoria concisos e unificados em português.',
    '5. Todos os `amountCents` devem ser inteiros positivos em centavos.',
  ]
    .filter(Boolean)
    .join('\n');

  const schema = {
    type: 'OBJECT',
    properties: {
      errorLocation: { type: 'STRING' },
      explanation: { type: 'STRING' },
      proposedSolution: { type: 'STRING' },
      dataSourceChanges: { type: 'ARRAY', items: { type: 'STRING' } },
      formulaChanges: {
        type: 'OBJECT',
        properties: {
          inflowsFormula: { type: 'STRING' },
          outflowsFormula: { type: 'STRING' },
          netResultFormula: { type: 'STRING' },
          notes: { type: 'STRING' },
        },
        required: ['inflowsFormula', 'outflowsFormula', 'netResultFormula', 'notes'],
      },
      proposedEntries: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING' },
            date: { type: 'STRING' },
            type: { type: 'STRING', enum: ['receita', 'despesa', 'ativo', 'passivo'] },
            category: { type: 'STRING' },
            description: { type: 'STRING' },
            amountCents: { type: 'INTEGER' },
          },
          required: ['id', 'date', 'type', 'category', 'description', 'amountCents'],
        },
      },
    },
    required: [
      'errorLocation',
      'explanation',
      'proposedSolution',
      'dataSourceChanges',
      'formulaChanges',
      'proposedEntries',
    ],
  };

  const raw = await callGeminiStructuredJson<{
    errorLocation: string;
    explanation: string;
    proposedSolution: string;
    dataSourceChanges: string[];
    formulaChanges: MonthFixProposal['formulaChanges'];
    proposedEntries: Array<{
      id: string;
      date: string;
      type: TransparencyEntryDirection;
      category: string;
      description: string;
      amountCents: number;
    }>;
  }>({
    model: FIXER_FLASH_MODEL,
    apiKey,
    prompt,
    schema,
    temperature: 0.1,
    fetchImpl,
  });

  const normalizedEntries: CategorizableTransparencyEntry[] = (raw.proposedEntries || [])
    .filter((item) => item && item.description && Number(item.amountCents) > 0)
    .map((item, idx) => {
      const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || '').trim())
        ? String(item.date).trim()
        : input.entries[0]?.date || '2026-01-01';
      const safeType: TransparencyEntryDirection =
        item.type === 'receita' || item.type === 'despesa' || item.type === 'ativo' || item.type === 'passivo'
          ? item.type
          : 'despesa';
      const cleanId = String(item.id || '')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 90);
      return {
        id: cleanId || `gs-fix-${input.monthSheet.toLowerCase().replace(/[^a-z0-9]/g, '')}-${idx + 1}`,
        sheet: input.monthSheet,
        date: safeDate,
        type: safeType,
        category: normalizeCategoryLabel(item.category) || 'Administrativo & Financeiro',
        description: String(item.description).replace(/[\r\n]+/g, ' ').trim().slice(0, 240),
        amountCents: Math.abs(Math.round(Number(item.amountCents) || 0)),
      };
    });

  const fixedSnapshot = computeMonthSnapshot(normalizedEntries);

  return {
    errorLocation: String(raw.errorLocation || 'Importação e classificação de lançamentos').trim(),
    explanation: String(raw.explanation || audit.summary).trim(),
    proposedSolution: String(raw.proposedSolution || 'Ajustar classificação e fontes conforme a planilha.').trim(),
    dataSourceChanges: (raw.dataSourceChanges || []).map((s) => String(s).trim()).filter(Boolean),
    formulaChanges: {
      inflowsFormula: String(raw.formulaChanges?.inflowsFormula || 'Soma de receitas operacionais do mês'),
      outflowsFormula: String(raw.formulaChanges?.outflowsFormula || 'Soma de despesas operacionais do mês'),
      netResultFormula: String(raw.formulaChanges?.netResultFormula || 'Entradas - Saídas'),
      notes: String(raw.formulaChanges?.notes || ''),
    },
    proposedEntries: normalizedEntries,
    proposedTotals: {
      totalInCents: fixedSnapshot.totalInCents,
      totalOutCents: fixedSnapshot.totalOutCents,
      netResultCents: fixedSnapshot.netResultCents,
    },
  };
}

/**
 * Full two-stage transparency verification workflow:
 * 1) `gemini-flash-lite-latest` validates import & math accuracy for the target month.
 * 2) When a discrepancy exists, `gemini-flash-latest` diagnoses the root cause and proposes
 *    explicit entry/formula fixes for administrator approval in `/back`.
 */
export async function runTransparencyMonthAudit(
  input: MonthAuditInput,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<MonthAuditResponse> {
  const { snapshot, report } = await auditMonthWithFlashLite(input, apiKey, fetchImpl);

  let proposal: MonthFixProposal | null = null;
  let fixerModel: string | null = null;

  if (!report.isAccurate) {
    proposal = await proposeMonthFixWithFlashLatest(input, snapshot, report, apiKey, fetchImpl);
    fixerModel = FIXER_FLASH_MODEL;
  }

  return {
    status: report.isAccurate ? 'ok' : 'discrepancy_found',
    monthSheet: input.monthSheet,
    auditModel: AUDIT_FLASH_LITE_MODEL,
    fixerModel,
    checkedAt: new Date().toISOString(),
    currentSnapshot: snapshot,
    audit: report,
    proposal,
  };
}
