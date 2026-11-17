import type { CSSProperties } from 'react';
import aaarihLogoUrl from '../../assets/logos/aaarih.jpg';
import dceLogoUrl from '../../assets/logos/dce.jpg';
import ifmsaLogoUrl from '../../assets/logos/ifmsa.png';
import cambluLogoUrl from '../../assets/logos/logo_color.png';

export type InstitutionLogoId = 'camblu' | 'dce' | 'aaarih' | 'ifmsa';

interface LogoVisualSpec {
  src: string;
  alt: string;
  background: string;
  radius: string;
  fit: CSSProperties['objectFit'];
  padding?: string;
  scale?: number;
}

const LOGO_SPECS: Record<InstitutionLogoId, LogoVisualSpec> = {
  camblu: {
    src: cambluLogoUrl,
    alt: 'Logo oficial do CAMBLU',
    background: '#ffffff',
    radius: '9999px',
    fit: 'contain',
    padding: '0.2rem',
  },
  aaarih: {
    src: aaarihLogoUrl,
    alt: 'Logo da Associação Atlética Acadêmica Romualdo Izon Heil — AAARIH',
    background: '#ffffff',
    radius: '9999px',
    fit: 'cover',
    scale: 1.03,
  },
  dce: {
    src: dceLogoUrl,
    alt: 'Logo do Diretório Central dos Estudantes — DCE FURB',
    background: '#141414',
    radius: 'var(--md-sys-shape-corner-md)',
    fit: 'cover',
    scale: 1.04,
  },
  ifmsa: {
    src: ifmsaLogoUrl,
    alt: 'Logo da IFMSA Brazil FURB',
    background: '#124076',
    radius: 'var(--md-sys-shape-corner-md)',
    fit: 'cover',
    scale: 1.03,
  },
};

export function InstitutionLogo({
  id,
  size = '3.5rem',
  alt,
}: {
  id: InstitutionLogoId;
  size?: string;
  alt?: string;
}) {
  const spec = LOGO_SPECS[id];
  return (
    <div
      style={{
        inlineSize: size,
        blockSize: size,
        borderRadius: spec.radius,
        background: spec.background,
        padding: spec.padding,
        border: '1px solid var(--md-sys-color-outline-variant)',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={spec.src}
        alt={alt || spec.alt}
        loading="lazy"
        decoding="async"
        style={{
          inlineSize: '100%',
          blockSize: '100%',
          objectFit: spec.fit,
          transform: spec.scale ? `scale(${spec.scale})` : undefined,
        }}
      />
    </div>
  );
}
