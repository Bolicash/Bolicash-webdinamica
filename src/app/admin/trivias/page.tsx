import Link from "next/link";
import { cambiarEstadoTrivia, eliminarTrivia } from "@/acciones/trivias";
import FormularioCrearTrivia from "@/components/formulario-crear-trivia";
import { IconoChevronDerecha } from "@/components/iconos";
import InterruptorPublicada from "@/components/interruptor-publicada";
import ModalEditarDinamica from "@/components/modal-editar-dinamica";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { estaVencida, formatearFechaCortaBolivia, formatearFechaHoraBolivia } from "@/lib/fechas";

type FilaTrivia = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  tipo_plantilla: string;
  fecha_inicio: string;
  publicada: boolean;
  estado: string;
  equipo_ganador_real?: string | null;
  minuto_ganador_real?: number | null;
  total_participaciones?: number;
  premio_monto?: number;
};

function nombrePlantilla(id: string): string {
  if (id === "tiros_esquina" || id === "minuto_gol_equipo") return "🚩 Tiros de esquina";
  return "⚽ Primer gol y minuto";
}

function EstadoBadge({ estado, vencida }: { estado: string; vencida: boolean }) {
  if (vencida) {
    return (
      <span
        title="La hora de cierre ya pasó. La dinámica no acepta más jugadas y está oculta en la web."
        className="inline-block rounded-boton border border-advertencia/30 bg-advertencia/15 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-advertencia"
      >
        Cerrada (Vencida)
      </span>
    );
  }

  const estilos = {
    activa: "bg-exito/10 text-exito border-exito/20",
    finalizada: "bg-info/10 text-info border-info/20",
    borrador: "bg-primario-claro text-texto-suave border-borde",
  };
  const estilo = estilos[estado as keyof typeof estilos] ?? estilos.borrador;

  return (
    <span
      className={`inline-block rounded-boton border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${estilo}`}
    >
      {estado}
    </span>
  );
}

