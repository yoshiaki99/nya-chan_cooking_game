#!/usr/bin/env node
/* ニャーちゃん・ニューちゃんの セリフを たしかめる（要件定義書 2.3・2.5）
 *   node tools/check_lines.js
 * ・js/character.js の lines の すべての文が「ニャー」（＋ ！？…〜）で おわっているか
 * ・js/character_nyu.js の lines の すべての文がも「ニャー」で おわっているか（ニューちゃんも おねえちゃんと 同じ 語尾）
 * ・漢字が まざっていないか（ひらがな・カタカナだけにする：N-01）
 * ・プログラムが つかっている セリフ（L.xxx・N.xxx）が lines に そろっているか
 * まちがいが あれば 一覧を出して 1 で おわる。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
ctx.window.G = ctx.G = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/character.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/character_nyu.js'), 'utf8'), ctx);
const L = ctx.G.CHARACTER.lines;
const NL = ctx.G.CHARACTERS.nyu.lines;

const errors = [];
const KANJI = /[一-鿿]/;
function checkAll(lines, word, who) {
  const END = new RegExp(word + '[！？…〜]*$');
  for (const [key, val] of Object.entries(lines)) {
    (Array.isArray(val) ? val : [val]).forEach((text, i) => {
      const name = who + (Array.isArray(val) ? `${key}[${i}]` : key);
      if (!END.test(text)) errors.push(`${name}：さいごに「${word}」が ない → ${text}`);
      // 文の おわりの「ニャー」「ニュー」は いちばん さいごに だけ（文ごとには つけない）。
      // 「ニューも」「ニューだよ」のような 一人称は 語尾に かぞえない
      const ends = text.match(new RegExp(word + '(?=[！？…〜。、]*(\\s|$))', 'g')) || [];
      if (ends.length > 1) errors.push(`${name}：「${word}」は さいごに 1回だけ → ${text}`);
      if (KANJI.test(text)) errors.push(`${name}：漢字が ある → ${text}`);
    });
  }
}
checkAll(L, 'ニャー', '');
checkAll(NL, 'ニャー', 'ニューちゃん：');

// プログラムで つかっている セリフの 名前（L.xxx と、data.js の hint: 'xxx'）
const used = new Set();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return walk(p);
  if (!p.endsWith('.js') || p.endsWith('character.js')) return;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/\bL\.([A-Za-z]\w*)/g)) used.add(m[1]);
  for (const m of src.matchAll(/\bhint:\s*'(\w+)'/g)) used.add(m[1]);
});
walk(path.join(root, 'js'));
['x', 'y'].forEach(k => used.delete(k)); // js/makeup.js の L は 目の いち（セリフではない）
for (const k of used) if (!(k in L)) errors.push(`${k}：プログラムで つかっているのに lines に ない`);
const unused = Object.keys(L).filter(k => !used.has(k));

// 画面が つかっている ニューちゃんの セリフ（N.xxx。N = G.CHARACTERS.nyu.lines）
const walkN = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return walkN(p);
  if (!p.endsWith('.js')) return;
  const src = fs.readFileSync(p, 'utf8');
  if (!/G\.CHARACTERS\.nyu\.lines/.test(src)) return;
  for (const m of src.matchAll(/\bN\.([a-z]\w*)/g)) {
    if (!(m[1] in NL)) errors.push(`ニューちゃん：${m[1]}：${path.relative(root, p)} で つかっているのに lines に ない`);
  }
});
walkN(path.join(root, 'js'));

if (unused.length) console.log('（名前で よばれていない セリフ。meter などから よぶものも ある：' + unused.join(', ') + '）');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK：セリフ ニャーちゃん ${Object.keys(L).length} しゅるい・ニューちゃん ${Object.keys(NL).length} しゅるい`);
