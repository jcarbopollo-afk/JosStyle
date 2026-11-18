-- ═══════════════════════════════════════════════════════════════════════════
-- 🗂 HORARIOS · E1-R · R5 — APARTAR LAS ESCRITURAS DE VERSIONES ANTIGUAS (P4, decisión H-23 de Josué; docs/19 §18.19)
--
-- ⛔ NO EJECUTAR EN SUPABASE (ni de producción ni independiente). Se construye y se prueba SOLO en un Postgres +
--    PostgREST LOCALES y desechables (127.0.0.1), con `scripts/test-rescate-postgrest.mjs` y
--    `scripts/test-instalacion-horarios-postgrest.mjs`. En un entorno alojado se instala SOLO dentro de
--    `horarios-instalacion.sql` (R1 + rescate + esta regla, en una transacción y ANTES de publicar: D3, secuencia B,
--    decisión de Josué del 2026-11-18), con su autorización. Para quitarla: `horarios-versiones-antiguas-deshacer.sql`,
--    y SIEMPRE antes de volver a una versión anterior de la aplicación (con esta regla activa, lo que guarde esa versión
--    en el horario se apartaría sin aplicarse).
-- ⚠️ Necesita `horarios-protegido.sql` (R1) instalado antes: guarda en su tabla `copias_apartadas`.
--
-- Qué hace (H-23, que sustituye a la regla de rechazar de E1, TP-15 B): una escritura de `horarioTop` desde la
-- aplicación que NO pasa por las funciones protegidas —la de una versión anterior de JosStyle, que guarda con un
-- `upsert` sin condición— NO SE APLICA y NO SE RECHAZA: SE APARTA. En la misma transacción se guarda en
-- `copias_apartadas` (tipo `version_antigua`) lo que intentó escribir (`intentado`) y lo que había en ese momento
-- (`vigente`), y la fila de `app_data` se queda como estaba. La versión antigua recibe «guardado» (no reintenta ni
-- pierde nada), y la nueva lo enseña en «Cambios apartados», donde se recupera elemento a elemento sin pisar lo
-- posterior.
--   · Rechazar perdía cambios legítimos: un rechazo deshace todo, así que no puede guardar lo que intentó escribir;
--     la versión antigua lo reintentaba y al cerrarse se perdía. Apartar los conserva.
--   · Si guardar la copia falla, la escritura SE RECHAZA (`P0001`, `version_antigua_no_apartada`): nunca se descarta
--     una escritura sin dejarla a salvo (la misma idea que H-25).
--   · Una escritura que no cambia nada no se aparta (no hay nada que conservar), y una idéntica a otra ya apartada
--     (mismo `intentado` sobre el mismo `vigente`: un reintento) no se repite.
--   · Borrar la fila de `horarioTop` desde la aplicación se rechaza (`protegido_solo_por_funciones`): ninguna versión
--     de JosStyle lo hace, y no hay nada que apartar.
--   · Lo que escriben las funciones protegidas pasa (llevan su condición); lo que hace el propietario de la tabla
--     (el borrado en cascada de una cuenta, el editor SQL) también.
--   · Solo `horarioTop` (`claves_versiones_antiguas`). `estudios` (apartar) y `papelera` (fusionar) son de E1-S y
--     E1-P; hasta entonces se guardan como hoy, sin copia (D1 b: la red de rescate es también solo de `horarioTop`).
--   · Sustituye a la regla de E1 (`horarios-regla-revision.sql`, rechazar): si estaba instalada, se quita aquí.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.copias_apartadas') is null or to_regnamespace('protegido_interno') is null then
    raise exception 'Falta R1: instala antes supabase/horarios-protegido.sql';
  end if;
end;
$$;

-- H-23 sustituye a TP-15 B: la regla de E1 (rechazar) ya no hace falta y no puede convivir (rechazaría antes de apartar).
drop trigger if exists horario_regla_revision on public.app_data;
drop function if exists public.horario_regla_revision();

-- Las claves cuyas escrituras a ciegas se apartan (E1-S añadirá `estudios`).
create or replace function protegido_interno.claves_versiones_antiguas() returns text[]
language sql immutable set search_path = '' as $$ select array['horarioTop']::text[] $$;

create or replace function protegido_interno.apartar_version_antigua() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_vigente jsonb;
  v_existe boolean := false;
  v_huella text;
  v_meta jsonb;
  v_contenido jsonb;
  v_previo text;
