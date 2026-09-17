"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { IconoBuscar, IconoDescargar, IconoFlechaDerecha } from "@/components/iconos";
import { guardarYBuscarGanadores } from "@/acciones/ganadores";
import { formatearFechaHoraBolivia } from "@/lib/fechas";

export type FilaParticipacion = {
  nombre: string;
  whatsapp: string;
  equipo_seleccionado: string;
  minuto_pronosticado: number;
  registrado_en: string;
};

export type TriviaMini = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  fecha_inicio: string;
  total_participaciones?: number;
  premio_monto?: number;
  equipo_ganador_real?: string | null;
  minuto_ganador_real?: number | null;
  tipo_plantilla?: string;
  estado?: string;
};

function limpiarTelefonoWhatsApp(telefono: string): string {
  return telefono.replace(/[^\d]/g, "");
}

export default function TablaParticipaciones({
  trivia,
  filas,
}: {
  trivia: TriviaMini;
  filas: FilaParticipacion[];
}) {
  const esTirosEsquina =
    trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo";
  const maxValor = esTirosEsquina ? 30 : 120;
  const [busqueda, setBusqueda] = useState("");
  const [filtroEquipo, setFiltroEquipo] = useState(trivia.equipo_ganador_real ?? "");
  const [filtroMinuto, setFiltroMinuto] = useState(
    trivia.minuto_ganador_real != null ? String(trivia.minuto_ganador_real) : ""
  );
  const [oficializando, setOficializando] = useState(false);
  const [errorOficializar, setErrorOficializar] = useState<string | null>(null);
  const [exitoOficializar, setExitoOficializar] = useState(false);

  const premioTotal = trivia.premio_monto ?? 100;

  // Filtrar acertantes cuando se especifica equipo y minuto
  const minutoNum = filtroMinuto.trim() !== "" ? Number(filtroMinuto) : null;
  const hayFiltroResultado = Boolean(
    filtroEquipo && minutoNum !== null && !Number.isNaN(minutoNum) && minutoNum >= 0 && minutoNum <= 120
  );

  const acertantes = useMemo(() => {
    if (!hayFiltroResultado) return [];
    return filas
      .filter(
        (f) =>
          f.equipo_seleccionado === filtroEquipo &&
          f.minuto_pronosticado === minutoNum
      )
      .sort((a, b) => new Date(a.registrado_en).getTime() - new Date(b.registrado_en).getTime());
  }, [filas, filtroEquipo, minutoNum, hayFiltroResultado]);

  // Cálculo de división de premio equitativo con redondeo para el 1º que votó
  const repartoPremios = useMemo(() => {
    const total = acertantes.length;
    if (total === 0) return [];
    const base = Math.floor(premioTotal / total);
    const residuo = premioTotal % total;

    return acertantes.map((acertante, index) => ({
      ...acertante,
      posicion: index + 1,
      monto: index < residuo ? base + 1 : base,
      esPrimeroDesempate: index === 0 && residuo > 0,
    }));
  }, [acertantes, premioTotal]);

  const filtradas = useMemo(() => {
    // Si está activo el filtro de resultado, podemos mostrar los acertantes
    let lista = filas;
    if (busqueda.trim()) {
      const texto = busqueda.trim().toLowerCase();
      lista = lista.filter(
        (f) =>
          f.nombre.toLowerCase().includes(texto) ||
          f.whatsapp.toLowerCase().includes(texto)
      );
    }
    return lista;
  }, [filas, busqueda]);

  function manejarOficializar() {
    if (!filtroEquipo || minutoNum === null) return;
    setErrorOficializar(null);
    setOficializando(true);

    const fd = new FormData();
    fd.set("trivia_id", trivia.id);
    fd.set("equipo_ganador", filtroEquipo);
    fd.set("minuto_ganador", String(minutoNum));

    startTransition(() => {
      guardarYBuscarGanadores(fd)
        .then((res) => {
          if (res.error) {
            setErrorOficializar(res.error);
          } else {
            setExitoOficializar(true);
          }
        })
        .finally(() => setOficializando(false));
    });
  }

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-6">
      {/* 1. Panel de Filtrar y Oficializar Ganadores */}
      <section className="w-full max-w-full min-w-0 rounded-card border border-secundario/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 text-superficie shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secundario/20 text-secundario text-xs font-bold">
              {esTirosEsquina ? "🚩" : "⚽"}
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-superficie">
                {esTirosEsquina ? "Definir Ganadores (Tiros de Esquina)" : "Definir Ganadores"}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {esTirosEsquina
                  ? "Ingresa el equipo y la cantidad exacta de córners para calcular los acertantes y repartir el premio de "
                  : "Ingresa el equipo que anotó y el minuto para calcular los acertantes y repartir el premio de "}
                <strong className="text-secundario font-mono">{premioTotal} Bs</strong>.
              </p>
            </div>
          </div>

          {trivia.equipo_ganador_real != null && (
            <span className="rounded-full border border-secundario/50 bg-secundario/20 px-3 py-0.5 text-xs font-bold text-secundario">
              {esTirosEsquina
                ? `✓ Resultado guardado: ${trivia.equipo_ganador_real} (${trivia.minuto_ganador_real} córners)`
                : `✓ Resultado guardado: ${trivia.equipo_ganador_real} (${trivia.minuto_ganador_real}')`}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Selector de Equipo: Botones directos sin menús desplegables que se desborden */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {esTirosEsquina ? "Equipo" : "Equipo del gol"}
              </label>
              {filtroEquipo && (
                <span className="font-mono text-[10px] font-bold text-secundario">
                  ✓ {filtroEquipo}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 h-[38px]">
              <button
                type="button"
                onClick={() => setFiltroEquipo(filtroEquipo === trivia.equipo_a ? "" : trivia.equipo_a)}
                className={`flex items-center justify-center rounded-boton border px-2 text-xs font-bold transition-all truncate ${
                  filtroEquipo === trivia.equipo_a
                    ? "border-secundario bg-secundario text-superficie shadow-md shadow-secundario/20"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-superficie"
                }`}
                title={trivia.equipo_a}
              >
                {trivia.equipo_a}
              </button>
              <button
                type="button"
                onClick={() => setFiltroEquipo(filtroEquipo === trivia.equipo_b ? "" : trivia.equipo_b)}
                className={`flex items-center justify-center rounded-boton border px-2 text-xs font-bold transition-all truncate ${
                  filtroEquipo === trivia.equipo_b
                    ? "border-secundario bg-secundario text-superficie shadow-md shadow-secundario/20"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-superficie"
                }`}
                title={trivia.equipo_b}
              >
                {trivia.equipo_b}
              </button>
            </div>
          </div>

          {/* Minuto o Córners */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {esTirosEsquina ? "Cantidad de tiros de esquina (0 - 30)" : "Minuto exacto (0 - 120)"}
            </label>
            <input
              type="number"
              min={0}
              max={maxValor}
              placeholder={esTirosEsquina ? "Ej: 6" : "Ej: 45"}
              value={filtroMinuto}
              onChange={(e) => setFiltroMinuto(e.target.value)}
              className="w-full rounded-boton border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs font-bold text-superficie outline-none focus:border-secundario"
            />
          </div>

          {/* Botón para Oficializar */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              disabled={!hayFiltroResultado || oficializando}
              onClick={manejarOficializar}
              title={
                !hayFiltroResultado
                  ? "Selecciona el equipo y la cantidad para habilitar el guardado"
                  : "Calcular y registrar ganadores oficiales"
              }
              className="flex w-full items-center justify-center gap-2 rounded-boton bg-secundario px-4 py-2.5 text-xs font-black uppercase tracking-wider text-superficie hover:bg-esmeralda-700 shadow-sm shadow-secundario/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {oficializando ? "Guardando..." : "🏆 Guardar ganadores"}
            </button>
            {!hayFiltroResultado && (
              <span className="mt-1 block text-[10px] text-zinc-500 text-center sm:text-left">
                * Selecciona equipo y cantidad para habilitar
              </span>
            )}
          </div>
        </div>

        {errorOficializar && (
          <p className="mt-3 rounded-boton border border-error/30 bg-error/20 p-2 text-center text-xs font-semibold text-error">
            {errorOficializar}
          </p>
        )}

        {exitoOficializar && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-boton border border-secundario/40 bg-secundario/15 p-3 text-xs font-semibold text-secundario">
            <span>✓ ¡Ganadores guardados con éxito en la base de datos!</span>
            <Link
              href={`/admin/ganadores?trivia=${trivia.id}`}
              className="inline-flex items-center gap-1.5 rounded-boton bg-secundario px-3 py-1 font-bold text-superficie hover:bg-esmeralda-700 transition-colors"
            >
              <span>Ir a Pestaña Ganadores y Notificar</span>
              <IconoFlechaDerecha className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Resumen del cálculo en vivo */}
        {hayFiltroResultado && (
          <div className="mt-4 rounded-boton border border-zinc-800 bg-zinc-900/80 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-300">
                {esTirosEsquina ? (
                  <>
                    Jugadas con <strong className="text-superficie">{filtroEquipo}</strong> con{" "}
                    <strong className="text-secundario font-mono">{minutoNum}</strong> córners:
                  </>
                ) : (
                  <>
                    Jugadas con <strong className="text-superficie">{filtroEquipo}</strong> en el minuto{" "}
                    <strong className="text-secundario font-mono">{minutoNum}&apos;</strong>:
                  </>
                )}
              </span>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 font-mono text-xs font-bold text-secundario">
                {acertantes.length} {acertantes.length === 1 ? "acertante" : "acertantes"}
              </span>
            </div>

            {repartoPremios.length === 0 ? (
              <p className="pt-2 text-xs text-zinc-400">
                {esTirosEsquina
                  ? `Ningún hincha jugó por ${minutoNum} tiros de esquina de ${filtroEquipo}.`
                  : `Ningún hincha jugó por gol de ${filtroEquipo} en el minuto ${minutoNum}'.`}
              </p>
            ) : (
              <div className="mt-2.5 flex flex-col gap-1.5">
                <p className="text-[11px] font-medium text-zinc-400">
                  {repartoPremios.length === 1
                    ? `¡1 ganador único! Se lleva el 100% del premio (${premioTotal} Bs).`
                    : `Premio de ${premioTotal} Bs dividido entre ${repartoPremios.length} personas:`}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {repartoPremios.map((g) => (
                    <div
                      key={g.whatsapp + g.registrado_en}
                      className="flex items-center justify-between rounded-boton border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secundario/20 text-[10px] font-bold text-secundario">
                          #{g.posicion}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-superficie truncate">{g.nombre}</p>
                          <p className="font-mono text-[10px] text-zinc-500">{g.whatsapp}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="font-mono font-black text-secundario text-xs">
                          {g.monto} Bs
                        </span>
                        {g.esPrimeroDesempate && (
                          <span className="block text-[9px] text-zinc-400" title="Recibe +1 Bs por haber votado primero">
                            (1º en votar)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Tabla Completa de Todas las Participaciones */}
      <section className="w-full max-w-full min-w-0 rounded-card border border-borde bg-superficie overflow-hidden shadow-xs">
        <div className="flex flex-col gap-4 border-b border-borde bg-primario-claro/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-texto">
              Todas las Jugadas: {trivia.equipo_a} vs {trivia.equipo_b}
            </h2>
            <p className="font-mono text-xs text-texto-suave mt-0.5">
              {filas.length} jugada{filas.length === 1 ? "" : "s"} registrada{filas.length === 1 ? "" : "s"} · Premio:{" "}
              <strong className="text-secundario">{premioTotal} Bs</strong>
            </p>
          </div>
          <a
            href={`/admin/participaciones/exportar?trivia_id=${trivia.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-boton bg-primario px-4 py-2 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro transition-colors"
          >
            <IconoDescargar className="h-3.5 w-3.5" />
            Exportar CSV
          </a>
        </div>

        <div className="p-4 border-b border-borde">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-texto-suave">
              <IconoBuscar className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o número de WhatsApp..."
              className="w-full rounded-boton border border-borde bg-superficie py-2 pl-10 pr-4 text-xs font-medium text-texto placeholder:text-texto-suave outline-none focus:border-primario focus:ring-1 focus:ring-primario"
            />
          </div>
        </div>

        {/* 1. Vista Móvil: Tarjetas individuales sin cortes ni desbordes */}
        <div className="divide-y divide-borde md:hidden">
          {filtradas.map((fila, indice) => {
            const acerto =
              hayFiltroResultado &&
              fila.equipo_seleccionado === filtroEquipo &&
              fila.minuto_pronosticado === minutoNum;

            return (
              <div
                key={fila.whatsapp + fila.registrado_en}
                className={`p-4 transition-colors ${
                  acerto ? "bg-secundario/10 border-l-4 border-l-secundario" : "hover:bg-primario-claro/20"
                }`}
              >
                {/* Cabecera de la jugada: Nombre, WhatsApp y Equipo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-texto-suave">
                        #{indice + 1}
                      </span>
                      <span className="font-bold text-sm text-texto truncate">
                        {fila.nombre}
                      </span>
                      {acerto && (
                        <span className="rounded-full bg-secundario/20 px-2 py-0.5 text-[10px] font-bold text-secundario">
                          🏆 ¡Acertó!
                        </span>
                      )}
                    </div>
                    <a
                      href={`https://wa.me/${limpiarTelefonoWhatsApp(fila.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-semibold text-secundario hover:underline"
                    >
                      💬 {fila.whatsapp}
                    </a>
                  </div>

                  <span className="shrink-0 rounded-boton border border-borde bg-primario-claro px-2.5 py-1 text-xs font-black text-texto">
                    {fila.equipo_seleccionado}
                  </span>
                </div>

                {/* Pronóstico y Fecha de Registro */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-boton bg-superficie border border-borde/70 p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-texto-suave font-bold">
                      {esTirosEsquina ? "Tiros de esquina" : "Minuto del gol"}
                    </span>
                    <span className="font-mono text-sm font-black text-texto">
                      {fila.minuto_pronosticado}
                      <span className="text-xs font-semibold text-texto-suave ml-1">
                        {esTirosEsquina ? "córners" : "minutos"}
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-texto-suave font-bold">
                      Registro
                    </span>
                    <span className="font-mono text-[11px] text-texto-suave">
                      {formatearFechaHoraBolivia(fila.registrado_en)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Vista Escritorio / Tablet: Tabla estructurada */}
        <div className="hidden md:block tabla-scroll w-full">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-borde bg-primario-claro/20 font-mono uppercase tracking-wider text-texto-suave">
                <th className="px-4 py-2.5 font-bold whitespace-nowrap">#</th>
                <th className="px-4 py-2.5 font-bold whitespace-nowrap min-w-[140px]">Participante</th>
                <th className="px-4 py-2.5 font-bold whitespace-nowrap">WhatsApp</th>
                <th className="px-4 py-2.5 font-bold whitespace-nowrap">Equipo Elegido</th>
                <th className="px-4 py-2.5 font-bold whitespace-nowrap">
                  {esTirosEsquina ? "Tiros de Esquina" : "Minuto"}
                </th>
                <th className="px-4 py-2.5 font-bold whitespace-nowrap">Fecha / Hora de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {filtradas.map((fila, indice) => {
                const acerto =
                  hayFiltroResultado &&
                  fila.equipo_seleccionado === filtroEquipo &&
                  fila.minuto_pronosticado === minutoNum;

                return (
                  <tr
                    key={fila.whatsapp + fila.registrado_en}
                    className={`transition-colors ${
                      acerto ? "bg-secundario/10 font-bold" : "hover:bg-primario-claro/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-texto-suave whitespace-nowrap">
                      {acerto ? "🏆 " : ""}
                      {indice + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-texto whitespace-nowrap min-w-[140px]">
                      {fila.nombre}
                      {acerto && (
                        <span className="ml-2 rounded-full bg-secundario/20 px-2 py-0.5 text-[10px] font-bold text-secundario">
                          ¡Acertó!
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-texto-suave whitespace-nowrap">
                      <a
                        href={`https://wa.me/${limpiarTelefonoWhatsApp(fila.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-secundario"
                      >
                        {fila.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block rounded-boton border border-borde bg-primario-claro px-2.5 py-0.5 text-xs font-bold text-texto">
                        {fila.equipo_seleccionado}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-texto whitespace-nowrap">
                      {fila.minuto_pronosticado}
                      {esTirosEsquina ? " córners" : "'"}
                    </td>
                    <td className="px-4 py-3 font-mono text-texto-suave text-[11px] whitespace-nowrap">
                      {formatearFechaHoraBolivia(fila.registrado_en)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtradas.length === 0 && (
          <p className="py-8 text-center text-xs text-texto-suave">
            {filas.length === 0
              ? "Todavía no hay jugadas registradas en esta dinámica."
              : "Sin resultados para esa búsqueda."}
          </p>
        )}
      </section>
    </div>
  );
}