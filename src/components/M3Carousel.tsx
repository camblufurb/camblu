import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';

interface M3CarouselProps {
  label: string;
  peek?: boolean;
  variant?: 'hero' | 'multi-browse';
  infinite?: boolean;
  items: {
    id: string;
    title: string;
    content: React.ReactNode;
  }[];
}

function jumpInstantlyWithoutSnap(track: HTMLDivElement, left: number) {
  track.style.scrollSnapType = 'none';
  track.scrollLeft = left;
  window.requestAnimationFrame(() => {
    track.style.scrollSnapType = '';
  });
}

/**
 * Expressive Material 3 carousel supporting infinite seamless looping, single-step arrow navigation,
 * unobstructed bottom controls inside container bounds, and exact active slide detection.
 */
export function M3Carousel({
  label,
  peek = true,
  variant = 'hero',
  infinite = true,
  items,
}: M3CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const pendingTargetDomRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoopingEnabled = infinite && items.length > 1;
  const cloneCount = isLoopingEnabled ? (variant === 'multi-browse' ? Math.min(3, items.length) : 1) : 0;

  const extendedItems = useMemo(() => {
    if (!isLoopingEnabled || cloneCount === 0) {
      return items.map((item, realIdx) => ({ ...item, domKey: item.id, realIdx, isClone: false }));
    }
    const head = items.slice(items.length - cloneCount).map((item, idx) => ({
      ...item,
      domKey: `${item.id}--clone-head-${idx}`,
      realIdx: items.length - cloneCount + idx,
      isClone: true,
    }));
    const core = items.map((item, realIdx) => ({
      ...item,
      domKey: item.id,
      realIdx,
      isClone: false,
    }));
    const tail = items.slice(0, cloneCount).map((item, idx) => ({
      ...item,
      domKey: `${item.id}--clone-tail-${idx}`,
      realIdx: idx,
      isClone: true,
    }));
    return [...head, ...core, ...tail];
  }, [cloneCount, isLoopingEnabled, items]);

  const computeScrollLeftForDomIndex = useCallback(
    (track: HTMLDivElement, domIdx: number): number => {
      const slide = track.children[domIdx] as HTMLElement | undefined;
      if (!slide) return 0;
      if (variant === 'multi-browse') {
        return Math.max(0, slide.offsetLeft);
      }
      return Math.max(0, slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2);
    },
    [variant],
  );

  const findNearestDomIndex = useCallback(
    (track: HTMLDivElement): number => {
      const slides = Array.from(track.children) as HTMLElement[];
      if (slides.length === 0) return 0;

      const focusX =
        variant === 'multi-browse'
          ? track.scrollLeft
          : track.scrollLeft + track.clientWidth / 2;

      let bestIdx = 0;
      let bestDist = Infinity;
      slides.forEach((slide, idx) => {
        const slideAnchorX =
          variant === 'multi-browse' ? slide.offsetLeft : slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(focusX - slideAnchorX);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      return bestIdx;
    },
    [variant],
  );

  const normalizeDomIndexIfCloned = useCallback(
    (track: HTMLDivElement, domIdx: number): number => {
      if (!isLoopingEnabled || items.length === 0) return domIdx;
      let realIdx = (domIdx - cloneCount) % items.length;
      if (realIdx < 0) realIdx += items.length;
      const canonicalDomIdx = cloneCount + realIdx;
      if (domIdx < cloneCount || domIdx >= cloneCount + items.length) {
        const left = computeScrollLeftForDomIndex(track, canonicalDomIdx);
        jumpInstantlyWithoutSnap(track, left);
      }
      return realIdx;
    },
    [cloneCount, computeScrollLeftForDomIndex, isLoopingEnabled, items.length],
  );

  // Synchronously position onto real slide 0 on initial mount
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    pendingTargetDomRef.current = null;
    setActiveIndex(0);
    jumpInstantlyWithoutSnap(track, computeScrollLeftForDomIndex(track, cloneCount));
  }, [cloneCount, computeScrollLeftForDomIndex, items.length]);

  const scrollStep = (delta: -1 | 1) => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const currentDom = pendingTargetDomRef.current ?? findNearestDomIndex(track);
    let nextDom = currentDom + delta;

    if (!isLoopingEnabled) {
      nextDom = ((nextDom % items.length) + items.length) % items.length;
    } else if (nextDom < 0) {
      nextDom = cloneCount - 1;
    } else if (nextDom >= extendedItems.length) {
      nextDom = cloneCount + items.length;
    }

    const mappedReal = isLoopingEnabled
      ? (((nextDom - cloneCount) % items.length) + items.length) % items.length
      : nextDom;

    pendingTargetDomRef.current = nextDom;
    setActiveIndex(mappedReal);

    const targetLeft = computeScrollLeftForDomIndex(track, nextDom);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      jumpInstantlyWithoutSnap(track, targetLeft);
      pendingTargetDomRef.current = null;
      setActiveIndex(normalizeDomIndexIfCloned(track, nextDom));
    } else {
      track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      if (!('onscrollend' in globalThis)) {
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => {
          if (!trackRef.current) return;
          const landed = pendingTargetDomRef.current ?? findNearestDomIndex(trackRef.current);
          pendingTargetDomRef.current = null;
          setActiveIndex(normalizeDomIndexIfCloned(trackRef.current, landed));
        }, 520);
      }
    }

    setStatusMessage(`Slide ${mappedReal + 1} de ${items.length}: ${items[mappedReal].title}`);
  };

  const scrollToRealIndex = (realIdx: number) => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    const bounded = ((realIdx % items.length) + items.length) % items.length;
    const targetDom = cloneCount + bounded;
    const targetLeft = computeScrollLeftForDomIndex(track, targetDom);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    pendingTargetDomRef.current = targetDom;
    setActiveIndex(bounded);

    if (reduced) {
      jumpInstantlyWithoutSnap(track, targetLeft);
      pendingTargetDomRef.current = null;
    } else {
      track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      if (!('onscrollend' in globalThis)) {
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => {
          pendingTargetDomRef.current = null;
        }, 520);
      }
    }

    setStatusMessage(`Slide ${bounded + 1} de ${items.length}: ${items[bounded].title}`);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleSettle = () => {
      const settledDom = pendingTargetDomRef.current ?? findNearestDomIndex(track);
      pendingTargetDomRef.current = null;
      const realIdx = normalizeDomIndexIfCloned(track, settledDom);
      setActiveIndex(realIdx);
    };

    const supportsScrollEnd = 'onscrollend' in globalThis;

    const handleScroll = () => {
      if (pendingTargetDomRef.current !== null) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const nearestDom = findNearestDomIndex(track);
        const mapped = isLoopingEnabled
          ? (((nearestDom - cloneCount) % items.length) + items.length) % items.length
          : nearestDom;
        setActiveIndex(mapped);
      });
      if (!supportsScrollEnd) {
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(handleSettle, 160);
      }
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    track.addEventListener('scrollend', handleSettle);
    return () => {
      track.removeEventListener('scroll', handleScroll);
      track.removeEventListener('scrollend', handleSettle);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [cloneCount, findNearestDomIndex, isLoopingEnabled, items.length, normalizeDomIndexIfCloned]);

  if (items.length === 0) return null;

  return (
    <section className="m3-carousel" aria-roledescription="carousel" aria-label={label}>
      <div className="m3-carousel-viewport">
        <div
          ref={trackRef}
          className="m3-carousel-track"
          data-variant={variant}
          data-peek={peek && items.length > 1 ? 'true' : 'false'}
          tabIndex={0}
          role="group"
          aria-label="Slides"
        >
          {extendedItems.map((item) => (
            <div
              key={item.domKey}
              className="m3-carousel-slide"
              data-active={activeIndex === item.realIdx ? 'true' : 'false'}
              aria-hidden={item.isClone || undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${item.realIdx + 1} de ${items.length}: ${item.title}`}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="m3-carousel-nav-bar">
          <div className="m3-carousel-markers" aria-label="Indicadores de slide">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className="m3-carousel-marker"
                aria-current={activeIndex === idx ? 'true' : undefined}
                aria-label={`Ir para slide ${idx + 1}: ${item.title}`}
                onClick={() => scrollToRealIndex(idx)}
              />
            ))}
          </div>

          <div className="m3-carousel-controls">
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => scrollStep(-1)}
            >
              <Icon name="chevron_left" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() => scrollStep(1)}
            >
              <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      )}

      <div className="visually-hidden" aria-live="polite">
        {statusMessage}
      </div>
    </section>
  );
}
