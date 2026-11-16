-- ═══════════════════════════════════════════════════════════════════════════
-- 🛡 HORARIOS · E1-R · R1 — LA OPERACIÓN PROTEGIDA EN EL SERVIDOR (docs/19 §18.15)
--
-- ⛔ NO EJECUTAR EN SUPABASE (ni de producción ni independiente). R1 se construye y se prueba SOLO en un Postgres +
--    PostgREST LOCALES y desechables (127.0.0.1), con `scripts/test-protegido-postgrest.mjs`. Instalarlo en un entorno
--    alojado es de E2 y lo autoriza Josué, paso a paso. Para quitarlo: `horarios-protegido-deshacer.sql`.
--
-- Qué es (decisiones H-07, H-08 y H-18 de Josué):
--   · `protegido_aplicar(op)`: UNA transacción que guarda una operación protegida ENTERA o no guarda nada. Escribe
--     `horarioTop` con su condición de revisión (D3: el texto de `value->testigo->>revision`) y las demás claves
--     permitidas con CAMBIOS POR ELEMENTO (quitar si sigue igual, reemplazar si sigue igual, añadir si no existe,
--     reordenar, fijar un campo), nunca reescribiéndolas enteras. Si una condición falla no escribe nada y, si la
--     operación es manual, la aparta ENTERA en `copias_apartadas` en la misma transacción.
--   · Idempotencia por capas: el registro `operaciones_protegidas` (un `opId` = una respuesta, con la huella de la
--     operación); la revisión nueva del horario (una operación aplicada se reconoce por ella aunque falte su
--     registro); las condiciones por elemento; y la marca de corte (`operaciones_corte`): una operación desconocida
--     anterior al corte se rechaza como «caducada», nunca se aplica. Hoy nadie escribe la marca (no hay limpieza
--     aprobada, H-16): existe para que una limpieza futura no pueda abrir la puerta a una segunda aplicación.
--   · Tablas propias (H-18) para las copias y el registro, con RLS por usuario y borrado en cascada con la cuenta.
--     Solo se escriben desde estas funciones: una guardia rechaza cualquier escritura directa de la aplicación.
--   · `protegido_estado`, `protegido_leer`, `protegido_copia_eliminar`, `protegido_copia_vista`,
--     `protegido_espacio` y `protegido_protocolo`.
--
-- Todas son SECURITY INVOKER: corren como el usuario que llama, así que las políticas de `app_data` siguen mandando.
-- ═══════════════════════════════════════════════════════════════════════════

create schema if not exists protegido_interno;
revoke all on schema protegido_interno from public;
grant usage on schema protegido_interno to authenticated;

-- ── Tablas propias (H-18) ──────────────────────────────────────────────────

-- El registro de idempotencia: una fila por operación que llegó y se resolvió (aplicada o en conflicto).
create table if not exists public.operaciones_protegidas (
  user_id uuid not null references auth.users(id) on delete cascade,
  op_id uuid not null,
  huella text not null,
  tipo text not null,
  manual boolean not null,
  aparato text,
  version_app text,
  creada_en timestamptz not null,
  recibida_en timestamptz not null default now(),
  resultado text not null check (resultado in ('aplicada', 'conflicto')),
  motivo jsonb,
  revision_antes text,
  revision_despues text,
  claves text[] not null default '{}',
  copia_id uuid,
  tamano integer not null,
  primary key (user_id, op_id)
);

-- Las copias apartadas: la operación ENTERA (H-08). `conflicto` la crea esta función; `version_antigua` y `rescate`
-- están reservadas para R5 (decisiones H-22 y H-23, pendientes).
create table if not exists public.copias_apartadas (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  tipo text not null check (tipo in ('conflicto', 'version_antigua', 'rescate')),
  op_id uuid,
  aparato text,
  version_app text,
  creada_en timestamptz not null default now(),
  vista boolean not null default false,
  meta jsonb not null,
  contenido jsonb not null,
  tamano integer not null,
  primary key (user_id, id)
);

-- La marca de corte de una limpieza del registro (H-16, sin aprobar: nadie la escribe hoy).
create table if not exists public.operaciones_corte (
  user_id uuid primary key references auth.users(id) on delete cascade,
  corte timestamptz not null
);

alter table public.operaciones_protegidas enable row level security;
alter table public.copias_apartadas enable row level security;
alter table public.operaciones_corte enable row level security;