export default async function TriviasPage() {
  const db = await crearClienteAdmin();
  if (!db) return null;

  // Auto-sincronizar: Si alguna dinámica ya pasó su fecha límite y sigue publicada en web,
  // se despublica automáticamente (publicada = false) para que quede oculta, sin alterar su fecha límite.
  await db
    .from("trivias")
    .update({ publicada: false })
    .eq("publicada", true)
    .lte("fecha_inicio", new Date().toISOString());

  const { data, error: errorLista } = await db.rpc("listar_trivias_admin");
  const trivias = (data ?? []) as FilaTrivia[];

  return (
    <>
      {/* Cabecera de Página */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-texto">
              Dinámicas
            </h1>
            <span className="rounded-boton border border-borde bg-primario-claro px-2 py-0.5 font-mono text-xs font-bold text-texto-suave">
              {trivias.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-texto-suave">
            Control de partidos, dinámicas, cierres automáticos y visibilidad pública.
          </p>
        </div>

        <FormularioCrearTrivia />
      </div>

      {errorLista && (
        <p
          role="alert"
          className="rounded-card border border-error/20 bg-error/10 p-3 text-center text-xs font-semibold text-error"
        >
          No se pudo sincronizar la lista de dinámicas con la base de datos.
        </p>
      )}

      {/* 1. Vista Móvil: Tarjetas individuales (elimina el texto apretado y columnas comprimidas) */}
      <div className="flex flex-col gap-3 md:hidden">
        {trivias.map((trivia) => (
          <div
            key={trivia.id}
            className="rounded-card border border-borde bg-superficie p-4 shadow-sm flex flex-col gap-3"
          >
            {/* Cabecera de la tarjeta: Equipos y Estado */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-texto">
                  {trivia.equipo_a} <span className="font-normal text-texto-suave text-xs">vs</span> {trivia.equipo_b}
                </h2>
                <p className="font-mono text-[11px] text-texto-suave mt-0.5">
                  {nombrePlantilla(trivia.tipo_plantilla)}
                </p>
                {trivia.equipo_ganador_real != null && (
                  <div className="mt-1">
                    <span className="inline-block rounded-boton border border-exito/20 bg-exito/10 px-2 py-0.5 font-mono text-[10px] font-bold text-exito">
                      {trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo"
                        ? `CÓRNERS: ${trivia.minuto_ganador_real} en el partido`
                        : `GOL: ${trivia.equipo_ganador_real} (${trivia.minuto_ganador_real}')`}
                    </span>
                  </div>
                )}
              </div>
              <EstadoBadge
                estado={trivia.estado}
                vencida={estaVencida(trivia.fecha_inicio)}
              />
            </div>

            {/* Metadatos: Cierre y Premio */}
            <div className="grid grid-cols-2 gap-2 rounded-boton bg-primario-claro/40 p-2.5 text-xs font-mono">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-texto-suave font-bold">
                  Cierre
                </span>
                <span className="text-texto font-medium">
                  {formatearFechaCortaBolivia(trivia.fecha_inicio)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-texto-suave font-bold">
                  Premio
                </span>
                <span className="font-bold text-secundario">
                  🏆 {trivia.premio_monto ?? 100} Bs
                </span>
              </div>
            </div>

            {/* En Web y Participantes */}
            <div className="flex items-center justify-between border-t border-borde pt-2.5 text-xs">
              <div className="flex items-center gap-2">
                <InterruptorPublicada
                  id={trivia.id}
                  publicada={trivia.publicada}
                  deshabilitado={estaVencida(trivia.fecha_inicio)}
                />
              </div>

              <Link
                href={`/admin/participaciones?trivia=${trivia.id}`}
                className="inline-flex items-center gap-1 font-mono text-xs font-bold text-texto hover:underline"
              >
                <span>👥 {trivia.total_participaciones ?? 0} {trivia.total_participaciones === 1 ? "jugada" : "jugadas"}</span>
                <IconoChevronDerecha className="h-3.5 w-3.5 text-texto-suave" />
              </Link>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2 border-t border-borde pt-2.5">
              <ModalEditarDinamica dinamica={trivia} />

              {trivia.estado !== "activa" ? (
                <form action={cambiarEstadoTrivia} className="inline">
                  <input type="hidden" name="id" value={trivia.id} />
                  <input type="hidden" name="estado" value="activa" />
                  <button
                    type="submit"
                    disabled={estaVencida(trivia.fecha_inicio)}
                    title={
                      estaVencida(trivia.fecha_inicio)
                        ? "Tiempo vencido. Haz clic en 'Editar' para reprogramar una nueva fecha futura y reactivarla."
                        : "Activar dinámica"
                    }
                    className="rounded-boton border border-borde px-3 py-1 text-xs font-bold text-texto hover:bg-primario-claro disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Activar
                  </button>
                </form>
              ) : (
                <form action={cambiarEstadoTrivia} className="inline">
                  <input type="hidden" name="id" value={trivia.id} />
                  <input type="hidden" name="estado" value="finalizada" />
                  <button
                    type="submit"
                    className="rounded-boton border border-borde px-3 py-1 text-xs font-bold text-texto-suave hover:text-texto hover:bg-primario-claro"
                  >
                    Finalizar
                  </button>
                </form>
              )}

              <form action={eliminarTrivia} className="inline">
                <input type="hidden" name="id" value={trivia.id} />
                <button
                  type="submit"
                  className="rounded-boton px-3 py-1 text-xs font-bold text-error hover:bg-error/10"
                >
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}

        {trivias.length === 0 && (
          <div className="rounded-card border border-borde bg-superficie p-8 text-center text-xs text-texto-suave">
            No hay dinámicas registradas todavía. Crea la primera con el botón de arriba.
          </div>
        )}
      </div>

      {/* 2. Vista de Escritorio / Tablet: Tabla con ancho protegido y scrollbar fino elegante si se reduce la ventana */}
      <section className="hidden md:block w-full max-w-full min-w-0 rounded-card border border-borde bg-superficie overflow-hidden">
        <div className="tabla-scroll w-full">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead>
              <tr className="border-b border-borde bg-primario-claro/50 font-mono uppercase tracking-wider text-texto-suave">
                <th className="px-5 py-3.5 font-bold min-w-[200px] whitespace-nowrap">Partido</th>
                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Cierre</th>
                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Premio</th>
                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Estado</th>
                <th className="px-5 py-3.5 font-bold whitespace-nowrap">En Web</th>
                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Participaciones</th>
                <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {trivias.map((trivia) => (
                <tr key={trivia.id} className="hover:bg-primario-claro/30 transition-colors">
                  <td className="px-5 py-4 min-w-[200px]">
                    <div className="font-bold text-sm text-texto whitespace-nowrap">
                      {trivia.equipo_a} <span className="font-normal text-texto-suave">vs</span> {trivia.equipo_b}
                    </div>
                    <span className="font-mono text-[11px] text-texto-suave whitespace-nowrap block">
                      {nombrePlantilla(trivia.tipo_plantilla)}
                    </span>
                    {trivia.equipo_ganador_real != null && (
                      <div className="mt-1 whitespace-nowrap">
                        <span className="rounded-boton border border-exito/20 bg-exito/10 px-2 py-0.5 font-mono text-[10px] font-bold text-exito">
                          {trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo"
                            ? `CÓRNERS: ${trivia.minuto_ganador_real} en el partido`
                            : `GOL: ${trivia.equipo_ganador_real} (${trivia.minuto_ganador_real}')`}
                        </span>
                      </div>
                    )}
                  </td>

                <td className="px-5 py-4 font-mono text-texto-suave whitespace-nowrap">
                  {formatearFechaHoraBolivia(trivia.fecha_inicio)}
                </td>

                <td className="px-5 py-4 font-mono font-bold text-secundario whitespace-nowrap">
                  🏆 {trivia.premio_monto ?? 100} Bs
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <EstadoBadge
                    estado={trivia.estado}
                    vencida={estaVencida(trivia.fecha_inicio)}
                  />
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <InterruptorPublicada
                    id={trivia.id}
                    publicada={trivia.publicada}
                    deshabilitado={estaVencida(trivia.fecha_inicio)}
                  />
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/participaciones?trivia=${trivia.id}`}
                    className="inline-flex items-center gap-1 font-mono font-semibold text-texto hover:underline"
                  >
                    {trivia.total_participaciones ?? 0} {trivia.total_participaciones === 1 ? "jugada" : "jugadas"}
                  </Link>
                </td>

                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <ModalEditarDinamica dinamica={trivia} />

                    {trivia.estado !== "activa" ? (
                      <form action={cambiarEstadoTrivia} className="inline">
                        <input type="hidden" name="id" value={trivia.id} />
                        <input type="hidden" name="estado" value="activa" />
                        <button
                          type="submit"
                          disabled={estaVencida(trivia.fecha_inicio)}
                          title={
                            estaVencida(trivia.fecha_inicio)
                              ? "Tiempo vencido. Haz clic en 'Editar' para reprogramar una nueva fecha futura y reactivarla."
                              : "Activar dinámica"
                          }
                          className="rounded-boton border border-borde px-2.5 py-1 text-[11px] font-bold text-texto hover:bg-primario-claro disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Activar
                        </button>
                      </form>
                    ) : (
                      <form action={cambiarEstadoTrivia} className="inline">
                        <input type="hidden" name="id" value={trivia.id} />
                        <input type="hidden" name="estado" value="finalizada" />
                        <button
                          type="submit"
                          className="rounded-boton border border-borde px-2.5 py-1 text-[11px] font-bold text-texto-suave hover:text-texto hover:bg-primario-claro"
                        >
                          Finalizar
                        </button>
                      </form>
                    )}

                    <form action={eliminarTrivia} className="inline">
                      <input type="hidden" name="id" value={trivia.id} />
                      <button
                        type="submit"
                        className="rounded-boton px-2 py-1 text-[11px] font-bold text-error hover:bg-error/10"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {trivias.length === 0 && (
          <div className="p-8 text-center text-xs text-texto-suave">
            No hay dinámicas registradas todavía. Crea la primera con el botón de arriba.
          </div>
        )}
      </section>
    </>
  );
}