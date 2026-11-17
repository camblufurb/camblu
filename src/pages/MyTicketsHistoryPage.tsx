import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { digitsOnly, formatBrlFromCents, formatCpf } from '../lib/validators';

export function MyTicketsHistoryPage() {
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const { tickets } = useAppData();

  const relatedTickets = useMemo(() => {
    if (!profile) return [];
    const cleanCpf = digitsOnly(profile.cpf);
    return [...tickets]
      .filter((t) => {
        const isCurrentOwner = t.ownerUid === profile.uid || (cleanCpf && digitsOnly(t.ownerCpf) === cleanCpf);
        const participatedInTransfer = t.transferHistory.some(
          (tr) => tr.fromUid === profile.uid || tr.toUid === profile.uid || (cleanCpf && digitsOnly(tr.fromCpf) === cleanCpf),
        );
        return isCurrentOwner || participatedInTransfer;
      })
      .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  }, [tickets, profile]);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center', display: 'grid', gap: '0.9rem' }}>
          <Icon name="confirmation_number" size={44} className="m3-badge--blue" />
          <h1>Entre para ver seu Histórico de Ingressos</h1>
          <p className="text-muted">
            Consulte suas aquisições de lotes, descontos do Clube e registros de transferências vinculadas ao seu CPF.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            style={{ justifySelf: 'center' }}
            onClick={() => signInWithGoogle(isDemoMode ? 'student' : undefined)}
          >
            <Icon name="login" size={18} />
            <span>Entrar com Google</span>
          </button>
        </div>
      </section>
    );
  }

  const totalPaidCents = relatedTickets.reduce((acc, t) => acc + t.paidCents, 0);

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1>Histórico de Compras de Ingressos</h1>
          <p className="text-muted">
            Histórico completo de lotes emitidos, benefícios do Clube CAMBLU e transferências por CPF para{' '}
            <strong>{profile.name}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link to="/meus-pedidos" className="m3-btn m3-btn--outlined">
            <Icon name="receipt_long" size={18} />
            <span>Compras da Lojinha</span>
          </Link>
          <Link to="/meus-ingressos" className="m3-btn m3-btn--blue">
            <Icon name="qr_code_2" size={18} />
            <span>Abrir QR Codes Ativos</span>
          </Link>
        </div>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Ingressos no Histórico</span>
          <strong className="admin-kpi-value">{relatedTickets.length}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Total Pago em Ingressos</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(totalPaidCents)}</strong>
        </div>
      </div>

      {relatedTickets.length === 0 ? (
        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
          <h2>Nenhum ingresso registrado até o momento</h2>
          <p className="text-muted">Confira a agenda de simpósios, SECIMED e encontros abertos para emissão.</p>
          <Link to="/eventos" className="m3-btn m3-btn--filled">
            Ver Eventos Abertos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {relatedTickets.map((ticket) => {
            const cleanCpf = digitsOnly(profile.cpf);
            const stillOwned = ticket.ownerUid === profile.uid || (cleanCpf && digitsOnly(ticket.ownerCpf) === cleanCpf);
            const checkedInCount = ticket.qrInstances.filter((q) => Boolean(q.checkedInAt)).length;
            return (
              <article key={ticket.id} className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      <span className={`m3-badge ${stillOwned ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                        {stillOwned ? 'Em sua posse' : 'Transferido'}
                      </span>
                      <span className="m3-badge">{ticket.lotName}</span>
                    </div>
                    <h2>{ticket.eventTitle}</h2>
                    <span className="text-muted" style={{ fontSize: '0.84rem' }}>
                      Emitido em {new Date(ticket.purchasedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                      {checkedInCount}/{ticket.qrInstances.length} check-in(s) realizados
                    </span>
                  </div>

                  <div style={{ textAlign: 'end' }}>
                    <strong style={{ fontSize: '1.15rem', display: 'block', color: 'var(--md-sys-color-primary)' }}>
                      {ticket.paidCents === 0 ? 'Gratuito' : formatBrlFromCents(ticket.paidCents)}
                    </strong>
                    {ticket.discountReason && (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {ticket.discountReason}
                      </span>
                    )}
                  </div>
                </div>

                {ticket.transferHistory.length > 0 && (
                  <div className="m3-card m3-card--tonal" style={{ padding: '0.75rem 0.95rem', display: 'grid', gap: '0.35rem' }}>
                    <strong style={{ fontSize: '0.84rem' }}>Histórico de transferências por CPF</strong>
                    {ticket.transferHistory.map((tr, idx) => (
                      <span key={`${ticket.id}-tr-${idx}`} className="text-muted" style={{ fontSize: '0.82rem' }}>
                        {new Date(tr.transferredAt).toLocaleDateString('pt-BR')} · De CPF {formatCpf(tr.fromCpf)} para CPF{' '}
                        {formatCpf(tr.toCpf)}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <Link to={`/eventos/${ticket.eventSlug}`} className="m3-btn m3-btn--outlined" style={{ minBlockSize: '38px' }}>
                    Ver Página do Evento
                  </Link>
                  {stillOwned && (
                    <Link to="/meus-ingressos" className="m3-btn m3-btn--blue" style={{ minBlockSize: '38px' }}>
                      <Icon name="qr_code_2" size={17} />
                      <span>Abrir QR Codes</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
