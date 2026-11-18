import { describe, expect, it, vi } from 'vitest';
import {
  AUDIT_FLASH_LITE_MODEL,
  computeMonthSnapshot,
  FIXER_FLASH_MODEL,
  runTransparencyMonthAudit,
} from '../../../functions/src/transparencyAuditor';

describe('transparencyAuditor (flash-lite -> flash escalation)', () => {
  it('completes in Stage 1 with gemini-flash-lite-latest when calculations match', async () => {
    const urls: string[] = [];
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isAccurate: true,
                      severity: 'ok',
                      summary: 'Totais conferem com a aba overview.',
                      discrepancies: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const result = await runTransparencyMonthAudit(
      {
        monthSheet: 'Outubro',
        entries: [
          {
            id: 'e1',
            sheet: 'Outubro',
            date: '2026-10-10',
            type: 'receita',
            category: 'Lojinha & Produtos',
            description: 'Lojinha',
            amountCents: 55050,
          },
        ],
      },
      'test-key',
      mockFetch,
    );

    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain(`${AUDIT_FLASH_LITE_MODEL}:generateContent`);
    expect(result.status).toBe('ok');
    expect(result.auditModel).toBe(AUDIT_FLASH_LITE_MODEL);
    expect(result.fixerModel).toBeNull();
    expect(result.proposal).toBeNull();
  });

  it('escalates to gemini-flash-latest when Stage 1 detects a calculation mismatch and produces an approval proposal', async () => {
    const urls: string[] = [];
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);

      if (urls.length === 1) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        isAccurate: false,
                        severity: 'error',
                        summary: 'Herança da gestão anterior está somada nas entradas operacionais.',
                        discrepancies: ['Dezembro tem R$ 99,00 na aba overview, mas sistema soma R$ 7.348,24.'],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      errorLocation: 'Classificação do item Herança da gestão anterior na aba Dezembro',
                      explanation: 'O saldo herdado de R$ 7.249,24 foi importado como receita operacional do mês.',
                      proposedSolution: 'Reclassificar a herança para ativo e manter apenas R$ 99,00 em Entradas.',
                      dataSourceChanges: ['Tratar linhas com descrição "Herança da gestão anterior" como ativo.'],
                      formulaChanges: {
                        inflowsFormula: 'Soma apenas de type="receita" do período',
                        outflowsFormula: 'Soma apenas de type="despesa" do período',
                        netResultFormula: 'Entradas - Saídas',
                        notes: 'Saldo herdado preservado fora do resultado mensal.',
                      },
                      proposedEntries: [
                        {
                          id: 'tr-32',
                          date: '2025-12-15',
                          type: 'ativo',
                          category: 'Administrativo & Financeiro',
                          description: 'Herança da gestão anterior',
                          amountCents: 724924,
                        },
                        {
                          id: 'tr-34',
                          date: '2025-12-30',
                          type: 'receita',
                          category: 'Lojinha & Produtos',
                          description: 'Lojinha',
                          amountCents: 9900,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const result = await runTransparencyMonthAudit(
      {
        monthSheet: 'Dezembro',
        entries: [
          {
            id: 'tr-32',
            sheet: 'Dezembro',
            date: '2025-12-15',
            type: 'receita',
            category: 'Geral',
            description: 'Herança da gestão anterior',
            amountCents: 724924,
          },
          {
            id: 'tr-34',
            sheet: 'Dezembro',
            date: '2025-12-30',
            type: 'receita',
            category: 'Lojinha & Produtos',
            description: 'Lojinha',
            amountCents: 9900,
          },
        ],
      },
      'test-key',
      mockFetch,
    );

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain(`${AUDIT_FLASH_LITE_MODEL}:generateContent`);
    expect(urls[1]).toContain(`${FIXER_FLASH_MODEL}:generateContent`);
    expect(result.status).toBe('discrepancy_found');
    expect(result.fixerModel).toBe(FIXER_FLASH_MODEL);
    expect(result.proposal?.proposedTotals).toEqual({
      totalInCents: 9900,
      totalOutCents: 0,
      netResultCents: 9900,
    });
    expect(computeMonthSnapshot(result.proposal!.proposedEntries).ativoCents).toBe(724924);
  });
});
