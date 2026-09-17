import { clientePublico } from "@/lib/supabase/public";

export type TriviaActiva = {
  id: string;
  equipo_a: string;
  equipo_b: string;
  tipo_plantilla: string;
  fecha_inicio: string;
  premio_monto?: number;
};

export async function obtenerTriviaActiva(): Promise<TriviaActiva | null> {
  const activas = await obtenerTriviasActivas();
  return activas[0] ?? null;
}

export async function obtenerTriviasActivas(): Promise<TriviaActiva[]> {
  const db = clientePublico();
  if (!db) return [];

  const { data, error } = await db
    .from("trivias")
    .select("id, equipo_a, equipo_b, tipo_plantilla, fecha_inicio, premio_monto")
    .eq("publicada", true)
    .eq("estado", "activa")
    .gt("fecha_inicio", new Date().toISOString())
    .order("fecha_inicio", { ascending: true });

  if (error || !data) return [];
  return data as TriviaActiva[];
}

export { estaVencida } from "@/lib/fechas";