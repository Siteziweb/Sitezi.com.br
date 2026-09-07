-- SITEZI V5 — Supabase schema
create extension if not exists "pgcrypto";

create table if not exists public.sitezi_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  business_type text not null,
  business_name text not null,
  slogan text,
  template text not null default 'modern',
  color text not null default '#1578ff',
  logo_mode text not null default 'text',
  logo_url text,
  image_mode text not null default 'none',
  services jsonb not null default '[]'::jsonb,
  whatsapp text,
  instagram text,
  location text,
  generated_html text,
  slug text unique,
  status text not null default 'draft' check (status in ('draft','generated','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sitezi_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.sitezi_projects(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('logo','photo','ai_image')),
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.sitezi_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.sitezi_projects(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('brand','logo','image','copy','layout')),
  prompt text,
  result jsonb,
  created_at timestamptz not null default now()
);

alter table public.sitezi_projects enable row level security;
alter table public.sitezi_assets enable row level security;
alter table public.sitezi_generations enable row level security;

drop policy if exists "projects_owner_all" on public.sitezi_projects;
create policy "projects_owner_all" on public.sitezi_projects
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "assets_owner_all" on public.sitezi_assets;
create policy "assets_owner_all" on public.sitezi_assets
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "generations_owner_all" on public.sitezi_generations;
create policy "generations_owner_all" on public.sitezi_generations
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
values ('sitezi-assets','sitezi-assets',true)
on conflict (id) do nothing;
