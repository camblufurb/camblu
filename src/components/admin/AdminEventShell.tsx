import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { computeEventStats } from '../../lib/adminStats';
import { formatBrlFromCents } from '../../lib/validators';
import type { CambluEvent } from '../../types/domain';
import { Icon } from '../Icon';

interface EventOutletContext {
  event: CambluEvent;
}

export function useAdminEvent(): CambluEvent {
  return useOutletContext<EventOutletContext>().event;
}

export function AdminEventShell() {
  const { eventId } = useParams();
  const { events, tickets, certificates } = useAppData();

  const event = events.find((e) => e.id === eventId || e.slug === eventId);

  if (!event) {
    return (
      <article className="m3-card m3-motion-panel" style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
        <h1>Evento não encontrado</h1>
        <p className="text-muted">O evento selecionado não está cadastrado ou foi removido.</p>
        <Link to="/back/eventos" className="m3-btn m3-btn--blue">
          <Icon name="arrow_back" size={18} />
          <span>Voltar para Eventos</span>
        </Link>
      </article>
    );
  }

  const stats = computeEventStats(event, tickets, certificates);
  const basePath = `/back/eventos/${event.id}`;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <article className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <h1>{event.title}</h1>
            <p className="text-muted">
              {new Date(event.startAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
              {event.locationShort}
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link to={`/eventos/${event.slug}`} className="m3-btn m3-btn--outlined" style={{ minBlockSize: '40px' }}>
              <Icon name="open_in_new" size={17} />
              <span>Página Pública</span>
            </Link>
            <Link to={`${basePath}/qr`} className="m3-btn m3-btn--blue" style={{ minBlockSize: '40px' }}>
              <Icon name="qr_code_scanner" size={17} />
              <span>Ler QR Code</span>
            </Link>
          </div>
        </div>

        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Ingressos Vendidos</span>
            <strong className="admin-kpi-value">
              {stats.soldCount} / {stats.totalCapacity}
            </strong>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Receita do Evento</span>
            <strong className="admin-kpi-value">{formatBrlFromCents(stats.grossRevenueCents)}</strong>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Check-ins QR Validados</span>
            <strong className="admin-kpi-value">
              {stats.checkedInQrCount} / {stats.totalQrSlots}
            </strong>
          </div>
          <div className="admin-kpi-card">
            <span className="admin-kpi-label">Certificados Emitidos</span>
            <strong className="admin-kpi-value">{stats.certificatesIssuedCount}</strong>
          </div>
        </div>
      </article>

      <nav aria-label="Navegação do evento" className="admin-event-tabs">
        <NavLink to={basePath} end className="admin-event-tab">
          <Icon name="dashboard" size={18} />
          <span>Visão Geral</span>
        </NavLink>
        <NavLink to={`${basePath}/lotes`} className="admin-event-tab">
          <Icon name="confirmation_number" size={18} />
          <span>Lotes ({event.lots.length})</span>
        </NavLink>
        <NavLink to={`${basePath}/participantes`} className="admin-event-tab">
          <Icon name="group" size={18} />
          <span>Participantes ({stats.issuedTicketsCount})</span>
        </NavLink>
        <NavLink to={`${basePath}/certificados`} className="admin-event-tab">
          <Icon name="workspace_premium" size={18} />
          <span>Certificados ({stats.certificatesIssuedCount})</span>
        </NavLink>
        <NavLink to={`${basePath}/qr`} className="admin-event-tab">
          <Icon name="qr_code_scanner" size={18} />
          <span>Ler QR Code</span>
        </NavLink>
      </nav>

      <Outlet context={{ event }} />
    </div>
  );
}
