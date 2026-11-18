-- ═══════════════════════════════════════════════════════════════════════════
-- 🛡 HORARIOS · TP-15 B — LA REGLA DEL SERVIDOR SOBRE `horarioTop` (borrador para E2)
--
-- ⛔ PROHIBIDO INSTALARLA EN PRODUCCIÓN (decisión de Josué del 2026-11-18): la sustituyó el apartado de versiones
--    antiguas (P4, H-23, C-88), que no puede convivir con ella. Se conserva solo como historia y para su prueba de E1.
-- ⛔ NO EJECUTAR EN SUPABASE. Era la pieza de la entrega E2 (D4).
--    En E1 solo se ha probado en un Postgres + PostgREST LOCALES y desechables (127.0.0.1), con
--    `scripts/test-escritor-horario-postgrest.mjs`. Para quitarla: `horarios-regla-revision-deshacer.sql`.
--
-- Qué hace: una escritura de `horarioTop` desde la aplicación (roles `authenticated` y `anon`) solo pasa si
-- no pisa el testigo de otro aparato. El cliente de E1 ya escribe con la condición
-- `value->testigo->>revision = base`, pero una copia ANTIGUA de la app (sin E1) escribe con un upsert ciego.
-- Esta regla es la que la para en el servidor:
--   · INSERT de la primera fila: pasa (si ya existe, el 23505 de la clave primaria lo para).
--   · UPDATE (también el de un upsert `on conflict do update`):
--       - sin testigo antes y sin testigo después: pasa (arranque, cuenta todavía sin testigo);
--       - con un testigo nuevo cuya `base` es la revisión que había: pasa;
--       - si quita el testigo, repite la revisión o su `base` no es la revisión que había: se rechaza.
--   · DELETE desde la aplicación: se rechaza (la app nunca borra la fila del horario).
--   La comparación es la del cliente (D3): el TEXTO de `value->testigo->>revision`.
-- El rechazo es `P0001` con el mensaje `horario_revision_obsoleta` (`RECHAZO_DE_LA_REGLA` en
-- `src/lib/escritorHorario.js`): el escritor de E1 lo trata como un choque y relee; nunca fuerza nada.
-- Lo que hace el propietario de la tabla (el borrado en cascada al borrar la cuenta, el editor SQL) no pasa por
-- la regla: así no bloquea el borrado de una cuenta ni el mantenimiento.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.horario_regla_revision() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rev_antes text;
  rev_nueva text;
  base_nueva text;
begin
  if current_user not in ('authenticated', 'anon') then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if old.key = 'horarioTop' then
      raise exception using errcode = 'P0001', message = 'horario_revision_obsoleta',
        detail = 'La aplicación no borra la fila del horario.';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and new.key = 'horarioTop' then
    rev_antes := old.value -> 'testigo' ->> 'revision';
    rev_nueva := new.value -> 'testigo' ->> 'revision';
    base_nueva := new.value -> 'testigo' ->> 'base';
    if rev_antes is null and rev_nueva is null then
      return new;
    end if;
    if rev_nueva is null or rev_nueva = rev_antes or base_nueva is distinct from rev_antes then
      raise exception using errcode = 'P0001', message = 'horario_revision_obsoleta',
        detail = 'El horario cambió en otro aparato: esta escritura no parte de la revisión que hay.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists horario_regla_revision on public.app_data;
create trigger horario_regla_revision
  before insert or update or delete on public.app_data
  for each row execute function public.horario_regla_revision();

-- Comprobación (solo lectura): debe devolver una fila con el disparador activo ('O').
-- select tgname, tgenabled from pg_trigger where tgname = 'horario_regla_revision';
