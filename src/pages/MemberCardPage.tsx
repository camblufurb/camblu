import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { CLUB_PLANS } from '../lib/clubPricing';
import {
  getMemberCardAppearance,
  resolveMemberPhotoUrl,
  tiltFromDeviceOrientation,
  tiltFromPointer,
  type CardTilt,
} from '../lib/memberCard';
import { Icon } from '../components/Icon';

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

  useEffect(() => {
    if (!profile) return;
    const payload = JSON.stringify({
      uid: profile.uid,
      tier: profile.membershipTier,
      active: profile.membershipActive,
    });
    QRCode.toDataURL(payload, { width: 180, margin: 1, color: { dark: '#0f3325', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => {});
  }, [profile]);

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
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center' }}>
          <h1 style={{ marginBlockEnd: '0.5rem' }}>
            Cartão de Membro Clube CAMBLU
          </h1>
          <p className="text-muted" style={{ marginInline: 'auto', marginBlockEnd: '1rem' }}>
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

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxInlineSize: '40rem' }}>
        <h1>Cartão Digital do Membro</h1>
      </div>

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
              : `translate3d(${tilt.x * 1.45}%, ${tilt.y * 1.45}%, 0)`,
          }}
        />

        <div className="member-card__top">
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
              Clube CAMBLU · Medicina FURB
            </span>
            <strong style={{ fontSize: 'clamp(1.05rem, 3.2vw, 1.25rem)' }}>
              {profile.membershipActive && plan ? `Membro ${plan.name}` : 'Sem Plano Ativo'}
            </strong>
          </div>
          <Icon name="workspace_premium" filled size={30} />
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
                {profile.affiliation === 'FURB' ? `FURB · Turma ${profile.turma || '—'}` : 'Externo'}
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                {profile.membershipValidUntil
                  ? `Válido até ${new Date(profile.membershipValidUntil).toLocaleDateString('pt-BR')}`
                  : 'Assine em /clube para ativar benefícios'}
              </span>
            </div>
          </div>

          {qrUrl && (
            <img
              className="member-card__qr"
              src={qrUrl}
              alt="QR de validação do Clube CAMBLU"
              width={72}
              height={72}
            />
          )}
        </div>
      </article>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        <Link to="/clube" className="m3-btn m3-btn--filled">
          <Icon name="upgrade" size={18} />
          <span>Gerenciar / Fazer Upgrade do Plano</span>
        </Link>
      </div>
    </section>
  );
}
