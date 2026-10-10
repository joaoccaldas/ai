# Living Threshold — coordinated two-level candidate

Built 9 October 2026; review and reusable physics follow-up 10 October.
This candidate is separate from canonical architecture and preserves the earlier
V1 coordination study. It resolves a specific geometric contradiction: the
4.5 m upper floor in the documented A+ scheme did not fit beneath the source roof.

## Geometry and programme

The existing 45 × 10 m bar footprints, centres and 44.14° orientation remain.
Four actual floor meshes contain the declared stair and lift openings. Four
switchback stairs rise 4.5 m in 26 risers. Two lift shafts remain reservations.
The new 9 m roof underside follows the declared parabolic profile, with 1.35 m
rise above an 8.3 m springing. The shell's top datum is 9.83 m. Vertical thickness
is a geometric convention, not a certified shell thickness.

Measured horizontal slab surface is **1,644.295745 m²**, within the brief's numeric
1,500–2,000 m² range. It is not certified GFA or net usable programme area.
Non-overlapping local polygons allocate every slab cell once, excluding upper
voids. The allocation is gross and includes circulation within each category.

| Category | Allocated slab surface, m² | Share | Brief's approximate share |
| --- | ---: | ---: | ---: |
| Market and neighborhood | 734.700 | 44.68% | 45% |
| Interpretation and viewpoint | 412.448 | 25.08% | 25% |
| Meeting point / cooking | 247.200 | 15.03% | 15% |
| Administration, logistics and services | 249.948 | 15.20% | 15% |

Twenty 2.5 × 2.4 m stalls fit between servicing and the east stair core. The
earlier 3 m contract and 2.7 m source frontages did not fit; neither original is
overwritten. Shared stall frames, cabinets and supported produce displays are
used. Two independent 90 m² teaching-room layouts contain two working islands
and twenty participant footprint reservations each. Separate entrances and a
separating wall are modeled. Eight administration desks occupy the upper Hard
bar's service zone. These geometric arrangements do not certify occupancy,
equipment standards, exhaust/fire design or accessibility.

## Visual and physical expression

Mineral piers and roof ribs articulate the two-level section. Upper guard rails,
replaceable ceramic screens, service gutters and downpipes are separate systems.
Ground-market pendants attach to the actual upper slab underside. Restrained
shared figures replace the close-up legacy market figures in this candidate.
Municipal geometry stays as documented massing; no invented cathedral sculpture
is added. Original architecture, market fixtures and superseded diagnostics are
retained but hidden in the derived candidate, with original signatures preserved.

## Checked evidence

- Eleven shared architecture checks pass, including closed/outward vault geometry,
  actual profile vertices, measured programme partition, overlap/gap rejection,
  floor openings and detection of the original low-roof conflict.
- Actual imported stairs, midlandings and top landings have minimum sampled
  vertical clearance **4.228909 m** against the new upper slabs and roofs. This
  is a sampled geometric clearance, not regulatory approval.
- All **2,090 incoming non-camera scene signatures** remain intact, including
  the 1,600 original source objects. The source binary remains unchanged.
- All nine protected F3 rays first reach municipal geometry, with no intervention
  blocker. The seasonal check finds zero intervention shadow blockers across
  54 rays. These small sample sets do not certify all views or annual conditions.
- The coordination GLB is 1,907,508 bytes, 34 nodes, and has zero Khronos errors
  or warnings. It uses constant PBR approximations.
- Nineteen project tests pass. No Mac render was invoked.

## Reusable collision layer

`studio/scene_kit/collision.py` now accepts actual stall width/depth/height instead
of assuming the earlier fixed module. `scripts/build_collision_world.py` supports
both earlier kit scenes and this coordinated candidate. It retains actual floor
openings and stair treads, rather than substituting closed building boxes.

The candidate exports 47 static profiles: 13 trunks, 6 seating gardens, 20 stalls,
4 floors and 4 stairs. Its GLB is 413,980 bytes, with zero Khronos errors or
warnings. Three horizontal rays at local aisle Y = −1.59, 0, +1.59 m traverse
25.45 m without hitting stall colliders. These are sampled route checks, not a
complete pedestrian-body sweep. Friction/restitution are suggested parameters.
Remaining site/building/guard colliders, controller integration, walking routes,
crowd simulation and runtime performance remain unverified.

## Remote review

[Run 37922878752](https://github.com/joaoccaldas/ai/actions/runs/37922878752)
rendered arrival, market and plaza from one prepared scene in 5m09s. Total runner
usage is approximately 27m26s of the approved 65 minutes. The job cap was 20
minutes. Artifact download and actual pixel review must precede visual approval.

Remaining design work includes usable-area/occupancy and servicing reconciliation,
installed lift/access strategy, complete egress/guard details, engineering,
site-level promotion, annual environmental analysis, interpretation-space fit-out,
visual approval and the anonymous competition boards. No winning score is asserted.
