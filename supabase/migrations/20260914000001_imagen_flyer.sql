-- ============================================================
-- BOLICASH - Migracion: imagen_url en trivias + bucket flyers
-- ============================================================

-- 1. Nueva columna (opcional, nullable)
alter table public.trivias
  add column if not exists imagen_url text;

-- 2. Actualizar RPC crear_trivia_admin para aceptar imagen_url
create or replace function public.crear_trivia_admin(
  p_equipo_a       text,
  p_equipo_b       text,
  p_tipo_plantilla text,
  p_fecha_inicio   timestamptz,
  p_publicada      boolean,
  p_estado         text,
  p_imagen_url     text default null
) returns uuid
language plpgsql
security definer
as $func$
declare
  v_id uuid;
begin
  if p_estado not in ('borrador', 'activa', 'finalizada') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  if p_tipo_plantilla not in ('primer_gol_minuto', 'minuto_gol_equipo') then
    raise exception 'PLANTILLA_INVALIDA';
  end if;

  insert into public.trivias (equipo_a, equipo_b, tipo_plantilla, fecha_inicio, publicada, estado, imagen_url)
  values (p_equipo_a, p_equipo_b, p_tipo_plantilla, p_fecha_inicio, p_publicada, p_estado, p_imagen_url)
  returning id into v_id;

  return v_id;
end;
$func$;

-- 3. Storage bucket flyers (publico, solo imagenes, max 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flyers',
  'flyers',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- 4. Policies de Storage
create policy "flyers_lectura_publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'flyers');

create policy "flyers_subida_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'flyers');

create policy "flyers_eliminar_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'flyers');
