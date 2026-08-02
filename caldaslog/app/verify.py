from pathlib import Path
import re
import subprocess
import tempfile

page = Path(__file__).with_name("index.html").read_text(encoding="utf-8")

required = [
    "localStorage",
    "parseICS",
    "data-view=\"timeline\"",
    "data-view=\"actions\"",
    "data-view=\"wardrobe\"",
    "data-view=\"sources\"",
    "data-export",
    "data-reset",
]
missing = [token for token in required if token not in page]
if missing:
    raise SystemExit(f"Missing required app contracts: {missing}")

scripts = re.findall(r"<script>(.*?)</script>", page, flags=re.S)
if len(scripts) != 1:
    raise SystemExit(f"Expected one inline application script, found {len(scripts)}")

with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as handle:
    handle.write(scripts[0])
    script_path = handle.name

subprocess.run(["node", "--check", script_path], check=True)
print("CaldasLog bundle verification passed")
