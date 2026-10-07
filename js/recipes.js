/* お料理の データ（要件定義書 5.9・5.9.1）
 * ・G.NG_FOODS    … ネコの体に わるい 食べもの。ゲームの どこにも 出さない（tools/check_foods.js が たしかめる）
 * ・G.INGREDIENTS … ざいりょう・トッピング
 * ・G.STEPS       … こうてい（5.6）。レシピは この 部品を ならべるだけで 作る（F-01）
 * ・G.RECIPES     … レシピ 14品
 */
window.G = window.G || {};

/* ネコの体に わるい 食べもの（F-9A）。
 *   words = 出しては いけない ことば。exact: true は みじかくて ほかの ことばに まざりやすいので
 *   （「いか」→「いかが」など）、ざいりょうの 名前と ぴったり 同じ ときだけ しらべる */
G.NG_FOODS = [
  { group: 'ねぎの なかま', words: ['たまねぎ', 'タマネギ', 'ながねぎ', 'ねぎ', 'ネギ', 'にら', 'ニラ', 'にんにく', 'ニンニク', 'らっきょう', 'オニオン', 'ガーリック'] },
  { group: 'チョコレート・ココア', words: ['チョコ', 'ちょこ', 'ココア', 'カカオ'] },
  { group: 'ぶどう・レーズン', words: ['ぶどう', 'ブドウ', 'レーズン', 'グレープ'] },
  { group: 'カフェイン', words: ['コーヒー', 'こうちゃ', 'りょくちゃ', 'まっちゃ', 'カフェオレ'] },
  { group: 'アルコール', words: ['おさけ', 'みりん', 'ワイン', 'ビール'] },
  { group: 'キシリトール', words: ['キシリトール', 'ガム'] },
  { group: 'アボカド', words: ['アボカド'] },
  { group: 'いか・たこ・えび・かに・かい', words: ['えび', 'エビ', 'イカ', 'タコ', 'カニ', 'あさり', 'しじみ', 'ほたて'] },
  { group: 'いか・たこ・かに・かい（みじかい ことば）', words: ['いか', 'たこ', 'かに', 'かい', 'かき'], exact: true },
  { group: 'ナッツ', words: ['ナッツ', 'アーモンド', 'くるみ', 'ピーナッツ'] },
  { group: 'からい もの・スパイス', words: ['とうがらし', 'こしょう', 'わさび', 'からし', 'スパイス', 'カレールー', 'ケチャップ'] },
  { group: 'かんきつ', words: ['レモン', 'みかん', 'オレンジ', 'ゆず', 'グレープフルーツ'] },
  { group: 'うめぼし', words: ['うめぼし', 'うめ'], exact: true }
];