drop policy if exists "operaciones propias" on public.operaciones_protegidas;
create policy "operaciones propias" on public.operaciones_protegidas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "copias propias" on public.copias_apartadas;
create policy "copias propias" on public.copias_apartadas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "corte propio" on public.operaciones_corte;
create policy "corte propio" on public.operaciones_corte
  for select using (auth.uid() = user_id);

revoke all on public.operaciones_protegidas, public.copias_apartadas, public.operaciones_corte from public, anon;
grant select, insert, update, delete on public.operaciones_protegidas, public.copias_apartadas to authenticated;
grant select on public.operaciones_corte to authenticated;
revoke insert, update, delete on public.operaciones_corte from authenticated;

-- La guardia: la aplicación solo escribe estas tablas a través de las funciones de abajo, que encienden una marca
-- de la transacción. Lo que haga el propietario (el borrado en cascada de una cuenta, el editor SQL) no pasa por ella.
create or replace function protegido_interno.solo_por_funciones() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon')
     and coalesce(current_setting('josstyle.protegido', true), '') <> 'on' then
    raise exception using errcode = 'P0001', message = 'protegido_solo_por_funciones',
      detail = 'Estas tablas solo se escriben desde las funciones protegidas.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists operaciones_solo_por_funciones on public.operaciones_protegidas;
create trigger operaciones_solo_por_funciones before insert or update or delete on public.operaciones_protegidas
  for each row execute function protegido_interno.solo_por_funciones();
drop trigger if exists copias_solo_por_funciones on public.copias_apartadas;
create trigger copias_solo_por_funciones before insert or update or delete on public.copias_apartadas
  for each row execute function protegido_interno.solo_por_funciones();

-- ── Ayudantes (esquema no expuesto por la API) ─────────────────────────────

-- Las claves de `app_data` que una operación puede tocar por elementos (además de `horarioTop`, que va aparte).
create or replace function protegido_interno.claves_permitidas() returns text[]
language sql immutable set search_path = '' as $$ select array['estudios', 'papelera']::text[] $$;

-- Posición (desde 0) del elemento con ese `id` en una lista, o -1.
create or replace function protegido_interno.indice(col jsonb, id text) returns integer
language sql immutable set search_path = '' as $$
  select coalesce((select (t.o - 1)::integer
                   from jsonb_array_elements(col) with ordinality as t(e, o)
                   where jsonb_typeof(t.e) = 'object' and t.e ->> 'id' = id
                   order by t.o limit 1), -1)
$$;

