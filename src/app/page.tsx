export const dynamic = "force-dynamic";

import Image from "next/image";
import ContenedorDinamicas from "@/components/contenedor-dinamicas";
import { obtenerTriviasActivas } from "@/lib/trivias";

export default async function PaginaInicio() {
  const dinamicas = await obtenerTriviasActivas();

  return (
    <main
      className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 px-4 py-8 sm:py-12"
      style={{
        backgroundColor: "var(--fondo)",
        backgroundImage:
          "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(5, 150, 105, 0.12) 0%, transparent 70%), radial-gradient(circle, var(--zinc-300) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 24px 24px",
      }}
    >
      <header className="flex flex-col items-center text-center -mb-2">
        <Image
          src="/logo-bolicash.avif"
          alt="Bolicash Logo"
          width={112}
          height={112}
          priority
          className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-contain drop-shadow-xl"
        />
        <h1 className="sr-only">Bolicash - Dinámicas Deportivas</h1>
      </header>

      <div className="w-full max-w-[550px] flex flex-col items-center mx-auto">
        <ContenedorDinamicas dinamicas={dinamicas} />
      </div>

      <footer className="text-xs font-medium text-texto-suave">
        Límite: 1 jugada por número de WhatsApp
      </footer>
    </main>
  );
}