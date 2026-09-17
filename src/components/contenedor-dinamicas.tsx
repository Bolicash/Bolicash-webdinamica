"use client";

import { useState, type TouchEvent } from "react";
import Image from "next/image";
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (dinamicas.length === 0) {
    return (
      <div className="w-full min-h-dvh flex flex-col items-center">
        {/* Navbar cuando no hay dinámicas */}
        <header className="w-full sticky top-0 z-50 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 shadow-md">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-bolicash.avif"
                alt="Bolicash Logo"
                width={36}
                height={36}
                priority
                className="h-9 w-9 rounded-full object-contain border border-dorado-500/40 shadow-sm"
              />
              <span className="text-base font-black tracking-wider text-blanco uppercase font-mono">
                BOLI<span className="text-dorado-400">CASH</span>
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center p-4">
          <EstadoVacio />
        </main>
      </div>
    );
  }

  const indiceActual = dinamicas.findIndex((d) => d.id === seleccionadaId);
  const indice = indiceActual >= 0 ? indiceActual : 0;
  const activaActual = dinamicas[indice] ?? dinamicas[0];

  function irAnterior() {
    const nuevoIndice = (indice - 1 + dinamicas.length) % dinamicas.length;
    setSeleccionadaId(dinamicas[nuevoIndice].id);
  }

  function irSiguiente() {
    const nuevoIndice = (indice + 1) % dinamicas.length;
    setSeleccionadaId(dinamicas[nuevoIndice].id);
  }

  function onTouchStart(e: TouchEvent) {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }

  function onTouchMove(e: TouchEvent) {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  function onTouchEnd() {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      irSiguiente();
    } else if (distance < -50) {
      irAnterior();
    }
  }

  return (
    <div className="w-full min-h-dvh flex flex-col items-center">
      {/* ========================================================= */}
      {/* NAVBAR SUPERIOR DIRECTO ARRIBA (Edge-to-Edge)             */}
      {/* ========================================================= */}
      <header className="w-full sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 shadow-xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Marca Bolicash (Izquierda) */}
          <div className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo-bolicash.avif"
              alt="Bolicash Logo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-contain border border-dorado-500/40 shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-wider text-blanco uppercase font-mono leading-tight">
                BOLI~<span className="text-dorado-400">CASH</span>
              </span>
              <span className="text-[10px] font-bold text-zinc-400 tracking-tight flex items-center gap-1.5 leading-none mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                DINÁMICAS EN VIVO
              </span>
            </div>
          </div>

          {/* Selector de Partidos en Desktop (Centro / Derecha) */}
          {dinamicas.length > 1 && (
            <nav
              aria-label="Dinámicas activas"
              className="hidden md:flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1"
            >
              {dinamicas.map((dinamica) => {
                const estaSeleccionada = dinamica.id === activaActual.id;
                return (
                  <button
                    key={dinamica.id}
                    type="button"
                    onClick={() => setSeleccionadaId(dinamica.id)}
                    className={`group flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                      estaSeleccionada
                        ? "bg-gradient-to-r from-dorado-500 via-dorado-600 to-dorado-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-dorado-400 scale-[1.02]"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-blanco hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-sm">⚽</span>
                    <span>
                      {dinamica.equipo_a}{" "}
                      <span
                        className={
                          estaSeleccionada
                            ? "text-zinc-950/70 font-mono text-[11px]"
                            : "text-dorado-400 font-mono text-[11px]"
                        }
                      >
                        VS
                      </span>{" "}
                      {dinamica.equipo_b}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold transition-all ${
                        estaSeleccionada
                          ? "bg-zinc-950/25 text-zinc-950"
                          : "bg-zinc-800 text-dorado-400 group-hover:bg-zinc-700"
                      }`}
                    >
                      {dinamica.premio_monto ? `${dinamica.premio_monto} Bs` : "100 Bs"}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Badge informativo en Desktop si solo hay 1 dinámica */}
          {dinamicas.length === 1 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-bold text-zinc-300">
              <span>⚽</span>
              <span>
                {activaActual.equipo_a} <span className="text-dorado-400">vs</span> {activaActual.equipo_b}
              </span>
              <span className="text-dorado-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-800">
                {activaActual.premio_monto ? `${activaActual.premio_monto} Bs` : "100 Bs"}
              </span>
            </div>
          )}

          {/* Contador de dinámicas en Mobile (Derecha del Top Bar) */}
          {dinamicas.length > 1 && (
            <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-dorado-400">
              <span>PARTIDO</span>
              <span className="text-blanco">{indice + 1}/{dinamicas.length}</span>
            </div>
          )}
        </div>

        {/* Sub-barra de navegación en Móvil / Tablet cuando hay múltiples dinámicas (Sin cortes de texto) */}
        {dinamicas.length > 1 && (
          <div className="md:hidden w-full border-t border-zinc-800/80 bg-zinc-950/95 px-3 py-2 flex items-center justify-between gap-2 shadow-inner">
            <button
              type="button"
              onClick={irAnterior}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-dorado-400 font-bold text-base active:scale-95 transition-all cursor-pointer"
              aria-label="Partido anterior"
            >
              ‹
            </button>

            <div className="flex-1 flex flex-col items-center text-center px-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-black uppercase text-dorado-400">
                <span>PARTIDO {indice + 1} DE {dinamicas.length}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PREMIO: {activaActual.premio_monto ? `${activaActual.premio_monto} BS` : "100 BS"}
                </span>
              </div>
              <div className="mt-0.5 text-xs font-black uppercase text-blanco tracking-tight flex items-center gap-1.5 justify-center max-w-full">
                <span className="text-[11px]">⚽</span>
                <span>{activaActual.equipo_a}</span>
                <span className="text-dorado-400 font-mono text-[10px]">VS</span>
                <span>{activaActual.equipo_b}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={irSiguiente}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-dorado-400 font-bold text-base active:scale-95 transition-all cursor-pointer"
              aria-label="Partido siguiente"
            >
              ›
            </button>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* CUERPO PRINCIPAL CENTRADO                                 */}
      {/* ========================================================= */}
      <main
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="flex-1 w-full flex flex-col items-center justify-center gap-6 px-4 py-6 sm:py-10"
      >
        <h1 className="sr-only">Bolicash - Dinámicas Deportivas</h1>

        {/* Máquina Tragamonedas (Jackpot) con 550px de ancho en Desktop */}
        <div className="w-full max-w-[550px] flex flex-col items-center mx-auto">
          <FormularioTrivia key={activaActual.id} trivia={activaActual} />
        </div>

        {/* Pie de página informativo */}
        <footer className="text-xs font-medium text-texto-suave">
          Límite: 1 jugada por número de WhatsApp
        </footer>
      </main>
    </div>
  );
}
