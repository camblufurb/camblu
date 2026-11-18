import type { TransparencyEntry } from '../types/domain';
import { formatBrlFromCents } from './validators';

export interface TransparencyPosterSlide {
  index: number;
  title: string;
  dataUrl: string;
}

const PIE_PALETTE = [
  '#edd16e',
  '#3b82f7',
  '#6ee7b7',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#38bdf8',
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function paintSlideBase(ctx: CanvasRenderingContext2D, slideNum: number, monthLabel: string) {
  const W = 1080;
  const H = 1350;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#071b13');
  grad.addColorStop(0.55, '#0f3325');
  grad.addColorStop(1, '#174936');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(237, 209, 110, 0.16)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W - 90, 120, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#edd16e';
  drawRoundedRect(ctx, 72, 72, 390, 56, 28);
  ctx.fill();

  ctx.fillStyle = '#071b13';
  ctx.font = '800 24px "Roboto Flex", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TRANSPARÊNCIA CAMBLU', 267, 100);

  ctx.fillStyle = '#f1de97';
  ctx.font = '700 26px "Roboto Flex", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${slideNum} / 3`, W - 72, 100);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(72, H - 120, W - 144, 2);
  ctx.fillStyle = '#c4d8cc';
  ctx.font = '600 24px "Roboto Flex", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Medicina FURB · ${monthLabel}`, 72, H - 72);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#edd16e';
  ctx.fillText('camblu.org/transparencia', W - 72, H - 72);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let currY = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currY);
      line = w;
      currY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currY);
}

export interface CategorySlice {
  label: string;
  cents: number;
  percent: number;
  color: string;
}

/**
 * Aggregates transparency entries of a single flow direction (`receita` or `despesa`)
 * strictly by their categorized label, sorted by total value descending.
 */
export function aggregateDirectionCategories(
  entries: TransparencyEntry[],
  direction: 'receita' | 'despesa',
): CategorySlice[] {
  const byCategory = new Map<string, number>();
  let total = 0;

  for (const e of entries) {
    if (e.type !== direction || e.amountCents <= 0) continue;
    const key = e.category && e.category !== 'Geral' ? e.category.trim() : e.description.slice(0, 26);
    byCategory.set(key, (byCategory.get(key) || 0) + e.amountCents);
    total += e.amountCents;
  }

  return Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, cents], idx) => ({
      label,
      cents,
      percent: total > 0 ? Math.round((cents / total) * 100) : 0,
      color: PIE_PALETTE[idx % PIE_PALETTE.length],
    }));
}

export function aggregateForPie(entries: TransparencyEntry[], maxPrimarySlices = 6): CategorySlice[] {
  const byCategory = new Map<string, number>();
  let total = 0;

  for (const e of entries) {
    if (e.amountCents <= 0) continue;
    const key = e.category && e.category !== 'Geral' ? e.category.trim() : e.description.slice(0, 26);
    byCategory.set(key, (byCategory.get(key) || 0) + e.amountCents);
    total += e.amountCents;
  }

  const sorted = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, maxPrimarySlices);
  const othersCents = sorted.slice(maxPrimarySlices).reduce((sum, [, v]) => sum + v, 0);
  if (othersCents > 0) top.push(['Outros', othersCents]);

  return top.map(([label, cents], idx) => ({
    label,
    cents,
    percent: total > 0 ? Math.round((cents / total) * 100) : 0,
    color: PIE_PALETTE[idx % PIE_PALETTE.length],
  }));
}

