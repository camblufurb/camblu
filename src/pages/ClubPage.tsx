import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';
import { SponsorsStrip } from '../components/SponsorLogos';
import { CLUB_PLANS, getPlanPriceCents } from '../lib/clubPricing';
import { formatBrlFromCents } from '../lib/validators';
import { API_BASE_URL, getAuthHeaders } from '../lib/firebase';
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
        const res = await fetch(`${API_BASE_URL}/checkout/membership`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            tier,
            cycle,
          }),
        });
        if (!res.ok) throw new Error('Falha ao iniciar assinatura.');
        const data = (await res.json()) as { checkoutUrl?: string };
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      await updateMembershipLocal(tier, cycle);
      notify(`Assinatura Clube CAMBLU ${tier.toUpperCase()} (${cycle}) ativada!`);
    } catch {
      notify('Não foi possível iniciar a assinatura.', 'error');
    } finally {
      setSubmittingTier(null);
    }
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Clube CAMBLU</h1>
          <p style={{ color: '#dceddf' }}>
            Planos mensais no cartão ou carteiras digitais e semestrais via PIX ou Cartão, com benefícios em eventos,
            lojinha e parceiros da Medicina FURB.
          </p>
        </div>
        <Link to="/clube/cartao" className="m3-btn m3-btn--gold">
          <Icon name="badge" size={19} />
          <span>Abrir Cartão de Membro</span>
        </Link>
      </div>

      {/* Seletor Mensal x Semestral */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <button
          type="button"
          className={`m3-btn ${cycle === 'mensal' ? 'm3-btn--filled' : 'm3-btn--outlined'}`}
          onClick={() => setCycle('mensal')}
        >
          <Icon name="autorenew" size={18} />
          <span>Mensal (Recorrente Cartão / Apple & Google Pay)</span>
        </button>
        <button
          type="button"
          className={`m3-btn ${cycle === 'semestral' ? 'm3-btn--filled' : 'm3-btn--outlined'}`}
          onClick={() => setCycle('semestral')}
        >
          <Icon name="qr_code" size={18} />
          <span>Semestral (Compra única Cartão, Wallets ou PIX)</span>
        </button>
      </div>

      {/* Cards dos 4 Planos */}
      <div className="grid-cards">
        {CLUB_PLANS.map((plan) => {
          const priceCents = getPlanPriceCents(plan.tier, cycle);
          const isCurrent = profile?.membershipActive && profile.membershipTier === plan.tier;
          return (
            <article
              key={plan.tier}
              className="m3-card m3-card--interactive"
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'grid',
                gap: '1rem',
                alignContent: 'space-between',
                borderColor: plan.themeColor,
                borderWidth: plan.shimmer ? '2px' : '1.5px',
                background: plan.shimmer
                  ? 'linear-gradient(145deg, color-mix(in oklab, var(--camblu-gold-500) 22%, var(--md-sys-color-surface-container-lowest)), var(--md-sys-color-surface-container-lowest))'
                  : undefined,
              }}
            >
              {plan.shimmer && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background:
                      'linear-gradient(105deg, transparent 35%, rgb(255 245 190 / 0.45) 50%, transparent 65%)',
                    animation: 'm3-shimmer-sweep 3.2s infinite linear',
                  }}
                />
              )}

              <div style={{ display: 'grid', gap: '0.75rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    className="m3-badge"
                    style={{ background: plan.themeColor, color: '#ffffff' }}
                  >
                    {plan.name}
                  </span>
                  {isCurrent && <span className="m3-badge m3-badge--success">Plano Atual</span>}
                </div>

                <div>
                  <strong style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.1rem)', color: 'var(--md-sys-color-on-surface)' }}>
                    {formatBrlFromCents(priceCents)}
                  </strong>
                  <span className="m3-body-medium"> / {cycle === 'mensal' ? 'mês' : 'semestre'}</span>
                </div>

                <ul style={{ margin: 0, paddingInlineStart: '1.15rem', display: 'grid', gap: '0.45rem', fontSize: '0.92rem' }}>
                  {plan.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="m3-btn"
                style={{
                  background: plan.themeColor,
                  color: '#ffffff',
                  position: 'relative',
                }}
                disabled={submittingTier === plan.tier}
                onClick={() => handleSubscribe(plan.tier)}
              >
                <Icon name={isCurrent ? 'check_circle' : 'workspace_premium'} size={18} />
                <span>
                  {submittingTier === plan.tier
                    ? 'Abrindo checkout...'
                    : isCurrent
                      ? 'Renovar / Alterar Ciclo'
                      : `Assinar ${plan.name}`}
                </span>
              </button>
            </article>
          );
        })}
      </div>

      {/* Benefícios de Parceiros */}
      <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.65rem' }}>
        <span className="m3-label-small" style={{ color: 'var(--camblu-action-blue)' }}>
          Parcerias Acadêmicas
        </span>
        <h2>Benefícios Spaiq & Gorit PRO</h2>
        <p className="text-muted">
          Assinantes ativos do Clube CAMBLU (a partir do plano Comum) contam com condições e benefícios de estudo nas
          plataformas parceiras Spaiq e Gorit PRO vinculadas ao nosso programa estudantil.
        </p>
      </div>

      <SponsorsStrip />
    </section>
  );
}
