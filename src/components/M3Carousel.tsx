import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface M3CarouselProps {
  label: string;
  peek?: boolean;
  items: {
    id: string;
    title: string;
    content: React.ReactNode;
  }[];
}

export function M3Carousel({ label, peek = true, items }: M3CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const pendingTargetRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNearestIndex = () => {
    const track = trackRef.current;
    if (!track) return 0;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length === 0) return 0;
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(trackCenter - slideCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  const scrollToSlide = (index: number, announce = true) => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    const wrapped = ((index % items.length) + items.length) % items.length;
    const slide = track.children[wrapped] as HTMLElement | undefined;
    if (!slide) return;
    pendingTargetRef.current = wrapped;
    setActiveIndex(wrapped);
    const targetLeft = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    if (announce) {
      setStatusMessage(`Slide ${wrapped + 1} de ${items.length}: ${items[wrapped].title}`);
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleSettle = () => {
      const settled = getNearestIndex();
      pendingTargetRef.current = null;
      setActiveIndex(settled);
    };

    const supportsScrollEnd = 'onscrollend' in globalThis;

    const handleScroll = () => {
      if (pendingTargetRef.current !== null) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setActiveIndex(getNearestIndex());
      });
      if (!supportsScrollEnd) {
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(handleSettle, 120);
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
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section className="m3-carousel" aria-roledescription="carousel" aria-label={label}>
      <div className="m3-carousel-viewport">
        {items.length > 1 && (
          <div className="m3-carousel-controls">
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => scrollToSlide((pendingTargetRef.current ?? activeIndex) - 1)}
            >
              <Icon name="chevron_left" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() => scrollToSlide((pendingTargetRef.current ?? activeIndex) + 1)}
            >
              <Icon name="chevron_right" />
            </button>
          </div>
        )}

        <div
          ref={trackRef}
          className="m3-carousel-track"
          data-peek={peek && items.length > 1 ? 'true' : 'false'}
          tabIndex={0}
          role="group"
          aria-label="Slides"
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="m3-carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} de ${items.length}: ${item.title}`}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {statusMessage}
      </p>

      {items.length > 1 && (
        <nav className="m3-carousel-markers" aria-label={`Escolher slide em ${label}`}>
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className="m3-carousel-marker"
              aria-label={`Ir para slide ${idx + 1}: ${item.title}`}
              aria-current={activeIndex === idx ? 'true' : undefined}
              onClick={() => scrollToSlide(idx)}
            />
          ))}
        </nav>
      )}
    </section>
  );
}
