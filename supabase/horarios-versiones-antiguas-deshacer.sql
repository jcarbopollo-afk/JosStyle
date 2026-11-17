-- 🗂 HORARIOS · E1-R · R5 — quitar el apartado de las escrituras de versiones antiguas (vuelta atrás de
-- `horarios-versiones-antiguas.sql`). ⛔ Como aquélla, NO se ejecuta en Supabase sin la autorización de Josué (E2).
-- No toca ningún dato: quita el disparador y sus funciones. Las copias de versión antigua que ya existan SE QUEDAN en
-- `copias_apartadas` (solo se eliminan a petición suya, H-10). No vuelve a poner la regla de E1 (rechazar): H-23 la
-- sustituyó. Sin esta regla, una versión antigua vuelve a poder escribir `horarioTop`; si la red de rescate (P1)
-- sigue instalada, lo que pise queda a salvo.
drop trigger if exists horarios_versiones_antiguas on public.app_data;
drop function if exists protegido_interno.apartar_version_antigua();
drop function if exists protegido_interno.claves_versiones_antiguas();

-- Comprobación (solo lectura): no debe devolver ninguna fila.
-- select tgname from pg_trigger where tgname = 'horarios_versiones_antiguas';
