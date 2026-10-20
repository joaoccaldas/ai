"""Draw the STRIDE Athlete Worlds macOS app icon (1024 px PNG). Deterministic; no external assets.
Features a deep volcanic slate tile (#0B181E) with an illuminated topographic elevation contour
and STRIDE lime-volt route trajectory (#DBFA94) plus warm copper moment beacon (#F4C59B).
"""
import math
import sys
from PIL import Image, ImageDraw, ImageFilter

S = 1024

def make_icon(out_path: str):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    inset, radius = 100, 185
    body = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / S
        r = int(11 + 16 * (1 - t))
        g = int(24 + 28 * (1 - t))
        b = int(30 + 34 * (1 - t))
        gd.line([(0, y), (S, y)], fill=(r, g, b, 255))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([inset, inset, S - inset, S - inset], radius, fill=255)
    body.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(body)
    volt = (219, 250, 148, 255)
    teal = (86, 134, 130, 160)
    copper = (244, 197, 155, 255)

    # Perspective terrain grid lines
    for row in range(6):
        y_base = 540 + row * 48
        pts = []
        for col in range(18):
            u = col / 17.0
            x = 180 + u * 664
            wave = math.sin(u * math.pi * 2.2 + row * 0.55) * (28 - row * 3)
            pts.append((x, y_base - wave))
        d.line(pts, fill=teal, width=4)

    # 3D route trajectory ribbon
    route_pts = [
        (230, 680),
        (330, 600),
        (430, 635),
        (540, 460),
        (650, 500),
        (775, 315),
    ]
    d.line(route_pts, fill=(6, 15, 22, 210), width=36, joint="curve")
    d.line(route_pts, fill=volt, width=22, joint="curve")

    # Moment Atlas beacon on peak
    px, py = route_pts[-1]
    d.ellipse([px - 42, py - 42, px + 42, py + 42], outline=volt, width=6)
    d.ellipse([px - 22, py - 22, px + 22, py + 22], fill=copper, outline=(14, 40, 48, 255), width=8)

    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([inset, inset + 18, S - inset, S - inset + 18], radius, fill=(0, 0, 0, 95))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    img = Image.alpha_composite(img, shadow)
    img = Image.alpha_composite(img, body)
    img.save(out_path)

if __name__ == "__main__":
    make_icon(sys.argv[1])
