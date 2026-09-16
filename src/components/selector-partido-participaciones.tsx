"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconoChevronAbajo } from "@/components/iconos";
import type { TriviaMini } from "@/components/tabla-participaciones";

export default function SelectorPartidoParticipaciones({
  trivias,
  triviaActualId,
}: {
  trivias: TriviaMini[];
  triviaActualId: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const seleccionada = trivias.find((t) => t.id === triviaActualId) ?? trivias[0];

  useEffect(() => {
    function handleClickAfuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickAfuera);
    return () => document.removeEventListener("mousedown", handleClickAfuera);
  }, []);

  return (
    <section className="rounded-card border border-borde bg-superficie p-4 shadow-xs">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-texto-suave">
        Seleccionar Partido
      </label>
      <div ref={contenedorRef} className="relative w-full max-w-full">
        {/* Botón selector que nunca desborda la pantalla */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="flex w-full items-center justify-between rounded-boton border border-borde bg-superficie py-2.5 pl-3.5 pr-4 text-xs font-bold text-texto outline-none focus:border-primario focus:ring-1 focus:ring-primario transition-colors"
        >
          <span className="truncate text-left pr-2">
            {seleccionada
              ? `${seleccionada.equipo_a} vs ${seleccionada.equipo_b} (${seleccionada.total_participaciones ?? 0} ${
                  seleccionada.total_participaciones === 1 ? "jugada" : "jugadas"
                })`
              : "Seleccionar partido"}
          </span>
          <IconoChevronAbajo
            className={`h-3.5 w-3.5 shrink-0 text-texto-suave transition-transform duration-200 ${
              abierto ? "rotate-180 text-primario" : ""
            }`}
          />
        </button>

        {/* Menú desplegable HTML dentro del DOM, confinado al ancho de la tarjeta */}
        {abierto && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-card border border-borde bg-superficie py-1 shadow-lg">
            {trivias.map((t) => {
              const activo = t.id === triviaActualId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setAbierto(false);
                    router.push(`/admin/participaciones?trivia=${t.id}`);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                    activo
                      ? "bg-primario-claro font-bold text-primario"
                      : "text-texto hover:bg-primario-claro/50 font-medium"
                  }`}
                >
                  <span className="truncate pr-2">
                    {t.equipo_a} vs {t.equipo_b}
                  </span>
                  <span className="font-mono text-[11px] text-texto-suave shrink-0">
                    {t.total_participaciones ?? 0} {t.total_participaciones === 1 ? "jugada" : "jugadas"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
