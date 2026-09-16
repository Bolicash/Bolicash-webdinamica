import SelectorPartidoParticipaciones from "@/components/selector-partido-participaciones";
import TablaParticipaciones, {
  type FilaParticipacion,
  type TriviaMini,
} from "@/components/tabla-participaciones";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export default async function ParticipacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ trivia?: string }>;
}) {
  const db = await crearClienteAdmin();
  if (!db) return null;

  const parametros = await searchParams;
  const triviaParamId = parametros.trivia;

  let trivias: TriviaMini[] = [];
  let filas: FilaParticipacion[] = [];
  let errorCarga: string | null = null;

  if (triviaParamId) {
    const [{ data: triviasRaw }, respuesta] = await Promise.all([
      db.rpc("listar_trivias_admin"),
      db.rpc("listar_participaciones_admin", {
        p_trivia_id: triviaParamId,
        p_limite: 500,
      }),
    ]);
    trivias = (triviasRaw ?? []) as TriviaMini[];
    filas = (respuesta.data ?? []) as FilaParticipacion[];
    if (respuesta.error) {
      errorCarga =
        "No se pudo cargar la lista. Verifica la función listar_participaciones_admin en la base de datos.";
    }
  } else {
    const { data: triviasRaw } = await db.rpc("listar_trivias_admin");
    trivias = (triviasRaw ?? []) as TriviaMini[];
    const primerId = trivias[0]?.id;
    if (primerId) {
      const respuesta = await db.rpc("listar_participaciones_admin", {
        p_trivia_id: primerId,
        p_limite: 500,
      });
      filas = (respuesta.data ?? []) as FilaParticipacion[];
      if (respuesta.error) {
        errorCarga =
          "No se pudo cargar la lista. Verifica la función listar_participaciones_admin en la base de datos.";
      }
    }
  }

  const triviaId = triviaParamId ?? trivias[0]?.id ?? "";
  const trivia = trivias.find((t) => t.id === triviaId) ?? null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde pb-5">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-texto">
            Participaciones
          </h1>
          <p className="mt-0.5 text-xs text-texto-suave">
            Jugadas registradas por los hinchas para cada partido.
          </p>
        </div>
      </div>

      <SelectorPartidoParticipaciones trivias={trivias} triviaActualId={triviaId} />

      {trivia ? (
        <>
          {errorCarga && (
            <p
              role="alert"
              className="rounded-card border border-error/20 bg-error/10 p-3 text-center text-xs font-semibold text-error"
            >
              {errorCarga}
            </p>
          )}
          <TablaParticipaciones trivia={trivia} filas={filas} />
        </>
      ) : (
        <section className="rounded-card border border-borde bg-superficie p-8 text-center">
          <p className="text-xs text-texto-suave">
            Crea una dinámica para empezar a recibir jugadas.
          </p>
        </section>
      )}
    </>
  );
}