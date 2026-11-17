import { useI18n } from '../i18n/i18n';
import logoColorUrl from '../../assets/img/logo_color.png';
import logoCleanUrl from '../../assets/img/logo_clean.png';
import unicredUrl from '../../assets/img/unicred.png';
import frukiUrl from '../../assets/img/fruki.png';
import balsanelliUrl from '../../assets/img/balsanelli.png';

interface SponsorsStripProps {
  variant?: 'surface' | 'dark';
  compact?: boolean;
}

export function CambluCrest({
  size = 40,
  variant = 'color',
}: {
  size?: number;
  variant?: 'color' | 'clean';
}) {
  const src = variant === 'clean' ? logoCleanUrl : logoColorUrl;
  return (
    <img
      src={src}
      alt="Brasão Oficial do CAMBLU — Medicina FURB"
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      style={{
        inlineSize: `${size}px`,
        blockSize: `${size}px`,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
}

export function SponsorsStrip({ variant = 'surface', compact = false }: SponsorsStripProps) {
  const { t } = useI18n();
  const isDark = variant === 'dark';
  const mutedColor = isDark ? '#b9cec2' : 'var(--md-sys-color-on-surface-variant)';

  return (
    <aside
      aria-label={t('sponsors.label')}
      className={`sponsors-strip ${isDark ? 'sponsors-strip--dark' : ''}`}
      style={{ paddingBlock: compact ? '0.8rem' : '1.05rem' }}
    >
      <span
        className="m3-label-small"
        style={{ color: mutedColor, marginInlineEnd: '0.35rem' }}
      >
        {t('sponsors.label')}
      </span>

      {/* Unicred */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.45rem 0.9rem',
          borderRadius: '9999px',
          background: '#ffffff',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--elevation-1)',
          minBlockSize: '40px',
        }}
      >
        <img
          src={unicredUrl}
          alt="Unicred"
          width={114}
          height={21}
          loading="lazy"
          decoding="async"
          style={{ inlineSize: 'auto', blockSize: '20px', objectFit: 'contain' }}
        />
      </div>

      {/* Fruki Bebidas */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.45rem 0.9rem',
          borderRadius: '9999px',
          background: '#ffffff',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--elevation-1)',
          minBlockSize: '40px',
        }}
      >
        <img
          src={frukiUrl}
          alt="Fruki Bebidas"
          width={136}
          height={21}
          loading="lazy"
          decoding="async"
          style={{ inlineSize: 'auto', blockSize: '21px', objectFit: 'contain' }}
        />
      </div>

      {/* Balsaneli Contabilidade */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.3rem 0.9rem 0.3rem 0.45rem',
          borderRadius: '9999px',
          background: '#142a22',
          color: '#ffffff',
          border: '1px solid rgb(237 209 110 / 0.35)',
          boxShadow: 'var(--elevation-1)',
          minBlockSize: '40px',
        }}
      >
        <img
          src={balsanelliUrl}
          alt="Balsaneli Contabilidade"
          width={28}
          height={27}
          loading="lazy"
          decoding="async"
          style={{ inlineSize: '28px', blockSize: '27px', objectFit: 'contain' }}
        />
        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f1de97', whiteSpace: 'nowrap' }}>
          Balsaneli Contabilidade
        </span>
      </div>
    </aside>
  );
}