-- ¿Existe el camino? Un tramo de texto es un campo de un objeto (puede faltar: se crea vacío); un tramo `{id}` es un
-- elemento de una lista, y tiene que existir.
create or replace function protegido_interno.camino_existe(valor jsonb, camino jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare v jsonb := valor; seg jsonb; i integer;
begin
  for seg in select e from jsonb_array_elements(camino) as t(e) loop
    if jsonb_typeof(seg) = 'string' then
      if v is null or jsonb_typeof(v) = 'null' then v := null; continue; end if;
      if jsonb_typeof(v) <> 'object' then return false; end if;
      v := v -> (seg #>> '{}');
    else
      if v is null or jsonb_typeof(v) <> 'array' then return false; end if;
      i := protegido_interno.indice(v, seg ->> 'id');
      if i < 0 then return false; end if;
      v := v -> i;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function protegido_interno.obtener(valor jsonb, camino jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare v jsonb := valor; seg jsonb; i integer;
begin
  for seg in select e from jsonb_array_elements(camino) as t(e) loop
    if v is null or jsonb_typeof(v) = 'null' then return null; end if;
    if jsonb_typeof(seg) = 'string' then
      if jsonb_typeof(v) <> 'object' then return null; end if;
      v := v -> (seg #>> '{}');
    else
      if jsonb_typeof(v) <> 'array' then return null; end if;
      i := protegido_interno.indice(v, seg ->> 'id');
      if i < 0 then return null; end if;
      v := v -> i;
    end if;
  end loop;
  return v;
end;
$$;

-- Devuelve `valor` con `nuevo` puesto en el camino (que ya se ha comprobado con `camino_existe`).
create or replace function protegido_interno.poner(valor jsonb, camino jsonb, nuevo jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare seg jsonb; resto jsonb; base jsonb; i integer; k text;
begin
  if jsonb_array_length(camino) = 0 then return nuevo; end if;
  seg := camino -> 0;
  resto := camino - 0;
  if jsonb_typeof(seg) = 'string' then
    k := seg #>> '{}';
    base := case when valor is null or jsonb_typeof(valor) <> 'object' then '{}'::jsonb else valor end;
    return base || jsonb_build_object(k, protegido_interno.poner(base -> k, resto, nuevo));
  end if;
  i := protegido_interno.indice(valor, seg ->> 'id');
  return jsonb_set(valor, array[i::text], protegido_interno.poner(valor -> i, resto, nuevo));
end;
$$;

-- Un tramo de camino válido: texto, o un objeto con `id` de texto.
create or replace function protegido_interno.camino_valido(camino jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(camino) = 'array' and not exists (
    select 1 from jsonb_array_elements(camino) as t(e)
    where not (jsonb_typeof(t.e) = 'string'
               or (jsonb_typeof(t.e) = 'object' and jsonb_typeof(t.e -> 'id') = 'string')))
$$;

-- La forma de la operación. Devuelve null si es válida, o el motivo. Una operación inválida no se registra ni se
-- aparta: no es un conflicto, es un fallo del cliente.
create or replace function protegido_interno.validar(op jsonb) returns text
language plpgsql stable set search_path = '' as $$
declare h jsonb; c jsonb; cb jsonb; x jsonb; vistas text[] := '{}'; nombre text; colecc boolean; ts timestamptz;
begin
  if op is null or jsonb_typeof(op) <> 'object' then return 'forma'; end if;
  if op ->> 'formato' is distinct from '1' then return 'formato'; end if;
  if jsonb_typeof(op -> 'opId') <> 'string'
     or (op ->> 'opId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return 'opId'; end if;
  if jsonb_typeof(op -> 'tipo') <> 'string' or length(op ->> 'tipo') = 0 then return 'tipo'; end if;
  if jsonb_typeof(op -> 'manual') is distinct from 'boolean' then return 'manual'; end if;
  if jsonb_typeof(op -> 'creadaEn') is distinct from 'string' then return 'creadaEn'; end if;
  begin ts := (op ->> 'creadaEn')::timestamptz; exception when others then return 'creadaEn'; end;

  h := op -> 'horario';
  if h is not null and jsonb_typeof(h) <> 'null' then
    if jsonb_typeof(h) <> 'object' or jsonb_typeof(h -> 'valor') is distinct from 'object'
       or jsonb_typeof(h -> 'valor' -> 'testigo') is distinct from 'object' then return 'horario'; end if;
    if jsonb_typeof(h -> 'valor' -> 'testigo' -> 'revision') is distinct from 'string'
       or length(h -> 'valor' -> 'testigo' ->> 'revision') = 0 then return 'horario_revision'; end if;
    if jsonb_typeof(h -> 'base') not in ('string', 'null') and h ? 'base' then return 'horario_base'; end if;
    if jsonb_typeof(h -> 'baseExiste') is distinct from 'boolean' then return 'horario_baseExiste'; end if;
    if (h ->> 'base') is not distinct from (h -> 'valor' -> 'testigo' ->> 'revision') then return 'horario_revision_repetida'; end if;
  end if;

  if op ? 'claves' and jsonb_typeof(op -> 'claves') <> 'array' then return 'claves'; end if;
  for c in select e from jsonb_array_elements(coalesce(op -> 'claves', '[]'::jsonb)) as t(e) loop
    if jsonb_typeof(c) <> 'object' or jsonb_typeof(c -> 'clave') is distinct from 'string' then return 'clave'; end if;
    nombre := c ->> 'clave';
    if not (nombre = any (protegido_interno.claves_permitidas())) then return 'clave_no_permitida'; end if;
    if nombre = any (vistas) then return 'clave_repetida'; end if;
    vistas := vistas || nombre;
    if c ? 'inicial' and jsonb_typeof(c -> 'inicial') <> 'object' then return 'inicial'; end if;
    if jsonb_typeof(c -> 'cambios') is distinct from 'array' or jsonb_array_length(c -> 'cambios') = 0 then return 'cambios'; end if;
    for cb in select e from jsonb_array_elements(c -> 'cambios') as t(e) loop
      if jsonb_typeof(cb) <> 'object' then return 'cambio'; end if;
      if not protegido_interno.camino_valido(coalesce(cb -> 'camino', '[]'::jsonb)) then return 'camino'; end if;
      colecc := cb ?| array['quitar', 'reemplazar', 'anadir', 'orden'];
      if colecc and cb ? 'fijar' then return 'cambio_mezclado'; end if;
      if not colecc and not (cb ? 'fijar') then return 'cambio_vacio'; end if;
      if colecc and jsonb_array_length(coalesce(cb -> 'camino', '[]'::jsonb)) = 0 then return 'camino_lista'; end if;
      for x in select e from jsonb_array_elements(coalesce(cb -> 'quitar', '[]'::jsonb)) as t(e) loop
        if jsonb_typeof(x -> 'id') is distinct from 'string' or not (x ? 'igual') then return 'quitar'; end if;
      end loop;
      for x in select e from jsonb_array_elements(coalesce(cb -> 'reemplazar', '[]'::jsonb)) as t(e) loop
        if jsonb_typeof(x -> 'id') is distinct from 'string' or not (x ? 'igual')
           or jsonb_typeof(x -> 'nuevo') is distinct from 'object' or (x -> 'nuevo' ->> 'id') is distinct from (x ->> 'id') then return 'reemplazar'; end if;
      end loop;
      for x in select e from jsonb_array_elements(coalesce(cb -> 'anadir', '[]'::jsonb)) as t(e) loop
        if jsonb_typeof(x -> 'elemento') is distinct from 'object' or jsonb_typeof(x -> 'elemento' -> 'id') is distinct from 'string' then return 'anadir'; end if;
        if x ? 'posicion' and jsonb_typeof(x -> 'posicion') <> 'number' then return 'anadir_posicion'; end if;
      end loop;
      if cb ? 'orden' and (jsonb_typeof(cb -> 'orden') <> 'array'
          or exists (select 1 from jsonb_array_elements(cb -> 'orden') as t(e) where jsonb_typeof(t.e) <> 'string')) then return 'orden'; end if;
      if cb ? 'fijar' then
        if jsonb_typeof(cb -> 'fijar') <> 'array' then return 'fijar'; end if;
        for x in select e from jsonb_array_elements(cb -> 'fijar') as t(e) loop
          if jsonb_typeof(x -> 'campo') is distinct from 'string' or not (x ? 'valor') then return 'fijar'; end if;
        end loop;
      end if;
    end loop;
  end loop;

  if (h is null or jsonb_typeof(h) = 'null') and jsonb_array_length(coalesce(op -> 'claves', '[]'::jsonb)) = 0 then return 'vacia'; end if;
  return null;
end;
$$;

-- Aplica UN cambio a un valor EN MEMORIA. Si una condición falla devuelve `fallo` y no toca nada.
create or replace function protegido_interno.aplicar_cambio(valor jsonb, cambio jsonb, clave text, out nuevo jsonb, out fallo jsonb)
language plpgsql immutable set search_path = '' as $$
declare camino jsonb := coalesce(cambio -> 'camino', '[]'::jsonb); col jsonb; obj jsonb; x jsonb; i integer; pos integer; ids text[];
begin
  nuevo := valor; fallo := null;
  if not protegido_interno.camino_existe(valor, camino) then
    fallo := jsonb_build_object('motivo', 'camino_ausente', 'clave', clave, 'camino', camino); return;
  end if;

  if cambio ? 'fijar' then
    obj := protegido_interno.obtener(valor, camino);
    if obj is null or jsonb_typeof(obj) = 'null' then obj := '{}'::jsonb; end if;
    if jsonb_typeof(obj) <> 'object' then
      fallo := jsonb_build_object('motivo', 'camino_no_es_objeto', 'clave', clave, 'camino', camino); return;
    end if;
    for x in select e from jsonb_array_elements(cambio -> 'fijar') as t(e) loop
      if x ? 'igual' and coalesce(obj -> (x ->> 'campo'), 'null'::jsonb) is distinct from (x -> 'igual') then
        fallo := jsonb_build_object('motivo', 'campo_distinto', 'clave', clave, 'camino', camino, 'campo', x ->> 'campo'); return;
      end if;
      obj := obj || jsonb_build_object(x ->> 'campo', x -> 'valor');
    end loop;
    nuevo := protegido_interno.poner(valor, camino, obj);
    return;
  end if;

  col := protegido_interno.obtener(valor, camino);
  if col is null or jsonb_typeof(col) = 'null' then col := '[]'::jsonb; end if;
  if jsonb_typeof(col) <> 'array' then
    fallo := jsonb_build_object('motivo', 'camino_no_es_lista', 'clave', clave, 'camino', camino); return;
  end if;

  for x in select e from jsonb_array_elements(coalesce(cambio -> 'quitar', '[]'::jsonb)) as t(e) loop
    i := protegido_interno.indice(col, x ->> 'id');
    if i < 0 then fallo := jsonb_build_object('motivo', 'elemento_ausente', 'clave', clave, 'camino', camino, 'id', x ->> 'id'); return; end if;
    if (col -> i) is distinct from (x -> 'igual') then
      fallo := jsonb_build_object('motivo', 'elemento_distinto', 'clave', clave, 'camino', camino, 'id', x ->> 'id'); return;
    end if;
    col := col - i;
  end loop;

  for x in select e from jsonb_array_elements(coalesce(cambio -> 'reemplazar', '[]'::jsonb)) as t(e) loop
    i := protegido_interno.indice(col, x ->> 'id');
    if i < 0 then fallo := jsonb_build_object('motivo', 'elemento_ausente', 'clave', clave, 'camino', camino, 'id', x ->> 'id'); return; end if;
    if (col -> i) is distinct from (x -> 'igual') then
      fallo := jsonb_build_object('motivo', 'elemento_distinto', 'clave', clave, 'camino', camino, 'id', x ->> 'id'); return;
    end if;
    col := jsonb_set(col, array[i::text], x -> 'nuevo');
  end loop;

  for x in select e from jsonb_array_elements(coalesce(cambio -> 'anadir', '[]'::jsonb)) as t(e) loop
    if protegido_interno.indice(col, x -> 'elemento' ->> 'id') >= 0 then
      fallo := jsonb_build_object('motivo', 'elemento_existe', 'clave', clave, 'camino', camino, 'id', x -> 'elemento' ->> 'id'); return;
    end if;
    pos := case when x ? 'posicion' then greatest(0, floor((x ->> 'posicion')::numeric)::integer) else null end;
    if pos is null or pos >= jsonb_array_length(col) then col := col || jsonb_build_array(x -> 'elemento');
    else col := jsonb_insert(col, array[pos::text], x -> 'elemento');
    end if;
  end loop;

  if cambio ? 'orden' then
    ids := array(select jsonb_array_elements_text(cambio -> 'orden'));
    col := coalesce((select jsonb_agg(t.e order by coalesce(array_position(ids, t.e ->> 'id'), 2147483647), t.o)
                     from jsonb_array_elements(col) with ordinality as t(e, o)), '[]'::jsonb);
  end if;

  nuevo := protegido_interno.poner(valor, camino, col);
end;
$$;

create or replace function protegido_interno.bloquear(uid uuid) returns void
language sql set search_path = '' as $$ select pg_advisory_xact_lock(hashtextextended('josstyle.protegido:' || uid::text, 0)) $$;

revoke all on all functions in schema protegido_interno from public;
grant execute on all functions in schema protegido_interno to authenticated;

-- ── Funciones de la API ─────────────────────────────────────────────────────

-- Lo que el cliente consulta al arrancar: versión del protocolo, la versión mínima de la app (ninguna todavía), qué
-- reglas del servidor están activas y la hora del servidor (para fechar las operaciones sin depender del reloj del
-- aparato, TP-12).
create or replace function public.protegido_protocolo() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'version', 1,
    'versionMinima', null,
    'ahora', now(),
    'reglas', jsonb_build_object(
      'horarioTop', exists (select 1 from pg_catalog.pg_trigger
                            where tgname = 'horario_regla_revision' and not tgisinternal and tgenabled <> 'D')))
$$;

-- LA OPERACIÓN PROTEGIDA. Devuelve { estado: 'aplicada' | 'conflicto' | 'caducada' | 'invalida' | 'sin_sesion', … }.
create or replace function public.protegido_aplicar(op jsonb) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid();
  motivo_invalida text;
  v_op_id uuid;
  v_huella text;
  reg record;
  v_corte timestamptz;
  con_horario boolean;
  h_valor jsonb; h_existe boolean := false; rev_actual text; rev_nueva text; base text; base_existe boolean;
  fallo jsonb := null;
  c jsonb; cb jsonb; k text; k_valor jsonb; k_existe boolean; r record;
  nuevos jsonb := '{}'::jsonb; existian jsonb := '{}'::jsonb; claves_op text[] := '{}';
  v_copia uuid := null;
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  motivo_invalida := protegido_interno.validar(op);
  if motivo_invalida is not null then return jsonb_build_object('estado', 'invalida', 'motivo', motivo_invalida); end if;

  perform set_config('josstyle.protegido', 'on', true);
  v_op_id := (op ->> 'opId')::uuid;
  v_huella := encode(sha256(convert_to(op::text, 'UTF8')), 'hex');

  -- Una operación protegida a la vez por usuario: un reintento que llega mientras la primera se aplica la espera y
  -- después lee su registro.
  perform protegido_interno.bloquear(uid);

  -- Capa 1: el registro.
  select * into reg from public.operaciones_protegidas where user_id = uid and op_id = v_op_id;
  if found then
    if reg.huella <> v_huella then
      return jsonb_build_object('estado', 'invalida', 'motivo', 'op_distinta', 'opId', v_op_id);
    end if;
    return jsonb_build_object('estado', reg.resultado, 'registrada', true, 'opId', v_op_id,
      'revision', reg.revision_despues, 'copiaId', reg.copia_id, 'motivo', reg.motivo);
  end if;

  -- Capa 4: la marca de corte. Una operación desconocida anterior a ella no se aplica nunca.
  select corte into v_corte from public.operaciones_corte where user_id = uid;
  if found and (op ->> 'creadaEn')::timestamptz < v_corte then
    return jsonb_build_object('estado', 'caducada', 'opId', v_op_id, 'corte', v_corte);
  end if;

  select coalesce(array_agg(e ->> 'clave' order by e ->> 'clave'), '{}') into claves_op
    from jsonb_array_elements(coalesce(op -> 'claves', '[]'::jsonb)) as t(e);
  con_horario := op -> 'horario' is not null and jsonb_typeof(op -> 'horario') = 'object';

  -- Fase 1: leer (bloqueando las filas, el horario primero) y comprobar TODAS las condiciones sin escribir nada.
  if con_horario then
    select value into h_valor from public.app_data where user_id = uid and key = 'horarioTop' for update;
    h_existe := found;
    rev_actual := h_valor -> 'testigo' ->> 'revision';
    rev_nueva := op -> 'horario' -> 'valor' -> 'testigo' ->> 'revision';
    base := op -> 'horario' ->> 'base';
    base_existe := (op -> 'horario' ->> 'baseExiste')::boolean;
    -- Capa 2: si la revisión vigente ES la nueva de esta operación, ya se aplicó (aunque falte su registro).
    if h_existe and rev_actual is not distinct from rev_nueva then
      return jsonb_build_object('estado', 'aplicada', 'reconocidaPor', 'revision', 'opId', v_op_id, 'revision', rev_nueva);
    end if;
    if not ((base is null and not base_existe and not h_existe)
         or (base is null and base_existe and h_existe and rev_actual is null)
         or (base is not null and h_existe and rev_actual = base)) then
      fallo := jsonb_build_object('motivo', 'revision', 'clave', 'horarioTop', 'esperada', base, 'actual', rev_actual,
                                  'existe', h_existe);
    end if;
  end if;

  if fallo is null then
    foreach k in array claves_op loop
      select e into c from jsonb_array_elements(op -> 'claves') as t(e) where e ->> 'clave' = k;
      select value into k_valor from public.app_data where user_id = uid and key = k for update;
      k_existe := found;
      if not k_existe then k_valor := coalesce(c -> 'inicial', '{}'::jsonb); end if;
      for cb in select e from jsonb_array_elements(c -> 'cambios') as t(e) loop
        select * into r from protegido_interno.aplicar_cambio(k_valor, cb, k);
        if r.fallo is not null then fallo := r.fallo; exit; end if;
        k_valor := r.nuevo;
      end loop;
      exit when fallo is not null;
      nuevos := nuevos || jsonb_build_object(k, k_valor);
      existian := existian || jsonb_build_object(k, k_existe);
    end loop;
  end if;

  -- Una condición falló: no se escribe nada de la operación. Si es manual, se aparta ENTERA (H-08, condición 4 de
  -- D2-bis para las automáticas), en esta misma transacción.
  if fallo is not null then
    if (op ->> 'manual')::boolean then
      insert into public.copias_apartadas (user_id, id, tipo, op_id, aparato, version_app, meta, contenido, tamano)
      values (uid, v_op_id, 'conflicto', v_op_id, op ->> 'aparato', op ->> 'versionApp',
              jsonb_build_object('tipoOperacion', op ->> 'tipo', 'claves', to_jsonb(claves_op),
                                 'conHorario', con_horario, 'motivo', fallo, 'contraRevision', rev_actual,
                                 'aparatoSuyo', h_valor -> 'testigo' ->> 'aparato', 'creadaEn', op ->> 'creadaEn'),
              op, octet_length(op::text))
      on conflict (user_id, id) do nothing;
      v_copia := v_op_id;
    end if;
    insert into public.operaciones_protegidas (user_id, op_id, huella, tipo, manual, aparato, version_app, creada_en,
      resultado, motivo, revision_antes, revision_despues, claves, copia_id, tamano)
    values (uid, v_op_id, v_huella, op ->> 'tipo', (op ->> 'manual')::boolean, op ->> 'aparato', op ->> 'versionApp',
      (op ->> 'creadaEn')::timestamptz, 'conflicto', fallo, rev_actual, null, claves_op, v_copia, octet_length(op::text));
    return jsonb_build_object('estado', 'conflicto', 'opId', v_op_id, 'motivo', fallo, 'copiaId', v_copia,
      'actual', case when con_horario then jsonb_build_object('existe', h_existe, 'valor', h_valor) else null end);
  end if;

  -- Fase 2: escribir. Si algo falla aquí, la transacción entera se deshace (nada a medias).
  if con_horario then
    if h_existe then
      update public.app_data set value = op -> 'horario' -> 'valor', updated_at = now()
        where user_id = uid and key = 'horarioTop';
    else
      insert into public.app_data (user_id, key, value, updated_at) values (uid, 'horarioTop', op -> 'horario' -> 'valor', now());
    end if;
  end if;
  foreach k in array claves_op loop
    if (existian ->> k)::boolean then
      update public.app_data set value = nuevos -> k, updated_at = now() where user_id = uid and key = k;
    else
      insert into public.app_data (user_id, key, value, updated_at) values (uid, k, nuevos -> k, now());
    end if;
  end loop;
  insert into public.operaciones_protegidas (user_id, op_id, huella, tipo, manual, aparato, version_app, creada_en,
    resultado, motivo, revision_antes, revision_despues, claves, copia_id, tamano)
  values (uid, v_op_id, v_huella, op ->> 'tipo', (op ->> 'manual')::boolean, op ->> 'aparato', op ->> 'versionApp',
    (op ->> 'creadaEn')::timestamptz, 'aplicada', null, rev_actual, rev_nueva, claves_op, null, octet_length(op::text));
  return jsonb_build_object('estado', 'aplicada', 'opId', v_op_id, 'revision', rev_nueva, 'aplicadaEn', now());
end;
$$;

-- El estado de una operación SIN aplicarla: espera a que termine una que esté en curso y contesta la verdad.
-- `desconocida` = no llegó, o llegó y se deshizo: se puede reenviar con el mismo opId.
create or replace function public.protegido_estado(op_id uuid) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); reg record; v_corte timestamptz;
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  perform protegido_interno.bloquear(uid);
  select * into reg from public.operaciones_protegidas o where o.user_id = uid and o.op_id = protegido_estado.op_id;
  if found then
    return jsonb_build_object('estado', reg.resultado, 'opId', reg.op_id, 'revision', reg.revision_despues,
      'copiaId', reg.copia_id, 'motivo', reg.motivo, 'recibidaEn', reg.recibida_en);
  end if;
  select corte into v_corte from public.operaciones_corte where user_id = uid;
  return jsonb_build_object('estado', 'desconocida', 'opId', protegido_estado.op_id, 'corte', v_corte);
end;
$$;

-- Leer las claves protegidas TAL COMO ESTÁN GUARDADAS, con su sello (para construir las condiciones con lo guardado
-- y no con lo que se ve en pantalla).
create or replace function public.protegido_leer(claves text[]) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); k text; v jsonb; existe boolean; res jsonb := '{}'::jsonb;
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  foreach k in array coalesce(claves, '{}') loop
    if not (k = 'horarioTop' or k = any (protegido_interno.claves_permitidas())) then
      return jsonb_build_object('estado', 'invalida', 'motivo', 'clave_no_permitida', 'clave', k);
    end if;
    select value into v from public.app_data where user_id = uid and key = k;
    existe := found;
    res := res || jsonb_build_object(k, jsonb_build_object(
      'existe', existe,
      'valor', v,
      'sello', case when existe then encode(sha256(convert_to(v::text, 'UTF8')), 'hex') else null end,
      'revision', case when k = 'horarioTop' then v -> 'testigo' ->> 'revision' else null end));
  end loop;
  return jsonb_build_object('estado', 'leidas', 'claves', res, 'ahora', now());
end;
$$;

-- Eliminar una copia apartada (voluntario, H-10). Borra SU fila: el espacio lógico baja al momento; el físico lo
-- recupera la limpieza de la base (reutilizable) y, para devolverlo, un mantenimiento medido y autorizado (H-21).
create or replace function public.protegido_copia_eliminar(copia_id uuid) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); t integer;
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  perform set_config('josstyle.protegido', 'on', true);
  delete from public.copias_apartadas c where c.user_id = uid and c.id = protegido_copia_eliminar.copia_id returning c.tamano into t;
  if not found then return jsonb_build_object('estado', 'no_existe', 'id', protegido_copia_eliminar.copia_id); end if;
  return jsonb_build_object('estado', 'eliminada', 'id', protegido_copia_eliminar.copia_id, 'tamano', t);
end;
$$;

create or replace function public.protegido_copia_vista(copia_id uuid) returns jsonb
language plpgsql volatile security invoker set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  perform set_config('josstyle.protegido', 'on', true);
  update public.copias_apartadas c set vista = true where c.user_id = uid and c.id = protegido_copia_vista.copia_id;
  if not found then return jsonb_build_object('estado', 'no_existe', 'id', protegido_copia_vista.copia_id); end if;
  return jsonb_build_object('estado', 'vista', 'id', protegido_copia_vista.copia_id);
end;
$$;

-- El tamaño LÓGICO de lo guardado (`pg_column_size`: bytes del valor tal como se guarda, comprimido si Postgres lo
-- comprimió). NO es el espacio en disco ni lo que se libera al borrar: eso depende de la limpieza de la base.
create or replace function public.protegido_espacio() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); res jsonb;
begin
  if uid is null then return jsonb_build_object('estado', 'sin_sesion'); end if;
  select jsonb_build_object(
    'medida', 'logica',
    'horarioTop', coalesce((select sum(pg_column_size(value)) from public.app_data where user_id = uid and key = 'horarioTop'), 0),
    'estudios', coalesce((select sum(pg_column_size(value)) from public.app_data where user_id = uid and key = 'estudios'), 0),
    'papelera', coalesce((select sum(pg_column_size(value)) from public.app_data where user_id = uid and key = 'papelera'), 0),
    'versiones', coalesce((select sum(pg_column_size(value)) from public.app_data where user_id = uid and key like 'horarioVersiones:%'), 0),
    'guardia', coalesce((select sum(pg_column_size(value)) from public.app_data where user_id = uid and key like 'horarioGuardia%'), 0),
    'copias', (select jsonb_build_object('cuantas', count(*), 'bytes', coalesce(sum(pg_column_size(contenido) + pg_column_size(meta)), 0))
               from public.copias_apartadas where user_id = uid),
    'copiasPorTipo', coalesce((select jsonb_object_agg(tipo, n) from (select tipo, count(*) as n from public.copias_apartadas where user_id = uid group by tipo) s), '{}'::jsonb),
    'operaciones', (select jsonb_build_object('cuantas', count(*), 'bytes', coalesce(sum(pg_column_size(o.*)), 0))
                    from public.operaciones_protegidas o where o.user_id = uid))
  into res;
  return res;
end;
$$;

revoke all on function public.protegido_protocolo(), public.protegido_aplicar(jsonb), public.protegido_estado(uuid),
  public.protegido_leer(text[]), public.protegido_copia_eliminar(uuid), public.protegido_copia_vista(uuid),
  public.protegido_espacio() from public, anon;
grant execute on function public.protegido_protocolo(), public.protegido_aplicar(jsonb), public.protegido_estado(uuid),
  public.protegido_leer(text[]), public.protegido_copia_eliminar(uuid), public.protegido_copia_vista(uuid),
  public.protegido_espacio() to authenticated;

-- Comprobación (solo lectura): tres tablas con RLS y siete funciones.
-- select relname, relrowsecurity from pg_class where relname in ('operaciones_protegidas','copias_apartadas','operaciones_corte');
-- select proname from pg_proc where proname like 'protegido\_%';
