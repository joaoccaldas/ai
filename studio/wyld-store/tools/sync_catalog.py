#!/usr/bin/env python3
"""Sync the storefront catalog from the public ridewyld.com Shopify feed.

    python3 tools/sync_catalog.py                 # fetch live feed
    python3 tools/sync_catalog.py products.json   # use a saved feed

Writes data/catalog.json (read by the app for live prices) and
data/catalog.js (the same data as an ES module for the site and app bundles).
Keeps real handles, prices, stock, variant ids (for cart permalinks) and CDN
images. Private team kits (tagged SSC) are left out of the retail shop.
If the feed cannot be fetched, the existing catalog is kept unchanged.
"""
import datetime
import hashlib
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

FEED = "https://ridewyld.com/products.json?limit=250"
DATA = Path(__file__).resolve().parent.parent / "data"
OUT_JSON = DATA / "catalog.json"
OUT_JS = DATA / "catalog.js"
EXCLUDE_TAGS = {"SSC"}

# The storefront trusts this file, so everything taken from the feed is
# validated to a strict shape; anything unexpected is dropped.
HANDLE_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
IMAGE_RE = re.compile(r"^/cdn/shop/(?:files|products)/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp)$")
TEXT_MAX = 120


def load(argv):
    if len(argv) > 1:
        return json.loads(Path(argv[1]).read_text())
    req = urllib.request.Request(FEED, headers={"User-Agent": "Mozilla/5.0 (catalog sync)"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == 4:
                raise
        except urllib.error.URLError:
            if attempt == 4:
                raise
        time.sleep(10 * 2 ** attempt)


def category(p):
    tags = {t.lower() for t in p["tags"]}
    kind = (p["product_type"] or "").lower()
    if "trisui" in p["handle"] or any("trisui" in t for t in tags):
        return "triathlon", "Trisuit"
    if "run wyld" in tags:
        return "run", p["product_type"] or "Run"
    if "accessories" in tags or kind in {"cap", "ear plugs", "gift cards"}:
        return "accessories", p["product_type"] or "Accessory"
    if "bib" in kind:
        return "cycling", "Bib Shorts"
    if "gilet" in kind:
        return "cycling", "Gilet"
    if "club cut" in kind:
        return "cycling", "Club Fit Jersey"
    return "cycling", "Race Fit Jersey"


def clean_title(t):
    t = re.sub(r"\s*\|\s*(Race|Club) Fit$", "", t)
    return re.sub(r"^WYLD\s+(?!GIFT)", "", t).replace("WYLD GIFT CARD", "Gift Card")


def paragraphs(body):
    body = re.sub(r"<h\d[^>]*>.*?</h\d>", "", body or "", flags=re.S)
    out = []
    for p in re.findall(r"<p[^>]*>(.*?)</p>", body, flags=re.S):
        text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", p))).strip()
        if len(text) > 40:
            out.append(text[:900])
    return out[:3]


def clean_text(value, limit=TEXT_MAX):
    text = re.sub(r"[\x00-\x1f<>]", "", html.unescape(str(value or ""))).strip()
    return text[:limit]


def img(src):
    # Serve every image from the store's own CDN path: /cdn/shop/{files|products}/...
    path = src.split("?")[0]
    path = re.sub(r"^https://cdn\.shopify\.com/s/files/\d+/\d+/\d+/\d+/", "/cdn/shop/", path)
    return path.replace("https://ridewyld.com", "")


def main(argv):
    try:
        feed = load(argv)
    except Exception as e:  # keep the last good catalog rather than failing the site
        print(f"feed unavailable ({e}); keeping existing catalog")
        return
    products = []
    for p in feed["products"]:
        if EXCLUDE_TAGS & set(p["tags"]):
            continue
        if not HANDLE_RE.match(p.get("handle", "")):
            print(f"skip: unexpected handle {p.get('handle')!r}")
            continue
        cat, kind = category(p)
        opts = [{"name": clean_text(o["name"], 30), "values": [clean_text(v, 40) for v in o["values"]]} for o in p["options"]]
        if opts and opts[0]["name"] == "Valörer":
            opts[0]["name"] = "Amount"
        variants = [
            {
                "id": v["id"],
                "o": [clean_text(x, 40) for x in (v["option1"], v["option2"], v["option3"]) if x],
                "price": float(v["price"]),
                "was": float(v["compare_at_price"]) if v["compare_at_price"] else None,
                "ok": v["available"],
            }
            for v in p["variants"]
            if isinstance(v.get("id"), int) and v["id"] > 0
        ]
        images = [i for i in (img(x["src"]) for x in p["images"]) if IMAGE_RE.match(i)][:6]
        if not variants or not images:
            print(f"skip: {p['handle']} has no valid variants or images")
            continue
        prices = [v["price"] for v in variants]
        was = [v["was"] for v in variants if v["was"] and v["was"] > v["price"]]
        styles = next((o["values"] for o in opts if o["name"] == "Style"), [])
        products.append(
            {
                "handle": p["handle"],
                "title": clean_text(clean_title(p["title"])),
                "category": cat,
                "kind": clean_text(kind, 40),
                "price": min(prices),
                "was": max(was) if was else None,
                "from": len(set(prices)) > 1,
                "available": any(v["ok"] for v in variants),
                "women": "Female" in styles or "women" in {t.lower() for t in p["tags"]},
                "men": "Male" in styles or "men" in {t.lower() for t in p["tags"]},
                "images": images,
                "options": opts,
                "variants": variants,
                "copy": paragraphs(p["body_html"]),
            }
        )
    digest = hashlib.sha256(json.dumps(products, sort_keys=True).encode()).hexdigest()[:16]
    previous = json.loads(OUT_JSON.read_text()) if OUT_JSON.exists() else {}
    if previous.get("digest") == digest:
        print(f"{len(products)} products, unchanged")
        return
    catalog = {
        "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "digest": digest,
        "currency": "AED",
        "products": products,
    }
    DATA.mkdir(exist_ok=True)
    OUT_JSON.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n")
    OUT_JS.write_text(
        "// Generated by tools/sync_catalog.py from the public ridewyld.com feed.\n"
        "export default " + json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + ";\n"
    )
    print(f"{len(products)} products -> {OUT_JSON.name}, {OUT_JS.name}")


if __name__ == "__main__":
    main(sys.argv)
