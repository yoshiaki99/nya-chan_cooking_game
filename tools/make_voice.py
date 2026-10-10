#!/usr/bin/env python3
"""
ゲームで読み上げる文を、ぜんぶ Gemini TTS の声で作る（要件定義書 7.5）。ニャーちゃん・ニューちゃんは べつの 声。

使い方: GEMINI_API_KEY を設定してから  python3 tools/make_voice.py  [--lite] [--only m_] [--batch 8] [--list]
  --lite     軽い版のモデルで作る。1日の上限はモデルごとに別
  --batch 8  8つずつまとめて作る（上限の節約用。区切りがずれることがある）
  --only m_  id が m_ で始まるもの（ニャーちゃんのセリフ）だけ作る。n_ なら ニューちゃん、g_ ならボタンなどの名前だけ
  --list     作る文と読みの一覧を出すだけ（APIキーが なくても 動く）
  ・読み上げる文は js/character.js・js/character_nyu.js（セリフ）と js/data.js（ボタンなどの名前）から自動で集める。
  ・できた音声は assets/voice/*.m4a、文と音声の対応表は js/voice_clips.js（ゲームが読む）。
  ・もとの WAV は tools/voice_wav/ に残す（大きいので リポジトリには 入れない）。作り直したい文は、その WAV と m4a を消してもう一度動かす。
  ・セリフを書きかえたときも、もう一度動かせば、新しい文だけを作る（古い音声は使われなくなるだけ）。
  ・音声が無い文は、ゲームがこれまでどおりブラウザの読み上げで読む。
  ・APIキーは 作る人の 手元（環境変数）だけで 使い、リポジトリには 入れない（N-54）。
  ・つかう もの：Python 3、Node.js（ゲームの データを 読む）、afconvert（Mac）か ffmpeg（m4a に する）

声は tools/voice_samples.py で 聞きくらべて えらんだ 候補（ID は assets/voice_samples/voices.json）。下の VOICE に 書く。
"""
import array
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import wave
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice_samples as vs  # noqa: E402  API の呼び出しは聞きくらべ用と共通

ROOT = vs.ROOT
# だれの 声に どの 候補を つかうか（tools/voice_samples.py の CANDIDATES の key）。ボタンなどの 名前は ニャーちゃんの 声
VOICE = {'nya': 'A1_nonbiri', 'nyu': 'B1_imouto'}
OUT = os.path.join(ROOT, 'assets', 'voice')
WAV = os.path.join(ROOT, 'tools', 'voice_wav')
MANIFEST = os.path.join(ROOT, 'js', 'voice_clips.js')

