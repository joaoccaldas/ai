# Bay Performance V0.1

## Purpose
Turn Primary Bay V0.2 from a systems diagram into a measurable design-development object.

All calculations below are **proxies or stress tests**. None is structural, acoustic, drainage or energy certification.

## Solar-control proxy
SE-facing façade vertical-fin study explores:
- fin depth;
- clear spacing;
- fin rotation;
- direct-beam transmission on summer/equinox/winter representative days.

Output:
- `SOLAR_FIN_STUDY_001`.

Use:
select a plausible ceramic-screen geometry before detailed annual simulation.

## Structural thrust proxy
For a 9 m clear funicular span, 1.35 m rise and 5 m bay:
- roof-pressure scenarios are tested parametrically;
- reactions use a parabolic-funicular approximation.

Output:
- `STRUCTURAL_THRUST_PROXY_001`.

Use:
understand the reaction scale and support/frame conversation before FEA.

## Acoustic proxy
Sabine screen uses the 5 × 10 m bay volume to estimate the additional absorption required for candidate RT60 targets.

Output:
- `ACOUSTIC_BAY_PROXY_001`.

Use:
reserve enough underside area for real acoustic treatment instead of adding it after geometry freezes.

## Rainwater stress
One bay = 50 m² roof catchment.
Full bar = 450 m² roof catchment.

Runoff is tested across explicit rainfall-intensity stress cases.

Output:
- `RAINWATER_STRESS_001`.

Use:
keep gutters/downpipes and future storage/reuse space honest before code sizing.

## Next
1. validated annual solar/daylight simulation;
2. preliminary FEA;
3. acoustic-zone model across the whole market bar;
4. current official rainfall-intensity / CTE drainage sizing;
5. embodied-carbon/EPD comparison for the shortlisted roof systems.
