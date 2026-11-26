import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { CambluCrest } from '../components/SponsorLogos';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';
import { CLUB_COMPARISON_ROWS, CLUB_PLANS, getPlanPriceCents } from '../lib/clubPricing';
import { API_BASE_URL, getAuthHeaders } from '../lib/firebase';
import { logError, logInfo } from '../lib/logger';
import { formatBrlFromCents } from '../lib/validators';
import type { MembershipCycle, MembershipTier } from '../types/domain';

export function ClubPage() {
  const { profile, signInWithGoogle, updateMembershipLocal, isDemoMode } = useAuth();
  const { notify } = useToast();
  const [cycle, setCycle] = useState<MembershipCycle>('mensal');
  const [submittingTier, setSubmittingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: Exclude<MembershipTier, 'none'>) => {
    if (!profile) {
      await signInWithGoogle(isDemoMode ? 'student' : undefined);
      return;
    }

    setSubmittingTier(tier);
    try {
      if (!isDemoMode) {
        logInfo('Clube', 'Iniciando assinatura Stripe Clube CAMBLU via /api/checkout/membership', {
          tier,
          cycle,
        });
        const res = await fetch(`${API_BASE_URL}/checkout/membership`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            tier,
            cycle,
          }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error((payload as { error?: string }).error || `Falha HTTP ${res.status} ao iniciar assinatura.`);
        }
        const data = (await res.json()) as { checkoutUrl?: string };
        if (data.checkoutUrl) {
          logInfo('Clube', 'Sessão Stripe Clube criada; redirecionando');
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      await updateMembershipLocal(tier, cycle);
      notify(`Assinatura Clube CAMBLU ${tier.toUpperCase()} (${cycle}) ativada!`);
    } catch (err) {
      logError('Clube', 'ClubPage.handleSubscribe -> POST /api/checkout/membership', err, { tier, cycle });
      notify('Não foi possível iniciar a assinatura.', 'error');
    } finally {
      setSubmittingTier(null);
    }
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2.5rem' }}>
      {/* Hero Showcase (Xbox Game Pass + Fortnite Item Shop vibe) */}
      <div className="club-hero-stage page-hero-card m3-motion-hero">
        <div className="m3-hero-copy page-hero-inner" style={{ maxInlineSize: '54rem', flex: '1 1 22rem' }}>
          <AnimatedClimateTitle tone="light">
            Clube CAMBLU
          </AnimatedClimateTitle>
          <p className="page-hero-desc">
            Suba de nível na Medicina FURB: escolha o passe que mais combina com a sua rotina acadêmica e garanta Carteirinha de Estudante digital a partir do Plano Comum, descontos na Lojinha, eventos gratuitos com ou sem Coffee e entrada na SECIMED.
          </p>

          <div className="page-hero-actions">
            <Link to="/clube/cartao" className="m3-btn m3-btn--gold btn-primary-25d">
              <Icon name="badge" size={19} />
              <span>Cartãozinho</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cabeçalho de seleção de passe e ciclo */}
      <div id="planos-clube" style={{ display: 'grid', gap: '1.15rem', textAlign: 'center', justifyItems: 'center' }}>
        <div style={{ maxInlineSize: '44rem', display: 'grid', gap: '0.4rem' }}>
          <h2>Escolha seu nível no Clube</h2>
          <p className="text-muted">
            Cada nível incorpora integralmente as vantagens anteriores e destrava benefícios extras para os eventos, a Lojinha e a SECIMED.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Ciclo de pagamento da assinatura"
          className="m3-segmented-track"
          style={
            {
              '--seg-count': 2,
              '--seg-index': cycle === 'mensal' ? 0 : 1,
            } as CSSProperties
          }
        >
          <span className="m3-segmented-pill" aria-hidden="true" />
          <button
            type="button"
            role="tab"
            className="m3-segmented-tab"
            aria-selected={cycle === 'mensal'}
            onClick={() => setCycle('mensal')}
          >
            <Icon name="autorenew" size={18} />
            <span>Mensal · Renovação automática</span>
          </button>
          <button
            type="button"
            role="tab"
            className="m3-segmented-tab"
            aria-selected={cycle === 'semestral'}
            onClick={() => setCycle('semestral')}
          >
            <Icon name="calendar_today" size={18} />
            <span>Semestral · Passe de 6 meses</span>
          </button>
        </div>
      </div>

      {/* Cards de Raridade em Escada Progressiva (4 -> 6 -> 8 -> 10 benefícios) */}
      <div className="club-tiers-grid">
        {CLUB_PLANS.map((plan, idx) => {
          const priceCents = getPlanPriceCents(plan.tier, cycle);
          const monthlyEquivalent = cycle === 'semestral' ? Math.round(priceCents / 6) : priceCents;
          const isCurrent = profile?.membershipActive && profile.membershipTier === plan.tier;

          return (
            <article
              key={plan.tier}
              className="club-tier-card m3-motion-stagger"
              style={
                {
                  '--stagger-i': idx,
                  '--tier-color': plan.themeColor,
                  '--tier-ink': plan.tier === 'lendario' ? '#9c7206' : plan.themeColor,
                  '--tier-glow': plan.glowColor,
                } as CSSProperties
              }
            >
              {plan.shimmer && <div className="club-tier-shimmer" aria-hidden="true" />}

              <header className="club-tier-stage" style={{ background: plan.gradientCss }}>
                <div className="club-tier-stage__top">
                  <div>
                    <span className="club-tier-level">{plan.levelLabel}</span>
                    <h3 style={{ color: '#ffffff', marginBlockStart: '0.2rem' }}>{plan.name}</h3>
                  </div>
                  <div className="club-tier-emblem" aria-hidden="true">
                    <Icon name={plan.icon} filled size={24} />
                  </div>
                </div>

                <p style={{ color: 'rgb(255 255 255 / 0.9)' }}>{plan.tagline}</p>

                <div>
                  <div className="club-tier-price-row">
                    <strong className="club-tier-price">{formatBrlFromCents(priceCents)}</strong>
                    <span style={{ fontSize: '0.88rem', color: 'rgb(255 255 255 / 0.9)' }}>
                      / {cycle === 'mensal' ? 'mês' : 'semestre'}
                    </span>
                  </div>
                  {cycle === 'semestral' && (
                    <span style={{ fontSize: '0.78rem', color: 'rgb(255 255 255 / 0.84)', display: 'block', marginBlockStart: '0.2rem' }}>
                      Equivalente a {formatBrlFromCents(monthlyEquivalent)}/mês
                    </span>
                  )}
                </div>
              </header>

              <div className="club-tier-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="club-perk-count">{plan.perks.length} benefícios incluídos</span>
                  {isCurrent && <span className="m3-badge m3-badge--success">Ativo agora</span>}
                </div>

                <ul className="club-perk-list">
                  {plan.perks.map((perk) => (
                    <li
                      key={perk.text}
                      className="club-perk-item"
                      data-highlight={perk.isNewAtTier ? 'true' : 'false'}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          color: perk.isNewAtTier
                            ? plan.tier === 'lendario'
                              ? '#9c7206'
                              : plan.themeColor
                            : 'var(--md-sys-color-primary)',
                          display: 'inline-flex',
                          paddingBlockStart: '0.1rem',
                        }}
                      >
                        <Icon name={perk.isNewAtTier ? perk.icon : 'check_circle'} filled={perk.isNewAtTier} size={18} />
                      </span>
                      <span>{perk.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="club-tier-footer">
                <button
                  type="button"
                  className="m3-btn btn-primary-25d"
                  style={{
                    inlineSize: '100%',
                    backgroundColor: plan.themeColor,
                    color: plan.tier === 'lendario' ? '#1f1600' : '#ffffff',
                  }}
                  disabled={submittingTier === plan.tier}
                  onClick={() => handleSubscribe(plan.tier)}
                >
                  <Icon name={isCurrent ? 'autorenew' : 'workspace_premium'} size={18} />
                  <span>
                    {submittingTier === plan.tier
                      ? 'Processando...'
                      : isCurrent
                        ? `Renovar / Trocar ciclo`
                        : `Assinar ${plan.name}`}
                  </span>
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      {/* Tabela Comparativa Completa (Desktop tabela + Mobile cards responsivos) */}
      <article className="m3-card" style={{ display: 'grid', gap: '1.15rem' }}>
        <div>
          <h2>Compare todos os níveis lado a lado</h2>
          <p className="text-muted">
            Visualize exatamente quais benefícios são desbloqueados à medida que você sobe de nível no Clube.
          </p>
        </div>

        <div tabIndex={0} role="region" aria-label="Comparação completa dos planos do Clube CAMBLU" className="table-wrapper club-compare-desktop">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Benefício / Vantagem</th>
                <th style={{ color: '#22a06b' }}>Comum</th>
                <th style={{ color: '#3b82f7' }}>Raro</th>
                <th style={{ color: '#7c3aed' }}>Épico</th>
                <th style={{ color: '#9c7206' }}>Lendário</th>
              </tr>
            </thead>
            <tbody>
              {CLUB_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <th>{row.feature}</th>
                  {(['comum', 'raro', 'epico', 'lendario'] as const).map((tierKey, colIdx) => {
                    const cell = row[tierKey];
                    const planColor = CLUB_PLANS[colIdx].themeColor;
                    return (
                      <td key={tierKey}>
                        {typeof cell === 'string' ? (
                          <strong style={{ color: planColor }}>{cell}</strong>
                        ) : cell ? (
                          <span style={{ color: planColor, display: 'inline-flex', alignItems: 'center' }} aria-label="Incluído">
                            <Icon name="check_circle" filled size={20} />
                          </span>
                        ) : (
                          <span className="text-muted" aria-label="Não incluído">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="club-compare-mobile" aria-label="Comparação dos planos no celular">
          {CLUB_COMPARISON_ROWS.map((row) => (
            <div key={row.feature} className="m3-card m3-card--tonal" style={{ padding: '0.9rem', display: 'grid', gap: '0.6rem' }}>
              <strong style={{ fontSize: '0.92rem' }}>{row.feature}</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.45rem' }}>
                {(['comum', 'raro', 'epico', 'lendario'] as const).map((tierKey, colIdx) => {
                  const cell = row[tierKey];
                  const planInfo = CLUB_PLANS[colIdx];
                  return (
                    <div
                      key={tierKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.35rem',
                        padding: '0.35rem 0.55rem',
                        borderRadius: 'var(--md-sys-shape-corner-sm)',
                        background: 'var(--md-sys-color-surface-container-lowest)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: planInfo.themeColor }}>{planInfo.name}</span>
                      {typeof cell === 'string' ? (
                        <strong style={{ color: planInfo.themeColor }}>{cell}</strong>
                      ) : cell ? (
                        <Icon name="check_circle" filled size={16} className="m3-badge--blue" />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Bloco Final: Cartão Digital + Parcerias */}
      <div className="grid-two">
        <article className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gap: '0.55rem', flex: '1 1 16rem' }}>
            <h2>Carteirinha de Estudante Digital</h2>
            <p style={{ color: '#dceddf' }}>
              Disponível a partir do Plano Comum: sua carteirinha muda de cor conforme seu nível e gera QR Code com validação pública de autenticidade, foto, curso, instituição (FURB), turma e CPF.
            </p>
            <div style={{ paddingBlockStart: '0.25rem' }}>
              <Link to="/clube/cartao" className="m3-btn m3-btn--gold">
                <Icon name="badge" size={18} />
                <span>Visualizar Minha Carteirinha</span>
              </Link>
            </div>
          </div>
          <CambluCrest size={82} variant="clean" />
        </article>

        <article className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.6rem', alignContent: 'center' }}>
          <h2>Parcerias Spaiq & Gorit PRO</h2>
          <p className="text-muted">
            Assinantes ativos do Clube CAMBLU (a partir do nível Raro) têm acesso programado às vantagens de estudo nas plataformas parceiras Spaiq e Gorit PRO vinculadas ao Centro Acadêmico.
          </p>
        </article>
      </div>
    </section>
  );
}
