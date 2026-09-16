import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

export function clientePublico(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  if (!cliente) {
    cliente = createClient(url, clave, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}