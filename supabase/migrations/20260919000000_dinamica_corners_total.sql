-- ==============================================================================
-- MIGRACIÓN: Soporte nativo para dinámica de tiros de esquina (Total Partido)
-- ==============================================================================
-- Permite que las dinámicas de tiros de esquina registren y calculen ganadores
-- sobre la cantidad total de córners del partido, sin requerir selección de equipo.

-- 1. Actualizar RPC: registrar_participacion
create or replace function public.registrar_participacion(
  p_trivia_id           uuid,
  p_nombre              text,
  p_whatsapp            text,
  p_equipo_seleccionado text,
  p_minuto_pronosticado integer
) returns json
language plpgsql
security definer
as $$
declare
  v_trivia         public.trivias%rowtype;
  v_contacto_id    uuid;
  v_participacion  uuid;
  v_registrado_en  timestamptz;
  v_equipo_final   text;
begin
  select * into v_trivia from public.trivias where id = p_trivia_id;

  if not found then
    raise exception 'TRIVIA_NO_ENCONTRADA';
  end if;

  if not v_trivia.publicada then
    raise exception 'TRIVIA_NO_PUBLICADA';
  end if;

  if now() >= v_trivia.fecha_inicio then
    raise exception 'FORMULARIO_CERRADO';
  end if;

  -- En dinámicas de córners, no se elige equipo individual; es el total del encuentro
  if v_trivia.tipo_plantilla in ('tiros_esquina', 'minuto_gol_equipo') then
    v_equipo_final := 'Total Partido';
  else
    if p_equipo_seleccionado not in (v_trivia.equipo_a, v_trivia.equipo_b) then
      raise exception 'EQUIPO_INVALIDO';
    end if;
    v_equipo_final := p_equipo_seleccionado;
  end if;

  insert into public.contactos (nombre, whatsapp)
  values (p_nombre, p_whatsapp)
  on conflict (whatsapp)
  do update set nombre = excluded.nombre
  returning id into v_contacto_id;

  if v_contacto_id is null then
    select id into v_contacto_id from public.contactos where whatsapp = p_whatsapp;
  end if;

  begin
    insert into public.participaciones (trivia_id, contacto_id, equipo_seleccionado, minuto_pronosticado)
    values (p_trivia_id, v_contacto_id, v_equipo_final, p_minuto_pronosticado)
    returning id, registrado_en into v_participacion, v_registrado_en;
  exception
    when unique_violation then
      raise exception 'YA_PARTICIPASTE';
  end;

  return json_build_object(
    'id', v_participacion,
    'trivia_id', p_trivia_id,
    'nombre', p_nombre,
    'whatsapp', p_whatsapp,
    'equipo_seleccionado', v_equipo_final,
    'minuto_pronosticado', p_minuto_pronosticado,
    'registrado_en', v_registrado_en
  );
end;
$$;

grant execute on function public.registrar_participacion to anon, authenticated;

-- 2. Actualizar RPC: buscar_ganadores_admin
create or replace function public.buscar_ganadores_admin(
  p_trivia_id uuid,
  p_equipo    text,
  p_minuto    integer
) returns json
language plpgsql
security definer
as $$
declare
  v_plantilla text;
begin
  select tipo_plantilla into v_plantilla from public.trivias where id = p_trivia_id;

  if v_plantilla in ('tiros_esquina', 'minuto_gol_equipo') then
    return coalesce(
      (select json_agg(r)
       from (
         select c.nombre,
                c.whatsapp,
                p.equipo_seleccionado,
                p.minuto_pronosticado,
                p.registrado_en
         from public.participaciones p
         join public.contactos c on c.id = p.contacto_id
         where p.trivia_id = p_trivia_id
           and p.minuto_pronosticado = p_minuto
         order by p.registrado_en asc
       ) r),
      '[]'::json
    );
  else
    return coalesce(
      (select json_agg(r)
       from (
         select c.nombre,
                c.whatsapp,
                p.equipo_seleccionado,
                p.minuto_pronosticado,
                p.registrado_en
         from public.participaciones p
         join public.contactos c on c.id = p.contacto_id
         where p.trivia_id = p_trivia_id
           and p.equipo_seleccionado = p_equipo
           and p.minuto_pronosticado = p_minuto
         order by p.registrado_en asc
       ) r),
      '[]'::json
    );
  end if;
end;
$$;

grant execute on function public.buscar_ganadores_admin to authenticated, anon;
