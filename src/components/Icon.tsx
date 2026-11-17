interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
  label?: string;
}

export function Icon({ name, filled = false, className = '', size, label }: IconProps) {
  const classes = ['material-symbols-rounded', filled ? 'is-filled' : '', className]
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
