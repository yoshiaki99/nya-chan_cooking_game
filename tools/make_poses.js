#!/usr/bin/env node
/* ニャーちゃん・ニューちゃんの 表情・動作の絵を、基準画（assets/characters/nya_base.png・nyu_base.png）から 作る（要件定義書 7.3・7.4）
 *   node tools/make_poses.js
 * ・基準画の上に、目・口を かきかえたり、うでを あげたり、あわ・けいとだま・もうふ を 描きたしたりして、
 *   背景透過の PNG（1254×1254）を assets/characters/ に 書きだす。
 * ・座標は すべて 基準画の ピクセル。線は 基準画と 同じ 黒くて太い線（13px）。
 * ・絵を作りなおしたら、js/character.js の face（メイクの場所）・accessory（アクセサリーの場所）も 見なおす。
 * 必要なもの：Playwright（Chromium）。この環境では /opt/node-tools/node_modules/playwright を使う。 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'assets/characters');
const SIZE = 1254;
const INK = '#141213';
const FUR = '#fdfcfc'; // 基準画の 体の 白（まっ白で ぬると 目立つので 同じ 色で ぬる）
const base64 = fs.readFileSync(path.join(DIR, 'nya_base.png')).toString('base64');
const nyu64 = fs.readFileSync(path.join(DIR, 'nyu_base.png')).toString('base64');

let playwright;
for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) {
  try { playwright = require(p); break; } catch (e) { /* つぎを ためす */ }
}
if (!playwright) { console.error('Playwright が ありません（npm i playwright）'); process.exit(1); }

/* ---------- 部品（基準画の 座標） ---------- */
const S = (w = 13) => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const EYE_L = [518, 338], EYE_R = [706, 320];

// 目・口を 消す（白で ぬる）
const ERASE_EYES = `<ellipse cx="${EYE_L[0]}" cy="${EYE_L[1]}" rx="33" ry="46" fill="${FUR}"/><ellipse cx="${EYE_R[0]}" cy="${EYE_R[1]}" rx="33" ry="46" fill="${FUR}"/>`;
const ERASE_MOUTH = `<path d="M534 366 L700 366 L700 498 L534 498 Z" fill="${FUR}"/>`;
const NOSE = `<path d="M601 384 C601 372 633 372 633 384 C633 394 622 400 617 400 C612 400 601 394 601 384 Z" fill="${INK}"/>`;

const eyes = {
  // にっこり（∩）
  happy: `<path d="M490 350 Q518 308 546 350" ${S(14)}/><path d="M678 332 Q706 290 734 332" ${S(14)}/>`,
  // うっとり（◡）
  dreamy: `<path d="M490 330 Q518 368 546 330" ${S(14)}/><path d="M678 312 Q706 350 734 312" ${S(14)}/>`,
  // ねむい（ー）
  sleepy: `<path d="M490 346 Q518 354 546 344" ${S(13)}/><path d="M678 328 Q706 336 734 326" ${S(13)}/>`,
  // おすまし（目を とじて、まつげが ちょこん）
  prim: [[EYE_L, -1], [EYE_R, 1]].map(([[x, y], s]) => `<path d="M${x - 28} ${y + 4} Q${x} ${y + 16} ${x + 28} ${y + 4}" ${S(13)}/><path d="M${x + s * 26} ${y + 6} L${x + s * 40} ${y - 6}" ${S(10)}/>`).join(''),
  // さみしい（すこし 小さい 目と、ハの字の まゆ）
  lonely: `<ellipse cx="${EYE_L[0]}" cy="${EYE_L[1] + 8}" rx="19" ry="30" fill="${INK}"/><ellipse cx="${EYE_R[0]}" cy="${EYE_R[1] + 8}" rx="19" ry="30" fill="${INK}"/>
    <path d="M482 290 L538 272" ${S(11)}/><path d="M686 254 L742 270" ${S(11)}/>`
};
const mouths = {
  // とじた ω の 口（舌なし）
  closed: `${NOSE}<path d="M547 430 C560 448 600 448 617 400 C634 448 674 448 687 420" ${S(13)}/>`,
  // しょんぼり
  frown: `${NOSE}<path d="M585 452 Q617 424 649 452" ${S(12)}/>`,
  // あくび（小さい たての まる）
  yawn: `${NOSE}<ellipse cx="617" cy="446" rx="22" ry="27" fill="#f39fb3" stroke="${INK}" stroke-width="12"/>`
};

