import { callGeminiGenerateContent, type GeminiAuthInput } from './geminiClient.js';

export const GEMINI_ENROLLMENT_MODEL = 'gemini-flash-lite-latest';

export interface SemesterWindow {
  year: number;
  semester: 1 | 2;
  semesterLabel: string;
  validUntilIso: string;
}

export interface EnrollmentVerificationResult {
  verified: boolean;
  isFurb: boolean;
  isMedicine: boolean;
  isCurrentSemester: boolean;
  semester: string;
  validUntil: string | null;
  reason: string;
  model: string;
}

/**
 * Computes the current Brazilian academic semester (1 or 2) in America/Sao_Paulo (UTC-3)
 * and the exact end-of-day ISO timestamp for the last day of the last month of that semester
 * (June 30 for semester 1; December 31 for semester 2).
 */
export function resolveSemesterWindow(nowMs = Date.now()): SemesterWindow {
  const brtOffsetMs = -3 * 60 * 60 * 1000;
  const brtDate = new Date(nowMs + brtOffsetMs);
  const year = brtDate.getUTCFullYear();
  const month = brtDate.getUTCMonth() + 1; // 1..12
  const semester: 1 | 2 = month <= 6 ? 1 : 2;
  const lastMonth = semester === 1 ? '06' : '12';
  const lastDay = semester === 1 ? '30' : '31';
  const validUntilIso = new Date(`${year}-${lastMonth}-${lastDay}T23:59:59.999-03:00`).toISOString();

  return {
    year,
    semester,
    semesterLabel: `${year}/${semester}`,
    validUntilIso,
  };
}

/**
 * Checks whether a user's Firestore record currently holds an active, non-expired
 * FURB Medicina enrollment verification for the semester.
 */
export function isEnrollmentVerifiedActive(
  userData: {
    affiliation?: string;
    enrollmentSummaryUrl?: string;
    enrollmentVerified?: boolean;
    enrollmentVerifiedUntil?: string | null;
  },
  nowMs = Date.now(),
): boolean {
  if (userData.affiliation === 'externo') return false;
  if (typeof userData.enrollmentSummaryUrl !== 'string' || !userData.enrollmentSummaryUrl.trim()) {
    return false;
  }
  if (userData.enrollmentVerified !== true) return false;
  if (!userData.enrollmentVerifiedUntil) return false;
  const untilMs = new Date(userData.enrollmentVerifiedUntil).getTime();
  return Number.isFinite(untilMs) && untilMs > nowMs;
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Verifies a student's enrollment summary PDF using `gemini-flash-lite-latest`.
 * Confirms enrollment in Medicina at FURB for the current academic semester.
 */
export async function verifyEnrollmentSummaryWithFlashLite(params: {
  pdfBase64: string;
  studentName?: string;
  studentCpf?: string;
  nowMs?: number;
  apiKey: GeminiAuthInput;
  fetchImpl?: typeof fetch;
}): Promise<EnrollmentVerificationResult> {
  const { pdfBase64, studentName, studentCpf, nowMs = Date.now(), apiKey, fetchImpl } = params;
  const windowInfo = resolveSemesterWindow(nowMs);

  const prompt = [
    'Você é um auditor acadêmico do Centro Acadêmico de Medicina de Blumenau (CAMBLU - FURB).',
    'Analise o PDF anexado (Resumo de Matrícula / Atestado de Matrícula) e verifique rigorosamente 3 critérios:',
    '1. Instituição: o documento deve ser oficialmente da FURB (Universidade Regional de Blumenau / Fundação Universidade Regional de Blumenau).',
    '2. Curso: o aluno deve estar matriculado no curso de Medicina.',
    `3. Semestre atual: o documento deve comprovar matrícula ativa/regular no semestre atual (${windowInfo.semesterLabel} — ${windowInfo.semester}º semestre de ${windowInfo.year}).`,
    studentName ? `Nome informado no perfil do aluno: "${studentName}".` : '',
    studentCpf ? `CPF informado no perfil (apenas referência): "${studentCpf}".` : '',
    '',
    'Responda EXCLUSIVAMENTE com um JSON válido no formato:',
    '{',
    '  "isFurb": boolean,',
    '  "isMedicine": boolean,',
    '  "isCurrentSemester": boolean,',
    '  "detectedSemester": string,',
    '  "reason": string',
    '}',
    'Em "reason", escreva uma frase curta e clara em português explicando o resultado da verificação.',
  ]
    .filter(Boolean)
    .join('\n');

  const { payload, resolvedModel } = await callGeminiGenerateContent({
    model: GEMINI_ENROLLMENT_MODEL,
    auth: apiKey,
    fetchImpl,
    body: {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
      },
    },
  });

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = extractJsonObject(text);
  if (!parsed) {
    throw new Error('Não foi possível interpretar o resultado da verificação automática do resumo de matrícula.');
  }

  const isFurb = Boolean(parsed.isFurb);
  const isMedicine = Boolean(parsed.isMedicine);
  const isCurrentSemester = Boolean(parsed.isCurrentSemester);
  const verified = isFurb && isMedicine && isCurrentSemester;

  const fallbackReason = verified
    ? `Matrícula em Medicina na FURB confirmada para o semestre ${windowInfo.semesterLabel}.`
    : [
        !isFurb ? 'instituição FURB não identificada' : '',
        !isMedicine ? 'curso de Medicina não identificado' : '',
        !isCurrentSemester ? `matrícula ativa no semestre ${windowInfo.semesterLabel} não confirmada` : '',
      ]
        .filter(Boolean)
        .join('; ') || 'O documento não comprova matrícula ativa em Medicina na FURB neste semestre.';

  const rawReason = typeof parsed.reason === 'string' && parsed.reason.trim() ? parsed.reason.trim() : fallbackReason;

  return {
    verified,
    isFurb,
    isMedicine,
    isCurrentSemester,
    semester: windowInfo.semesterLabel,
    validUntil: verified ? windowInfo.validUntilIso : null,
    reason: rawReason.slice(0, 280),
    model: resolvedModel,
  };
}
