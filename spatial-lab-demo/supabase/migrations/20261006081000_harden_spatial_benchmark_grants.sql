-- Applied after live grant inspection showed Supabase default privileges on new tables.
-- Explicitly reduce authenticated to the two operations used by Spatial Lab evidence.
revoke all on table public.spatial_benchmarks from authenticated;
revoke all on table public.spatial_benchmarks from anon;
revoke all on table public.spatial_benchmarks from public;
grant select, insert on table public.spatial_benchmarks to authenticated;
