-- Store employee-reviewed identity fields read from KTP images.
alter table public.documents
  add column if not exists extracted_nik text,
  add column if not exists extracted_name text,
  add column if not exists extracted_address text;
