#!/usr/bin/env python3
"""ホーム画面のアイコンと、SNS で共有されたときの絵（OGP）を、ニャーちゃんの基準画から作る
（おせわゲームの アイコンと 見分けられるように、コックぼうしを かぶせる：要件定義書 F-12）

  python3 tools/make_icons.py
必要なもの：pip install pillow
"""
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'assets/characters/nya_base.png')
BG = (251, 238, 240)  # manifest の background_color と同じ


INK = (59, 50, 54, 255)
TOP = 200  # ぼうしの ぶん、基準画の 上に あける 高さ


def with_chef_hat(base):
    """基準画の 耳と 耳の あいだに コックぼうしを かぶせた 絵（上に TOP だけ ひろげる）"""
    im = Image.new('RGBA', (base.width, base.height + TOP), (0, 0, 0, 0))
    im.alpha_composite(base, (0, TOP))
    d = ImageDraw.Draw(im)
    puffs = [(500, 95, 78), (615, 60, 88), (730, 95, 78)]  # 基準画の 座標
    band = (452, 120, 778, 252)
    sh = lambda b: (b[0], b[1] + TOP, b[2], b[3] + TOP)
    for x, y, r in puffs:  # ふちどり
        d.ellipse(sh((x - r - 12, y - r - 12, x + r + 12, y + r + 12)), fill=INK)
    d.rounded_rectangle(sh(band), 26, fill=INK)
    for x, y, r in puffs:
        d.ellipse(sh((x - r, y - r, x + r, y + r)), fill=(255, 255, 255, 255))
    d.rounded_rectangle(sh((band[0] + 12, band[1] + 12, band[2] - 12, band[3] - 12)), 18, fill=(255, 255, 255, 255))
    d.line(sh((470, 190, 760, 190)), fill=(233, 220, 228, 255), width=8)
    return im


def main():
    nya = with_chef_hat(Image.open(BASE).convert('RGBA'))
    head = nya.crop((190, TOP - 60, 1064, TOP + 640))  # ぼうしの 上から あごの下まで
    for name, size in [('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180)]:
        im = Image.new('RGBA', (size, size), BG + (255,))
        w = round(size * 0.84)
        h = round(head.height * w / head.width)
        im.alpha_composite(head.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2 + round(size * 0.03)))
        im.convert('RGB').save(os.path.join(ROOT, 'icons', name), optimize=True)
    og = Image.new('RGBA', (1200, 630), BG + (255,))
    body = nya.crop((190, TOP - 60, 1064, TOP + 1210))
    h = 580
    w = round(body.width * h / body.height)
    og.alpha_composite(body.resize((w, h), Image.LANCZOS), ((1200 - w) // 2, 25))
    og.convert('RGB').save(os.path.join(ROOT, 'icons', 'og-image.png'), optimize=True)
    print('icons/ に 作りました')


if __name__ == '__main__':
    main()