function face(e, m) {
  return (e ? ERASE_EYES + eyes[e] : '') + (m ? ERASE_MOUTH + mouths[m] : '');
}

/* あわ（おふろ） */
function foam() {
  const spots = [[560, 140, 46], [640, 120, 54], [720, 150, 40], [480, 180, 34], [800, 190, 30], [600, 200, 30], [690, 210, 26],
    [380, 470, 40], [860, 440, 44], [930, 500, 30], [320, 520, 26],
    [520, 720, 44], [620, 760, 52], [720, 700, 40], [560, 860, 36], [690, 880, 44], [600, 990, 40], [740, 1020, 30], [500, 1010, 28],
    [350, 900, 34], [890, 900, 34], [960, 980, 28], [980, 1060, 24]];
  return spots.map(([x, y, r]) => (r *= 1.25, `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" stroke="#8fbfe0" stroke-width="6"/>
    <path d="M${x - r * 0.45} ${y - r * 0.2} A${r * 0.5} ${r * 0.5} 0 0 1 ${x - r * 0.05} ${y - r * 0.55}" fill="none" stroke="#cfe6f6" stroke-width="5" stroke-linecap="round"/>`)).join('');
}
/* キラキラ */
function spark(x, y, r, c = '#ffe27a') {
  return `<path d="M${x} ${y - r} C${x + r * .12} ${y - r * .12} ${x + r * .12} ${y - r * .12} ${x + r} ${y} C${x + r * .12} ${y + r * .12} ${x + r * .12} ${y + r * .12} ${x} ${y + r} C${x - r * .12} ${y + r * .12} ${x - r * .12} ${y + r * .12} ${x - r} ${y} C${x - r * .12} ${y - r * .12} ${x - r * .12} ${y - r * .12} ${x} ${y - r} Z" fill="${c}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
}
/* けいとだま（足もと） */
const YARN = [360, 1135, 68];
function yarn() {
  const [x, y, r] = YARN;
  return `<path d="M${x - 10} ${y - r + 6} C${x - 60} ${y - 140} ${x - 10} ${y - 170} ${x - 8} ${y - 200}" ${S(7)} stroke="#e06f96"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#f7a8c4" stroke="${INK}" stroke-width="12"/>
    <path d="M${x - r + 14} ${y - 24} C${x - 20} ${y - 60} ${x + 30} ${y - 50} ${x + r - 10} ${y - 20} M${x - r + 8} ${y + 10} C${x - 20} ${y - 20} ${x + 30} ${y - 10} ${x + r - 4} ${y + 18} M${x - 30} ${y + r - 12} C${x - 10} ${y + 20} ${x + 20} ${y + 10} ${x + 40} ${y + r - 18}" fill="none" stroke="#e06f96" stroke-width="7" stroke-linecap="round"/>`;
}
/* 手を あげる（画面の左の うで）。mask で もとの うでを 消して、からだの 線と あげた うでを 描く */
const ARM_MASK = `<path d="M436 800 L250 800 L250 990 L470 990 L462 940 L452 880 L444 830 Z" fill="#000"/>`;
const ARM_PATH = 'M442 815 C415 815 394 800 394 770 L394 700 A41 41 0 0 0 312 700 L312 830 C318 880 380 912 458 905';
const ARM_UP = `<path d="M452 878 L496 878 L496 956 L466 956 Z" fill="${FUR}"/>
  <path d="M440 800 C440 860 452 920 467 968" ${S(13)}/>
  <path d="${ARM_PATH} L500 905 L500 815 Z" fill="${FUR}"/>
  <path d="${ARM_PATH}" ${S(13)}/>
  <path d="M276 650 Q258 680 276 710 M248 626 Q220 680 248 734" ${S(8)}/>`;
/* もうふ（ねんね。横に ねた 絵の 座標） */
function blanket() {
  let edge = '';
  for (let y = 470; y < 1240; y += 50) edge += ` Q${688} ${y + 25} ${664} ${y + 50}`;
  const stars = [[160, 620], [420, 700], [260, 860], [520, 930], [140, 1060], [400, 1120], [600, 600]]
    .map(([x, y]) => spark(x, y, 22, '#f6d860')).join('');
  return `<path d="M110 470 L664 470 ${edge} L110 1240 Q40 1240 40 1170 L40 540 Q40 470 110 470 Z" fill="#bcd9f5" stroke="${INK}" stroke-width="13" stroke-linejoin="round"/>
    <path d="M610 480 L610 1230" stroke="#9cc4ea" stroke-width="14"/>${stars}`;
}

/* ---------- 絵の 一覧 ---------- */
const BASE = (mask = '') => `${mask ? `<mask id="m"><rect width="${SIZE}" height="${SIZE}" fill="#fff"/>${mask}</mask>` : ''}
  <image href="data:image/png;base64,${base64}" width="${SIZE}" height="${SIZE}"${mask ? ' mask="url(#m)"' : ''}/>`;

const POSES = {
  nya_face_normal: () => BASE(),
  nya_face_happy: () => BASE() + face('happy', null),
  nya_face_dreamy: () => BASE() + face('dreamy', null),
  nya_face_prim: () => BASE() + face('prim', 'closed'),
  nya_face_sleepy: () => BASE() + face('sleepy', 'yawn'),
  nya_face_lonely: () => BASE() + face('lonely', 'frown'),
  nya_act_eat: () => BASE() + face('happy', 'closed'),
  nya_act_bath_foam: () => BASE() + face('happy', null) + foam(),
  nya_act_bath_fluffy: () => BASE() + face('happy', null) +
    [[300, 300, 40], [960, 260, 34], [1060, 620, 30], [220, 760, 28], [990, 820, 24], [620, 80, 30], [180, 520, 20]].map(([x, y, r]) => spark(x, y, r)).join(''),
  nya_act_play_yarn: () => BASE() + face('happy', null) + yarn(),
  nya_act_wave: () => BASE(ARM_MASK) + ARM_UP + face('happy', null),
  // 横に なって ねる（右に 90° まわして、頭が 右）。からだに もうふを かける
  nya_act_sleep: () => `<g transform="matrix(0 1 -1 0 1227 165)">${BASE()}${face('dreamy', 'closed')}</g>${blanket()}`
};

/* ---------- ニューちゃん（妹）：にっこり・うっとり・手を ふる ---------- */
const NYU_FUR = '#fdfdfd';
const NYU_EYES = [[507, 275], [674, 268]];
const nyuEyes = (kind) => NYU_EYES.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="44" fill="${NYU_FUR}"/>`).join('') +
  NYU_EYES.map(([x, y]) => kind === 'happy'
    ? `<path d="M${x - 27} ${y + 12} Q${x} ${y - 30} ${x + 27} ${y + 12}" ${S(14)}/>`
    : `<path d="M${x - 27} ${y - 8} Q${x} ${y + 30} ${x + 27} ${y - 8}" ${S(14)}/>`).join('');
