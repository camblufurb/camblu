import type { TransparencyEntry } from '../types/domain';
import { formatBrlFromCents } from './validators';

export interface TransparencyPosterSlide {
  index: number;
  title: string;
  dataUrl: string;
}

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

  // Subtle decorative arcs
  ctx.strokeStyle = 'rgba(237, 209, 110, 0.16)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W - 90, 120, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Header badge
  ctx.fillStyle = '#edd16e';
  drawRoundedRect(ctx, 72, 72, 390, 56, 28);
  ctx.fill();

  ctx.fillStyle = '#071b13';
  ctx.font = '800 24px "Roboto Flex", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TRANSPARÊNCIA CAMBLU', 267, 100);

  // Page indicator
  ctx.fillStyle = '#f1de97';
  ctx.font = '700 26px "Roboto Flex", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${slideNum} / 4`, W - 72, 100);

  // Footer
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

export function generateTransparencyPostSlides(
  monthLabel: string,
  entries: TransparencyEntry[],
  investedBalanceCents: number,
): TransparencyPosterSlide[] {
  const W = 1080;
  const H = 1350;
  const receitas = entries.filter((e) => e.type === 'receita');
  const despesas = entries.filter((e) => e.type === 'despesa');
  const totalIn = receitas.reduce((s, e) => s + e.amountCents, 0);
  const totalOut = despesas.reduce((s, e) => s + e.amountCents, 0);

  const makeCanvas = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };

  // SLIDE 1 — Capa
  const c1 = makeCanvas();
  const ctx1 = c1.getContext('2d')!;
  paintSlideBase(ctx1, 1, monthLabel);
  ctx1.textAlign = 'left';
  ctx1.fillStyle = '#f1de97';
  ctx1.font = '700 34px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText('PRESTAÇÃO DE CONTAS MENSAL', 72, 290);
  ctx1.fillStyle = '#ffffff';
  ctx1.font = '800 84px "Roboto Flex", system-ui, sans-serif';
  wrapText(ctx1, `Balanço de ${monthLabel}`, 72, 390, W - 144, 96);
  ctx1.fillStyle = '#d7ece0';
  ctx1.font = '500 34px "Roboto Flex", system-ui, sans-serif';
  wrapText(
    ctx1,
    `Confira todas as entradas, investimentos estudantis e saídas registradas no mês com total transparência.`,
    72,
    620,
    W - 144,
    46,
  );
  ctx1.fillStyle = 'rgba(237, 209, 110, 0.14)';
  drawRoundedRect(ctx1, 72, 820, W - 144, 240, 32);
  ctx1.fill();
  ctx1.fillStyle = '#edd16e';
  ctx1.font = '700 28px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText('RESUMO RÁPIDO', 110, 885);
  ctx1.fillStyle = '#ffffff';
  ctx1.font = '700 40px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText(`${entries.length} movimentações auditadas`, 110, 955);
  ctx1.fillStyle = '#c4d8cc';
  ctx1.font = '500 30px "Roboto Flex", system-ui, sans-serif';
  ctx1.fillText('Arraste para conferir entradas, despesas e investimentos', 110, 1015);

  // SLIDE 2 — Entradas
  const c2 = makeCanvas();
  const ctx2 = c2.getContext('2d')!;
  paintSlideBase(ctx2, 2, monthLabel);
  ctx2.textAlign = 'left';
  ctx2.fillStyle = '#edd16e';
  ctx2.font = '700 32px "Roboto Flex", system-ui, sans-serif';
  ctx2.fillText('ENTRADAS DO PERÍODO', 72, 220);
  ctx2.fillStyle = '#ffffff';
  ctx2.font = '800 72px "Roboto Flex", system-ui, sans-serif';
  ctx2.fillText(formatBrlFromCents(totalIn), 72, 310);

  let y2 = 420;
  for (const item of receitas.slice(0, 7)) {
    ctx2.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundedRect(ctx2, 72, y2, W - 144, 88, 20);
    ctx2.fill();
    ctx2.fillStyle = '#ffffff';
    ctx2.font = '600 28px "Roboto Flex", system-ui, sans-serif';
    ctx2.textAlign = 'left';
    ctx2.fillText(item.description.slice(0, 36), 100, y2 + 45);
    ctx2.fillStyle = '#6ee7b7';
    ctx2.font = '800 28px "Roboto Flex", system-ui, sans-serif';
    ctx2.textAlign = 'right';
    ctx2.fillText(`+${formatBrlFromCents(item.amountCents)}`, W - 100, y2 + 45);
    y2 += 104;
  }

  // SLIDE 3 — Saídas
  const c3 = makeCanvas();
  const ctx3 = c3.getContext('2d')!;
  paintSlideBase(ctx3, 3, monthLabel);
  ctx3.textAlign = 'left';
  ctx3.fillStyle = '#edd16e';
  ctx3.font = '700 32px "Roboto Flex", system-ui, sans-serif';
  ctx3.fillText('SAÍDAS & INVESTIMENTOS EM AÇÕES', 72, 220);
  ctx3.fillStyle = '#ffffff';
  ctx3.font = '800 72px "Roboto Flex", system-ui, sans-serif';
  ctx3.fillText(formatBrlFromCents(totalOut), 72, 310);

  let y3 = 420;
  for (const item of despesas.slice(0, 7)) {
    ctx3.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundedRect(ctx3, 72, y3, W - 144, 88, 20);
    ctx3.fill();
    ctx3.fillStyle = '#ffffff';
    ctx3.font = '600 28px "Roboto Flex", system-ui, sans-serif';
    ctx3.textAlign = 'left';
    ctx3.fillText(item.description.slice(0, 36), 100, y3 + 45);
    ctx3.fillStyle = '#f1de97';
    ctx3.font = '800 28px "Roboto Flex", system-ui, sans-serif';
    ctx3.textAlign = 'right';
    ctx3.fillText(`-${formatBrlFromCents(item.amountCents)}`, W - 100, y3 + 45);
    y3 += 104;
  }

  // SLIDE 4 — Fechamento & Reserva
  const c4 = makeCanvas();
  const ctx4 = c4.getContext('2d')!;
  paintSlideBase(ctx4, 4, monthLabel);
  ctx4.textAlign = 'left';
  ctx4.fillStyle = '#edd16e';
  ctx4.font = '700 32px "Roboto Flex", system-ui, sans-serif';
  ctx4.fillText('BALANÇO & RESERVA PATRIMONIAL', 72, 230);

  const cards = [
    { label: 'Resultado Operacional do Mês', value: formatBrlFromCents(totalIn - totalOut) },
    { label: 'Reserva Aplicada (Renda Fixa)', value: formatBrlFromCents(investedBalanceCents) },
    { label: 'Atas & Comprovantes Completos', value: 'Disponíveis no portal oficial' },
  ];
  let y4 = 340;
  for (const card of cards) {
    ctx4.fillStyle = 'rgba(255,255,255,0.09)';
    drawRoundedRect(ctx4, 72, y4, W - 144, 175, 28);
    ctx4.fill();
    ctx4.fillStyle = '#c4d8cc';
    ctx4.font = '600 26px "Roboto Flex", system-ui, sans-serif';
    ctx4.fillText(card.label, 110, y4 + 58);
    ctx4.fillStyle = '#edd16e';
    ctx4.font = '800 44px "Roboto Flex", system-ui, sans-serif';
    ctx4.fillText(card.value, 110, y4 + 122);
    y4 += 210;
  }

  return [
    { index: 1, title: 'Capa do Mês', dataUrl: c1.toDataURL('image/png') },
    { index: 2, title: 'Entradas', dataUrl: c2.toDataURL('image/png') },
    { index: 3, title: 'Saídas & Projetos', dataUrl: c3.toDataURL('image/png') },
    { index: 4, title: 'Balanço & Atas', dataUrl: c4.toDataURL('image/png') },
  ];
}
