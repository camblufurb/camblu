import React from 'react';
import type { M3ShapeVariant } from '../types/domain';

/**
 * Global SVG clipPath definitions for Material Design 3 Expressive Shapes.
 * Mounted once at the root of the application.
 */
export function M3ShapeDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <clipPath id="m3-clip-clover4" clipPathUnits="objectBoundingBox">
          <path d="M 0.5,0.03 C 0.67,0.03 0.72,0.14 0.78,0.22 C 0.86,0.28 0.97,0.33 0.97,0.5 C 0.97,0.67 0.86,0.72 0.78,0.78 C 0.72,0.86 0.67,0.97 0.5,0.97 C 0.33,0.97 0.28,0.86 0.22,0.78 C 0.14,0.72 0.03,0.67 0.03,0.5 C 0.03,0.33 0.14,0.28 0.22,0.22 C 0.28,0.14 0.33,0.03 0.5,0.03 Z" />
        </clipPath>

        <clipPath id="m3-clip-clover8" clipPathUnits="objectBoundingBox">
          <path d="M 0.5,0.02 C 0.58,0.02 0.62,0.09 0.68,0.12 C 0.75,0.08 0.83,0.12 0.88,0.18 C 0.91,0.25 0.88,0.33 0.94,0.39 C 0.98,0.44 0.98,0.56 0.94,0.61 C 0.88,0.67 0.91,0.75 0.88,0.82 C 0.83,0.88 0.75,0.92 0.68,0.88 C 0.62,0.91 0.58,0.98 0.5,0.98 C 0.42,0.98 0.38,0.91 0.32,0.88 C 0.25,0.92 0.17,0.88 0.12,0.82 C 0.09,0.75 0.12,0.67 0.06,0.61 C 0.02,0.56 0.02,0.44 0.06,0.39 C 0.12,0.33 0.09,0.25 0.12,0.18 C 0.17,0.12 0.25,0.08 0.32,0.12 C 0.38,0.09 0.42,0.02 0.5,0.02 Z" />
        </clipPath>

        <clipPath id="m3-clip-flower" clipPathUnits="objectBoundingBox">
          <path d="M 0.5,0.03 C 0.61,0.03 0.66,0.12 0.74,0.12 C 0.84,0.12 0.88,0.21 0.88,0.29 C 0.95,0.36 0.97,0.44 0.97,0.5 C 0.97,0.58 0.93,0.66 0.87,0.72 C 0.88,0.81 0.82,0.89 0.73,0.88 C 0.65,0.93 0.58,0.97 0.5,0.97 C 0.42,0.97 0.35,0.93 0.27,0.88 C 0.18,0.89 0.12,0.81 0.13,0.72 C 0.07,0.66 0.03,0.58 0.03,0.5 C 0.03,0.44 0.05,0.36 0.12,0.29 C 0.12,0.21 0.16,0.12 0.26,0.12 C 0.34,0.12 0.39,0.03 0.5,0.03 Z" />
        </clipPath>

        <clipPath id="m3-clip-gem" clipPathUnits="objectBoundingBox">
          <polygon points="0.5,0.02 0.86,0.18 0.98,0.55 0.74,0.93 0.26,0.93 0.02,0.55 0.14,0.18" />
        </clipPath>

        <clipPath id="m3-clip-sunny" clipPathUnits="objectBoundingBox">
          <path d="M 0.5,0.02 L 0.61,0.11 L 0.75,0.07 L 0.8,0.21 L 0.93,0.25 L 0.9,0.39 L 0.98,0.5 L 0.9,0.61 L 0.93,0.75 L 0.8,0.79 L 0.75,0.93 L 0.61,0.89 L 0.5,0.98 L 0.39,0.89 L 0.25,0.93 L 0.2,0.79 L 0.07,0.75 L 0.1,0.61 L 0.02,0.5 L 0.1,0.39 L 0.07,0.25 L 0.2,0.21 L 0.25,0.07 L 0.39,0.11 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

interface ExpressiveShapeFrameProps {
  shape: M3ShapeVariant;
  hoverRotateDeg?: number;
  maxWidth?: string;
  children: React.ReactNode;
}

export function ExpressiveShapeFrame({
  shape,
  hoverRotateDeg = 4,
  maxWidth = '11rem',
  children,
}: ExpressiveShapeFrameProps) {
  return (
    <div
      className={`m3-shape-frame m3-shape--${shape}`}
      style={
        {
          maxInlineSize: maxWidth,
          '--shape-hover-rotate': `${hoverRotateDeg}deg`,
        } as React.CSSProperties
      }
    >
      <div className="m3-shape-clip">{children}</div>
    </div>
  );
}

export const M3_SHAPE_ROTATION: M3ShapeVariant[] = [
  'squircle',
  'clover4',
  'arch',
  'flower',
  'clover8',
  'gem',
  'pill',
  'sunny',
  'circle',
];
