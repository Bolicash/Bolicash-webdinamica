import { publicarTrivia } from "@/acciones/trivias";

export default function InterruptorPublicada({
  id,
  publicada,
  deshabilitado = false,
}: {
  id: string;
  publicada: boolean;
  deshabilitado?: boolean;
}) {
  if (deshabilitado) {
    return (
      <div
        className="inline-flex items-center gap-2 opacity-60 cursor-not-allowed"
        title="Dinámica con hora de cierre vencida. Oculta automáticamente de la web. Para volver a publicarla, edita la fecha y hora de cierre."
      >
        <div
          role="switch"
          aria-checked={false}
          className="flex h-6 w-11 items-center rounded-boton border border-borde bg-primario-claro px-0.5 pointer-events-none"
        >
          <span className="h-5 w-5 rounded-boton bg-superficie border border-borde" />
        </div>
        <span className="text-xs font-semibold text-advertencia">
          Oculta (Vencida)
        </span>
      </div>
    );
  }

  return (
    <form action={publicarTrivia} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="publicada" value={publicada ? "false" : "true"} />
      <button
        type="submit"
        role="switch"
        aria-checked={publicada}
        title={publicada ? "Despublicar de la web" : "Publicar en la web"}
        className={
          publicada
            ? "flex h-6 w-11 items-center rounded-boton bg-exito px-0.5 hover:opacity-90 transition-opacity"
            : "flex h-6 w-11 items-center rounded-boton border border-borde bg-primario-claro px-0.5 hover:bg-primario-claro/80 transition-colors"
        }
      >
        <span
          className={
            publicada
              ? "ml-auto h-5 w-5 rounded-boton bg-superficie shadow-sm"
              : "h-5 w-5 rounded-boton bg-superficie border border-borde shadow-sm"
          }
        />
      </button>
      <span className="text-xs font-semibold text-texto-suave">
        {publicada ? "Visible" : "Oculta"}
      </span>
    </form>
  );
}