/**
 * Módulo centralizado para fechas y horarios en la zona horaria de Bolivia.
 *
 * Bolivia opera bajo America/La_Paz (UTC-4), sin horario de verano.
 * Al fijar explícitamente esta zona horaria tanto en servidor (SSR Vercel / Node en UTC)
 * como en clientes (navegadores móviles y desktop), se erradica cualquier salto de día o desfase de horas.
 */

export const ZONA_HORARIA_BOLIVIA = "America/La_Paz";
export const OFFSET_BOLIVIA = "-04:00";

/**
 * Formatea una fecha ISO a "DD/MM/YYYY, HH:mm" en hora de Bolivia.
 * Ejemplo: "18/09/2026, 20:24"
 */
export function formatearFechaHoraBolivia(fechaIso: string | Date | null | undefined): string {
  if (!fechaIso) return "-";
  const d = typeof fechaIso === "string" ? new Date(fechaIso) : fechaIso;
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Formatea una fecha ISO a "DD/MM, HH:mm" en hora de Bolivia para tarjetas móviles.
 * Ejemplo: "18/09, 20:24"
 */
export function formatearFechaCortaBolivia(fechaIso: string | Date | null | undefined): string {
  if (!fechaIso) return "-";
  const d = typeof fechaIso === "string" ? new Date(fechaIso) : fechaIso;
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Descompone una fecha ISO a valores listos para inputs HTML (<input type="date"> y <input type="time">),
 * siempre referenciados en hora de Bolivia.
 */
export function descomponerFechaBolivia(fechaIso: string | Date | null | undefined): {
  fechaInput: string;
  horaInput: string;
} {
  const d = !fechaIso
    ? new Date()
    : typeof fechaIso === "string"
    ? new Date(fechaIso)
    : fechaIso;

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(Number.isNaN(d.getTime()) ? new Date() : d);

  const valores: Record<string, string> = {};
  for (const p of partes) {
    valores[p.type] = p.value;
  }

  const anio = valores.year ?? "2026";
  const mes = (valores.month ?? "01").padStart(2, "0");
  const dia = (valores.day ?? "01").padStart(2, "0");
  const hora = (valores.hour === "24" ? "00" : valores.hour ?? "00").padStart(2, "0");
  const minuto = (valores.minute ?? "00").padStart(2, "0");

  return {
    fechaInput: `${anio}-${mes}-${dia}`,
    horaInput: `${hora}:${minuto}`,
  };
}

/**
 * Construye una cadena ISO con el offset explícito de Bolivia (-04:00).
 * Recibe fecha en formato "YYYY-MM-DD" y hora en "HH:mm".
 */
export function aISOBolivia(fecha: string, hora: string): string {
  const horaLimpia = hora.length === 5 ? `${hora}:00` : hora;
  return `${fecha}T${horaLimpia}${OFFSET_BOLIVIA}`;
}

/**
 * Comprueba si una fecha límite ya expiró respecto al momento actual.
 */
export function estaVencida(fechaInicio: string | Date | null | undefined): boolean {
  if (!fechaInicio) return false;
  const d = typeof fechaInicio === "string" ? new Date(fechaInicio) : fechaInicio;
  return d.getTime() <= Date.now();
}
