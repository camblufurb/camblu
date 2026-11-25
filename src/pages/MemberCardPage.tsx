import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { CLUB_PLANS, getMembershipTierCode } from '../lib/clubPricing';
import {
  buildMemberCardValidationUrl,
  getMemberCardAppearance,
  resolveMemberPhotoUrl,
  tiltFromDeviceOrientation,
  tiltFromPointer,
  type CardTilt,
} from '../lib/memberCard';
import { Icon } from '../components/Icon';
import { AnimatedClimateTitle } from '../components/AnimatedClimateTitle';
import { logError, logInfo } from '../lib/logger';

interface DeviceOrientationConstructorWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const NEUTRAL_TILT: CardTilt = { x: 0, y: 0 };

/**
 * Interactive digital Clube CAMBLU membership card with Google avatar, validation QR,
 * and continuous device motion / pointer holographic shimmer.
 */
export function MemberCardPage() {
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const [tilt, setTilt] = useState<CardTilt>(NEUTRAL_TILT);
  const [qrUrl, setQrUrl] = useState('');
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  const rafRef = useRef<number | null>(null);
  const pendingTiltRef = useRef<CardTilt>(NEUTRAL_TILT);

  const photoUrl = resolveMemberPhotoUrl(profile);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [photoUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setTilt(NEUTRAL_TILT);
      }
    };
    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);
    return () => mediaQuery.removeEventListener('change', syncPreference);
  }, []);

  const isWithinValidity =
    !profile?.membershipValidUntil || new Date(profile.membershipValidUntil).getTime() > Date.now();
  const isCardActive = Boolean(
    profile && isWithinValidity && getMembershipTierCode(profile.membershipTier, profile.membershipActive) >= 1,
  );

  useEffect(() => {
    if (!profile || !isCardActive) {
      setQrUrl('');
      return;
    }
    const verifyUrl = buildMemberCardValidationUrl(profile.uid);
    logInfo('Cartao', 'Gerando QR Code de validação da carteirinha', {
      uid: profile.uid,
      verifyUrl,
    });
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: '#0f3325', light: '#ffffff' } })
      .then(setQrUrl)
      .catch((err) => logError('Cartao', 'MemberCardPage -> QRCode.toDataURL', err));
  }, [isCardActive, profile]);

  const scheduleTilt = useCallback(
    (next: CardTilt) => {
      if (prefersReducedMotion) return;
      pendingTiltRef.current = next;
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        setTilt(pendingTiltRef.current);
      });
    },
    [prefersReducedMotion],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const next = tiltFromDeviceOrientation(event.gamma, event.beta);
      if (next) {
        scheduleTilt(next);
      }
    };

    const attachOrientation = () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    };

    attachOrientation();

    // iOS 13+ Safari unlocks DeviceOrientationEvent only after a user gesture.
    // Unlock silently on the first interaction anywhere without showing a toggle button.
    const devOriCtor = (
      typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined
    ) as DeviceOrientationConstructorWithPermission | undefined;

    let unlockedOnIos = false;
    const unlockIosSensor = async () => {
      if (unlockedOnIos || typeof devOriCtor?.requestPermission !== 'function') return;
      unlockedOnIos = true;
      window.removeEventListener('pointerdown', unlockIosSensor, true);
      window.removeEventListener('touchend', unlockIosSensor, true);
      try {
        const permission = await devOriCtor.requestPermission();
        if (permission === 'granted') {
          attachOrientation();
        }
      } catch {
        // Retry allowed on a subsequent touch/click if the browser rejected a non-gesture event
        unlockedOnIos = false;
      }
    };

    if (typeof devOriCtor?.requestPermission === 'function') {
      window.addEventListener('pointerdown', unlockIosSensor, { capture: true, passive: true });
      window.addEventListener('touchend', unlockIosSensor, { capture: true, passive: true });
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('pointerdown', unlockIosSensor, true);
      window.removeEventListener('touchend', unlockIosSensor, true);
    };
  }, [prefersReducedMotion, scheduleTilt]);

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card page-hero-card" style={{ maxInlineSize: '42rem', marginInline: 'auto', textAlign: 'center', display: 'grid', gap: '1.1rem', justifyItems: 'center' }}>
          <AnimatedClimateTitle tone="primary" align="center" accessibleHeading="Carteirinha Digital — Clube CAMBLU">
            CARTEIRINHA
          </AnimatedClimateTitle>
          <p className="page-hero-desc page-hero-desc--on-light" style={{ marginInline: 'auto' }}>
            Entre com sua conta Google para exibir seu cartão interativo na cor do seu plano.
          </p>
          <button
            type="button"
            className="m3-btn m3-btn--blue"
            onClick={() => signInWithGoogle(isDemoMode ? 'student' : undefined)}
          >
            <Icon name="login" size={18} />
            <span>Entrar com Google</span>
          </button>
        </div>
      </section>
    );
  }

  const plan = CLUB_PLANS.find((p) => p.tier === profile.membershipTier);
  const appearance = getMemberCardAppearance(plan?.tier, profile.membershipActive);
  const avatarInitial = profile.name.trim().charAt(0).toUpperCase() || 'C';
  const validationPath = `/clube/cartao/validar/${encodeURIComponent(profile.uid)}`;
  const missingAcademicFields =
    profile.affiliation === 'FURB' && (!profile.cpf?.trim() || !profile.turma?.trim());

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxInlineSize: '46rem', inlineSize: '100%' }}>
        <AnimatedClimateTitle tone="primary" align="center" accessibleHeading="Carteirinha de Estudante Digital — Clube CAMBLU">
          CARTEIRINHA
        </AnimatedClimateTitle>
      </div>

      {isCardActive && plan ? (
        <>
          <article
            className="member-card"
            onPointerMove={(e) => {
              if (prefersReducedMotion || e.pointerType === 'touch') return;
              scheduleTilt(tiltFromPointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()));
            }}
            onPointerLeave={(e) => {
              if (prefersReducedMotion || e.pointerType === 'touch') return;
              scheduleTilt(NEUTRAL_TILT);
            }}
            style={{
              background: appearance.background,
              color: appearance.foreground,
              transform: prefersReducedMotion
                ? 'none'
                : `perspective(900px) rotateY(${tilt.x * 0.45}deg) rotateX(${-tilt.y * 0.45}deg)`,
            }}
          >
            <div
              aria-hidden="true"
              className="member-card__shimmer"
              style={{
                transform: prefersReducedMotion
                  ? 'none'
                  : `translate3d(${tilt.x * 1.15}%, ${tilt.y * 1.15}%, 0)`,
              }}
            />

            <div className="member-card__top">
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
                  {profile.affiliation === 'FURB'
                    ? 'Carteirinha de Estudante · Medicina FURB'
                    : 'Cartão de membro externo'}
                </span>
                <strong style={{ fontSize: 'clamp(1.05rem, 3.2vw, 1.25rem)' }}>
                  {`Membro ${plan.name}`}
                </strong>
              </div>
              {profile.affiliation === 'FURB' && profile.enrollmentSummaryUrl?.trim() ? (
                <Icon
                  name="verified"
                  variant="outlined"
                  size={24}
                  className="member-card__verified-icon"
                  label="Matrícula verificada"
                />
              ) : null}
            </div>

            <div className="member-card__footer">
              <div className="member-card__identity">
                <div
                  className="member-card__avatar"
                  style={{
                    border: `2px solid ${appearance.avatarRing}`,
                    background: appearance.avatarFallbackBg,
                    color: appearance.foreground,
                  }}
                >
                  {photoUrl && !photoLoadError ? (
                    <img
                      className="member-card__avatar-img"
                      src={photoUrl}
                      alt={`Foto da conta Google de ${profile.name}`}
                      referrerPolicy="no-referrer"
                      onError={() => setPhotoLoadError(true)}
                    />
                  ) : (
                    <span aria-hidden="true">{avatarInitial}</span>
                  )}
                </div>

                <div className="member-card__identity-meta">
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 'clamp(0.96rem, 2.8vw, 1.08rem)',
                      lineHeight: 1.2,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {profile.name}
                  </strong>
                  <span style={{ fontSize: '0.82rem', opacity: 0.92, display: 'block' }}>
                    {profile.affiliation === 'FURB' ? `FURB · Medicina · Turma ${profile.turma || '—'}` : 'Externo'}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                    {profile.membershipValidUntil
                      ? `Válido até ${new Date(profile.membershipValidUntil).toLocaleDateString('pt-BR')}`
                      : `Plano ${plan.name} ativo`}
                  </span>
                </div>
              </div>

              {qrUrl && (
                <Link
                  to={validationPath}
                  aria-label="Abrir página de validação pública da carteirinha de estudante"
                  title="Abrir página de validação do QR Code"
                  style={{ display: 'inline-flex', borderRadius: '0.65rem' }}
                >
                  <img
                    className="member-card__qr"
                    src={qrUrl}
                    alt="QR Code de validação da Carteirinha de Estudante CAMBLU"
                    width={72}
                    height={72}
                  />
                </Link>
              )}
            </div>
          </article>

          {missingAcademicFields && (
            <div
              className="m3-card m3-card--tonal"
              style={{ maxInlineSize: '34rem', inlineSize: '100%', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
            >
              <span className="m3-badge m3-badge--gold" aria-hidden="true">
                <Icon name="warning" size={18} />
              </span>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                Complete seu <strong>CPF e número da turma</strong> em{' '}
                <Link to="/perfil" style={{ fontWeight: 700, color: 'var(--camblu-action-blue)' }}>
                  Meu Perfil
                </Link>{' '}
                para que a validação da carteirinha exiba todos os seus dados completos.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/clube" className="m3-btn m3-btn--filled">
              <Icon name="upgrade" size={18} />
              <span>Gerenciar / Fazer Upgrade do Plano</span>
            </Link>
            <Link to={validationPath} className="m3-btn m3-btn--outlined">
              <Icon name="qr_code_scanner" size={18} />
              <span>Validar Carteirinha (Link do QR)</span>
            </Link>
          </div>
        </>
      ) : (
        <Link
          to="/clube"
          className="member-card-empty-link"
          aria-label="Assinar o Clube CAMBLU para liberar sua Carteirinha de Estudante Digital"
        >
          <article className="member-card member-card--empty">
            <span className="member-card__plus" aria-hidden="true">
              <Icon name="add" size={34} />
            </span>
            <span className="member-card__empty-label">Assinar Clube CAMBLU</span>
            <span className="member-card__empty-hint">
              Libere sua Carteirinha de Estudante a partir do Plano Comum
            </span>
          </article>
        </Link>
      )}
    </section>
  );
}
