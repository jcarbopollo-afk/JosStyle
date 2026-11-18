// ═══════════════════════════════════════════════════════════════════════════
// 🛡 HORARIOS · BLOQUE 1 — GENERA `supabase/horarios-instalacion.sql` (decisiones D1 b y D3 de Josué, 2026-11-18)
//
// La instalación de producción es UNA transacción con las tres piezas, en este orden y sin tocarlas:
//   1. `horarios-protegido.sql`           (R1: la operación protegida, sus tablas y sus funciones)
//   2. `horarios-rescate.sql`             (la red de rescate, solo `horarioTop`)
//   3. `horarios-versiones-antiguas.sql`  (P4: apartar lo que guarde una versión antigua en `horarioTop`)
// y una comprobación final dentro de la misma transacción: si falta algo, se deshace TODO.
//
// 🚨 EL ARCHIVO SE GENERA, NO SE EDITA. Si cambia una de las tres piezas, se vuelve a generar:
//      node scripts/generar-instalacion-horarios.mjs
//    y `test-rescate-versiones.mjs` (siempre) y `test-instalacion-horarios-postgrest.mjs` (laboratorio) lo comparan.
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/** Las piezas, en el orden en que se instalan. */
export const PIEZAS_INSTALACION = Object.freeze([
  { archivo: 'supabase/horarios-protegido.sql', nombre: 'R1 · la operación protegida' },
  { archivo: 'supabase/horarios-rescate.sql', nombre: 'la red de rescate (solo horarioTop)' },
  { archivo: 'supabase/horarios-versiones-antiguas.sql', nombre: 'P4 · apartar lo que guarde una versión antigua' },
]);

/** El tiempo máximo que la instalación espera a un bloqueo de `app_data` antes de rendirse (y deshacerlo todo). */
export const ESPERA_BLOQUEO = '5s';

export const RUTA_INSTALACION = 'supabase/horarios-instalacion.sql';

const CABECERA = `-- ═══════════════════════════════════════════════════════════════════════════
-- 🛡 HORARIOS · LA INSTALACIÓN DE LA PROTECCIÓN, EN UNA TRANSACCIÓN (bloque 1; decisiones D1 b y D3 de Josué, 2026-11-18)
--
-- ⛔ GENERADO por \`scripts/generar-instalacion-horarios.mjs\`: NO SE EDITA A MANO. Se cambia la pieza y se regenera.
-- ⛔ NO EJECUTAR EN NINGÚN SUPABASE sin la autorización expresa de Josué: primero en un proyecto independiente (E2-0) y,
--    después, en producción. Probado SOLO en un Postgres + PostgREST locales y desechables
--    (\`scripts/test-instalacion-horarios-postgrest.mjs\`).
--
-- Qué instala, en este orden y dentro de UNA transacción (si cualquier paso falla, no queda NADA instalado):
--   1. R1 (\`horarios-protegido.sql\`): la operación protegida, sus tres tablas y sus funciones.
--   2. La red de rescate (\`horarios-rescate.sql\`), SOLO para \`horarioTop\` (D1 b).
--   3. P4 (\`horarios-versiones-antiguas.sql\`): lo que guarde una versión antigua en \`horarioTop\` se aparta, no se aplica.
--   4. Una comprobación final: si falta una pieza o queda la regla de E1, se deshace todo.
-- Repetirla sobre una instalación que ya existe es seguro: no borra ninguna copia ni ninguna operación.
--
-- 📋 SECUENCIA DE PUBLICACIÓN (D3, secuencia B):
--   1. No tocar Horarios en ningún aparato desde aquí hasta el paso 4 (lo que se guarde con la versión antigua en el
--      horario quedará apartado: no se pierde, pero no se aplica hasta recuperarlo).
--   2. Ejecutar ESTE archivo entero (SQL Editor → pegar → Run). Debe terminar sin error.
--   3. Comprobar (con la sesión de un usuario): \`select public.protegido_protocolo() -> 'reglas'\` → rescate,
--      versionesAntiguas y horarioTop a \`true\`.
--   4. Publicar la versión nueva enseguida, esperar a que termine el despliegue y recargar la aplicación en todos los
--      aparatos.
--
-- ↩️ VUELTA ATRÁS (conserva TODAS las copias y el registro de operaciones), en este orden:
--   1. \`horarios-versiones-antiguas-deshacer.sql\` (quita P4). SIEMPRE ANTES del paso 2: con P4 activo, lo que guarde
--      la versión anterior en el horario se apartaría sin aplicarse y sin que nadie lo note.
--   2. Volver al despliegue anterior en Vercel. Lo que pise la versión anterior en el horario deja copia (la red).
--   3. Cuando se decida: \`horarios-rescate-deshacer.sql\` (quita la red; las copias se quedan).
--   R1 se queda instalado: la versión anterior no lo usa y no estorba.
--
-- ⛔ PROHIBIDO EN PRODUCCIÓN: \`horarios-protegido-deshacer.sql\` (borra las tablas con todas las copias y el registro)
--    e instalar \`horarios-regla-revision.sql\` (la regla de E1, sustituida por P4).
-- ═══════════════════════════════════════════════════════════════════════════
`;

