"use client";

import { useEffect, useMemo, useState } from "react";
import { IconoBuscar, IconoCerrar } from "@/components/iconos";
import type { TriviaActiva } from "@/lib/trivias";
import type { PronosticoPublico } from "@/acciones/pronosticos-publicos";
import { formatearFechaHoraBolivia } from "@/lib/fechas";

export default function ModalPronosticosEnVivo({
  abierto,
  onCerrar,
  trivia,
  pronosticos,
  cargando,
  onRecargar,
}: {
  abierto: boolean;
  onCerrar: () => void;
  trivia: TriviaActiva;
  pronosticos: PronosticoPublico[];
  cargando: boolean;
  onRecargar: () => void;
}) {
  const [filtroEquipo, setFiltroEquipo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  const esTirosEsquina =
    trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo";

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!abierto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  // Evitar scroll en el body de fondo
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  // Contadores por equipo
  const totalEquipoA = useMemo(
    () => pronosticos.filter((p) => p.equipo_seleccionado === trivia.equipo_a).length,
    [pronosticos, trivia.equipo_a]
  );
  const totalEquipoB = useMemo(
    () => pronosticos.filter((p) => p.equipo_seleccionado === trivia.equipo_b).length,
    [pronosticos, trivia.equipo_b]
  );

  const porcentajeA = pronosticos.length > 0 ? Math.round((totalEquipoA / pronosticos.length) * 100) : 50;
  const porcentajeB = pronosticos.length > 0 ? 100 - porcentajeA : 50;

  // Filtrado reactivo
  const filtrados = useMemo(() => {
    let res = pronosticos;
    if (filtroEquipo !== "todos") {
      res = res.filter((p) => p.equipo_seleccionado === filtroEquipo);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      res = res.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return res;
  }, [pronosticos, filtroEquipo, busqueda]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-pronosticos"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Telón de fondo oscuro */}
      <div
        className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md transition-opacity"
        onClick={onCerrar}
        aria-hidden="true"
      />

      {/* Ventana Modal Compacta */}
      <div className="relative z-10 w-full max-w-lg max-h-[85dvh] flex flex-col rounded-2xl sm:rounded-3xl border-2 border-dorado-500/70 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-blanco shadow-2xl shadow-dorado-500/20 overflow-hidden">
        {/* Cabecera */}
        <header className="p-3.5 sm:p-4 border-b border-zinc-800/80 bg-zinc-950/90 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  EN VIVO
                </span>
                <span className="text-[11px] font-mono font-bold text-dorado-400">
                  {pronosticos.length} {pronosticos.length === 1 ? "jugada" : "jugadas"}
                </span>
              </div>

              <h2
                id="titulo-modal-pronosticos"
                className="text-sm sm:text-base font-black uppercase tracking-tight text-blanco mt-0.5 truncate"
              >
                Pronósticos de los Hinchas
              </h2>
            </div>

            {/* Botones de acción rápida: Recargar y Cerrar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onRecargar}
                disabled={cargando}
                title="Actualizar jugadas"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-blanco hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                aria-label="Actualizar"
              >
                <span className={`text-sm ${cargando ? "animate-spin" : ""}`}>↻</span>
              </button>

              <button
                type="button"
                onClick={onCerrar}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-blanco hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Barra de Distribución */}
          {pronosticos.length > 0 && (
            <div className="mt-3 p-2 sm:p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-zinc-300 mb-1">
                <span className="flex items-center gap-1 min-w-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-dorado-400 shrink-0" />
                  <span className="truncate">{trivia.equipo_a}</span>
                  <strong className="text-dorado-400 font-mono ml-0.5">({porcentajeA}%)</strong>
                </span>
                <span className="flex items-center gap-1 justify-end min-w-0">
                  <strong className="text-emerald-400 font-mono mr-0.5">({porcentajeB}%)</strong>
                  <span className="truncate">{trivia.equipo_b}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden flex border border-zinc-800">
                <div
                  style={{ width: `${porcentajeA}%` }}
                  className="h-full bg-gradient-to-r from-dorado-600 to-dorado-400 transition-all duration-500"
                />
                <div
                  style={{ width: `${porcentajeB}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                />
              </div>
            </div>
          )}

          {/* Buscador y Pestañas */}
          <div className="mt-2.5 flex flex-col gap-2">
            {/* Campo de búsqueda */}
            <div className="relative flex items-center">
              <IconoBuscar className="absolute left-3 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-1.5 pl-8 pr-7 text-xs text-blanco placeholder:text-zinc-500 focus:border-dorado-400 focus:outline-none focus:ring-1 focus:ring-dorado-400"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2 text-xs text-zinc-400 hover:text-blanco p-0.5 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pestañas de filtro por equipo (Scroll horizontal sin scrollbar fea) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFiltroEquipo("todos")}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  filtroEquipo === "todos"
                    ? "bg-dorado-500 text-zinc-950 font-black shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-blanco hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                Todos ({pronosticos.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroEquipo(trivia.equipo_a)}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  filtroEquipo === trivia.equipo_a
                    ? "bg-dorado-500 text-zinc-950 font-black shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-blanco hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {trivia.equipo_a} ({totalEquipoA})
              </button>

              <button
                type="button"
                onClick={() => setFiltroEquipo(trivia.equipo_b)}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  filtroEquipo === trivia.equipo_b
                    ? "bg-dorado-500 text-zinc-950 font-black shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-blanco hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {trivia.equipo_b} ({totalEquipoB})
              </button>
            </div>
          </div>
        </header>

        {/* Lista de Pronósticos (SIN SCROLLBAR FEA) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {cargando && pronosticos.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <span className="h-5 w-5 rounded-full border-2 border-dorado-400 border-t-transparent animate-spin mb-2" />
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Cargando pronósticos...
              </p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center px-4">
              <span className="text-2xl mb-2">⚽</span>
              <p className="text-xs sm:text-sm font-bold text-blanco">
                {pronosticos.length === 0
                  ? "Aún no hay jugadas registradas"
                  : "Sin resultados para tu búsqueda"}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {pronosticos.length === 0
                  ? "¡Sé el primer hincha en registrar tu jugada!"
                  : "Prueba con otro término de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtrados.map((p, idx) => {
                const esEquipoA = p.equipo_seleccionado === trivia.equipo_a;

                return (
                  <div
                    key={`${p.nombre}-${p.registrado_en}-${idx}`}
                    className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 transition-colors"
                  >
                    {/* Nombre y Equipo (Sin círculo avatar que coma espacio) */}
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs sm:text-sm font-bold text-blanco truncate leading-tight">
                        {p.nombre}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                            esEquipoA ? "bg-dorado-400" : "bg-emerald-400"
                          }`}
                        />
                        <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 truncate">
                          {p.equipo_seleccionado}
                        </span>
                      </div>
                    </div>

                    {/* Pronóstico Resaltado */}
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-950 border border-dorado-500/30 text-dorado-400 font-mono text-[11px] sm:text-xs font-black shadow-inner">
                        {esTirosEsquina ? (
                          <>
                            <span>🚩</span>
                            <span>{p.minuto_pronosticado} córners</span>
                          </>
                        ) : (
                          <>
                            <span>⏱</span>
                            <span>Min {p.minuto_pronosticado}&apos;</span>
                          </>
                        )}
                      </span>
                      <span className="block text-[9px] font-mono text-zinc-500 mt-0.5">
                        {formatearFechaHoraBolivia(p.registrado_en)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
