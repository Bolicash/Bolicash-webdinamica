"use server";

import { redirect } from "next/navigation";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export type EstadoLogin = { error?: string } | null;

export async function iniciarSesion(
  _estado: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const db = await crearClienteAdmin();
  if (!db) {
    return { error: "Supabase no está configurado. Revisa las variables de entorno." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Ingresa correo y contraseña." };
  }

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "Credenciales incorrectas." };

  redirect("/admin");
}

export async function cerrarSesion() {
  const db = await crearClienteAdmin();
  if (db) await db.auth.signOut();
  redirect("/login");
}