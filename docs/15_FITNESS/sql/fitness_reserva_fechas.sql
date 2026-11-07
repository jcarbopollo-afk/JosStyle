-- ═══════════════════════════════════════════════════════════════════════════
-- FITNESS 4/8 — RESERVA DE FECHAS (una sesión por fecha en el servidor)
-- ═══════════════════════════════════════════════════════════════════════════
-- 🚨 PREPARADO, NO EJECUTADO. No se pega en Supabase sin la autorización expresa
-- de Josué (PD-03). Diseño: ARQUITECTURA_TECNICA.md §13.4 (alternativa C).
--
-- Qué resuelve: hoy la regla de una sesión por fecha es SOLO DE CLIENTE
-- (`prepararSesionNueva` en src/lib/cumplimientoFitness.js). Con dos dispositivos a
-- la vez, el objeto único de `app_data` no puede impedir dos sesiones el mismo día;
-- si llegan, ninguna se borra y la segunda queda en conflicto. Esta tabla haría la
-- garantía real: la clave primaria (user_id, fecha) no admite una segunda reserva.
--
-- ⚠️ Ejecutarla NO basta: falta el código que reserva la fecha antes de crear la
-- sesión y la libera al descartarla (PD-10). Ese código no está escrito todavía,
-- porque sin la tabla no se puede probar contra el servidor. Es una entrega aparte.
--
-- Comprobación después de ejecutarla (debe devolver una fila con 'fitness_fechas'):
--   select tablename, rowsecurity from pg_tables where tablename = 'fitness_fechas';
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists fitness_fechas (
  user_id    uuid not null references auth.users(id) on delete cascade,
  fecha      date not null,
  sesion_id  text not null,
  creada_en  timestamptz not null default now(),
  primary key (user_id, fecha)
);

alter table fitness_fechas enable row level security;

create policy "fitness_fechas_select" on fitness_fechas for select using (auth.uid() = user_id);
create policy "fitness_fechas_insert" on fitness_fechas for insert with check (auth.uid() = user_id);
create policy "fitness_fechas_delete" on fitness_fechas for delete using (auth.uid() = user_id);
-- Sin política de update: una reserva no se cambia; se borra al descartar la sesión (PD-10).
