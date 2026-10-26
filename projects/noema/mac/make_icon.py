#!/usr/bin/env python3
"""Draw a NOEMA app icon using the same marks as site/favicon.svg."""

import math
import struct
import sys
import zlib

SIZE = 1024
BACKGROUND = (7, 17, 31, 255)
RING = (125, 211, 252, 255)
MARK = (232, 244, 255, 255)
LETTER = [
    (19, 43), (19, 21), (24, 21), (40, 36), (40, 21),
    (45, 21), (45, 43), (40, 43), (24, 28), (24, 43),
]


def inside_letter(u, v):
    inside = False
    previous = len(LETTER) - 1
    for index, (x_value, y_value) in enumerate(LETTER):
        x_previous, y_previous = LETTER[previous]
        crosses = (y_value > v) != (y_previous > v)
        if crosses:
            x_cross = (x_previous - x_value) * (v - y_value) / (y_previous - y_value) + x_value
            if u < x_cross:
                inside = not inside
        previous = index
    return inside


def sample(x, y):
    center = (SIZE - 1) / 2
    radius = math.hypot(x + 0.5 - center, y + 0.5 - center)
    outer = SIZE * 0.33
    inner = outer - SIZE * 0.046
    unit_x = (x + 0.5) / SIZE * 64
    unit_y = (y + 0.5) / SIZE * 64
    if inside_letter(unit_x, unit_y):
        return MARK
    if inner <= radius <= outer:
        return RING
    return BACKGROUND


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path):
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)
        for x in range(SIZE):
            raw.extend(sample(x, y))
    png = b"\x89PNG\r\n\x1a\n"
    header = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    png += chunk(b"IHDR", header)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as handle:
        handle.write(png)


if __name__ == "__main__":
    write_png(sys.argv[1] if len(sys.argv) > 1 else "icon-1024.png")
