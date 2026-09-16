-- ============================================================
-- BOLICASH - Migracion: actualizar_trivia_admin
-- Permite modificar equipos, fecha/hora de cierre, flyer,
-- visibilidad y estado de una dinámica existente.
-- ============================================================

create or replace function public.actualizar_trivia_admin(
  p_id             uuid,
  p_equipo_a       text,
  p_equipo_b       text,
  p_tipo_plantilla text,
  p_fecha_inicio   timestamptz,
  p_publicada      boolean,
  p_estado         text,
  p_imagen_url     text default null
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
      imagen_url = p_imagen_url
  where id = p_id;
end;
$$;

grant execute on function public.actualizar_trivia_admin to authenticated, anon;

-- Política de actualización directa para permitir updates seguros
drop policy if exists "trivias_actualizacion_admin" on public.trivias;
create policy "trivias_actualizacion_admin" on public.trivias
  for update to authenticated, anon
  using (true)
  with check (true);
