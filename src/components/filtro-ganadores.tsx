"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconoFlechaDerecha } from "@/components/iconos";
import { anularResultadoGanadores, type FilaGanador } from "@/acciones/ganadores";
import { formatearFechaHoraBolivia } from "@/lib/fechas";

export type TriviaGanador = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  fecha_inicio: string;
  premio_monto?: number;
  equipo_ganador_real: string;
  minuto_ganador_real: number;
  tipo_plantilla?: string;
};

function limpiarTelefonoWhatsApp(telefono: string): string {
  return telefono.replace(/[^\d]/g, "");
}

export default function FiltroGanadores({
  trivias,
  triviaActualId,
  ganadoresIniciales,
}: {
  trivias: TriviaGanador[];
  triviaActualId: string;
  ganadoresIniciales: FilaGanador[];
}) {
  const router = useRouter();
  const [triviaId, setTriviaId] = useState(triviaActualId);
  const [ganadores] = useState<FilaGanador[]>(ganadoresIniciales);
  const [anulando, setAnulando] = useState(false);

  const trivia = trivias.find((t) => t.id === triviaId) ?? trivias[0];
  const premioTotal = trivia?.premio_monto ?? 100;

  // Reparto equitativo con redondeo para el 1º que votó
  const listaReparto = useMemo(() => {
    const total = ganadores.length;
    if (total === 0) return [];
    const base = Math.floor(premioTotal / total);
    const residuo = premioTotal % total;

    return ganadores.map((g, index) => {
      const monto = index < residuo ? base + 1 : base;
      const esPrimero = index === 0 && residuo > 0;

      const esTirosEsquina =
        trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo";
      const detalleAcierto = esTirosEsquina
        ? `${trivia.minuto_ganador_real} tiros de esquina de ${trivia.equipo_ganador_real}`
        : `gol de ${trivia.equipo_ganador_real} en el minuto ${trivia.minuto_ganador_real}'`;

      const mensaje = `¡Hola ${g.nombre}! Te felicitamos de parte de Bolicash 🏆⚽. ¡Le acertaste al resultado con tu jugada en el partido ${trivia.equipo_a} vs ${trivia.equipo_b} (${detalleAcierto})!\n\nAcertaron un total de ${total} ${total === 1 ? "persona (¡ganador único!)" : "personas"}. Tu premio correspondiente de ${premioTotal} Bs es de ${monto} Bs.\n\nPor favor envíanos tu comprobante de haber recargado hoy en Bolicash para transferirte tu premio de inmediato.`;

      return {
        ...g,
        posicion: index + 1,
        monto,
        esPrimero,
        mensajeWhatsApp: mensaje,
      };
    });
  }, [ganadores, premioTotal, trivia]);

  const [modalConfirmarAnulacion, setModalConfirmarAnulacion] = useState(false);

  function ejecutarAnulacion() {
    if (!trivia) return;
    setAnulando(true);
    startTransition(() => {
      anularResultadoGanadores(trivia.id).then(() => {
        setModalConfirmarAnulacion(false);
        router.push(`/admin/participaciones?trivia=${trivia.id}`);
      });
    });
  }

  if (trivias.length === 0) {
    return (
      <section className="rounded-card border border-borde bg-superficie p-8 text-center max-w-lg mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secundario/15 text-secundario text-xl mb-3">
          🏆
        </div>
        <h2 className="text-base font-bold text-texto">Aún no hay dinámicas finalizadas</h2>
        <p className="mt-1.5 text-xs text-texto-suave leading-relaxed">
          Para definir a los ganadores de un partido, ve a la pestaña de{" "}
          <strong className="text-texto">Participaciones</strong>, ingresa el equipo y minuto del gol, y
          haz clic en &ldquo;Guardar ganadores&rdquo;.
        </p>
        <Link
          href="/admin/participaciones"
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-boton bg-secundario px-4 py-2 text-xs font-bold text-superficie hover:bg-esmeralda-700 transition-colors"
        >
          <span>Ir a Participaciones</span>
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Selector de Dinámicas Finalizadas */}
      <section className="rounded-card border border-borde bg-superficie p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-texto-suave mb-1">
              Partido Finalizado
            </label>
            <select
              value={triviaId}
              onChange={(e) => {
                setTriviaId(e.target.value);
                router.push(`/admin/ganadores?trivia=${e.target.value}`);
              }}
              className="w-full sm:w-80 rounded-boton border border-borde bg-superficie px-3 py-2 text-xs font-bold text-texto outline-none focus:border-secundario"
            >
              {trivias.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.equipo_a} vs {t.equipo_b} (Gol: {t.equipo_ganador_real} {t.minuto_ganador_real}&apos;)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={anulando}
            onClick={() => setModalConfirmarAnulacion(true)}
            className="rounded-boton border border-borde px-3 py-2 text-xs font-semibold text-texto-suave hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors"
          >
            {anulando ? "Reabriendo..." : "Modificar / Reabrir resultado"}
          </button>
        </div>

        {/* Modal de Confirmación en el Sistema (sin alertas del navegador) */}
        {modalConfirmarAnulacion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-card border border-borde bg-superficie p-6 shadow-modal">
              <div className="flex items-center gap-3 text-advertencia mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-advertencia/15 text-base">
                  ⚠️
                </span>
                <h3 className="text-sm font-bold text-texto uppercase tracking-wide">
                  ¿Reabrir y modificar resultado?
                </h3>
              </div>
              <p className="text-xs text-texto-suave leading-relaxed">
                La dinámica de <strong className="text-texto">{trivia.equipo_a} vs {trivia.equipo_b}</strong> volverá a estar activa y podrás volver a calcular los ganadores en la pestaña de Participaciones.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-borde pt-3">
                <button
                  type="button"
                  onClick={() => setModalConfirmarAnulacion(false)}
                  className="rounded-boton border border-borde px-3.5 py-2 text-xs font-bold text-texto hover:bg-primario-claro transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarAnulacion}
                  disabled={anulando}
                  className="rounded-boton bg-error px-4 py-2 text-xs font-bold text-superficie hover:bg-rojo-600 transition-colors disabled:opacity-50"
                >
                  {anulando ? "Reabriendo..." : "Sí, reabrir resultado"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Tarjeta Resumen del Partido Oficializado */}
      <section className="rounded-card border border-secundario/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 text-superficie shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-secundario">
              <span className="h-1.5 w-1.5 rounded-full bg-secundario" />
              Resultado Final del Partido
            </span>
            <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-superficie">
              {trivia.equipo_a} <span className="text-zinc-500 font-normal">vs</span> {trivia.equipo_b}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-boton border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Resultado
              </span>
              <span className="font-mono text-xs font-black text-secundario">
                {trivia.equipo_ganador_real} ({trivia.minuto_ganador_real}
                {trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo" ? " córners" : "'"})
              </span>
            </div>

            <div className="rounded-boton border border-secundario/40 bg-secundario/20 px-3.5 py-1.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secundario/80">
                Premio Total
              </span>
              <span className="font-mono text-sm font-black text-secundario">
                {premioTotal} Bs
              </span>
            </div>

            <div className="rounded-boton border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Acertantes
              </span>
              <span className="font-mono text-xs font-black text-superficie">
                {ganadores.length}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
          {ganadores.length === 0
            ? trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo"
              ? `Ningún hincha acertó los ${trivia.minuto_ganador_real} tiros de esquina de ${trivia.equipo_ganador_real}. El premio no fue reclamado.`
              : `Ningún hincha acertó el gol de ${trivia.equipo_ganador_real} en el minuto ${trivia.minuto_ganador_real}'. El premio no fue reclamado.`
            : ganadores.length === 1
              ? `¡1 solo hincha acertó el resultado exacto! Le corresponde el 100% del premio (${premioTotal} Bs).`
              : `El premio de ${premioTotal} Bs se reparte entre los ${ganadores.length} acertantes en orden de registro:`}
        </p>
      </section>

      {/* 3. Lista de Ganadores con Botón Directo a WhatsApp */}
      {ganadores.length > 0 && (
        <section className="w-full max-w-full min-w-0 rounded-card border border-borde bg-superficie overflow-hidden shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde bg-primario-claro/30 p-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-texto">
                Lista de Ganadores y Notificación WhatsApp
              </h3>
            </div>
          </div>

          <div className="tabla-scroll w-full">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="border-b border-borde font-mono uppercase tracking-wider text-texto-suave">
                  <th className="px-4 py-2.5 font-bold whitespace-nowrap">Lugar</th>
                  <th className="px-4 py-2.5 font-bold whitespace-nowrap min-w-[140px]">Participante</th>
                  <th className="px-4 py-2.5 font-bold whitespace-nowrap">WhatsApp</th>
                  <th className="px-4 py-2.5 font-bold whitespace-nowrap">Hora de Voto</th>
                  <th className="px-4 py-2.5 font-bold whitespace-nowrap">Premio Asignado</th>
                  <th className="px-4 py-2.5 font-bold text-right whitespace-nowrap">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {listaReparto.map((g) => (
                  <tr key={g.whatsapp + g.registrado_en} className="hover:bg-primario-claro/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secundario/20 font-mono text-xs font-black text-secundario">
                        #{g.posicion}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-texto">
                      {g.nombre}
                      {g.esPrimero && (
                        <span className="ml-2 rounded-full border border-secundario/40 bg-secundario/15 px-2 py-0.5 text-[9px] font-bold text-secundario">
                          1º en votar (+1 Bs desempate)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-texto-suave">
                      {g.whatsapp}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-texto-suave text-[11px]">
                      {formatearFechaHoraBolivia(g.registrado_en)}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-black text-secundario text-sm">
                      {g.monto} Bs
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={`https://wa.me/${limpiarTelefonoWhatsApp(g.whatsapp)}?text=${encodeURIComponent(
                          g.mensajeWhatsApp
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-boton bg-secundario px-3.5 py-1.5 text-xs font-bold text-superficie hover:bg-esmeralda-700 shadow-xs transition-colors"
                      >
                        <span>💬 WhatsApp</span>
                        <IconoFlechaDerecha className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}