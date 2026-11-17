import { useId, useMemo, useState } from 'react';
import { useAdminEvent } from '../../components/admin/AdminEventShell';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { validateTicketQrCheckin } from '../../lib/adminCheckin';
import { formatBrlFromCents, formatCpf } from '../../lib/validators';

export function AdminEventParticipantsPage() {
  const event = useAdminEvent();
  const { events, tickets, certificates, updateTicket, upsertCertificate } = useAppData();
  const { notify } = useToast();
  const tableCaptionId = useId();

  const [search, setSearch] = useState('');
  const [lotFilter, setLotFilter] = useState('all');

  const eventTickets = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (t.eventId !== event.id) return false;
      if (lotFilter !== 'all' && t.lotId !== lotFilter) return false;
      if (!clean) return true;
      const qrCodes = t.qrInstances.map((q) => q.qrCode).join(' ');
      return `${t.ownerName} ${t.ownerCpf} ${t.ownerEmail} ${t.lotName} ${qrCodes}`.toLowerCase().includes(clean);
    });
  }, [tickets, event.id, lotFilter, search]);

  const handleManualQrCheck = async (qrCode: string) => {
    const result = await validateTicketQrCheckin({
      rawCode: qrCode,
      expectedEventId: event.id,
      events,
      tickets,
      certificates,
      updateTicket,
      upsertCertificate,
    });
    notify(result.message, result.status === 'ok' ? 'success' : result.status === 'already' ? 'info' : 'error');
  };

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h2>Participantes & Ingressos ({eventTickets.length})</h2>
            <p className="text-muted">
              Consulte inscritos deste evento, CPF, lote adquirido e confirme entrada manualmente clicando em qualquer QR pendente.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <select
              className="m3-select"
              style={{ inlineSize: 'auto' }}
              aria-label="Filtrar por lote"
              value={lotFilter}
              onChange={(e) => setLotFilter(e.target.value)}
            >
              <option value="all">Todos os lotes</option>
              {event.lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              className="m3-input"
              style={{ maxInlineSize: '18rem' }}
              placeholder="Buscar nome, CPF ou QR..."
              aria-label="Buscar participante"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {eventTickets.length === 0 ? (
          <p className="text-muted">Nenhum ingresso emitido encontrado para este filtro.</p>
        ) : (
          <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
            <table className="admin-table">
              <caption id={tableCaptionId} className="visually-hidden">
                Lista de participantes do evento {event.title}
              </caption>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>CPF & E-mail</th>
                  <th>Lote / Pagamento</th>
                  <th>Sessões & Check-in QR</th>
                  <th>Horas Validadas</th>
                </tr>
              </thead>
              <tbody>
                {eventTickets.map((ticket) => {
                  const validatedHours = ticket.qrInstances
                    .filter((q) => Boolean(q.checkedInAt))
                    .reduce((acc, q) => acc + q.certificateHours, 0);
                  return (
                    <tr key={ticket.id}>
                      <th>{ticket.ownerName}</th>
                      <td>
                        <span style={{ display: 'block' }}>{formatCpf(ticket.ownerCpf)}</span>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>{ticket.ownerEmail}</span>
                      </td>
                      <td>
                        <span style={{ display: 'block', fontWeight: 650 }}>{ticket.lotName}</span>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {formatBrlFromCents(ticket.paidCents)}
                          {ticket.discountReason ? ` · ${ticket.discountReason}` : ''}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {ticket.qrInstances.map((q) =>
                            q.checkedInAt ? (
                              <span key={q.qrCode} className="m3-badge m3-badge--success">
                                <Icon name="check_circle" size={14} />
                                {q.label} ({q.certificateHours}h)
                              </span>
                            ) : (
                              <button
                                key={q.qrCode}
                                type="button"
                                className="m3-chip"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', minBlockSize: '30px' }}
                                title={`Validar QR ${q.qrCode}`}
                                onClick={() => handleManualQrCheck(q.qrCode)}
                              >
                                <Icon name="qr_code_2" size={14} />
                                <span>Validar: {q.label}</span>
                              </button>
                            ),
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{validatedHours}h</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
