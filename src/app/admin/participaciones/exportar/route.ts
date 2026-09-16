import { crearClienteAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const db = await crearClienteAdmin();
  if (!db) return new Response("Supabase no configurado", { status: 500 });

  const { data: sesion } = await db.auth.getUser();
  if (!sesion.user) return new Response("No autorizado", { status: 401 });

  const triviaId = new URL(request.url).searchParams.get("trivia_id");
  if (!triviaId) return new Response("Falta trivia_id", { status: 400 });

  const { data, error } = await db.rpc("listar_participaciones_admin", {
    p_trivia_id: triviaId,
    p_limite: 100000,
  });
  if (error || !data) return new Response("Error al exportar", { status: 500 });

  const filas = data as {
    nombre: string;
    whatsapp: string;
    equipo_seleccionado: string;
    minuto_pronosticado: number;
    registrado_en: string;
  }[];
  const lineas = filas.map(
    (f) =>
      `${f.nombre};${f.whatsapp};${f.equipo_seleccionado};${f.minuto_pronosticado};${f.registrado_en}`
  );
  const csv = `nombre;whatsapp;equipo;minuto;registrado_en\n${lineas.join("\n")}\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="participaciones_bolicash.csv"',
    },
  });
}