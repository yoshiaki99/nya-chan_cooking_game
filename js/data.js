/* ゲームの データ（シール・おしゃれ・絵の ファイル）。お料理の データは js/recipes.js */
window.G = window.G || {};

// げんきメーターは つかわない（料理ゲームは ニューちゃんの おなか だけ：要件定義書 5.8）
G.METERS = [];

// ニューちゃんの おなか（F-85・F-86）。この数 たべると いっぱい。1時間に すく 数
G.TUMMY_FULL = 3;
G.TUMMY_PER_HOUR = 1;

// エプロン・ぼうし（5.11）は、おせわゲームの 重ねて描く しくみ（js/chara.js・js/accessory.js・js/clothes.js）で 描く。
// エプロンは「ふく」（slot = body）、ぼうしは「あたま」の アクセサリー。リボン・メイクは つかわない
G.RIBBONS = [
  { id: 'none', label: 'なし', unlock: 0, swatch: 'none' },
  { id: 'pink', label: 'ピンク', unlock: 0, swatch: '#f4a3b8' }
];
G.MAKEUP = [];
G.ACCESSORY_SLOTS = [{ id: 'head', label: 'ぼうし', icon: 'chefhat' }];
// unlock = あつめた ハートの数で ふえる（レシピ 6・12・20・30・40・50・60・75・90 と かさならない数）。season = その月に とどく
G.CLOTHES = [
  { id: 'apron',      label: 'エプロン',             unlock: 0, colors: ['#f6a8c8', '#9fd0f0', '#a9dfc0'] },
  { id: 'checkapron', label: 'チェックの エプロン',   unlock: 9, colors: ['#f6c94a', '#f37d9b', '#7fb6e6'] },
  { id: 'dotapron',   label: 'みずたまの エプロン',   unlock: 25, colors: ['#9fd0f0', '#f6a8c8', '#c9b3ee'] },
  { id: 'strawapron', label: 'いちごの エプロン',     unlock: 45 },
  { id: 'fishapron',  label: 'おさかなの エプロン',   unlock: 65 },
  { id: 'pawapron',   label: 'にくきゅうの エプロン', unlock: 80 },
  { id: 'chefcoat',   label: 'コックさんの ふく',     unlock: 100 },
  { id: 'witchapron', label: 'まじょの エプロン',     season: { month: 10, name: 'ハロウィン', when: 'じゅうがつ' } },
  { id: 'santaapron', label: 'サンタの エプロン',     season: { month: 12, name: 'クリスマス', when: 'じゅうにがつ' } }
];
G.ACCESSORIES = [
  { id: 'chefhat',  slot: 'head', label: 'コックぼうし',       unlock: 0 },
  { id: 'kerchief', slot: 'head', label: 'さんかくきん',       unlock: 0 },
  { id: 'beret',    slot: 'head', label: 'ベレーぼう',         unlock: 16 },
  { id: 'catband',  slot: 'head', label: 'ネコみみ バンダナ',  unlock: 55 }
];

// おさら（5.7 F-70。もりつけで えらぶ）
G.PLATES = [
  { id: 'round',  label: 'まるい おさら',     unlock: 0 },
  { id: 'square', label: 'しかくい おさら',   unlock: 0 },
  { id: 'heart',  label: 'ハートの おさら',   unlock: 35 },
  { id: 'fish',   label: 'おさかなの おさら', unlock: 70 },
  { id: 'cat',    label: 'ネコの おさら',     unlock: 85 },
  { id: 'star',   label: 'おほしさまの おさら', unlock: 110 }
];

// ごほうびシール（5.10 F-91）。ハート10こで1まい。ネコの体に わるい 食べものの 絵は 入れない（5.9.1）
G.HEARTS_PER_STICKER = 10;
G.STICKERS = [
  { e: '🍙', label: 'おにぎり' },   { e: '🥞', label: 'ホットケーキ' }, { e: '🍳', label: 'めだまやき' },
  { e: '🍕', label: 'ピザ' },       { e: '🍛', label: 'カレー' },       { e: '🍪', label: 'クッキー' },
  { e: '🍮', label: 'プリン' },     { e: '🍣', label: 'おすし' },       { e: '🍰', label: 'ケーキ' },
  { e: '🥕', label: 'にんじん' },   { e: '🍅', label: 'トマト' },       { e: '🧀', label: 'チーズ' },
  { e: '🥚', label: 'たまご' },     { e: '🐟', label: 'おさかな' },     { e: '🍓', label: 'いちご' },
  { e: '🧁', label: 'カップケーキ' }, { e: '🥦', label: 'ブロッコリー' }, { e: '🥄', label: 'スプーン' },
  { e: '🍴', label: 'フォーク' },   { e: '⭐', label: 'おほしさま' }
];

// レシピちょうの しゃしん（あたらしい ものから これだけ のこす：F-B1）
G.PHOTO_MAX = 30;

// キャラクター以外の絵。ファイルが無いあいだは、ゲームの中で描いた絵（js/art.js・js/art_kitchen.js）を代わりに使う
G.ART_FILES = {
  bg_kitchen:       'assets/backgrounds/bg_kitchen_day.png',
  bg_kitchen_night: 'assets/backgrounds/bg_kitchen_night.png'
};
