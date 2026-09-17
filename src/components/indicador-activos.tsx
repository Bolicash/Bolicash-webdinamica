"use client";

import { IconoChevronDerecha } from "@/components/iconos";

export default function IndicadorActivos({
  total,
  cargando,
  onClick,
}: {
  total: number;
  cargando?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="group relative w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-dorado-500/40 hover:border-dorado-400 shadow-md hover:shadow-[0_0_16px_rgba(245,158,11,0.25)] transition-all duration-200 active:scale-[0.99] cursor-pointer overflow-hidden"
    >
      {/* Luz ambiental dorada sutil */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-dorado-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-hidden="true"
      />

      {/* Indicador de Votos con Punto Verde Pulsante */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
        </span>

        <span className="text-xs font-bold text-zinc-200 whitespace-nowrap">
          {cargando && total === 0 ? (
            <span className="text-zinc-400 text-[11px]">Cargando...</span>
          ) : total === 0 ? (
            <span className="text-zinc-300 text-[11px] sm:text-xs">0 participantes</span>
          ) : (
            <span className="text-zinc-200 text-[11px] sm:text-xs">
              <strong className="text-dorado-400 font-black font-mono text-xs sm:text-sm">
                {total}
              </strong>{" "}
              {total === 1 ? "participante" : "participantes"}
            </span>
          )}
        </span>
      </div>

      {/* Botón de acción hacia el modal */}
      <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-dorado-500/15 group-hover:bg-dorado-500/25 border border-dorado-400/40 group-hover:border-dorado-400 text-[11px] font-black uppercase tracking-wider text-dorado-400 group-hover:text-dorado-300 transition-all shadow-xs">
        <span>Ver qué votaron</span>
        <IconoChevronDerecha className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
