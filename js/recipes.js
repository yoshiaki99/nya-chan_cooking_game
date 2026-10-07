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
  wash:    { label: 'あらう', ready: true },
  cut:     { label: 'きる（サンドイッチ）', ready: true },
  chop:    { label: 'きる（ざいりょう）', ready: true },
  crack:   { label: 'わる', ready: true },
  mix:     { label: 'まぜる', ready: true },
  knead:   { label: 'こねる・にぎる', ready: true },
  roll:    { label: 'のばす', ready: true },
  cutout:  { label: 'かたぬき', ready: true },
  spread:  { label: 'ぬる', ready: true },
  fry:     { label: 'やく・いためる', ready: true },
  flip:    { label: 'ひっくりかえす', ready: true },
  boil:    { label: 'にる', ready: true },
  oven:    { label: 'オーブン', ready: true },
  chill:   { label: 'ひやす', ready: true },
  pourCups: { label: 'カップに いれる', ready: true },
  pourOver: { label: 'ごはんに かける', ready: true },
  rollup:  { label: 'くるくる まく', ready: true },
  sauce:   { label: 'ソース・クリームを ぬる', ready: true },
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
  { id: 'omurice',   label: 'オムライス',     level: 2, unlock: 6, ready: true,
    items: ['rice', 'carrot', 'chicken', 'egg', 'tomatosauce'],
    steps: [{ t: 'chop', items: ['carrot', 'chicken'] }, { t: 'fry', kind: 'rice', stir: true }, { t: 'crack' }, { t: 'mix' }, { t: 'fry', kind: 'omelet' }],
    toppings: ['broccoli', 'tomato', 'carrot', 'cheese'], sauce: 'tomatosauce' },
  { id: 'grillfish', label: 'やきざかな',     level: 1, unlock: 12, ready: true,
    items: ['fish', 'daikon', 'broccoli'],
    steps: [{ t: 'wash', item: 'fish' }, { t: 'fry', kind: 'fish' }, { t: 'flip', kind: 'fish' }],
    toppings: ['daikon', 'broccoli', 'tomato', 'cucumber'] },
  { id: 'pizza',     label: 'ピザ',           level: 2, unlock: 20, ready: true,
    items: ['flour', 'tomatosauce', 'cheese'],
    steps: [{ t: 'knead' }, { t: 'roll' }, { t: 'sauce', base: 'pizza', color: '#e8473c', item: 'tomatosauce' }, { t: 'oven', before: 'pizza_raw', after: 'pizza' }],
    toppings: ['tomato', 'cheese', 'greenpepper', 'tuna', 'chicken'] },
  { id: 'curry',     label: 'カレーライス',   level: 3, unlock: 30, ready: true,
    items: ['carrot', 'potato', 'pumpkin', 'chicken', 'rice'],
    steps: [{ t: 'wash', items: ['carrot', 'potato'] }, { t: 'chop', items: ['carrot', 'potato', 'pumpkin'] }, { t: 'fry', kind: 'veg', stir: true },
      { t: 'boil', color: '#d9902e', items: ['carrot', 'potato', 'pumpkin', 'chicken'] }, { t: 'pourOver', color: '#d9902e' }],
    toppings: ['broccoli', 'egg', 'tomato', 'cheese'] },
  { id: 'hamburg',   label: 'ハンバーグ',     level: 3, unlock: 40, ready: true,
    items: ['chicken', 'fish', 'egg', 'tomatosauce'],
    steps: [{ t: 'crack' }, { t: 'knead', color: '#f2a59a' }, { t: 'knead', color: '#f2a59a', oval: true }, { t: 'fry', kind: 'hamburg' }, { t: 'flip', kind: 'hamburg' }],
    toppings: ['broccoli', 'carrot', 'potato', 'tomato'], sauce: 'tomatosauce' },
  { id: 'cookie',    label: 'クッキー',       level: 2, unlock: 50, ready: true,
    items: ['flour', 'butter', 'sugar', 'egg'],
    steps: [{ t: 'crack' }, { t: 'mix' }, { t: 'roll', sheet: true }, { t: 'cutout' }, { t: 'oven', before: 'cookie_raw', after: 'cookie' }],
    toppings: ['strawberry', 'blueberry', 'banana'], sauce: 'icing' },
  { id: 'pudding',   label: 'プリン',         level: 2, unlock: 60, ready: true,
    items: ['egg', 'milk', 'sugar'],
    steps: [{ t: 'crack' }, { t: 'mix' }, { t: 'pourCups' }, { t: 'chill' }],
    toppings: ['whip', 'strawberry', 'banana', 'blueberry'] },
  { id: 'sushi',     label: 'おすし',         level: 2, unlock: 75, ready: true,
    items: ['rice', 'tunafish', 'salmonraw', 'egg', 'seabream'],
    steps: [{ t: 'scoop' }, { t: 'knead', color: '#ffffff', oval: true, say: 'sushiIntro' }, { t: 'chop', items: ['tunafish', 'salmonraw'] }],
    toppings: ['tunafish', 'salmonraw', 'egg', 'seabream', 'cucumber'] },
  { id: 'cake',      label: 'いちごの ケーキ', level: 3, unlock: 90, ready: true,
    items: ['flour', 'egg', 'sugar', 'whip', 'strawberry'],
    steps: [{ t: 'crack' }, { t: 'mix' }, { t: 'oven', before: 'sponge_raw', after: 'sponge' }, { t: 'sauce', base: 'cake', color: '#fffaf0', item: 'whip' }],
    toppings: ['strawberry', 'whip', 'blueberry', 'banana'] },
  { id: 'pumpkinpie', label: 'かぼちゃの パイ', level: 3, season: { month: 10, name: 'ハロウィン', when: 'じゅうがつ' }, ready: true,
    items: ['pumpkin', 'flour', 'butter', 'sugar'],
    steps: [{ t: 'chop', items: ['pumpkin'] }, { t: 'boil', color: '#f6a24a', items: ['pumpkin'] }, { t: 'mix' }, { t: 'oven', before: 'pie_raw', after: 'pie' }],
    toppings: ['whip', 'strawberry', 'blueberry'], sauce: 'icing' },
  { id: 'xmascake',  label: 'クリスマスケーキ', level: 3, season: { month: 12, name: 'クリスマス', when: 'じゅうにがつ' }, ready: true,
    items: ['flour', 'egg', 'sugar', 'whip', 'strawberry'],
    steps: [{ t: 'crack' }, { t: 'mix' }, { t: 'oven', before: 'sheet_raw', after: 'sheet' }, { t: 'sauce', base: 'sheet', color: '#fffaf0', item: 'whip' }, { t: 'rollup' }],
    toppings: ['strawberry', 'whip', 'blueberry'], sauce: 'icing' }
];

G.ingredient = (id) => G.INGREDIENTS.find(x => x.id === id);
G.recipe = (id) => G.RECIPES.find(r => r.id === id);
