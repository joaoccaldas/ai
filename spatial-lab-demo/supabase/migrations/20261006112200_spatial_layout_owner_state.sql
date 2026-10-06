-- Applied to Supabase project mtvpnoqwjpoqaiocrklq on 2026-10-06.
-- Owner-scoped persistent 3D panel transforms only.
create table public.spatial_layout_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  scene_id text not null check (char_length(scene_id) between 1 and 128),
  schema_version integer not null default 1 check (schema_version between 1 and 100),
  layout jsonb not null default '{}'::jsonb check (jsonb_typeof(layout) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, scene_id)
);

comment on table public.spatial_layout_state is
  'Owner-scoped Spatial Lab panel transforms. Stores only bounded 3D layout state; no email, IP, user agent, precise location, or headset identifiers.';

alter table public.spatial_layout_state enable row level security;
alter table public.spatial_layout_state force row level security;

revoke all on table public.spatial_layout_state from authenticated;
revoke all on table public.spatial_layout_state from anon;
revoke all on table public.spatial_layout_state from public;
grant select, insert, update on table public.spatial_layout_state to authenticated;

create policy spatial_layout_select_own
on public.spatial_layout_state for select to authenticated
using ((select auth.uid()) = user_id);

create policy spatial_layout_insert_own
on public.spatial_layout_state for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy spatial_layout_update_own
on public.spatial_layout_state for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