/* ざいりょう・トッピング（名前は 読み上げる：F-54）。where = れいぞうこ／たな */
G.INGREDIENTS = [
  { id: 'rice',       label: 'ごはん',         where: 'shelf' },
  { id: 'nori',       label: 'のり',           where: 'shelf' },
  { id: 'salmon',     label: 'しゃけ',         where: 'fridge' },
  { id: 'okaka',      label: 'おかか',         where: 'shelf' },
  { id: 'tuna',       label: 'ツナ',           where: 'shelf' },
  { id: 'bread',      label: 'パン',           where: 'shelf' },
  { id: 'butter',     label: 'バター',         where: 'fridge' },
  { id: 'egg',        label: 'たまご',         where: 'fridge' },
  { id: 'cucumber',   label: 'きゅうり',       where: 'fridge' },
  { id: 'jam',        label: 'いちごジャム',   where: 'fridge' },
  { id: 'flour',      label: 'こむぎこ',       where: 'shelf' },
  { id: 'milk',       label: 'ぎゅうにゅう',   where: 'fridge' },
  { id: 'sugar',      label: 'さとう',         where: 'shelf' },
  { id: 'strawberry', label: 'いちご',         where: 'fridge' },
  { id: 'banana',     label: 'バナナ',         where: 'shelf' },
  { id: 'whip',       label: 'ホイップ',       where: 'fridge' },
  { id: 'honey',      label: 'はちみつ',       where: 'shelf' },
  { id: 'blueberry',  label: 'ブルーベリー',   where: 'fridge' },
  { id: 'carrot',     label: 'にんじん',       where: 'fridge' },
  { id: 'chicken',    label: 'とりにく',       where: 'fridge' },
  { id: 'tomatosauce', label: 'トマトソース',  where: 'shelf' },
  { id: 'fish',       label: 'おさかな',       where: 'fridge' },
  { id: 'daikon',     label: 'だいこん',       where: 'fridge' },
  { id: 'broccoli',   label: 'ブロッコリー',   where: 'fridge' },
  { id: 'cheese',     label: 'チーズ',         where: 'fridge' },
  { id: 'tomato',     label: 'トマト',         where: 'fridge' },
  { id: 'greenpepper', label: 'ピーマン',      where: 'fridge' },
  { id: 'potato',     label: 'じゃがいも',     where: 'shelf' },
  { id: 'pumpkin',    label: 'かぼちゃ',       where: 'shelf' },
  { id: 'tunafish',   label: 'まぐろ',         where: 'fridge' },
  { id: 'salmonraw',  label: 'サーモン',       where: 'fridge' },
  { id: 'seabream',   label: 'たい',           where: 'fridge' },
  { id: 'icing',      label: 'アイシング',     where: 'shelf' }
];

/* こうてい（5.6 F-60〜F-6C）。操作は js/steps.js（G.StepKit）。ready が ついて いない ものは まだ 作って いない */
G.STEPS = {
  scoop:   { label: 'ごはんを よそう', ready: true },
  filling: { label: 'ぐを えらぶ', ready: true },
  shape:   { label: 'にぎる', ready: true },
  wrap:    { label: 'のりを まく', ready: true },
  fill:    { label: 'はさむ', ready: true },
  wash:    { label: 'あらう' },
  cut:     { label: 'きる', ready: true },
  crack:   { label: 'わる', ready: true },
  mix:     { label: 'まぜる', ready: true },
  knead:   { label: 'こねる・にぎる' },
  roll:    { label: 'のばす' },
  cutout:  { label: 'かたぬき' },
  spread:  { label: 'ぬる', ready: true },
  fry:     { label: 'やく・いためる', ready: true },
  flip:    { label: 'ひっくりかえす', ready: true },
  boil:    { label: 'にる' },
  oven:    { label: 'オーブン' },
  chill:   { label: 'ひやす' },
  serve:   { label: 'もりつけ' }
};

/* レシピ（5.9）。level = むずかしさ（フライパンの数）。unlock = ハートの数、season = その月に とどく
 *   items = あつめる ざいりょう、steps = こうていの じゅんばん（{ t: こうてい, …その こうていの 設定 }）、
 *   toppings = もりつけで のせられる もの（5つまで：N-04）、sauce = ソースで おえかき できる もの
 *   ready = さいごまで 作れる（こうていが ぜんぶ できている）。ない ものは レシピえらびで「じゅんびちゅう」 */
