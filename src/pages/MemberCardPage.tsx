import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { CLUB_PLANS } from '../lib/clubPricing';
import { Icon } from '../components/Icon';

export function MemberCardPage() {
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      const x = Math.max(-18, Math.min(18, event.gamma));
      const y = Math.max(-18, Math.min(18, event.beta - 35));
      setTilt({ x, y });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [gyroEnabled]);

  const requestGyroPermission = async () => {
    const devOri = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof devOri.requestPermission === 'function') {
      const result = await devOri.requestPermission();
      setGyroEnabled(result === 'granted');
    } else {
      setGyroEnabled(true);
    }
  };

  if (!profile) {
    return (
      <section className="page-section container m3-reveal">
        <div className="m3-card" style={{ maxInlineSize: '36rem', marginInline: 'auto', textAlign: 'center' }}>
          <h1 className="m3-headline-medium" style={{ marginBlockEnd: '0.5rem' }}>
            Cartão de Membro Clube CAMBLU
          </h1>
          <p className="m3-body-medium" style={{ marginInline: 'auto', marginBlockEnd: '1rem' }}>
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
  const bgGradient = !profile.membershipActive || !plan
    ? 'linear-gradient(135deg, #2b3530, #141c18)'
    : plan.tier === 'comum'
      ? 'linear-gradient(135deg, #1a7a51, #26b879)'
      : plan.tier === 'raro'
        ? 'linear-gradient(135deg, #154399, #3b82f7)'
        : plan.tier === 'epico'
          ? 'linear-gradient(135deg, #4b1d95, #8b5cf6)'
          : 'linear-gradient(135deg, #735404, #edd16e 55%, #b8890e)';

  const shimmerX = 50 + tilt.x * 2.2;
  const shimmerY = 50 + tilt.y * 2.2;

  return (
    <section className="page-section container m3-reveal" style={{ display: 'grid', gap: '1.75rem', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxInlineSize: '40rem' }}>
        <h1>Cartão Digital do Membro</h1>
        <p className="m3-body-medium">
          Mova seu celular ou passe o ponteiro sobre o cartão para ativar o reflexo holográfico (shimmer) do seu nível.
        </p>
      </div>

      <div
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 26;
          const ry = ((e.clientY - rect.top) / rect.height - 0.5) * 26;
          setTilt({ x: rx, y: ry });
        }}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          inlineSize: 'min(100%, 27rem)',
          aspectRatio: '1.58 / 1',
          borderRadius: 'var(--md-sys-shape-corner-xl)',
          background: bgGradient,
          color: plan?.tier === 'lendario' ? '#1f1600' : '#ffffff',
          padding: '1.45rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--elevation-3)',
          transform: `perspective(900px) rotateY(${tilt.x * 0.45}deg) rotateX(${-tilt.y * 0.45}deg)`,
          transition: 'transform 160ms ease-out',
          display: 'grid',
          alignContent: 'space-between',
        }}
      >
        {/* Dynamic Shimmer Overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${shimmerX}% ${shimmerY}%, rgb(255 255 255 / 0.46), transparent 54%)`,
            mixBlendMode: 'overlay',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
              Clube CAMBLU · Medicina FURB
            </span>
            <strong style={{ fontSize: '1.25rem' }}>
              {profile.membershipActive && plan ? `Membro ${plan.name}` : 'Sem Plano Ativo'}
            </strong>
          </div>
          <Icon name="workspace_premium" filled size={32} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '0.75rem', position: 'relative' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>{profile.name}</strong>
            <span style={{ fontSize: '0.84rem', opacity: 0.9, display: 'block' }}>
              {profile.affiliation === 'FURB' ? `FURB · Turma ${profile.turma || '—'}` : 'Externo'}
            </span>
            <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>
              {profile.membershipValidUntil
                ? `Válido até ${new Date(profile.membershipValidUntil).toLocaleDateString('pt-BR')}`
                : 'Assine em /clube para ativar benefícios'}
            </span>
          </div>

          {qrUrl && (
            <img
              src={qrUrl}
              alt="QR de validação do Clube CAMBLU"
              width={72}
              height={72}
              style={{ borderRadius: '0.65rem', background: '#ffffff', padding: '0.2rem' }}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        <button type="button" className="m3-btn m3-btn--outlined" onClick={requestGyroPermission}>
          <Icon name="screen_rotation" size={18} />
          <span>Ativar Sensor de Movimento (iOS/Mobile)</span>
        </button>
        <Link to="/clube" className="m3-btn m3-btn--filled">
          <Icon name="upgrade" size={18} />
          <span>Gerenciar / Fazer Upgrade do Plano</span>
        </Link>
      </div>
    </section>
  );
}
