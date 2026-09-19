"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import es from "react-phone-number-input/locale/es.json";
import "react-phone-number-input/style.css";
import { SelectorPais } from "@/components/selector-pais";
import { IconoFlechaDerecha } from "@/components/iconos";
import { participar, type ResultadoParticipar } from "@/acciones/participar";
import type { TriviaActiva } from "@/lib/trivias";
import { formatearFechaHoraBolivia } from "@/lib/fechas";
import IndicadorActivos from "@/components/indicador-activos";
import ModalPronosticosEnVivo from "@/components/modal-pronosticos-en-vivo";
import {
  obtenerPronosticosPublicos,
  type PronosticoPublico,
} from "@/acciones/pronosticos-publicos";

const CHIPS_MINUTOS = [15, 30, 45, 60, 75, 90];
const CHIPS_CORNERS = [3, 5, 7, 9, 12, 15];

function tiempoRestante(fechaInicio: string): number {
  return Math.max(0, new Date(fechaInicio).getTime() - Date.now());
}

function formatearTiempo(ms: number): string {
  const segundos = Math.floor(ms / 1000);
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const dos = (n: number) => String(n).padStart(2, "0");

  if (d > 0) return `${d}d ${dos(h)}h ${dos(m)}m ${dos(s)}s`;
  if (h > 0) return `${dos(h)}h ${dos(m)}m ${dos(s)}s`;
  return `${dos(m)}m ${dos(s)}s`;
}

function FilaRecibo({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-xs border-b border-dashed border-zinc-800/60 last:border-0">
      <span className="text-zinc-400 font-medium">{etiqueta}</span>
      <span className="text-blanco font-semibold text-right">{valor}</span>
    </div>
  );
}

