-- Employee owned documents and HR managed document type choices.
alter table public.documents add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.document_types (name) values ('KTP'), ('KSK') on conflict (name) do nothing;

alter table public.document_types enable row level security;
create policy "Authenticated users can view document types" on public.document_types
  for select to authenticated using (true);
create policy "HR admins manage document types" on public.document_types
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr_admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr_admin')
  );

create policy "Users view own documents and HR views all" on public.documents
  for select to authenticated using (
    user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr_admin')
  );
create policy "Users add own documents" on public.documents
  for insert to authenticated with check (user_id = auth.uid() and uploaded_by = auth.uid());

-- Files are stored under <user-id>/<timestamp>-<filename> in the existing documents bucket.
create policy "Users upload own documents" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users read own documents and HR reads all" on storage.objects
  for select to authenticated using (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text or
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr_admin')
    )
  );
