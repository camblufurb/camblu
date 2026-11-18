import { API_BASE_URL, getAuthHeaders, isFirebaseConfigured } from './firebase';
import { logError, logInfo, logWarn } from './logger';
import type { CambluEvent, CertificateRecord, Ticket } from '../types/domain';

export interface CheckinValidationInput {
  rawCode: string;
  expectedEventId?: string;
  events: CambluEvent[];
  tickets: Ticket[];
  certificates: CertificateRecord[];
  updateTicket: (ticket: Ticket) => Promise<void>;
  upsertCertificate: (cert: CertificateRecord) => Promise<void>;
}

export interface CheckinValidationResult {
  status: 'ok' | 'already' | 'wrong_event' | 'not_found' | 'empty';
  message: string;
  ownerName?: string;
  qrLabel?: string;
  totalHours?: number;
}

export async function validateTicketQrCheckin({
  rawCode,
  expectedEventId,
  events,
  tickets,
  certificates,
  updateTicket,
  upsertCertificate,
}: CheckinValidationInput): Promise<CheckinValidationResult> {
  const code = rawCode.trim();
  if (!code) {
    return { status: 'empty', message: 'Informe um código QR válido.' };
  }

  const localMatch = tickets.find((t) => t.qrInstances.some((q) => q.qrCode === code));
  if (localMatch && expectedEventId && localMatch.eventId !== expectedEventId) {
    return {
      status: 'wrong_event',
      message: `Este QR Code pertence a "${localMatch.eventTitle}", não ao evento aberto.`,
    };
  }

  if (isFirebaseConfigured && (!expectedEventId || !localMatch || localMatch.eventId === expectedEventId)) {
    logInfo('Checkin', 'Validando QR Code no backend /api/tickets/checkin', { code, expectedEventId });
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/checkin`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ qrCode: code, expectedEventId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { ownerName: string; totalHours: number };
        logInfo('Checkin', 'Presença confirmada pelo backend', { code, ownerName: data.ownerName });
        return {
          status: 'ok',
          ownerName: data.ownerName,
          totalHours: data.totalHours,
          message: `Presença confirmada: ${data.ownerName} (Total ${data.totalHours}h)!`,
        };
      }
      logWarn('Checkin', `Backend /api/tickets/checkin retornou HTTP ${res.status}; usando fallback local`, {
        status: res.status,
      });
    } catch (err) {
      logError('Checkin', 'adminCheckin.confirmTicketCheckin -> POST /api/tickets/checkin', err, { code });
    }
  }

  if (!localMatch) {
    return {
      status: 'not_found',
      message: `QR Code "${code}" não encontrado entre os ingressos emitidos.`,
    };
  }

  const qrItem = localMatch.qrInstances.find((q) => q.qrCode === code)!;
  if (qrItem.checkedInAt) {
    return {
      status: 'already',
      ownerName: localMatch.ownerName,
      qrLabel: qrItem.label,
      message: `QR Code já validado anteriormente para ${localMatch.ownerName} (${qrItem.label}).`,
    };
  }

  const updatedInstances = localMatch.qrInstances.map((q) =>
    q.qrCode === code
      ? { ...q, checkedInAt: new Date().toISOString(), checkedInBy: 'camblufurb@gmail.com' }
      : q,
  );
  const updatedTicket: Ticket = { ...localMatch, qrInstances: updatedInstances };
  await updateTicket(updatedTicket);

  const totalHours = updatedInstances
    .filter((q) => Boolean(q.checkedInAt))
    .reduce((acc, q) => acc + q.certificateHours, 0);

  const existingCert = certificates.find(
    (c) => c.ticketId === localMatch.id && c.eventId === localMatch.eventId,
  );
  const ev = events.find((e) => e.id === localMatch.eventId);

  const certRecord: CertificateRecord = {
    id: existingCert?.id || `cert-${localMatch.id}`,
    code: existingCert?.code || `CAMBLU-${new Date().getFullYear()}-${localMatch.id.slice(-5).toUpperCase()}`,
    ticketId: localMatch.id,
    eventId: localMatch.eventId,
    eventTitle: localMatch.eventTitle,
    eventDateLabel: ev
      ? new Date(ev.startAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })
      : 'Blumenau/SC',
    ownerUid: localMatch.ownerUid,
    ownerName: localMatch.ownerName,
    ownerCpf: localMatch.ownerCpf,
    totalHours,
    issuedAt: new Date().toISOString(),
    templateConfig: ev?.certificateTemplate,
  };

  await upsertCertificate(certRecord);

  return {
    status: 'ok',
    ownerName: localMatch.ownerName,
    qrLabel: qrItem.label,
    totalHours,
    message: `Presença confirmada: ${localMatch.ownerName} (+${qrItem.certificateHours}h -> Total ${totalHours}h)!`,
  };
}
