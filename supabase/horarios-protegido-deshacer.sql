-- ═══════════════════════════════════════════════════════════════════════════
-- 🛡 HORARIOS · E1-R · R1 — VUELTA ATRÁS de `horarios-protegido.sql`
--
-- ⛔ PROHIBIDO EN PRODUCCIÓN (decisión de Josué del 2026-11-18): BORRA TODAS LAS COPIAS APARTADAS Y EL REGISTRO DE
--    OPERACIONES. La vuelta atrás de producción es otra: quitar P4, volver a la versión anterior y, si se decide, quitar
--    la red de rescate (`horarios-instalacion.sql` lo explica). Este archivo es SOLO para el laboratorio local.
-- Quita las funciones, la guardia y las tablas propias.
-- ⚠️ BORRA las copias apartadas y el registro de operaciones: antes, si las hay, hay que guardarlas aparte
--    (consulta de abajo). `app_data` no se toca.
-- ⚠️ Si están instaladas la red de rescate o el apartado de versiones antiguas (R5), se van con el esquema
--    `protegido_interno` (sus disparadores dependen de sus funciones): quítalas antes con sus propios archivos.
-- ═══════════════════════════════════════════════════════════════════════════

-- Antes (solo lectura): ¿hay copias apartadas que conservar?
-- select user_id, id, tipo, creada_en, tamano from public.copias_apartadas order by creada_en;

drop function if exists public.protegido_protocolo();
drop function if exists public.protegido_aplicar(jsonb);
drop function if exists public.protegido_estado(uuid);
drop function if exists public.protegido_leer(text[]);
drop function if exists public.protegido_copia_eliminar(uuid);
drop function if exists public.protegido_copia_vista(uuid);
drop function if exists public.protegido_espacio();

drop table if exists public.operaciones_protegidas;
drop table if exists public.copias_apartadas;
drop table if exists public.operaciones_corte;

drop schema if exists protegido_interno cascade;

-- Comprobación (solo lectura): no debe devolver nada.
-- select proname from pg_proc where proname like 'protegido\_%';
-- select relname from pg_class where relname in ('operaciones_protegidas','copias_apartadas','operaciones_corte');
