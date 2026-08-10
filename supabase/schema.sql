-- Ejecuta esto en Supabase: panel del proyecto -> SQL Editor -> pega y dale a "Run".

-- Tabla genérica de almacenamiento por usuario y "clave" (mismo concepto que se usaba
-- antes con window.storage, pero ahora en una base de datos real con seguridad por fila).
create table if not exists app_data (
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table app_data enable row level security;

create policy "select propio" on app_data
  for select using (auth.uid() = user_id);

create policy "insert propio" on app_data
  for insert with check (auth.uid() = user_id);

create policy "update propio" on app_data
  for update using (auth.uid() = user_id);

create policy "delete propio" on app_data
  for delete using (auth.uid() = user_id);

-- Con esto activo, cada usuario solo puede leer y escribir sus propias filas,
-- aunque haya más de un usuario en el futuro usando la misma base de datos.


-- ============================================================
-- Fase 3 — Salud: bucket de Storage privado para fotos de progreso.
-- Cada foto se guarda en una ruta "carpeta-del-usuario/archivo.jpg", y las políticas
-- de abajo solo dejan a cada usuario leer/escribir/borrar dentro de SU PROPIA carpeta.
-- El bucket es privado (public = false): las fotos se sirven con URLs firmadas de corta
-- duración desde el cliente, nunca con una URL pública fija.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('progreso', 'progreso', false)
on conflict (id) do nothing;

create policy "Subir fotos propias"
on storage.objects for insert
with check (bucket_id = 'progreso' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Ver fotos propias"
on storage.objects for select
using (bucket_id = 'progreso' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Borrar fotos propias"
on storage.objects for delete
using (bucket_id = 'progreso' and (storage.foldername(name))[1] = auth.uid()::text);

-- Nota para quien ejecute esto: si ya ejecutaste la Fase 2 antes, solo hace falta
-- pegar y ejecutar ESTE bloque nuevo (desde "Fase 3" hacia abajo) — no hace falta
-- volver a ejecutar las líneas de arriba, que ya se crearon la primera vez.


-- ============================================================
-- Fase 5 — Calistenia a fondo: bucket de Storage privado para los vídeos de técnica.
-- Mismo patrón exacto que el bucket "progreso" de la Fase 3: privado, una carpeta por usuario,
-- URLs firmadas de corta duración (se usan también para extraer fotogramas en el navegador
-- antes de mandarlos a la IA — nunca se manda el vídeo entero a la IA, solo fotogramas sueltos).
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('entrenamiento-videos', 'entrenamiento-videos', false, 104857600, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "Subir vídeos propios"
on storage.objects for insert
with check (bucket_id = 'entrenamiento-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Ver vídeos propios"
on storage.objects for select
using (bucket_id = 'entrenamiento-videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Borrar vídeos propios"
on storage.objects for delete
using (bucket_id = 'entrenamiento-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Igual que antes: si ya ejecutaste las fases anteriores, pega y ejecuta SOLO este
-- bloque de la Fase 5 — no hace falta repetir nada de lo de arriba.


-- ============================================================
-- Fase 11 — Biblioteca: bucket de Storage privado para PDFs, vídeos y fotos de referencia
-- (apuntes, material de instituto, etc). Mismo patrón exacto que "progreso" y
-- "entrenamiento-videos": privado, una carpeta por usuario, URL firmada de corta duración.
-- Un único bucket para los tres tipos de archivo — el tipo se guarda aparte, en el propio
-- registro de la app (clave "bibliotecaArchivos" en app_data), no en Storage.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('biblioteca', 'biblioteca', false, 104857600, array['application/pdf', 'video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "Subir archivos propios de biblioteca"
on storage.objects for insert
with check (bucket_id = 'biblioteca' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Ver archivos propios de biblioteca"
on storage.objects for select
using (bucket_id = 'biblioteca' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Borrar archivos propios de biblioteca"
on storage.objects for delete
using (bucket_id = 'biblioteca' and (storage.foldername(name))[1] = auth.uid()::text);

-- Igual que antes: si ya ejecutaste las fases anteriores, pega y ejecuta SOLO este
-- bloque de la Fase 11 — no hace falta repetir nada de lo de arriba.
