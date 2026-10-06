-- Applied to Supabase project mtvpnoqwjpoqaiocrklq on 2026-10-06.
-- Spatial Lab owner-scoped performance evidence only.
create table public.spatial_benchmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scene_id text not null check (char_length(scene_id) between 1 and 128),
  release_sha text not null check (release_sha ~ '^[0-9a-f]{40}$'),
  asset_state text check (asset_state is null or char_length(asset_state) <= 64),
  quality_mode text not null check (quality_mode in ('auto','low','balanced','high','ultra')),
  quality_tier text check (quality_tier is null or quality_tier in ('low','balanced','high','ultra')),
  dpr numeric(4,2) not null check (dpr between 0.25 and 4.00),
  approx_fps numeric(7,2) not null check (approx_fps between 0.1 and 240),
  avg_ms numeric(8,3) not null check (avg_ms between 0.1 and 1000),
  p50_ms numeric(8,3) not null check (p50_ms between 0.1 and 1000),
  p95_ms numeric(8,3) not null check (p95_ms between 0.1 and 1000),
  p99_ms numeric(8,3) not null check (p99_ms between 0.1 and 1000),
  draw_calls integer not null check (draw_calls between 0 and 1000000),
  triangles bigint not null check (triangles between 0 and 10000000000),
  viewport_width integer not null check (viewport_width between 1 and 20000),
  viewport_height integer not null check (viewport_height between 1 and 20000),
  hardware_concurrency integer check (hardware_concurrency is null or hardware_concurrency between 1 and 1024),
  device_memory_gb numeric(6,2) check (device_memory_gb is null or device_memory_gb between 0.1 and 2048),
  webxr boolean not null default false,
  webgpu boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.spatial_benchmarks is
  'Owner-scoped Caldas Spatial Lab performance evidence. Stores scene/release/render metrics and coarse capability fields only; no email, IP, user agent, precise location or raw interaction text.';

alter table public.spatial_benchmarks enable row level security;
alter table public.spatial_benchmarks force row level security;

revoke all on table public.spatial_benchmarks from anon;
revoke all on table public.spatial_benchmarks from public;
grant select, insert on table public.spatial_benchmarks to authenticated;

create policy spatial_benchmarks_select_own
on public.spatial_benchmarks for select to authenticated
using ((select auth.uid()) = user_id);

create policy spatial_benchmarks_insert_own
on public.spatial_benchmarks for insert to authenticated
with check ((select auth.uid()) = user_id);

create index spatial_benchmarks_user_created_idx
  on public.spatial_benchmarks (user_id, created_at desc);

create index spatial_benchmarks_user_scene_created_idx
  on public.spatial_benchmarks (user_id, scene_id, created_at desc);
