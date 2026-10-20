import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGPX,
  parseTCX,
  parseFIT,
  fitCRC16,
  analyze,
  haversine,
  shareSafe,
  planPrivateShare,
  loadActivity,
  toActivitySpec,
  toMomentSpecs,
  compareActivities,
  ALGORITHM_VERSION,
} from '../core.mjs';

const gpx = `<gpx><trk><trkseg><trkpt lat="59.35" lon="17.85"><ele>12</ele><time>2026-10-19T08:00:00Z</time></trkpt><trkpt lat="59.355" lon="17.85"><ele>20</ele><time>2026-10-19T08:03:00Z</time></trkpt><trkpt lat="59.36" lon="17.85"><ele>18</ele><time>2026-10-19T08:06:00Z</time></trkpt></trkseg></trk></gpx>`;

test('GPX route and metrics', () => {
  const a = analyze(parseGPX(gpx));
  assert.equal(a.rows.length, 3);
  assert.ok(a.distance > 1000 && a.distance < 1200);
  assert.equal(a.ascent, 8);
  assert.equal(a.descent, 2);
  assert.equal(a.duration, 360);
  assert.equal(a.bins.length, 1);
  assert.equal(a.fastest.km, 1);
});

test('TCX parsing and HR', () => {
  const tcx = `<TrainingCenterDatabase><Activities><Activity><Lap><Track><Trackpoint><Time>2026-10-19T08:00:00Z</Time><Position><LatitudeDegrees>59.35</LatitudeDegrees><LongitudeDegrees>17.85</LongitudeDegrees></Position><HeartRateBpm><Value>150</Value></HeartRateBpm></Trackpoint><Trackpoint><Time>2026-10-19T08:02:00Z</Time><Position><LatitudeDegrees>59.355</LatitudeDegrees><LongitudeDegrees>17.85</LongitudeDegrees></Position><HeartRateBpm><Value>155</Value></HeartRateBpm></Trackpoint></Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
  assert.equal(analyze(parseTCX(tcx)).avgHR, 152.5);
});

test('malformed input fails closed', () => {
  assert.throws(() => parseGPX('<gpx/>'), /No usable/);
  assert.throws(() => loadActivity('evil.js', ''), /Unsupported/);
  assert.throws(() => parseFIT(new ArrayBuffer(10)), /too small/);
});

test('share policy removes traveled endpoints and endpoint proximity zones', () => {
  const arr = Array.from({ length: 30 }, (_, i) => ({ lat: 59 + i * 0.001, lon: 17, t: i * 60, ele: 12 }));
  const plan = planPrivateShare(arr, 700);
  const safe = shareSafe(arr, 700);
  assert.ok(plan.redactedPoints > 0);
  assert.equal(safe.length, 1);
  assert.ok(safe[0][0].lat > arr[0].lat);
  assert.ok(safe[0].at(-1).lat < arr.at(-1).lat);
  assert.equal(safe[0].length, plan.retainedPoints);
});

test('return visits near the home coordinate are hidden, not reconnected', () => {
  const meters = [0, 250, 500, 750, 1000, 1250, 1500, 1700, 1300, 900, 500, 200, 100, 600, 950, 1250, 1550, 1850, 2100, 2300, 1900, 1300, 700, 0];
  const arr = meters.map((m, i) => ({ lat: 59 + m / 111200, lon: 17, t: i * 70, ele: 10 }));
  const plan = planPrivateShare(arr, 700);
  assert.ok(plan.segments.length >= 2, 'a mid-route home return splits the export into separate drawn paths');
  const indices = plan.segments.flat();
  assert.ok(!indices.includes(10) && !indices.includes(11) && !indices.includes(12));
  for (const i of indices) {
    assert.ok(haversine(arr[0], arr[i]) >= 700, 'no visible point within start privacy zone');
    assert.ok(haversine(arr.at(-1), arr[i]) >= 700, 'no visible point within finish privacy zone');
  }
  for (const segment of plan.segments) {
    assert.ok(segment.length >= 2);
    for (let i = 1; i < segment.length; i++) assert.equal(segment[i], segment[i - 1] + 1, 'no line may cross hidden points');
  }
  const safe = shareSafe(arr, 700);
  assert.equal(safe.length, plan.segments.length);
});

test('closed local circuits fail closed and privacy trim cannot silently shrink', () => {
  const points = Array.from({ length: 30 }, (_, i) => ({
    lat: 59 + 0.003 * Math.sin((i * Math.PI * 2) / 29),
    lon: 17 + 0.003 * Math.cos((i * Math.PI * 2) / 29),
    t: i * 30,
    ele: 12,
  }));
  assert.equal(planPrivateShare(points, 700).segments.length, 0);
  assert.throws(() => planPrivateShare(points, 250), /at least 700/);
});

test('distance symmetry', () => {
  const a = { lat: 0, lon: 0 };
  const b = { lat: 0, lon: 1 };
  assert.equal(haversine(a, b), haversine(b, a));
});

test('FIT record parsing', () => {
  const bytes = new Uint8Array(14 + 15 + 13 * 2 + 2);
  const d = new DataView(bytes.buffer);
  bytes[0] = 14;
  d.setUint32(4, 15 + 26, true);
  bytes.set([46, 70, 73, 84], 8);
  let j = 14;
  bytes.set([0x40, 0, 0, 20, 0, 3, 0, 4, 0x85, 1, 4, 0x85, 253, 4, 0x86], j);
  j += 15;
  for (const [lat, lon, t] of [
    [59.35, 17.85, 1200000000],
    [59.36, 17.85, 1200000360],
  ]) {
    bytes[j++] = 0;
    d.setInt32(j, Math.round((lat * 2147483648) / 180), true);
    j += 4;
    d.setInt32(j, Math.round((lon * 2147483648) / 180), true);
    j += 4;
    d.setUint32(j, t, true);
    j += 4;
  }
  const rows = parseFIT(bytes.buffer);
  assert.equal(rows.length, 2);
  assert.ok(Math.abs(rows[0].lat - 59.35) < 0.00001);
});

test('P0 parser correctness corpus: GPS jumps, out-of-order timestamps, null-island dropouts, and missing HR/elevation', () => {
  const noisyGpx = `<gpx><trk><trkseg>
    <trkpt lat="59.350" lon="17.850"><ele>10</ele><time>2026-10-19T08:00:00Z</time></trkpt>
    <trkpt lat="0.00000001" lon="0.00000001"><ele>10</ele><time>2026-10-19T08:00:10Z</time></trkpt>
    <trkpt lat="59.950" lon="18.950"><ele>12</ele><time>2026-10-19T08:00:15Z</time></trkpt>
    <trkpt lat="59.355" lon="17.850"><ele>15</ele><time>2026-10-19T07:59:00Z</time></trkpt>
    <trkpt lat="59.355" lon="17.850"><ele>99999</ele><time>2026-10-19T08:02:30Z</time><hr>300</hr></trkpt>
    <trkpt lat="59.360" lon="17.850"><time>2026-10-19T08:05:00Z</time></trkpt>
  </trkseg></trk></gpx>`;
  const rows = parseGPX(noisyGpx);
  assert.equal(rows.length, 3, 'null-island dropout, impossible >65 m/s jump, and out-of-order timestamp rejected');
  assert.equal(rows[1].ele, null, 'unrealistic 99,999 m altitude sanitized to null');
  assert.equal(rows[1].hr, null, 'unrealistic 300 bpm HR sanitized to null');
  const model = analyze(rows);
  assert.equal(model.avgHR, null, 'never invents HR when valid samples are absent');
});

test('P0 FIT standard coverage: CRC-16 validation, compressed timestamps, developer fields, and base-type invalid sentinels', () => {
  // Definition has 4 fields: lat(0,sint32), lon(1,sint32), alt(2,uint16), hr(3,uint8) + 1 developer field (4 bytes)
  // Record 1: uncompressed with timestamp field; Record 2: compressed timestamp header + invalid HR (0xFF) and invalid alt (0xFFFF)
  const payloadSize = 25 + 20 + 20;
  const bytes = new Uint8Array(14 + payloadSize + 2);
  const dv = new DataView(bytes.buffer);
  bytes[0] = 14;
  bytes[1] = 0x20;
  dv.setUint16(2, 2140, true);
  dv.setUint32(4, payloadSize, true);
  bytes.set([46, 70, 73, 84], 8);
  dv.setUint16(12, fitCRC16(bytes, 0, 12), true);

  let j = 14;
  // Definition message (local=1, developer flag 0x20 | 0x40 = 0x61), 5 fields + 1 dev field = 25 bytes
  bytes.set([
    0x61, 0, 0, 20, 0, 5,
    0, 4, 0x85,   // lat sint32
    1, 4, 0x85,   // lon sint32
    2, 2, 0x84,   // altitude uint16 (scale 5, offset 500)
    3, 1, 0x02,   // heart_rate uint8
    253, 4, 0x86, // timestamp uint32
    1,            // 1 developer field
    0, 4, 0       // dev field size 4
  ], j);
  j += 25;

  // Record 1 (local=1): valid alt=(520*5)=2600 -> 20m, valid hr=148, ts=1000
  bytes[j++] = 0x01;
  dv.setInt32(j, Math.round((59.35 * 2147483648) / 180), true); j += 4;
  dv.setInt32(j, Math.round((17.85 * 2147483648) / 180), true); j += 4;
  dv.setUint16(j, 2600, true); j += 2;
  dv.setUint8(j++, 148);
  dv.setUint32(j, 1000, true); j += 4;
  dv.setUint32(j, 0xdeadbeef, true); j += 4; // dev field

  // Record 2: compressed timestamp header (0x80 | (1 << 5) | (1012 & 31)) => local=1, offset=20 (1000 & ~31 = 992; 992+20 = 1012)
  // Note: compressed header still reads the defined fields, with timestamp field set to 0xFFFFFFFF (invalid sentinel) so compressed offset governs
  bytes[j++] = 0x80 | (1 << 5) | 20;
  dv.setInt32(j, Math.round((59.355 * 2147483648) / 180), true); j += 4;
  dv.setInt32(j, Math.round((17.85 * 2147483648) / 180), true); j += 4;
  dv.setUint16(j, 0xffff, true); j += 2; // invalid uint16 altitude sentinel
  dv.setUint8(j++, 0xff);                // invalid uint8 HR sentinel
  dv.setUint32(j, 0xffffffff, true); j += 4;
  dv.setUint32(j, 0, true); j += 4;

  // Adjust actual payload size and CRCs
  const actualPayload = j - 14;
  dv.setUint32(4, actualPayload, true);
  dv.setUint16(12, fitCRC16(bytes, 0, 12), true);
  const finalBytes = bytes.slice(0, j + 2);
  const finalDv = new DataView(finalBytes.buffer);
  finalDv.setUint16(j, fitCRC16(finalBytes, 0, j), true);

  const parsed = parseFIT(finalBytes.buffer);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].ele, 20);
  assert.equal(parsed[0].hr, 148);
  assert.equal(parsed[1].ele, null, '0xFFFF uint16 sentinel must decode to null, not 12607 m');
  assert.equal(parsed[1].hr, null, '0xFF uint8 sentinel must decode to null, not 255 bpm');
  assert.equal(parsed[1].t - parsed[0].t, 12, 'compressed timestamp offset reconstructed accurately');

  // Corrupting a byte must trip FIT file CRC check
  const corrupted = new Uint8Array(finalBytes);
  corrupted[20] ^= 0xff;
  assert.throws(() => parseFIT(corrupted.buffer), /CRC mismatch/);
});

test('P1 versioned ActivitySpec, MomentSpec, and Compare course contracts', () => {
  const ptsA = parseGPX(gpx);
  const spec = toActivitySpec(ptsA, { fileName: 'morning.gpx', title: 'Morning Run' });
  assert.equal(spec.schema, 'stride.activity.v1');
  assert.equal(spec.algorithmVersion, ALGORITHM_VERSION);
  assert.equal(spec.missingness.heartRate, true);
  assert.equal(spec.summary.avgHeartRateBpm, null);

  const moments = toMomentSpecs(ptsA, { id: spec.id });
  assert.ok(moments.length >= 2);
  assert.equal(moments[0].schema, 'stride.moment.v1');
  assert.equal(moments[0].provenance, 'measured_gps_and_timestamp_interpolation');

  // Challenger route over same corridor, 15 seconds faster
  const gpxFaster = `<gpx><trk><trkseg><trkpt lat="59.35" lon="17.85"><ele>12</ele><time>2026-10-20T08:00:00Z</time></trkpt><trkpt lat="59.355" lon="17.85"><ele>20</ele><time>2026-10-20T08:02:50Z</time></trkpt><trkpt lat="59.36" lon="17.85"><ele>18</ele><time>2026-10-20T08:05:45Z</time></trkpt></trkseg></trk></gpx>`;
  const cmp = compareActivities(ptsA, parseGPX(gpxFaster));
  assert.equal(cmp.schema, 'stride.comparison.v1');
  assert.equal(cmp.comparableCourse, true);
  assert.equal(cmp.totalDurationDeltaSeconds, -15);
  assert.equal(cmp.splitComparisons.length, 1);
  assert.ok(cmp.splitComparisons[0].deltaSeconds < 0);
});
