#!/usr/bin/env python3
"""İkon oluşturucu — sade mavi kare + 'SK' yazısı."""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

BG = (31, 111, 235)        # #1f6feb
FG = (255, 255, 255)
ACCENT = (255, 199, 80)    # warm accent dot

FONT_CANDIDATES = [
    "/System/Library/Fonts/SFNS.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_icon(size, output, rounded=True):
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Subtle accent stripe at bottom
    stripe_h = max(2, size // 60)
    draw.rectangle((0, size - stripe_h, size, size), fill=ACCENT)

    # Suitcase-like rounded shape outlined in white
    pad = int(size * 0.18)
    box_l = pad
    box_r = size - pad
    box_t = pad + int(size * 0.05)
    box_b = size - pad
    radius = int(size * 0.08)
    draw.rounded_rectangle((box_l, box_t, box_r, box_b), radius=radius, outline=FG, width=max(2, size // 64))

    # Suitcase handle (small rectangle on top)
    handle_w = int((box_r - box_l) * 0.45)
    handle_h = int(size * 0.05)
    handle_l = (size - handle_w) // 2
    handle_t = box_t - handle_h - int(size * 0.01)
    draw.rounded_rectangle((handle_l, handle_t, handle_l + handle_w, handle_t + handle_h), radius=handle_h // 2, outline=FG, width=max(2, size // 80))

    # Center text "SK"
    font_size = int(size * 0.32)
    font = load_font(font_size)
    text = "SK"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cx = box_l + (box_r - box_l) // 2
    cy = box_t + (box_b - box_t) // 2 + int(size * 0.02)
    draw.text((cx - tw // 2 - bbox[0], cy - th // 2 - bbox[1]), text, fill=FG, font=font)

    img.save(output, "PNG", optimize=True)
    print(f"  wrote {output}")


def main():
    print("İkonlar oluşturuluyor...")
    draw_icon(192, os.path.join(ICONS_DIR, "icon-192.png"))
    draw_icon(512, os.path.join(ICONS_DIR, "icon-512.png"))
    draw_icon(180, os.path.join(ICONS_DIR, "apple-touch-icon.png"))
    print("Tamam.")


if __name__ == "__main__":
    main()
