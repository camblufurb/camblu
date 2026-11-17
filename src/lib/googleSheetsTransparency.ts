import type { TransparencyEntry, TransparencyType } from '../types/domain';

export interface ParsedSheetTab {
  name: string;
  gid: string;
}

export interface SheetSyncResult {
  spreadsheetId: string;
  entries: TransparencyEntry[];
  currentBalanceCents: number;
  projectedBalanceCents: number;
  savedCategories: string[];
  tabCount: number;
  lastSyncedAt: string;
}

interface ColumnGroup {
  dateCol: number;
  typeCol: number;
  descCol: number;
  valCol: number;
  sectionLabel?: string;
}

/**
 * Extracts the Google Spreadsheet document ID from a full URL.
 */
export function extractGoogleSheetId(url: string): string | null {
  const match = url.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Parses an RFC-4180 CSV string into a 2D array of cell strings.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r') {
      continue;
    } else if (ch === '\n') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Converts Brazilian currency strings (e.g. "R$ 2.000,00" or "4425,48") to integer cents.
 */
export function parseBrlValueToCents(raw: string): number | null {
  const cleaned = raw
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d.,-]/g, '');
  if (!cleaned) return null;

  let normalized = cleaned;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

/**
 * Converts a DD/MM/YYYY or YYYY-MM-DD date string into YYYY-MM-DD ISO format.
 */
export function parseBrDateToIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const br = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!br) return null;
  const day = br[1].padStart(2, '0');
  const month = br[2].padStart(2, '0');
  const year = br[3].length === 2 ? `20${br[3]}` : br[3];
  return `${year}-${month}-${day}`;
}

function normalizeHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeType(rawType: string, desc: string): { type: TransparencyType; categoryOverride?: string } {
  const norm = normalizeHeader(rawType);
  if (norm === 'receita' || norm === 'entrada') return { type: 'receita' };
  if (norm === 'despesa' || norm === 'saida') return { type: 'despesa' };
  if (norm === 'ativo') return { type: 'ativo' };
  if (norm === 'passivo') return { type: 'passivo' };

  const descLower = normalizeHeader(desc);
  if (descLower.includes('heranca') || descLower.includes('patrocinio')) {
    return { type: 'receita', categoryOverride: 'Herança / Saldo Inicial' };
  }
  return { type: 'despesa' };
}

function detectColumnGroups(rows: string[][]): { headerRowIdx: number; groups: ColumnGroup[] } | null {
  for (let r = 0; r < Math.min(rows.length, 15); r += 1) {
    const row = rows[r];
    const groups: ColumnGroup[] = [];
    for (let c = 0; c < row.length; c += 1) {
      if (normalizeHeader(row[c]) !== 'data') continue;
      let typeCol = -1;
      let descCol = -1;
      let valCol = -1;
      for (let k = c + 1; k < Math.min(row.length, c + 5); k += 1) {
        const h = normalizeHeader(row[k]);
        if (h === 'data') break;
        if ((h === 'categoria' || h === 'status' || h === 'tipo') && typeCol === -1) typeCol = k;
        else if (h.startsWith('descri') && descCol === -1) descCol = k;
        else if ((h === 'valor' || h === 'quantia') && valCol === -1) valCol = k;
      }
      if (descCol !== -1 && valCol !== -1) {
        const prevRowLabel = r > 0 ? rows[r - 1][c] || '' : '';
        groups.push({
          dateCol: c,
          typeCol,
          descCol,
          valCol,
          sectionLabel: prevRowLabel || undefined,
        });
      }
    }
    if (groups.length > 0) {
      return { headerRowIdx: r, groups };
    }
  }
  return null;
}

/**
 * Parses the overview CSV tab to extract current and projected balances.
 */
export function parseOverviewCsv(csvText: string): {
  currentBalanceCents?: number;
  projectedBalanceCents?: number;
} {
  const rows = parseCsvRows(csvText);
  let currentBalanceCents: number | undefined;
  let projectedBalanceCents: number | undefined;

  for (const row of rows) {
    const label = normalizeHeader(row[0] || '');
    if (label === 'saldo atual') {
      const val = parseBrlValueToCents(row[1] || '');
      if (val !== null) currentBalanceCents = val;
    } else if (label === 'saldo projetado') {
      const val = parseBrlValueToCents(row[1] || '');
      if (val !== null) projectedBalanceCents = val;
    }
  }

  return { currentBalanceCents, projectedBalanceCents };
}

/**
 * Extracts all financial transactions from a monthly or SECIMED CSV sheet tab.
 */