# 読み上げに渡す文。画面の文（ひらがな・分かち書き）のままだとアクセントがくずれやすいので、漢字まじりにする。
# 笑い・あくびは <giggle> <yawn> のタグで入れる。ここに無い文は、画面の文のまま読ませる。
READING = {
    # ---- ニャーちゃんの セリフ（「ニャー」の 前で ひと息 おくと 聞きとりやすい） ----
    'にゃっほー！ きょうも あそびに きてくれた ニャー！': 'にゃっほー！ 今日も遊びに来てくれた、ニャー！',
    'おなか ぺこぺこ ニャー…': 'おなか、ぺこぺこ、ニャー……',
    'ふぁ〜あ、 ねむく なっちゃった ニャー': '<yawn> ふぁーあ、眠くなっちゃった、ニャー。',
    'うふふ、 くすぐったい ニャー': '<giggle> うふふ、くすぐったい、ニャー。',
    'ぺろり！ おいしかった ニャー！': 'ぺろり！ おいしかった、ニャー！',
    'わたしの いもうとの ニューちゃん ニャー！': 'わたしの妹の、ニューちゃん、ニャー！',
    # ---- ニューちゃんの セリフ ----
    'えへへ、 くすぐったい ニャー': '<giggle> えへへ、くすぐったい、ニャー。',
    'ニューだよ。 よろしく ニャー！': 'ニューだよ。よろしく、ニャー！',
    'ニューも おなか すいた ニャー': 'ニューもね、おなか空いた、ニャー。',  # 「ニューも」が「ニャーも」に なりやすい
    'ニューちゃん、 いらっしゃい ニャー！': 'にゅーちゃん、いらっしゃい、ニャー！',  # 「ニューちゃん」が「ニャーちゃん」に なりやすい
    'ニューちゃん、 また くる ニャー！': 'にゅーちゃん、また来る、ニャー！',
    'ニューも いっしょに いく ニャー！': 'にゅーも、一緒に行く、ニャー！',
    'ニューの たからもの ニャー！': 'にゅーの、宝物、ニャー！',
    # ---- ボタン・あそびの 名前 ----
    'けいとだま ころころ': '毛糸玉、ころころ。',

    # ==== おりょうりゲームの セリフ（ニャーちゃん） ====
    'にゃっほー！ きょうも おりょうり する ニャー！': 'にゃっほー！ 今日も、お料理する、ニャー！',
    'おかえり！ また いっしょに つくろう ニャー': 'おかえり！ また一緒に作ろう、ニャー。',
    'にゃっほー！ キッチンに きた ニャー！': 'にゃっほー！ キッチンに来た、ニャー！',
    'なにを つくろう ニャー？': '何を作ろう、ニャー？',
    'ニューちゃんに おいしいの つくって あげる ニャー！': 'にゅうちゃんに、おいしいの作ってあげる、ニャー！',  # 「にゃんちゃん」と 読まれた
    'エプロン、 きもちが ひきしまる ニャー': 'エプロン、気持ちが引きしまる、ニャー。',
    'いい においが すると しあわせ ニャー〜': 'いい匂いがすると、幸せ、ニャー〜。',
    'したの フライパンを おして ニャー！': '下のフライパンを押して、ニャー！',
    'キッチンに きた！ おりょうり する ニャー！': 'キッチンに来た！ お料理する、ニャー！',
    'おうちに かえる ニャー！': 'おうちに帰る、ニャー！',
    'ハートを もって かえる ニャー！': 'ハートを持って帰る、ニャー！',
    'ハートを もっと ためたら つくれる ニャー！': 'ハートを、もっとためたら、作れる、ニャー！',
    'ハートを もっと ためたら きられる ニャー！': 'ハートを、もっとためたら、着られる、ニャー！',
    'インターネットに つながって いるときに かえる ニャー': 'インターネットに、つながっている時に帰る、ニャー。',
    'まかせて ニャー！': '任せて、ニャー！',
    'もうすこし まってね。 いま じゅんびちゅう ニャー！': 'もう少し待ってね。今、準備中、ニャー！',
    'なにを つくる ニャー？': '何を作る、ニャー？',
    'ざいりょうを あつめる ニャー！': '材料を集める、ニャー！',
    'れいぞうこと たなから だす ニャー': '冷蔵庫と棚から出す、ニャー。',
    'それは こんど つかう ニャー': 'それは、今度使う、ニャー。',
    'ぜんぶ そろった ニャー！': '全部そろった、ニャー！',
    'ごはんを よそう ニャー！': 'ご飯をよそう、ニャー！',
    'なかの ぐは どれに する ニャー？': '中の具は、どれにする、ニャー？',
    'ぎゅっ ぎゅっと にぎる ニャー！': 'ぎゅっ、ぎゅっと握る、ニャー！',
    'のりを まく ニャー！': '海苔を巻く、ニャー！',
    'パンに バターを ぬる ニャー！': 'パンにバターを塗る、ニャー！',
    'すきな ぐを はさむ ニャー！': '好きな具を挟む、ニャー！',
    'できたら チェックを おして ニャー': 'できたら、チェックを押して、ニャー。',
    'てんせんに そって きる ニャー！': '点線に沿って切る、ニャー！',
    'きるときは ねこの て ニャー！': '切る時は、猫の手、ニャー！',
    'ほんとうの ほうちょうは、 おとなの ひとと いっしょに つかう ニャー！': '本当の包丁は、大人の人と一緒に使う、ニャー！',
    'ほんとうの ひは、 おとなの ひとと いっしょに つかう ニャー！': '本当の火は、大人の人と一緒に使う、ニャー！',
    'たまごを こつん ニャー！': '卵を、こつん、ニャー！',
    'ぐるぐる まぜまぜ ニャー〜': 'ぐるぐる、まぜまぜ、ニャー〜。',
    'コンロの つまみを おして ニャー！': 'コンロのつまみを押して、ニャー！',
    'ジュージュー… いい におい ニャー〜': 'ジュージュー…… いい匂い、ニャー〜。',
    'いい におい！ いまが ちょうどいい ニャー！': 'いい匂い！ 今がちょうどいい、ニャー！',
    'えいっと ひっくりかえす ニャー！': 'えいっと、ひっくり返す、ニャー！',
    'くるっ！ じょうず ニャー！': 'くるっ！ 上手、ニャー！',
    'いいかんじ ニャー！': 'いい感じ、ニャー！',
    'じょうず ニャー！': '上手、ニャー！',
    'その ちょうし ニャー！': 'その調子、ニャー！',
    'おみずで きれいに あらう ニャー！': 'お水で、きれいに洗う、ニャー！',
    'こねこね、 まるく する ニャー！': 'こねこね、丸くする、ニャー！',
    'ぺたぺた、 かたちを つくる ニャー！': 'ぺたぺた、形を作る、ニャー！',
    'ごはんを ちいさく にぎる ニャー！': 'ご飯を小さく握る、ニャー！',
    'めんぼうで のばす ニャー！': 'めん棒で伸ばす、ニャー！',
    'すきな ところを かたぬき する ニャー！': '好きなところを、型抜きする、ニャー！',
    'ソースを ぬりぬり ニャー！': 'ソースを、ぬりぬり、ニャー！',
    'クリームを ぬりぬり ニャー！': 'クリームを、ぬりぬり、ニャー！',
    'オーブンに いれる ニャー！': 'オーブンに入れる、ニャー！',
    'やけるまで まつ ニャー〜': '焼けるまで待つ、ニャー〜。',
    'チン！ やけた ニャー！': 'チン！ 焼けた、ニャー！',
    'おなべを ぐるぐる まぜる ニャー！': 'お鍋を、ぐるぐる混ぜる、ニャー！',
    'ぐつぐつ、 いい におい ニャー！': 'ぐつぐつ、いい匂い、ニャー！',
    'れいぞうこで ひやす ニャー！': '冷蔵庫で冷やす、ニャー！',
    'ひえひえ！ かたまった ニャー！': 'ひえひえ！ 固まった、ニャー！',
    'カップに いれる ニャー！': 'カップに入れる、ニャー！',
    'ごはんに かける ニャー！': 'ご飯にかける、ニャー！',
    'くるくる まく ニャー！': 'くるくる巻く、ニャー！',
    'フライがえしで まぜる ニャー！': 'フライ返しで混ぜる、ニャー！',
    'ちょっと あじみ… ぺろり！ おいしい ニャー！': 'ちょっと味見…… ぺろり！ おいしい、ニャー！',
    'すきな ものを のせて かざる ニャー！': '好きなものを乗せて、飾る、ニャー！',
    'ソースで おえかき も できる ニャー！': 'ソースで、お絵かきもできる、ニャー！',
    'きれいに ふいた ニャー': 'きれいに拭いた、ニャー。',
    'どれを きる ニャー？': 'どれを着る、ニャー？',
    'じゃーん！ にあってる ニャー？': 'じゃーん！ 似合ってる、ニャー？',
    'つくった おりょうりの しゃしん ニャー！': '作ったお料理の写真、ニャー！',
    'まだ つくって いない ニャー': 'まだ作っていない、ニャー。',
    'この しゃしん、 けす ニャー？': 'この写真、消す、ニャー？',
    'しゃしん パチリ！ レシピちょうに のこす ニャー！': '写真、パチリ！ レシピ帳に残す、ニャー！',
    'ニューちゃんの ところへ はこぶ ニャー！': 'にゅーちゃんのところへ、運ぶ、ニャー！',  # 「ニャーちゃん」に なりやすい
    'めしあがれ ニャー！': '召し上がれ、ニャー！',
    'わたしも いっしょに たべる ニャー！': 'わたしも一緒に食べる、ニャー！',
    'おりょうり、 やめる ニャー？': 'お料理、やめる、ニャー？',
    'また いっしょに つくろう ニャー！': 'また一緒に作ろう、ニャー！',
    'あたらしい レシピを おぼえた ニャー！': '新しいレシピを覚えた、ニャー！',
    'あたらしい おしゃれが ふえた ニャー！': '新しいおしゃれが増えた、ニャー！',
    'あたらしい おさらが ふえた ニャー！': '新しいお皿が増えた、ニャー！',
    'プレゼントが とどいた ニャー！': 'プレゼントが届いた、ニャー！',
    # ==== おりょうりゲームの セリフ（ニューちゃん） ====
    'おねえちゃん、 おなか すいた ニャー！': 'お姉ちゃん、おなか空いた、ニャー！',
    'なにか つくって ニャー！': '何か作って、ニャー！',
    'きょうは この おりょうりが たべたい ニャー！': '今日は、このお料理が食べたい、ニャー！',
    'いい におい ニャー！': 'いい匂い、ニャー！',
    'まだかな〜、 たのしみ ニャー！': 'まだかなー、楽しみ、ニャー！',
    'おなか いっぱい。 ごちそうさま ニャー！': 'おなか、いっぱい。ごちそうさま、ニャー！',
    'もぐもぐ ニャー…': 'もぐもぐ、ニャー……',
    'ほっぺが おちちゃう ニャー！': 'ほっぺが落ちちゃう、ニャー！',
    'しあわせ ニャー〜': '幸せ、ニャー〜。',
    'おえかき、 かわいい ニャー！': 'お絵かき、かわいい、ニャー！',
    'これ だいすき！ ありがとう ニャー！': 'これ、大好き！ ありがとう、ニャー！',
    'おねえちゃん、 おぼえてて くれた ニャー！': 'お姉ちゃん、覚えててくれた、ニャー！',
    'やったー！ おねえちゃんと いっしょ ニャー！': 'やったー！ お姉ちゃんと一緒、ニャー！',
    'ふたりだと もっと おいしい ニャー！': '二人だと、もっとおいしい、ニャー！',
    'おなか いっぱい。 あとで たべる ニャー！': 'おなか、いっぱい。あとで食べる、ニャー！',
    'おねえちゃん、 まってた ニャー！': 'お姉ちゃん、待ってた、ニャー！',
    'また たべに くる ニャー！': 'また食べに来る、ニャー！',
    'また つくってね ニャー！': 'また作ってね、ニャー！',
    'あー！ おねえちゃん ずるい ニャー！': 'あー！ お姉ちゃん、ずるい、ニャー！',
    # ==== おりょうりゲームの ボタン ====
    'ニャーちゃん おりょうりゲーム': 'ニャーちゃん、お料理ゲーム。',
    'キッチンに もどる': 'キッチンに戻る。',
}
# 名前（リボンの色・シール）の読み。文の中に入るときもこれを使う
NAME_READING = {
    'みずいろ': '水色', 'きいろ': '黄色', 'むらさき': '紫', 'みどり': '緑',
    'きんいろ': '金色', 'にじいろ': '虹色', 'おさかな': 'お魚', 'おほしさま': 'お星さま', 'おひさま': 'お日さま',
    'おつきさま': 'お月さま', 'けいとだま': '毛糸玉', 'あしあと': '足あと', 'おんぷ': '音符',
    'ほうせき': '宝石', 'にじ': '虹', 'おはな': 'お花',
    'あか': '赤', 'ほし': '星', 'もも': '桃', 'おとす': '落とす',
    'ちゃいろ': '茶色', 'くろ': '黒', 'あたま': '頭', 'かお': '顔', 'くび': '首', 'せなか': '背中',
    'けしゴム': '消しゴム', 'ぜんぶ けす': '全部消す', 'とじる': '閉じる', 'はずす': '外す',
    'しゃしん とろう': '写真撮ろう', 'おみず': 'お水', 'おふね': 'お船', 'ひだりの みみ': '左の耳', 'みぎの みみ': '右の耳',
    'まじょの ぼうし': '魔女の帽子', 'サンタの ぼうし': 'サンタの帽子', 'はなかんむり': '花かんむり',
    'ベレーぼう': 'ベレーぼう',  # 「ベレー帽」は「カレー帽」と 読まれた 'まるメガネ': '丸メガネ', 'ハートの サングラス': 'ハートのサングラス',
    'おほしさま メガネ': 'お星さまメガネ', 'しんじゅの ネックレス': '真珠のネックレス', 'きんの すず': '金の鈴',
    'ハートの ペンダント': 'ハートのペンダント', 'ようせいの はね': '妖精の羽', 'しっぽの リボン': 'しっぽのリボン',
    'ニューちゃんの いえ': 'にゅーちゃんの家', 'ふく': '服', 'ぬぐ': '脱ぐ', 'ゆかた': '浴衣', 'バレエの ふく': 'バレエの服',
    'おばけの マント': 'おばけのマント', 'サンタの ふく': 'サンタの服', 'つぎの ふく': '次の服', 'まえの ふく': '前の服',
    # ---- おりょうりゲーム：ボタン・ぼうし・エプロン ----
    'もどる': '戻る', 'はじめに もどる': '始めに戻る', 'はじめる': '始める', 'つづける': '続ける',
    'つぎの ページ': '次のページ', 'まえの ページ': '前のページ', 'つぎの リボン': '次のリボン', 'まえの リボン': '前のリボン',
    'いろ': '色', 'けす': '消す', 'れいぞうこ': '冷蔵庫',
    'ふきん': '布巾',  # ひらがなだと「ふっきん」と 読まれた
    'ぼうし': '帽子', 'コックぼうし': 'コック帽子', 'さんかくきん': '三角巾', 'ネコみみ バンダナ': '猫耳バンダナ',
    'チェックの エプロン': 'チェック、のエプロン',  # 「チック」と 読まれた 'みずたまの エプロン': '水玉のエプロン', 'いちごの エプロン': 'いちごのエプロン',
    'おさかなの エプロン': 'お魚のエプロン', 'にくきゅうの エプロン': '肉球のエプロン', 'コックさんの ふく': 'コックさんの服',
    'まじょの エプロン': '魔女のエプロン', 'サンタの エプロン': 'サンタのエプロン',
    # ---- おりょうりゲーム：ざいりょう・おりょうり・シール ----
    'ごはん': 'ご飯', 'のり': '海苔', 'しゃけ': '鮭', 'たまご': '卵', 'こむぎこ': '小麦粉', 'ぎゅうにゅう': '牛乳',
    'さとう': '砂糖', 'はちみつ': '蜂蜜', 'にんじん': '人参', 'とりにく': '鶏肉', 'だいこん': '大根',
    'まぐろ': 'マグロ', 'たい': '鯛', 'いちごジャム': 'イチゴジャム',
    'やきざかな': '焼き魚', 'おすし': 'お寿司', 'いちごの ケーキ': 'いちごのケーキ', 'かぼちゃの パイ': 'かぼちゃのパイ',
    'めだまやき': '目玉焼き',
    # ---- おりょうりゲーム：ホームの ボタン・おさら ----
    'つくる': '作る',
    'まるい おさら': '丸いお皿', 'しかくい おさら': '四角いお皿', 'ハートの おさら': 'ハートのお皿',
    'おさかなの おさら': 'お魚のお皿', 'ネコの おさら': '猫のお皿', 'おほしさまの おさら': 'お星さまのお皿',
}
# 月（アクセサリーの「じゅうがつに なったら …」）
MONTH_READING = {'じゅうがつ': '十月', 'じゅうにがつ': '十二月'}
# ふつうの 文は 「ニャー」「ニュー」の 前で ひと息 おかせる（例：おなか すいた ニャー → おなか すいた、ニャー）
# それだけでは読み上げない、文の一部のセリフ（うしろや前に名前などがついてから読む）
FRAGMENTS = {'accSeason', 'unlockAcc', 'giftAcc', 'unlockMakeup', 'unlockClothes'}
# 数（シールちょうの「あと ○こ」）
COUNT_READING = {1: 'いっこ', 2: 'にこ', 3: 'さんこ', 4: 'よんこ', 5: 'ごこ',
                 6: 'ろっこ', 7: 'ななこ', 8: 'はっこ', 9: 'きゅうこ', 10: 'じゅっこ'}

