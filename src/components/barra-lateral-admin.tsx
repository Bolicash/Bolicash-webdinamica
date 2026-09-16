"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cerrarSesion } from "@/acciones/login";
import {
  IconoCerrar,
  IconoContactos,
  IconoGanadores,
  IconoMenu,
  IconoPanel,
  IconoParticipantes,
  IconoSalir,
  IconoTrivia,
} from "@/components/iconos";

const ENLACES = [
  { href: "/admin", texto: "Dashboard", icono: IconoPanel },
  { href: "/admin/trivias", texto: "Dinámicas", icono: IconoTrivia },
  { href: "/admin/participaciones", texto: "Participaciones", icono: IconoParticipantes },
  { href: "/admin/ganadores", texto: "Ganadores", icono: IconoGanadores },
  { href: "/admin/contactos", texto: "Contactos", icono: IconoContactos },
];

export default function BarraLateralAdmin() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [rutaPrevia, setRutaPrevia] = useState(ruta);

  // Cerrar el drawer automáticamente al cambiar de ruta
  if (ruta !== rutaPrevia) {
    setRutaPrevia(ruta);
    setAbierto(false);
  }

  // Prevenir scroll en body cuando el menú móvil está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      {/* 1. Barra Superior Móvil con Botón Hamburguesa */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-borde bg-texto px-4 text-superficie md:hidden">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-bolicash.avif"
            alt="Bolicash Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-contain shrink-0"
          />
          <span className="font-bold text-xs uppercase tracking-wider text-superficie">
            Bolicash Admin
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú de navegación"}
          aria-expanded={abierto}
          className="flex h-9 w-9 items-center justify-center rounded-boton border border-superficie/20 bg-superficie/10 text-superficie hover:bg-superficie/20 transition-colors"
        >
          {abierto ? <IconoCerrar className="h-5 w-5" /> : <IconoMenu className="h-5 w-5" />}
        </button>
      </header>

      {/* 2. Drawer / Menú Lateral Desplegable para Móvil con animación suave */}
      <div
        className={`fixed inset-0 z-50 flex md:hidden transition-all duration-300 ease-in-out ${abierto ? "visible pointer-events-auto" : "invisible pointer-events-none"
          }`}
      >
        {/* Backdrop con desvanecimiento suave */}
        <div
          onClick={() => setAbierto(false)}
          aria-hidden="true"
          className={`fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${abierto ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Panel Deslizable suave desde la izquierda */}
        <aside
          className={`relative z-50 flex w-72 max-w-[80vw] flex-col border-r border-borde bg-texto p-5 text-superficie shadow-modal transform transition-transform duration-300 ease-in-out ${abierto ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between border-b border-superficie/15 pb-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-bolicash.avif"
                alt="Bolicash Logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-contain shrink-0"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-superficie">
                  Bolicash
                </p>
                <p className="text-[10px] text-superficie/60">Panel de Administración</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-boton p-1 text-superficie/70 hover:bg-superficie/10 hover:text-superficie"
              aria-label="Cerrar panel"
            >
              <IconoCerrar className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-4 flex flex-col gap-1">
            {ENLACES.map((enlace) => {
              const activo =
                enlace.href === "/admin" ? ruta === "/admin" : ruta.startsWith(enlace.href);
              const Icono = enlace.icono;
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  prefetch={true}
                  onClick={() => setAbierto(false)}
                  className={
                    activo
                      ? "flex items-center gap-3 rounded-boton bg-superficie/15 border border-superficie/20 px-3.5 py-2.5 text-xs font-bold text-superficie"
                      : "flex items-center gap-3 rounded-boton px-3.5 py-2.5 text-xs font-medium text-superficie/70 hover:bg-superficie/10 hover:text-superficie transition-colors"
                  }
                >
                  <Icono className="h-4 w-4" />
                  {enlace.texto}
                </Link>
              );
            })}
          </nav>

          <form action={cerrarSesion} className="mt-auto border-t border-superficie/15 pt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-boton px-3.5 py-2.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
            >
              <IconoSalir className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </aside>
      </div>

      {/* 3. Barra Lateral de Escritorio (md: y superiores) - Fija permanentemente en viewport */}
      <aside className="hidden shrink-0 border-r border-borde bg-texto md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:flex-col md:p-6 md:overflow-y-auto text-superficie z-30">
        <div className="flex items-center gap-3 md:mb-6">
          <Image
            src="/logo-bolicash.avif"
            alt="Bolicash Logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-contain shrink-0"
          />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-superficie">
              Bolicash
            </p>
            <p className="text-[11px] text-superficie/60">Panel admin</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {ENLACES.map((enlace) => {
            const activo =
              enlace.href === "/admin" ? ruta === "/admin" : ruta.startsWith(enlace.href);
            const Icono = enlace.icono;
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                prefetch={true}
                className={
                  activo
                    ? "flex items-center gap-3 rounded-boton bg-superficie/15 border border-superficie/20 px-3.5 py-2 text-xs font-bold text-superficie"
                    : "flex items-center gap-3 rounded-boton px-3.5 py-2 text-xs font-medium text-superficie/70 hover:bg-superficie/10 hover:text-superficie transition-colors"
                }
              >
                <Icono className="h-4 w-4" />
                {enlace.texto}
              </Link>
            );
          })}
        </nav>

        <form action={cerrarSesion} className="mt-auto pt-4 border-t border-superficie/15">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-boton px-3.5 py-2 text-xs font-medium text-superficie/70 hover:bg-superficie/10 hover:text-superficie transition-colors"
          >
            <IconoSalir className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </aside>
    </>
  );
}