export function parseSheetTransactionsCsv(sheetName: string, csvText: string): TransparencyEntry[] {
  const rows = parseCsvRows(csvText);
  const detected = detectColumnGroups(rows);
  if (!detected) return [];

  const isSecimed = normalizeHeader(sheetName) === 'secimed';
  const results: TransparencyEntry[] = [];

  for (let r = detected.headerRowIdx + 1; r < rows.length; r += 1) {
    const row = rows[r];
    detected.groups.forEach((group, groupIdx) => {
      const isoDate = parseBrDateToIso(row[group.dateCol] || '');
      const desc = (row[group.descCol] || '').trim();
      const cents = parseBrlValueToCents(row[group.valCol] || '');
      if (!isoDate || !desc || cents === null || cents === 0) return;

      const rawType = group.typeCol !== -1 ? row[group.typeCol] || '' : '';
      const resolved = normalizeType(rawType, desc);
      const isSponsorBlock = groupIdx > 0 && normalizeHeader(group.sectionLabel || '').includes('patroc');
      const category = isSponsorBlock
        ? 'Patrocínios SECIMED'
        : resolved.categoryOverride || (isSecimed ? 'SECIMED' : 'Geral');
      const year = Number.parseInt(isoDate.slice(0, 4), 10) || new Date().getFullYear();

      results.push({
        id: `gs-${normalizeHeader(sheetName)}-${r}-${groupIdx}-${isoDate}`,
        sheet: sheetName,
        year,
        date: isoDate,
        type: resolved.type,
        category,
        description: desc,
        amountCents: Math.abs(cents),
        createdAt: `${isoDate}T12:00:00.000Z`,
      });
    });
  }

  return results;
}

/**
 * Discovers sheet tab names and numeric GIDs from the public Google Sheets htmlview markup.
 */
export function parseGoogleSheetTabs(html: string): ParsedSheetTab[] {
  const seen = new Set<string>();
  const tabs: ParsedSheetTab[] = [];
  const regex = /items\.push\(\{name:\s*"([^"]+)"[^}]*gid:\s*"([0-9]+)"/g;
  let match = regex.exec(html);
  while (match) {
    const [, name, gid] = match;
    if (!seen.has(gid)) {
      seen.add(gid);
      tabs.push({ name, gid });
    }
    match = regex.exec(html);
  }
  return tabs;
}

/**
 * Fetches and parses the entire standardized Google Spreadsheet into CAMBLU transparency records.
 */
export async function syncGoogleSheetTransparency(spreadsheetUrl: string): Promise<SheetSyncResult> {
  const spreadsheetId = extractGoogleSheetId(spreadsheetUrl);
  if (!spreadsheetId) {
    throw new Error('Link inválido. Cole a URL completa de uma planilha do Google Sheets.');
  }

  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const htmlResp = await fetch(`${base}/htmlview`, { cache: 'no-store' });
  if (!htmlResp.ok) {
    throw new Error(`Não foi possível ler a planilha (HTTP ${htmlResp.status}). Verifique se ela está pública para leitura.`);
  }
  const html = await htmlResp.text();
  const discoveredTabs = parseGoogleSheetTabs(html);
  if (discoveredTabs.length === 0) {
    throw new Error('Nenhuma aba encontrada na planilha. Confirme se o compartilhamento público está ativo.');
  }

  const csvPairs = await Promise.all(
    discoveredTabs.map(async (tab) => {
      const csvResp = await fetch(`${base}/export?format=csv&gid=${encodeURIComponent(tab.gid)}`, {
        cache: 'no-store',
      });
      if (!csvResp.ok) return { tab, csv: '' };
      return { tab, csv: await csvResp.text() };
    }),
  );

  let currentBalanceCents = 0;
  let projectedBalanceCents = 0;
  const entries: TransparencyEntry[] = [];

  for (const { tab, csv } of csvPairs) {
    if (!csv) continue;
    const normName = normalizeHeader(tab.name);
    if (normName === 'overview') {
      const ov = parseOverviewCsv(csv);
      if (ov.currentBalanceCents !== undefined) currentBalanceCents = ov.currentBalanceCents;
      if (ov.projectedBalanceCents !== undefined) projectedBalanceCents = ov.projectedBalanceCents;
      continue;
    }
    entries.push(...parseSheetTransactionsCsv(tab.name, csv));
  }

  const savedCategories = Array.from(new Set(entries.map((e) => e.category).filter(Boolean))).sort();

  return {
    spreadsheetId,
    entries,
    currentBalanceCents,
    projectedBalanceCents,
    savedCategories,
    tabCount: discoveredTabs.length,
    lastSyncedAt: new Date().toISOString(),
  };
}
