-- Fotogalería: bucket de almacenamiento para las fotos de partidos.
-- No hay tabla: toda la metadata (fecha, sede, rival) va codificada en el
-- nombre de archivo y se parsea en src/hooks/useMatchPhotos.js.
-- Ejecutar una vez en el SQL Editor de Supabase.

insert into storage.buckets (id, name, public)
values ('matchphotos', 'matchphotos', true)
on conflict (id) do nothing;

drop policy if exists "Bucket matchphotos - lectura pública" on storage.objects;
create policy "Bucket matchphotos - lectura pública"
  on storage.objects for select
  using (bucket_id = 'matchphotos');

-- Rol para poder subir fotos desde la web (página /redaccion-fotos) sin
-- ser necesariamente redactor de noticias.
alter table profiles add column if not exists es_fotografo boolean not null default false;

drop policy if exists "Bucket matchphotos - subida autorizada" on storage.objects;
create policy "Bucket matchphotos - subida autorizada"
  on storage.objects for insert
  with check (
    bucket_id = 'matchphotos'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and (p.es_fotografo or p.es_redactor)
    )
  );

drop policy if exists "Bucket matchphotos - actualización autorizada" on storage.objects;
create policy "Bucket matchphotos - actualización autorizada"
  on storage.objects for update
  using (
    bucket_id = 'matchphotos'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and (p.es_fotografo or p.es_redactor)
    )
  );

-- Para dar acceso a la persona externa que sube las fotos:
--   update profiles set es_fotografo = true where id = '<user-id>';
