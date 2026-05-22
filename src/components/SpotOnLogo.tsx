interface Props {
  /** 'normal' ≈ 120×30px  |  'small' ≈ 86×22px */
  size?: 'normal' | 'small';
  /** 'dark' = near-black (on light bg)  |  'light' = white (on dark bg) */
  variant?: 'dark' | 'light';
}

export function SpotOnLogo({ size = 'normal', variant = 'dark' }: Props) {
  const scale = size === 'small' ? 0.72 : 1;
  const w = Math.round(120 * scale);
  const h = Math.round(30 * scale);
  const color = variant === 'light' ? '#ffffff' : '#111111';

  return (
    <svg
      viewBox="0 0 120 30"
      width={w}
      height={h}
      role="img"
      aria-label="SpotOn"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/*
        Thick ring (donut) icon — evenodd fill-rule punches the inner circle out.
        Outer circle: cx=15 cy=15 r=13  →  M 2,15 A 13,13 …
        Inner circle: cx=15 cy=15 r=7   →  M 8,15 A 7,7  …
      */}
      <path
        fillRule="evenodd"
        d="M 2,15 A 13,13 0 1,0 28,15 A 13,13 0 1,0 2,15 Z
           M 8,15 A 7,7 0 1,0 22,15 A 7,7 0 1,0 8,15 Z"
        fill={color}
      />

      {/* Wordmark — single word, rounded bold sans-serif */}
      <text
        x="36"
        y="22.5"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fontSize="20"
        letterSpacing="-0.4"
        fill={color}
      >
        SpotOn
      </text>
    </svg>
  );
}
