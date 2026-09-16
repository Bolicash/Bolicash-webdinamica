import { createBrowserClient } from "@supabase/ssr";

let cliente: ReturnType<typeof createBrowserClient> | null = null;

export function clienteBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;
  if (!cliente) {
    cliente = createBrowserClient(url, clave);
  }
  return cliente;
}
