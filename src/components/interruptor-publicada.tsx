import { publicarTrivia } from "@/acciones/trivias";

export default function InterruptorPublicada({
  id,
  publicada,
}: {
  id: string;
  publicada: boolean;
}) {
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
            ? "flex h-6 w-11 items-center rounded-boton bg-exito px-0.5"
            : "flex h-6 w-11 items-center rounded-boton border border-borde bg-primario-claro px-0.5"
        }
      >
        <span
          className={
            publicada
              ? "ml-auto h-5 w-5 rounded-boton bg-superficie"
              : "h-5 w-5 rounded-boton bg-superficie border border-borde"
          }
        />
      </button>
      <span className="text-xs font-semibold text-texto-suave">
        {publicada ? "Visible" : "Oculta"}
      </span>
    </form>
  );
}