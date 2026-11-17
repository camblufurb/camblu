import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import type { CertificateFieldPosition, CertificateRecord, CertificateTemplateConfig } from '../types/domain';
import { formatCpf } from './validators';

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplateConfig = {
  templateImageUrl: '',
  templateWidthPx: 1754,
  templateHeightPx: 1240,
  fields: {
    name: { xPercent: 50, yPercent: 48, fontSizePt: 46, widthPercent: 72, colorHex: '#0f3325', align: 'center' },
    cpf: { xPercent: 50, yPercent: 56, fontSizePt: 22, widthPercent: 46, colorHex: '#3e4c44', align: 'center' },
    hours: { xPercent: 50, yPercent: 66, fontSizePt: 24, widthPercent: 52, colorHex: '#174936', align: 'center' },
    code: { xPercent: 72, yPercent: 86, fontSizePt: 16, widthPercent: 42, colorHex: '#3e4c44', align: 'center' },
    qr: { xPercent: 85, yPercent: 76, sizePercent: 11 },
  },
};

function drawDefaultCanvaBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#fbfcf9';
  ctx.fillRect(0, 0, width, height);

  // Outer botanical border
  ctx.strokeStyle = '#0f3325';
  ctx.lineWidth = Math.max(14, width * 0.012);
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Inner gold accent border
  ctx.strokeStyle = '#edd16e';
  ctx.lineWidth = Math.max(4, width * 0.0035);
  ctx.strokeRect(58, 58, width - 116, height - 116);

  // Header ribbon
  ctx.fillStyle = '#0f3325';
  ctx.fillRect(58, 58, width - 116, height * 0.16);

  ctx.fillStyle = '#edd16e';
  ctx.font = `700 ${Math.round(height * 0.025)}px "Roboto Flex", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('CENTRO ACADÊMICO DE MEDICINA DE BLUMENAU — CAMBLU · FURB', width / 2, height * 0.115);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(height * 0.05)}px "Roboto Flex", system-ui, sans-serif`;
  ctx.fillText('CERTIFICADO DE PARTICIPAÇÃO', width / 2, height * 0.175);

  ctx.fillStyle = '#3e4c44';
  ctx.font = `500 ${Math.round(height * 0.024)}px "Roboto Flex", system-ui, sans-serif`;
  ctx.fillText('Certificamos que o(a) acadêmico(a)/participante abaixo identificado(a):', width / 2, height * 0.36);

  ctx.strokeStyle = '#c3d0c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, height * 0.81);
  ctx.lineTo(width * 0.38, height * 0.81);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width * 0.62, height * 0.81);
  ctx.lineTo(width * 0.82, height * 0.81);
  ctx.stroke();
}

function drawTextField(
  ctx: CanvasRenderingContext2D,
  text: string,
  pos: CertificateFieldPosition,
  width: number,
  height: number,
  bold = false,
) {
  const scaledPx = Math.round((pos.fontSizePt / 1240) * height * 1.15);
  const maxWidthPx = pos.widthPercent ? (pos.widthPercent / 100) * width : width * 0.82;
  ctx.fillStyle = pos.colorHex;
  ctx.font = `${bold ? '800' : '600'} ${Math.max(12, scaledPx)}px "Roboto Flex", system-ui, sans-serif`;
  ctx.textAlign = pos.align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, (pos.xPercent / 100) * width, (pos.yPercent / 100) * height, maxWidthPx);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function renderCertificateToCanvas(
  cert: CertificateRecord,
  customTemplate?: CertificateTemplateConfig,
): Promise<HTMLCanvasElement> {
  const tpl = customTemplate || cert.templateConfig || DEFAULT_CERTIFICATE_TEMPLATE;
  const width = tpl.templateWidthPx || 1754;
  const height = tpl.templateHeightPx || 1240;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.');

  if (tpl.templateImageUrl) {
    try {
      const bg = await loadImage(tpl.templateImageUrl);
      canvas.width = bg.naturalWidth || width;
      canvas.height = bg.naturalHeight || height;
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } catch {
      drawDefaultCanvaBackground(ctx, canvas.width, canvas.height);
    }
  } else {
    drawDefaultCanvaBackground(ctx, canvas.width, canvas.height);
  }

  const w = canvas.width;
  const h = canvas.height;

  drawTextField(ctx, cert.ownerName, tpl.fields.name, w, h, true);
  drawTextField(ctx, `CPF: ${formatCpf(cert.ownerCpf)}`, tpl.fields.cpf, w, h);
  drawTextField(ctx, `Carga horária válida: ${cert.totalHours} horas`, tpl.fields.hours, w, h, true);
  drawTextField(ctx, `Código: ${cert.code}`, tpl.fields.code, w, h);

  const verifyUrl = `${window.location.origin}/certificados/validar/${encodeURIComponent(cert.code)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 240,
    color: { dark: '#0f3325', light: '#ffffff' },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrConfig = tpl.fields.qr || { xPercent: 86, yPercent: 77, sizePercent: 11 };
  const qrSide = Math.round((qrConfig.sizePercent / 100) * w);
  const qrX = (qrConfig.xPercent / 100) * w - qrSide / 2;
  const qrY = (qrConfig.yPercent / 100) * h - qrSide / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 6, qrY - 6, qrSide + 12, qrSide + 12);
  ctx.drawImage(qrImg, qrX, qrY, qrSide, qrSide);

  return canvas;
}

export async function exportCertificatePng(
  cert: CertificateRecord,
  customTemplate?: CertificateTemplateConfig,
): Promise<Blob> {
  const canvas = await renderCertificateToCanvas(cert, customTemplate);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar imagem PNG do certificado.'));
    }, 'image/png');
  });
}

export async function exportCertificatePdf(
  cert: CertificateRecord,
  customTemplate?: CertificateTemplateConfig,
): Promise<Uint8Array> {
  const canvas = await renderCertificateToCanvas(cert, customTemplate);
  const pngUrl = canvas.toDataURL('image/png');
  const pngBytes = await fetch(pngUrl).then((r) => r.arrayBuffer());

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Certificado — ${cert.eventTitle}`);
  pdfDoc.setAuthor('CAMBLU — Centro Acadêmico de Medicina de Blumenau');
  const embedded = await pdfDoc.embedPng(pngBytes);

  // A4 Landscape in points (841.89 x 595.28)
  const page = pdfDoc.addPage([841.89, 595.28]);
  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: 841.89,
    height: 595.28,
  });

  return pdfDoc.save();
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
