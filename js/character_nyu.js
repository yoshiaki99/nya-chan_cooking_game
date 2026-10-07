/*
 * ニューちゃん（ニャーちゃんの妹）の設定（要件定義書 2.2）
 * いつも テーブルで まっていて、ニャーちゃんの おりょうりを たべる。名前・絵・セリフを このファイル1か所に まとめてある。
 * セリフの最後には、おねえちゃんと 同じ「ニャー」をつける（一人称は「ニュー」。tools/check_lines.js で たしかめられる）。
 */
window.G = window.G || {};
G.CHARACTERS = G.CHARACTERS || {};

G.CHARACTERS.nyu = {
  name: 'ニューちゃん',
  suffix: 'ニャー',

  // 絵（背景透過PNG。1254×1254。tools/make_poses.js が 基準画 nyu_base.png から 作る）
  images: {
    base:   'assets/characters/nyu_base.png',
    happy:  'assets/characters/nyu_face_happy.png',
    dreamy: 'assets/characters/nyu_face_dreamy.png',
    wave:   'assets/characters/nyu_act_wave.png'
  },

  // ニャーちゃんに くらべた 大きさ（妹なので すこし 小さく）
  scale: 0.9,

  // ニャーちゃんの ふくを ニューちゃんの 体に 合わせる 変形（SVG の transform）。
  // ニューちゃんは くびが 高く（y 600 → 555）、また が すこし 上（y 1106 → 1095）なので たてに のばして 上へ
  clothesTransform: 'matrix(1 0 0 1.067 0 -85.2)',

  // 声の高さ（読み上げ）。ニャーちゃんより すこし 高く
  voicePitch: 1.75,

  lines: {
    hungry:   ['おねえちゃん、 おなか すいた ニャー！', 'なにか つくって ニャー！'],
    request:  'きょうは この おりょうりが たべたい ニャー！',
    pet:      ['えへへ、 くすぐったい ニャー', 'きもちいい ニャー〜', 'もっと なでて ニャー！'],
    smell:    'いい におい ニャー！',
    wait:     ['まだかな〜、 たのしみ ニャー！', 'わくわく ニャー！'],
    full:     'おなか いっぱい。 ごちそうさま ニャー！',
    welcome:  'おねえちゃん、 まってた ニャー！',
    bye:      'また たべに くる ニャー！'
  }
};
