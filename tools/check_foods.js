#!/usr/bin/env node
/* ネコの体に わるい 食べものが ゲームに 出ていないかを たしかめる（要件定義書 5.9.1 F-9D）
 *   node tools/check_foods.js
 * ・ざいりょう・トッピング・レシピ・シールの 名前に、G.NG_FOODS の ことばが 入っていないか
 *   （exact: true の みじかい ことばは、名前と ぴったり 同じ ときだけ）
 * ・ニャーちゃん・ニューちゃんの セリフ、画面の プログラムの 文字に、G.NG_FOODS の ことばが 入っていないか
 *   （exact: true の ことばは しらべない。「いかが」「しずかに」などに まざるため）
 * ・レシピが つかう ざいりょう・トッピングが、ぜんぶ G.INGREDIENTS に あるか
 * まちがいが あれば 一覧を出して 1 で おわる（公開の手順で とめる）。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
ctx.window.G = ctx.G = {};
['js/character.js', 'js/character_nyu.js', 'js/data.js', 'js/recipes.js']
  .forEach(f => vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
const G = ctx.G;

const errors = [];
const loose = [], exact = [];
G.NG_FOODS.forEach(g => g.words.forEach(w => (g.exact ? exact : loose).push({ w, g: g.group })));

/* 名前（ざいりょう・レシピ・シール） */
function checkName(where, text) {
  for (const { w, g } of loose) if (text.includes(w)) errors.push(`${where}「${text}」に「${w}」（${g}）が ある`);
  for (const { w, g } of exact) if (text === w) errors.push(`${where}「${text}」は「${w}」（${g}）`);
}
G.INGREDIENTS.forEach(x => checkName('ざいりょう', x.label));
G.RECIPES.forEach(r => checkName('レシピ', r.label));
G.STICKERS.forEach(s => checkName('シール', s.label));

/* レシピの ざいりょう・トッピングが ぜんぶ ある */
const ids = new Set(G.INGREDIENTS.map(x => x.id));
G.RECIPES.forEach(r => [...r.items, ...r.toppings, ...(r.sauce ? [r.sauce] : []),
  ...r.steps.flatMap(st => (typeof st === 'object' && st.options) || [])].forEach(id => {
  if (!ids.has(id)) errors.push(`レシピ「${r.label}」の ざいりょう ${id} が G.INGREDIENTS に ない`);
}));
G.RECIPES.forEach(r => r.steps.forEach(st => {
  const t = typeof st === 'object' ? st.t : st;
  if (!G.STEPS[t]) errors.push(`レシピ「${r.label}」の こうてい ${t} が G.STEPS に ない`);
  else if (r.ready && !G.STEPS[t].ready) errors.push(`レシピ「${r.label}」は ready なのに、こうてい ${t} が まだ できていない`);
}));

/* セリフ */
function checkText(where, text) {
  for (const { w, g } of loose) if (text.includes(w)) errors.push(`${where}：「${w}」（${g}）が ある → ${text}`);
}
const each = (lines, who) => Object.entries(lines).forEach(([k, v]) =>
  (Array.isArray(v) ? v : [v]).forEach(t => checkText(who + k, t)));
each(G.CHARACTER.lines, 'ニャーちゃん：');
each(G.CHARACTERS.nyu.lines, 'ニューちゃん：');

/* 画面の プログラムの 文字（'…' の 中の ひらがな・カタカナ）。recipes.js（出さない表 そのもの）は のぞく */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return walk(p);
  if (!p.endsWith('.js') || /(recipes|character|character_nyu|voice_clips|asset_list)\.js$/.test(p)) return;
  const src = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''); // コメントは のぞく
  for (const m of src.matchAll(/(['"`])((?:(?!\1)[^\\\n]|\\.)*?[ぁ-んァ-ヶ][^'"`\n]*?)\1/g)) checkText(path.relative(root, p), m[2]);
});
walk(path.join(root, 'js'));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK：ネコの体に わるい 食べものは 出ていない（ざいりょう ${G.INGREDIENTS.length}・レシピ ${G.RECIPES.length}・シール ${G.STICKERS.length}・出さない ことば ${loose.length + exact.length}）`);
