-- ============================================================
-- BOLICASH - Migración: Quitar imágenes/flyers y bucket
-- ============================================================

-- 1. Eliminar la columna imagen_url de la tabla trivias
alter table public.trivias
  drop column if exists imagen_url;

-- 2. Actualizar función crear_trivia_admin sin imagen_url
create or replace function public.crear_trivia_admin(
  p_equipo_a       text,
  p_equipo_b       text,
  p_tipo_plantilla text,
  p_fecha_inicio   timestamptz,
  p_publicada      boolean,
  p_estado         text
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

  insert into public.trivias (equipo_a, equipo_b, tipo_plantilla, fecha_inicio, publicada, estado)
  values (p_equipo_a, p_equipo_b, p_tipo_plantilla, p_fecha_inicio, p_publicada, p_estado)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.crear_trivia_admin to authenticated;

-- 3. Actualizar función actualizar_trivia_admin sin imagen_url
create or replace function public.actualizar_trivia_admin(
  p_id             uuid,
  p_equipo_a       text,
  p_equipo_b       text,
  p_tipo_plantilla text,
  p_fecha_inicio   timestamptz,
  p_publicada      boolean,
  p_estado         text
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
      estado = p_estado
  where id = p_id;
end;
$$;

grant execute on function public.actualizar_trivia_admin to authenticated, anon;

-- 4. Política de actualización directa
drop policy if exists "trivias_actualizacion_admin" on public.trivias;
create policy "trivias_actualizacion_admin" on public.trivias
  for update to authenticated, anon
  using (true)
  with check (true);

-- 5. Eliminar policies y bucket flyers de storage
drop policy if exists "flyers_lectura_publica" on storage.objects;
drop policy if exists "flyers_subida_admin" on storage.objects;
drop policy if exists "flyers_eliminar_admin" on storage.objects;
delete from storage.objects where bucket_id = 'flyers';
delete from storage.buckets where id = 'flyers';
