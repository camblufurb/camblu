import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface SplitButtonMenuItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
}

interface M3SplitButtonProps {
  primaryLabel: string;
  primaryIcon: string;
  onPrimaryClick: () => void;
  menuItems?: SplitButtonMenuItem[];
  onTrailingClick?: () => void;
  trailingIcon?: string;
  trailingAriaLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  menuAriaLabel?: string;
}

/**
 * Material Design 3 Expressive Split Button combining a primary pill-left action
 * with a trailing action button (either direct action or animated dropdown menu).
 */
export function M3SplitButton({
  primaryLabel,
  primaryIcon,
  onPrimaryClick,
  menuItems = [],
  onTrailingClick,
  trailingIcon = 'expand_more',
  trailingAriaLabel,
  disabled = false,
  loading = false,
  menuAriaLabel = 'Mais opções',
}: M3SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="m3-split-btn" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="m3-split-btn__leading"
        disabled={disabled || loading}
        onClick={() => {
          setOpen(false);
          onPrimaryClick();
        }}
      >
        <Icon name={loading ? 'hourglass_top' : primaryIcon} size={18} />
        <span>{primaryLabel}</span>
      </button>

      <button
        type="button"
        className="m3-split-btn__trailing"
        disabled={disabled || loading}
        aria-haspopup={onTrailingClick ? undefined : 'menu'}
        aria-expanded={onTrailingClick ? undefined : open}
        aria-controls={onTrailingClick ? undefined : menuId}
        aria-label={trailingAriaLabel || menuAriaLabel}
        onClick={() => {
          if (onTrailingClick) {
            setOpen(false);
            onTrailingClick();
            return;
          }
          setOpen((prev) => !prev);
        }}
      >
        <Icon
          name={trailingIcon}
          size={19}
          className={onTrailingClick ? undefined : 'm3-split-btn__chevron'}
        />
      </button>

      {!onTrailingClick && menuItems.length > 0 && (
        <div
          id={menuId}
          role="menu"
          className="m3-split-btn__menu"
          aria-hidden={!open}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
