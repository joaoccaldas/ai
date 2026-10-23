# Pointcloud Walk 005

A mobile-first **interactive visualization of a procedural 3D point cloud**, based on a user-provided 14-second reference video. Hosted as a self-contained GitHub Pages experience within the `ai` monorepo.

**Live:** https://joaoccaldas.github.io/ai/pointcloud-walk-005/

## Run

Open [index.html](index.html) in any modern desktop or mobile browser, or visit the GitHub Pages URL. Press **Play**, drag to look around, and use the slider or arrow keys to scrub. Everything is embedded in the single HTML file; no CDN, build step, analytics, camera permission, or login is required.

## Architecture

- **Geometry:** the HTML embeds 32,231 sampled 3D positions as binary-packed, base64-encoded 9-byte records (X/Y/Z coordinates and material type). These are a lighter subset of the ~96,684 splats in the separate editable Blender project.
- **Renderer:** a software-perspective projector draws the 3D positions onto a Canvas 2D surface. This is **not WebGL, photogrammetry, volumetric video, or a Blender render**.
- **Animation:** keyed camera eye/target positions across 14 seconds at interactive playback speed, with touch drag, scrubber and keyboard support.
- **Visual language:** organic dark tunnel, lichen-like vegetation, luminous guide lines, high-contrast threshold portal, and atmospheric particles.
- **Privacy/performance:** no requests or third-party dependencies. Rendering cost still depends on device CPU and canvas size.
- **Source assets:** the separate Blender `.blend` and portable `.glb` are retained at [the original hosted 3D Jutsu project](https://higgsfield.ai/3d-jutsu/262ed216-fbc0-4032-a015-159613b796da), revision 2. These binary assets are **not** embedded as `.blend` or `.glb` files in this Git repository. The standalone HTML needs neither.

## Tests

Run `node pointcloud-walk-005/test/smoke.mjs` from the repository root (Node 20+).

Checks: point payload integrity and expected sample count, the actual embedded JS syntax, required controls and timing, no remote HTTP(S) URLs, and no external script dependencies. GitHub Actions runs on pull requests and main pushes affecting this folder. Passing static tests does **not** verify visual parity on different devices.

## Limitations & provenance

This is a **visual reconstruction**, not an original point-cloud scan or exact copy of the source video. The HTML representation and Blender/GLB scene differ in geometry density and camera path. No third-party video or original creator's geometry is redistributed. A complete original-frame visual comparison, smartphone FPS profiling, Blender recreation-script run, and exported-video parity remain open validation work.

To render the original editable Blender scene, open the hosted project and export revision 2. For the older ChatGPT-generated offline package, keep its `.glb`, `.npz`, and `build_in_blender.py` together; that package is not mirrored to this public repository.

## Future improvements

1. Compare rendered frames at 0, 3, 7, 10 and 13 seconds against the supplied reference, score framing and relative portal placement.
2. Use WebGL instancing or a points shader for consistent mobile frame times.
3. Add accessibility controls for reduced motion and a static fallback.
4. Connect a versioned `.glb` artifact and Blender MCP build/test process when a stable binary asset publishing workflow is available.
