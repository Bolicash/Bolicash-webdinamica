"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export type FilaGanador = {
  nombre: string;
  whatsapp: string;
  equipo_seleccionado: string;
  minuto_pronosticado: number;
  registrado_en: string;
};

export async function guardarYBuscarGanadores(
  formData: FormData
): Promise<{ error?: string; filas?: FilaGanador[] }> {
  const db = await crearClienteAdmin();
  if (!db) return { error: "Supabase no está configurado." };

  const triviaId = String(formData.get("trivia_id") ?? "");
  const equipo = String(formData.get("equipo_ganador") ?? "").trim();
  const minuto = Number(formData.get("minuto_ganador") ?? "");

  if (!triviaId || !equipo || !Number.isInteger(minuto) || minuto < 0 || minuto > 120) {
    return { error: "Selecciona trivia, equipo ganador y minuto (0-120)." };
  }

  const guardado = await db.rpc("guardar_resultado_admin", {
    p_id: triviaId,
    p_equipo_ganador: equipo,
    p_minuto_ganador: minuto,
  });
  if (guardado.error) return { error: "No se pudo guardar el resultado." };

  const { data, error } = await db.rpc("buscar_ganadores_admin", {
    p_trivia_id: triviaId,
    p_equipo: equipo,
    p_minuto: minuto,
  });
  if (error) return { error: "No se pudieron buscar los ganadores." };

  revalidatePath("/admin/ganadores");
  revalidatePath("/admin/participaciones");
  revalidatePath("/admin/trivias");

  return { filas: (data ?? []) as FilaGanador[] };
}

export async function anularResultadoGanadores(triviaId: string): Promise<{ error?: string; ok?: boolean }> {
  const db = await crearClienteAdmin();
  if (!db) return { error: "Supabase no está configurado." };

  const { error } = await db
    .from("trivias")
    .update({
      equipo_ganador_real: null,
      minuto_ganador_real: null,
      estado: "activa",
    })
    .eq("id", triviaId);

  if (error) return { error: error.message };

  revalidatePath("/admin/ganadores");
  revalidatePath("/admin/participaciones");
  revalidatePath("/admin/trivias");
  return { ok: true };
}