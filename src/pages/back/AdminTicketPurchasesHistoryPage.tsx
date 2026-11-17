import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { formatBrlFromCents, formatCpf } from '../../lib/validators';

export function AdminTicketPurchasesHistoryPage() {
  const { events, tickets } = useAppData();
  const [eventFilter, setEventFilter] = useState('all');
  const [search, setSearch] = useState('');
  const tableCaptionId = useId();

  const filteredTickets = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return [...tickets]
      .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
      .filter((ticket) => {
        if (eventFilter !== 'all' && ticket.eventId !== eventFilter) return false;
        if (!clean) return true;
        return `${ticket.ownerName} ${ticket.ownerCpf} ${ticket.ownerEmail} ${ticket.eventTitle} ${ticket.lotName}`
          .toLowerCase()
          .includes(clean);
      });
  }, [tickets, eventFilter, search]);

  const totalRevenueCents = filteredTickets.reduce((acc, t) => acc + t.paidCents, 0);
  const transferCount = filteredTickets.reduce((acc, t) => acc + t.transferHistory.length, 0);

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Histórico de Compras de Ingressos</h1>
        <p className="text-muted">
          Consulte todas as emissões, compras de lotes, gratuidades do Clube CAMBLU e transferências realizadas entre acadêmicos.
        </p>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Ingressos no Filtro</span>
          <strong className="admin-kpi-value">{filteredTickets.length}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Receita Liquidada</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(totalRevenueCents)}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Transferências por CPF</span>
          <strong className="admin-kpi-value">{transferCount}</strong>
        </div>
      </div>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="m3-select"
            style={{ inlineSize: 'auto', maxInlineSize: '24rem' }}
            aria-label="Filtrar por evento"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="all">Todos os eventos ({tickets.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          <input
            type="search"
            className="m3-input"
            style={{ maxInlineSize: '18rem' }}
            placeholder="Buscar nome, CPF ou lote..."
            aria-label="Buscar compra de ingresso"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredTickets.length === 0 ? (
          <p className="text-muted">Nenhuma compra de ingresso encontrada.</p>
        ) : (
          <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
            <table className="admin-table">
              <caption id={tableCaptionId} className="visually-hidden">
                Histórico global de compras e emissões de ingressos
              </caption>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Evento</th>
                  <th>Titular & CPF</th>
                  <th>Lote</th>
                  <th>Valor Pago</th>
                  <th>Check-ins</th>
                  <th>Transferências</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const doneQr = ticket.qrInstances.filter((q) => Boolean(q.checkedInAt)).length;
                  return (
                    <tr key={ticket.id}>
                      <td>{new Date(ticket.purchasedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>
                        <Link to={`/back/eventos/${ticket.eventId}/participantes`} style={{ fontWeight: 650 }}>
                          {ticket.eventTitle}
                        </Link>
                      </td>
                      <th>
                        <span style={{ display: 'block' }}>{ticket.ownerName}</span>
                        <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                          CPF {formatCpf(ticket.ownerCpf)} · {ticket.ownerEmail}
                        </span>
                      </th>
                      <td>{ticket.lotName}</td>
                      <td>
                        <strong>{formatBrlFromCents(ticket.paidCents)}</strong>
                        {ticket.discountReason && (
                          <span className="text-muted" style={{ display: 'block', fontSize: '0.78rem' }}>
                            {ticket.discountReason}
                          </span>
                        )}
                      </td>
                      <td>
                        {doneQr}/{ticket.qrInstances.length} QRs
                      </td>
                      <td>
                        {ticket.transferHistory.length > 0 ? `${ticket.transferHistory.length}x` : 'Titular original'}
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
