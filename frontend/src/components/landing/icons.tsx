import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  rocket: (p: IconProps) => (
    <Base {...p}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </Base>
  ),
  trend: (p: IconProps) => (
    <Base {...p}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </Base>
  ),
  users: (p: IconProps) => (
    <Base {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  ),
  trophy: (p: IconProps) => (
    <Base {...p}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4" />
      <path d="M7 5H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4" />
    </Base>
  ),
  clipboard: (p: IconProps) => (
    <Base {...p}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </Base>
  ),
  target: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Base>
  ),
  box: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </Base>
  ),
  bolt: (p: IconProps) => (
    <Base {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Base>
  ),
  search: (p: IconProps) => (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Base>
  ),
  network: (p: IconProps) => (
    <Base {...p}>
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7 7l3.5 9.5M17 7l-3.5 9.5" />
    </Base>
  ),
  shield: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  ),
  gauge: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 20a8 8 0 1 0-8-8" />
      <path d="M12 12l3-3" />
      <path d="M12 4v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </Base>
  ),
  arrowRight: (p: IconProps) => (
    <Base {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Base>
  ),
  play: (p: IconProps) => (
    <Base {...p}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </Base>
  ),
  menu: (p: IconProps) => (
    <Base {...p}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Base>
  ),
  close: (p: IconProps) => (
    <Base {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Base>
  ),
  sparkle: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z" />
    </Base>
  ),
  linkedin: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H21.4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H13.7z" />
    </svg>
  ),
  twitter: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.46l7.73-8.84L1.04 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.01 4.13H5.05z" />
    </svg>
  ),
  youtube: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.5zM9.6 15.6V8.4l6.2 3.6z" />
    </svg>
  ),
  instagram: (p: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      {...p}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
} as const;

export type IconName = keyof typeof Icon;
