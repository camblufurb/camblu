import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { computePromotionProgress } from '../lib/clubPromotions';
import { API_BASE_URL, isFirebaseConfigured } from '../lib/firebase';
import type { ClubPromotion, ClubPromotionTurmaProgress } from '../types/domain';

interface PromotionApiResponse {
  promotion: Pick<
    ClubPromotion,
    'id' | 'title' | 'startDate' | 'goalCount' | 'turmas' | 'prizeName' | 'isTshirtPrize'
  >;
  leaderboard: ClubPromotionTurmaProgress[];
  updatedAt: string;
}

export function ClubPromotionPage() {
  const { promoId = '' } = useParams();
  const { clubPromotions, adminMembers } = useAppData();

  const [apiData, setApiData] = useState<PromotionApiResponse | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadFromApi = useCallback(async () => {
    if (!isFirebaseConfigured || !promoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/clube/promocao/${encodeURIComponent(promoId)}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'Promoção não encontrada.');
      }
      const data = (await res.json()) as PromotionApiResponse;
      setApiData(data);
    } catch (err) {
      setError((err as Error).message || 'Não foi possível carregar o progresso.');
    } finally {
      setLoading(false);
    }
  }, [promoId]);

  useEffect(() => {
    void loadFromApi();
  }, [loadFromApi]);

  const demoFallback = useMemo<PromotionApiResponse | null>(() => {
    if (isFirebaseConfigured) return null;
    const found = clubPromotions.find((p) => p.id === promoId);
    if (!found) return null;
    const progress = computePromotionProgress(found, adminMembers);
    return {
      promotion: found,
      leaderboard: progress.map(({ turma, count, goalCount, percent, goalReached }) => ({
        turma,
        count,
        goalCount,
        percent,
        goalReached,
      })),
      updatedAt: new Date().toISOString(),
    };
  }, [clubPromotions, adminMembers, promoId]);

  const data = isFirebaseConfigured ? apiData : demoFallback;

  if (loading && !data) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '46rem', marginInline: 'auto', textAlign: 'center', padding: '2.5rem' }}>
          <Icon name="hourglass_top" size={40} className="m3-badge--blue" />
          <h1 style={{ marginBlockStart: '0.75rem' }}>Carregando progresso das turmas...</h1>
          <p className="text-muted">Consultando assinaturas do Clube CAMBLU.</p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '42rem', marginInline: 'auto', textAlign: 'center', padding: '2.5rem', display: 'grid', gap: '1rem', justifyItems: 'center' }}>
          <Icon name="search_off" size={44} className="m3-badge--error" />
          <h1>Promoção não encontrada</h1>
          <p className="text-muted">
            {error || 'Verifique se o link da promoção por turma está correto ou se ela ainda está ativa.'}
          </p>
          <Link to="/clube" className="m3-btn m3-btn--blue">
            <Icon name="workspace_premium" size={18} />
            <span>Conhecer o Clube CAMBLU</span>
          </Link>
        </div>
      </section>
    );
  }

  const { promotion, leaderboard, updatedAt } = data;
  const formattedStartDate = promotion.startDate
    ? new Date(`${promotion.startDate}T12:00:00`).toLocaleDateString('pt-BR')
    : '—';

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.5rem', maxInlineSize: '58rem' }}>
      <header
        className="m3-card m3-card--tonal"
        style={{
          display: 'grid',
          gap: '1rem',
          borderTop: '4px solid var(--camblu-action-blue)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <span className="m3-badge m3-badge--blue" style={{ justifySelf: 'start' }}>
              <Icon name="emoji_events" size={16} />
              <span>Competição Clube CAMBLU</span>
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.15rem)' }}>{promotion.title}</h1>
            <p className="text-muted">
              Assinaturas válidas realizadas a partir de <strong>{formattedStartDate}</strong> · Meta:{' '}
              <strong>{promotion.goalCount} assinaturas</strong> por turma.
            </p>
          </div>

          {isFirebaseConfigured && (
            <button
              type="button"
              className="m3-btn m3-btn--outlined"
              onClick={() => void loadFromApi()}
              disabled={loading}
            >
              <Icon name="refresh" size={18} />
              <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            background: 'var(--md-sys-color-surface, #ffffff)',
            border: '1px solid var(--md-sys-color-outline-variant, rgba(15, 23, 42, 0.12))',
          }}
        >
          <span style={{ color: 'var(--camblu-action-blue)', display: 'inline-flex' }}>
            <Icon name={promotion.isTshirtPrize ? 'checkroom' : 'redeem'} size={24} />
          </span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }} className="text-muted">
              PRÊMIO AO BATER A META
            </div>
            <strong style={{ fontSize: '1.05rem' }}>{promotion.prizeName}</strong>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '0.9rem' }}>
        {leaderboard.map((entry, idx) => {
          const remaining = Math.max(0, entry.goalCount - entry.count);
          return (
            <article
              key={entry.turma}
              className="m3-card"
              style={{
                display: 'grid',
                gap: '0.75rem',
                border: entry.goalReached ? '2px solid rgba(22, 163, 74, 0.45)' : undefined,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span
                    className={`m3-badge ${idx === 0 ? 'm3-badge--gold' : 'm3-badge--blue'}`}
                    style={{ fontSize: '0.88rem', paddingInline: '0.75rem' }}
                  >
                    {idx + 1}º Lugar
                  </span>
                  <h2 style={{ fontSize: '1.25rem' }}>Turma {entry.turma}</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>
                    {entry.count} / {entry.goalCount}
                  </strong>
                  <span className={`m3-badge ${entry.goalReached ? 'm3-badge--success' : 'm3-badge--blue'}`}>
                    {entry.goalReached ? 'Meta batida!' : `${entry.percent}%`}
                  </span>
                </div>
              </div>

              <div className="promo-progress-track" role="progressbar" aria-valuenow={entry.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso da Turma ${entry.turma}`}>
                <div
                  className={`promo-progress-fill ${entry.goalReached ? 'promo-progress-fill--goal' : ''}`}
                  style={{ inlineSize: `${entry.percent}%` }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }} className="text-muted">
                <span>
                  {entry.goalReached
                    ? 'Parabéns! A turma já garantiu o prêmio ao atingir a meta.'
                    : `Faltam ${remaining} assinatura${remaining === 1 ? '' : 's'} para bater a meta.`}
                </span>
                <span>{entry.percent}%</span>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="m3-card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <strong>Quer ajudar sua turma a subir no ranking?</strong>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            Assine o Clube CAMBLU com sua conta vinculada à sua turma da Medicina FURB. Atualizado em{' '}
            {new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
          </span>
        </div>
        <Link to="/clube" className="m3-btn m3-btn--blue">
          <Icon name="workspace_premium" size={18} />
          <span>Assinar Clube CAMBLU</span>
        </Link>
      </footer>
    </section>
  );
}
