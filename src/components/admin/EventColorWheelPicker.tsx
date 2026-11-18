import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../Icon';
import {
  DEFAULT_EVENT_PALETTE,
  DEFAULT_SECIMED_PALETTE,
  HARMONY_RULES,
  generateHarmonyPalette,
  generateRandomHarmonyPalette,
  getContrastRatio,
  getReadableTextColor,
  hexToHsl,
  hslToHex,
  normalizeHex,
  type HarmonyRule,
} from '../../lib/colorHarmony';
import type { EventPaletteConfig } from '../../types/domain';

type PaletteRoleKey = keyof EventPaletteConfig;

const ROLE_META: Array<{ key: PaletteRoleKey; short: string; label: string; number: string }> = [
  { key: 'primary', short: '1', label: 'Primária (Base)', number: '1' },
  { key: 'secondary1', short: '2', label: 'Secundária 1', number: '2' },
  { key: 'secondary2', short: '3', label: 'Secundária 2', number: '3' },
  { key: 'background', short: '4', label: 'Cor de Fundo', number: '4' },
];

export interface EventColorWheelPickerProps {
  value: EventPaletteConfig;
  onChange: (next: EventPaletteConfig) => void;
  defaultPalette?: EventPaletteConfig;
  eventTitlePreview?: string;
  hasCoffeePreview?: boolean;
}

const WHEEL_SIZE = 244;
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const HANDLE_MAX_RADIUS = WHEEL_RADIUS - 14;

function polarFromHex(hex: string): { x: number; y: number; h: number; s: number; l: number } {
  const { h, s, l } = hexToHsl(hex);
  const rad = (h * Math.PI) / 180;
  const dist = (Math.max(0, Math.min(100, s)) / 100) * HANDLE_MAX_RADIUS;
  return {
    x: WHEEL_RADIUS + dist * Math.sin(rad),
    y: WHEEL_RADIUS - dist * Math.cos(rad),
    h,
    s,
    l,
  };
}

/**
 * Ferramenta interativa estilo Adobe Color Wheel para criação imediata de paleta
 * harmônica de 4 cores por evento, com regras cromáticas, contraste WCAG e prévia ao vivo.
 */
