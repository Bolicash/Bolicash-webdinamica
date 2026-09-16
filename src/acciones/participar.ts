"use server";

import { clientePublico } from "@/lib/supabase/public";

export type Boleto = {
  id: string;
  trivia_id: string;
  nombre: string;
  whatsapp: string;
  equipo_seleccionado: string;
  minuto_pronosticado: number;
  registrado_en: string;
};

export type ResultadoParticipar =
  | { ok: true; boleto: Boleto }
  | { ok: false; error: string };

export async function participar(formData: FormData): Promise<ResultadoParticipar> {
  const db = clientePublico();
  if (!db) return { ok: false, error: "Sistema en mantenimiento. Intenta más tarde." };

  const triviaId = String(formData.get("trivia_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const equipo = String(formData.get("equipo") ?? "");
  const minuto = Number(formData.get("minuto") ?? "");

  if (nombre.length < 2 || nombre.length > 80) {
    return { ok: false, error: "Ingresa tu nombre (entre 2 y 80 caracteres)." };
  }
  // El número llega en formato E.164 completo: +59170012345
  if (!/^\+\d{7,15}$/.test(numero)) {
    return { ok: false, error: "Ingresa un número de WhatsApp válido." };
  }
  if (!Number.isInteger(minuto) || minuto < 0 || minuto > 120) {
    return { ok: false, error: "El minuto debe ser un número entre 0 y 120." };
  }

  const whatsapp = numero;

  const revalidacion = await db
    .from("trivias")
    .select("id, equipo_a, equipo_b, publicada, fecha_inicio")
    .eq("id", triviaId)
    .limit(1);
  const trivia = revalidacion.data?.[0];

  if (!trivia || !trivia.publicada) {
    return { ok: false, error: "Esta dinámica no está disponible." };
  }
  if (new Date(trivia.fecha_inicio).getTime() <= Date.now()) {
    return { ok: false, error: "El formulario ya cerró." };
  }
  if (equipo !== trivia.equipo_a && equipo !== trivia.equipo_b) {
    return { ok: false, error: "Selecciona uno de los dos equipos." };
  }

  const { data, error } = await db.rpc("registrar_participacion", {
    p_trivia_id: triviaId,
    p_nombre: nombre,
    p_whatsapp: whatsapp,
    p_equipo_seleccionado: equipo,
    p_minuto_pronosticado: minuto,
  });

  if (error) {
    const mensaje = String(error.message ?? "");
    if (mensaje.includes("FORMULARIO_CERRADO")) {
      return { ok: false, error: "El formulario ya cerró." };
    }
    if (mensaje.includes("YA_PARTICIPASTE")) {
      return { ok: false, error: "Ya participaste en esta dinámica. Una jugada por número." };
    }
    if (mensaje.includes("TRIVIA_NO")) {
      return { ok: false, error: "Esta dinámica no está disponible." };
    }
    return { ok: false, error: "No se pudo registrar tu jugada. Intenta de nuevo." };
  }

  return { ok: true, boleto: data as Boleto };
}