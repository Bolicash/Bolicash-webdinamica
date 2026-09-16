import Image from "next/image";
import FormularioLogin from "@/components/formulario-login";

export default function PaginaLogin() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-fondo px-4">
      <section className="w-full max-w-sm rounded-card border border-borde bg-superficie p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/logo-bolicash.avif"
            alt="Bolicash Logo"
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-full object-contain shrink-0 drop-shadow-sm"
          />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-texto">
              Bolicash Admin
            </h1>
            <p className="text-[11px] text-texto-suave">Acceso restringido</p>
          </div>
        </div>

        <FormularioLogin />
      </section>
    </main>
  );
}