export default function FormularioTrivia({ trivia }: { trivia: TriviaActiva }) {
  const esTirosEsquina =
    trivia.tipo_plantilla === "tiros_esquina" || trivia.tipo_plantilla === "minuto_gol_equipo";
  const maxValor = esTirosEsquina ? 30 : 120;
  const valorInicial = esTirosEsquina ? 5 : 45;
  const chips = esTirosEsquina ? CHIPS_CORNERS : CHIPS_MINUTOS;

  const [restante, setRestante] = useState(() => tiempoRestante(trivia.fecha_inicio));
  const [equipo, setEquipo] = useState("");
  const [minuto, setMinuto] = useState<number | "">(valorInicial);
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [resultado, setResultado] = useState<ResultadoParticipar | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [modalPronosticosAbierto, setModalPronosticosAbierto] = useState(false);
  const [pronosticos, setPronosticos] = useState<PronosticoPublico[]>([]);
  const [cargandoPronosticos, setCargandoPronosticos] = useState(false);

  const cargarPronosticos = useCallback(async () => {
    setCargandoPronosticos(true);
    try {
      const res = await obtenerPronosticosPublicos(trivia.id);
      if (res.ok) {
        setPronosticos(res.pronosticos);
      }
    } catch (err) {
      console.error("Error al cargar pronósticos en vivo:", err);
    } finally {
      setCargandoPronosticos(false);
    }
  }, [trivia.id]);

  useEffect(() => {
    cargarPronosticos();
  }, [cargarPronosticos]);

  useEffect(() => {
    const temporizador = setInterval(
      () => setRestante(tiempoRestante(trivia.fecha_inicio)),
      1000
    );
    return () => clearInterval(temporizador);
  }, [trivia.fecha_inicio]);

  const cerrada = restante === 0;

  function ajustarMinuto(delta: number) {
    setMinuto((prev) => {
      const base = prev === "" ? 0 : prev;
      return Math.min(maxValor, Math.max(0, base + delta));
    });
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente || cerrada) return;
    if (!esTirosEsquina && !equipo) {
      setResultado({ ok: false, error: "Selecciona el equipo que anotará." });
      return;
    }
    if (minuto === "" || Number.isNaN(Number(minuto))) {
      setResultado({
        ok: false,
        error: esTirosEsquina
          ? "Indica la cantidad estimada de tiros de esquina."
          : "Indica el minuto estimado del gol.",
      });
      return;
    }
    if (!whatsapp || !isValidPhoneNumber(whatsapp)) {
      setResultado({ ok: false, error: "Ingresa un número de WhatsApp válido." });
      return;
    }
    const datos = new FormData(evento.currentTarget);
    datos.set("prefijo", "");
    datos.set("numero", whatsapp);
    if (esTirosEsquina) {
      datos.set("equipo", "Total Partido");
    }
    setPendiente(true);
    startTransition(() => {
      participar(datos)
        .then((res) => {
          setResultado(res);
          if (res.ok) {
            cargarPronosticos();
          }
        })
        .finally(() => setPendiente(false));
    });
  }

  if (resultado?.ok) {
    const { boleto } = resultado;

    return (
      <section className="relative w-full max-w-[550px] mx-auto rounded-3xl border-2 border-dorado-500/70 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-dorado-500/15 overflow-hidden">
        {/* Luces decorativas superiores */}
        <div className="flex justify-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-dorado-400 shadow-[0_0_8px_var(--dorado-400)] animate-ping" />
          <span className="h-2 w-2 rounded-full bg-secundario shadow-[0_0_8px_var(--secundario)]" />
          <span className="h-2 w-2 rounded-full bg-dorado-400 shadow-[0_0_8px_var(--dorado-400)]" />
        </div>

        <div className="flex items-center justify-between border-b border-dorado-500/30 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-secundario">
              ● JUGADA REGISTRADA
            </span>
            <h2 className="text-base font-black text-blanco tracking-tight mt-0.5">
              Ticket Oficial Bolicash
            </h2>
          </div>
        </div>

        <div className="mt-4 divide-y divide-zinc-800/80 bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4">
          <FilaRecibo
            etiqueta="Encuentro"
            valor={`${trivia.equipo_a} vs ${trivia.equipo_b}`}
          />
          {esTirosEsquina ? (
            <FilaRecibo
              etiqueta="Dinámica"
              valor={<span className="text-secundario font-black">🚩 Tiros de Esquina (Total Partido)</span>}
            />
          ) : (
            <FilaRecibo
              etiqueta="Equipo Elegido"
              valor={<span className="text-secundario font-black">{boleto.equipo_seleccionado}</span>}
            />
          )}
          <FilaRecibo
            etiqueta={esTirosEsquina ? "Tu Pronóstico" : "Primer Gol"}
            valor={
              <span className="font-mono text-sm font-black text-dorado-400">
                {boleto.minuto_pronosticado}
                {esTirosEsquina ? " córners en el partido" : "'"}
              </span>
            }
          />
          <FilaRecibo etiqueta="Participante" valor={boleto.nombre} />
          <FilaRecibo
            etiqueta="WhatsApp"
            valor={<span className="font-mono">{boleto.whatsapp}</span>}
          />
          <FilaRecibo
            etiqueta="Fecha y Hora"
            valor={formatearFechaHoraBolivia(boleto.registrado_en)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setModalPronosticosAbierto(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dorado-500 via-dorado-600 to-dorado-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-950 hover:brightness-110 shadow-lg shadow-dorado-500/25 transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Ver qué votaron los participantes ({pronosticos.length})</span>
            <IconoFlechaDerecha className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Si tu jugada resulta ganadora, el equipo de Bolicash te contactará por WhatsApp.
        </p>

        <ModalPronosticosEnVivo
          abierto={modalPronosticosAbierto}
          onCerrar={() => setModalPronosticosAbierto(false)}
          trivia={trivia}
          pronosticos={pronosticos}
          cargando={cargandoPronosticos}
          onRecargar={cargarPronosticos}
        />
      </section>
    );
  }

  return (
    <div className="relative w-full max-w-[550px] mx-auto pt-7">
      {/* ========================================================= */}
      {/* ARQUITECTURA CASINO JACKPOT - CORONA ARQUEADA SUPERIOR     */}
      {/* ========================================================= */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        {/* Arco dorado limpio */}
        <div className="relative flex items-center justify-center px-8 sm:px-12 py-1.5 rounded-t-2xl border-t-2 border-x-2 border-dorado-400 bg-gradient-to-b from-dorado-500 via-dorado-600 to-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.45)]">
          <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-blanco drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-dorado-400">★</span> 1XBET BOLI~CASH <span className="text-dorado-400">★</span>
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PALANCA TRAGAMONEDAS (SLOT LEVER) EN LATERAL DERECHO      */}
      {/* ========================================================= */}
      <div
        className="hidden sm:flex flex-col items-start absolute left-full top-48 z-10 select-none pointer-events-none"
        aria-hidden="true"
      >
        {/* Conjunto vertical: bola roja y eje metálico */}
        <div className="flex flex-col items-center ml-4 -mb-0.5">
          {/* Bola roja / rubí con borde definido y brillo profundo */}
          <div className="h-8 w-8 rounded-full bg-radial from-rojo-600 via-rojo-700 to-zinc-950 border-2 border-zinc-950 shadow-[0_0_16px_rgba(220,38,38,0.85)]" />
          {/* Eje metálico plateado con relieve */}
          <div className="w-2.5 h-20 bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 rounded-t-xs shadow-md border-x border-zinc-500/40" />
        </div>

        {/* Base horizontal ancha montada en el chasis de la máquina */}
        <div className="w-12 h-5 rounded-r-lg bg-gradient-to-b from-dorado-500 via-dorado-600 to-dorado-800 border-y-2 border-r-2 border-dorado-400 shadow-md -ml-0.5" />
      </div>

      {/* ========================================================= */}
      {/* CHASIS PRINCIPAL DE LA MÁQUINA TRAGAMONEDAS               */}
      {/* ========================================================= */}
      <section className="relative w-full rounded-3xl border-2 border-dorado-500/80 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl shadow-dorado-500/20 overflow-hidden">
        {/* Reflejo diagonal de cristal frontal (Glass Sheen Effect) */}
        <div
          className="pointer-events-none absolute -inset-x-20 top-0 h-48 -rotate-12 bg-gradient-to-b from-blanco/10 via-blanco/[0.02] to-transparent z-10"
          aria-hidden="true"
        />

        {/* ========================================================= */}
        {/* CABECERA MARQUESINA JACKPOT CON MARCO DORADO Y BOMBILLAS  */}
        {/* ========================================================= */}
        <header className="relative bg-zinc-950 p-4 sm:p-5 border-b-2 border-dorado-500/40">
          {/* Anillo de bombillas del marco de la marquesina */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-dorado-400">
              <span className="h-2 w-2 rounded-full bg-dorado-400 shadow-[0_0_6px_var(--dorado-400)] animate-pulse" />
              {esTirosEsquina ? "🚩 Tiros de Esquina" : "⚽ Primer Gol y minuto"}
            </span>

            <span
              suppressHydrationWarning
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                cerrada
                  ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                  : "bg-secundario/15 text-secundario border-secundario/40 shadow-[0_0_8px_rgba(12,172,7,0.3)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cerrada ? "bg-zinc-500" : "bg-secundario animate-pulse"}`} />
              {cerrada ? "Cerrado" : "Abierto"}
            </span>
          </div>

          {/* ========================================================= */}
          {/* PANTALLA DIGITAL ARCADE DEL TEMPORIZADOR CON RESPLANDOR   */}
          {/* ========================================================= */}
          <div className="mt-4 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[320px] rounded-2xl bg-zinc-950 border border-dorado-500/40 px-4 py-2.5 text-center shadow-[0_0_25px_rgba(245,158,11,0.25)] overflow-hidden">
              {/* Resplandor dorado de fondo detrás de los dígitos */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-dorado-500/25 to-transparent blur-md"
                aria-hidden="true"
              />
              <span className="relative z-10 block text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                {cerrada ? "ESTADO DE PARTICIPACIÓN" : "CUENTA REGRESIVA"}
              </span>
              <p
                suppressHydrationWarning
                className="relative z-10 mt-0.5 font-mono text-xl sm:text-2xl font-black tabular-nums text-dorado-400 tracking-wider drop-shadow-[0_0_14px_rgba(245,158,11,0.9)] whitespace-nowrap"
              >
                {cerrada ? "00:00:00" : formatearTiempo(restante)}
              </p>
              <span className="relative z-10 mt-1 block font-mono text-[10px] text-zinc-400">
                ⏱ Cierre: <strong className="text-zinc-300 font-bold">{formatearFechaHoraBolivia(trivia.fecha_inicio)}</strong>
              </span>
            </div>
          </div>

          {/* Banner de Premio con brillo dorado */}
          <div className="mt-3.5 flex items-center justify-center">
            <div className="px-6 py-2 rounded-xl bg-gradient-to-r from-dorado-600 via-dorado-500 to-dorado-600 text-zinc-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.6)] border border-dorado-400">
              🏆 PREMIO: {trivia.premio_monto ?? 100} Bs
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* CUERPO DEL FORMULARIO / CONSOLA TRAGAMONEDAS              */}
        {/* ========================================================= */}
        {cerrada ? (
          <div className="p-6 text-center flex flex-col gap-4">
            {/* Enfrentamiento de referencia en estado cerrado */}
            <div className="relative grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 font-mono text-[10px] font-black text-zinc-400">
                  VS
                </span>
              </div>
              <div className="p-3 text-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-0.5">Local</span>
                <span className="text-xs sm:text-sm font-black uppercase text-zinc-300 line-clamp-1">{trivia.equipo_a}</span>
              </div>
              <div className="p-3 text-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-0.5">Visitante</span>
                <span className="text-xs sm:text-sm font-black uppercase text-zinc-300 line-clamp-1">{trivia.equipo_b}</span>
              </div>
            </div>

            <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs font-semibold text-zinc-300">
              El tiempo para participar en esta dinámica ha finalizado.
            </p>

            <div className="w-full">
              <IndicadorActivos
                total={pronosticos.length}
                cargando={cargandoPronosticos}
                onClick={() => setModalPronosticosAbierto(true)}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={enviar} className="p-4 sm:p-5 flex flex-col gap-4">
            <input type="hidden" name="trivia_id" value={trivia.id} />
            <input type="hidden" name="equipo" value={esTirosEsquina ? "Total Partido" : equipo} />

            {/* ========================================================= */}
            {/* 1. SECCIÓN DE ENCUENTRO / EQUIPOS                         */}
            {/* ========================================================= */}
            {esTirosEsquina ? (
              <div className="rounded-2xl border-2 border-dorado-500/40 bg-zinc-950/80 p-3.5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-dorado-400/40 bg-dorado-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-dorado-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-dorado-400 animate-pulse" />
                    🚩 Córners Totales del Partido
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Ambos Equipos
                  </span>
                </div>

                {/* Showcase del Enfrentamiento sin botones de elegir */}
                <div className="relative grid grid-cols-2 gap-2 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dorado-400 bg-zinc-950 font-mono text-[10px] font-black text-dorado-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                      VS
                    </span>
                  </div>

                  <div className="p-2.5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                      Local
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase text-blanco line-clamp-2">
                      {trivia.equipo_a}
                    </span>
                  </div>

                  <div className="p-2.5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                      Visitante
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase text-blanco line-clamp-2">
                      {trivia.equipo_b}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-center text-[11px] font-medium text-zinc-300">
                  ⚽ No tienes que elegir equipo. Pronostica la <strong className="text-dorado-400 font-bold">cantidad total</strong> de tiros de esquina de todo el partido.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Toca un equipo para seleccionarlo
                  </span>
                </div>

                {/* Contenedor dividido en 2 compartimentos (Local vs Visitante) */}
                <div className="relative grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border-2 border-zinc-800 shadow-inner">
                  {/* Medallón central VS flotante */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dorado-400 bg-zinc-950 font-mono text-xs font-black text-dorado-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                      VS
                    </span>
                  </div>

                  {/* Compartimento Izquierdo: EQUIPO LOCAL */}
                  <button
                    type="button"
                    onClick={() => setEquipo(trivia.equipo_a)}
                    className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 text-center cursor-pointer ${
                      equipo === trivia.equipo_a
                        ? "bg-gradient-to-b from-secundario/25 via-secundario/15 to-zinc-950 border-2 border-secundario shadow-[0_0_16px_rgba(12,172,7,0.45)] ring-1 ring-secundario"
                        : "bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      Local
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-blanco line-clamp-2">
                      {trivia.equipo_a}
                    </span>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
                        equipo === trivia.equipo_a
                          ? "bg-secundario text-blanco shadow-sm"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {equipo === trivia.equipo_a ? "✓ Elegido" : "Elegir"}
                    </span>
                  </button>

                  {/* Compartimento Derecho: EQUIPO VISITANTE */}
                  <button
                    type="button"
                    onClick={() => setEquipo(trivia.equipo_b)}
                    className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 text-center cursor-pointer ${
                      equipo === trivia.equipo_b
                        ? "bg-gradient-to-b from-secundario/25 via-secundario/15 to-zinc-950 border-2 border-secundario shadow-[0_0_16px_rgba(12,172,7,0.45)] ring-1 ring-secundario"
                        : "bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      Visitante
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-blanco line-clamp-2">
                      {trivia.equipo_b}
                    </span>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
                        equipo === trivia.equipo_b
                          ? "bg-secundario text-blanco shadow-sm"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {equipo === trivia.equipo_b ? "✓ Elegido" : "Elegir"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. CONTROL DEL CONTADOR / SLOT REEL STEPPER               */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="minuto" className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  {esTirosEsquina ? "Total tiros de esquina del partido" : "Minuto exacto del gol"}
                </label>
                <span className="font-mono text-xs font-black text-dorado-400">
                  {esTirosEsquina
                    ? `${minuto === "" ? "—" : minuto} CÓRNERS EN TOTAL`
                    : `${minuto === "" ? "—" : `${minuto}'`} MINUTO`}
                </span>
              </div>

              {/* Display de rodillo digital con botones arcade de ajuste */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => ajustarMinuto(-1)}
                  className="flex h-11 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-lg font-black text-blanco hover:bg-zinc-700 active:scale-95 transition-all shadow-md"
                  aria-label="Restar"
                >
                  –
                </button>

                <div className="relative flex-1">
                  <input
                    id="minuto"
                    name="minuto"
                    type="number"
                    required
                    min={0}
                    max={maxValor}
                    inputMode="numeric"
                    placeholder="0"
                    value={minuto}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setMinuto("");
                        return;
                      }
                      const v = parseInt(val, 10);
                      if (!Number.isNaN(v)) {
                        setMinuto(Math.min(maxValor, Math.max(0, v)));
                      }
                    }}
                    className="w-full text-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-lg font-black text-blanco outline-none focus:border-dorado-400 focus:ring-1 focus:ring-dorado-400 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 font-mono text-[9px] font-black text-zinc-500 uppercase">
                    {esTirosEsquina ? "CÓRNERS" : "MIN"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => ajustarMinuto(1)}
                  className="flex h-11 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-lg font-black text-blanco hover:bg-zinc-700 active:scale-95 transition-all shadow-md"
                  aria-label="Sumar"
                >
                  +
                </button>
              </div>

              {/* Fichas rápidas estilo monedas de casino */}
              <div className="mt-2.5 flex items-center justify-between gap-1.5">
                {chips.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMinuto(val)}
                    className={`flex-1 rounded-lg border py-1.5 font-mono text-xs font-black transition-all ${
                      minuto === val
                        ? "border-dorado-400 bg-dorado-500 text-zinc-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-blanco"
                    }`}
                  >
                    {val}{esTirosEsquina ? "c" : "'"}
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. INPUT: NOMBRE COMPLETO                                 */}
            {/* ========================================================= */}
            <div>
              <label htmlFor="nombre" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Tu Nombre Completo
              </label>
              <div className="relative flex items-center">
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Ej: Marcelo Martins"
                  className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-3 text-sm text-blanco placeholder:text-zinc-500 outline-none focus:border-dorado-400 focus:ring-1 focus:ring-dorado-400 transition-colors shadow-inner"
                />
                <span className="pointer-events-none absolute right-3.5 text-zinc-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. INPUT: WHATSAPP CON SELECTOR DE PAÍSES                 */}
            {/* ========================================================= */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
                WhatsApp para cobrar tu premio
              </label>
              <div className="relative flex items-center rounded-xl border border-zinc-700/80 bg-zinc-900/90 shadow-inner focus-within:border-dorado-400 focus-within:ring-1 focus-within:ring-dorado-400">
                <PhoneInput
                  international={false}
                  defaultCountry="BO"
                  labels={es}
                  value={whatsapp}
                  onChange={(val) => setWhatsapp(val ?? "")}
                  countrySelectComponent={SelectorPais}
                  numberInputProps={{
                    id: "numero",
                    name: "numero",
                    inputMode: "tel",
                    placeholder: "70012345",
                    className:
                      "flex-1 bg-transparent px-3.5 py-3 font-mono text-sm text-blanco placeholder:text-zinc-500 outline-none rounded-r-xl",
                  }}
                  className="w-full relative flex items-center text-blanco"
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* SEPARADOR VISUAL (LEY DE AGRUPACIÓN DE LA GESTALT)        */}
            {/* ========================================================= */}
            <div className="py-2" aria-hidden="true">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/80 to-transparent" />
            </div>

            {/* ========================================================= */}
            {/* 5. REQUISITO DE RECARGA: TICKET VIP DE ACCESO             */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-dorado-500/30 bg-zinc-900/70 p-3.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-dorado-400/40 bg-dorado-500/10 text-dorado-400 shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blanco">
                      Pase de Recarga
                    </span>
                    <span className="rounded-full border border-dorado-400/50 bg-dorado-500/20 px-2 py-0.2 font-mono text-[9px] font-black uppercase text-dorado-400">
                      Obligatorio
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-300 leading-relaxed">
                    Para cobrar tu premio en caso de acertar, debes haber realizado una recarga en{" "}
                    <strong className="font-black text-blanco">Bolicash</strong> hoy antes del inicio del partido.
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5">
                    <span className="text-[10px] font-medium text-zinc-400">
                      ¿Aún no recargaste hoy?
                    </span>
                    <a
                      href="https://wa.me/59175340019?text=Hola%20BoliCash,%20quiero%20hacer%20una%20recarga%20para%20participar%20en%20la%20dinamica"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-secundario px-2.5 py-1 text-[11px] font-black uppercase text-blanco hover:opacity-90 shadow-sm transition-opacity"
                    >
                      <span>Recargar por WhatsApp</span>
                      <IconoFlechaDerecha className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {resultado?.ok === false && (
              <p
                role="alert"
                className="rounded-xl border border-rojo-600/40 bg-rojo-600/15 p-3 text-center text-xs font-bold text-blanco shadow-sm"
              >
                {resultado.error}
              </p>
            )}

            {/* ========================================================= */}
            {/* 6. REVISAR PRONÓSTICOS EN VIVO ANTES DE VOTAR             */}
            {/* ========================================================= */}
            <div className="w-full pt-1">
              <IndicadorActivos
                total={pronosticos.length}
                cargando={cargandoPronosticos}
                onClick={() => setModalPronosticosAbierto(true)}
              />
            </div>

            {/* ========================================================= */}
            {/* 7. BOTÓN ARCADE 3D DE CONFIRMACIÓN: "CONFIRMAR JUGADA"    */}
            {/* ========================================================= */}
            <div className="mt-2 relative group">
              {/* Marco exterior con halo dorado brillante */}
              <div className="relative p-1 rounded-full bg-gradient-to-r from-dorado-400 via-dorado-500 to-dorado-400 shadow-[0_0_30px_rgba(245,158,11,0.7)] border border-dorado-300">
                <button
                  type="submit"
                  disabled={pendiente}
                  className="relative w-full rounded-full bg-gradient-to-b from-rojo-700 via-zinc-950 to-rojo-800 py-3.5 px-6 text-sm font-black uppercase tracking-widest text-blanco shadow-xl hover:brightness-110 active:translate-y-0.5 active:shadow-inner disabled:opacity-50 transition-all cursor-pointer overflow-hidden whitespace-nowrap"
                >
                  {/* Reflejo de brillo superior en el botón */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-blanco/35 to-transparent rounded-t-full"
                    aria-hidden="true"
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {pendiente ? "REGISTRANDO JUGADA..." : "CONFIRMAR JUGADA"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        <ModalPronosticosEnVivo
          abierto={modalPronosticosAbierto}
          onCerrar={() => setModalPronosticosAbierto(false)}
          trivia={trivia}
          pronosticos={pronosticos}
          cargando={cargandoPronosticos}
          onRecargar={cargarPronosticos}
        />
      </section>
    </div>
  );
}