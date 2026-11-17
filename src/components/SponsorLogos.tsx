import { useI18n } from '../i18n/i18n';

interface SponsorsStripProps {
  variant?: 'surface' | 'dark';
  compact?: boolean;
}

export function CambluCrest({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Brasão do CAMBLU"
      style={{ flexShrink: 0 }}
    >
      <rect width="64" height="64" rx="18" fill="#0f3325" />
      <rect x="5" y="5" width="54" height="54" rx="14" fill="none" stroke="#edd16e" strokeWidth="2.5" />
      <path
        d="M32 14v36M22 24c4-4 16-4 20 0M24 38c3 4 13 4 16 0"
        fill="none"
        stroke="#edd16e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="14" r="3.5" fill="#f1de97" />
      <path
        d="M26 28c6 3 12 3 12 9s-6 6-12 9"
        fill="none"
        stroke="#f1de97"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SponsorsStrip({ variant = 'surface', compact = false }: SponsorsStripProps) {
  const { t } = useI18n();
  const isDark = variant === 'dark';
  const textColor = isDark ? '#e6efe9' : 'var(--md-sys-color-on-surface)';
  const mutedColor = isDark ? '#b9cec2' : 'var(--md-sys-color-on-surface-variant)';

  return (
    <aside
      aria-label={t('sponsors.label')}
      className={`sponsors-strip ${isDark ? 'sponsors-strip--dark' : ''}`}
      style={{ paddingBlock: compact ? '0.75rem' : '1rem' }}
    >
      <span
        className="m3-label-small"
        style={{ color: mutedColor, marginInlineEnd: '0.5rem' }}
      >
        {t('sponsors.label')}
      </span>

      {/* Unicred */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          border: `1px solid ${isDark ? 'rgb(255 255 255 / 0.14)' : 'var(--md-sys-color-outline-variant)'}`,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#006b3f" />
          <path d="M8 7v6a4 4 0 0 0 8 0V7" fill="none" stroke="#edd16e" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 750, fontSize: '0.88rem', color: textColor }}>Unicred</span>
      </div>

      {/* Fruki */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          border: `1px solid ${isDark ? 'rgb(255 255 255 / 0.14)' : 'var(--md-sys-color-outline-variant)'}`,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#0f5c35" />
          <circle cx="12" cy="12" r="5.5" fill="#edd16e" />
          <path d="M12 5c2 0 4 2 4 4" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 750, fontSize: '0.88rem', color: textColor }}>Fruki</span>
      </div>

      {/* Balsaneli Contabilidade */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          border: `1px solid ${isDark ? 'rgb(255 255 255 / 0.14)' : 'var(--md-sys-color-outline-variant)'}`,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#174936" />
          <path d="M7 16V11M12 16V8M17 16V10" stroke="#edd16e" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: textColor }}>
          Balsaneli Contabilidade
        </span>
      </div>
    </aside>
  );
}
