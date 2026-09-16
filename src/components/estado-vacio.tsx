export default function EstadoVacio() {
  return (
    <section className="w-full max-w-md mx-auto rounded-card border border-borde bg-superficie shadow-md shadow-zinc-950/5 overflow-hidden">
      {/* Cabecera deportiva con toque esmeralda */}
      <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-5 pt-6 pb-6 text-center border-b border-zinc-800">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-zinc-800/80 text-zinc-300 border border-zinc-700">
          Sin dinámica activa
        </span>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="h-0.5 bg-zinc-800 rounded-full" />
          <span className="rounded-boton border border-secundario/50 bg-secundario/20 px-3 py-1 font-mono text-sm font-black text-secundario shadow-xs">
            VS
          </span>
          <div className="h-0.5 bg-zinc-800 rounded-full" />
        </div>
        <p className="mt-4 font-mono text-3xl font-black tracking-wider text-zinc-600">
          00:00:00
        </p>
        <p className="mt-1.5 text-xs font-semibold text-secundario flex items-center justify-center gap-1">
          <span>⚽</span>
          <span>Próxima dinámica en breve</span>
        </p>
      </div>

      {/* Cuerpo */}
      <div className="p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secundario/10 text-secundario border border-secundario/20 mb-3">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-current stroke-2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-texto tracking-tight">
          Próxima dinámica en preparación
        </h2>
        <p className="mt-1.5 text-xs text-texto-suave leading-relaxed">
          Las dinámicas se activan antes de cada partido. Mantente atento a
          nuestros grupos oficiales para participar y ganar.
        </p>
      </div>
    </section>
  );
}