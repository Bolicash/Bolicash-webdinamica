export const dynamic = "force-dynamic";

import ContenedorDinamicas from "@/components/contenedor-dinamicas";
import { obtenerTriviasActivas } from "@/lib/trivias";

export default async function PaginaInicio() {
  const dinamicas = await obtenerTriviasActivas();

  return (
    <div
      className="flex min-h-dvh flex-col items-center w-full"
      style={{
        backgroundColor: "var(--fondo)",
        backgroundImage:
          "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(5, 150, 105, 0.12) 0%, transparent 70%), radial-gradient(circle, var(--zinc-300) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 24px 24px",
      }}
    >
      <ContenedorDinamicas dinamicas={dinamicas} />
    </div>
  );
}