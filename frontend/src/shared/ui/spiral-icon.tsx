/**
 * The spiral glyph the design places beside the comment send button. It has no
 * equivalent in lucide, so it ships as a path here rather than as an asset —
 * inline SVG inherits `currentColor` and needs no network request.
 */
export function SpiralIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M93 45L67 56L51 71L41 88L37 101L36 115L51 115L53 99L59 86L78 67L101 59L121 61L132 67L140 75L147 89L148 105L140 124L129 134L113 140L97 138L85 126L83 120L85 105L97 93L110 91L116 97L116 102L112 107L100 108L100 123L118 121L129 110L131 104L129 89L121 80L112 76L94 78L83 84L76 91L69 105L68 121L74 137L86 149L102 155L124 153L140 145L155 129L163 106L161 83L153 67L137 52L114 44Z"
      />
    </svg>
  );
}

/** The product mark shown on the sign-in card. */
export function PyramidMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#000000" />
      <path d="M20 10L11 26L20 30L29 26L20 10Z" stroke="#FFFFFF" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M20 10V30" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

/** Google's mark, drawn monochrome to match the sign-in button treatment. */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#111"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#111"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#111"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#111"
      />
    </svg>
  );
}
