/**
 * EnFlag — composite "English" flag for the language selector.
 * English has no single national flag, so we render a three-panel mark
 * combining the United Kingdom, United States, and Australian flags.
 * Impressionistic by design: legible at ~16-24px, not pixel-accurate.
 */
type Props = {
  size?: number;
  className?: string;
};

export function EnFlag({ size = 22, className }: Props) {
  const height = Math.round((size * 40) / 66);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 66 40"
      role="img"
      aria-label="English"
      className={className}
    >
      <defs>
        <clipPath id="enFlagClip">
          <rect x="0" y="0" width="66" height="40" rx="5" />
        </clipPath>
      </defs>
      <g clipPath="url(#enFlagClip)">
        {/* ── United Kingdom ── */}
        <g>
          <rect x="0" y="0" width="22" height="40" fill="#012169" />
          <path d="M0 0 L22 40 M22 0 L0 40" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M0 0 L22 40 M22 0 L0 40" stroke="#C8102E" strokeWidth="2.4" />
          <rect x="8" y="0" width="6" height="40" fill="#FFFFFF" />
          <rect x="0" y="14" width="22" height="12" fill="#FFFFFF" />
          <rect x="9.4" y="0" width="3.2" height="40" fill="#C8102E" />
          <rect x="0" y="16.4" width="22" height="7.2" fill="#C8102E" />
        </g>

        {/* ── United States ── */}
        <g transform="translate(22 0)">
          <rect x="0" y="0" width="22" height="40" fill="#FFFFFF" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect
              key={i}
              x="0"
              y={i * (40 / 13)}
              width="22"
              height={40 / 13}
              fill="#B22234"
            />
          ))}
          <rect x="0" y="0" width="9.5" height={40 / 13 * 7} fill="#3C3B6E" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={2 + col * 3}
                cy={2.4 + row * 4.6}
                r="0.7"
                fill="#FFFFFF"
              />
            )),
          )}
        </g>

        {/* ── Australia ── */}
        <g transform="translate(44 0)">
          <rect x="0" y="0" width="22" height="40" fill="#00247D" />
          {/* Union Jack canton (simplified) */}
          <rect x="0" y="0" width="10" height="18" fill="#012169" />
          <path d="M0 0 L10 18 M10 0 L0 18" stroke="#FFFFFF" strokeWidth="2.6" />
          <path d="M0 0 L10 18 M10 0 L0 18" stroke="#C8102E" strokeWidth="1.1" />
          <rect x="3.8" y="0" width="2.4" height="18" fill="#FFFFFF" />
          <rect x="0" y="6.6" width="10" height="4.8" fill="#FFFFFF" />
          <rect x="4.4" y="0" width="1.2" height="18" fill="#C8102E" />
          <rect x="0" y="7.8" width="10" height="2.4" fill="#C8102E" />
          {/* Commonwealth star */}
          <circle cx="5" cy="30" r="1.5" fill="#FFFFFF" />
          {/* Southern Cross */}
          <circle cx="16" cy="9" r="1" fill="#FFFFFF" />
          <circle cx="18.5" cy="20" r="1" fill="#FFFFFF" />
          <circle cx="14.5" cy="24" r="1" fill="#FFFFFF" />
          <circle cx="16" cy="33" r="1" fill="#FFFFFF" />
          <circle cx="13" cy="16.5" r="0.7" fill="#FFFFFF" />
        </g>
      </g>
      <rect
        x="0.5"
        y="0.5"
        width="65"
        height="39"
        rx="4.5"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
      />
    </svg>
  );
}
