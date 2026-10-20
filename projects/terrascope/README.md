# TerraScope: NASA-data integration (research-grade ingestion)

This is a real data ingestion component for the Caldas Spatial Reality Compiler research. **Not** a submission, not a synthetic scene, and not proof that a rendered world matches physical reality.

## Fetch actual NASA observations

```sh
python3 projects/terrascope/power_ingest.py --latitude 19.6392 --longitude -155.9968 --start 20240101 --end 20240107 --parameters T2M,PRECTOTCORR --output /tmp/terrascope/kona-daily.json
python3 -m unittest discover -s projects/terrascope -p 'test_*.py' -v
```

The script performs an HTTPS request directly to NASA POWER, stores the untouched JSON body with a SHA-256 digest, retains original data units, tags missing measurements `null`, and provides a normalized day series for graphics/scene adapters. It refuses unsupported metrics and invalid coordinates. The NASA dataset is environmental analysis data, **not direct instrumentation from the exact chosen terrain point**.

Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/

## Acceptance gates before scene binding

1. Run the actual fetch; record HTTP success, source URL, payload hash, retrieval time, time standard and units.
2. Confirm measured coverage and null proportion. Check NASA dataset documentation for spatial/temporal resolution and modeled versus observational origins.
3. Independently fetch an overlapping period and verify consistency; flag changes in upstream data.
4. Reuse existing Studio-Kona terrain/renderer rather than create duplicate engines.
5. Overlay **data-linked** atmospheric displays only after a visual and uncertainty review. Never infer local rainfall, precise cloud geometry, or terrain from point grid weather series alone.
6. Capture actual device performance and camera-motion stability; archive before/after screenshots.
7. Match the official NASA Space Apps challenge prompt and submission requirements before publishing.

No external request was made merely by reviewing or testing this pull request. Normalized output is derived from an actual NASA response only when executed, not from the synthetic unit-test fixture.
