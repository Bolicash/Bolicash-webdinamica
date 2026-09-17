import Link from "next/link";
import {
  IconoContactos,
  IconoDescargar,
  IconoFlechaDerecha,
  IconoGanadores,
  IconoMas,
  IconoParticipantes,
  IconoTrivia,
} from "@/components/iconos";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { estaVencida, formatearFechaHoraBolivia } from "@/lib/fechas";
import FormularioCrearTrivia from "@/components/formulario-crear-trivia";

type FilaTrivia = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  fecha_inicio: string;
  publicada: boolean;
  estado: string;
  total_participaciones?: number;
};

export default async function PanelDashboard() {
  const db = await crearClienteAdmin();
  if (!db) return null;

  const [{ data: statsRaw }, { data: triviasRaw }] = await Promise.all([
    db.rpc("estadisticas_admin"),
    db.rpc("listar_trivias_admin"),
  ]);

  const stats = (statsRaw ?? {}) as {
    trivias?: number;
    contactos?: number;
    participaciones?: number;
  };

  const todasTrivias = ((triviasRaw ?? []) as FilaTrivia[]);
  const activasCount = todasTrivias.filter(
    (t) => t.estado === "activa" && !estaVencida(t.fecha_inicio)
  ).length;

  const recientes = todasTrivias.slice(0, 5);

  const tarjetas = [
    {
      nombre: "Activas en Juego",
      valor: activasCount,
      href: "/admin/trivias",
      subtexto: activasCount === 1 ? "1 recibiendo jugadas" : `${activasCount} recibiendo jugadas`,
      chip: "bg-exito/15 text-exito border border-exito/20",
      icono: (
        <span className="relative flex items-center justify-center">
          <IconoTrivia className="h-6 w-6" />
          {activasCount > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-exito animate-pulse" />
          )}
        </span>
      ),
    },
    {
      nombre: "Total Dinámicas",
      valor: stats.trivias ?? todasTrivias.length,
      href: "/admin/trivias",
      subtexto: "Histórico creadas",
      chip: "bg-primario-claro text-primario border border-borde",
      icono: <IconoTrivia className="h-6 w-6" />,
    },
    {
      nombre: "Participaciones",
      valor: stats.participaciones ?? 0,
      href: "/admin/participaciones",
      subtexto: "Votos registrados",
      chip: "bg-info/15 text-info border border-info/20",
      icono: <IconoParticipantes className="h-6 w-6" />,
    },
    {
      nombre: "Contactos",
      valor: stats.contactos ?? 0,
      href: "/admin/contactos",
      subtexto: "Base de hinchas",
      chip: "bg-secundario/15 text-secundario border border-secundario/25",
      icono: <IconoContactos className="h-6 w-6" />,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde pb-5">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-texto">
            Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-texto-suave">
            Resumen operativo y métricas en tiempo real de Bolicash.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <Link
            key={tarjeta.nombre}
            href={tarjeta.href}
            prefetch={true}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-card border border-borde bg-superficie p-4 sm:p-5 hover:border-borde-fuerte hover:shadow-xs transition-all"
          >
            <span
              className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-boton ${tarjeta.chip}`}
            >
              {tarjeta.icono}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-texto-suave truncate">
                {tarjeta.nombre}
              </span>
              <span className="block font-mono text-2xl sm:text-3xl font-black tabular-nums text-texto mt-0.5">
                {tarjeta.valor}
              </span>
              <span className="block font-mono text-[10px] text-texto-suave mt-0.5 truncate">
                {tarjeta.subtexto}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <FormularioCrearTrivia
          textoBoton="Crear dinámica"
          icono={<IconoMas className="h-4 w-4" />}
          classNameBoton="flex flex-1 items-center justify-center gap-2 rounded-boton bg-primario px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro transition-colors cursor-pointer"
        />
        <Link
          href="/admin/ganadores"
          prefetch={true}
          className="flex flex-1 items-center justify-center gap-2 rounded-boton border border-borde bg-superficie px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-texto hover:bg-primario-claro transition-colors"
        >
          <IconoGanadores className="h-4 w-4" />
          Buscar ganadores
        </Link>
        <a
          href="/admin/contactos/exportar"
          download
          className="flex flex-1 items-center justify-center gap-2 rounded-boton border border-borde bg-superficie px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-texto hover:bg-primario-claro transition-colors cursor-pointer"
        >
          <IconoDescargar className="h-4 w-4" />
          Exportar contactos
        </a>
      </div>

      <section className="rounded-card border border-borde bg-superficie p-5">
        <div className="flex items-center justify-between gap-4 border-b border-borde pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-texto">Últimas dinámicas</h2>
          <Link
            href="/admin/trivias"
            prefetch={true}
            className="inline-flex items-center gap-1 text-xs font-semibold text-texto-suave hover:text-texto transition-colors"
          >
            <span>Ver todas</span>
            <IconoFlechaDerecha className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-borde">
          {recientes.map((trivia) => (
            <Link
              key={trivia.id}
              href={`/admin/participaciones?trivia=${trivia.id}`}
              prefetch={true}
              className="flex items-center gap-4 py-3 hover:bg-primario-claro/40 -mx-5 px-5 transition-colors"
            >
              <span className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="block truncate text-xs font-bold text-texto">
                    {trivia.equipo_a} <span className="font-normal text-texto-suave">vs</span> {trivia.equipo_b}
                  </span>
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                      trivia.estado === "activa" && !estaVencida(trivia.fecha_inicio)
                        ? "border border-exito/30 bg-exito/10 text-exito"
                        : trivia.estado === "activa" && estaVencida(trivia.fecha_inicio)
                        ? "border border-advertencia/30 bg-advertencia/15 text-advertencia"
                        : "border border-borde bg-primario-claro text-texto-suave"
                    }`}
                  >
                    {trivia.estado === "activa" && estaVencida(trivia.fecha_inicio)
                      ? "Cerrada"
                      : trivia.estado}
                  </span>
                </div>
                <span className="block font-mono text-[11px] text-texto-suave mt-0.5">
                  {formatearFechaHoraBolivia(trivia.fecha_inicio)}
                  {" · "}
                  {trivia.publicada ? "Pública" : "Oculta"}
                </span>
              </span>
              <span className="shrink-0 rounded-boton border border-borde bg-primario-claro px-2.5 py-0.5 font-mono text-xs font-semibold text-texto">
                {trivia.total_participaciones ?? 0} {trivia.total_participaciones === 1 ? "jugada" : "jugadas"}
              </span>
            </Link>
          ))}
          {recientes.length === 0 && (
            <p className="py-6 text-center text-xs text-texto-suave">
              Aún no hay dinámicas creadas.
            </p>
          )}
        </div>
      </section>
    </>
  );
}