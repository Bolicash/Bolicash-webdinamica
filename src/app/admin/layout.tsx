import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import BarraLateralAdmin from "@/components/barra-lateral-admin";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const db = await crearClienteAdmin();

  if (!db) {
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center bg-fondo px-4">
        <section className="w-full max-w-md rounded-card border border-borde bg-superficie p-8">
          <p className="inline-block rounded-boton bg-advertencia px-3 py-1 font-mono text-[11px] font-bold text-superficie uppercase">
            Configuración pendiente
          </p>
          <h1 className="mt-4 text-base font-bold text-texto">
            Variables de entorno no configuradas
          </h1>
          <p className="mt-1 text-xs text-texto-suave">
            Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en
            .env.local y reinicia el servidor.
          </p>
        </section>
      </main>
    );
  }

  const { data } = await db.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-dvh bg-fondo w-full">
      <BarraLateralAdmin />
      <div className="flex flex-col min-h-dvh md:pl-64 w-full">
        <main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}