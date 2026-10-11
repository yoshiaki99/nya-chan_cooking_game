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

// キャラクター以外の絵（GPT-Images 2.5 で描いた水彩）。ファイルが無いときは、ゲームの中で描いた絵（js/art*.js）を代わりに使う
G.ART_FILES = {
  // 背景
  bg_kitchen: 'assets/backgrounds/bg_kitchen_day.webp',
  bg_kitchen_night: 'assets/backgrounds/bg_kitchen_night.webp',
  bg_counter: 'assets/backgrounds/bg_counter.webp',

  // ボタン・テーブル
  icon_bye: 'assets/icons/icon_bye.webp',
  icon_cook: 'assets/icons/icon_cook.webp',
  icon_apron: 'assets/icons/icon_apron.webp',
  icon_recipe: 'assets/icons/icon_recipe.webp',
  icon_door: 'assets/icons/icon_door.webp',
  plate: 'assets/icons/plate.webp',
  plate_full: 'assets/dishes/plate_full.webp',
  kitchen_table: 'assets/kitchen/kitchen_table.webp',
  table_front: 'assets/kitchen/table_front.webp',

  // ざいりょう（js/art_food.js）
  ing_rice: 'assets/ingredients/ing_rice.webp',
  ing_nori: 'assets/ingredients/ing_nori.webp',
  ing_salmon: 'assets/ingredients/ing_salmon.webp',
  ing_okaka: 'assets/ingredients/ing_okaka.webp',
  ing_tuna: 'assets/ingredients/ing_tuna.webp',
  ing_bread: 'assets/ingredients/ing_bread.webp',
  ing_butter: 'assets/ingredients/ing_butter.webp',
  ing_egg: 'assets/ingredients/ing_egg.webp',
  ing_cucumber: 'assets/ingredients/ing_cucumber.webp',
  ing_jam: 'assets/ingredients/ing_jam.webp',
  ing_flour: 'assets/ingredients/ing_flour.webp',
  ing_milk: 'assets/ingredients/ing_milk.webp',
  ing_sugar: 'assets/ingredients/ing_sugar.webp',
  ing_strawberry: 'assets/ingredients/ing_strawberry.webp',
  ing_banana: 'assets/ingredients/ing_banana.webp',
  ing_whip: 'assets/ingredients/ing_whip.webp',
  ing_honey: 'assets/ingredients/ing_honey.webp',
  ing_blueberry: 'assets/ingredients/ing_blueberry.webp',
  ing_carrot: 'assets/ingredients/ing_carrot.webp',
  ing_tomato: 'assets/ingredients/ing_tomato.webp',
  ing_cheese: 'assets/ingredients/ing_cheese.webp',
  ing_broccoli: 'assets/ingredients/ing_broccoli.webp',
  ing_fish: 'assets/ingredients/ing_fish.webp',
  ing_greenpepper: 'assets/ingredients/ing_greenpepper.webp',
  ing_chicken: 'assets/ingredients/ing_chicken.webp',
  ing_daikon: 'assets/ingredients/ing_daikon.webp',
  ing_potato: 'assets/ingredients/ing_potato.webp',
  ing_pumpkin: 'assets/ingredients/ing_pumpkin.webp',
  ing_tunafish: 'assets/ingredients/ing_tunafish.webp',
  ing_salmonraw: 'assets/ingredients/ing_salmonraw.webp',
  ing_seabream: 'assets/ingredients/ing_seabream.webp',
  ing_icing: 'assets/ingredients/ing_icing.webp',
  ing_tomatosauce: 'assets/ingredients/ing_tomatosauce.webp',

  // お料理・おさら（ボタンの 絵・できあがり・おさら）
  dish_onigiri: 'assets/dishes/dish_onigiri.webp',
  dish_sandwich: 'assets/dishes/dish_sandwich.webp',
  dish_pancake: 'assets/dishes/dish_pancake.webp',
  dish_pumpkinpie: 'assets/dishes/dish_pumpkinpie.webp',
  dish_xmascake: 'assets/dishes/dish_xmascake.webp',
  dish_omurice: 'assets/dishes/dish_omurice.webp',
  dish_grillfish: 'assets/dishes/dish_grillfish.webp',
  dish_pizza: 'assets/dishes/dish_pizza.webp',
  dish_curry: 'assets/dishes/dish_curry.webp',
  dish_hamburg: 'assets/dishes/dish_hamburg.webp',
  dish_cookie: 'assets/dishes/dish_cookie.webp',
  dish_pudding: 'assets/dishes/dish_pudding.webp',
  dish_sushi: 'assets/dishes/dish_sushi.webp',
  dish_cake: 'assets/dishes/dish_cake.webp',
  plate_round: 'assets/dishes/plate_round.webp',
  plate_square: 'assets/dishes/plate_square.webp',
  plate_heart: 'assets/dishes/plate_heart.webp',
  plate_fish: 'assets/dishes/plate_fish.webp',
  plate_cat: 'assets/dishes/plate_cat.webp',
  plate_star: 'assets/dishes/plate_star.webp',
  final_pancake: 'assets/dishes/final_pancake.webp',
  final_omurice: 'assets/dishes/final_omurice.webp',
  final_grillfish: 'assets/dishes/final_grillfish.webp',
  final_pizza: 'assets/dishes/final_pizza.webp',
  final_curry: 'assets/dishes/final_curry.webp',
  final_hamburg: 'assets/dishes/final_hamburg.webp',
  final_pudding: 'assets/dishes/final_pudding.webp',
  final_sushi: 'assets/dishes/final_sushi.webp',
  final_cake: 'assets/dishes/final_cake.webp',
  final_pumpkinpie: 'assets/dishes/final_pumpkinpie.webp',
  final_xmascake: 'assets/dishes/final_xmascake.webp',

  // おりょうりの 道具と とちゅうの 食べもの（js/art_cook.js）
  wk_board: 'assets/cooking/wk_board.webp',
  wk_counter: 'assets/cooking/wk_counter.webp',
  wk_sink: 'assets/cooking/wk_sink.webp',
  wk_oven: 'assets/cooking/wk_oven.webp',
  wk_fridge: 'assets/cooking/wk_fridge.webp',
  tool_pan: 'assets/cooking/tool_pan.webp',
  tool_ricecooker: 'assets/cooking/tool_ricecooker.webp',
  tool_shamoji: 'assets/cooking/tool_shamoji.webp',
  tool_wrap: 'assets/cooking/tool_wrap.webp',
  tool_knife_cut: 'assets/cooking/tool_knife_cut.webp',
  tool_knife: 'assets/cooking/tool_knife.webp',
  tool_bowl_back: 'assets/cooking/tool_bowl_back.webp',
  tool_bowl_front: 'assets/cooking/tool_bowl_front.webp',
  tool_bowl_top: 'assets/cooking/tool_bowl_top.webp',
  tool_whisk: 'assets/cooking/tool_whisk.webp',
  tool_knob: 'assets/cooking/tool_knob.webp',
  tool_spatula: 'assets/cooking/tool_spatula.webp',
  tool_pin: 'assets/cooking/tool_pin.webp',
  tool_oven_dial: 'assets/cooking/tool_oven_dial.webp',
  tool_oven_tray: 'assets/cooking/tool_oven_tray.webp',
  tool_pot: 'assets/cooking/tool_pot.webp',
  tool_ladle: 'assets/cooking/tool_ladle.webp',
  tool_ladle_curry: 'assets/cooking/tool_ladle_curry.webp',
  tool_pour_bowl: 'assets/cooking/tool_pour_bowl.webp',
  tool_fridge_door: 'assets/cooking/tool_fridge_door.webp',
  tool_tray: 'assets/cooking/tool_tray.webp',
  tool_shelf: 'assets/cooking/tool_shelf.webp',
  tool_gfridge_in: 'assets/cooking/tool_gfridge_in.webp',
  tool_gfridge_door: 'assets/cooking/tool_gfridge_door.webp',
  tool_cloth: 'assets/cooking/tool_cloth.webp',
  food_rice_pile1: 'assets/cooking/food_rice_pile1.webp',
  food_rice_pile2: 'assets/cooking/food_rice_pile2.webp',
  food_rice_pile3: 'assets/cooking/food_rice_pile3.webp',
  food_onigiri0: 'assets/cooking/food_onigiri0.webp',
  food_onigiri1: 'assets/cooking/food_onigiri1.webp',
  food_onigiri2: 'assets/cooking/food_onigiri2.webp',
  food_onigiri3: 'assets/cooking/food_onigiri3.webp',
  food_onigiri_nori: 'assets/cooking/food_onigiri_nori.webp',
  food_bread: 'assets/cooking/food_bread.webp',
  food_bread_butter: 'assets/cooking/food_bread_butter.webp',
  fill_egg: 'assets/cooking/fill_egg.webp',
  fill_tuna: 'assets/cooking/fill_tuna.webp',
  fill_cucumber: 'assets/cooking/fill_cucumber.webp',
  fill_cheese: 'assets/cooking/fill_cheese.webp',
  fill_jam: 'assets/cooking/fill_jam.webp',
  food_sand_l: 'assets/cooking/food_sand_l.webp',
  food_sand_r: 'assets/cooking/food_sand_r.webp',
  food_bowl_flour: 'assets/cooking/food_bowl_flour.webp',
  food_bowl_egg: 'assets/cooking/food_bowl_egg.webp',
  food_batter0: 'assets/cooking/food_batter0.webp',
  food_batter1: 'assets/cooking/food_batter1.webp',
  food_pancake_top: 'assets/cooking/food_pancake_top.webp',
  food_pancake_bottom: 'assets/cooking/food_pancake_bottom.webp',
  pan_rice0: 'assets/cooking/pan_rice0.webp',
  pan_rice1: 'assets/cooking/pan_rice1.webp',
  pan_omelet0: 'assets/cooking/pan_omelet0.webp',
  pan_omelet1: 'assets/cooking/pan_omelet1.webp',
  pan_fish_top: 'assets/cooking/pan_fish_top.webp',
  pan_fish_bottom: 'assets/cooking/pan_fish_bottom.webp',
  pan_hamburg_top: 'assets/cooking/pan_hamburg_top.webp',
  pan_hamburg_bottom: 'assets/cooking/pan_hamburg_bottom.webp',
  food_dough0: 'assets/cooking/food_dough0.webp',
  food_dough1: 'assets/cooking/food_dough1.webp',
  food_dough2: 'assets/cooking/food_dough2.webp',
  food_meat0: 'assets/cooking/food_meat0.webp',
  food_meat1: 'assets/cooking/food_meat1.webp',
  food_meat2: 'assets/cooking/food_meat2.webp',
  food_meat_oval: 'assets/cooking/food_meat_oval.webp',
  food_sushirice0: 'assets/cooking/food_sushirice0.webp',
  food_sushirice1: 'assets/cooking/food_sushirice1.webp',
  food_sushirice_oval: 'assets/cooking/food_sushirice_oval.webp',
  food_dough_flat: 'assets/cooking/food_dough_flat.webp',
  food_dough_sheet: 'assets/cooking/food_dough_sheet.webp',
  cookie_raw_heart: 'assets/cooking/cookie_raw_heart.webp',
  cookie_raw_star: 'assets/cooking/cookie_raw_star.webp',
  cookie_raw_cat: 'assets/cooking/cookie_raw_cat.webp',
  cookie_heart: 'assets/cooking/cookie_heart.webp',
  cookie_star: 'assets/cooking/cookie_star.webp',
  cookie_cat: 'assets/cooking/cookie_cat.webp',
  base_pizza: 'assets/cooking/base_pizza.webp',
  base_pizza_sauce: 'assets/cooking/base_pizza_sauce.webp',
  base_cake: 'assets/cooking/base_cake.webp',
  base_cake_cream: 'assets/cooking/base_cake_cream.webp',
  base_sheet: 'assets/cooking/base_sheet.webp',
  base_sheet_cream: 'assets/cooking/base_sheet_cream.webp',
  oven_pizza_raw: 'assets/cooking/oven_pizza_raw.webp',
  oven_pizza: 'assets/cooking/oven_pizza.webp',
  oven_sponge_raw: 'assets/cooking/oven_sponge_raw.webp',
  oven_sponge: 'assets/cooking/oven_sponge.webp',
  oven_pie_raw: 'assets/cooking/oven_pie_raw.webp',
  oven_pie: 'assets/cooking/oven_pie.webp',
  oven_sheet_raw: 'assets/cooking/oven_sheet_raw.webp',
  oven_sheet: 'assets/cooking/oven_sheet.webp',
  soup_water: 'assets/cooking/soup_water.webp',
  soup_curry: 'assets/cooking/soup_curry.webp',
  soup_pumpkin: 'assets/cooking/soup_pumpkin.webp',
  food_cups_raw: 'assets/cooking/food_cups_raw.webp',
  food_cups_done: 'assets/cooking/food_cups_done.webp',
  food_cup_empty: 'assets/cooking/food_cup_empty.webp',
  food_cup_full: 'assets/cooking/food_cup_full.webp',
  food_curry_plate0: 'assets/cooking/food_curry_plate0.webp',
  food_curry_plate1: 'assets/cooking/food_curry_plate1.webp',
  food_rollup0: 'assets/cooking/food_rollup0.webp',
  food_rollup1: 'assets/cooking/food_rollup1.webp',
  food_rollup2: 'assets/cooking/food_rollup2.webp',
  food_rollup3: 'assets/cooking/food_rollup3.webp'
};
