"use client";

import { startTransition, useState } from "react";
import { actualizarTrivia } from "@/acciones/trivias";

type DinamicaParaEditar = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  tipo_plantilla: string;
  fecha_inicio: string;
  publicada: boolean;
  estado: string;
  premio_monto?: number;
  total_participaciones?: number;
};

function aFechaInput(d: Date): string {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${dia}`;
}

function aHoraInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function aISOConZona(fecha: string, hora: string): string {
  const d = new Date(`${fecha}T${hora}:00`);
  const off = -d.getTimezoneOffset();
  const signo = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${fecha}T${hora}:00${signo}${hh}:${mm}`;
}

export default function ModalEditarDinamica({
  dinamica,
}: {
  dinamica: DinamicaParaEditar;
}) {
  const totalJugadas = dinamica.total_participaciones ?? 0;
  const tieneJugadas = totalJugadas > 0;

  const [abierto, setAbierto] = useState(false);
  const [equipoA, setEquipoA] = useState(dinamica.equipo_a);
  const [equipoB, setEquipoB] = useState(dinamica.equipo_b);
  const plantillaInicial =
    dinamica.tipo_plantilla === "tiros_esquina" || dinamica.tipo_plantilla === "minuto_gol_equipo"
      ? "tiros_esquina"
      : "primer_gol_minuto";
  const [plantilla, setPlantilla] = useState(plantillaInicial);

  const fechaInicial = new Date(dinamica.fecha_inicio);
  const [fecha, setFecha] = useState(() => aFechaInput(fechaInicial));
  const [hora, setHora] = useState(() => aHoraInput(fechaInicial));
  const [estado, setEstado] = useState(dinamica.estado);
  const [publicada, setPublicada] = useState(dinamica.publicada);
  const [premioMonto, setPremioMonto] = useState(dinamica.premio_monto ?? 100);

  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [exito, setExito] = useState(false);

  function resetear() {
    setEquipoA(dinamica.equipo_a);
    setEquipoB(dinamica.equipo_b);
    setPlantilla(plantillaInicial);
    const d = new Date(dinamica.fecha_inicio);
    setFecha(aFechaInput(d));
    setHora(aHoraInput(d));
    setEstado(dinamica.estado);
    setPublicada(dinamica.publicada);
    setPremioMonto(dinamica.premio_monto ?? 100);
    setError(null);
    setExito(false);
  }

  function cerrar() {
    setAbierto(false);
    resetear();
  }

  function programarRapido(horasAdelanto: number) {
    const d = new Date(Date.now() + horasAdelanto * 3600000);
    setFecha(aFechaInput(d));
    setHora(aHoraInput(d));
  }

  async function guardar() {
    const valorEquipoA = (tieneJugadas ? dinamica.equipo_a : equipoA).trim();
    const valorEquipoB = (tieneJugadas ? dinamica.equipo_b : equipoB).trim();
    const valorPlantilla = tieneJugadas ? dinamica.tipo_plantilla : plantilla;

    if (!valorEquipoA || !valorEquipoB) {
      setError("Indica los dos equipos del partido.");
      return;
    }
    if (valorEquipoA.toLowerCase() === valorEquipoB.toLowerCase()) {
      setError("Los equipos deben ser diferentes.");
      return;
    }
    if (!fecha || !hora) {
      setError("Define la fecha y hora de cierre.");
      return;
    }

    const isoString = aISOConZona(fecha, hora);

    setError(null);
    setPendiente(true);

    const datos = new FormData();
    datos.set("id", dinamica.id);
    datos.set("equipo_a", valorEquipoA);
    datos.set("equipo_b", valorEquipoB);
    datos.set("tipo_plantilla", valorPlantilla);
    datos.set("fecha_inicio", isoString);
    datos.set("estado", estado);
    datos.set("premio_monto", String(premioMonto));
    if (publicada) datos.set("publicada", "on");

    startTransition(() => {
      actualizarTrivia(null, datos)
        .then((r) => {
          if (r?.error) {
            setError(r.error);
          } else {
            setExito(true);
            setTimeout(() => {
              setAbierto(false);
              setExito(false);
            }, 1000);
          }
        })
        .finally(() => setPendiente(false));
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetear();
          setAbierto(true);
        }}
        className="rounded-boton border border-borde px-2.5 py-1 text-[11px] font-bold text-texto hover:bg-primario-claro transition-colors"
      >
        Editar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div className="w-full max-w-lg rounded-card border border-borde bg-superficie p-6 shadow-modal">
            <div className="flex items-center justify-between border-b border-borde pb-3">
              <div>
                <h3 className="text-base font-bold text-texto tracking-tight">
                  Editar Dinámica
                </h3>
                <p className="text-xs text-texto-suave mt-0.5">
                  Modifica los equipos, el horario de cierre o el estado.
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
              <div className="py-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-boton bg-exito/10 text-exito font-bold text-sm">
                  ✓
                </div>
                <h4 className="mt-3 text-base font-bold text-texto">
                  Dinámica actualizada
                </h4>
                <p className="mt-1 text-xs text-texto-suave">
                  Los cambios se aplicaron correctamente.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar();
                }}
                className="mt-4 flex flex-col gap-4 text-left"
              >
                {/* Vista previa en vivo del encuentro (fondo y texto, sin imagen) */}
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
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-400">
                          ⏱ Cierre: {fecha} {hora}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aviso informativo si ya existen jugadas */}
                {tieneJugadas && (
                  <div className="rounded-card border border-advertencia/30 bg-advertencia/10 p-3 text-xs flex items-start gap-2.5">
                    <span className="text-base leading-none">🔒</span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-advertencia">
                        Edición protegida ({totalJugadas} {totalJugadas === 1 ? "jugada registrada" : "jugadas registradas"})
                      </p>
                      <p className="text-[11px] text-texto-suave leading-relaxed">
                        Para no invalidar los votos que ya emitieron los participantes, los <strong>equipos</strong> y el <strong>tipo de juego</strong> no se pueden modificar. Puedes ajustar el horario de cierre, el premio y la visibilidad.
                      </p>
                    </div>
                  </div>
                )}

                {/* Equipos */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-texto-suave">
                      Equipos del Encuentro
                    </label>
                    {tieneJugadas && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-advertencia bg-advertencia/15 px-2 py-0.5 rounded">
                        🔒 Protegido
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      required
                      maxLength={60}
                      disabled={tieneJugadas}
                      value={equipoA}
                      onChange={(e) => setEquipoA(e.target.value)}
                      placeholder="Local"
                      className="w-full min-w-0 rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-medium text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-primario-claro/40"
                    />
                    <span className="font-mono text-xs font-bold text-texto-suave py-0.5">
                      VS
                    </span>
                    <input
                      required
                      maxLength={60}
                      disabled={tieneJugadas}
                      value={equipoB}
                      onChange={(e) => setEquipoB(e.target.value)}
                      placeholder="Visitante"
                      className="w-full min-w-0 rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-medium text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-primario-claro/40"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-texto-suave">
                      Dinámica de Juego
                    </label>
                    {tieneJugadas && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-advertencia bg-advertencia/15 px-2 py-0.5 rounded">
                        🔒 Protegido
                      </span>
                    )}
                  </div>
                  <select
                    disabled={tieneJugadas}
                    value={plantilla}
                    onChange={(e) => setPlantilla(e.target.value)}
                    className="w-full rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-semibold text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-primario-claro/40"
                  >
                    <option value="primer_gol_minuto">
                      ⚽ Primer gol y minuto (Quién anota primero y en qué minuto)
                    </option>
                    <option value="tiros_esquina">
                      🚩 Tiros de esquina (Equipo y cantidad exacta de córners)
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
                        className="rounded-boton border border-borde px-2 py-0.5 font-mono text-[11px] font-semibold text-texto-suave hover:bg-primario-claro hover:text-texto"
                      >
                        +2h desde ahora
                      </button>
                      <button
                        type="button"
                        onClick={() => programarRapido(24)}
                        className="rounded-boton border border-borde px-2 py-0.5 font-mono text-[11px] font-semibold text-texto-suave hover:bg-primario-claro hover:text-texto"
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

                {/* Estado y Visibilidad */}
                <div className="grid grid-cols-2 gap-3 border-t border-borde pt-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave">
                      Estado
                    </label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full rounded-boton border border-borde bg-superficie px-3 py-1.5 text-xs font-semibold text-texto outline-none focus:border-primario"
                    >
                      <option value="activa">Activa</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="borrador">Borrador</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-texto">Publicada en web</span>
                    <label className="mt-1 inline-flex items-center gap-2 cursor-pointer text-xs text-texto-suave">
                      <input
                        type="checkbox"
                        checked={publicada}
                        onChange={(e) => setPublicada(e.target.checked)}
                        className="h-4 w-4 accent-primario"
                      />
                      <span>Visible para usuarios</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-boton border border-error/20 bg-error/10 p-2.5 text-center text-xs font-semibold text-error break-words whitespace-normal leading-relaxed"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cerrar}
                    className="rounded-boton border border-borde bg-superficie px-4 py-2 text-xs font-semibold text-texto-suave hover:bg-primario-claro hover:text-texto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendiente}
                    className="rounded-boton bg-primario px-5 py-2 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro disabled:opacity-50 transition-colors"
                  >
                    {pendiente ? "Guardando..." : "Guardar Cambios"}
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
