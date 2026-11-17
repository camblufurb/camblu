import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { useAppData } from '../../context/AppDataContext';
import { computeEventStats } from '../../lib/adminStats';
import { formatBrlFromCents } from '../../lib/validators';

export function AdminEventsIndexPage() {
  const { events, tickets, certificates } = useAppData();

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <h1>Eventos CAMBLU</h1>
          <p className="text-muted">
            Acesse a página própria de cada evento para configurar lotes, gerenciar participantes, editar certificados e ler QR Codes na portaria.
          </p>
        </div>
        <Link to="/back/eventos/novo" className="m3-btn m3-btn--blue">
          <Icon name="add_circle" size={18} />
          <span>Criar Novo Evento</span>
        </Link>
      </header>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {events.map((ev) => {
          const stats = computeEventStats(ev, tickets, certificates);
          const base = `/back/eventos/${ev.id}`;
          return (
            <article key={ev.id} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gap: '0.35rem', maxInlineSize: '42rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span className={`m3-badge ${ev.published ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                      {ev.published ? 'Publicado' : 'Rascunho'}
                    </span>
                    <span className="m3-badge">
                      {ev.mode === 'virtual' ? 'Online' : ev.mode === 'misto' ? 'Híbrido (Presencial + Virtual)' : 'Presencial'}
                    </span>
                    {ev.archived && <span className="m3-badge">Arquivado</span>}
                    {ev.isSecimed && <span className="m3-badge m3-badge--blue">SECIMED</span>}
                  </div>
                  <h2>{ev.title}</h2>
                  <p className="text-muted">
                    {new Date(ev.startAt).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {ev.locationShort}
                  </p>
                </div>

                <Link to={base} className="m3-btn m3-btn--filled">
                  <span>Abrir Painel</span>
                  <Icon name="arrow_forward" size={18} />
                </Link>
              </div>

              <div className="admin-kpi-grid">
                <div className="m3-card m3-card--tonal" style={{ padding: '0.75rem 0.9rem' }}>
                  <span className="admin-kpi-label">Vendidos / Lotação</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem' }}>
                    {stats.soldCount} / {stats.totalCapacity} ({stats.occupancyPercent}%)
                  </strong>
                </div>
                <div className="m3-card m3-card--tonal" style={{ padding: '0.75rem 0.9rem' }}>
                  <span className="admin-kpi-label">Receita</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem' }}>
                    {formatBrlFromCents(stats.grossRevenueCents)}
                  </strong>
                </div>
                <div className="m3-card m3-card--tonal" style={{ padding: '0.75rem 0.9rem' }}>
                  <span className="admin-kpi-label">Lotes & QRs Validados</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem' }}>
                    {ev.lots.length} lote(s) · {stats.checkedInQrCount}/{stats.totalQrSlots} QRs
                  </strong>
                </div>
                <div className="m3-card m3-card--tonal" style={{ padding: '0.75rem 0.9rem' }}>
                  <span className="admin-kpi-label">Certificados</span>
                  <strong style={{ display: 'block', fontSize: '1.15rem' }}>
                    {stats.certificatesIssuedCount} emitidos
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Link to={`${base}/lotes`} className="m3-btn m3-btn--outlined" style={{ minBlockSize: '38px' }}>
                  <Icon name="confirmation_number" size={17} />
                  <span>Lotes</span>
                </Link>
                <Link to={`${base}/participantes`} className="m3-btn m3-btn--outlined" style={{ minBlockSize: '38px' }}>
                  <Icon name="group" size={17} />
                  <span>Participantes</span>
                </Link>
                <Link to={`${base}/certificados`} className="m3-btn m3-btn--outlined" style={{ minBlockSize: '38px' }}>
                  <Icon name="workspace_premium" size={17} />
                  <span>Certificados</span>
                </Link>
                <Link to={`${base}/qr`} className="m3-btn m3-btn--blue" style={{ minBlockSize: '38px' }}>
                  <Icon name="qr_code_scanner" size={17} />
                  <span>Ler QR Code</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
