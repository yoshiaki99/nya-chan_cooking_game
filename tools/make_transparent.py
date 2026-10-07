#!/usr/bin/env python3
"""白い背景の線画を、背景透過の PNG にする（ニャーちゃんの絵の下ごしらえ）。

  python3 tools/make_transparent.py 入力 出力.png [--size 1254] [--margin 0.04] [--colors 64]

・輪郭（黒い線）の外側の白だけを透明にする。体の中の白は消さない。
・線にすきまがあっても中にもれないよう、線を少し太らせてから外側を探す。
・できた絵は、たて・よことも size の正方形のまんなかに、足もとを下にそろえて置く。
・ファイルを小さくするため、色の数をへらして保存する（要件定義書 N-22：1枚 500KB 以下）。
必要なもの：pip install pillow numpy scipy
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--size', type=int, default=1254, help='正方形の一辺（0 なら切りぬいた大きさのまま）')
    ap.add_argument('--margin', type=float, default=0.04, help='上と下に あける すきま（一辺に対する割合）')
    ap.add_argument('--close', type=int, default=6, help='線のすきまを ふさぐ太さ（ピクセル）')
    ap.add_argument('--colors', type=int, default=64, help='保存するときの色の数（0 なら へらさない）')
    a = ap.parse_args()

    im = Image.open(a.src).convert('RGB')
    rgb = np.asarray(im).astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

    dark = lum < 140
    ring = ndimage.generate_binary_structure(2, 1)
    walls = ndimage.binary_dilation(dark, ring, iterations=a.close)
    # 外がわ = 画面のふちから つながっている、線でない ところ
    lab, _ = ndimage.label(~walls)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    outside = np.isin(lab, edge[edge > 0])
    # 太らせたぶん、外がわを 線のきわまで 広げなおす（すきまから 中へは close ピクセルしか 入らない）
    outside = ndimage.binary_dilation(outside, ring, iterations=a.close) & ~dark

    alpha = np.full(lum.shape, 255, np.float32)
    # 外がわの 線のきわ（うすいグレー）は、こさに あわせて 半とうめいの 黒にする
    soft = np.clip((235 - lum) / (235 - 140), 0, 1) * 255
    alpha[outside] = soft[outside]
    out = rgb.copy()
    out[outside] = 0  # 外がわに のこる 線のきわは 黒（白い ふちどりが 出ないように）
    rgba = np.dstack([out, alpha]).clip(0, 255).astype(np.uint8)

    ys, xs = np.nonzero(alpha > 8)
    crop = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    if a.size:
        inner = round(a.size * (1 - 2 * a.margin))
        s = inner / max(crop.width, crop.height)
        crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
        canvas = Image.new('RGBA', (a.size, a.size), (0, 0, 0, 0))
        x = (a.size - crop.width) // 2
        y = a.size - round(a.size * a.margin) - crop.height  # 足もとを 下にそろえる
        canvas.paste(crop, (x, y))
        crop = canvas
    if a.colors:
        crop = crop.quantize(colors=a.colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    crop.save(a.dst, optimize=True)
    print(a.dst, crop.size)


if __name__ == '__main__':
    main()
