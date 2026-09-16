import { crearClienteAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const db = await crearClienteAdmin();
  if (!db) return new Response("Supabase no configurado", { status: 500 });

  const { data: sesion } = await db.auth.getUser();
  if (!sesion.user) return new Response("No autorizado", { status: 401 });

  const { data, error } = await db.rpc("listar_contactos_admin", { p_limite: 100000 });
  if (error || !data) return new Response("Error al exportar", { status: 500 });

  const filas = data as { nombre: string; whatsapp: string; creado_en: string }[];
  const lineas = filas.map((f) => `${f.nombre};${f.whatsapp};${f.creado_en}`);
  const csv = `nombre;whatsapp;creado_en\n${lineas.join("\n")}\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contactos_bolicash.csv"',
    },
  });
}