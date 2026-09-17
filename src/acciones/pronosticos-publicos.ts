"use server";

import { clientePublico } from "@/lib/supabase/public";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export type PronosticoPublico = {
  nombre: string;
  equipo_seleccionado: string;
  minuto_pronosticado: number;
  registrado_en: string;
};

export type RespuestaPronosticosPublicos = {
  ok: boolean;
  total: number;
  pronosticos: PronosticoPublico[];
  error?: string;
};

/**
 * Obtiene los pronósticos públicos de una dinámica.
 * SEGURIDAD ESTRICTA: Jamás retorna números de teléfono ni datos de contacto.
 */
export async function obtenerPronosticosPublicos(
  triviaId: string
): Promise<RespuestaPronosticosPublicos> {
  if (!triviaId || typeof triviaId !== "string") {
    return { ok: false, total: 0, pronosticos: [], error: "ID de dinámica inválido." };
  }

  // 1. Intentar con la función dedicada listar_pronosticos_publicos
  const dbPublic = clientePublico();
  if (dbPublic) {
    const { data, error } = await dbPublic.rpc("listar_pronosticos_publicos", {
      p_trivia_id: triviaId,
    });

    if (!error && Array.isArray(data)) {
      const pronosticos: PronosticoPublico[] = data.map((item: any) => ({
        nombre: String(item.nombre ?? "").trim() || "Hincha Bolicash",
        equipo_seleccionado: String(item.equipo_seleccionado ?? ""),
        minuto_pronosticado: Number(item.minuto_pronosticado ?? 0),
        registrado_en: String(item.registrado_en ?? new Date().toISOString()),
      }));

      return {
        ok: true,
        total: pronosticos.length,
        pronosticos,
      };
    }
  }

  // 2. Fallback de seguridad en servidor: si la función SQL pública aún no fue aplicada en Supabase,
  // consultamos via RPC administrativo pero LIMPIAMOS y SANITIZAMOS absolutamente todo
  // en el servidor antes de enviar la respuesta al navegador.
  const dbAdmin = await crearClienteAdmin();
  if (dbAdmin) {
    const { data, error } = await dbAdmin.rpc("listar_participaciones_admin", {
      p_trivia_id: triviaId,
      p_limite: 500,
    });

    if (!error && Array.isArray(data)) {
      const pronosticos: PronosticoPublico[] = data.map((item: any) => ({
        nombre: String(item.nombre ?? "").trim() || "Hincha Bolicash",
        equipo_seleccionado: String(item.equipo_seleccionado ?? ""),
        minuto_pronosticado: Number(item.minuto_pronosticado ?? 0),
        registrado_en: String(item.registrado_en ?? new Date().toISOString()),
      }));

      return {
        ok: true,
        total: pronosticos.length,
        pronosticos,
      };
    }
  }

  return { ok: false, total: 0, pronosticos: [], error: "No se pudieron cargar los pronósticos." };
}
