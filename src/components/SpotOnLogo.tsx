interface Props {
  /** 'normal' ≈ 120×26px  |  'small' ≈ 80×18px */
  size?: 'normal' | 'small';
  /** text colour: 'dark' = navy (on light bg)  |  'light' = white (on dark bg) */
  variant?: 'dark' | 'light';
}

export function SpotOnLogo({ size = 'normal', variant = 'dark' }: Props) {
  const scale = size === 'small' ? 0.72 : 1;
  const w = Math.round(132 * scale);
  const h = Math.round(28 * scale);
  const textFill = variant === 'light' ? '#ffffff' : '#0f1e3d';

  return (
    <svg
      viewBox="0 0 132 28"
      width={w}
      height={h}
      role="img"
      aria-label="SpotOn"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Icon: bullseye "spot" mark */}
      <circle cx="14" cy="14" r="11" fill="#e8194b" />
      <circle cx="14" cy="14" r="7"  fill="#ffffff" />
      <circle cx="14" cy="14" r="3.5" fill="#e8194b" />

      {/* Wordmark */}
      <text
        x="30"
        y="21"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill={textFill}
      >
        Spot
      </text>
      <text
        x="76"
        y="21"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill="#e8194b"
      >
        On
      </text>
    </svg>
  );
}
