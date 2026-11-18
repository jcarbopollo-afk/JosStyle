-- ═══════════════════════════════════════════════════════════════════════════
-- 🛟 HORARIOS · E1-R · R5 — LA RED DE RESCATE (P1, decisiones H-22 y H-25 de Josué; docs/19 §18.19)
--
-- ⛔ NO EJECUTAR EN SUPABASE (ni de producción ni independiente). Se construye y se prueba SOLO en un Postgres +
--    PostgREST LOCALES y desechables (127.0.0.1), con `scripts/test-rescate-postgrest.mjs` y
--    `scripts/test-instalacion-horarios-postgrest.mjs`. En un entorno alojado se instala SOLO dentro de
--    `horarios-instalacion.sql` (R1 + esta red + P4, en una transacción: bloque 1, 2026-11-18), con la autorización de
--    Josué. Para quitarla: `horarios-rescate-deshacer.sql`.
-- ⚠️ Necesita `horarios-protegido.sql` (R1) instalado antes: guarda las copias en su tabla `copias_apartadas`.
--
-- Qué hace: cada vez que una escritura de la aplicación que NO pasa por las funciones protegidas (una «escritura a
-- ciegas»: el `upsert` de `saveData`, que es como guardan las versiones anteriores de JosStyle) cambia o borra
-- `horarioTop`, guarda en `copias_apartadas` (tipo `rescate`), EN LA MISMA TRANSACCIÓN, lo que había antes (`antes`)
-- y lo que se escribió encima (`despues`, `null` si se borró). Así lo que pisa una versión antigua nunca se pierde:
-- queda en «Cambios apartados» y se recupera elemento a elemento.
--   · D1 (b), decisión de Josué del 2026-11-18: SOLO `horarioTop`. `estudios` y `papelera` se siguen guardando como
--     hoy (a ciegas, sin copia) hasta E1-S y E1-P: con ellas dentro, cada guardado normal de la versión nueva dejaba
--     una copia, sin límite, que además no se puede recuperar desde la aplicación.
--   · Con P4 activo (que decide ANTES de escribir y aparta lo antiguo de `horarioTop`), esta red no llega a actuar: es
--     la red de la VUELTA ATRÁS (quitar P4 y volver a la versión anterior), cuando lo antiguo vuelve a aplicarse.
--   · H-22 (que no haya un rato en que una pestaña antigua pueda pisar algo sin red) se cumple instalándola junto con
--     P4 antes de publicar (D3, secuencia B).
--   · H-25: si guardar la copia falla, LA ESCRITURA SE RECHAZA (`P0001`, `rescate_fallido`). Dejarla pasar sin copia
--     sería justo el hueco que la red tiene que cerrar. La versión antigua lo ve como «no se pudo guardar» y lo
--     conserva en su pantalla.
--   · No rescata: lo que escriben las funciones protegidas (llevan su propia condición y su registro); un guardado
--     que no cambia nada; la primera fila de una clave (no había nada que perder); otras claves; ni lo que hace el
--     propietario de la tabla (el borrado en cascada de una cuenta, el editor SQL).
--   · Una copia con el MISMO `antes` y el MISMO `despues` que otra que ya existe no se repite (un reintento de la
--     misma escritura no ocupa el doble).
--   · No borra nada nunca (H-10): las copias se quedan hasta que él las elimine. Cuánto crecen se mide en E2-0
--     (H-14, H-16).
-- ⚠️ Cuando E1-S y E1-P existan, cada una añadirá aquí su clave a la vez que su apartado: nunca antes (cada guardado
--    a ciegas de la versión nueva dejaría una copia).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.copias_apartadas') is null or to_regnamespace('protegido_interno') is null then
    raise exception 'Falta R1: instala antes supabase/horarios-protegido.sql';
  end if;
end;
$$;

-- Las claves que protege la red: solo el horario (D1 b). E1-S y E1-P añadirán las suyas con su apartado.
create or replace function protegido_interno.claves_rescate() returns text[]
language sql immutable set search_path = '' as $$ select array['horarioTop']::text[] $$;

