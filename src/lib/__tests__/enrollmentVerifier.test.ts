import { describe, expect, it } from 'vitest';
import {
  GEMINI_ENROLLMENT_MODEL,
  isEnrollmentVerifiedActive,
  resolveSemesterWindow,
  verifyEnrollmentSummaryWithFlashLite,
} from '../../../functions/src/enrollmentVerifier';

describe('enrollmentVerifier (gemini-flash-lite-latest)', () => {
  it('computes semester deadline as last day of the last month of the semester in BRT', () => {
    const firstSem = resolveSemesterWindow(Date.parse('2026-03-15T15:00:00.000Z'));
    expect(firstSem.semester).toBe(1);
    expect(firstSem.semesterLabel).toBe('2026/1');
    expect(firstSem.validUntilIso).toBe(new Date('2026-06-30T23:59:59.999-03:00').toISOString());

    const secondSem = resolveSemesterWindow(Date.parse('2026-11-27T21:00:00.000Z'));
    expect(secondSem.semester).toBe(2);
    expect(secondSem.semesterLabel).toBe('2026/2');
    expect(secondSem.validUntilIso).toBe(new Date('2026-12-31T23:59:59.999-03:00').toISOString());
  });

  it('calls gemini-flash-lite-latest with inline PDF and approves active FURB Medicina enrollment', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const mockFetch: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : String(input);
      const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
      calls.push({ url, body });
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isFurb: true,
                      isMedicine: true,
                      isCurrentSemester: true,
                      detectedSemester: '2026/2',
                      reason: 'Matrícula ativa confirmada em Medicina na FURB para 2026/2.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const nowMs = Date.parse('2026-11-27T18:00:00.000Z');
    const result = await verifyEnrollmentSummaryWithFlashLite({
      pdfBase64: 'JVBERi0xLjQK',
      studentName: 'Marina Souza',
      nowMs,
      apiKey: 'test-gemini-key',
      fetchImpl: mockFetch,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain(`${GEMINI_ENROLLMENT_MODEL}:generateContent`);
    expect(result.verified).toBe(true);
    expect(result.semester).toBe('2026/2');
    expect(result.validUntil).toBe(new Date('2026-12-31T23:59:59.999-03:00').toISOString());
    expect(result.model).toBe(GEMINI_ENROLLMENT_MODEL);
  });

  it('rejects enrollment when course is not Medicina or semester does not match', async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isFurb: true,
                      isMedicine: false,
                      isCurrentSemester: true,
                      detectedSemester: '2026/2',
                      reason: 'Documento refere-se ao curso de Direito, não Medicina.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const result = await verifyEnrollmentSummaryWithFlashLite({
      pdfBase64: 'JVBERi0xLjQK',
      nowMs: Date.parse('2026-11-27T18:00:00.000Z'),
      apiKey: 'test-gemini-key',
      fetchImpl: mockFetch,
    });

    expect(result.verified).toBe(false);
    expect(result.validUntil).toBeNull();
    expect(result.reason).toContain('Direito');
  });

  it('validates active window and expires after last day of semester', () => {
    const until = new Date('2026-12-31T23:59:59.999-03:00').toISOString();
    const record = {
      affiliation: 'FURB',
      enrollmentSummaryUrl: 'https://firebasestorage.googleapis.com/v0/b/camblu.firebasestorage.app/o/resumo.pdf',
      enrollmentVerified: true,
      enrollmentVerifiedUntil: until,
    };
    expect(isEnrollmentVerifiedActive(record, Date.parse('2026-12-31T12:00:00.000-03:00'))).toBe(true);
    expect(isEnrollmentVerifiedActive(record, Date.parse('2027-01-01T00:00:00.000-03:00'))).toBe(false);
  });
});
