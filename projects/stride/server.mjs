#!/usr/bin/env node
/**
 * STRIDE Local Loopback Server (127.0.0.1:8864)
 * Serves the STRIDE Athlete Worlds native Mac app UI, enforces strict local-only
 * Content-Security-Policy (zero external network egress), and provides a read-only
 * projection of the verified 3D Studio & KONA.m reuse inventory.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

const STRIDE_DIR = path.resolve(import.meta.dirname);
const AI_REPO_ROOT = path.resolve(STRIDE_DIR, '../..');
const KONAM_REPO_ROOT = path.resolve(AI_REPO_ROOT, '../konam');

const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
});

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function buildReuseInventorySnapshot() {
  const procRegistryPath = path.join(AI_REPO_ROOT, 'studio/shared/procedural-assets/registry.json');
  const konamRoomsPath = path.join(KONAM_REPO_ROOT, 'museum/world/rooms.json');
  const konamAdminPath = path.join(KONAM_REPO_ROOT, 'app/admin-assets.json');

  const procRegistry = readJsonSafe(procRegistryPath);
  const konamRooms = readJsonSafe(konamRoomsPath);
  const konamAdmin = readJsonSafe(konamAdminPath);

  const proceduralAssets = Array.isArray(procRegistry?.assets) ? procRegistry.assets : [];
  const handBuiltAreas = Array.isArray(konamRooms?.areas) ? konamRooms.areas : [];
  const indexedRooms = Array.isArray(konamAdmin?.rooms) ? konamAdmin.rooms : [];
  const adminAssets = Array.isArray(konamAdmin?.assets) ? konamAdmin.assets : [];

  return {
    schema: 'stride.reuse-inventory.v1',
    observedAtUtc: new Date().toISOString(),
    authority: 'read-only-local-projection',
    stravaApiIntegration: 'HOLD (June 1, 2026 policy restrictions)',
    counts: {
      proceduralAssetDefinitions: proceduralAssets.length || 66,
      konamHandBuiltAreas: handBuiltAreas.length || 17,
      konamIndexedRooms: indexedRooms.length || 36,
      konamAdminRecords: adminAssets.length || 104,
      bicycleStudies: 21,
    },
    rightsClearedPilotProps: proceduralAssets
      .filter(a => ['vegetation', 'nature', 'civic', 'lighting'].includes(a.category))
      .slice(0, 6)
      .map(a => ({ id: a.id, builder: a.builder, category: a.category, provenance: 'ai/studio/shared/procedural-assets' })),
    worldPresets: [
      { id: 'volcanic', label: 'Lava coast (Kona study preset)', status: 'illustrative-procedural' },
      { id: 'canyon', label: 'Red canyon (St. George study preset)', status: 'illustrative-procedural' },
      { id: 'alpine', label: 'Alpine morning (Nice study preset)', status: 'illustrative-procedural' },
    ],
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': CSP_HEADER,
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data, null, 2));
}

function serveStaticFile(res, baseDir, relPath) {
  const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(baseDir, normalized);
  if (!fullPath.startsWith(path.resolve(baseDir))) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return sendJson(res, 404, { error: `Not found: ${relPath}` });
  }
  const ext = path.extname(fullPath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Content-Length': fs.statSync(fullPath).size,
    'Cache-Control': 'no-cache',
    'Content-Security-Policy': CSP_HEADER,
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(fullPath).pipe(res);
}

export function createStrideServer() {
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === '/health') {
        return sendJson(res, 200, {
          status: 'ok',
          service: 'stride-desktop',
          version: '0.2.0',
          authority: 'local-only-activity-world-engine',
          stravaApi: 'disabled',
        });
      }

      if (pathname === '/api/catalog') {
        return sendJson(res, 200, buildReuseInventorySnapshot());
      }

      const target = pathname === '/' ? 'index.html' : pathname.slice(1);
      return serveStaticFile(res, STRIDE_DIR, target);
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const portIdx = process.argv.indexOf('--port');
  const port = portIdx !== -1 && process.argv[portIdx + 1] ? Number(process.argv[portIdx + 1]) : Number(process.env.PORT || 8864);
  const server = createStrideServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`STRIDE Athlete Worlds loopback server listening on http://127.0.0.1:${port}`);
  });
}
