# F3 HERO HYPERREALISTIC RENDERING EXECUTION GUIDE

**Project:** Gaudí Nexus Competition Submission  
**Target:** Jury Award (95+/100 points)  
**Hero Camera:** A_HERO_MUNICIPAL_F3 (municipal context, no proxy Sagrada)  
**Quality Gate:** ≥9/10 blind jury score (geometry, lighting, materials, composition, spatial truth)  
**Timeline:** This week (Week 1 of Phase 1)

---

## STEP 1: ACCESS REV 17 BLENDER FILE FROM HIGGSFIELD

**Source URL:** https://higgsfield.ai/3d-jutsu/6bfa2d88-eef7-4583-9d82-08218b0bf4e4

**Actions:**
1. Open the Higgsfield 3D Jutsu link above in your browser
2. Locate the **Rev 17 aligned municipal comparison** scene
3. Download the `.blend` file (≈17.8 MB)
4. Save to: `/path/to/gaudi-nexus/blender/rev17_municipal_final.blend` (create dir if needed)

**Verification:**
- File size: ≈17.8 MB
- Scene collections visible: `00_SITE_MUNICIPAL_IMPORTED`, `05_CONTEXT_PROXY_SAGRADA`, `10_MARKET_FOREGROUND`
- Cameras registered: `A_HERO_MUNICIPAL_F3` should be the active camera
- Municipal geometry: 2,900 meshes (not to be hidden)
- Proxy Sagrada: Should be hideable in `05_CONTEXT_PROXY_SAGRADA`

---

## STEP 2: PREPARE RENDERING ENVIRONMENT

**System Requirements:**
- Blender 3.6+ (4.x recommended for Eevee improvements)
- GPU: NVIDIA (OptiX) or AMD (HIP) for fast denoise; CPU fallback available
- Disk: ≥10 GB free (output cache + intermediate files)
- RAM: 16+ GB recommended for Cycles 256-sample render

**Install Dependencies:**
```bash
# Python packages for render orchestration
pip install pillow imageio Pillow-SIMD

# Optional: GPU acceleration setup
# For NVIDIA: install CUDA 12.x + OptiX 8.x
# For AMD: install HIP + HIP-SDK
# For CPU: OpenImageDenoise will be used instead
```

---

## STEP 3: EXECUTE F3 HERO RENDERING

### PHASE 1A: EEVEE FAST ITERATION (30-45 minutes)

**Purpose:** Validate geometry, lighting, materials, composition at interactive speed before final render.

**Command:**
```bash
cd /path/to/gaudi-nexus
python3 scripts/render_f3_hyperreal.py \
  --blender=/path/to/blender_binary \
  --blend=/path/to/gaudi-nexus/blender/rev17_municipal_final.blend \
  --output=/path/to/gaudi-nexus/renders/f3_eevee_iteration_1 \
  --mode=eevee \
  --samples=32 \
  --denoise=auto
```

**Expected Output:**
- Render time: 30-45 minutes on GPU, ≈2 hours on CPU
- File: `output/f3_hero.png` (1200×1600 px)
- Manifest: `output/manifest.json` (metadata + SHA-256)

**Quality Checklist (Eevee Iteration):**
- [ ] Sagrada cluster clearly legible in midground
- [ ] Market foreground sharp (4 people, brass rails, linen awnings)
- [ ] Midground at soft focus (12 people, plaza geometry)
- [ ] Background (Sagrada, context) at natural blur
- [ ] Contact shadows anchor every object
- [ ] Brass has subtle patina (not plastic)
- [ ] Linen shows seam/weave detail (not flat)
- [ ] Stone paving shows wear patterns (wet-stone depth)
- [ ] Sky transitions smoothly (no banding)
- [ ] No floating objects or interpenetrating geometries

**Blind Jury Scoring (Self-Grade):**
Score on 9-point scale. Each criterion must achieve ≥8/10 to proceed:

```json
{
  "geometry_integrity": {
    "criterion": "Proportions, scale, spatial relationships match plans/sections",
    "score": "?/9",
    "issues": "[]"
  },
  "lighting_believability": {
    "criterion": "Barcelona 14:00 solar position, shadow depth, atmospheric depth",
    "score": "?/9",
    "issues": "[]"
  },
  "material_authenticity": {
    "criterion": "Brass patina, linen weave, stone weathering, ceramic grout, timber grain",
    "score": "?/9",
    "issues": "[]"
  },
  "spatial_coherence": {
    "criterion": "DOF composition, foreground-midground-background layering, scale-correct entourage",
    "score": "?/9",
    "issues": "[]"
  },
  "composition": {
    "criterion": "Golden ratio, Sagrada off-center, frame balance, visual hierarchy",
    "score": "?/9",
    "issues": "[]"
  },
  "total_blind_score": "?/45",
  "pass_gate": "≥36/45 (≥8/9 average) to proceed to Cycles"
}
```

**If ≥8/9 average:** Proceed to Phase 1B (Cycles final).  
**If <8/9 in any criterion:** Iterate choreography/materials (see Iteration Guide below).

### PHASE 1B: CYCLES FINAL RENDER (2-4 hours, competition-grade)

