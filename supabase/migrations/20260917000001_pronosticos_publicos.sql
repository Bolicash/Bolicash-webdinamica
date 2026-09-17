-- ==============================================================================
-- MIGRACIÓN: Función pública para listar pronósticos en vivo (Segura y Privada)
-- ==============================================================================
-- Permite a los usuarios de la web pública ver los nombres, equipos y pronósticos
-- de las personas que participan en una dinámica, SIN exponer jamás sus números
-- de teléfono/WhatsApp ni identificadores internos.

create or replace function public.listar_pronosticos_publicos(
  p_trivia_id uuid
)
returns json
language plpgsql
security definer
as $$
begin
  -- Solo permitir consulta de dinámicas publicadas
  if not exists (select 1 from public.trivias where id = p_trivia_id and publicada = true) then
    return '[]'::json;
  end if;

  return coalesce(
    (select json_agg(r)
     from (
       select c.nombre,
              p.equipo_seleccionado,
              p.minuto_pronosticado,
              p.registrado_en
       from public.participaciones p
       join public.contactos c on c.id = p.contacto_id
       where p.trivia_id = p_trivia_id
       order by p.registrado_en desc
       limit 500
     ) r),
    '[]'::json
  );
end;
$$;

grant execute on function public.listar_pronosticos_publicos to anon, authenticated;
