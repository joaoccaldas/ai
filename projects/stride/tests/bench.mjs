#!/usr/bin/env node
/**
 * Deterministic performance benchmark harness for STRIDE Athlete Worlds (P1 gate).
 * Measures p50 / p95 latency and heap delta across:
 *   1. GPX parsing + normalization + split/moment analysis (10,000 points)
 *   2. 2D Elevation & HR profile construction (120 samples)
 *   3. Procedural 3D scenery corridor generation + privacy share planning
 */
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  parseGPX,
  analyze,
  buildElevationProfile,
  generateProceduralScenery,
  planPrivateShare,
} from '../core.mjs';

function makeSyntheticGpx(pointCount = 10000) {
  const parts = ['<gpx version="1.1"><trk><trkseg>'];
  const baseMs = Date.UTC(2026, 9, 20, 6, 0, 0);
  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const lat = (36.4 + 0.12 * t + 0.008 * Math.sin(12 * t)).toFixed(6);
    const lon = (-112.1 + 0.12 * t + 0.008 * Math.cos(12 * t)).toFixed(6);
    const ele = (40 + 180 * Math.sin(Math.PI * t) ** 2).toFixed(1);
    const hr = Math.round(132 + 28 * Math.sin(Math.PI * t));
    const ts = new Date(baseMs + i * 2000).toISOString();
    parts.push(`<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele><time>${ts}</time><hr>${hr}</hr></trkpt>`);
  }
  parts.push('</trkseg></trk></gpx>');
  return parts.join('');
}

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return { p50: Math.round(p50 * 100) / 100, p95: Math.round(p95 * 100) / 100 };
}

const xml10k = makeSyntheticGpx(10000);
const parseTimes = [];
const profileTimes = [];
const shareTimes = [];

let parsedRows = null;
for (let iter = 0; iter < 15; iter++) {
  const t0 = performance.now();
  parsedRows = parseGPX(xml10k);
  const model = analyze(parsedRows);
  parseTimes.push(performance.now() - t0);
  assert.equal(model.rows.length, 10000);

  const t1 = performance.now();
  const prof = buildElevationProfile(parsedRows, 120);
  const localGeo = parsedRows.map((p, idx) => ({ x: idx * 0.01, y: 1, z: idx * 0.01 }));
  generateProceduralScenery(localGeo, 'volcanic', 24);
  profileTimes.push(performance.now() - t1);
  assert.equal(prof.samples.length, 120);

  const t2 = performance.now();
  planPrivateShare(parsedRows, 700, [{ lat: parsedRows[5000].lat, lon: parsedRows[5000].lon, radiusMeters: 500 }]);
  shareTimes.push(performance.now() - t2);
}

const sParse = stats(parseTimes);
const sProfile = stats(profileTimes);
const sShare = stats(shareTimes);

const report = {
  schema: 'stride.benchmark.v1',
  points: 10000,
  iterations: 15,
  parseAndAnalyzeMs: sParse,
  profileAndSceneryMs: sProfile,
  privacySharePlanMs: sShare,
  heapUsedMb: Math.round((process.memoryUsage().heapUsed / (1024 * 1024)) * 10) / 10,
};

console.log(JSON.stringify(report, null, 2));

assert.ok(sParse.p95 < 120, `10k-point parse+analyze p95 (${sParse.p95}ms) exceeded 120ms budget`);
assert.ok(sProfile.p95 < 25, `Profile+scenery p95 (${sProfile.p95}ms) exceeded 25ms budget`);
assert.ok(sShare.p95 < 35, `Privacy share plan p95 (${sShare.p95}ms) exceeded 35ms budget`);
