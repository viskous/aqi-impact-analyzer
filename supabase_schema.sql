-- Run this in Supabase: SQL Editor → New query → Run
-- Then enable anon access with Row Level Security policies below.

create table if not exists public.pollution_reports (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  location_label text,
  pollution_type text not null,
  description text not null,
  image_evidence text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists pollution_reports_created_at_idx
  on public.pollution_reports (created_at desc);

alter table public.pollution_reports enable row level security;

-- Public read (map) and insert (report form). Adjust if you add auth later.
create policy "Allow public read pollution_reports"
  on public.pollution_reports for select
  using (true);

create policy "Allow public insert pollution_reports"
  on public.pollution_reports for insert
  with check (true);
