import { useState } from 'react';
import { useI18n } from '../i18n/i18n';
import logoColorUrl from '../../assets/logos/logo_color.png';
import logoCleanUrl from '../../assets/logos/logo_clean.png';
import unicredUrl from '../../assets/logos/unicred.png';
import frukiUrl from '../../assets/logos/fruki.png';
import balsanelliUrl from '../../assets/logos/balsanelli.png';

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

/**
 * Displays institutional partner and sponsor badges reliably across light and dark footers.
 */
export function SponsorsStrip({ variant = 'surface', compact = false }: SponsorsStripProps) {
  const { t } = useI18n();
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});
  const isDark = variant === 'dark';
  const mutedColor = isDark ? '#b9cec2' : 'var(--md-sys-color-on-surface-variant)';

  const markFailed = (key: string) => {
    setFailedLogos((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <aside
      aria-label={t('sponsors.label')}
      className={`sponsors-strip ${isDark ? 'sponsors-strip--dark' : ''}`}
      style={{ paddingBlock: compact ? '0.85rem' : '1.05rem' }}
    >
      <span
        className="m3-label-small"
        style={{ color: mutedColor, marginInlineEnd: '0.25rem' }}
      >
        {t('sponsors.label')}
      </span>

      <div className="sponsors-logos-row">
        {/* Unicred */}
        <div className="sponsor-pill sponsor-pill--light">
          {!failedLogos.unicred ? (
            <img
              src={unicredUrl}
              alt="Unicred"
              width={114}
              height={21}
              loading="eager"
              decoding="sync"
              onError={() => markFailed('unicred')}
              style={{ inlineSize: '114px', blockSize: '21px', objectFit: 'contain', flexShrink: 0 }}
            />
          ) : (
            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f3325' }}>Unicred</span>
          )}
        </div>

        {/* Fruki Bebidas */}
        <div className="sponsor-pill sponsor-pill--light">
          {!failedLogos.fruki ? (
            <img
              src={frukiUrl}
              alt="Fruki Bebidas"
              width={136}
              height={21}
              loading="eager"
              decoding="sync"
              onError={() => markFailed('fruki')}
              style={{ inlineSize: '136px', blockSize: '21px', objectFit: 'contain', flexShrink: 0 }}
            />
          ) : (
            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#146c43' }}>Fruki Bebidas</span>
          )}
        </div>

        {/* Balsaneli Contabilidade */}
        <div className="sponsor-pill sponsor-pill--dark">
          {!failedLogos.balsanelli && (
            <img
              src={balsanelliUrl}
              alt="Balsaneli Contabilidade"
              width={28}
              height={27}
              loading="eager"
              decoding="sync"
              onError={() => markFailed('balsanelli')}
              style={{ inlineSize: '28px', blockSize: '27px', objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f1de97', whiteSpace: 'nowrap' }}>
            Balsaneli Contabilidade
          </span>
        </div>
      </div>
    </aside>
  );
}
