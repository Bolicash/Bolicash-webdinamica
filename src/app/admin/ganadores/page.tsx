import FiltroGanadores, { type TriviaGanador } from "@/components/filtro-ganadores";
import type { FilaGanador } from "@/acciones/ganadores";
import { crearClienteAdmin } from "@/lib/supabase/admin";

type TriviaRow = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  fecha_inicio: string;
  premio_monto?: number;
  equipo_ganador_real?: string | null;
  minuto_ganador_real?: number | null;
  tipo_plantilla?: string;
  estado?: string;
};

export default async function GanadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ trivia?: string }>;
}) {
  const db = await crearClienteAdmin();
  if (!db) return null;

  const parametros = await searchParams;
  const { data: triviasRaw } = await db.rpc("listar_trivias_admin");
  const todasTrivias = (triviasRaw ?? []) as TriviaRow[];

  // Solo mostrar dinámicas que tengan resultado definido
  const finalizadas = todasTrivias
    .filter((t) => t.equipo_ganador_real != null && t.minuto_ganador_real != null)
    .map((t) => ({
      id: t.id,
      equipo_a: t.equipo_a,
      equipo_b: t.equipo_b,
      fecha_inicio: t.fecha_inicio,
      premio_monto: t.premio_monto ?? 100,
      equipo_ganador_real: t.equipo_ganador_real!,
      minuto_ganador_real: t.minuto_ganador_real!,
      tipo_plantilla: t.tipo_plantilla,
    })) as TriviaGanador[];

  const triviaActualId = parametros.trivia ?? finalizadas[0]?.id ?? "";
  const triviaActual = finalizadas.find((t) => t.id === triviaActualId) ?? finalizadas[0] ?? null;

  let ganadores: FilaGanador[] = [];
  if (triviaActual) {
    const { data: ganadoresRaw } = await db.rpc("buscar_ganadores_admin", {
      p_trivia_id: triviaActual.id,
      p_equipo: triviaActual.equipo_ganador_real,
      p_minuto: triviaActual.minuto_ganador_real,
    });
    ganadores = (ganadoresRaw ?? []) as FilaGanador[];
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde pb-5">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-texto">
            Ganadores de Dinámicas
          </h1>
          <p className="mt-0.5 text-xs text-texto-suave">
            Historial de dinámicas resueltas, reparto equitativo de premios y contacto directo por WhatsApp.
          </p>
        </div>
      </div>

      <FiltroGanadores
        trivias={finalizadas}
        triviaActualId={triviaActualId}
        ganadoresIniciales={ganadores}
      />
    </>
  );
}