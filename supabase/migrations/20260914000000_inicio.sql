-- ============================================================
-- BOLICASH - Migracion inicial
-- Tablas: contactos, trivias, participaciones
-- RLS + RPC publicos (anon) + RPC admin (authenticated)
-- ============================================================

-- ---------- TABLAS ----------

create table public.contactos (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  whatsapp  text not null unique,
  creado_en timestamptz not null default now()
);

create table public.trivias (
  id                  uuid primary key default gen_random_uuid(),
  equipo_a            text not null,
  equipo_b            text not null,
  tipo_plantilla      text not null default 'minuto_gol_equipo'
                      check (tipo_plantilla in ('primer_gol_minuto', 'minuto_gol_equipo')),
  fecha_inicio        timestamptz not null,
  publicada           boolean not null default false,
  estado              text not null default 'borrador'
                      check (estado in ('borrador', 'activa', 'finalizada')),
  equipo_ganador_real text,
  minuto_ganador_real integer,
  creado_en           timestamptz not null default now()
);

create table public.participaciones (
  id                  uuid primary key default gen_random_uuid(),
  trivia_id           uuid not null references public.trivias(id) on delete cascade,
  contacto_id         uuid not null references public.contactos(id) on delete cascade,
  equipo_seleccionado text not null,
  minuto_pronosticado integer not null check (minuto_pronosticado between 0 and 120),
  registrado_en       timestamptz not null default now(),
  unique (trivia_id, contacto_id)
);

create index participaciones_trivia_id_idx
  on public.participaciones (trivia_id);
create index participaciones_ganadores_idx
  on public.participaciones (trivia_id, equipo_seleccionado, minuto_pronosticado, registrado_en);

-- ---------- RLS ----------

alter table public.contactos enable row level security;
alter table public.trivias enable row level security;
alter table public.participaciones enable row level security;

-- El publico solo puede leer trivias publicadas.
create policy "trivias_lectura_publica" on public.trivias
  for select to anon, authenticated
  using (publicada = true);

-- contactos y participaciones: sin select/update/delete publicos.
-- Todo el trafico de datos pasa por los RPC de abajo.

-- ---------- RPC PUBLICO: registrar participacion ----------

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

  if p_equipo_seleccionado not in (v_trivia.equipo_a, v_trivia.equipo_b) then
    raise exception 'EQUIPO_INVALIDO';
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
    values (p_trivia_id, v_contacto_id, p_equipo_seleccionado, p_minuto_pronosticado)
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
    'equipo_seleccionado', p_equipo_seleccionado,
    'minuto_pronosticado', p_minuto_pronosticado,
    'registrado_en', v_registrado_en
  );
end;
$$;

grant execute on function public.registrar_participacion to anon, authenticated;

-- ---------- RPCs ADMIN (solo usuario autenticado) ----------

create or replace function public.listar_trivias_admin()
returns json
language plpgsql
security definer
as $$
begin
  return (select coalesce(json_agg(t order by t.fecha_inicio desc), '[]'::json)
          from (
            select tr.*,
                   (select count(*)
                    from public.participaciones p
                    where p.trivia_id = tr.id) as total_participaciones
            from public.trivias tr
          ) t);
end;
$$;

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

create or replace function public.publicar_trivia_admin(p_id uuid, p_publicada boolean)
returns void
language plpgsql
security definer
as $$
begin
  update public.trivias set publicada = p_publicada where id = p_id;
end;
$$;

create or replace function public.cambiar_estado_admin(p_id uuid, p_estado text)
returns void
language plpgsql
security definer
as $$
begin
  if p_estado not in ('borrador', 'activa', 'finalizada') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  update public.trivias set estado = p_estado where id = p_id;
end;
$$;

create or replace function public.guardar_resultado_admin(
  p_id              uuid,
  p_equipo_ganador  text,
  p_minuto_ganador  integer
) returns void
language plpgsql
security definer
as $$
begin
  update public.trivias
  set equipo_ganador_real = p_equipo_ganador,
      minuto_ganador_real = p_minuto_ganador,
      estado = 'finalizada'
  where id = p_id;
end;
$$;

create or replace function public.eliminar_trivia_admin(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.trivias where id = p_id;
end;
$$;

create or replace function public.buscar_ganadores_admin(
  p_trivia_id uuid,
  p_equipo    text,
  p_minuto    integer
) returns json
language plpgsql
security definer
as $$
begin
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
end;
$$;

create or replace function public.listar_participaciones_admin(
  p_trivia_id uuid,
  p_limite integer default 500
)
returns json
language plpgsql
security definer
as $$
begin
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
       order by p.registrado_en desc
       limit p_limite
     ) r),
    '[]'::json
  );
end;
$$;

create or replace function public.listar_contactos_admin(p_limite integer default 500)
returns json
language plpgsql
security definer
as $$
begin
  return coalesce(
    (select json_agg(r)
     from (
       select c.nombre, c.whatsapp, c.creado_en
       from public.contactos c
       order by c.creado_en desc
       limit p_limite
      ) r),
    '[]'::json
  );
end;
$$;

create or replace function public.estadisticas_admin()
returns json
language plpgsql
security definer
as $$
begin
  return json_build_object(
    'trivias',        (select count(*) from public.trivias),
    'contactos',      (select count(*) from public.contactos),
    'participaciones', (select count(*) from public.participaciones)
  );
end;
$$;

grant execute on function public.listar_trivias_admin to authenticated;
grant execute on function public.crear_trivia_admin to authenticated;
grant execute on function public.publicar_trivia_admin to authenticated;
grant execute on function public.cambiar_estado_admin to authenticated;
grant execute on function public.guardar_resultado_admin to authenticated;
grant execute on function public.eliminar_trivia_admin to authenticated;
grant execute on function public.buscar_ganadores_admin to authenticated;
grant execute on function public.listar_contactos_admin to authenticated;
grant execute on function public.listar_participaciones_admin to authenticated;
grant execute on function public.estadisticas_admin to authenticated;