**Command:**
```bash
cd /path/to/gaudi-nexus
python3 scripts/render_f3_hyperreal.py \
  --blender=/path/to/blender_binary \
  --blend=/path/to/gaudi-nexus/blender/rev17_municipal_final.blend \
  --output=/path/to/gaudi-nexus/renders/f3_cycles_final \
  --mode=cycles \
  --samples=256 \
  --denoise=auto \
  --tiled=true
```

**Expected Output:**
- Render time: 2-4 hours on RTX 4090; ≈8-12 hours on single RTX 3080
- File: `output/f3_hero.png` (1200×1600 px, 16-bit linear)
- Manifest: `output/manifest.json`

**Quality Validation (Final):**
- [ ] All Eevee criteria maintained/improved
- [ ] Noise floor: <0.5% visible noise after denoise
- [ ] Specular highlights: Smooth, not firefly artifacts
- [ ] Shadow edges: Natural penumbra (not hard or over-blurred)
- [ ] Atmospheric depth: Distant Sagrada at 85% silhouette legibility
- [ ] Contact shadows: Every object grounded, no shadow detachment

**Final Jury Scoring:**
```json
{
  "final_blind_score": "?/45",
  "pass_gate": "≥40/45 (≥8.9/9 average) locks hero for competition",
  "approval": "Ready for A1 composition" | "Requires iteration (max 2 rounds)"
}
```

---

## STEP 4: ITERATION GUIDE (If <8/9 on any criterion)

### Material Adjustments (Blender Python Script)
```python
# If brass looks plastic, increase patina:
# world.materials['brass_rail'].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.35

# If linen too shiny, increase roughness:
# world.materials['linen_awning'].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.55

# If stone weathering too subtle, add drainage layer:
# Enable weathering node in 'barcelona_stone' material
```

### Lighting Adjustments (Blender UI)
- **If shadows too harsh:** Increase sun strength from 2.5 to 3.0, add subtle fill light (0.2 strength)
- **If shadows too soft:** Decrease sun strength to 2.2, reduce shadow blur
- **If colors too warm:** Reduce color temperature from 5500K to 5200K (less orange)
- **If colors too cool:** Increase to 5800K (more neutral)

### Entourage Adjustments
- **If people look floaty:** Verify contact shadows enabled on all foreground/midground rigs
- **If composition off-balance:** Reposition 2-3 people in midground or adjust camera position ±0.5m
- **If density feels crowded:** Remove 1-2 background silhouettes (target 20 total, not 25)

### Max 2 Iteration Rounds
Each iteration = 1 Eevee (45 min) + 1 Cycles (3 hours) = ≈4 hours.  
**Total time budget for Phase 1: 4 Eevee + 4 Cycles = ≈16 hours over 1-2 days.**

---

## STEP 5: LOCK HERO & DOCUMENT DECISION

Once final Cycles render achieves ≥8.9/9 average (40/45):

1. **Rename output file to standard naming:**
   ```bash
   mv /path/to/output/f3_hero.png /path/to/gaudi-nexus/renders/F3_HERO_MUNICIPAL_FINAL.jpg
   ```

2. **Record decision in config:**
   ```json
   {
     "current_world": {
       "hero_camera": "A_HERO_MUNICIPAL_F3",
       "hero_render": "F3_HERO_MUNICIPAL_FINAL.jpg",
       "hero_frozen_at": "2026-10-XX",
       "hero_jury_score": "40/45 (8.9/9 average)",
       "municipal_context_status": "AUTHORIZED_FOR_COMPETITION"
     }
   }
   ```

3. **Commit to git:**
   ```bash
   git add renders/F3_HERO_MUNICIPAL_FINAL.jpg config/current_world.json
   git commit -m "HERO GATE PASS: F3 municipal render 40/45 blind score, locked for A1 composition"
   git push origin claude/gracious-cerf-0aefgo
   ```

---

## APPENDIX: TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Blender crashes on render | Reduce samples to 128 (Cycles), enable tiled rendering |
| OptiX not available | Switch denoise to `openimagedenoise`, or install OptiX 8.x |
| Render hangs after 2+ hours | GPU memory issue; enable "Use Unified Memory" in Cycles device prefs |
| Entourage looks AI-generated | Replace person rigs with real marketplace photography source files |
| Municipal geometry not visible | Check `00_SITE_MUNICIPAL_IMPORTED` collection is unhidden |
| Proxy Sagrada still in frame | Hide `05_CONTEXT_PROXY_SAGRADA` collection |

---

## NEXT PHASES (After Hero Approval)

Once F3 hero is locked at ≥8.9/9:
- **Phase 2:** Sightline/shadow reconciliation (1 day)
- **Phase 3:** A1 board composition (1 day)
- **Phase 4-6:** Environmental proof, structural diagrams, submission audit (2-3 days)

**Total path to 100/100: 2 weeks**

---

*Document: F3_RENDER_EXECUTION_GUIDE.md*  
*Generated: 2026-10-05*  
*Authority: render_f3_hyperreal.py + F3_PHOTOREAL_RENDERING_PROTOCOL.md*