const COMPROBACION = `-- ── 4 · Comprobación final, DENTRO de la transacción: si falta algo, se deshace todo ─────────────────────────────
do $$
declare
  v_falta text[] := array[]::text[];
begin
  if (select count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('protegido_aplicar', 'protegido_estado', 'protegido_leer',
        'protegido_copia_eliminar', 'protegido_copia_vista', 'protegido_espacio', 'protegido_protocolo')) <> 7 then
    v_falta := v_falta || 'las siete funciones de R1'::text;
  end if;
  if to_regclass('public.operaciones_protegidas') is null or to_regclass('public.copias_apartadas') is null
     or to_regclass('public.operaciones_corte') is null then
    v_falta := v_falta || 'las tres tablas de R1'::text;
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgname = 'horarios_rescate' and not tgisinternal and tgenabled <> 'D') then
    v_falta := v_falta || 'la red de rescate'::text;
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgname = 'horarios_versiones_antiguas' and not tgisinternal and tgenabled <> 'D') then
    v_falta := v_falta || 'el apartado de versiones antiguas (P4)'::text;
  end if;
  if exists (select 1 from pg_catalog.pg_trigger where tgname = 'horario_regla_revision') then
    v_falta := v_falta || 'quitar la regla de E1'::text;
  end if;
  if protegido_interno.claves_rescate() is distinct from array['horarioTop']::text[] then
    v_falta := v_falta || 'la red de rescate solo para horarioTop'::text;
  end if;
  if protegido_interno.claves_versiones_antiguas() is distinct from array['horarioTop']::text[] then
    v_falta := v_falta || 'P4 solo para horarioTop'::text;
  end if;
  if array_length(v_falta, 1) is not null then
    raise exception using errcode = 'P0001', message = 'instalacion_incompleta',
      detail = 'No se ha instalado nada. Falta: ' || array_to_string(v_falta, ', ');
  end if;
end;
$$;
`;

/** El texto de la instalación, a partir de las tres piezas tal como están en el repositorio. */
export function instalacionHorarios(leer = (r) => readFileSync(join(RAIZ, r), 'utf8')) {
  const partes = PIEZAS_INSTALACION.map((p, i) => {
    const t = leer(p.archivo).replace(/\s+$/, '');
    return `-- ── ${i + 1} · ${p.nombre} (\`${p.archivo}\`, sin cambios) ${'─'.repeat(Math.max(3, 70 - p.nombre.length - p.archivo.length))}\n${t}\n`;
  });
  return `${CABECERA}\nbegin;\n-- Si otra conexión tiene \`app_data\` bloqueada más de ${ESPERA_BLOQUEO}, se rinde y no instala nada (no se queda esperando\n-- con la aplicación parada).\nset local lock_timeout = '${ESPERA_BLOQUEO}';\n\n${partes.join('\n')}\n${COMPROBACION}\ncommit;\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(join(RAIZ, RUTA_INSTALACION), instalacionHorarios());
  console.log(`  ✓ ${RUTA_INSTALACION} generado (${PIEZAS_INSTALACION.length} piezas, en una transacción)`);
}
