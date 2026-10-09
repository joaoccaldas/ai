# Structural Form-Finding V2

## Why this exists

The Living Threshold roof is not curved because curved forms look like Gaudí. The curvature is selected from a funicular load path.

For the 9.0 m clear span and a design-development 1.5 kPa roof-pressure case across a 5.0 m tributary bay:

- line load: **7.50 kN/m**
- selected rise: **1.35 m** (f/L = 0.150)
- horizontal reaction: **56.25 kN/support**
- vertical reaction: **33.75 kN/support**
- resultant at springing: **65.60 kN/support**
- support resultant angle: **30.96°**

For a parabolic funicular under uniform vertical line load, the springing tangent angle and reaction angle coincide. The numerical residual here is **0.000000°**, which is the internal equilibrium cross-check.

## Why 1.35 m rise is meaningful

The sensitivity family keeps span and load fixed and changes only rise. At f/L 0.10, horizontal thrust is **84.38 kN/support**. At the chosen 0.15 it falls to **56.25 kN/support**. At 0.20 it is **42.19 kN/support**.

This makes the trade explicit: a shallower roof reduces height but rapidly increases horizontal thrust; a deeper funicular reduces thrust but changes enclosure, sightline and civic scale.

## Load path

1. roof pressure becomes distributed vertical line load;
2. the funicular shell carries that load primarily through compression;
3. the springing block and replaceable bearing receive vertical + horizontal reactions;
4. the primary pier/foundation carries those reactions to ground, or the scheme must declare an explicit tie/frame alternative.

## J01 consistency

The physical-detail gate already separates the primary pier, springing block, movement/bearing layer and shell. Waterproofing, gutter, ceramic fins, MEP rail and acoustic inserts remain secondary and replaceable, so the force path is not confused with maintenance layers.

## Claim boundary

This is design-development structural logic, not certification. It does not replace FEA, code load combinations, material nonlinearities, shell buckling/stability, reinforcement sizing, foundations, seismic/wind checks, or review by a qualified structural engineer.
