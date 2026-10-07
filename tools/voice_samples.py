#!/usr/bin/env python3
"""
ニャーちゃん・ニューちゃん（妹）の声の候補を Gemini TTS で作り、聞きくらべページを作る（要件定義書 7.5 N-53）。

使い方: GEMINI_API_KEY を設定してから  python3 tools/voice_samples.py
  出力: assets/voice_samples/<候補>/<セリフ>.wav と assets/voice_samples/聞きくらべ.html
  作り直したい候補だけ消してもう一度動かすと、無いファイルだけを作る。
  APIキーは 作る人の 手元（環境変数）だけで 使い、リポジトリには 入れない（N-54）。

候補は2種類:
  ・design   … 文章で声を説明して新しく作る声（Voice design）。Google のプロジェクトに保存され、1年で消える
  ・prebuilt … 用意されている30種類の声に、話し方の指示（style）をつけたもの
えらんだ候補の key を tools/make_voice.py の VOICE（nya・nyu）に書く。
"""
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'voice_samples')
API = 'https://generativelanguage.googleapis.com/v1beta'
MODEL = 'gemini-3.8-flash-tts'

# 試すセリフ（js/character.js・js/character_nyu.js から、気持ちのちがうものを選んだ）。who = だれの セリフか
# tts は読み上げに渡す文。アクセントが自然になるよう漢字まじりにし、笑い・あくびはタグで入れる
LINES = [
    {'key': 'greet',  'who': 'nya', 'shown': 'にゃっほー！ きょうも あそびに きてくれた ニャー！', 'tts': 'にゃっほー！ 今日も遊びに来てくれた、ニャー！'},
    {'key': 'yummy',  'who': 'nya', 'shown': 'ぺろり！ おいしかった ニャー！',                     'tts': 'ぺろり！ おいしかった、ニャー！'},
    {'key': 'tickle', 'who': 'nya', 'shown': 'うふふ、 くすぐったい ニャー',                       'tts': '<giggle> うふふ、くすぐったい、ニャー。'},
    {'key': 'sleepy', 'who': 'nya', 'shown': 'ふぁ〜あ、 ねむく なっちゃった ニャー',              'tts': '<yawn> ふぁーあ、眠くなっちゃった、ニャー。'},
    {'key': 'hungry', 'who': 'nya', 'shown': 'おなか ぺこぺこ ニャー…',                            'tts': 'おなか、ぺこぺこ、ニャー……'},
    {'key': 'n_hi',   'who': 'nyu', 'shown': 'こんにちは！ あそびに きた ニュー！',                 'tts': 'こんにちは！ 遊びに来た、ニュー！'},
    {'key': 'n_pet',  'who': 'nyu', 'shown': 'えへへ、 くすぐったい ニュー',                       'tts': '<giggle> えへへ、くすぐったい、ニュー。'},
    {'key': 'n_bye',  'who': 'nyu', 'shown': 'そろそろ かえる。 また くる ニュー！',                'tts': 'そろそろ帰る。また来る、ニュー！'},
]

NYA_STYLE = 'a cute, cheerful and easygoing little kitten girl who loves food, sweet and warm'
NYU_STYLE = 'a tiny, playful and mischievous little kitten girl, younger sister, very high and bouncy'

