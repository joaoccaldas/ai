-- Applied to Supabase project mtvpnoqwjpoqaiocrklq on 2026-10-06.
-- Distinguish browser/API capability from an actually active immersive XR benchmark window.
alter table public.spatial_benchmarks
  add column xr_active boolean not null default false,
  add column xr_frame_rate numeric(7,2)
    check (xr_frame_rate is null or (xr_frame_rate >= 30 and xr_frame_rate <= 240));

comment on column public.spatial_benchmarks.xr_active is
  'True only when the measured benchmark window ran inside an active immersive WebXR session.';
comment on column public.spatial_benchmarks.xr_frame_rate is
  'WebXR session-reported frame rate when exposed by the browser; null for flat-screen or unavailable data.';
