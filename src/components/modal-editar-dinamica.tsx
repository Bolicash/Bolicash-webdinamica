"use client";

import { startTransition, useState } from "react";
import { actualizarTrivia } from "@/acciones/trivias";
import {
  aISOBolivia,
  descomponerFechaBolivia,
  estaVencida,
  formatearFechaHoraBolivia,
} from "@/lib/fechas";

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

  const fechaInicial = descomponerFechaBolivia(dinamica.fecha_inicio);
  const [fecha, setFecha] = useState(() => fechaInicial.fechaInput);
  const [hora, setHora] = useState(() => fechaInicial.horaInput);
  const [premioMonto, setPremioMonto] = useState(dinamica.premio_monto ?? 100);

  // Cálculo en vivo de si la fecha/hora en los inputs está en el pasado
  const isoActualInputs = fecha && hora ? aISOBolivia(fecha, hora) : "";
  const timestampInputs = isoActualInputs ? new Date(isoActualInputs).getTime() : NaN;
  const esFechaPasada = !Number.isNaN(timestampInputs) && timestampInputs <= Date.now();

  const esVencidaInicial = estaVencida(dinamica.fecha_inicio);
  const estadoInicial =
    dinamica.estado !== "borrador" && esVencidaInicial ? "vencida" : dinamica.estado;

  const [estado, setEstado] = useState(estadoInicial);
  const [publicada, setPublicada] = useState(esVencidaInicial ? false : dinamica.publicada);

  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [exito, setExito] = useState(false);

  function abrirModal() {
    setEquipoA(dinamica.equipo_a);
    setEquipoB(dinamica.equipo_b);
    setPlantilla(plantillaInicial);
    const inicial = descomponerFechaBolivia(dinamica.fecha_inicio);
    setFecha(inicial.fechaInput);
    setHora(inicial.horaInput);
    setPremioMonto(dinamica.premio_monto ?? 100);

    // Al abrir el modal, evaluamos de forma precisa el estado de vencimiento
    const vencidaAhora = estaVencida(dinamica.fecha_inicio);
    if (vencidaAhora && dinamica.estado !== "borrador") {
      setEstado("vencida");
      setPublicada(false);
    } else {
      setEstado(dinamica.estado);
      setPublicada(dinamica.publicada);
    }
    setError(null);
    setExito(false);
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setError(null);
    setExito(false);
  }

  function programarRapido(horasAdelanto: number) {
    const d = new Date(Date.now() + horasAdelanto * 3600000);
    const partes = descomponerFechaBolivia(d);
    setFecha(partes.fechaInput);
    setHora(partes.horaInput);
    setEstado("activa");
    setPublicada(true);
    setError(null);
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

    const isoString = aISOBolivia(fecha, hora);
    const fechaTimestamp = new Date(isoString).getTime();
    const fechaGuardarEsPasada = !Number.isNaN(fechaTimestamp) && fechaTimestamp <= Date.now();

    if ((estado === "activa" || publicada) && fechaGuardarEsPasada) {
      setError(
        "Para reactivar o publicar la dinámica, debes configurar una fecha y hora de cierre futura (puedes usar los botones rápidos '+2h' o 'Mañana')."
      );
      return;
    }

    const estadoFinal = estado === "vencida" ? "finalizada" : estado;
    const publicadaFinal = fechaGuardarEsPasada ? false : publicada;

    setError(null);
    setPendiente(true);

    const datos = new FormData();
    datos.set("id", dinamica.id);
    datos.set("equipo_a", valorEquipoA);
    datos.set("equipo_b", valorEquipoB);
    datos.set("tipo_plantilla", valorPlantilla);
    datos.set("fecha_inicio", isoString);
    datos.set("estado", estadoFinal);
    datos.set("premio_monto", String(premioMonto));
    if (publicadaFinal) datos.set("publicada", "on");

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
        onClick={abrirModal}
        className="rounded-boton border border-borde px-2.5 py-1 text-[11px] font-bold text-texto hover:bg-primario-claro transition-colors"
      >
        Editar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[92dvh] flex flex-col rounded-card border border-borde bg-superficie shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera fija */}
            <div className="flex items-center justify-between border-b border-borde px-5 py-3.5 shrink-0 bg-superficie">
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
              <div className="py-12 px-6 text-center">
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
                className="flex flex-col flex-1 min-h-0 overflow-hidden text-left"
              >
                {/* Contenido desplazable para móviles */}
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
                        {esFechaPasada ? (
                          <span className="rounded bg-advertencia/20 border border-advertencia/40 px-2 py-0.5 font-bold text-advertencia">
                            ⏳ Cierre Vencido
                          </span>
                        ) : (
                          <span className="rounded bg-exito/20 border border-exito/40 px-2 py-0.5 font-bold text-exito">
                            🟢 Cierre Vigente
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

                  {/* Estado y Visibilidad */}
                  <div className="border-t border-borde pt-3 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave">
                          Estado
                        </label>
                        <select
                          value={estado}
                          onChange={(e) => {
                            const nuevo = e.target.value;
                            setEstado(nuevo);
                            if (nuevo === "activa") {
                              if (!esFechaPasada) {
                                setPublicada(true);
                              }
                            }
                            if (nuevo === "vencida" || nuevo === "finalizada") {
                              setPublicada(false);
                            }
                          }}
                          className="w-full rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-semibold text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario"
                        >
                          <option value="vencida">Cerrada (Vencida)</option>
                          <option value="activa">Activa</option>
                          <option value="finalizada">Finalizada</option>
                          <option value="borrador">Borrador</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-center">
                        <span className="text-xs font-bold text-texto">Publicada en web</span>
                        <label className="mt-1.5 inline-flex items-center gap-2 cursor-pointer text-xs text-texto-suave">
                          <input
                            type="checkbox"
                            checked={publicada}
                            onChange={(e) => setPublicada(e.target.checked)}
                            className="h-4 w-4 accent-primario"
                          />
                          <span className="font-medium text-texto">Visible para usuarios</span>
                        </label>
                      </div>
                    </div>

                    {/* Mensajes de guía interactiva según estado */}
                    {estado === "vencida" && (
                      <div className="rounded-boton border border-borde bg-primario-claro/50 p-2.5 text-[11px] text-texto-suave flex items-start gap-2 leading-relaxed">
                        <span className="text-sm leading-none">⏳</span>
                        <div>
                          <strong className="text-texto font-bold">Dinámica cerrada por tiempo cumplido.</strong>
                          <p className="mt-0.5">
                            Para volver a publicarla: cambia el estado a <strong className="text-primario font-bold">Activa</strong>, define una fecha y hora futura arriba (o pulsa <strong>+2h desde ahora</strong>) y marca <strong>Visible para usuarios</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {estado === "activa" && esFechaPasada && (
                      <div className="rounded-boton border border-advertencia/30 bg-advertencia/10 p-2.5 text-[11px] text-advertencia flex items-start gap-2 leading-relaxed">
                        <span className="text-sm leading-none">⚠️</span>
                        <div>
                          <strong className="font-bold">El cierre de jugadas sigue en el pasado.</strong>
                          <p className="mt-0.5">
                            Para activar la dinámica y recibir jugadas en la web, cambia la fecha y hora a un momento posterior al actual, o pulsa <strong>+2h desde ahora</strong> o <strong>Mañana</strong>.
                          </p>
                        </div>
                      </div>
                    )}
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
