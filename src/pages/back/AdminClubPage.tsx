import { useId, useMemo, useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { computeClubStats, isMemberSubscriptionValid } from '../../lib/adminStats';
import { formatBrlFromCents } from '../../lib/validators';
import type { MembershipTier } from '../../types/domain';

export function AdminClubPage() {
  const { adminMembers, orders, tickets } = useAppData();
  const [tierFilter, setTierFilter] = useState<'all' | 'active' | MembershipTier>('all');
  const [search, setSearch] = useState('');
  const tableCaptionId = useId();

  const stats = useMemo(() => computeClubStats(adminMembers, orders, tickets), [adminMembers, orders, tickets]);

  const filteredMembers = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return adminMembers.filter((m) => {
      const valid = isMemberSubscriptionValid(m);
      if (tierFilter === 'active' && !valid) return false;
      if (tierFilter !== 'all' && tierFilter !== 'active' && m.membershipTier !== tierFilter) return false;
      if (!clean) return true;
      return `${m.name} ${m.email} ${m.turma || ''} ${m.membershipTier}`.toLowerCase().includes(clean);
    });
  }, [adminMembers, tierFilter, search]);

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1>Clube CAMBLU — Estatísticas & Sócios</h1>
        <p className="text-muted">
          Monitore assinaturas ativas por plano, recorrência mensal/semestral, adesão entre cadastros e lista de sócios.
        </p>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Assinantes Ativos</span>
          <strong className="admin-kpi-value">{stats.activeSubscribers}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Taxa de Adesão</span>
          <strong className="admin-kpi-value">{stats.conversionRatePercent}%</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">MRR Estimado</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(stats.mrrCents)}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Projeção Anual</span>
          <strong className="admin-kpi-value">{formatBrlFromCents(stats.projectedAnnualCents)}</strong>
        </div>
      </div>

      <div className="grid-cards">
        {stats.tierBreakdown.map((tier) => (
          <article
            key={tier.tier}
            className="m3-card"
            style={{
              display: 'grid',
              gap: '0.4rem',
              borderTop: `4px solid ${tier.themeColor}`,
            }}
          >
            <strong style={{ color: tier.themeColor }}>{tier.name}</strong>
            <span className="admin-kpi-value">{tier.membersCount}</span>
            <span className="text-muted" style={{ fontSize: '0.84rem' }}>
              {tier.monthlyCount} mensal · {tier.semesterCount} semestral · MRR {formatBrlFromCents(tier.mrrCents)}
            </span>
          </article>
        ))}
      </div>

      <article className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {([
              { id: 'all', label: `Todos (${adminMembers.length})` },
              { id: 'active', label: `Ativos (${stats.activeSubscribers})` },
              { id: 'comum', label: 'Comum' },
              { id: 'raro', label: 'Raro' },
              { id: 'epico', label: 'Épico' },
              { id: 'lendario', label: 'Lendário' },
              { id: 'none', label: 'Não sócio' },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                className="m3-chip"
                aria-pressed={tierFilter === item.id}
                onClick={() => setTierFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="m3-input"
            style={{ maxInlineSize: '18rem' }}
            placeholder="Buscar nome, e-mail ou turma..."
            aria-label="Buscar sócio do Clube CAMBLU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div tabIndex={0} role="region" aria-labelledby={tableCaptionId} className="table-wrapper">
          <table className="admin-table">
            <caption id={tableCaptionId} className="visually-hidden">
              Lista de usuários e assinantes do Clube CAMBLU
            </caption>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Vínculo / Turma</th>
                <th>Plano</th>
                <th>Ciclo</th>
                <th>Validade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const valid = isMemberSubscriptionValid(member);
                return (
                  <tr key={member.uid}>
                    <th>{member.name}</th>
                    <td>{member.email}</td>
                    <td>
                      {member.affiliation}
                      {member.turma ? ` · T${member.turma}` : ''}
                      {member.isCalouro ? ' (Calouro)' : ''}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontWeight: 650 }}>
                      {member.membershipTier === 'none' ? 'Sem plano' : member.membershipTier}
                    </td>
                    <td>{member.membershipCycle || '—'}</td>
                    <td>
                      {member.membershipValidUntil
                        ? new Date(member.membershipValidUntil).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td>
                      <span className={`m3-badge ${valid ? 'm3-badge--success' : 'm3-badge--gold'}`}>
                        {valid ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
