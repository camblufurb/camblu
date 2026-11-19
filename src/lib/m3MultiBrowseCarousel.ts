export interface MultiBrowseFrameMetric {
  widthPx: number;
  marginEndPx: number;
  opacity: number;
  scale: number;
  isHidden: boolean;
  sizeRole: 'large' | 'medium' | 'small' | 'hidden';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function weightForWindowOffset(offset: number): number {
  if (offset <= -1 || offset >= 3) return 0;
  if (offset < 0) return 56 * (1 + offset);
  if (offset < 1) return lerp(56, 28, offset);
  if (offset < 2) return lerp(28, 16, offset - 1);
  return 16 * (1 - (offset - 2));
}

/**
 * Computes continuous Material 3 Multi-Browse frame dimensions (`Large`, `Medium`, `Small`, and vanishing)
 * across horizontal scroll progress `progress ∈ [0, count - 1]`.
 * Every visible slot sums seamlessly to `containerWidthPx` with zero layout jitter.
 */
export function computeM3MultiBrowseMetrics(
  count: number,
  progress: number,
  containerWidthPx: number,
  gapPx = 8,
): MultiBrowseFrameMetric[] {
  if (count <= 0) return [];
  const safeWidth = Math.max(240, containerWidthPx);

  if (count === 1) {
    return [
      {
        widthPx: safeWidth,
        marginEndPx: 0,
        opacity: 1,
        scale: 1,
        isHidden: false,
        sizeRole: 'large',
      },
    ];
  }

  const clampedP = Math.max(0, Math.min(count - 1, progress));

  if (count === 2) {
    const w0 = lerp(64, 36, clampedP);
    const w1 = lerp(36, 64, clampedP);
    const usable = Math.max(120, safeWidth - gapPx);
    return [
      {
        widthPx: Number(((w0 / 100) * usable).toFixed(2)),
        marginEndPx: gapPx,
        opacity: 1,
        scale: lerp(1, 0.98, clampedP),
        isHidden: false,
        sizeRole: w0 >= w1 ? 'large' : 'medium',
      },
      {
        widthPx: Number(((w1 / 100) * usable).toFixed(2)),
        marginEndPx: 0,
        opacity: 1,
        scale: lerp(0.98, 1, clampedP),
        isHidden: false,
        sizeRole: w1 > w0 ? 'large' : 'medium',
      },
    ];
  }

  // count >= 3: sliding 3-item window [L=56, M=28, S=16] that shifts focus seamlessly at the tail [S, M, L]
  const maxSlideAnchor = count - 3;
  const k = Math.min(maxSlideAnchor, clampedP);
  const endShift = Math.max(0, clampedP - maxSlideAnchor);

  const weights = new Array<number>(count).fill(0);
  if (endShift <= 0.0001) {
    for (let i = 0; i < count; i += 1) {
      weights[i] = weightForWindowOffset(i - k);
    }
  } else {
    const baseIdx = maxSlideAnchor;
    if (endShift <= 1) {
      const t = endShift;
      weights[baseIdx] = lerp(56, 20, t);
      weights[baseIdx + 1] = lerp(28, 56, t);
      weights[baseIdx + 2] = lerp(16, 24, t);
    } else {
      const t = endShift - 1;
      weights[baseIdx] = lerp(20, 16, t);
      weights[baseIdx + 1] = lerp(56, 28, t);
      weights[baseIdx + 2] = lerp(24, 56, t);
    }
  }

  return finalizeMetricsFromWeights(weights, safeWidth, gapPx);
}

function finalizeMetricsFromWeights(
  weights: number[],
  containerWidthPx: number,
  gapPx: number,
): MultiBrowseFrameMetric[] {
  const count = weights.length;
  const safeWidth = Math.max(240, containerWidthPx);

  const rawMargins = weights.map((w, idx) => {
    if (idx === count - 1) return 0;
    const nextW = weights[idx + 1] ?? 0;
    const minPairW = Math.min(w, nextW);
    if (minPairW <= 0.5) return 0;
    return gapPx * Math.min(1, minPairW / 12);
  });

  let lastVisibleIdx = -1;
  for (let i = count - 1; i >= 0; i -= 1) {
    if (weights[i] > 0.5) {
      lastVisibleIdx = i;
      break;
    }
  }
  const margins = rawMargins.map((m, idx) => (idx >= lastVisibleIdx ? 0 : m));
  const totalMarginPx = margins.reduce((acc, m) => acc + m, 0);
  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 100;
  const usableWidth = Math.max(120, safeWidth - totalMarginPx);

  return weights.map((weight, idx) => {
    const frac = weight / totalWeight;
    const widthPx = weight <= 0.4 ? 0 : Number((frac * usableWidth).toFixed(2));
    const opacity =
      weight <= 0.4
        ? 0
        : weight < 14
          ? Number(Math.max(0, Math.min(1, weight / 14)).toFixed(3))
          : 1;
    const scale =
      weight <= 0.4
        ? 0.9
        : Number((0.94 + 0.06 * Math.min(1, weight / 48)).toFixed(3));
    const sizeRole: MultiBrowseFrameMetric['sizeRole'] =
      weight <= 0.4
        ? 'hidden'
        : weight >= 40
          ? 'large'
          : weight >= 22
            ? 'medium'
            : 'small';

    return {
      widthPx,
      marginEndPx: Number((margins[idx] || 0).toFixed(2)),
      opacity,
      scale,
      isHidden: weight <= 0.4,
      sizeRole,
    };
  });
}

/**
 * Computes Material 3 Multi-Browse frame dimensions for an infinite looped DOM track
 * (typically 3× duplicated slides) so Large -> Medium -> Small -> Gone wraps seamlessly.
 */
export function computeInfiniteMultiBrowseMetrics(
  totalDomItems: number,
  progress: number,
  containerWidthPx: number,
  gapPx = 8,
): MultiBrowseFrameMetric[] {
  if (totalDomItems <= 0) return [];
  if (totalDomItems === 1) {
    return [
      {
        widthPx: Math.max(240, containerWidthPx),
        marginEndPx: 0,
        opacity: 1,
        scale: 1,
        isHidden: false,
        sizeRole: 'large',
      },
    ];
  }

  const clampedP = Math.max(0, Math.min(totalDomItems - 1, progress));
  const weights = new Array<number>(totalDomItems).fill(0);
  for (let i = 0; i < totalDomItems; i += 1) {
    weights[i] = weightForWindowOffset(i - clampedP);
  }
  return finalizeMetricsFromWeights(weights, containerWidthPx, gapPx);
}