export function EventColorWheelPicker({
  value,
  onChange,
  defaultPalette,
  eventTitlePreview = 'Prévia do Evento CAMBLU',
  hasCoffeePreview = true,
}: EventColorWheelPickerProps) {
  const [rule, setRule] = useState<HarmonyRule>('analogous');
  const [bgTone, setBgTone] = useState<'light' | 'dark'>(() =>
    hexToHsl(value.background).l < 40 ? 'dark' : 'light',
  );
  const [activeKey, setActiveKey] = useState<PaletteRoleKey>('primary');
  const [draggingKey, setDraggingKey] = useState<PaletteRoleKey | null>(null);
  const [copiedKey, setCopiedKey] = useState<PaletteRoleKey | null>(null);
  const [hexDrafts, setHexDrafts] = useState<Record<PaletteRoleKey, string>>(value);

  const wheelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHexDrafts(value);
  }, [value]);

  const activeHsl = useMemo(() => hexToHsl(value[activeKey]), [value, activeKey]);

  const points = useMemo(() => {
    return ROLE_META.map((item) => ({
      ...item,
      hex: value[item.key],
      ...polarFromHex(value[item.key]),
    }));
  }, [value]);

  const applyRule = useCallback(
    (nextRule: HarmonyRule, nextBaseHex = value.primary, nextBgTone = bgTone) => {
      setRule(nextRule);
      if (nextRule === 'custom') return;
      onChange(generateHarmonyPalette(nextBaseHex, nextRule, nextBgTone));
    },
    [bgTone, onChange, value.primary],
  );

  const updateHueSatForRole = useCallback(
    (targetKey: PaletteRoleKey, hue: number, sat: number) => {
      const currentL = hexToHsl(value[targetKey]).l;
      const clampedL = targetKey === 'background' ? currentL : Math.max(18, Math.min(78, currentL));
      const updatedHex = hslToHex(hue, Math.max(8, sat), clampedL);

      if (rule !== 'custom' && targetKey === 'primary') {
        onChange(generateHarmonyPalette(updatedHex, rule, bgTone));
        return;
      }

      if (rule !== 'custom' && targetKey !== 'primary') {
        setRule('custom');
      }
      onChange({
        ...value,
        [targetKey]: updatedHex,
      });
    },
    [bgTone, onChange, rule, value],
  );

  const handlePointerToWheel = useCallback(
    (clientX: number, clientY: number, roleKey: PaletteRoleKey) => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const angleDeg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      const maxR = Math.max(1, (rect.width / 2) - 14);
      const dist = Math.min(maxR, Math.hypot(dx, dy));
      const sat = Math.round((dist / maxR) * 100);
      updateHueSatForRole(roleKey, angleDeg, sat);
    },
    [updateHueSatForRole],
  );

  const handleLightnessChange = (nextL: number) => {
    const { h, s } = hexToHsl(value[activeKey]);
    const nextHex = hslToHex(h, s, nextL);
    if (rule !== 'custom' && activeKey === 'primary') {
      onChange(generateHarmonyPalette(nextHex, rule, bgTone));
      return;
    }
    onChange({
      ...value,
      [activeKey]: nextHex,
    });
  };

  const handleToggleBgTone = (tone: 'light' | 'dark') => {
    setBgTone(tone);
    if (rule !== 'custom') {
      onChange(generateHarmonyPalette(value.primary, rule, tone));
      return;
    }
    const { h, s } = hexToHsl(value.background);
    onChange({
      ...value,
      background:
        tone === 'dark'
          ? hslToHex(h, Math.min(30, Math.max(10, s)), 12)
          : hslToHex(h, Math.min(26, Math.max(8, s)), 95),
    });
  };

  const handleRandomize = () => {
    const chosenRule: Exclude<HarmonyRule, 'custom'> =
      rule === 'custom' ? 'analogous' : rule;
    if (rule === 'custom') setRule(chosenRule);
    onChange(generateRandomHarmonyPalette(chosenRule, bgTone));
  };

  const handleCopyHex = async (key: PaletteRoleKey, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
    } catch {
      // ignore clipboard permission blocks
    }
  };

  const contrastPrimaryVsBg = getContrastRatio(value.primary, value.background);
  const bgText = getReadableTextColor(value.background);
  const primaryText = getReadableTextColor(value.primary);
  const fallbackReset = defaultPalette || DEFAULT_EVENT_PALETTE;
  const isDefaultSecimed =
    defaultPalette?.primary === DEFAULT_SECIMED_PALETTE.primary;

  return (
    <div className="m3-card m3-card--tonal color-wheel-studio" style={{ display: 'grid', gap: '1.15rem' }}>
      {/* Cabeçalho e ações rápidas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Icon name="palette" size={22} className="m3-badge--blue" />
            <h3 style={{ margin: 0 }}>Roda de Cores & Paleta do Evento</h3>
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>
            Escolha uma regra harmônica e arraste os pinos no círculo cromático para definir as 4 cores do evento.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="m3-btn m3-btn--outlined"
            onClick={handleRandomize}
          >
            <Icon name="shuffle" size={18} />
            <span>Gerar harmonia aleatória</span>
          </button>
          <button
            type="button"
            className="m3-btn m3-btn--outlined"
            onClick={() => {
              setRule('custom');
              onChange(fallbackReset);
            }}
          >
            <Icon name="restart_alt" size={18} />
            <span>{isDefaultSecimed ? 'Padrão SECIMED' : 'Padrão CAMBLU'}</span>
          </button>
        </div>
      </div>

      {/* Regras de harmonia (estilo Adobe Color) */}
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        <span className="m3-label-small text-muted">Regra de harmonia cromática</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }} role="radiogroup" aria-label="Regra de harmonia de cores">
          {HARMONY_RULES.map((item) => {
            const selected = rule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                title={item.hint}
                className="m3-chip"
                onClick={() => applyRule(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Corpo principal: Roda + Controles + Prévia ao Vivo */}
      <div className="color-wheel-layout">
        {/* Coluna 1: Roda cromática interativa + slider de luminosidade */}
        <div className="color-wheel-stage">
          <div
            ref={wheelRef}
            className="color-wheel-disc"
            style={{ inlineSize: `${WHEEL_SIZE}px`, blockSize: `${WHEEL_SIZE}px` }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).dataset.handleKey) return;
              setDraggingKey(activeKey);
              handlePointerToWheel(e.clientX, e.clientY, activeKey);
            }}
            onPointerMove={(e) => {
              if (!draggingKey) return;
              handlePointerToWheel(e.clientX, e.clientY, draggingKey);
            }}
            onPointerUp={() => setDraggingKey(null)}
            onPointerCancel={() => setDraggingKey(null)}
          >
            {/* Linhas geométricas conectando o centro aos pinos */}
            <svg
              className="color-wheel-vectors"
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
              aria-hidden="true"
            >
              {points.map((pt) => (
                <line
                  key={pt.key}
                  x1={WHEEL_RADIUS}
                  y1={WHEEL_RADIUS}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={pt.key === activeKey ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)'}
                  strokeWidth={pt.key === activeKey ? 2.4 : 1.5}
                  strokeDasharray={pt.key === 'background' ? '4 3' : undefined}
                />
              ))}
              <circle cx={WHEEL_RADIUS} cy={WHEEL_RADIUS} r={4} fill="#ffffff" stroke="#111c16" strokeWidth={1.5} />
            </svg>

            {/* 4 Pinos arrastáveis */}
            {points.map((pt) => {
              const isActive = pt.key === activeKey;
              return (
                <button
                  key={pt.key}
                  type="button"
                  data-handle-key={pt.key}
                  role="slider"
                  aria-label={`${pt.label} (Matiz ${pt.h}°, Saturação ${pt.s}%)`}
                  aria-valuemin={0}
                  aria-valuemax={360}
                  aria-valuenow={pt.h}
                  className={`color-wheel-handle${isActive ? ' is-active' : ''}`}
                  style={{
                    left: `${pt.x}px`,
                    top: `${pt.y}px`,
                    backgroundColor: pt.hex,
                    color: getReadableTextColor(pt.hex),
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveKey(pt.key);
                    setDraggingKey(pt.key);
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (draggingKey !== pt.key) return;
                    handlePointerToWheel(e.clientX, e.clientY, pt.key);
                  }}
                  onPointerUp={(e) => {
                    if (draggingKey === pt.key) setDraggingKey(null);
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                  }}
                  onFocus={() => setActiveKey(pt.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      updateHueSatForRole(pt.key, pt.h + 4, pt.s);
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      updateHueSatForRole(pt.key, pt.h - 4, pt.s);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      updateHueSatForRole(pt.key, pt.h, Math.min(100, pt.s + 5));
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      updateHueSatForRole(pt.key, pt.h, Math.max(0, pt.s - 5));
                    }
                  }}
                >
                  {pt.short}
                </button>
              );
            })}
          </div>

          {/* Controle de Luminosidade + Tom do Fundo */}
          <div style={{ display: 'grid', gap: '0.65rem', inlineSize: '100%' }}>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>
                  Luminosidade: <strong>{ROLE_META.find((r) => r.key === activeKey)?.label}</strong>
                </span>
                <span>{activeHsl.l}%</span>
              </div>
              <input
                type="range"
                min={6}
                max={97}
                value={activeHsl.l}
                aria-label="Ajustar luminosidade da cor selecionada"
                onChange={(e) => handleLightnessChange(Number(e.target.value))}
                className="color-wheel-lightness-slider"
                style={{
                  background: `linear-gradient(90deg, #0a0a0a 0%, ${hslToHex(activeHsl.h, activeHsl.s, 50)} 50%, #ffffff 100%)`,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`m3-chip${bgTone === 'light' ? ' is-selected' : ''}`}
                aria-pressed={bgTone === 'light'}
                onClick={() => handleToggleBgTone('light')}
              >
                <Icon name="light_mode" size={16} />
                <span>Fundo Claro</span>
              </button>
              <button
                type="button"
                className={`m3-chip${bgTone === 'dark' ? ' is-selected' : ''}`}
                aria-pressed={bgTone === 'dark'}
                onClick={() => handleToggleBgTone('dark')}
              >
                <Icon name="dark_mode" size={16} />
                <span>Fundo Escuro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Coluna 2: 4 Swatches + Prévia Ao Vivo */}
        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div className="color-wheel-swatches">
            {ROLE_META.map((item) => {
              const hex = value[item.key];
              const isSelected = activeKey === item.key;
              return (
                <div
                  key={item.key}
                  className={`color-swatch-card${isSelected ? ' is-active' : ''}`}
                  onClick={() => setActiveKey(item.key)}
                >
                  <div
                    className="color-swatch-preview"
                    style={{ backgroundColor: hex, color: getReadableTextColor(hex) }}
                  >
                    <span className="color-swatch-num">{item.number}</span>
                    <button
                      type="button"
                      className="color-swatch-copy"
                      title="Copiar HEX"
                      aria-label={`Copiar código HEX de ${item.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCopyHex(item.key, hex);
                      }}
                    >
                      <Icon name={copiedKey === item.key ? 'check' : 'content_copy'} size={15} />
                    </button>
                  </div>

                  <div style={{ padding: '0.55rem', display: 'grid', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 680 }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="color"
                        aria-label={`Seletor nativo ${item.label}`}
                        value={normalizeHex(hex)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const picked = normalizeHex(e.target.value);
                          setActiveKey(item.key);
                          if (rule !== 'custom' && item.key === 'primary') {
                            onChange(generateHarmonyPalette(picked, rule, bgTone));
                          } else {
                            if (rule !== 'custom') setRule('custom');
                            onChange({ ...value, [item.key]: picked });
                          }
                        }}
                        style={{ inlineSize: '2rem', blockSize: '2rem', padding: 0, border: 'none', borderRadius: '0.4rem', cursor: 'pointer', background: 'transparent' }}
                      />
                      <input
                        type="text"
                        className="m3-input"
                        aria-label={`Código HEX ${item.label}`}
                        value={hexDrafts[item.key]}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setHexDrafts((prev) => ({ ...prev, [item.key]: raw }));
                          const clean = raw.trim().replace(/^#/, '');
                          if (/^[0-9a-fA-F]{6}$/.test(clean)) {
                            const normalized = `#${clean.toLowerCase()}`;
                            if (rule !== 'custom' && item.key === 'primary') {
                              onChange(generateHarmonyPalette(normalized, rule, bgTone));
                            } else {
                              if (rule !== 'custom') setRule('custom');
                              onChange({ ...value, [item.key]: normalized });
                            }
                          }
                        }}
                        style={{ minBlockSize: '34px', padding: '0.25rem 0.45rem', fontSize: '0.82rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prévia ao vivo do card do evento */}
          <div
            className="color-wheel-live-preview"
            style={{
              backgroundColor: value.background,
              color: bgText,
              borderColor: value.primary,
            }}
          >
            <div
              className="color-wheel-live-banner"
              style={{
                background: `linear-gradient(135deg, ${value.primary}, ${value.secondary1})`,
                color: primaryText,
              }}
            >
              <span
                className="m3-badge"
                style={{
                  backgroundColor: value.secondary2,
                  color: getReadableTextColor(value.secondary2),
                }}
              >
                {hasCoffeePreview ? 'Inclui Coffee' : 'Evento CAMBLU'}
              </span>
              <strong>{eventTitlePreview.trim() || 'Prévia do Evento CAMBLU'}</strong>
            </div>
            <div style={{ padding: '0.85rem 1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ display: 'grid', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.86 }}>
                  Contraste Primária vs Fundo: <strong>{contrastPrimaryVsBg}:1</strong>{' '}
                  {contrastPrimaryVsBg >= 4.5 ? '(WCAG AA)' : '(Ajuste luminosidade p/ texto)'}
                </span>
                <span style={{ fontSize: '0.8rem', opacity: 0.82 }}>
                  Grátis para Clube Raro, Épico e Lendário
                </span>
              </div>
              <span
                className="m3-btn"
                style={{
                  backgroundColor: value.primary,
                  color: primaryText,
                  minBlockSize: '36px',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.82rem',
                  pointerEvents: 'none',
                }}
              >
                Garantir Ingresso
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
