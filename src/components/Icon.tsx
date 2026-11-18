interface IconProps {
  name: string;
  filled?: boolean;
  variant?: 'rounded' | 'outlined';
  className?: string;
  size?: number;
  label?: string;
}

export function Icon({
  name,
  filled = false,
  variant = 'rounded',
  className = '',
  size,
  label,
}: IconProps) {
  const familyClass = variant === 'outlined' ? 'material-symbols-outlined' : 'material-symbols-rounded';
  const classes = [familyClass, variant === 'rounded' && filled ? 'is-filled' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={size ? { fontSize: `${size}px` } : undefined}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {name}
    </span>
  );
}
