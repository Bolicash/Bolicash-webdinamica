"use client";

import { startTransition, useState } from "react";
import { crearTrivia } from "@/acciones/trivias";
import {
  aISOBolivia,
  descomponerFechaBolivia,
  formatearFechaHoraBolivia,
} from "@/lib/fechas";

interface PropsFormularioCrearTrivia {
  textoBoton?: string;
  classNameBoton?: string;
  icono?: React.ReactNode;
}

export default function FormularioCrearTrivia({
  textoBoton = "Nueva Dinámica",
  classNameBoton = "flex items-center gap-1.5 rounded-boton bg-primario px-4 py-2 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro transition-colors",
  icono,
}: PropsFormularioCrearTrivia = {}) {
  const [abierto, setAbierto] = useState(false);
  const [equipoA, setEquipoA] = useState("");
  const [equipoB, setEquipoB] = useState("");
  const [plantilla, setPlantilla] = useState("primer_gol_minuto");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [publicada, setPublicada] = useState(true);
  const [premioMonto, setPremioMonto] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [exito, setExito] = useState(false);

  function resetear() {
    setEquipoA("");
    setEquipoB("");
    setFecha("");
    setHora("");
    setPremioMonto(100);
    setPublicada(true);
    setError(null);
    setExito(false);
  }

  function cerrar() {
    setAbierto(false);
    resetear();
  }

  function programarRapido(horasAdelanto: number) {
    const d = new Date(Date.now() + horasAdelanto * 3600000);
    const partes = descomponerFechaBolivia(d);
    setFecha(partes.fechaInput);
    setHora(partes.horaInput);
  }

  async function crear() {
    if (!equipoA.trim() || !equipoB.trim()) {
      setError("Indica los dos equipos del partido.");
      return;
    }
    if (equipoA.trim().toLowerCase() === equipoB.trim().toLowerCase()) {
      setError("Los equipos deben ser diferentes.");
      return;
    }
    if (!fecha || !hora) {
      setError("Define la fecha y hora de cierre de jugadas.");
      return;
    }

    const isoString = aISOBolivia(fecha, hora);
    if (new Date(isoString).getTime() <= Date.now()) {
      setError("La fecha y hora de cierre debe ser en el futuro.");
      return;
    }

    setError(null);
    setPendiente(true);

    const datos = new FormData();
    datos.set("equipo_a", equipoA.trim());
    datos.set("equipo_b", equipoB.trim());
    datos.set("tipo_plantilla", plantilla);
    datos.set("fecha_inicio", isoString);
    datos.set("estado", "activa");
    datos.set("premio_monto", String(premioMonto));
    if (publicada) datos.set("publicada", "on");

    startTransition(() => {
      crearTrivia(null, datos)
        .then((r) => {
          if (r?.error) {
            setError(r.error);
          } else {
            setExito(true);
            setTimeout(() => {
              cerrar();
            }, 1200);
          }
        })
        .finally(() => setPendiente(false));
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={classNameBoton}
      >
        {icono ?? <span className="text-sm leading-none">+</span>} {textoBoton}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[92dvh] flex flex-col rounded-card border border-borde bg-superficie shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera fija */}
            <div className="flex items-center justify-between border-b border-borde px-5 py-3.5 shrink-0 bg-superficie">
              <div>
                <h3 className="text-base font-bold text-texto tracking-tight">
                  Crear Nueva Dinámica
                </h3>
                <p className="text-xs text-texto-suave mt-0.5">
                  Configura el partido y el momento límite para participar.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="rounded-boton p-1 text-texto-suave hover:bg-primario-claro hover:text-texto text-sm font-bold"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {exito ? (
              <div className="py-12 px-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-boton bg-exito/10 text-exito font-bold text-sm">
                  ✓
                </div>
                <h4 className="mt-3 text-base font-bold text-texto">
                  Dinámica creada correctamente
                </h4>
                <p className="mt-1 text-xs text-texto-suave">
                  El listado se ha actualizado en tiempo real.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  crear();
                }}
                className="flex flex-col flex-1 min-h-0 overflow-hidden text-left"
              >
                {/* Cuerpo desplazable para móviles */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">
                  {/* Vista previa en vivo del encuentro */}
                  <div className="relative overflow-hidden rounded-boton border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 text-center shadow-inner">
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                        backgroundSize: "12px 12px",
                      }}
                    />
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-secundario animate-pulse" />
                        Vista previa del partido
                      </span>

                      <div className="mt-2.5 flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-2 w-full max-w-sm px-2">
                        <span className="w-full text-center sm:text-right truncate text-sm sm:text-base font-black uppercase tracking-tight text-blanco min-w-0">
                          {equipoA.trim() || "Equipo Local"}
                        </span>
                        <span className="shrink-0 rounded-boton border border-secundario bg-secundario/15 px-2.5 py-0.5 font-mono text-xs font-black text-secundario">
                          VS
                        </span>
                        <span className="w-full text-center sm:text-left truncate text-sm sm:text-base font-black uppercase tracking-tight text-blanco min-w-0">
                          {equipoB.trim() || "Equipo Visitante"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-400">
                        <span className="rounded bg-secundario/20 border border-secundario/40 px-2 py-0.5 font-bold text-secundario">
                          🏆 Premio: {premioMonto} Bs
                        </span>
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-semibold text-zinc-300">
                          {plantilla === "tiros_esquina" || plantilla === "minuto_gol_equipo"
                            ? "🚩 Tiros de esquina"
                            : "⚽ Primer gol y minuto"}
                        </span>
                        {fecha && hora && (
                          <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300 font-bold">
                            ⏱ Cierre: {formatearFechaHoraBolivia(aISOBolivia(fecha, hora))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Equipos */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave">
                      Equipos del Encuentro
                    </label>
                    <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <input
                        required
                        maxLength={60}
                        value={equipoA}
                        onChange={(e) => setEquipoA(e.target.value)}
                        placeholder="Ej. Real Madrid"
                        className="w-full min-w-0 rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-medium text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                      />
                      <span className="font-mono text-xs font-bold text-texto-suave py-0.5">
                        VS
                      </span>
                      <input
                        required
                        maxLength={60}
                        value={equipoB}
                        onChange={(e) => setEquipoB(e.target.value)}
                        placeholder="Ej. Barcelona"
                        className="w-full min-w-0 rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-medium text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                      />
                    </div>
                  </div>

                  {/* Monto del Premio */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave">
                      Monto del Premio a Repartir (Bs)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={10}
                        step={5}
                        value={premioMonto}
                        onChange={(e) => setPremioMonto(Math.max(1, Number(e.target.value)))}
                        placeholder="100"
                        className="w-full rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-bold font-mono text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                      />
                      <span className="pointer-events-none absolute right-3 top-2 text-xs font-bold text-secundario">
                        Bs
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-texto-suave">
                      Monto del premio a repartir entre quienes acierten el resultado.
                    </p>
                  </div>

                  {/* Tipo de Dinámica */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave">
                      Dinámica de Juego
                    </label>
                    <select
                      value={plantilla}
                      onChange={(e) => setPlantilla(e.target.value)}
                      className="w-full rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-semibold text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                    >
                      <option value="primer_gol_minuto">
                        ⚽ Primer gol y minuto (Quién anota primero y en qué minuto)
                      </option>
                      <option value="tiros_esquina">
                        🚩 Tiros de esquina (Cantidad total de córners del partido)
                      </option>
                    </select>
                  </div>

                  {/* Fecha y Hora de Cierre */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-texto-suave">
                        Cierre de Jugadas
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => programarRapido(2)}
                          className="rounded-boton border border-borde px-2 py-0.5 font-mono text-[11px] font-semibold text-texto-suave hover:bg-primario-claro hover:text-texto transition-colors"
                        >
                          +2h desde ahora
                        </button>
                        <button
                          type="button"
                          onClick={() => programarRapido(24)}
                          className="rounded-boton border border-borde px-2 py-0.5 font-mono text-[11px] font-semibold text-texto-suave hover:bg-primario-claro hover:text-texto transition-colors"
                        >
                          Mañana
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-mono text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                      />
                      <input
                        type="time"
                        required
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-mono text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                      />
                    </div>
                  </div>

                  {/* Visibilidad */}
                  <div className="flex items-center justify-between border-t border-borde pt-3">
                    <div>
                      <span className="block text-xs font-bold text-texto">
                        Publicar inmediatamente
                      </span>
                      <span className="block text-[11px] text-texto-suave">
                        Visible en la página principal para recibir jugadas.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={publicada}
                      onChange={(e) => setPublicada(e.target.checked)}
                      className="h-4 w-4 accent-primario"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-boton border border-error/20 bg-error/10 p-2.5 text-center text-xs font-semibold text-error break-words whitespace-normal leading-relaxed"
                    >
                      {error}
                    </p>
                  )}
                </div>

                {/* Pie fijo de botones de acción */}
                <div className="border-t border-borde px-5 py-3.5 shrink-0 flex items-center justify-end gap-2 bg-superficie">
                  <button
                    type="button"
                    onClick={cerrar}
                    className="rounded-boton border border-borde bg-superficie px-4 py-2 text-xs font-semibold text-texto-suave hover:bg-primario-claro hover:text-texto transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendiente}
                    className="rounded-boton bg-primario px-5 py-2 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro disabled:opacity-50 transition-colors"
                  >
                    {pendiente ? "Creando..." : "Guardar Dinámica"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}