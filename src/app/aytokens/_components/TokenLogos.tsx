/**
 * ayHBAR token icons, inlined as SVG (class selectors → explicit fills) so the
 * pages render the real token marks without an extra request or a
 * no-img-element lint warning.
 */
import { cn } from '@/lib/utils';

/**
 * ayHBAR mark — the AlphaYields leaf on the standard disc, with the black HBAR
 * "ℏ" disc (the design's badge art) as the corner badge.
 */

export function AyHbarLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <circle cx="234.44" cy="227.2" r="224.51" fill="#545557" />
      <path fill="#a6ed45" d="M331.78,234.28c-3.23-11.66-3.54-33.76.19-42.93,8.75-21.5,15.59-30.33,23.57-35.96,25.47-17.98,29.88-32.52,20.53-59.42-9.35-26.9-27.6-34.11-55.23-37.03-19.91-2.1-39.98,4.23-57.5,14.21-11.85,6.75-18.44,10.7-26.17,16.71-13.73,10.72-30.51,16.57-47.76,16.34-7.6-.11-15.26-.3-22.65.7-22.8,3.1-43.07,18.15-56.11,37.63-13.05,19.49-19.34,43.07-21.53,66.61-3.34,36.1,3.26,74.37,24.54,103.32,21.27,28.94,58.84,46.44,93,37.37,13.37-3.6,26.93-10.94,40.23-7.11,17.46,5.07,24.64,26.15,38.08,38.69,15.97,14.9,41.63,16.27,60.26,5.07,18.63-11.2,29.89-33.23,30.74-55.39.84-22.16-7.98-44.06-21.93-60.97-9.49-11.48-18.23-23.33-22.24-37.82ZM319.2,241.12c-11.02,32.53-38.46,46.87-56.6,56.37-19.53,10.23-57.58,30.15-89.3,11.58-35.73-20.87-35.73-74.23-35.73-84.04-.02-17.65,3.93-35.08,11.55-50.99,3.73-7.66,28.46-58.43,77.98-61.05,44.1-2.33,72.2,35.41,76.24,40.98,3.5,4.88,30.57,43.72,15.85,87.16h0Z" />
      <circle cx="386.5" cy="385.4" r="112.5" fill="#545557" />
      <circle cx="386.5" cy="385.4" r="86.92" fill="#0A0A0A" />
      <g transform="translate(338.5 337.4) scale(4)">
        <rect x="4" y="3" width="3.6" height="18" fill="#F4F5F2" />
        <rect x="16.4" y="3" width="3.6" height="18" fill="#F4F5F2" />
        <rect x="7.6" y="8.6" width="8.8" height="2.4" fill="#F4F5F2" />
        <rect x="7.6" y="13" width="8.8" height="2.4" fill="#F4F5F2" />
      </g>
    </svg>
  );
}

/** HBAR native-token icon — black disc with the "ℏ" glyph from the design. */
export function HbarLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="#0A0A0A" />
      <g transform="translate(4.8 4.8) scale(0.6)">
        <rect x="4" y="3" width="3.6" height="18" fill="#F4F5F2" />
        <rect x="16.4" y="3" width="3.6" height="18" fill="#F4F5F2" />
        <rect x="7.6" y="8.6" width="8.8" height="2.4" fill="#F4F5F2" />
        <rect x="7.6" y="13" width="8.8" height="2.4" fill="#F4F5F2" />
      </g>
    </svg>
  );
}

/** Resolve the token icon by symbol. */
export function TokenLogo({ className }: { symbol: string; className?: string }) {
  return <AyHbarLogo className={className} />;
}
