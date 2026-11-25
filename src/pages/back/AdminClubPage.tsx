import { useId, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { M3Dialog } from '../../components/M3Dialog';
import { M3SplitButton } from '../../components/M3SplitButton';
import { useToast } from '../../components/ToastProvider';
import { useAppData } from '../../context/AppDataContext';
import { computeClubStats, isMemberSubscriptionValid } from '../../lib/adminStats';
import {
  computePromotionProgress,
  extractAvailableTurmas,
  generatePromotionTxtList,
} from '../../lib/clubPromotions';
import { formatBrlFromCents } from '../../lib/validators';
import type { ClubPromotion, MembershipTier } from '../../types/domain';

type ClubAdminTab = 'members' | 'promotions';

export function AdminClubPage() {
  const { adminMembers, orders, tickets, clubPromotions, saveClubPromotion, deleteClubPromotion } =
    useAppData();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<ClubAdminTab>('members');
  const [tierFilter, setTierFilter] = useState<'all' | 'active' | MembershipTier>('all');
  const [turmaFilter, setTurmaFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const tableCaptionId = useId();

  // Promotion form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoStartDate, setPromoStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [promoGoal, setPromoGoal] = useState('15');
  const [promoPrize, setPromoPrize] = useState('');
  const [promoIsTshirt, setPromoIsTshirt] = useState(true);
  const [selectedTurmas, setSelectedTurmas] = useState<string[]>([]);
  const [customTurmaInput, setCustomTurmaInput] = useState('');
  const [savingPromo, setSavingPromo] = useState(false);

  // TXT preview & delete confirmation dialogs
  const [txtPreviewPromo, setTxtPreviewPromo] = useState<ClubPromotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubPromotion | null>(null);

  const stats = useMemo(() => computeClubStats(adminMembers, orders, tickets), [adminMembers, orders, tickets]);
  const availableTurmas = useMemo(() => extractAvailableTurmas(adminMembers), [adminMembers]);

  const filteredMembers = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return adminMembers.filter((m) => {
      const valid = isMemberSubscriptionValid(m);
      if (tierFilter === 'active' && !valid) return false;
      if (tierFilter !== 'all' && tierFilter !== 'active' && m.membershipTier !== tierFilter) return false;

      if (turmaFilter === 'none') {
        if (m.affiliation === 'FURB' && m.turma?.trim()) return false;
      } else if (turmaFilter !== 'all') {
        if ((m.turma || '').trim() !== turmaFilter) return false;
      }

      if (!clean) return true;
      return `${m.name} ${m.email} ${m.turma || ''} ${m.membershipTier}`.toLowerCase().includes(clean);
    });
  }, [adminMembers, tierFilter, turmaFilter, search]);

  const allKnownTurmas = useMemo(() => {
    const merged = new Set([...availableTurmas, ...selectedTurmas]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [availableTurmas, selectedTurmas]);

  const toggleTurmaSelection = (turma: string) => {
    setSelectedTurmas((prev) =>
      prev.includes(turma)
        ? prev.filter((item) => item !== turma)
        : [...prev, turma].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })),
    );
  };

  const handleAddCustomTurma = () => {
    const clean = customTurmaInput.replace(/\D/g, '').slice(0, 12);
    if (!clean) {
      notify('Informe o número da turma (apenas dígitos).', 'error');
      return;
    }
    if (!selectedTurmas.includes(clean)) {
      setSelectedTurmas((prev) =>
        [...prev, clean].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })),
      );
    }
    setCustomTurmaInput('');
  };

  const resetPromoForm = () => {
    setEditingId(null);
    setPromoTitle('');
    setPromoStartDate(new Date().toISOString().slice(0, 10));
    setPromoGoal('15');
    setPromoPrize('');
    setPromoIsTshirt(true);
    setSelectedTurmas([]);
    setCustomTurmaInput('');
  };

  const handleEditPromo = (promo: ClubPromotion) => {
    setEditingId(promo.id);
    setPromoTitle(promo.title);
    setPromoStartDate(promo.startDate);
    setPromoGoal(String(promo.goalCount));
    setPromoPrize(promo.prizeName);
    setPromoIsTshirt(promo.isTshirtPrize);
    setSelectedTurmas(promo.turmas);
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = promoTitle.trim();
    const cleanPrize = promoPrize.trim();
    const goalNum = Math.max(1, Number.parseInt(promoGoal, 10) || 0);

    if (!cleanTitle) {
      notify('Informe um título para a promoção.', 'error');
      return;
    }
    if (!promoStartDate) {
      notify('Selecione a data de início da contagem.', 'error');
      return;
    }
    if (selectedTurmas.length < 2) {
      notify('Selecione pelo menos 2 turmas para competirem entre si.', 'error');
      return;
    }
    if (!cleanPrize) {
      notify('Informe qual será o prêmio da turma ao bater a meta.', 'error');
      return;
    }

    setSavingPromo(true);
    try {
      const now = new Date().toISOString();
      const existing = editingId ? clubPromotions.find((p) => p.id === editingId) : undefined;
      const slugBase = cleanTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32);
      const id = existing?.id || `${slugBase || 'promo'}-${Date.now().toString(36)}`;

      await saveClubPromotion({
        id,
        title: cleanTitle,
        startDate: promoStartDate,
        goalCount: goalNum,
        turmas: selectedTurmas,
        prizeName: cleanPrize,
        isTshirtPrize: promoIsTshirt,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      });

      notify(editingId ? 'Promoção atualizada!' : 'Promoção por turma criada!', 'success');
      resetPromoForm();
    } catch (err) {
      notify((err as Error).message || 'Erro ao salvar promoção.', 'error');
    } finally {
      setSavingPromo(false);
    }
  };

  const handleCopyLink = async (promoId: string) => {
    const url = `${window.location.origin}/clube/promocao/${promoId}`;
    try {
      await navigator.clipboard.writeText(url);
      notify('Link de acompanhamento copiado!', 'success');
    } catch {
      notify(`Link: ${url}`, 'info');
    }
  };

  const handleDownloadTxt = (promo: ClubPromotion) => {
    const content = generatePromotionTxtList(promo, adminMembers);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clube-${promo.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Lista TXT gerada e baixada!', 'success');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteClubPromotion(deleteTarget.id);
    if (editingId === deleteTarget.id) resetPromoForm();
    notify('Promoção removida.', 'info');
    setDeleteTarget(null);
  };

  const txtPreviewContent = useMemo(
    () => (txtPreviewPromo ? generatePromotionTxtList(txtPreviewPromo, adminMembers) : ''),
    [txtPreviewPromo, adminMembers],
  );

  return (
    <div className="m3-motion-panel" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <h1>Clube CAMBLU — Estatísticas & Sócios</h1>
          <p className="text-muted">
            Monitore assinaturas ativas por plano e turma, gerencie promoções competitivas e exporte listas de prêmios.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Seções do Clube CAMBLU"
          className="m3-segmented-track"
          style={
            {
              '--seg-count': 2,
              '--seg-index': activeTab === 'members' ? 0 : 1,
            } as CSSProperties
          }
        >
          <span className="m3-segmented-pill" aria-hidden="true" />
          <button
            type="button"
            role="tab"
            id="tab-club-members"
            className="m3-segmented-tab"
            aria-selected={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
          >
            <Icon name="group" size={18} />
            <span>Sócios ({adminMembers.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-club-promotions"
            className="m3-segmented-tab"
            aria-selected={activeTab === 'promotions'}
            onClick={() => setActiveTab('promotions')}
          >
            <Icon name="emoji_events" size={18} />
            <span>Promoção por turma ({clubPromotions.length})</span>
          </button>
        </div>
      </header>

      <div
        role="tabpanel"
        aria-labelledby="tab-club-members"
        hidden={activeTab !== 'members'}
      >
        <div style={{ display: 'grid', gap: '1.5rem' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="m3-input"
                  style={{ minInlineSize: '11rem' }}
                  aria-label="Filtrar assinantes por turma"
                  value={turmaFilter}
                  onChange={(e) => setTurmaFilter(e.target.value)}
                >
                  <option value="all">Todas as turmas</option>
                  {availableTurmas.map((t) => (
                    <option key={t} value={t}>
                      Turma {t}
                    </option>
                  ))}
                  <option value="none">Externo / Sem turma</option>
                </select>

                <input
                  type="search"
                  className="m3-input"
                  style={{ maxInlineSize: '16rem' }}
                  placeholder="Buscar nome, e-mail ou turma..."
                  aria-label="Buscar sócio do Clube CAMBLU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              Exibindo <strong>{filteredMembers.length}</strong> registro(s)
              {turmaFilter !== 'all'
                ? turmaFilter === 'none'
                  ? ' · Filtro: Externo / Sem turma'
                  : ` · Filtro: Turma ${turmaFilter}`
                : ''}
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
                    <th>Camiseta</th>
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
                        <td>{member.tshirtSize || '—'}</td>
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
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem' }} className="text-muted">
                        Nenhum assinante encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>

      <div
        role="tabpanel"
        aria-labelledby="tab-club-promotions"
        hidden={activeTab !== 'promotions'}
      >
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <article className="m3-card" style={{ display: 'grid', gap: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem' }}>
                  {editingId ? 'Editar Promoção por Turma' : 'Nova Promoção por Turma'}
                </h2>
                <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                  Defina uma meta de assinaturas por turma a partir de uma data e gere um link público de acompanhamento.
                </p>
              </div>
              {editingId && (
                <button type="button" className="m3-btn m3-btn--outlined" onClick={resetPromoForm}>
                  Cancelar edição
                </button>
              )}
            </div>

            <form onSubmit={handleSavePromotion} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Título da promoção</span>
                  <input
                    type="text"
                    className="m3-input"
                    placeholder="Ex.: Desafio das Turmas 2026.1"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    required
                  />
                </label>

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>A partir de qual data</span>
                  <input
                    type="date"
                    className="m3-input"
                    value={promoStartDate}
                    onChange={(e) => setPromoStartDate(e.target.value)}
                    required
                  />
                </label>

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Meta de assinaturas por turma</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className="m3-input"
                    value={promoGoal}
                    onChange={(e) => setPromoGoal(e.target.value)}
                    required
                  />
                </label>

                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Prêmio ao bater a meta</span>
                  <input
                    type="text"
                    className="m3-input"
                    placeholder="Ex.: Camiseta exclusiva do Clube"
                    value={promoPrize}
                    onChange={(e) => setPromoPrize(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={promoIsTshirt}
                  onChange={(e) => setPromoIsTshirt(e.target.checked)}
                />
                <span>
                  O prêmio é uma camiseta (ordenar lista TXT por tamanho de camiseta; se desmarcado, ordena em ordem alfabética)
                </span>
              </label>

              <div style={{ display: 'grid', gap: '0.55rem' }}>
                <span style={{ fontWeight: 600 }}>Turmas participantes ({selectedTurmas.length} selecionadas)</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                  {allKnownTurmas.map((turma) => {
                    const checked = selectedTurmas.includes(turma);
                    return (
                      <button
                        key={turma}
                        type="button"
                        className="m3-chip"
                        aria-pressed={checked}
                        onClick={() => toggleTurmaSelection(turma)}
                      >
                        <Icon name={checked ? 'check_circle' : 'add'} size={16} />
                        <span>Turma {turma}</span>
                      </button>
                    );
                  })}

                  <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="m3-input"
                      style={{ inlineSize: '7.5rem' }}
                      placeholder="Outra (ex. 64)"
                      value={customTurmaInput}
                      onChange={(e) => setCustomTurmaInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTurma();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="m3-btn m3-btn--tonal"
                      style={{ minBlockSize: '38px', paddingInline: '0.8rem' }}
                      onClick={handleAddCustomTurma}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="m3-btn m3-btn--blue" disabled={savingPromo}>
                  <Icon name={editingId ? 'save' : 'add_circle'} size={18} />
                  <span>{savingPromo ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar promoção'}</span>
                </button>
              </div>
            </form>
          </article>

          {clubPromotions.length === 0 ? (
            <article className="m3-card" style={{ textAlign: 'center', padding: '2rem' }}>
              <Icon name="emoji_events" size={40} className="m3-badge--blue" />
              <h3 style={{ marginBlockStart: '0.5rem' }}>Nenhuma promoção cadastrada ainda</h3>
              <p className="text-muted">
                Crie a primeira competição entre turmas acima para gerar o link de acompanhamento e a lista TXT.
              </p>
            </article>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {clubPromotions.map((promo) => {
                const leaderboard = computePromotionProgress(promo, adminMembers);
                const publicPath = `/clube/promocao/${promo.id}`;
                return (
                  <article key={promo.id} className="m3-card" style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.15rem' }}>{promo.title}</h3>
                          <span className="m3-badge m3-badge--blue">Meta: {promo.goalCount} assinaturas</span>
                          {promo.isTshirtPrize && (
                            <span className="m3-badge m3-badge--gold">Prêmio: Camiseta</span>
                          )}
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                          <strong>Prêmio:</strong> {promo.prizeName} · <strong>Início:</strong>{' '}
                          {new Date(`${promo.startDate}T12:00:00`).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        <button
                          type="button"
                          className="m3-btn m3-btn--tonal"
                          style={{ minBlockSize: '36px', paddingInline: '0.85rem' }}
                          onClick={() => handleCopyLink(promo.id)}
                        >
                          <Icon name="link" size={17} />
                          <span>Copiar link</span>
                        </button>
                        <Link
                          to={publicPath}
                          target="_blank"
                          rel="noreferrer"
                          className="m3-btn m3-btn--outlined"
                          style={{ minBlockSize: '36px', paddingInline: '0.85rem' }}
                        >
                          <Icon name="open_in_new" size={17} />
                          <span>Abrir</span>
                        </Link>
                        <M3SplitButton
                          primaryLabel="Participantes"
                          primaryIcon="group"
                          onPrimaryClick={() => setTxtPreviewPromo(promo)}
                          onTrailingClick={() => handleDownloadTxt(promo)}
                          trailingIcon="download"
                          trailingAriaLabel={`Baixar lista TXT de ${promo.title}`}
                        />
                        <button
                          type="button"
                          className="m3-icon-btn"
                          aria-label={`Editar ${promo.title}`}
                          onClick={() => handleEditPromo(promo)}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          type="button"
                          className="m3-icon-btn"
                          aria-label={`Excluir ${promo.title}`}
                          onClick={() => setDeleteTarget(promo)}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {leaderboard.map((entry, idx) => (
                        <div
                          key={entry.turma}
                          style={{
                            padding: '0.8rem 0.95rem',
                            borderRadius: '14px',
                            background: 'var(--md-sys-color-surface-container-low, rgba(15, 23, 42, 0.03))',
                            border: entry.goalReached
                              ? '1px solid rgba(22, 163, 74, 0.35)'
                              : '1px solid var(--md-sys-color-outline-variant, rgba(15, 23, 42, 0.1))',
                            display: 'grid',
                            gap: '0.45rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>
                              {idx + 1}º · Turma {entry.turma}
                            </strong>
                            <span className={`m3-badge ${entry.goalReached ? 'm3-badge--success' : 'm3-badge--blue'}`}>
                              {entry.count}/{entry.goalCount}
                            </span>
                          </div>
                          <div className="promo-progress-track" aria-label={`Progresso Turma ${entry.turma}`}>
                            <div
                              className={`promo-progress-fill ${entry.goalReached ? 'promo-progress-fill--goal' : ''}`}
                              style={{ inlineSize: `${entry.percent}%` }}
                            />
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {entry.goalReached ? 'Meta batida!' : `Faltam ${Math.max(0, entry.goalCount - entry.count)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <M3Dialog
        open={Boolean(txtPreviewPromo)}
        onClose={() => setTxtPreviewPromo(null)}
        title={txtPreviewPromo ? `Participantes — ${txtPreviewPromo.title}` : 'Participantes'}
        wide
      >
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            {txtPreviewPromo?.isTshirtPrize
              ? 'Ordenado por tamanho de camiseta (maior para menor) dentro de cada turma.'
              : 'Ordenado em ordem alfabética dentro de cada turma.'}
          </p>
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--md-sys-color-surface-container-highest, #f1f5f9)',
              overflowX: 'auto',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {txtPreviewContent}
          </pre>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              onClick={async () => {
                await navigator.clipboard.writeText(txtPreviewContent);
                notify('Texto copiado para a área de transferência!', 'success');
              }}
            >
              <Icon name="content_copy" size={17} />
              <span>Copiar texto</span>
            </button>
            {txtPreviewPromo && (
              <button
                type="button"
                className="m3-btn m3-btn--blue"
                onClick={() => handleDownloadTxt(txtPreviewPromo)}
              >
                <Icon name="download" size={17} />
                <span>Baixar .txt</span>
              </button>
            )}
          </div>
        </div>
      </M3Dialog>

      <M3Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Excluir promoção por turma"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <p>
            Tem certeza que deseja excluir a promoção <strong>{deleteTarget?.title}</strong>? O link público deixará
            de funcionar.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="m3-btn m3-btn--outlined" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </button>
            <button type="button" className="m3-btn m3-btn--blue" onClick={handleConfirmDelete}>
              Confirmar exclusão
            </button>
          </div>
        </div>
      </M3Dialog>
    </div>
  );
}
