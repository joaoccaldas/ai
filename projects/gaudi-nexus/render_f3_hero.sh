#!/bin/bash
# F3 HERO HYPERREALISTIC RENDERING COMMAND
# Usage: ./render_f3_hero.sh [eevee|cycles] [output-dir]
# Example: ./render_f3_hero.sh eevee ./renders
# Example: ./render_f3_hero.sh cycles ./renders

set -e

MODE="${1:-eevee}"
OUTPUT_DIR="${2:-./_f3_render_output}"
BLENDER_BLEND="./blender/rev17_municipal_final.blend"
SCRIPT="./scripts/render_f3_hyperreal.py"

# Validate inputs
if [ ! -f "$BLENDER_BLEND" ]; then
    echo "❌ Error: Blender file not found at $BLENDER_BLEND"
    echo "   Expected: $(pwd)/$BLENDER_BLEND"
    exit 1
fi

if [ ! -f "$SCRIPT" ]; then
    echo "❌ Error: Render script not found at $SCRIPT"
    exit 1
fi

if [ "$MODE" != "eevee" ] && [ "$MODE" != "cycles" ]; then
    echo "❌ Error: MODE must be 'eevee' or 'cycles', got '$MODE'"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Determine Blender path
if ! command -v blender &> /dev/null; then
    echo "❌ Error: Blender not found in PATH"
    echo "   Install Blender 4.0+ or add it to PATH:"
    echo "   export PATH='/path/to/blender/bin:\$PATH'"
    exit 1
fi

BLENDER_BIN=$(which blender)
echo "✓ Using Blender: $BLENDER_BIN"
echo "✓ Render mode: $MODE"
echo "✓ Output directory: $(cd "$OUTPUT_DIR" && pwd)"
echo "✓ Blend file: $(cd "$(dirname "$BLENDER_BLEND")" && pwd)/$(basename "$BLENDER_BLEND")"
echo ""
echo "Starting F3 hero render..."
echo ""

# Configure samples based on mode
if [ "$MODE" = "eevee" ]; then
    SAMPLES=32
    DENOISE="OptiX"
    RENDER_TIME="~30-45 minutes (GPU)"
    echo "📊 Eevee Fast Iteration"
    echo "   Samples: $SAMPLES"
    echo "   Denoise: $DENOISE"
    echo "   Expected time: $RENDER_TIME"
else
    SAMPLES=256
    DENOISE="auto"
    RENDER_TIME="~2-4 hours (RTX 4090); ~8-12 hours (RTX 3080)"
    echo "📊 Cycles Final Render (Competition Grade)"
    echo "   Samples: $SAMPLES"
    echo "   Denoise: $DENOISE"
    echo "   Expected time: $RENDER_TIME"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Execute render
python3 "$SCRIPT" \
    --blender="$BLENDER_BIN" \
    --blend="$BLENDER_BLEND" \
    --output="$OUTPUT_DIR" \
    --mode="$MODE" \
    --samples="$SAMPLES" \
    --denoise="$DENOISE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ Render complete!"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"/f3_hero.* 2>/dev/null || echo "   (checking output...)"
ls -lh "$OUTPUT_DIR"/manifest.json 2>/dev/null || echo "   (manifest not yet available)"
echo ""
echo "Next steps:"
echo "  1. Review rendered image: $OUTPUT_DIR/f3_hero.png"
echo "  2. Score on blind jury rubric (geometry, lighting, materials, composition, spatial truth)"
echo "  3. If ≥8/9 average: proceed to Cycles final"
echo "  4. If <8/9: iterate materials/lighting and re-render"
echo ""
echo "📖 Full guide: ./F3_RENDER_EXECUTION_GUIDE.md"
