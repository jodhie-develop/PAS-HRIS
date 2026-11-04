-- Allow branches to be created before GPS is supplied, and identify the owner superadmin.
alter table public.office_locations
  alter column latitude drop not null,
  alter column longitude drop not null;

alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

update public.profiles p
set is_superadmin = true
from auth.users u
where p.id = u.id
  and lower(u.email) = 'mailadmin@prasastiindonesia.com';