function paintPieAndLegend(
  ctx: CanvasRenderingContext2D,
  slices: CategorySlice[],
  totalCents: number,
  emptyMessage: string,
) {
  const W = 1080;
  if (slices.length === 0 || totalCents <= 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundedRect(ctx, 72, 410, W - 144, 180, 28);
    ctx.fill();
    ctx.fillStyle = '#c4d8cc';
    ctx.font = '600 30px "Roboto Flex", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(emptyMessage, W / 2, 500);
    return;
  }

  const cx = W / 2;
  const cy = 530;
  const radius = 185;
  let angle = -Math.PI / 2;

  for (const sl of slices) {
    const portion = sl.cents / totalCents;
    const endAngle = angle + portion * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, endAngle);
    ctx.closePath();
    ctx.fillStyle = sl.color;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#071b13';
    ctx.stroke();
    angle = endAngle;
  }

  let legendY = 760;
  for (const sl of slices) {
    const pct = Math.round((sl.cents / totalCents) * 100);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundedRect(ctx, 72, legendY, W - 144, 56, 16);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(106, legendY + 28, 12, 0, Math.PI * 2);
    ctx.fillStyle = sl.color;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 25px "Roboto Flex", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${sl.label.slice(0, 30)} (${pct}%)`, 134, legendY + 29);

    ctx.fillStyle = sl.color;
    ctx.font = '800 25px "Roboto Flex", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatBrlFromCents(sl.cents), W - 96, legendY + 29);

    legendY += 67;
  }
}

/**
 * Generates the 3 monthly transparency carousel cards (1080x1350 PNG):
 * 1) Cover with Monthly Net Result; 2) Incomes Pie Chart; 3) Saídas e Investimentos Pie Chart.
 */
export function generateTransparencyPostSlides(
  monthLabel: string,
  entries: TransparencyEntry[],
): TransparencyPosterSlide[] {
  const W = 1080;
  const H = 1350;
  const receitas = entries.filter((e) => e.type === 'receita');
  const despesas = entries.filter((e) => e.type === 'despesa');
  const totalIn = receitas.reduce((s, e) => s + e.amountCents, 0);
  const totalOut = despesas.reduce((s, e) => s + e.amountCents, 0);
  const netResultCents = totalIn - totalOut;
  const netPrefix = netResultCents >= 0 ? '+' : '-';

  const makeCanvas = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };

  // SLIDE 1 — Capa + Resultado do Mês
  const c1 = makeCanvas();
  const ctx1 = c1.getContext('2d')!;
  paintSlideBase(ctx1, 1, monthLabel);
  ctx1.textAlign = 'left';
  ctx1.fillStyle = '#f1de97';
  ctx1.font = '700 34px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText('PRESTAÇÃO DE CONTAS MENSAL', 72, 280);
  ctx1.fillStyle = '#ffffff';
  ctx1.font = '800 84px "Roboto Flex", system-ui, sans-serif';
  wrapText(ctx1, `Balanço de ${monthLabel}`, 72, 380, W - 144, 96);
  ctx1.fillStyle = '#d7ece0';
  ctx1.font = '500 34px "Roboto Flex", system-ui, sans-serif';
  wrapText(
    ctx1,
    'Confira as entradas, saídas e investimentos registrados no período com total transparência.',
    72,
    595,
    W - 144,
    46,
  );
  ctx1.fillStyle = 'rgba(237, 209, 110, 0.14)';
  drawRoundedRect(ctx1, 72, 760, W - 144, 310, 32);
  ctx1.fill();
  ctx1.fillStyle = '#edd16e';
  ctx1.font = '700 28px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText('RESULTADO DO MÊS', 110, 825);
  ctx1.fillStyle = netResultCents >= 0 ? '#6ee7b7' : '#f1de97';
  ctx1.font = '800 76px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText(`${netPrefix}${formatBrlFromCents(Math.abs(netResultCents))}`, 110, 915);
  ctx1.fillStyle = '#c4d8cc';
  ctx1.font = '600 28px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText(
    `Entradas: +${formatBrlFromCents(totalIn)}   ·   Saídas: -${formatBrlFromCents(totalOut)}`,
    110,
    1005,
  );

  // SLIDE 2 — Entradas com Gráfico de Pizza
  const c2 = makeCanvas();
  const ctx2 = c2.getContext('2d')!;
  paintSlideBase(ctx2, 2, monthLabel);
  ctx2.textAlign = 'left';
  ctx2.fillStyle = '#edd16e';
  ctx2.font = '700 32px "Roboto Flex", system-ui, sans-serif';
  ctx2.fillText('ENTRADAS DO MÊS', 72, 220);
  ctx2.fillStyle = '#ffffff';
  ctx2.font = '800 68px "Roboto Flex", system-ui, sans-serif';
  ctx2.fillText(`+${formatBrlFromCents(totalIn)}`, 72, 300);
  paintPieAndLegend(
    ctx2,
    aggregateForPie(receitas),
    totalIn,
    'Nenhuma entrada registrada neste mês.',
  );

  // SLIDE 3 — Apenas Saídas e Investimentos com Gráfico de Pizza
  const c3 = makeCanvas();
  const ctx3 = c3.getContext('2d')!;
  paintSlideBase(ctx3, 3, monthLabel);
  ctx3.textAlign = 'left';
  ctx3.fillStyle = '#edd16e';
  ctx3.font = '700 34px "Roboto Flex", system-ui, sans-serif';
  ctx3.fillText('Saídas e Investimentos', 72, 220);
  ctx3.fillStyle = '#ffffff';
  ctx3.font = '800 68px "Roboto Flex", system-ui, sans-serif';
  ctx3.fillText(`-${formatBrlFromCents(totalOut)}`, 72, 300);
  paintPieAndLegend(
    ctx3,
    aggregateForPie(despesas),
    totalOut,
    'Nenhuma saída registrada neste mês.',
  );

  return [
    { index: 1, title: 'Resultado do Mês', dataUrl: c1.toDataURL('image/png') },
    { index: 2, title: 'Entradas (Pizza)', dataUrl: c2.toDataURL('image/png') },
    { index: 3, title: 'Saídas e Investimentos', dataUrl: c3.toDataURL('image/png') },
  ];
}