# 人間の小さな子どもとして説明すると安全フィルターで断られることがあるので、絵本・ゲームの子ネコのキャラクターとして説明する
CANDIDATES = [
    # ---- ニャーちゃん ----
    {'key': 'A1_nonbiri', 'who': 'nya', 'name': 'ニャー：のんびり あかるい', 'kind': 'design',
     'memo': 'あかるく、のんびりした やさしい声。いちばん ニャーちゃんの 性格に 近い ねらい',
     'prompt': 'A cheerful, easygoing cartoon kitten girl character from a children\'s picture book, with a sweet, warm, '
               'slightly high voice; relaxed and happy, a little greedy for snacks, speaking Japanese gently.'},
    {'key': 'A2_genki', 'who': 'nya', 'name': 'ニャー：げんき いっぱい', 'kind': 'design',
     'memo': 'はずむような 明るい声。よく笑う',
     'prompt': 'A lively cartoon kitten girl character from a children\'s game, with a bright, high, bouncy voice and an easy giggle, '
               'speaking Japanese with cheerful enthusiasm.'},
    {'key': 'A3_Leda', 'who': 'nya', 'name': 'ニャー：Leda（わかわかしい）', 'kind': 'prebuilt', 'voice': 'Leda',
     'memo': '用意されている声。説明は「Youthful」', 'style': NYA_STYLE},
    {'key': 'A4_Achernar', 'who': 'nya', 'name': 'ニャー：Achernar（やわらか）', 'kind': 'prebuilt', 'voice': 'Achernar',
     'memo': '用意されている声。説明は「Soft」', 'style': NYA_STYLE},
    # ---- ニューちゃん（妹。ニャーちゃんより 高く、おさない 声） ----
    {'key': 'B1_imouto', 'who': 'nyu', 'name': 'ニュー：いたずらっこの いもうと', 'kind': 'design',
     'memo': 'ニャーちゃんより 高くて おさない、元気な声',
     'prompt': 'A tiny, playful cartoon kitten character who is the little sister, from a children\'s picture book, '
               'with a very high, small, bouncy voice; mischievous and cheerful, speaking Japanese with lots of energy.'},
    {'key': 'B2_Laomedeia', 'who': 'nyu', 'name': 'ニュー：Laomedeia（はずむ）', 'kind': 'prebuilt', 'voice': 'Laomedeia',
     'memo': '用意されている声。説明は「Upbeat」', 'style': NYU_STYLE},
    {'key': 'B3_Zephyr', 'who': 'nyu', 'name': 'ニュー：Zephyr（あかるい）', 'kind': 'prebuilt', 'voice': 'Zephyr',
     'memo': '用意されている声。説明は「Bright」', 'style': NYU_STYLE},
]


class DailyLimit(Exception):
    """1日に使える回数（Tier 1 は 1モデル 100回）を使いきった"""


