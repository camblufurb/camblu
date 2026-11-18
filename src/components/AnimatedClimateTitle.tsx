interface AnimatedClimateTitleProps {
  /** Visible Climate Crisis display title animated with the YEAR 2050 -> 1979 morph. */
  children: string;
  /** Accessible H1 heading text for screen readers; defaults to `children`. */
  accessibleHeading?: string;
  /** Keep 'split' compact desktop sizing when paired with wide side media (e.g., Shop mosaic). */
  scale?: 'default' | 'split';
  /** Visual color role matching dark forest heroes ('light') or light surfaces ('primary'). */
  tone?: 'light' | 'primary';
  /** Text alignment inside the hero container. */
  align?: 'start' | 'center';
}

function resolveFitVariant(text: string, scale: 'default' | 'split'): string {
  if (scale === 'split') return 'split';
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  const longestWord = Math.max(...words.map((w) => w.length));
  const hasLowercase = /[a-záàâãéêíóôõúç]/.test(trimmed);

  if (words.length === 1 && longestWord >= 12 && !hasLowercase) return 'xlword';
  if (words.length === 1 && longestWord >= 11) return 'lword';
  if (longestWord >= 10) return 'phrase';
  return 'word';
}

/**
 * Reusable Climate Crisis variable-axis hero heading matching SECIMED's morph animation
 * and standardized to Clube CAMBLU's desktop proportion with bold mobile readability.
 */
export function AnimatedClimateTitle({
  children,
  accessibleHeading,
  scale = 'default',
  tone = 'light',
  align = 'start',
}: AnimatedClimateTitleProps) {
  const variant = resolveFitVariant(children, scale);

  return (
    <>
      <h1 className="visually-hidden">{accessibleHeading ?? children}</h1>
      <div
        aria-hidden="true"
        className={`climate-hero-title climate-hero-title--${variant} climate-hero-title--${tone}${
          align === 'center' ? ' climate-hero-title--center' : ''
        }`}
      >
        {children}
      </div>
    </>
  );
}
