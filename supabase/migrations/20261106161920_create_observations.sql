-- G7 economic observations: one value per country, indicator and year.
create table public.observations (
  id         bigint generated always as identity primary key,
  country    text    not null,
  indicator  text    not null,
  year       integer not null check (year between 1900 and 2100),
  value      double precision,
  created_at timestamptz not null default now(),
  unique (country, indicator, year)
);

alter table public.observations enable row level security;

-- Public read-only: anyone may select; no insert/update/delete policies exist,
-- so writes are denied for anon and authenticated (service role bypasses RLS).
create policy "Public can read observations"
  on public.observations for select
  to anon, authenticated
  using (true);

revoke insert, update, delete, truncate on public.observations from anon, authenticated;
