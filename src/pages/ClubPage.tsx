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
  const { profile, signInWithGoogle, updateMembershipLocal, isDemoMode, allDemoUsers } = useAuth();
  const { notify } = useToast();
  const [cycle, setCycle] = useState<MembershipCycle>('mensal');
  const [submittingTier, setSubmittingTier] = useState<string | null>(null);
  const [apiQuery, setApiQuery] = useState('52998224725');
  const [apiResult, setApiResult] = useState<string>('');

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
        if (!res.ok) throw new Error('Falha ao iniciar assinatura Stripe.');
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

  const testClubApi = async () => {
    const clean = apiQuery.trim();
    if (!clean) return;
    const param = clean.includes('@') ? `email=${encodeURIComponent(clean)}` : `cpf=${encodeURIComponent(clean.replace(/\D+/g, ''))}`;
    if (!isDemoMode) {
      try {
        const res = await fetch(`${API_BASE_URL}/clube/status?${param}`);
        const data = await res.json();
        setApiResult(JSON.stringify(data, null, 2));
        return;
      } catch {
        // fall through to demo simulation
      }
    }

    const found = allDemoUsers.find(
      (u) => u.email.toLowerCase() === clean.toLowerCase() || u.cpf === clean.replace(/\D+/g, ''),
    );
    const payload = found
      ? {
          active: found.membershipActive,
          tier: found.membershipActive ? found.membershipTier : 'none',
          validUntil: found.membershipValidUntil || null,
        }
      : { active: false, tier: 'none', validUntil: null };
    setApiResult(JSON.stringify(payload, null, 2));
  };

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '2rem' }}>
      <div className="m3-card m3-card--forest" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ maxInlineSize: '46rem' }}>
          <span className="m3-badge m3-badge--gold" style={{ marginBlockEnd: '0.65rem' }}>
            <Icon name="workspace_premium" size={16} />
            Apoie o Centro Acadêmico & Ganhe Vantagens
          </span>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>Clube CAMBLU</h1>
          <p style={{ color: '#dceddf' }}>
            Planos flexíveis com cobrança recorrente mensal (Cartão / Google & Apple Pay) ou semestral única (Cartão,
            Google/Apple Pay ou PIX). Toda taxa Stripe já está inclusa.
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

      {/* Integração Spaiq & Gorit PRO + API Pública */}
      <div className="grid-two">
        <div className="m3-card m3-card--tonal" style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
          <span className="m3-badge m3-badge--blue" style={{ justifySelf: 'start' }}>
            Em breve · Integração final
          </span>
          <h2>Parceria Spaiq & Gorit PRO</h2>
          <p className="text-muted">
            Todos os planos ativos do Clube CAMBLU (a partir do Comum) dão acesso aos benefícios integrados do Spaiq e
            Gorit PRO. O módulo de vinculação automática será conectado na etapa final junto com os parceiros usando a
            API aberta abaixo.
          </p>
        </div>

        <div className="m3-card" style={{ display: 'grid', gap: '0.85rem' }}>
          <span className="m3-badge" style={{ justifySelf: 'start' }}>
            API Aberta para Desenvolvedores (Item 4.2)
          </span>
          <h2>Consultar Nível do Membro</h2>
          <p className="text-muted">
            Endpoint REST aberto retornando exclusivamente status não sensível (<code>active</code>,{' '}
            <code>tier</code> e <code>validUntil</code>) via CPF ou e-mail:
          </p>
          <code
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--md-sys-shape-corner-sm)',
              background: 'var(--md-sys-color-surface-container)',
              fontSize: '0.82rem',
              overflowX: 'auto',
            }}
          >
            GET /api/clube/status?cpf=00000000000
          </code>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="m3-input"
              style={{ flex: '1 1 13rem' }}
              aria-label="CPF ou e-mail para testar API do Clube"
              value={apiQuery}
              onChange={(e) => setApiQuery(e.target.value)}
              placeholder="CPF (ex.: 52998224725) ou e-mail"
            />
            <button type="button" className="m3-btn m3-btn--blue" onClick={testClubApi}>
              <Icon name="api" size={18} />
              <span>Testar Resposta</span>
            </button>
          </div>

          {apiResult && (
            <pre
              style={{
                margin: 0,
                padding: '0.75rem',
                borderRadius: 'var(--md-sys-shape-corner-sm)',
                background: '#071b13',
                color: '#edd16e',
                fontSize: '0.82rem',
                overflowX: 'auto',
              }}
            >
              {apiResult}
            </pre>
          )}
        </div>
      </div>

      <SponsorsStrip />
    </section>
  );
}