# 気持ちをはっきり出したい文だけ、話し方の指示をつける（ほかは声にまかせる）
STYLE = {
    'ふぁ〜あ、 ねむく なっちゃった ニャー': 'sleepy and drowsy',
    'おやすみなさい ニャー…': 'sleepy, soft and quiet',
    'さみしい ニャー…': 'a little sad and lonely',
    'おなか ぺこぺこ ニャー…': 'a little sad and hungry',
}


# js/character.js・js/character_nyu.js・js/data.js を Node.js で 実際に 読みこみ、データを そのまま 取り出す
DUMP_JS = """
const fs = require('fs'), vm = require('vm');
const ctx = { window: {} }; ctx.window.G = ctx.G = {};
process.argv.slice(1).forEach(p => vm.runInNewContext(fs.readFileSync(p, 'utf8'), ctx));
process.stdout.write(JSON.stringify(ctx.G));
"""


def game_data():
    files = [os.path.join(ROOT, 'js', f) for f in ('character.js', 'character_nyu.js', 'data.js', 'recipes.js')]
    res = subprocess.run(['node', '-e', DUMP_JS] + files, capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def strings(s):
    return re.findall(r"'((?:[^'\\]|\\.)*)'", s)


def screen_words():
    """画面のプログラムに じかに書いてある、読み上げる言葉（say: 'もどる'、speak('はじめる') など）"""
    words = []
    for d in ('js', os.path.join('js', 'screens')):
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if not f.endswith('.js') or f in ('voice.js', 'voice_clips.js', 'asset_list.js', 'character.js', 'character_nyu.js', 'data.js', 'recipes.js'):
                continue
            src = open(os.path.join(ROOT, d, f), encoding='utf-8').read()
            exprs = re.findall(r"\bsay:\s*([^,}\n]+)", src)
            exprs += re.findall(r"G\.Voice\.speak\(([^\n]*?)(?:,\s*'(?:guide|chara|nyu)')?\)", src)
            exprs += re.findall(r"\bside\([^,]+,\s*('[^']+')", src)              # おえかきの よこの どうぐ
            exprs += re.findall(r"\[\s*'\w+',\s*('[^']+'),\s*(?:G\.Art|'')", src)       # おしゃれの タブ
            for e in exprs:
                if '+' in e:  # 組み立てる文は collect() で作る
                    continue
                words += [w for w in strings(e) if re.search(r'[ぁ-んァ-ヶ]', w)]
    return words


def collect():
    """ゲームで読み上げる文を集める。[(id, 画面の文), ...]  id は音声ファイルの名前になる"""
    G = game_data()
    L = G['CHARACTER']['lines']
    out = []
    # ニャーちゃんの セリフ（character.js の lines）は m_、ニューちゃん（character_nyu.js）は n_
    for pre, lines in (('m', L), ('n', G['CHARACTERS']['nyu']['lines'])):
        for key, v in lines.items():
            if key in FRAGMENTS:
                continue
            vals = v if isinstance(v, list) else [v]
            for i, t in enumerate(vals):
                out.append((f'{pre}_{key}' + (f'_{i + 1}' if len(vals) > 1 else ''), t))
    # ボタンなどの名前（前に作ったものと同じ id にしておく）
    # （おせわゲームに あった おやすみなさい・リボン・おえかき・アルバム・メイク・ふくの 前後の ボタンは、
    #   おりょうりゲームでは 読まないので 入れない）
    out += [('g_back', 'もどる'), ('g_yatta', 'やったね'), ('g_bye', 'またね'), ('g_again', 'はじめに もどる'),
            ('g_start', 'はじめる'), ('g_title', G['CHARACTER']['title']),
            ('g_stickers_all', 'ぜんぶ あつめたよ！'), ('g_draw_done', 'できた'),
            ('g_page_next', 'つぎの ページ'), ('g_page_prev', 'まえの ページ'), ('g_clothes_color', 'いろ')]
    for var, pre in (('CARES', 'care'), ('FOODS', 'food'), ('SOAPS', 'soap'), ('BATH_TOYS', 'bathtoy'), ('GAMES', 'game'),
                     ('CRAYONS', 'crayon'), ('DRAW_STAMPS', 'stamp'), ('RIBBONS', 'ribbon'), ('ACCESSORY_SLOTS', 'acc_slot'),
                     ('ACCESSORIES', 'acc'), ('CLOTHES', 'clothes'), ('OUTINGS', 'outing'),
                     ('INGREDIENTS', 'ing'), ('RECIPES', 'recipe'), ('PLATES', 'plate')):
        out += [(f'g_{pre}_{x["id"]}', x['label']) for x in G.get(var, [])]
    stickers = G.get('STICKERS', [])
    out += [(f'g_sticker_{i + 1:02d}', s['label']) for i, s in enumerate(stickers)]
    for c in G.get('MAKEUP', []):
        out.append((f'g_makeup_{c["id"]}', c['label']))
        out += [(f'g_makeup_{c["id"]}_{it["id"]}', it['label']) for it in c['items']]
    # 組み立てて読む文（js/main.js・js/screens/*.js と同じ形にする）
    out += [(f'g_book_{n:02d}', 'シールちょう。 つぎの シールまで ハート あと ' + str(n) + 'こ')
            for n in range(1, G.get('HEARTS_PER_STICKER', 10) + 1)]
    out += [(f'm_get_sticker_{i + 1:02d}', 'シールを もらったよ！ ' + s['label']) for i, s in enumerate(stickers)]
    out += [(f'm_get_ribbon_{r["id"]}', 'あたらしい リボンが ふえたよ！ ' + r['label'])
            for r in G.get('RIBBONS', []) if r.get('unlock', 0) > 0]
    for c in G.get('MAKEUP', []):
        out += [(f'm_get_makeup_{c["id"]}_{it["id"]}', L['unlockMakeup'] + ' ' + c['label'] + 'の ' + it['label'])
                for it in c['items'] if it.get('unlock', 0) > 0 and 'unlockMakeup' in L]
    for c in G.get('CLOTHES', []):
        if c.get('unlock', 0) > 0 and 'unlockClothes' in L:
            out.append((f'm_get_clothes_{c["id"]}', L['unlockClothes'] + ' ' + c['label']))
    for a in G.get('ACCESSORIES', []) + G.get('CLOTHES', []):
        if a.get('season'):
            if 'giftAcc' in L:
                out.append((f'm_gift_acc_{a["id"]}', L['giftAcc'] + ' ' + a['season']['name'] + 'の ' + a['label']))
            if 'accSeason' in L:
                out.append((f'm_season_acc_{a["id"]}', a['season']['when'] + L['accSeason']))
        elif a.get('unlock', 0) > 0 and 'unlockAcc' in L:
            out.append((f'm_get_acc_{a["id"]}', L['unlockAcc'] + ' ' + a['label']))
    # ---- おりょうりゲームで 組み立てて 読む 文（js/screens/*.js・js/main.js と 同じ 形にする） ----
    # ホームの ボタン（js/screens/main.js の buttons）
    out += [('g_home_cook', 'つくる'), ('g_home_dress', 'おしゃれ'), ('g_home_book', 'レシピ'), ('g_home_osewa', 'おうち')]
    for r in G.get('RECIPES', []):
        out.append((f'm_make_{r["id"]}', r['label'] + 'を つくる ニャー！'))   # レシピを えらんだ とき
        out.append((f'g_make_{r["id"]}', r['label'] + 'を つくる'))           # レシピちょうの「もう いちど つくる」
    # ごほうびの おしらせ（js/main.js の G.checkRewards）
    for key, var, line in (('recipe', 'RECIPES', 'unlockRecipe'), ('dress', 'CLOTHES', 'unlockDress'),
                           ('dress', 'ACCESSORIES', 'unlockDress'), ('plate', 'PLATES', 'unlockPlate')):
        out += [(f'm_unlock_{key}_{x["id"]}', x['label'] + '！ ' + L[line])
                for x in G.get(var, []) if x.get('unlock', 0) > 0 and line in L]
    seasonal = [x for x in G.get('RECIPES', []) + G.get('CLOTHES', []) if x.get('season')]
    if 'giftRecipe' in L:
        out += [(f'm_gift_{x["id"]}', x['season']['name'] + 'の ' + x['label'] + '！ ' + L['giftRecipe']) for x in seasonal]
    # まだ とどいて いない きせつの もの（js/screens/cook.js・dress.js）
    for x in seasonal:  # id は その月に とどく ものの id（ファイル名を 英数字に する ため）
        if not any(t == x['season']['when'] + 'に とどく ニャー！' for _, t in out):
            out.append((f'm_when_{x["id"]}', x['season']['when'] + 'に とどく ニャー！'))
    # 画面に じかに書いてある言葉で、まだ入っていないもの（新しいボタンなど）
    have = {t for _, t in out}
    for w in screen_words():
        if w not in have:
            have.add(w)
            out.append(('g_say_' + hashlib.sha1(w.encode()).hexdigest()[:8], w))
    # 同じ文は1つだけ作る（ニューちゃんの セリフは べつの 声なので、ニャーちゃんと 同じ文でも べつに 作る）。
    # もう声のある文は、そのときの id（ファイル名）をそのまま使う
    have_id = {t: k for k, t in manifest_items()}
    seen, uniq = set(), []
    for k, t in out:
        ck = clip_key(k, t)
        if ck not in seen:
            seen.add(ck)
            uniq.append((have_id.get(ck, k), t))
    return uniq


def clip_key(k, t):
    """対応表（js/voice_clips.js）での 文。ニューちゃんの セリフは「nyu:」をつける（js/voice.js も 同じ きまりで さがす）"""
    return 'nyu:' + t if k.startswith('n_') else t


def manifest_items():
    """いまの対応表（js/voice_clips.js）にある [(id, 文), ...]"""
    if not os.path.exists(MANIFEST):
        return []
    src = open(MANIFEST, encoding='utf-8').read()
    return [(k, json.loads(t)) for t, k in re.findall(r'^\s*("(?:[^"\\]|\\.)*"): \'assets/voice/(\w+)\.m4a\'', src, re.M)]


def reading(text):
    if text in READING:
        return READING[text]
    m = re.match(r'シールちょう。 つぎの シールまで ハート あと (\d+)こ$', text)
    if m:
        return f'シール帳。次のシールまで、ハート、あと{COUNT_READING[int(m.group(1))]}。'  # 「あと、」だと「あと」を 2回 読む ことが ある
    heads = {'シールを もらったよ！': 'シールをもらったよ！', 'あたらしい リボンが ふえたよ！': '新しいリボンが増えたよ！',
             'あたらしい メイクが ふえた ニャー！': '新しいメイクが増えた、ニャー！',
             'あたらしい アクセサリーが ふえた ニャー！': '新しいアクセサリーが増えた、ニャー！',
             'あたらしい ふくが ふえた ニャー！': '新しい服が増えた、ニャー！',
             'プレゼントが とどいた ニャー！': 'プレゼントが届いた、ニャー！'}
    m = re.match('(' + '|'.join(heads) + r') (.+)$', text)
    if m:
        name = m.group(2)
        if name in NAME_READING:
            name = NAME_READING[name]
        elif 'の ' in name:  # メイク「ほっぺの ハート」・プレゼント「ハロウィンの まじょの ぼうし」
            a, b = name.split('の ', 1)
            name = f'{NAME_READING.get(a, a)}の、{NAME_READING.get(b, b)}'
        return f'{heads[m.group(1)]} {name}！'
    m = re.match(r'(\S+)に なったら プレゼントが とどく ニャー$', text)
    if m:
        return f'{MONTH_READING.get(m.group(1), m.group(1))}になったら、プレゼントが届く、ニャー。'
    # おりょうりゲームの 組み立てた 文（名前 ＋ きまった 文）
    def name_of(n):
        if n in NAME_READING:
            return NAME_READING[n]
        if 'の ' in n:
            a, b = n.split('の ', 1)
            return f'{NAME_READING.get(a, a)}の{NAME_READING.get(b, b)}'
        return n
    m = re.match(r'(.+)を つくる( ニャー！)?$', text)
    if m:
        return f'{name_of(m.group(1))}を作る' + ('、ニャー！' if m.group(2) else '。')
    m = re.match(r'(.+?)！ (.+ ニャー！)$', text)
    if m:
        return f'{name_of(m.group(1))}！ ' + reading(m.group(2))
    m = re.match(r'(\S+)に とどく ニャー！$', text)
    if m:
        return f'{m.group(1)}に届く、ニャー！'  # 「十月」は「じっかん」と 読まれたので、月は ひらがなの まま
    if text in NAME_READING:
        return NAME_READING[text] + '。'
    text = re.sub(r' (ニャー|ニュー)([！？…〜]*)$', r'、\1\2', text)  # 語尾の 前で ひと息
    return text if re.search(r'[。！？…]$', text) else text + '。'


def polish(src, dst):
    """前後の無音を切りつめ、声の大きさをそろえる（24kHz・16bit・モノラルの WAV）"""
    with wave.open(src) as w:
        rate, pcm = w.getframerate(), array.array('h', w.readframes(w.getnframes()))
    th = 400  # これより小さい音は無音とみなす（約 -38dB）
    loud = [i for i in range(0, len(pcm), 120) if max(abs(x) for x in pcm[i:i + 120]) > th]
    if loud:
        a = max(0, loud[0] - int(rate * 0.04))
        b = min(len(pcm), loud[-1] + 120 + int(rate * 0.15))
        pcm = pcm[a:b]
    rms = (sum(x * x for x in pcm) / max(1, len(pcm))) ** 0.5
    peak = max(1, max(abs(x) for x in pcm))
    gain = min(32767 * 0.1 / max(rms, 1), 32767 * 0.89 / peak)  # 平均 -20dB、いちばん大きいところ -1dB まで
    pcm = array.array('h', (max(-32768, min(32767, int(x * gain))) for x in pcm))
    with wave.open(dst, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())


def to_m4a(wav_path, m4a_path):
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, 'p.wav')
        polish(wav_path, p)
        vs.to_aac(p, m4a_path)


