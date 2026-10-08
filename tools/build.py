#!/usr/bin/env python3
"""公開用のファイルを そろえる（要件定義書 6.6 N-40・N-42）

  python3 tools/build.py              … sw.js の「保存するファイルの一覧」と版、js/asset_list.js を 書きなおす
  python3 tools/build.py --out _site  … そのうえで、公開するファイルだけを _site にコピーする

・保存するファイル = ゲーム本体（index.html・manifest・css・js・icons）と、
  プログラムの中に名前が書いてある絵・声（assets/...）のうち、実際にあるもの。
・要件定義書・tools・絵を作ったときの記録などは 公開しない。
・js/asset_list.js = 実際にある 絵・声の ファイルの 一覧。ゲームは ここに 無い ファイルを 読みに いかない
  （まだ 無い 絵を 読みに いって「見つからない」と なるのを ふせぐ）。絵を 足したら このコマンドを 動かす。
・js/build_info.js = 最終更新の 日時（保護者メニューに 出す）。--out の ときだけ 作り、リポジトリには 入れない
  （ふだんの ときにも 一覧に 入れると、コミットの たびに sw.js が 変わって しまうため）。
GitHub Actions（.github/workflows/pages.yml）が、公開の前に --out _site で動かす。
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
from datetime import datetime, timedelta, timezone
from glob import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORE = ['index.html', 'manifest.webmanifest', 'css/*.css', 'js/**/*.js', 'icons/*.png']
BUILD_INFO = 'js/build_info.js'
JST = timezone(timedelta(hours=9))
ASSET_RE = re.compile(r"""['"`](assets/[^'"`\s]+?\.(?:png|jpe?g|webp|gif|svg|mp3|m4a|wav|ogg))['"`]""")


def file_rev(rel):
    h = hashlib.sha1()
    with open(os.path.join(ROOT, rel), 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()[:10]


def offline_files(with_build_info=False):
    files = set()
    for pat in CORE:
        for p in glob(os.path.join(ROOT, pat), recursive=True):
            files.add(os.path.relpath(p, ROOT).replace(os.sep, '/'))
    files.discard(BUILD_INFO)
    if with_build_info and os.path.isfile(os.path.join(ROOT, BUILD_INFO)):
        files.add(BUILD_INFO)
    for js in [f for f in files if f.endswith('.js')]:
        with open(os.path.join(ROOT, js), encoding='utf-8') as f:
            for m in ASSET_RE.finditer(f.read()):
                if os.path.isfile(os.path.join(ROOT, m.group(1))):
                    files.add(m.group(1))
    return sorted(files, key=lambda f: (f != 'index.html', f))


def update_asset_list():
    """プログラムの中に 名前が 書いてある 絵・声の うち、実際に ある ものの 一覧を js/asset_list.js に 書く"""
    found = set()
    for js in glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True):
        if js.endswith('asset_list.js'):
            continue
        with open(js, encoding='utf-8') as f:
            for m in ASSET_RE.finditer(f.read()):
                if os.path.isfile(os.path.join(ROOT, m.group(1))):
                    found.add(m.group(1))
    rows = ',\n'.join('  ' + json.dumps(f, ensure_ascii=False) for f in sorted(found))
    src = ('/* 実際に ある 絵・声の ファイル（tools/build.py が 自動で 作る。手で 直さない） */\n'
           'window.G = window.G || {};\n\n'
           f'G.ASSET_FILES = [\n{rows}\n];\n')
    path = os.path.join(ROOT, 'js', 'asset_list.js')
    old = open(path, encoding='utf-8').read() if os.path.exists(path) else ''
    if old != src:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
    return len(found)


def write_build_info():
    """最後の コミットの 日時（日本時間）を js/build_info.js に 書く。とれない ときは 今の 時刻"""
    t = None
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cI'], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
        if out:
            t = datetime.fromisoformat(out)
    except (OSError, subprocess.CalledProcessError, ValueError):
        pass
    t = (t or datetime.now(JST)).astimezone(JST).replace(microsecond=0)
    label = f'{t.year}年{t.month}月{t.day}日 {t.hour}:{t.minute:02d}'
    src = ('/* 最終更新の 日時（tools/build.py --out が 自動で 作る。リポジトリには 入れない） */\n'
           'window.G = window.G || {};\n\n'
           f'G.BUILD_INFO = {{ updated: {json.dumps(t.isoformat())}, label: {json.dumps(label, ensure_ascii=False)} }};\n')
    with open(os.path.join(ROOT, BUILD_INFO), 'w', encoding='utf-8') as f:
        f.write(src)
    return label


def update_sw(files):
    path = os.path.join(ROOT, 'sw.js')
    with open(path, encoding='utf-8') as f:
        src = f.read()
    revs = [(f, file_rev(f)) for f in files]
    version = hashlib.sha1('\n'.join(f'{a}:{b}' for a, b in revs).encode()).hexdigest()[:10]
    rows = ',\n'.join(f'  [{json.dumps(a, ensure_ascii=False)}, {json.dumps(b)}]' for a, b in revs)
    block = f"/* @@FILES-BEGIN */\nconst VERSION = '{version}';\nconst FILES = [\n{rows}\n];\n/* @@FILES-END */"
    new = re.sub(r'/\* @@FILES-BEGIN \*/.*?/\* @@FILES-END \*/', lambda _: block, src, flags=re.S)
    if new != src:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
    return version


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', help='公開するファイルを コピーする フォルダ')
    a = ap.parse_args()
    n = update_asset_list()
    print(f'js/asset_list.js：{n} ファイル')
    if a.out:
        print(f'{BUILD_INFO}：{write_build_info()}')
    files = offline_files(with_build_info=bool(a.out))
    version = update_sw(files)
    total = sum(os.path.getsize(os.path.join(ROOT, f)) for f in files)
    print(f'sw.js：版 {version}・{len(files)} ファイル・{total / 1e6:.1f}MB')
    if a.out:
        out = os.path.abspath(a.out)
        if os.path.exists(out):
            shutil.rmtree(out)
        for rel in files + ['sw.js']:
            dst = os.path.join(out, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(ROOT, rel), dst)
        open(os.path.join(out, '.nojekyll'), 'w').close()  # GitHub Pages に そのまま 出してもらう
        print(f'{out} に コピーしました')


if __name__ == '__main__':
    main()
