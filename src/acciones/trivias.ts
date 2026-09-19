"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";

function normalizarPlantillaDb(p: string): string {
  return p;
}

export type EstadoCrearTrivia = { error?: string; ok?: boolean } | null;

export async function crearTrivia(
  _estado: EstadoCrearTrivia,
  formData: FormData
): Promise<EstadoCrearTrivia> {
  const db = await crearClienteAdmin();
  if (!db) return { error: "Supabase no está configurado." };

  const equipoA = String(formData.get("equipo_a") ?? "").trim();
  const equipoB = String(formData.get("equipo_b") ?? "").trim();
  const plantillaRaw = String(formData.get("tipo_plantilla") ?? "primer_gol_minuto");
  const plantilla = normalizarPlantillaDb(plantillaRaw);
  const fecha = String(formData.get("fecha_inicio") ?? "");
  const estado = String(formData.get("estado") ?? "borrador");
  const publicada = formData.get("publicada") === "on";

  const premioMonto = Math.max(1, parseInt(String(formData.get("premio_monto") ?? "100"), 10) || 100);

  if (!equipoA || !equipoB || !fecha) {
    return { error: "Completa todos los campos." };
  }
  if (Number.isNaN(new Date(fecha).getTime()) || new Date(fecha).getTime() <= Date.now()) {
    return { error: "La fecha y hora de inicio debe ser posterior al momento actual." };
  }

  const { error } = await db.rpc("crear_trivia_admin", {
    p_equipo_a: equipoA,
    p_equipo_b: equipoB,
    p_tipo_plantilla: plantilla,
    p_fecha_inicio: fecha,
    p_publicada: publicada,
    p_estado: estado,
    p_premio_monto: premioMonto,
  });
  if (error) {
    console.error("crear_trivia_admin:", error.message, error.code, error.details, error.hint);
    return { error: "No se pudo crear la trivia en la base de datos." };
  }

  revalidatePath("/admin/trivias");
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarTrivia(
  _estado: EstadoCrearTrivia,
  formData: FormData
): Promise<EstadoCrearTrivia> {
  const db = await crearClienteAdmin();
  if (!db) return { error: "Supabase no está configurado." };

  const id = String(formData.get("id") ?? "").trim();
  let equipoA = String(formData.get("equipo_a") ?? "").trim();
  let equipoB = String(formData.get("equipo_b") ?? "").trim();
  const plantillaRaw = String(formData.get("tipo_plantilla") ?? "primer_gol_minuto");
  let plantilla = normalizarPlantillaDb(plantillaRaw);
  const fecha = String(formData.get("fecha_inicio") ?? "");
  const estadoRaw = String(formData.get("estado") ?? "activa");
  const estado = estadoRaw === "vencida" ? "finalizada" : estadoRaw;
  const publicada = formData.get("publicada") === "on";
  const premioMonto = Math.max(1, parseInt(String(formData.get("premio_monto") ?? "100"), 10) || 100);

  // Protección en servidor: Si ya existen jugadas, no permitir alterar equipos ni tipo de juego
  const { count } = await db
    .from("participaciones")
    .select("id", { count: "exact", head: true })
    .eq("trivia_id", id);

  if ((count ?? 0) > 0) {
    const { data: original } = await db
      .from("trivias")
      .select("equipo_a, equipo_b, tipo_plantilla")
      .eq("id", id)
      .maybeSingle();

    if (original) {
      equipoA = original.equipo_a;
      equipoB = original.equipo_b;
      plantilla = original.tipo_plantilla;
    }
  }

  if (!id || !equipoA || !equipoB || !fecha) {
    return { error: "Completa todos los campos obligatorios." };
  }
  const fechaDate = new Date(fecha);
  if (Number.isNaN(fechaDate.getTime())) {
    return { error: "La fecha y hora no son válidas." };
  }

  if ((estado === "activa" || publicada) && fechaDate.getTime() <= Date.now()) {
    return {
      error:
        "Para reactivar o publicar la dinámica, la fecha y hora de cierre deben ser posteriores al momento actual.",
    };
  }

  // Intentamos primero con RPC
  const { error: errorRpc } = await db.rpc("actualizar_trivia_admin", {
    p_id: id,
    p_equipo_a: equipoA,
    p_equipo_b: equipoB,
    p_tipo_plantilla: plantilla,
    p_fecha_inicio: fecha,
    p_publicada: publicada,
    p_estado: estado,
    p_premio_monto: premioMonto,
  });

  if (errorRpc) {
    console.error("actualizar_trivia_admin RPC error:", errorRpc.message);
    // Si no está desplegado el RPC, intentamos con update directo y comprobamos filas afectadas
    const { data: updatedRows, error: errorUpdate } = await db
      .from("trivias")
      .update({
        equipo_a: equipoA,
        equipo_b: equipoB,
        tipo_plantilla: plantilla,
        fecha_inicio: fecha,
        publicada: publicada,
        estado: estado,
        premio_monto: premioMonto,
      })
      .eq("id", id)
      .select();

    if (errorUpdate || !updatedRows || updatedRows.length === 0) {
      console.error("actualizarTrivia falló:", errorRpc?.message, errorUpdate?.message);
      return {
        error:
          errorUpdate?.message ||
          errorRpc?.message ||
          "No se pudieron guardar los cambios en la base de datos.",
      };
    }
  }

  revalidatePath("/admin/trivias");
  revalidatePath("/admin/participaciones");
  revalidatePath("/admin/ganadores");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}


export async function publicarTrivia(formData: FormData) {
  const db = await crearClienteAdmin();
  if (!db) return;

  const id = String(formData.get("id") ?? "");
  const publicada = String(formData.get("publicada") ?? "") === "true";
  if (!id) return;

  await db.rpc("publicar_trivia_admin", { p_id: id, p_publicada: publicada });
  revalidatePath("/admin/trivias");
  revalidatePath("/");
}

export async function cambiarEstadoTrivia(formData: FormData) {
  const db = await crearClienteAdmin();
  if (!db) return;

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!id || !["borrador", "activa", "finalizada"].includes(estado)) return;

  // Si intentan activar directamente una trivia cuya fecha ya venció, no permitirlo
  if (estado === "activa") {
    const { data: t } = await db.from("trivias").select("fecha_inicio").eq("id", id).maybeSingle();
    if (t?.fecha_inicio && new Date(t.fecha_inicio).getTime() <= Date.now()) {
      return;
    }
  }

  const { error } = await db.rpc("cambiar_estado_admin", { p_id: id, p_estado: estado });
  if (error) {
    console.error("cambiar_estado_admin:", error.message, error.code, error.details, error.hint);
  }
  revalidatePath("/admin/trivias");
  revalidatePath("/");
}

export async function eliminarTrivia(formData: FormData) {
  const db = await crearClienteAdmin();
  if (!db) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.rpc("eliminar_trivia_admin", { p_id: id });
  revalidatePath("/admin/trivias");
  revalidatePath("/");
}