def write_manifest(done):
    lines = ['/* 読み上げに使う声のファイル（tools/make_voice.py が自動で作る。手で直さない）',
             ' * 文がこの表とぴったり同じとき（空白のちがいは気にしない）に、この音声を使う。無い文はブラウザが読み上げる。',
             ' * 「nyu:」で はじまるものは ニューちゃんの 声。 */',
             'window.G = window.G || {};', '', 'G.VOICE_CLIPS = {']
    lines += [f'  {json.dumps(clip_key(k, t), ensure_ascii=False)}: \'assets/voice/{k}.m4a\',' for k, t in done]
    lines[-1] = lines[-1].rstrip(',')
    lines += ['};', '']
    with open(MANIFEST, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def wav_bytes(rate, pcm):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def split(data, n):
    """いくつかの文を続けて読ませた音声を、文と文のあいだの長い無音で n こに切る。うまく切れないときは None"""
    with wave.open(io.BytesIO(data), 'rb') as w:
        rate, pcm = w.getframerate(), array.array('h', w.readframes(w.getnframes()))
    step = rate // 100  # 10ミリ秒ずつ見る
    loud = [max((abs(x) for x in pcm[i:i + step]), default=0) > 400 for i in range(0, len(pcm), step)]
    gaps, i = [], 0  # 声と声のあいだの無音 (はじめ, 長さ)
    first = loud.index(True) if True in loud else 0
    last = len(loud) - 1 - loud[::-1].index(True) if True in loud else 0
    i = first
    while i <= last:
        if not loud[i]:
            j = i
            while j <= last and not loud[j]:
                j += 1
            gaps.append((i, j - i))
            i = j
        else:
            i += 1
    if len(gaps) < n - 1:
        return None
    cuts = sorted(sorted(gaps, key=lambda g: -g[1])[:n - 1])
    if min(g[1] for g in cuts) < 35:  # 0.35秒より短い無音では、文の区切りとは言いきれない
        return None
    edges = [0] + [(s + l // 2) * step for s, l in cuts] + [len(pcm)]
    return [wav_bytes(rate, pcm[a:b]) for a, b in zip(edges, edges[1:])]


def check(items):
    """作った音声を Gemini に聞かせて、文のとおりに読めているか確かめる。まちがっていた id を返す"""
    import base64
    import urllib.request

    def ask(batch):
        parts = [{'text': '各音声は子ネコのキャラクターのセリフです。期待する文と比べてください。'
                  '漢字/ひらがなの違い、句読点、語尾の伸ばし、笑い声やあくびの有無は問題にしない。'
                  '言葉の抜け・追加・読み間違い・別の言葉・英語のタグ名(giggle, yawn, pause など)の読み上げ・'
                  '別の文が混ざっている・途中で切れている・雑音があれば ng。'
                  ' JSON 配列 [{"id":..., "heard": 聞こえた日本語, "ok": true/false, "issue": "..."}] だけを返す。'}]
        for k, t in batch:
            parts.append({'text': f'id={k} 期待する文: 「{reading(t)}」'})
            with open(os.path.join(WAV, k + '.wav'), 'rb') as f:
                parts.append({'inline_data': {'mime_type': 'audio/wav', 'data': base64.b64encode(f.read()).decode()}})
        body = {'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json'}}
        key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
        req = urllib.request.Request(vs.API + '/models/gemini-3.8-flash:generateContent', data=json.dumps(body).encode(),
                                     headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
        res = json.loads(urllib.request.urlopen(req, timeout=300).read())
        return json.loads(res['candidates'][0]['content']['parts'][-1]['text'])

    with ThreadPoolExecutor(4) as pool:
        results = [r for rs in pool.map(ask, [items[i:i + 8] for i in range(0, len(items), 8)]) for r in rs]
    bad = [r for r in results if not r.get('ok')]
    for r in bad:
        print(f'  ✗ {r["id"]}: 「{r.get("heard")}」 {r.get("issue", "")}')
    return {r['id'] for r in bad}


def main():
    ids_path = os.path.join(ROOT, 'assets', 'voice_samples', 'voices.json')
    ids = json.load(open(ids_path)) if os.path.exists(ids_path) else {}
    cand = {c['key']: c for c in vs.CANDIDATES}
    # 声をつくる 候補は voices.json の ID、用意された声は その 名前（と 話し方の指示）
    def voice_of(who):
        c = cand[VOICE[who]]
        return (ids[c['key']] if c['kind'] == 'design' else c['voice']), c.get('style')
    who_of = lambda k: 'nyu' if k.startswith('n_') else 'nya'
    model = 'gemini-3.8-flash-lite-tts' if '--lite' in sys.argv else vs.MODEL
    batch_size = int(sys.argv[sys.argv.index('--batch') + 1]) if '--batch' in sys.argv else 1
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(WAV, exist_ok=True)
    todo = collect()
    if '--list' in sys.argv:
        for k, t in todo:
            print(f'{k:24} {t}  →  {reading(t)}' + (f'  [{STYLE[t]}]' if t in STYLE else ''))
        print(len(todo), '件')
        return
    # どの文を どのモデルで作ったかの記録 { id: {"model": ..., "text": 作ったときの文} }
    made_path = os.path.join(WAV, '_made.json')
    made = json.load(open(made_path)) if os.path.exists(made_path) else {}
    old = {k: t.replace('nyu:', '', 1) for k, t in manifest_items()}  # 前の版の記録（モデル名だけ）には、対応表から作ったときの文をおぎなう
    made = {k: (v if isinstance(v, dict) else {'model': v, 'text': old.get(k)}) for k, v in made.items()}

    # セリフの文が書きかわっていたら、前の声は消して作り直す（前の文の声が新しい文で鳴らないように）
    for k, t in todo:
        if made.get(k, {}).get('text') not in (None, t):
            print(f'  文が変わったので作り直します: {k}「{made[k]["text"]}」→「{t}」')
            for p in (os.path.join(WAV, k + '.wav'), os.path.join(OUT, k + '.m4a')):
                if os.path.exists(p):
                    os.remove(p)
            del made[k]
    text_of = dict(todo)

    def save(k, data):
        w = os.path.join(WAV, k + '.wav')
        with open(w + '.part', 'wb') as f:
            f.write(data)
        os.replace(w + '.part', w)  # 途中で止めても、こわれたファイルが残らないように
        made[k] = {'model': model, 'text': text_of[k]}

    # ふつうは1つずつ作る。--batch 8 のようにすると、話し方の指示が同じ文をまとめて1回で読ませ、あとで無音で切りわける
    # （1日 100回の上限を節約できるが、区切りがずれることがある。ずれたものは確かめのときに消される）
    # もとの WAV が無く、m4a だけ ある 声（おせわゲームから 文ごと 写した もの）は、対応表の 文と 同じなら そのまま 使う
    copied = {k for k, t in todo
              if not os.path.exists(os.path.join(WAV, k + '.wav')) and os.path.exists(os.path.join(OUT, k + '.m4a'))
              and old.get(k) == t}
    pending = [(k, t) for k, t in todo if k not in copied and not os.path.exists(os.path.join(WAV, k + '.wav'))]
    if '--only' in sys.argv:  # --only m_ ならセリフだけ、--only g_ ならボタンなどの名前だけ作る
        pending = [(k, t) for k, t in pending if k.startswith(sys.argv[sys.argv.index('--only') + 1])]
    if '--list' not in sys.argv and pending:
        for who in {who_of(k) for k, _ in pending}:  # えらんだ 声が 用意できているか、さきに たしかめる
            try:
                voice_of(who)
            except KeyError:
                sys.exit(f'{who} の 声（{VOICE[who]}）が まだ ありません。さきに python3 tools/voice_samples.py を 動かしてください')
    groups = {}
    for k, t in pending:
        groups.setdefault((STYLE.get(t), who_of(k)), []).append((k, t))
    batches = [(key, g[i:i + batch_size]) for key, g in groups.items() for i in range(0, len(g), batch_size)]
    stop = []

    def make(job):
        (style, who), items = job
        voice, base_style = voice_of(who)
        style = style or base_style
        if stop:
            return []
        try:
            if len(items) > 1:
                parts = split(vs.tts(' <long pause> '.join(reading(t) for _, t in items), voice, style, model), len(items))
                if parts:
                    for (k, _), data in zip(items, parts):
                        save(k, data)
                    print(f'  まとめて {len(items)} こ: ' + ' / '.join(t for _, t in items))
                    return [k for k, _ in items]
                print(f'  まとめた音声をうまく切れなかったので、1つずつ作ります（{len(items)} こ）')
            out = []
            for k, t in items:
                if stop:
                    break
                save(k, vs.tts(reading(t), voice, style, model))
                print(f'  {k}: {t}')
                out.append(k)
            return out
        except vs.DailyLimit as e:
            stop.append(str(e))
        except RuntimeError as e:
            print(f'  ✗ {e}')
        return []

    with ThreadPoolExecutor(2) as pool:
        new = [k for ks in pool.map(make, batches) for k in ks]
    json.dump(made, open(made_path, 'w'), ensure_ascii=False, indent=1)

    # 新しく作った音声を聞いて確かめ、まちがっていたものは消す（次に動かしたときに作り直す）
    if new and '--no-check' not in sys.argv:
        print(f'聞いて確かめています（{len(new)} こ）…')
        for k in check([(k, t) for k, t in todo if k in new]):
            for p in (os.path.join(WAV, k + '.wav'), os.path.join(OUT, k + '.m4a')):
                if os.path.exists(p):
                    os.remove(p)
    done = []
    for k, t in todo:
        w, m = os.path.join(WAV, k + '.wav'), os.path.join(OUT, k + '.m4a')
        if k in copied:
            done.append((k, t))
            continue
        if not os.path.exists(w):
            continue
        if not os.path.exists(m) or os.path.getmtime(m) < os.path.getmtime(w):
            to_m4a(w, m)
        done.append((k, t))
    write_manifest(done)
    print(f'できました: 全 {len(todo)} 件のうち {len(done)} 件（今回 {len(new)} 件） → assets/voice/ と js/voice_clips.js')
    if stop:
        print('※ 今日 使える回数を使いきりました。続きは時間をおいて、もう一度動かしてください: ' + stop[0])
    elif len(done) < len(todo):
        print(f'※ まだ {len(todo) - len(done)} 件あります。もう一度動かすと続きを作ります。')


if __name__ == '__main__':
    main()