create or replace function protegido_interno.rescatar() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_clave text := old.key;
  v_antes jsonb := old.value;
  v_despues jsonb := null;
  v_accion text := 'borrado';
  v_huella text;
  v_meta jsonb;
  v_contenido jsonb;
  v_previo text;
begin
  -- Solo las escrituras de la aplicación (los roles de la API) que NO pasan por las funciones protegidas.
  if current_user not in ('authenticated', 'anon') then return null; end if;
  if coalesce(current_setting('josstyle.protegido', true), '') = 'on' then return null; end if;
  if not (v_clave = any (protegido_interno.claves_rescate())) then return null; end if;
  if tg_op = 'UPDATE' then
    if new.key is not distinct from old.key then
      if new.value is not distinct from old.value then return null; end if;   -- no cambia nada: nada que perder
      v_despues := new.value;
      v_accion := 'escritura';
    end if;
  end if;

  v_huella := encode(sha256(convert_to(v_clave || chr(31) || coalesce(v_antes::text, 'null') || chr(31)
                                       || coalesce(v_despues::text, 'null'), 'UTF8')), 'hex');
  if exists (select 1 from public.copias_apartadas c
             where c.user_id = old.user_id and c.tipo = 'rescate' and c.meta ->> 'huella' = v_huella) then
    return null;   -- esta misma pareja ya está a salvo
  end if;

  v_contenido := jsonb_build_object('formato', 1, 'clave', v_clave, 'antes', v_antes, 'despues', v_despues);
  v_meta := jsonb_build_object(
    'clave', v_clave,
    'accion', v_accion,
    'huella', v_huella,
    'creadaEn', now(),
    'revisionAntes', case when v_clave = 'horarioTop' then v_antes -> 'testigo' ->> 'revision' end,
    'revisionDespues', case when v_clave = 'horarioTop' then v_despues -> 'testigo' ->> 'revision' end,
    'navegador', protegido_interno.navegador(),
    'tamanoAntes', octet_length(v_antes::text),
    'tamanoDespues', case when v_despues is null then null else octet_length(v_despues::text) end);

  begin
    v_previo := current_setting('josstyle.protegido', true);
    perform set_config('josstyle.protegido', 'on', true);
    insert into public.copias_apartadas (user_id, id, tipo, op_id, aparato, version_app, meta, contenido, tamano)
    values (old.user_id, gen_random_uuid(), 'rescate', null,
            case when v_clave = 'horarioTop' then v_despues -> 'testigo' ->> 'aparato' end, null,
            v_meta, v_contenido, octet_length(v_contenido::text));
    perform set_config('josstyle.protegido', coalesce(v_previo, ''), true);
  exception when others then
    -- H-25: sin copia no hay escritura. Toda la transacción se deshace: lo que había sigue intacto.
    raise exception using errcode = 'P0001', message = 'rescate_fallido',
      detail = 'No se pudo guardar la copia de lo que había, así que no se ha guardado nada: ' || sqlerrm;
  end;
  return null;
end;
$$;

revoke all on function protegido_interno.claves_rescate(), protegido_interno.rescatar() from public;
grant execute on function protegido_interno.claves_rescate(), protegido_interno.rescatar() to authenticated;

-- AFTER: solo se rescata lo que de verdad se escribió (si otra regla para la escritura antes, no hay nada que rescatar).
drop trigger if exists horarios_rescate on public.app_data;
create trigger horarios_rescate
  after update or delete on public.app_data
  for each row execute function protegido_interno.rescatar();

-- Comprobación (solo lectura): una fila, con el disparador activo ('O'); y el protocolo dice `rescate: true`.
-- select tgname, tgenabled from pg_trigger where tgname = 'horarios_rescate';
-- select public.protegido_protocolo() -> 'reglas';   -- (con una sesión de usuario)
