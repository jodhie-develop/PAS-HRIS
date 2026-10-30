-- Track HR review status for employee submitted documents.
alter table public.documents
  add column if not exists status text not null default 'pending',
  add column if not exists accepted_by uuid references auth.users(id) on delete set null,
  add column if not exists accepted_at timestamptz;

alter table public.documents
  add constraint documents_status_check check (status in ('pending', 'accepted'));

create policy "HR admins accept employee documents" on public.documents
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr_admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'hr_admin')
  );