begin
  if current_user not in ('authenticated', 'anon') then return coalesce(new, old); end if;
  if coalesce(current_setting('josstyle.protegido', true), '') = 'on' then return coalesce(new, old); end if;

  if tg_op = 'DELETE' then
    if old.key = any (protegido_interno.claves_versiones_antiguas()) then
      raise exception using errcode = 'P0001', message = 'protegido_solo_por_funciones',
        detail = 'La aplicación no borra esta fila.';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.key = any (protegido_interno.claves_versiones_antiguas())
     and new.key is distinct from old.key then
    raise exception using errcode = 'P0001', message = 'protegido_solo_por_funciones',
      detail = 'La aplicación no cambia la clave de esta fila.';
  end if;
  if not (new.key = any (protegido_interno.claves_versiones_antiguas())) then return new; end if;
  -- Una fila de otra cuenta la para la política de `app_data`, no esta regla (aquí no se lee ni se aparta nada ajeno).
  if new.user_id is distinct from auth.uid() then return new; end if;

  if tg_op = 'UPDATE' then
    v_vigente := old.value; v_existe := true;
  else
    select a.value into v_vigente from public.app_data a where a.user_id = new.user_id and a.key = new.key;
    v_existe := found;
  end if;
  if v_existe and v_vigente is not distinct from new.value then return null; end if;   -- no cambia nada

  v_huella := encode(sha256(convert_to(new.key || chr(31) || coalesce(new.value::text, 'null') || chr(31)
                                       || case when v_existe then coalesce(v_vigente::text, 'null') else '-' end, 'UTF8')), 'hex');
  if exists (select 1 from public.copias_apartadas c
             where c.user_id = new.user_id and c.tipo = 'version_antigua' and c.meta ->> 'huella' = v_huella) then
    return null;   -- ya está apartada (un reintento)
  end if;

  v_contenido := jsonb_build_object('formato', 1, 'clave', new.key, 'intentado', new.value,
                                    'vigente', case when v_existe then v_vigente else null end, 'existia', v_existe);
  v_meta := jsonb_build_object(
    'clave', new.key,
    'accion', 'escritura',
    'huella', v_huella,
    'creadaEn', now(),
    'revisionVigente', case when v_existe then v_vigente -> 'testigo' ->> 'revision' end,
    'revisionIntentada', new.value -> 'testigo' ->> 'revision',
    'baseIntentada', new.value -> 'testigo' ->> 'base',
    'navegador', protegido_interno.navegador(),
    'tamanoIntentado', octet_length(new.value::text));

  begin
    v_previo := current_setting('josstyle.protegido', true);
    perform set_config('josstyle.protegido', 'on', true);
    insert into public.copias_apartadas (user_id, id, tipo, op_id, aparato, version_app, meta, contenido, tamano)
    values (new.user_id, gen_random_uuid(), 'version_antigua', null, new.value -> 'testigo' ->> 'aparato', null,
            v_meta, v_contenido, octet_length(v_contenido::text));
    perform set_config('josstyle.protegido', coalesce(v_previo, ''), true);
  exception when others then
    raise exception using errcode = 'P0001', message = 'version_antigua_no_apartada',
      detail = 'No se pudo apartar lo que intentaba guardar, así que no se ha guardado nada: ' || sqlerrm;
  end;
  return null;   -- no se aplica: la fila se queda como estaba
end;
$$;

revoke all on function protegido_interno.claves_versiones_antiguas(), protegido_interno.apartar_version_antigua() from public;
grant execute on function protegido_interno.claves_versiones_antiguas(), protegido_interno.apartar_version_antigua() to authenticated;

-- BEFORE: decide antes de escribir. Si aparta, la red de rescate (AFTER) no se entera: no se ha pisado nada.
drop trigger if exists horarios_versiones_antiguas on public.app_data;
create trigger horarios_versiones_antiguas
  before insert or update or delete on public.app_data
  for each row execute function protegido_interno.apartar_version_antigua();

-- Comprobación (solo lectura): una fila con el disparador activo ('O'), ninguna de la regla de E1; y el protocolo dice
-- `versionesAntiguas: true` y `horarioTop: true`.
-- select tgname, tgenabled from pg_trigger where tgname in ('horarios_versiones_antiguas', 'horario_regla_revision');
