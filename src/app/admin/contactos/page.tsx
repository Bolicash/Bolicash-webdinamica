import { crearClienteAdmin } from "@/lib/supabase/admin";

type FilaContacto = {
  nombre: string;
  whatsapp: string;
  creado_en: string;
};

export default async function ContactosPage() {
  const db = await crearClienteAdmin();
  if (!db) return null;

  const { data } = await db.rpc("listar_contactos_admin", { p_limite: 500 });
  const contactos = (data ?? []) as FilaContacto[];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-texto">
              Contactos
            </h1>
            <span className="rounded-boton border border-borde bg-primario-claro px-2 py-0.5 font-mono text-xs font-bold text-texto-suave">
              {contactos.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-texto-suave">
            Base de datos de participantes recolectada en cada trivia.
          </p>
        </div>

        <a
          href="/admin/contactos/exportar"
          className="inline-flex items-center gap-2 rounded-boton bg-primario px-4 py-2 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro transition-colors"
        >
          Exportar a CSV / Excel
        </a>
      </div>

      <section className="w-full max-w-full min-w-0 rounded-card border border-borde bg-superficie overflow-hidden">
        <div className="tabla-scroll w-full">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead>
              <tr className="border-b border-borde bg-primario-claro/50 font-mono uppercase tracking-wider text-texto-suave">
                <th className="px-4 py-3 font-bold whitespace-nowrap"># Nombre del Participante</th>
                <th className="px-4 py-3 font-bold whitespace-nowrap">WhatsApp</th>
                <th className="px-4 py-3 font-bold whitespace-nowrap">Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {contactos.map((contacto, idx) => (
                <tr key={contacto.whatsapp} className="hover:bg-primario-claro/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-texto whitespace-nowrap">
                    {idx + 1}. {contacto.nombre}
                  </td>
                  <td className="px-4 py-3 font-mono text-texto-suave whitespace-nowrap">{contacto.whatsapp}</td>
                  <td className="px-4 py-3 font-mono text-texto-suave text-[11px] whitespace-nowrap">
                    {new Intl.DateTimeFormat("es", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(contacto.creado_en))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contactos.length === 0 && (
            <p className="py-8 text-center text-xs text-texto-suave">
              Todavía no hay contactos registrados.
            </p>
          )}
        </div>
      </section>
    </>
  );
}