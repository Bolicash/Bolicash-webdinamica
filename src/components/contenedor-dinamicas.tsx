"use client";

import { useState } from "react";
import EstadoVacio from "@/components/estado-vacio";
import FormularioTrivia from "@/components/formulario-trivias";
import type { TriviaActiva } from "@/lib/trivias";

export default function ContenedorDinamicas({
  dinamicas,
}: {
  dinamicas: TriviaActiva[];
}) {
  const [seleccionadaId, setSeleccionadaId] = useState<string>(
    dinamicas[0]?.id ?? ""
  );

  if (dinamicas.length === 0) {
    return (
      <div className="w-full flex justify-center">
        <EstadoVacio />
      </div>
    );
  }

  const activaActual =
    dinamicas.find((d) => d.id === seleccionadaId) ?? dinamicas[0];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[550px] mx-auto">
      {/* Selector de partidos estilo NAVBAR flotante para múltiples dinámicas */}
      {dinamicas.length > 1 && (
        <nav
          aria-label="Selector de dinámicas en vivo"
          className="w-full flex justify-center py-1"
        >
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-950/90 border border-zinc-800 shadow-xl backdrop-blur-md max-w-full overflow-x-auto scrollbar-none">
            {/* Indicador EN VIVO */}
            <div className="hidden sm:flex items-center gap-1.5 pl-3 pr-2 text-[10px] font-black uppercase tracking-widest text-dorado-400 border-r border-zinc-800 shrink-0">
              <span className="h-2 w-2 rounded-full bg-secundario animate-pulse" />
              <span>activos</span>
            </div>

            {/* Pestañas de navegación tipo Navbar */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1">
              {dinamicas.map((dinamica) => {
                const estaSeleccionada = dinamica.id === activaActual.id;
                return (
                  <button
                    key={dinamica.id}
                    type="button"
                    onClick={() => setSeleccionadaId(dinamica.id)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                      estaSeleccionada
                        ? "bg-gradient-to-r from-dorado-500 via-dorado-600 to-dorado-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-dorado-400"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-blanco hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    <span className="text-[11px]">⚽</span>
                    <span>
                      {dinamica.equipo_a} <span className={estaSeleccionada ? "opacity-70" : "text-zinc-500"}>vs</span>{" "}
                      {dinamica.equipo_b}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Formulario de la dinámica activa */}
      <FormularioTrivia key={activaActual.id} trivia={activaActual} />
    </div>
  );
}
