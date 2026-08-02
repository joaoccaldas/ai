-- CaldasLog production-oriented starting schema.
-- Synthetic MVP only. Review with privacy/security counsel before real child data.

create extension if not exists pgcrypto;

create type public.household_role as enum ('owner', 'guardian', 'member', 'viewer');
create type public.source_kind as enum ('infomentor', 'myclub', 'email', 'calendar', 'manual');
create type public.item_kind as enum ('event', 'action', 'reference', 'wardrobe_need');
create type public.item_status as enum ('open', 'done', 'dismissed', 'cancelled');

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  retention_days integer not null default 90 check (retention_days between 7 and 365)
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text not null,
  birth_year smallint,
  color_token text,
  created_at timestamptz not null default now()
);

create table public.source_connections (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind public.source_kind not null,
  display_name text not null,
  external_account_ref text,
  auth_secret_ref text,
  read_scope jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  last_sync_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.source_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  connection_id uuid references public.source_connections(id) on delete set null,
  external_id text,
  source_created_at timestamptz,
  content_hash text not null,
  encrypted_payload_ref text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(connection_id, external_id)
);

create table public.family_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  source_item_id uuid references public.source_items(id) on delete set null,
  kind public.item_kind not null,
  status public.item_status not null default 'open',
  title text not null,
  summary text,
  starts_at timestamptz,
  due_at timestamptz,
  place_name text,
  action_url text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  requires_parent_confirmation boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  name text not null,
  category text not null,
  size_label text,
  state text not null default 'ready',
  location text,
  acquired_at date,
  review_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  object_type text not null,
  object_id text,
  decision jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index family_items_household_due_idx on public.family_items(household_id, due_at);
create index family_items_household_start_idx on public.family_items(household_id, starts_at);
create index source_items_expiry_idx on public.source_items(expires_at);
create index wardrobe_household_child_idx on public.wardrobe_items(household_id, child_id);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.children enable row level security;
alter table public.source_connections enable row level security;
alter table public.source_items enable row level security;
alter table public.family_items enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.audit_events enable row level security;

create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_guardian(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'guardian')
  );
$$;

create policy household_read on public.households
for select using (public.is_household_member(id));

create policy member_read on public.household_members
for select using (public.is_household_member(household_id));

create policy member_manage on public.household_members
for all using (public.is_household_guardian(household_id))
with check (public.is_household_guardian(household_id));

create policy child_household_access on public.children
for all using (public.is_household_member(household_id))
with check (public.is_household_guardian(household_id));

create policy connection_guardian_access on public.source_connections
for all using (public.is_household_guardian(household_id))
with check (public.is_household_guardian(household_id));

create policy source_item_household_read on public.source_items
for select using (public.is_household_member(household_id));

create policy family_item_household_access on public.family_items
for all using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy wardrobe_household_access on public.wardrobe_items
for all using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy audit_guardian_read on public.audit_events
for select using (public.is_household_guardian(household_id));

-- Service-role workers should insert source_items and audit_events through narrow,
-- validated functions rather than broad table access from the client.
-- A scheduled deletion job should purge expired source payloads and old audit data
-- according to documented policy, while preserving only the minimum required evidence.
