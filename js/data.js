/* ゲームの データ（シール・おしゃれ・絵の ファイル）。お料理の データは js/recipes.js */
window.G = window.G || {};

// げんきメーターは つかわない（料理ゲームは ニューちゃんの おなか だけ：要件定義書 5.8）
G.METERS = [];

// ニューちゃんの おなか（F-85・F-86）。この数 たべると いっぱい。1時間に すく 数
G.TUMMY_FULL = 3;
G.TUMMY_PER_HOUR = 1;

// リボン・メイク・アクセサリー・ふく は、おせわゲームの 重ねて描く しくみ（js/chara.js・js/accessory.js）を
// エプロン・ぼうし（5.11）に つかうため のこしてある。料理ゲームでは まだ つかわない（第2段階で エプロンを 足す）
G.RIBBONS = [
  { id: 'none', label: 'なし', unlock: 0, swatch: 'none' },
  { id: 'pink', label: 'ピンク', unlock: 0, swatch: '#f4a3b8' }
];
G.MAKEUP = [];
G.ACCESSORY_SLOTS = [];
G.ACCESSORIES = [];
G.CLOTHES = [];

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
