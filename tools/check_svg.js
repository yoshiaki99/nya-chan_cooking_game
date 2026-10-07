#!/usr/bin/env node
/* ゲームの中で描く 絵（SVG）が、画像としても 正しく 読めるかを たしかめる
 *   node tools/check_svg.js
 * ・js/art.js（背景・アイテム・アイコン）、js/art_outing.js（おでかけ）、js/clothes.js（ふく）、js/accessory.js（アクセサリー）の SVG を 作ってみて、
 *   1つの タグに 同じ 属性が 2つ ないか（stroke を 2回 など）を しらべる。
 *   画面に じかに 入れる ときは 動いても、画像（しゃしん・アクセサリー）に すると こわれて 何も うつらなくなる。
 * まちがいが あれば 一覧を出して 1 で おわる。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
ctx.window.G = ctx.G = {};
['js/character.js', 'js/data.js', 'js/art.js', 'js/art_kitchen.js', 'js/clothes.js', 'js/accessory.js'].forEach(f =>
  vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
const G = ctx.G;
G.State = { clothColor: () => null, ribbon: () => 'pink' };

const errors = [];
function check(name, svg) {
  for (const m of svg.matchAll(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*\/?>/g)) {
    const names = [...m[2].matchAll(/([\w:-]+)\s*=/g)].map(x => x[1]);
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    if (dup.length) errors.push(`${name}：<${m[1]}> に ${[...new Set(dup)].join('・')} が 2つ → ${m[0].slice(0, 90)}…`);
  }
}

Object.entries(G.Art.all).forEach(([k, f]) => { try { check('art.' + k, f()); } catch (e) { /* 引数が いる 絵は とばす */ } });
Object.entries(G.OutingArt || {}).forEach(([k, f]) => { if (typeof f !== 'function') return; try { const v = f('#f47c7c', '#ffe27a'); if (typeof v === 'string') check('outing.' + k, v); } catch (e) { /* なし */ } });
Object.entries(G.PlayArt || {}).forEach(([k, f]) => { if (typeof f !== 'function') return; try { const v = f(); if (typeof v === 'string') check('play.' + k, v); } catch (e) { /* 引数が いる 絵は とばす */ } });
G.ClothesArt.ids().forEach(id => [{}, { noL: true }].forEach(o => check('clothes.' + id, G.ClothesArt.markup(id, '#f47c7c', o))));
const acc = G.ACCESSORIES.map(a => a.id).concat(['earbow']);
G.RIBBONS.forEach(rb => acc.forEach(id => {
  try {
    const url = G.Accessory.swatchSvg ? G.Accessory.swatchSvg(id, rb.id) : null;
    if (url) check(`accessory.${id}(${rb.id})`, url);
  } catch (e) { errors.push(`accessory.${id}：作れない（${e.message}）`); }
}));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('OK：SVG に 同じ 属性の かさなりは ありません');
