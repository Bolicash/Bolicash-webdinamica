"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { getCountryCallingCode } from "react-phone-number-input";
import type { Country as CountryCode } from "react-phone-number-input";
import es from "react-phone-number-input/locale/es.json";
import * as Flags from "country-flag-icons/react/3x2";

interface OpcionPais {
  value?: string;
  label: string;
  divider?: boolean;
}

/** Componente que renderiza la bandera SVG real del país */
export function BanderaPais({
  pais,
  className = "h-3.5 w-5 rounded-[2px] object-cover flex-shrink-0 shadow-sm",
}: {
  pais?: string;
  className?: string;
}) {
  if (!pais) return <span className="text-xs">🌐</span>;
  const FlagComponent = (Flags as Record<string, ComponentType<{ className?: string }>>)[
    pais.toUpperCase()
  ];
  if (!FlagComponent) {
    return (
      <span className="inline-flex h-3.5 w-5 items-center justify-center rounded-[2px] bg-zinc-700 font-mono text-[9px] font-bold text-zinc-200">
        {pais}
      </span>
    );
  }
  return <FlagComponent className={className} />;
}

// Países destacados para mostrarlos al inicio de la lista
const PAISES_DESTACADOS = ["BO", "AR", "PE", "CL", "CO", "ES", "MX", "US", "BR", "UY", "PY", "EC", "VE"];

/**
 * Selector de país interactivo:
 * - Muestra bandera SVG real y código
 * - Al abrirse, muestra INMEDIATAMENTE la lista completa con Bolivia y países comunes arriba
 * - Permite seleccionar con un simple clic sin necesidad de escribir
 * - Incluye buscador opcional para filtrar rápidamente
 */
export function SelectorPais({
  value,
  onChange,
  options,
  disabled,
}: {
  value?: string;
  onChange: (v?: string) => void;
  options: OpcionPais[];
  iconComponent?: ComponentType<unknown>;
  disabled?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    function cerrar(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  // Lista ordenada: destacados primero, luego el resto
  const opcionesOrdenadas = useMemo(() => {
    const validas = options.filter((o) => o.value && !o.divider);
    const destacados: OpcionPais[] = [];
    const resto: OpcionPais[] = [];

    const map = new Map<string, OpcionPais>();
    for (const opt of validas) {
      if (opt.value) map.set(opt.value.toUpperCase(), opt);
    }

    for (const cc of PAISES_DESTACADOS) {
      const item = map.get(cc);
      if (item) {
        destacados.push(item);
        map.delete(cc);
      }
    }

    for (const item of map.values()) {
      resto.push(item);
    }

    resto.sort((a, b) => {
      const nombreA = (es[a.value as keyof typeof es] ?? a.label).toLowerCase();
      const nombreB = (es[b.value as keyof typeof es] ?? b.label).toLowerCase();
      return nombreA.localeCompare(nombreB, "es");
    });

    return { destacados, resto, todas: [...destacados, ...resto] };
  }, [options]);

  // Filtrado según búsqueda
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return opcionesOrdenadas.todas;

    return opcionesOrdenadas.todas.filter((o) => {
      if (!o.value) return false;
      const nombre = (es[o.value as keyof typeof es] ?? o.label).toLowerCase();
      let codigo = "";
      try {
        codigo = `+${getCountryCallingCode(o.value as CountryCode)}`;
      } catch {
        // ignora
      }
      return nombre.includes(q) || codigo.includes(q) || o.value.toLowerCase().includes(q);
    });
  }, [busqueda, opcionesOrdenadas]);

  let codigoActual = "";
  if (value) {
    try {
      codigoActual = `+${getCountryCallingCode(value as CountryCode)}`;
    } catch {
      codigoActual = "";
    }
  }

  return (
    <div ref={contenedor} className="relative flex-shrink-0">
      {/* Botón trigger con bandera SVG, código de país y chevron */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setAbierto((prev) => !prev);
          setBusqueda("");
        }}
        className="flex h-full items-center gap-1.5 border-r border-zinc-700/80 bg-zinc-800/80 px-2.5 py-3 outline-none transition-colors hover:bg-zinc-700/80 disabled:opacity-50 rounded-l-xl cursor-pointer"
        aria-label="Seleccionar país"
        aria-expanded={abierto}
        aria-haspopup="listbox"
      >
        <BanderaPais pais={value} className="h-3.5 w-5 rounded-[2px] object-cover shadow-sm" />
        {codigoActual && (
          <span className="font-mono text-xs font-bold text-zinc-300">
            {codigoActual}
          </span>
        )}
        <svg
          viewBox="0 0 10 14"
          className="h-3 w-2 fill-none stroke-current stroke-2 text-zinc-400"
          aria-hidden
        >
          <path d="M2 5.5l3-3 3 3M2 8.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Popover flotante desplegable hacia arriba para no recortarse */}
      {abierto && (
        <div
          role="listbox"
          className="absolute bottom-full left-0 z-[100] mb-1.5 w-72 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 text-blanco shadow-2xl"
          style={{
            maxHeight: "340px",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* Buscador opcional */}
          <div className="border-b border-zinc-800 bg-zinc-950 p-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 focus-within:border-dorado-400 focus-within:ring-1 focus-within:ring-dorado-400">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 flex-shrink-0 stroke-current stroke-2 text-zinc-400"
                fill="none"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar país o prefijo..."
                className="flex-1 bg-transparent text-xs text-blanco outline-none placeholder:text-zinc-500"
                autoFocus
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="text-xs text-zinc-400 hover:text-blanco"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Lista scrolleable con selección directa */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60 py-1">
            {filtradas.length === 0 ? (
              <p className="p-4 text-center text-xs text-zinc-400">
                No se encontraron países con &quot;{busqueda}&quot;
              </p>
            ) : (
              filtradas.map((o) => {
                const esSeleccionado = value === o.value;
                let prefijo = "";
                try {
                  prefijo = `+${getCountryCallingCode(o.value as CountryCode)}`;
                } catch {
                  // nada
                }

                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={esSeleccionado}
                    onClick={() => {
                      onChange(o.value);
                      setAbierto(false);
                      setBusqueda("");
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-800 cursor-pointer ${
                      esSeleccionado ? "bg-zinc-800 font-bold text-secundario" : "text-zinc-200"
                    }`}
                  >
                    <BanderaPais pais={o.value} />
                    <span className="flex-1 truncate">
                      {es[o.value as keyof typeof es] ?? o.label}
                    </span>
                    <span className="flex-shrink-0 font-mono text-[11px] font-semibold text-zinc-400">
                      {prefijo}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
