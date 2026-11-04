-- Extend employee profiles for the source roster data.
alter table public.profiles
  add column if not exists nip text,
  add column if not exists address text,
  add column if not exists birth_date date;

create unique index if not exists profiles_nip_unique
  on public.profiles (nip)
  where nip is not null and btrim(nip) <> '';
