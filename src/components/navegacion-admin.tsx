"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoContactos,
  IconoGanadores,
  IconoPanel,
  IconoParticipantes,
  IconoTrivia,
} from "@/components/iconos";

const ENLACES = [
  { href: "/admin", texto: "Dashboard", icono: IconoPanel },
  { href: "/admin/trivias", texto: "Dinámicas", icono: IconoTrivia },
  { href: "/admin/participaciones", texto: "Participaciones", icono: IconoParticipantes },
  { href: "/admin/ganadores", texto: "Ganadores", icono: IconoGanadores },
  { href: "/admin/contactos", texto: "Contactos", icono: IconoContactos },
];

export default function NavegacionAdmin() {
  const ruta = usePathname();

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
      {ENLACES.map((enlace) => {
        const activo =
          enlace.href === "/admin" ? ruta === "/admin" : ruta.startsWith(enlace.href);
        const Icono = enlace.icono;
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={
              activo
                ? "flex shrink-0 items-center gap-3 rounded-boton bg-superficie/15 border border-superficie/20 px-3.5 py-2 text-xs font-bold text-superficie"
                : "flex shrink-0 items-center gap-3 rounded-boton px-3.5 py-2 text-xs font-medium text-superficie/70 hover:bg-superficie/10 hover:text-superficie transition-colors"
            }
          >
            <Icono className="h-4 w-4" />
            {enlace.texto}
          </Link>
        );
      })}
    </nav>
  );
}