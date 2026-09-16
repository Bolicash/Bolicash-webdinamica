export default function AdminLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 animate-pulse">
      {/* Barra superior de carga con brillo */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primario/20 overflow-hidden">
        <div className="h-full w-1/3 bg-primario animate-[shimmer_1.2s_infinite_linear] rounded-full" />
      </div>

      {/* Esqueleto de Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde pb-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-36 rounded-boton bg-primario-claro" />
            <div className="h-5 w-8 rounded-boton bg-primario-claro" />
          </div>
          <div className="h-4 w-64 rounded-boton bg-primario-claro/60" />
        </div>
        <div className="h-9 w-32 rounded-boton bg-primario-claro" />
      </div>

      {/* Esqueleto de Contenido / Tabla */}
      <div className="rounded-card border border-borde bg-superficie p-6">
        <div className="flex flex-col gap-4">
          <div className="h-5 w-48 rounded bg-primario-claro" />
          <div className="h-10 w-full rounded bg-primario-claro/40" />
          <div className="h-14 w-full rounded bg-primario-claro/30" />
          <div className="h-14 w-full rounded bg-primario-claro/30" />
          <div className="h-14 w-full rounded bg-primario-claro/30" />
        </div>
      </div>
    </div>
  );
}
