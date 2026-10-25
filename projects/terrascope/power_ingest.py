#!/usr/bin/env python3
"""Ingest real NASA POWER daily point observations; no fabricated measurements."""
import argparse
import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"
ALLOWED = {"T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN", "RH2M", "WS10M"}

def url_for(latitude, longitude, start, end, parameters):
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise ValueError("invalid coordinates")
    for stamp in (start, end):
        if len(stamp) != 8 or not stamp.isdigit():
            raise ValueError("dates must be YYYYMMDD")
        date(int(stamp[:4]), int(stamp[4:6]), int(stamp[6:]))
    if start > end or not parameters or set(parameters) - ALLOWED:
        raise ValueError("invalid date range or parameters")
    query = {"parameters": ",".join(parameters), "community": "RE", "longitude": longitude,
             "latitude": latitude, "start": start, "end": end, "format": "JSON", "time-standard": "UTC"}
    return BASE + "?" + urlencode(query)

def normalize(payload, parameters):
    if not isinstance(payload, dict):
        raise ValueError("POWER response is not an object")
    record = payload.get("properties", {}).get("parameter")
    if not isinstance(record, dict):
        raise ValueError("POWER parameter data missing")
    units = payload.get("parameters", {})
    rows = {}
    for p in parameters:
        series = record.get(p)
        if not isinstance(series, dict) or not series:
            raise ValueError("missing or empty POWER parameter: " + p)
        for day, value in series.items():
            if not (isinstance(day, str) and len(day) == 8 and day.isdigit()):
                raise ValueError("invalid daily timestamp")
            if not (value is None or isinstance(value, (float, int))):
                raise ValueError("non-numeric POWER measurement")
            missing = value is None or value <= -900
            rows.setdefault(day, {})[p] = None if missing else value
    return {"time_standard": "UTC", "units": {p: units.get(p, {}).get("units", "unknown") for p in parameters},
            "observations": [{"date": k, **rows[k]} for k in sorted(rows)]}

def ingest(url, destination, parameters, opener=urlopen):
    request = Request(url, headers={"User-Agent": "CaldasSpatial-TerraScope/0.1"})
    with opener(request, timeout=45) as response:
        raw = response.read(12_000_001)
    if len(raw) > 12_000_000:
        raise ValueError("POWER response exceeds budget")
    payload = json.loads(raw)
    normalized = normalize(payload, parameters)
    manifest = {"schema": "caldas.terrascope.nasa-power/v1", "source": "NASA POWER",
                "source_url": url, "retrieved_utc": datetime.now(timezone.utc).isoformat(),
                "raw_sha256": hashlib.sha256(raw).hexdigest(), "classification": "observed_or_model_assimilated_source_data",
                "note": "NASA POWER grid-based data are not local ground-truth sensor measurements.",
                **normalized}
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    destination.with_suffix(".raw.json").write_bytes(raw)
    return manifest

def main():
    parser = argparse.ArgumentParser(description="Ingest and preserve NASA POWER provenance")
    parser.add_argument("--latitude", type=float, required=True)
    parser.add_argument("--longitude", type=float, required=True)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--parameters", default="T2M,PRECTOTCORR")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    params = args.parameters.split(",")
    url = url_for(args.latitude, args.longitude, args.start, args.end, params)
    data = ingest(url, args.output, params)
    print(json.dumps({"source_url": url, "days": len(data["observations"]), "raw_sha256": data["raw_sha256"]}))
if __name__ == "__main__":
    main()
