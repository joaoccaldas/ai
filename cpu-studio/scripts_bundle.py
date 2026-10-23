#!/usr/bin/env python3
"""Deterministically build a single-file, dependency-free static demonstration.

Source remains modular and authoritative. The bundled file is for easy review and
single-file hosting, not a substitute for the complete PWA source package.
"""
from pathlib import Path
import re
import html
ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'dist' / 'index.html'
OUT.parent.mkdir(parents=True, exist_ok=True)
source = (ROOT / 'index.html').read_text('utf-8')
css = (ROOT / 'styles.css').read_text('utf-8')
icon = (ROOT / 'assets' / 'icon.svg').read_text('utf-8')

parts=[]
for name in ['catalog.mjs', 'engine.mjs', 'main.mjs']:
    contents=(ROOT / 'src' / name).read_text('utf-8')
    # The modular source owns all imports; bundle order is catalog -> reducer -> UI.
    contents=re.sub(r'^import\s+.*?\s+from\s+[\'"].*?[\'"].*?;?\s*$', '', contents, flags=re.M)
    contents=re.sub(r'^export\s+(?=(?:const|let|function|class)\b)', '', contents, flags=re.M)
    if re.search(r'^\s*(?:import\s|export\s)', contents, flags=re.M):
        raise ValueError(f'Unhandled module keyword in {name}')
    parts.append('// BUNDLED '+name+'\n'+contents)
js='\n'.join(parts)
if '</script' in js.lower() or '</style' in css.lower():
    raise ValueError('Inline script/style terminator in source')
# The single-file review build inlines script/style; remove the modular app's CSP.
# The hosted GitHub Pages app retains the strict same-origin CSP.
source=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*\/>' , '', source)
source=source.replace('<link rel="manifest" href="./manifest.webmanifest" />','')
source=source.replace('<link rel="icon" href="./assets/icon.svg" type="image/svg+xml" />','')
source=source.replace('<link rel="stylesheet" href="./styles.css" />','<style>\n'+css+'\n</style>')
source=source.replace('<script type="module" src="./src/main.mjs"></script>','<script type="module">\n'+js+'\n</script>')
# Inline build cannot register an absent service-worker bundle, so strip only its
# registration line (the full multi-file source PWA keeps sw.js).
source=re.sub(r"if\('serviceWorker'in navigator &&location\.protocol==='https:'\)\{navigator\.serviceWorker\.register\('./sw\.js'\)\.catch\(\(\)=>\{\}\);\}", '', source)
OUT.write_text(source, encoding='utf-8')
print(f'Generated {OUT} ({OUT.stat().st_size:,} bytes). No network assets required.')