def call(method, path, body=None):
    key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not key:
        sys.exit('GEMINI_API_KEY が設定されていません（~/.zshrc に書いて、新しいターミナルで動かす）')
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(6):
        req = urllib.request.Request(API + path, data=data, method=method, headers={
            'x-goog-api-key': key, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')
            if e.code == 429 and 'per day' in msg:
                # 1日に使える回数を使いきった（待っても今日は作れないので、すぐにやめる）
                raise DailyLimit(re.sub(r'\s+', ' ', msg)[:400])
            if e.code in (429, 500, 503) and attempt < 5:
                wait = 10 * (attempt + 1)
                print(f'    {e.code} → {wait}秒まって やりなおし')
                time.sleep(wait)
                continue
            raise RuntimeError(f'エラー {e.code}: {msg[:800]}')


def ensure_voice(c, ids):
    """文章で作る声を用意する（作った ID は voices.json に覚えておき、2回目からは使い回す）"""
    if c['key'] in ids:
        return ids[c['key']]
    print(f'  声をつくる: {c["name"]}')
    res = call('POST', '/voices', {'store': True, 'voice': {
        'model': MODEL, 'type': 'prompted', 'display_name': 'nya_' + c['key'],
        'gender': 'female', 'language_code': 'ja-JP', 'prompted': {'input': c['prompt']}}})
    ids[c['key']] = res['id']
    d = os.path.join(OUT, c['key'])
    os.makedirs(d, exist_ok=True)
    if (res.get('sample_audio') or {}).get('data'):
        with open(os.path.join(d, '_preview.wav'), 'wb') as f:
            f.write(base64.b64decode(res['sample_audio']['data']))
    return res['id']


def tts(text, voice, style=None, model=None):
    part = {'type': 'text', 'text': text}
    if style:
        part['annotations'] = [{'type': 'speech_metadata', 'style': style}]
    res = call('POST', '/interactions', {
        'model': model or MODEL,
        'input': [{'type': 'user_input', 'content': [part]}],
        'response_format': {'type': 'audio'},
        'generation_config': {'speech_config': [{'voice': voice}]}})
    audio = [c for s in res.get('steps', []) if s.get('type') == 'model_output'
             for c in s.get('content', []) if c.get('type') == 'audio']
    if not audio:
        raise RuntimeError('音声が返ってきませんでした: ' + json.dumps(res, ensure_ascii=False)[:800])
    return base64.b64decode(audio[-1]['data'])


def main():
    os.makedirs(OUT, exist_ok=True)
    ids_path = os.path.join(OUT, 'voices.json')
    ids = json.load(open(ids_path)) if os.path.exists(ids_path) else {}
    failed = []  # 1つ失敗しても、ほかの候補は作りつづける
    for c in CANDIDATES:
        print(f'■ {c["name"]}')
        try:
            if c['kind'] == 'design':
                voice = ensure_voice(c, ids)
                with open(ids_path, 'w') as f:
                    json.dump(ids, f, ensure_ascii=False, indent=2)
            else:
                voice = c['voice']
        except RuntimeError as e:
            print(f'  ✗ {e}')
            failed.append(c['name'])
            continue
        d = os.path.join(OUT, c['key'])
        os.makedirs(d, exist_ok=True)
        for ln in [x for x in LINES if x['who'] == c['who']]:
            p = os.path.join(d, ln['key'] + '.wav')
            if os.path.exists(p):
                continue
            print(f'  {ln["shown"]}')
            try:
                wav = tts(ln['tts'], voice, c.get('style'))
            except RuntimeError as e:
                print(f'  ✗ {e}')
                failed.append(f'{c["name"]}「{ln["shown"]}」')
                continue
            with open(p, 'wb') as f:
                f.write(wav)
    write_page()
    print('できました: ' + os.path.join(OUT, '聞きくらべ.html'))
    if failed:
        print('作れなかったもの: ' + '、'.join(failed))


def to_aac(wav_path, m4a_path):
    """WAV を AAC（m4a）に する。Mac は afconvert、ほかは ffmpeg を つかう"""
    if shutil.which('afconvert'):
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', wav_path, m4a_path], check=True)
    elif shutil.which('ffmpeg'):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav_path, '-c:a', 'aac', '-b:a', '64k', m4a_path], check=True)
    else:
        sys.exit('afconvert（Mac）か ffmpeg が 必要です')


def embed(wav_path):
    """ページに埋めこむため、AAC（m4a）に小さくしてから data URL にする（ファイル1つだけでどこでも聞けるように）"""
    with tempfile.TemporaryDirectory() as tmp:
        m4a = os.path.join(tmp, 'a.m4a')
        to_aac(wav_path, m4a)
        return 'data:audio/mp4;base64,' + base64.b64encode(open(m4a, 'rb').read()).decode()


def write_page():
    os.makedirs(OUT, exist_ok=True)
    audio = {}
    for c in CANDIDATES:
        for ln in LINES:
            p = os.path.join(OUT, c['key'], ln['key'] + '.wav')
            if os.path.exists(p):
                audio[c['key'] + '/' + ln['key']] = embed(p)
    data = {'lines': [{'key': l['key'], 'shown': ('ニューちゃん：' if l['who'] == 'nyu' else 'ニャーちゃん：') + l['shown']} for l in LINES],
            'candidates': [{k: c.get(k) for k in ('key', 'name', 'kind', 'memo', 'voice')} for c in CANDIDATES],
            'audio': audio}
    tpl = open(os.path.join(ROOT, 'tools', 'voice_samples_page.html'), encoding='utf-8').read()
    with open(os.path.join(OUT, '聞きくらべ.html'), 'w', encoding='utf-8') as f:
        f.write(tpl.replace('/*DATA*/null', json.dumps(data, ensure_ascii=False)))


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--page':
        write_page()
    else:
        main()
