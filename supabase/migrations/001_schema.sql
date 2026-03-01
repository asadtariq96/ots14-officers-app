-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Shared updated_at trigger function
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.officers (
  id             uuid        primary key default gen_random_uuid(),
  pa_no          text        not null,
  rank           text        not null,
  name           text        not null,
  arm_service    text,
  unit           text,
  phone          text,
  address        text,
  email          text,
  city           text,
  nok_contact    text,
  status         text        not null default 'active'
                             check (status in ('active', 'deceased')),
  batch          text        not null default '14_ots'
                             check (batch in ('14_ots', '15_ots_passout')),
  profile_pic_url text,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);

create unique index officers_pa_no_key on public.officers (pa_no);

create trigger trg_officers_set_updated_at
before update on public.officers
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
create table public.subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  officer_id uuid        not null references public.officers(id) on delete cascade,
  year       integer     not null,
  amount     numeric,
  status     text        not null default 'pending'
                         check (status in ('paid', 'unpaid', 'pending')),
  remarks    text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (officer_id, year)
);

create index subscriptions_officer_idx on public.subscriptions (officer_id);
create index subscriptions_year_idx    on public.subscriptions (year);

create trigger trg_subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text        not null default 'viewer'
                         check (role in ('admin', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Auto-create profile row on sign-up
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Helper: current user's role
-- ─────────────────────────────────────────────────────────────
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────
alter table public.officers      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profiles      enable row level security;

revoke all on public.officers      from anon, authenticated;
revoke all on public.subscriptions from anon, authenticated;
revoke all on public.profiles      from anon, authenticated;

-- Officers
create policy "officers_select_authenticated"
  on public.officers for select to authenticated using (true);

create policy "officers_admin_mutation"
  on public.officers for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Subscriptions
create policy "subscriptions_select_authenticated"
  on public.subscriptions for select to authenticated using (true);

create policy "subscriptions_admin_mutation"
  on public.subscriptions for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Profiles
create policy "profiles_self_select"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_admin_select"
  on public.profiles for select to authenticated
  using (public.current_role() = 'admin');

create policy "profiles_admin_update"
  on public.profiles for update to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for profile pictures
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('profile-pics', 'profile-pics', true)
on conflict (id) do nothing;

drop policy if exists "profile_pics_read_authenticated" on storage.objects;
create policy "profile_pics_read_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-pics');

drop policy if exists "profile_pics_admin_insert" on storage.objects;
create policy "profile_pics_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-pics' and public.current_role() = 'admin');

drop policy if exists "profile_pics_admin_update" on storage.objects;
create policy "profile_pics_admin_update"
  on storage.objects for update to authenticated
  using  (bucket_id = 'profile-pics' and public.current_role() = 'admin')
  with check (bucket_id = 'profile-pics' and public.current_role() = 'admin');

drop policy if exists "profile_pics_admin_delete" on storage.objects;
create policy "profile_pics_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-pics' and public.current_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.officers      to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select,                  update on public.profiles      to authenticated;
