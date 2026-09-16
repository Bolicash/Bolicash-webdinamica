"use client";

import { useActionState } from "react";
import { iniciarSesion } from "@/acciones/login";

const ESTILO_INPUT =
  "w-full rounded-boton border border-borde bg-superficie px-3.5 py-2.5 text-xs font-medium text-texto placeholder:text-texto-suave outline-none focus:border-primario focus:ring-1 focus:ring-primario";

export default function FormularioLogin() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, null);

  return (
    <form action={accion} className="flex flex-col gap-3.5">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave" htmlFor="email">
          Correo Electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="admin@bolicash.com"
          className={ESTILO_INPUT}
        />
      </div>
      <div>
        <label
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-texto-suave"
          htmlFor="password"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className={ESTILO_INPUT}
        />
      </div>
      {estado?.error && (
        <p
          role="alert"
          className="rounded-boton border border-error/20 bg-error/10 p-2.5 text-center text-xs font-semibold text-error"
        >
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-boton bg-primario py-2.5 text-xs font-bold uppercase tracking-wider text-superficie hover:bg-primario-oscuro disabled:opacity-50 transition-colors mt-1"
      >
        {pendiente ? "Ingresando..." : "Ingresar al Panel"}
      </button>
    </form>
  );
}