const NYU_ARM_MASK = `<path d="M440 790 L250 790 L250 960 L452 960 L448 900 L445 840 Z" fill="#000"/>`;
const NYU_ARM_PATH = 'M445 808 C418 808 397 793 397 763 L397 693 A41 41 0 0 0 315 693 L315 823 C321 873 383 905 451 892';
const NYU_ARM_UP = `<path d="M455 866 L478 866 L478 914 L455 914 Z" fill="${NYU_FUR}"/>
  <path d="M444 786 C444 850 447 900 447 985" ${S(13)}/>
  <path d="${NYU_ARM_PATH} L500 892 L500 808 Z" fill="${NYU_FUR}"/>
  <path d="${NYU_ARM_PATH}" ${S(13)}/>
  <path d="M279 643 Q261 673 279 703 M251 619 Q223 673 251 727" ${S(8)}/>`;
const BASEN = (mask = '') => `${mask ? `<mask id="m"><rect width="${SIZE}" height="${SIZE}" fill="#fff"/>${mask}</mask>` : ''}
  <image href="data:image/png;base64,${nyu64}" width="${SIZE}" height="${SIZE}"${mask ? ' mask="url(#m)"' : ''}/>`;
Object.assign(POSES, {
  nyu_face_happy: () => BASEN() + nyuEyes('happy'),
  nyu_face_dreamy: () => BASEN() + nyuEyes('dreamy'),
  nyu_act_wave: () => BASEN(NYU_ARM_MASK) + NYU_ARM_UP + nyuEyes('happy')
});

(async () => {
  const b = await playwright.chromium.launch();
  const page = await b.newPage({ viewport: { width: SIZE, height: SIZE } });
  for (const [name, f] of Object.entries(POSES)) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
      <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" style="display:block">${f()}</svg></body></html>`);
    await page.waitForTimeout(100);
    const out = path.join(DIR, name + '.png');
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
    console.log(name, (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
  }
  await b.close();
})();
