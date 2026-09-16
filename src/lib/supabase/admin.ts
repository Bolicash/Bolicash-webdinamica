import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return null;

  const cookieStore = await cookies();
  return createServerClient(url, clave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesAEstablecer) {
        try {
          cookiesAEstablecer.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignore
        }
      },
    },
  });
}