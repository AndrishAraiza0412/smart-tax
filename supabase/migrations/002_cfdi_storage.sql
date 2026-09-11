insert into storage.buckets (id, name, public)
values ('cfdi-files', 'cfdi-files', false)
on conflict (id) do update set public = false;

create policy "users read own CFDI files" on storage.objects
for select to authenticated
using (bucket_id = 'cfdi-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "service role writes CFDI files" on storage.objects
for insert to service_role
with check (bucket_id = 'cfdi-files');
