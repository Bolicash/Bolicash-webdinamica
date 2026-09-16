-- ============================================================
-- BOLICASH - MIGRACIÓN: PREMIO_MONTO Y GANADORES
-- ============================================================

-- 1. Agregar columna premio_monto a la tabla trivias si no existe
alter table public.trivias
  add column if not exists premio_monto integer not null default 100;

-- 2. Eliminar funciones anteriores para evitar conflicto de sobrecarga
drop function if exists public.crear_trivia_admin(text, text, text, timestamptz, boolean, text);
drop function if exists public.actualizar_trivia_admin(uuid, text, text, text, timestamptz, boolean, text);

-- 3. Crear función crear_trivia_admin con premio_monto
create or replace function public.crear_trivia_admin(
  p_equipo_a       text,
  p_equipo_b       text,
  p_tipo_plantilla text,
  p_fecha_inicio   timestamptz,
  p_publicada      boolean,
  p_estado         text,
  p_premio_monto   integer default 100
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  if p_estado not in ('borrador', 'activa', 'finalizada') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  if p_tipo_plantilla not in ('primer_gol_minuto', 'minuto_gol_equipo') then
    raise exception 'PLANTILLA_INVALIDA';
  end if;

  insert into public.trivias (equipo_a, equipo_b, tipo_plantilla, fecha_inicio, publicada, estado, premio_monto)
  values (p_equipo_a, p_equipo_b, p_tipo_plantilla, p_fecha_inicio, p_publicada, p_estado, coalesce(p_premio_monto, 100))
  returning id into v_id;

  return v_id;
end;
$$;

-- 4. Crear función actualizar_trivia_admin con premio_monto
create or replace function public.actualizar_trivia_admin(
  p_id             uuid,
  p_equipo_a       text,
  p_equipo_b       text,
  p_tipo_plantilla text,
  p_fecha_inicio   timestamptz,
  p_publicada      boolean,
  p_estado         text,
  p_premio_monto   integer default 100
) returns void
language plpgsql
security definer
as $$
begin
  if p_estado not in ('borrador', 'activa', 'finalizada') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  if p_tipo_plantilla not in ('primer_gol_minuto', 'minuto_gol_equipo') then
    raise exception 'PLANTILLA_INVALIDA';
  end if;

  update public.trivias
  set equipo_a = p_equipo_a,
      equipo_b = p_equipo_b,
      tipo_plantilla = p_tipo_plantilla,
      fecha_inicio = p_fecha_inicio,
      publicada = p_publicada,
      estado = p_estado,
      premio_monto = coalesce(p_premio_monto, premio_monto, 100)
  where id = p_id;
end;
$$;

grant execute on function public.crear_trivia_admin(text, text, text, timestamptz, boolean, text, integer) to authenticated, anon;
grant execute on function public.actualizar_trivia_admin(uuid, text, text, text, timestamptz, boolean, text, integer) to authenticated, anon;
