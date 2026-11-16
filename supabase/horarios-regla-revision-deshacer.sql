-- 🛡 HORARIOS · TP-15 B — quitar la regla del servidor sobre `horarioTop` (vuelta atrás de
-- `horarios-regla-revision.sql`). ⛔ Como aquélla, NO se ejecuta en Supabase sin la autorización de Josué (E2).
-- No toca ningún dato: solo quita el disparador y su función.
drop trigger if exists horario_regla_revision on public.app_data;
drop function if exists public.horario_regla_revision();

-- Comprobación (solo lectura): no debe devolver ninguna fila.
-- select tgname from pg_trigger where tgname = 'horario_regla_revision';