G.RECIPES = [
  { id: 'onigiri',   label: 'おにぎり',       level: 1, unlock: 0, ready: true,
    items: ['rice', 'nori', 'salmon'],
    steps: [{ t: 'scoop' }, { t: 'filling', options: ['salmon', 'okaka', 'tuna'] }, { t: 'shape' }, { t: 'wrap' }],
    toppings: ['egg', 'broccoli', 'tomato', 'cucumber', 'salmon'] },
  { id: 'sandwich',  label: 'サンドイッチ',   level: 1, unlock: 0, ready: true,
    items: ['bread', 'butter', 'egg', 'cucumber'],
    steps: [{ t: 'spread' }, { t: 'fill', options: ['egg', 'tuna', 'cucumber', 'cheese', 'jam'] }, { t: 'cut' }],
    toppings: ['tomato', 'broccoli', 'strawberry', 'banana', 'cheese'] },
  { id: 'pancake',   label: 'ホットケーキ',   level: 2, unlock: 0, ready: true,
    items: ['flour', 'egg', 'milk'],
    steps: [{ t: 'crack' }, { t: 'mix' }, { t: 'fry' }, { t: 'flip' }],
    toppings: ['strawberry', 'banana', 'whip', 'blueberry'], sauce: 'honey' },
  { id: 'omurice',   label: 'オムライス',     level: 2, unlock: 6,
    items: ['rice', 'carrot', 'chicken', 'egg', 'tomatosauce'], steps: ['cut', 'fry', 'crack', 'fry', 'serve'], toppings: ['tomatosauce', 'broccoli'] },
  { id: 'grillfish', label: 'やきざかな',     level: 1, unlock: 12,
    items: ['fish', 'daikon', 'broccoli'], steps: ['wash', 'cut', 'fry', 'serve'], toppings: ['daikon', 'broccoli'] },
  { id: 'pizza',     label: 'ピザ',           level: 2, unlock: 20,
    items: ['flour', 'tomatosauce', 'cheese'], steps: ['knead', 'roll', 'spread', 'oven', 'serve'], toppings: ['tomato', 'cheese', 'greenpepper', 'tuna', 'chicken'] },
  { id: 'curry',     label: 'カレーライス',   level: 3, unlock: 30,
    items: ['carrot', 'potato', 'pumpkin', 'chicken', 'rice'], steps: ['wash', 'cut', 'fry', 'boil', 'serve'], toppings: ['broccoli', 'egg'] },
  { id: 'hamburg',   label: 'ハンバーグ',     level: 3, unlock: 40,
    items: ['chicken', 'fish', 'egg', 'tomatosauce'], steps: ['crack', 'knead', 'knead', 'fry', 'serve'], toppings: ['tomatosauce', 'broccoli', 'carrot', 'potato'] },
  { id: 'cookie',    label: 'クッキー',       level: 2, unlock: 50,
    items: ['flour', 'butter', 'sugar', 'egg'], steps: ['mix', 'roll', 'cutout', 'oven', 'serve'], toppings: ['icing', 'strawberry', 'blueberry'] },
  { id: 'pudding',   label: 'プリン',         level: 2, unlock: 60,
    items: ['egg', 'milk', 'sugar'], steps: ['crack', 'mix', 'chill', 'serve'], toppings: ['whip', 'strawberry', 'banana', 'blueberry'] },
  { id: 'sushi',     label: 'おすし',         level: 2, unlock: 75,
    items: ['rice', 'tunafish', 'salmonraw', 'egg', 'seabream'], steps: ['knead', 'spread', 'serve'], toppings: ['tunafish', 'salmonraw', 'egg', 'seabream'] },
  { id: 'cake',      label: 'いちごの ケーキ', level: 3, unlock: 90,
    items: ['flour', 'egg', 'sugar', 'whip', 'strawberry'], steps: ['mix', 'oven', 'spread', 'serve'], toppings: ['strawberry', 'whip', 'blueberry', 'banana'] },
  { id: 'pumpkinpie', label: 'かぼちゃの パイ', level: 3, season: { month: 10, name: 'ハロウィン', when: 'じゅうがつ' },
    items: ['pumpkin', 'flour', 'butter', 'sugar'], steps: ['cut', 'boil', 'mix', 'oven', 'serve'], toppings: ['whip', 'icing'] },
  { id: 'xmascake',  label: 'クリスマスケーキ', level: 3, season: { month: 12, name: 'クリスマス', when: 'じゅうにがつ' },
    items: ['flour', 'egg', 'sugar', 'whip', 'strawberry'], steps: ['mix', 'oven', 'roll', 'spread', 'serve'], toppings: ['strawberry', 'whip', 'icing'] }
];

G.ingredient = (id) => G.INGREDIENTS.find(x => x.id === id);
G.recipe = (id) => G.RECIPES.find(r => r.id === id);
