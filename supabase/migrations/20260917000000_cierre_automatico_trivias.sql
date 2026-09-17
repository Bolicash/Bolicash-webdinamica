-- ==============================================================================
-- MIGRACIÓN: Cierre y despublicación automática de trivias vencidas
-- ==============================================================================
-- Actualiza la función listar_trivias_admin para que cualquier dinámica cuya
-- fecha límite de juego haya expirado pase automáticamente a 'publicada = false'
-- en la base de datos (oculta en web), manteniendo su fecha_inicio intacta.

create or replace function public.listar_trivias_admin()
returns json
language plpgsql
security definer
as $$
begin
  -- Despublicar automáticamente dinámicas cuya fecha límite ya venció
  update public.trivias
  set publicada = false
  where fecha_inicio <= now()
    and publicada = true;

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

grant execute on function public.listar_trivias_admin to authenticated, anon;
