-- Schéma Supabase pour l'application Liste de courses
-- Exécuter dans l'éditeur SQL du dashboard Supabase

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#FFD60A',
  position integer not null default 0,
  is_checked boolean not null default false,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity text,
  unit text,
  notes text,
  position integer not null default 0,
  is_checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_user_position_idx on categories (user_id, position);
create index if not exists items_category_position_idx on items (category_id, position);
create index if not exists items_user_idx on items (user_id);

alter table categories enable row level security;
alter table items enable row level security;

create policy "categories_select_own" on categories
  for select using (auth.uid() = user_id);

create policy "categories_insert_own" on categories
  for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on categories
  for update using (auth.uid() = user_id);

create policy "categories_delete_own" on categories
  for delete using (auth.uid() = user_id);

create policy "items_select_own" on items
  for select using (auth.uid() = user_id);

create policy "items_insert_own" on items
  for insert with check (auth.uid() = user_id);

create policy "items_update_own" on items
  for update using (auth.uid() = user_id);

create policy "items_delete_own" on items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Synchronisation temps réel (nouvelle installation OU base déjà existante)
-- Si les tables existent déjà, exécuter uniquement : supabase/enable-realtime.sql
-- ---------------------------------------------------------------------------
alter table categories replica identity full;
alter table items replica identity full;

do $$
begin
  alter publication supabase_realtime add table categories;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table items;
exception
  when duplicate_object then null;
end $$;
