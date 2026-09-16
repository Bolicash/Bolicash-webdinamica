import type { ReactNode } from "react";

function Base({ className = "h-5 w-5", children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconoPanel({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Base>
  );
}

export function IconoTrivia({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5V8z" />
      <path d="M13 6v2M13 11v2M13 16v2" />
    </Base>
  );
}

export function IconoParticipantes({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17.5 14.4c2.2.8 4 2.7 4 5.6" />
    </Base>
  );
}

export function IconoGanadores({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H4.5a3 3 0 0 0 3.2 4.9M16 5h3.5a3 3 0 0 1-3.2 4.9" />
      <path d="M12 13v4M8.5 20h7M10 17h4" />
    </Base>
  );
}

export function IconoContactos({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M7.5 17c.8-2.3 2.5-3.5 4.5-3.5s3.7 1.2 4.5 3.5" />
    </Base>
  );
}

export function IconoSalir({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Base>
  );
}

export function IconoMas({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconoDescargar({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </Base>
  );
}

export function IconoBuscar({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Base>
  );
}

export function IconoMenu({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </Base>
  );
}

export function IconoCerrar({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Base>
  );
}

export function IconoFlechaDerecha({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Base>
  );
}

export function IconoChevronDerecha({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M9 18l6-6-6-6" />
    </Base>
  );
}

export function IconoChevronAbajo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  );
}