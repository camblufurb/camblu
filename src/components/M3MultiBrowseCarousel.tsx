import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Icon } from './Icon';
import {
  computeInfiniteMultiBrowseMetrics,
  type MultiBrowseFrameMetric,
} from '../lib/m3MultiBrowseCarousel';

export interface M3MultiBrowseCarouselItem {
  id: string;
  title: string;
  render: (ctx: {
    sizeRole: MultiBrowseFrameMetric['sizeRole'];
    isPrimary: boolean;
    widthPx: number;
  }) => React.ReactNode;
}

export interface M3MultiBrowseCarouselProps {
  label: string;
  items: M3MultiBrowseCarouselItem[];
  gapPx?: number;
}

/**
 * Responsive infinite Material Design 3 Multi-Browse carousel for both mobile and desktop.
 * Displays simultaneous Large, Medium, and Small cards that grow, shrink, and fade out smoothly on scroll.
 */
export function M3MultiBrowseCarousel({
  label,
  items,
  gapPx = 10,
}: M3MultiBrowseCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const jumpRafRef = useRef<number | null>(null);
  const suppressSyncRef = useRef<boolean>(false);
  const itemsKey = useMemo(() => `${items.length}:${items.map((i) => i.id).join(',')}`, [items]);
  const prevItemsKeyRef = useRef<string>(itemsKey);

  const isLooped = items.length >= 2;
  const initialProgress = isLooped ? items.length : 0;
  const scrollProgressRef = useRef<number>(initialProgress);

  const [scrollerWidth, setScrollerWidth] = useState(360);
  const [scrollProgress, setScrollProgress] = useState(initialProgress);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  const commitProgress = useCallback((value: number) => {
    scrollProgressRef.current = value;
    setScrollProgress(value);
  }, []);

  const jumpScrollWithoutSnap = useCallback((scroller: HTMLDivElement, targetLeft: number) => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (jumpRafRef.current !== null) {
      window.cancelAnimationFrame(jumpRafRef.current);
      jumpRafRef.current = null;
    }
    suppressSyncRef.current = true;
    scroller.style.scrollSnapType = 'none';
    scroller.scrollLeft = targetLeft;
    jumpRafRef.current = window.requestAnimationFrame(() => {
      jumpRafRef.current = null;
      scroller.style.scrollSnapType = '';
      suppressSyncRef.current = false;
    });
  }, []);

  const displayItems = useMemo(() => {
    if (!isLooped) {
      return items.map((item, idx) => ({ key: item.id, item, realIdx: idx, domIdx: idx }));
    }
    return [0, 1, 2].flatMap((cycle) =>
      items.map((item, idx) => ({
        key: `${item.id}-mb-loop-${cycle}`,
        item,
        realIdx: idx,
        domIdx: cycle * items.length + idx,
      })),
    );
  }, [isLooped, items]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => setPrefersReducedMotion(motionQuery.matches);
    onMotionChange();
    motionQuery.addEventListener('change', onMotionChange);
    return () => motionQuery.removeEventListener('change', onMotionChange);
  }, []);

  const syncMetrics = useCallback(() => {
    if (suppressSyncRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth || 360;
    const step = Math.max(120, Math.round(width * 0.42));

    if (!isLooped) {
      commitProgress(0);
      return;
    }

    const baseCount = items.length;
    const rawP = el.scrollLeft / step;

    if (rawP < baseCount * 0.5) {
      const shifted = el.scrollLeft + baseCount * step;
      jumpScrollWithoutSnap(el, shifted);
      commitProgress(shifted / step);
      return;
    }
    if (rawP >= baseCount * 2.5) {
      const shifted = el.scrollLeft - baseCount * step;
      jumpScrollWithoutSnap(el, shifted);
      commitProgress(shifted / step);
      return;
    }

    commitProgress(Math.max(0, Math.min(baseCount * 3 - 1, rawP)));
  }, [commitProgress, isLooped, items.length, jumpScrollWithoutSnap]);

  const snapStepPx = Math.max(120, Math.round(scrollerWidth * 0.42));

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measured = el.clientWidth || 360;
    if (measured !== scrollerWidth) {
      setScrollerWidth(measured);
    }

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const next = el.clientWidth || 360;
      setScrollerWidth((prev) => (prev === next ? prev : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollerWidth]);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (prevItemsKeyRef.current !== itemsKey) {
      prevItemsKeyRef.current = itemsKey;
      commitProgress(isLooped ? items.length : 0);
    }
    if (!isLooped) {
      el.scrollLeft = 0;
      return;
    }
    jumpScrollWithoutSnap(el, scrollProgressRef.current * snapStepPx);
  }, [commitProgress, isLooped, items.length, itemsKey, jumpScrollWithoutSnap, snapStepPx]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (jumpRafRef.current !== null) {
        window.cancelAnimationFrame(jumpRafRef.current);
      }
    };
  }, []);

  const metrics = useMemo(
    () =>
      computeInfiniteMultiBrowseMetrics(
        displayItems.length,
        scrollProgress,
        scrollerWidth,
        gapPx,
      ),
    [displayItems.length, gapPx, scrollProgress, scrollerWidth],
  );

  const activeIndex =
    items.length > 0 ? ((Math.round(scrollProgress) % items.length) + items.length) % items.length : 0;

  const scrollByDelta = (deltaSteps: number) => {
    const el = scrollerRef.current;
    if (!el || !isLooped) return;
    const targetStep = Math.round(scrollProgress) + deltaSteps;
    el.scrollTo({
      left: targetStep * snapStepPx,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const scrollToRealIndex = (targetRealIdx: number) => {
    if (!isLooped) return;
    const base = items.length;
    let delta = targetRealIdx - activeIndex;
    if (delta > base / 2) delta -= base;
    if (delta < -base / 2) delta += base;
    scrollByDelta(delta);
  };

  return (
    <section
      className="m3-carousel m3-mb-carousel"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          scrollByDelta(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          scrollByDelta(-1);
        }
      }}
    >
      <div
        ref={scrollerRef}
        className="m3-mb-scroller"
        tabIndex={0}
        aria-label={label}
        onScroll={() => {
          if (rafRef.current !== null) return;
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            syncMetrics();
          });
        }}
      >
        <div
          className="m3-mb-stage"
          style={
            isLooped
              ? { inlineSize: `${scrollerWidth + (displayItems.length - 1) * snapStepPx}px` }
              : undefined
          }
        >
          <div className="m3-mb-viewport" style={{ inlineSize: `${scrollerWidth}px` }}>
            {displayItems.map((entry, idx) => {
              const metric = metrics[idx];
              const isPrimary = idx === Math.round(scrollProgress);
              const frameStyle: CSSProperties | undefined = metric
                ? {
                    flex: `0 0 ${metric.widthPx}px`,
                    marginInlineEnd: `${metric.marginEndPx}px`,
                    opacity: metric.opacity,
                    transform: prefersReducedMotion ? 'none' : `scale(${metric.scale})`,
                    pointerEvents: metric.isHidden ? 'none' : 'auto',
                    borderWidth: metric.isHidden ? '0px' : undefined,
                  }
                : undefined;

              return (
                <div
                  key={entry.key}
                  className="m3-mb-frame"
                  data-size-role={metric?.sizeRole || 'large'}
                  data-primary={isPrimary ? 'true' : 'false'}
                  aria-hidden={metric?.isHidden || undefined}
                  style={frameStyle}
                  onClick={(e) => {
                    if (isPrimary) return;
                    e.preventDefault();
                    scrollByDelta(idx - Math.round(scrollProgress));
                  }}
                >
                  {entry.item.render({
                    sizeRole: metric?.sizeRole || 'large',
                    isPrimary,
                    widthPx: metric?.widthPx || scrollerWidth,
                  })}
                </div>
              );
            })}
          </div>

          {isLooped && (
            <div className="m3-mb-snap-rail" aria-hidden="true">
              {displayItems.map((entry, idx) => (
                <span
                  key={`mb-snap-${entry.key}`}
                  className="m3-mb-snap-stop"
                  style={{
                    inlineSize:
                      idx === displayItems.length - 1 ? `${scrollerWidth}px` : `${snapStepPx}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isLooped && (
        <div className="m3-carousel-nav-bar">
          <div className="m3-carousel-markers" aria-label="Indicadores de slide">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className="m3-carousel-marker"
                aria-label={`Ir para slide ${idx + 1}: ${item.title}`}
                aria-current={activeIndex === idx ? 'true' : undefined}
                onClick={() => scrollToRealIndex(idx)}
              />
            ))}
          </div>

          <div className="m3-carousel-controls">
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => scrollByDelta(-1)}
            >
              <Icon name="chevron_left" size={22} />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() => scrollByDelta(1)}
            >
              <Icon name="chevron_right" size={22} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
