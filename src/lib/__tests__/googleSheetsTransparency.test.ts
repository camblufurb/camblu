import { describe, expect, it } from 'vitest';
import {
  extractGoogleSheetId,
  parseBrDateToIso,
  parseBrlValueToCents,
  parseGoogleSheetTabs,
  parseOverviewCsv,
  parseSheetTransactionsCsv,
} from '../googleSheetsTransparency';
import { aggregateDirectionCategories, aggregateForPie } from '../transparencyPosterGenerator';
import type { TransparencyEntry } from '../../types/domain';

describe('googleSheetsTransparency parser', () => {
  it('extracts spreadsheet ID from standard Google Sheets URLs', () => {
    expect(
      extractGoogleSheetId(
        'https://docs.google.com/spreadsheets/d/19qvxJcjL53aXeStZgXk22HiEvTycHi_meJAl3etNsXQ/edit?usp=sharing',
      ),
    ).toBe('19qvxJcjL53aXeStZgXk22HiEvTycHi_meJAl3etNsXQ');
    expect(extractGoogleSheetId('https://example.com')).toBeNull();
  });

  it('parses Brazilian currency strings and dates cleanly', () => {
    expect(parseBrlValueToCents('"R$ 2.000,00"')).toBe(200000);
    expect(parseBrlValueToCents('4425,48')).toBe(442548);
    expect(parseBrlValueToCents('-256,71')).toBe(-25671);
    expect(parseBrDateToIso('15/12/2025')).toBe('2025-12-15');
    expect(parseBrDateToIso('2026-08-10')).toBe('2026-08-10');
  });

  it('parses overview balance, parallel SECIMED sponsors table, and monthly rows without category', () => {
    const overviewCsv = [
      'Saldo atual,"4425,48"',
      'Saldo projetado,"4425,48"',
      'x,Receitas,Despesas',
    ].join('\n');
    expect(parseOverviewCsv(overviewCsv)).toEqual({
      currentBalanceCents: 442548,
      projectedBalanceCents: 442548,
    });

    const secimedCsv = [
      ',,,,,Patrocínios,,,',
      'Data,Categoria,Descrição,Valor,,Data,Status,Descrição,Valor',
      '10/08/2026,despesa,Reembolso ,"R$ 44,00",,18/02/2026,receita,Unimed ,"R$ 2.000,00"',
    ].join('\n');
    const secimedEntries = parseSheetTransactionsCsv('SECIMED', secimedCsv);
    expect(secimedEntries).toHaveLength(2);
    expect(secimedEntries[0]).toMatchObject({
      sheet: 'SECIMED',
      type: 'despesa',
      category: 'SECIMED',
      amountCents: 4400,
    });
    expect(secimedEntries[1]).toMatchObject({
      sheet: 'SECIMED',
      type: 'receita',
      category: 'Patrocínios SECIMED',
      description: 'Unimed',
      amountCents: 200000,
    });

    const decCsv = [
      'Data,Categoria,Descrição,Valor',
      '15/12/2025,,Herança da gestão anterior ,"R$ 7.249,24"',
    ].join('\n');
    const decEntries = parseSheetTransactionsCsv('Dezembro', decCsv);
    expect(decEntries).toHaveLength(1);
    expect(decEntries[0].type).toBe('receita');
    expect(decEntries[0].amountCents).toBe(724924);
  });

  it('discovers tabs and gids from Google Sheets htmlview script snippet', () => {
    const sampleHtml = `
      items.push({name: "overview", pageUrl: "...", gid: "0"});
      items.push({name: "SECIMED", pageUrl: "...", gid: "2013397646"});
    `;
    expect(parseGoogleSheetTabs(sampleHtml)).toEqual([
      { name: 'overview', gid: '0' },
      { name: 'SECIMED', gid: '2013397646' },
    ]);
  });

  it('treats transferência as ativo and aggregates category slices cleanly for charts and posters', () => {
    const sepCsv = [
      'Data,Categoria,Descrição,Valor',
      '24/09/2026,transferência ,Cotas Viacredi ,"R$ 5.230,00"',
      '30/09/2026,receita,Lojinha no pix,"R$ 363,00"',
    ].join('\n');
    const parsed = parseSheetTransactionsCsv('Setembro', sepCsv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].type).toBe('ativo');
    expect(parsed[1].type).toBe('receita');

    const sampleEntries: TransparencyEntry[] = [
      { id: '1', sheet: 'Março', year: 2026, date: '2026-03-01', type: 'receita', category: 'Lojinha & Produtos', description: 'Venda 1', amountCents: 30000, createdAt: '' },
      { id: '2', sheet: 'Março', year: 2026, date: '2026-03-02', type: 'receita', category: 'Clube CAMBLU', description: 'Clube', amountCents: 10000, createdAt: '' },
      { id: '3', sheet: 'Março', year: 2026, date: '2026-03-03', type: 'despesa', category: 'Lojinha & Produtos', description: 'Estoque', amountCents: 40000, createdAt: '' },
      { id: '4', sheet: 'Março', year: 2026, date: '2026-03-04', type: 'despesa', category: 'Espaços & Patrimônio', description: 'Microondas', amountCents: 20000, createdAt: '' },
    ];

    const incomes = aggregateDirectionCategories(sampleEntries, 'receita');
    expect(incomes.map((s) => [s.label, s.cents, s.percent])).toEqual([
      ['Lojinha & Produtos', 30000, 75],
      ['Clube CAMBLU', 10000, 25],
    ]);

    const pie = aggregateForPie(sampleEntries.filter((e) => e.type === 'despesa'));
    expect(pie.map((s) => s.label)).toEqual(['Lojinha & Produtos', 'Espaços & Patrimônio']);
  });
});
