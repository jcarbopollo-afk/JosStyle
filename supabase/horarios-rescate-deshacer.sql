-- 🛟 HORARIOS · E1-R · R5 — quitar la red de rescate (vuelta atrás de `horarios-rescate.sql`).
-- ⛔ Como aquélla, NO se ejecuta en Supabase sin la autorización de Josué (E2).
-- No toca ningún dato: quita el disparador y sus funciones. Las copias de rescate que ya existan SE QUEDAN en
-- `copias_apartadas` (solo se eliminan a petición suya, H-10).
-- ⚠️ Orden de una vuelta atrás en producción: primero las reglas (P4), después volver a la versión anterior en Vercel,
--    y la red de rescate la última (mientras haya una versión antigua escribiendo, es lo que conserva lo que pise).
drop trigger if exists horarios_rescate on public.app_data;
drop function if exists protegido_interno.rescatar();
drop function if exists protegido_interno.claves_rescate();

-- Comprobación (solo lectura): no debe devolver ninguna fila.
-- select tgname from pg_trigger where tgname = 'horarios_rescate';
