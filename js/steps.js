/* りょうりの こうてい（要件定義書 5.6）
 * ・G.StepKit … こうていの 部品（こする・タップで すすむ、ドラッグか タップで おく、えらぶ、チェック）
 * ・G.Dish    … できあがった お料理の 絵（もりつけ・いただきます・レシピちょうで つかう）
 * ・G.Steps   … こうていの 本体。G.Steps[t](ctx, step) は おわったら resolve する
 * どの こうていも、なぞる・こする などの 操作と、タップだけの 操作の どちらでも すすむ（N-06）。
 * 失敗の 絵は 作らない（こげない・こぼれない：F-6D）。時間制限も ない。
 * ctx = { scr, sc, area（650×680 の 作業場。ステージの 360,170）, say(text, face), cheer(), firstTime(kind), data（こうていの あいだで わたす もの） }
 */
window.G = window.G || {};

const AREA = { x: 440, y: 170, w: 650, h: 680 }; // 左の ニャーちゃんと ふきだしに かさならない ところ
const INK = '#3b3236';
const inkA = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const inner = (svgStr) => svgStr.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

/* ================= 部品 ================= */
G.StepKit = (function () {
  const UI = () => G.UI;
  const svg = (vb, body) => G.Art.svg(vb, body);

  /* 作業場の 中に 絵を おく（作業場の 座標） */
  function layer(area, x, y, w, h, html, cls) {
    const e = UI().el('div', 'wk ' + (cls || ''), html);
    UI().pos(e, x, y, w, h);
    area.appendChild(e);
    return e;
  }

  /* こする・タップで すすめる。タップ 1回で 1/need、こすった きょりで dist/rubDist すすむ（どちらでも よい）。
   * 8秒 なにも しないと idle() を よぶ（お手本を もう一度：F-6E） */
  function progress(sc, el, { need = 5, rubDist = 700, onStep, sound, idle, rub = true }) {
    return new Promise((res) => {
      let p = 0, down = null, last = null, done = false, acc = 0, idleAt = Date.now() + 8000;
      el.style.touchAction = 'none';
      const add = (v) => {
        if (done) return;
        p = Math.min(1, p + v);
        if (onStep) onStep(p);
        if (p >= 1) { done = true; down = null; res(); }
      };
      const onDown = (e) => {
        if (done) return;
        down = e.pointerId; last = UI().toStage(e.clientX, e.clientY); idleAt = Date.now() + 8000;
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* なし */ }
        if (sound) G.Sound.play(sound);
        add(1 / need);
        e.preventDefault();
      };
      const onMove = (e) => {
        if (e.pointerId !== down || !rub) return;
        const q = UI().toStage(e.clientX, e.clientY);
        const dd = Math.hypot(q.x - last.x, q.y - last.y);
        last = q; idleAt = Date.now() + 8000;
        if (dd <= 0) return;
        acc += dd;
        if (acc > 110) { acc = 0; if (sound) G.Sound.play(sound); }
        add(dd / rubDist);
      };
      const onUp = (e) => { if (e.pointerId === down) down = null; };
      sc.on(el, 'pointerdown', onDown);
      sc.on(el, 'pointermove', onMove);
      sc.on(el, 'pointerup', onUp);
      sc.on(el, 'pointercancel', onUp);
      if (idle) sc.interval(() => { if (!done && down == null && Date.now() > idleAt) { idleAt = Date.now() + 8000; idle(); } }, 500);
    });
  }

  /* ドラッグか タップで target に おく。タップなら 自動で とんでいく。
   * target = () => {x, y, w, h}（ステージ座標）。check(id) が false なら もとに もどす（ちがう ざいりょう など） */
  function dragOrTap(sc, el, { target, onPlace, onReject, check }) {
    const U = UI();
    el.style.touchAction = 'none';
    let down = null, start = null, moved = 0;
    const back = () => { el.style.transition = 'transform .35s cubic-bezier(.3,1.5,.5,1)'; el.style.transform = ''; setTimeout(() => { el.style.transition = ''; }, 380); };
    const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    sc.on(el, 'pointerdown', (e) => {
      if (el.classList.contains('used')) return;
      down = e.pointerId; start = U.toStage(e.clientX, e.clientY); moved = 0;
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* なし */ }
      el.classList.add('lift');
      G.Sound.play('tap');
      e.preventDefault();
    });
    sc.on(el, 'pointermove', (e) => {
      if (e.pointerId !== down) return;
      const q = U.toStage(e.clientX, e.clientY);
      moved = Math.max(moved, Math.hypot(q.x - start.x, q.y - start.y));
      el.style.transform = `translate(${q.x - start.x}px, ${q.y - start.y}px) scale(1.1)`;
    });
    const up = (e, ok) => {
      if (e.pointerId !== down) return;
      down = null;
      el.classList.remove('lift');
      if (!ok) { back(); return; }
      const q = U.toStage(e.clientX, e.clientY);
      const tapped = moved < 14;
      if (!tapped && !inside(q, target())) { back(); return; }
      if (check && !check()) { back(); if (onReject) onReject(); return; }
      if (onPlace) onPlace(tapped);
    };
    sc.on(el, 'pointerup', (e) => up(e, true));
    sc.on(el, 'pointercancel', (e) => up(e, false));
  }

  /* 要素を ステージの ある点まで とばす（とんだあと resolve） */
  function flyTo(el, to, ms = 520) {
    const r = UI().rectOf(el);
    const dx = to.x - r.cx, dy = to.y - r.cy;
    const a = el.animate([
      { transform: el.style.transform || 'translate(0,0)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 120}px) scale(1.15)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.8)` }
    ], { duration: ms, easing: 'ease-in-out', fill: 'forwards' });
    return new Promise(res => { a.onfinish = res; });
  }

  /* ざいりょうを えらぶ ボタンを ならべる（作業場の 下）。onPick(id) を よぶ。もどりは ボタンの 一覧 */
  function choices(sc, area, ids, onPick, { y = 560, size = 120 } = {}) {
    const gap = 14, w = ids.length * size + (ids.length - 1) * gap;
    const x0 = (AREA.w - w) / 2;
    return ids.map((id, i) => {
      const b = layer(area, x0 + i * (size + gap), y, size, size, `<div class="ch-art">${G.Art.ing(id)}</div>`, 'choice');
      UI().tap(b, () => onPick(id, b), { sound: 'place', say: G.ingredient(id).label });
      return b;
    });
  }

  /* チェック（できた）ボタン。押したら resolve */
  function checkButton(sc, parent, x, y) {
    const b = UI().el('div', 'btn-check', G.Art.svg('0 0 100 100', `<path d="M24 52 l18 18 l36 -40" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`));
    UI().pos(b, x, y, 130, 130);
    parent.appendChild(b);
    return new Promise(res => UI().tap(b, () => { b.classList.add('used'); res(b); }, { sound: 'chime', say: 'できた' }));
  }

  /* お手本の ゆび（作業場の 座標で） */
  function hand(area, from, to, times = 2) {
    return UI().hand(area, from, to, { times });
  }

  return { layer, progress, dragOrTap, flyTo, choices, checkButton, hand, svg };
})();

/* ================= できあがりの 絵 ================= */
G.Dish = (function () {
  const FILL_COLORS = { egg: '#ffe27a', tuna: '#f6d9b0', cucumber: '#7cc46e', cheese: '#ffd24d', jam: '#f2577e', salmon: '#f8a58a', okaka: '#c98a5a' };

  /* お料理（おさらなし）。viewBox 0 0 400 300 の 中に 描く */
  const foods = {
    onigiri: (d) => `
      <path d="M200 40 C240 40 330 170 330 210 C330 250 280 262 200 262 C120 262 70 250 70 210 C70 170 160 40 200 40Z" fill="#fff" ${inkA(6)}/>
      ${[[170, 120], [230, 132], [150, 180], [250, 190], [200, 160], [120, 220], [280, 222]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#ece6d8"/>`).join('')}
      <circle cx="200" cy="96" r="18" fill="${FILL_COLORS[d.filling] || FILL_COLORS.salmon}" ${inkA(3)}/>
      <path d="M140 196 H260 V262 Q200 266 140 262Z" fill="#33473a" ${inkA(5)}/>
      <path d="M152 214h96M152 236h96" stroke="#4f6a57" stroke-width="4"/>`,
    sandwich: (d) => {
      const layers = (d.fills && d.fills.length ? d.fills : ['butter']).slice(0, 4);
      const tri = (pts, ox) => {
        const [a, b, c] = pts;
        // きりくち（ななめの へん）に、はさんだ ぐの 色を ならべる
        const stripes = layers.map((f, i) => `<path d="M${a[0] + ox + 10 * (i + 1)} ${a[1] + 10 * (i + 1)} L${c[0] + ox - 10 * (i + 1)} ${c[1] - 10 * (i + 1)}" stroke="${FILL_COLORS[f] || '#fff3b0'}" stroke-width="9" stroke-linecap="round"/>`).join('');
        return `<path d="M${a[0] + ox} ${a[1]} L${b[0] + ox} ${b[1]} L${c[0] + ox} ${c[1]}Z" fill="#fff3d6" ${inkA(6)}/>${stripes}
          <path d="M${a[0] + ox} ${a[1]} L${b[0] + ox} ${b[1]} L${c[0] + ox} ${c[1]}" fill="none" stroke="#e9b26e" stroke-width="12" stroke-linejoin="round"/>
          <path d="M${a[0] + ox} ${a[1]} L${b[0] + ox} ${b[1]} L${c[0] + ox} ${c[1]}Z" fill="none" ${inkA(6)}/>`;
      };
      return tri([[60, 60], [60, 250], [250, 250]], -10) + tri([[150, 50], [340, 50], [340, 240]], 10);
    },
    pancake: () => `
      <ellipse cx="200" cy="232" rx="150" ry="34" fill="#d98e44" ${inkA(6)}/>
      <path d="M50 214 Q50 190 200 186 Q350 190 350 214 V232 Q200 262 50 232Z" fill="#e9a65e" ${inkA(6)}/>
      <ellipse cx="200" cy="190" rx="150" ry="34" fill="#f2bb74" ${inkA(6)}/>
      <path d="M50 172 Q50 148 200 144 Q350 148 350 172 V190 Q200 220 50 190Z" fill="#e9a65e" ${inkA(6)}/>
      <ellipse cx="200" cy="148" rx="150" ry="34" fill="#f7cd8c" ${inkA(6)}/>
      <ellipse cx="160" cy="140" rx="34" ry="8" fill="#fff" opacity=".45"/>`
  };

  /* おさら（viewBox 0 0 500 360 の 中。まんなか 250,250）。F-70 */
  function plateSvg(id) {
    const rim = 'fill="#fff" ' + inkA(6), inner = 'fill="none" stroke="#d9ecf3" stroke-width="8"';
    const star = (rx, ry) => { let d = ''; for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 0.55 : 1; d += (i ? 'L' : 'M') + (250 + Math.cos(t) * rx * k).toFixed(1) + ' ' + (250 + Math.sin(t) * ry * k).toFixed(1); } return d + 'Z'; };
    switch (id) {
      case 'square': return `<rect x="30" y="160" width="440" height="180" rx="34" ${rim}/><rect x="70" y="182" width="360" height="136" rx="20" ${inner}/>`;
      case 'heart': return `<path d="M250 352 C40 290 10 190 120 160 C180 146 230 170 250 196 C270 170 320 146 380 160 C490 190 460 290 250 352Z" ${rim}/><path d="M250 320 C100 276 80 210 140 192 C190 180 230 200 250 222 C270 200 310 180 360 192 C420 210 400 276 250 320Z" ${inner}/>`;
      case 'fish': return `<path d="M400 250 L490 180 L480 250 L490 320Z" ${rim}/><ellipse cx="220" cy="250" rx="210" ry="100" ${rim}/><ellipse cx="220" cy="246" rx="160" ry="70" ${inner}/><circle cx="70" cy="230" r="10" fill="${INK}"/>`;
      case 'cat': return `<path d="M60 220 L80 120 L160 170Z M440 220 L420 120 L340 170Z" ${rim}/><ellipse cx="250" cy="250" rx="236" ry="104" ${rim}/><ellipse cx="250" cy="246" rx="180" ry="70" ${inner}/>`;
      case 'star': return `<path d="${star(250, 120)}" ${rim}/><path d="${star(190, 90)}" ${inner}/>`;
      default: return `<ellipse cx="250" cy="250" rx="240" ry="100" ${rim}/><ellipse cx="250" cy="246" rx="190" ry="70" ${inner}/>`;
    }
  }
  G.Art.plateSwatch = (id) => G.Art.svg('0 70 500 300', plateSvg(id));

  /* おさら・お料理・トッピング・ソースを 1まいの 絵に（viewBox 0 0 500 360）
   * deco = { pieces: [{ id, x, y, r }], strokes: [{ c, pts: [[x, y], …] }] } */
  function svgOf(recipeId, data = {}, deco = {}) {
    const food = foods[recipeId] ? foods[recipeId](data) : '';
    const pieces = (deco.pieces || []).map(p =>
      `<g transform="translate(${p.x - 35} ${p.y - 35}) rotate(${p.r || 0} 35 35) scale(.7)">${inner(G.Art.ing(p.id))}</g>`).join('');
    const strokes = (deco.strokes || []).map(s =>
      `<polyline points="${s.pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="${s.c}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>`).join('');
    return G.Art.svg('0 0 500 360', `
      <g class="dish-plate">${plateSvg(deco.plate)}</g>
      <g class="dish-food"><g transform="translate(50 30)">${food}</g></g>
      <g class="dish-sauce">${strokes}</g>
      <g class="dish-deco">${pieces}</g>`);
  }

  return { svgOf, plateSvg, FILL_COLORS, foods };
})();

/* ================= こうてい ================= */
G.Steps = (function () {
  const K = G.StepKit;
  const UI = () => G.UI;
  const svg = (vb, body) => G.Art.svg(vb, body);
  const L = () => G.CHARACTER.lines;
  const area = (ctx) => ctx.area;

  /* よく つかう 絵 */
  const board = () => svg('0 0 650 680', `<rect x="40" y="300" width="570" height="330" rx="28" fill="#f2d3a8" ${inkA(5)}/>
    <rect x="70" y="330" width="510" height="270" rx="18" fill="none" stroke="#e2bd8c" stroke-width="5"/>`);

  /* ---------- ごはんを よそう ---------- */
  async function scoop(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    // すいはんき（右）
    K.layer(a, 380, 120, 240, 260, svg('0 0 240 260', `
      <rect x="20" y="70" width="200" height="170" rx="40" fill="#fffaf0" ${inkA(5)}/>
      <path d="M30 80 Q120 10 210 80" fill="#f6a8c8" ${inkA(5)}/>
      <rect x="90" y="150" width="60" height="30" rx="8" fill="#9ccdf0" ${inkA(4)}/>
      <path d="M40 40 q10 -20 20 0 M80 24 q10 -20 20 0" fill="none" stroke="#c9c9d6" stroke-width="5" stroke-linecap="round"/>`));
    // しゃもじ
    const shamoji = K.layer(a, 310, 110, 90, 150, svg('0 0 90 150', `<path d="M45 150 V70" ${inkA(14).replace(INK, '#e9c48c')}/><path d="M45 150 V70" fill="none" ${inkA(4)}/><ellipse cx="45" cy="44" rx="34" ry="42" fill="#f6e2c0" ${inkA(5)}/>`), 'wk-shamoji');
    // ラップと ごはん（ひだり）
    K.layer(a, 70, 330, 320, 220, svg('0 0 320 220', `<path d="M10 120 L60 30 H280 L310 130 L250 210 H40Z" fill="#eef7fb" opacity=".9" ${inkA(4)}/>`));
    const rice = K.layer(a, 100, 300, 260, 220, '', 'wk-rice');
    const draw = (lv) => { // ごはんの やまが だんだん 大きく なる（3かいで いっぱい）
      const w = 50 + lv * 26, h = 30 + lv * 26;
      rice.innerHTML = lv <= 0 ? '' : svg('0 0 260 220', `<path d="M${130 - w} 175 C${130 - w} ${175 - h} ${130 - w / 2} ${175 - h * 1.25} 130 ${175 - h * 1.25} C${130 + w / 2} ${175 - h * 1.25} ${130 + w} ${175 - h} ${130 + w} 175 Q130 190 ${130 - w} 175Z" fill="#fff" ${inkA(5)}/>
        ${Array.from({ length: lv * 3 }, (_, i) => `<ellipse cx="${130 - w * 0.6 + ((i * 41) % (w * 1.2))}" cy="${170 - ((i * 23) % Math.max(10, h))}" rx="6" ry="3.5" fill="#ece6d8"/>`).join('')}`);
    };
    ctx.say(L().scoopIntro);
    let hint = K.hand(a, { x: 500, y: 250 }, null, 3);
    let lv = 0;
    await K.progress(sc, a, {
      need: 3, rub: false, sound: 'squish',
      idle: () => { hint = K.hand(a, { x: 500, y: 250 }, null, 3); },
      onStep: (p) => {
        if (hint) { hint.remove(); hint = null; }
        const n = Math.round(p * 3);
        if (n === lv) return;
        lv = n;
        shamoji.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(40px,60px) rotate(-30deg)' }, { transform: 'translate(-150px,180px) rotate(-60deg)' }, { transform: 'translate(0,0) rotate(0)' }], { duration: 700, easing: 'ease-in-out' });
        setTimeout(() => { draw(lv); const r = UI().rectOf(rice); UI().sparkles(r.cx, r.cy, 4, 60); }, 450);
      }
    });
    await sc.wait(700);
    ctx.data.riceDrawn = true;
  }

  /* おにぎりの 形（0 = ひらたい ごはん、1 = まるい、2 = まるい さんかく、3 = さんかく） */
  function riceShape(stage, filling, showFilling = true) {
    const shapes = [
      'M70 236 C70 150 140 120 200 120 C260 120 330 150 330 236 Q200 262 70 236Z',
      'M200 70 C280 70 320 140 320 190 C320 240 270 260 200 260 C130 260 80 240 80 190 C80 140 120 70 200 70Z',
      'M200 56 C250 56 320 150 322 200 C322 248 276 262 200 262 C124 262 78 248 78 200 C80 150 150 56 200 56Z',
      'M200 40 C240 40 330 170 330 210 C330 250 280 262 200 262 C120 262 70 250 70 210 C70 170 160 40 200 40Z'
    ];
    const fy = [180, 150, 130, 110][stage];
    const col = G.Dish.FILL_COLORS[filling] || '#f8a58a';
    return svg('0 0 400 300', `<path d="${shapes[stage]}" fill="#fff" ${inkA(6)}/>
      ${[[170, 190], [230, 200], [150, 215], [250, 222], [200, 180]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#ece6d8"/>`).join('')}
      ${showFilling && filling ? `<circle cx="200" cy="${fy}" r="${stage === 0 ? 30 : 18}" fill="${col}" ${inkA(3)}/>` : ''}`);
  }

  /* ---------- ぐを えらぶ ---------- */
  async function filling(ctx, step) {
    const a = area(ctx);
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    const rice = K.layer(a, 125, 170, 400, 300, riceShape(0, null), 'wk-rice');
    ctx.say(L().fillingIntro);
    const id = await new Promise(res => K.choices(ctx.sc, a, step.options, (pick) => res(pick), { y: 500, size: 130 }));
    a.querySelectorAll('.choice').forEach(b => b.classList.add('used'));
    ctx.data.filling = id;
    rice.innerHTML = riceShape(0, id);
    const r = UI().rectOf(rice);
    UI().sparkles(r.cx, r.cy, 8, 100);
    G.Sound.play('place');
    await ctx.sc.wait(900);
  }

  /* ---------- にぎる ---------- */
  async function shape(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    const rice = K.layer(a, 125, 170, 400, 300, riceShape(0, ctx.data.filling), 'wk-rice');
    ctx.say(L().shapeIntro);
    let hint = K.hand(a, { x: 325, y: 330 }, null, 4);
    let stage = 0, count = 0;
    await K.progress(sc, a, {
      need: 6, rubDist: 900, sound: 'squish',
      idle: () => { hint = K.hand(a, { x: 325, y: 330 }, null, 4); },
      onStep: (p) => {
        if (hint) { hint.remove(); hint = null; }
        if (++count % 2 === 0 || p >= 1) rice.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.12,.86)' }, { transform: 'scale(1,1)' }], { duration: 260 });
        const s = Math.min(3, Math.floor(p * 3.01));
        if (s !== stage) {
          stage = s;
          rice.innerHTML = riceShape(stage, ctx.data.filling, stage < 3);
          const r = UI().rectOf(rice);
          UI().sparkles(r.cx, r.cy, 5, 120);
        }
      }
    });
    rice.innerHTML = riceShape(3, ctx.data.filling, false);
    await sc.wait(700);
  }

  /* ---------- のりを まく ---------- */
  async function wrap(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    const rice = K.layer(a, 60, 170, 400, 300, riceShape(3, ctx.data.filling, false), 'wk-rice');
    const nori = K.layer(a, 470, 340, 130, 160, G.Art.ing('nori'), 'wk-drag');
    ctx.say(L().wrapIntro);
    let hint = K.hand(a, { x: 535, y: 420 }, { x: 260, y: 400 }, 3);
    await new Promise(res => K.dragOrTap(sc, nori, {
      target: () => { const r = UI().rectOf(rice); return { x: r.x - 40, y: r.y - 40, w: r.w + 80, h: r.h + 80 }; },
      onPlace: async (tapped) => {
        if (hint) hint.remove();
        nori.classList.add('used');
        if (tapped) { const r = UI().rectOf(rice); await K.flyTo(nori, { x: r.cx, y: r.cy + 60 }, 500); }
        nori.remove();
        rice.innerHTML = svg('0 0 400 300', inner(riceShape(3, ctx.data.filling, false)) + `<path d="M140 196 H260 V262 Q200 266 140 262Z" fill="#33473a" ${inkA(5)}/><path d="M152 214h96M152 236h96" stroke="#4f6a57" stroke-width="4"/>`);
        G.Sound.play('place');
        res();
      }
    }));
    await sc.wait(800);
  }

  /* ---------- パンに ぬる ---------- */
  const breadSvg = () => svg('0 0 400 400', `<path d="M40 380 V130 Q20 120 24 80 Q34 20 200 24 Q366 20 376 80 Q380 120 360 130 V380Z" fill="#e9b26e" ${inkA(6)}/>
    <path d="M62 360 V140 Q44 130 48 96 Q58 48 200 48 Q342 48 352 96 Q356 130 338 140 V360Z" fill="#fff3d6"/>`);
  async function spread(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    K.layer(a, 125, 130, 400, 400, breadSvg());
    const butter = K.layer(a, 125, 130, 400, 400, svg('0 0 400 400', `<path d="M70 352 V146 Q54 134 58 102 Q66 58 200 58 Q334 58 342 102 Q346 134 330 146 V352Z" fill="#ffe27a"/>`), 'wk-butter');
    butter.style.opacity = '0';
    K.layer(a, 520, 470, 110, 110, G.Art.ing('butter'));
    ctx.say(L().spreadIntro);
    let hint = K.hand(a, { x: 220, y: 300 }, { x: 430, y: 380 }, 3);
    await K.progress(sc, a, {
      need: 5, rubDist: 1100, sound: 'spread',
      idle: () => { hint = K.hand(a, { x: 220, y: 300 }, { x: 430, y: 380 }, 3); },
      onStep: (p) => { if (hint) { hint.remove(); hint = null; } butter.style.opacity = String(0.15 + p * 0.65); }
    });
    butter.style.opacity = '.8';
    const r = UI().rectOf(butter);
    UI().sparkles(r.cx, r.cy, 8, 160);
    await sc.wait(700);
  }

  /* ---------- ぐを はさむ ---------- */
  function fillLayer(id, i) {
    const y = 300 - i * 22, c = G.Dish.FILL_COLORS[id] || '#fff3b0';
    if (id === 'cucumber') return [0, 1, 2, 3, 4].map(k => `<circle cx="${110 + k * 45}" cy="${y - 60 + (k % 2) * 30}" r="28" fill="#a6d98e" ${inkA(4)}/><circle cx="${110 + k * 45}" cy="${y - 60 + (k % 2) * 30}" r="12" fill="#e6f5d8"/>`).join('');
    if (id === 'cheese') return `<rect x="${80 + i * 6}" y="${y - 150}" width="${240 - i * 12}" height="170" rx="6" fill="${c}" ${inkA(4)}/><circle cx="160" cy="${y - 90}" r="10" fill="#f2b84a"/><circle cx="240" cy="${y - 40}" r="14" fill="#f2b84a"/>`;
    return `<path d="M${80 + i * 8} ${y} Q${70 + i * 8} ${y - 160} 200 ${y - 170} Q${330 - i * 8} ${y - 160} ${320 - i * 8} ${y}Q200 ${y + 20} ${80 + i * 8} ${y}Z" fill="${c}" ${inkA(4)}/>`;
  }
  async function fill(ctx, step) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    K.layer(a, 125, 60, 400, 400, breadSvg());
    K.layer(a, 125, 60, 400, 400, svg('0 0 400 400', `<path d="M70 352 V146 Q54 134 58 102 Q66 58 200 58 Q334 58 342 102 Q346 134 330 146 V352Z" fill="#ffe27a" opacity=".8"/>`));
    const stack = K.layer(a, 125, 60, 400, 400, '');
    const fills = ctx.data.fills = [];
    ctx.say(L().fillIntro);
    let checkShown = false;
    const done = new Promise(res => {
      K.choices(sc, a, step.options, (id) => {
        if (fills.length >= 4) { G.Sound.play('soft'); return; }
        fills.push(id);
        stack.innerHTML = svg('0 0 400 400', fills.map((f, i) => fillLayer(f, i)).join(''));
        const r = UI().rectOf(stack);
        UI().sparkles(r.cx, r.cy - 40, 5, 120);
        if (!checkShown) {
          checkShown = true;
          ctx.say(L().readyCheck);
          K.checkButton(sc, a, 505, 330).then(res);
        }
      }, { y: 520, size: 112 });
    });
    await done;
    a.querySelectorAll('.choice').forEach(b => b.classList.add('used'));
    // うえの パンを のせる
    const top = K.layer(a, 125, 60, 400, 400, breadSvg(), 'wk-top');
    top.animate([{ transform: 'translateY(-500px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    G.Sound.play('place');
    await sc.wait(1000);
  }

  /* ---------- きる（点線を なぞる。タップでも きれる） ---------- */
  async function cut(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    const colors = (ctx.data.fills || []).map(f => G.Dish.FILL_COLORS[f] || '#fff3b0');
    const half = (side) => svg('0 0 400 400', `<path d="${side ? 'M40 40 L360 40 L360 360Z' : 'M40 40 L40 360 L360 360Z'}" fill="#fff3d6" stroke="#e9b26e" stroke-width="22" stroke-linejoin="round"/>
      <path d="${side ? 'M40 40 L360 40 L360 360Z' : 'M40 40 L40 360 L360 360Z'}" fill="none" ${inkA(6)}/>
      ${colors.map((c, i) => `<path d="M${52 + i * 12} ${52 + i * 12} L${348 - i * 12} ${348 - i * 12}" stroke="${c}" stroke-width="8" opacity="0"/>`).join('')}`);
    const left = K.layer(a, 125, 120, 400, 400, half(false), 'wk-half');
    const right = K.layer(a, 125, 120, 400, 400, half(true), 'wk-half');
    const line = K.layer(a, 125, 120, 400, 400, svg('0 0 400 400', `<path d="M40 40 L360 360" stroke="${INK}" stroke-width="6" stroke-dasharray="18 16" stroke-linecap="round"/>`), 'wk-line');
    const knife = K.layer(a, 95, 40, 120, 120, svg('0 0 120 120', `<path d="M20 100 L70 50 L90 30 Q100 40 90 60 L40 110Z" fill="#e8e8f0" ${inkA(4)}/><path d="M20 100 L4 116" ${inkA(14).replace(INK, '#e9b26e')}/><path d="M20 100 L4 116" fill="none" ${inkA(4)}/>`), 'wk-knife');
    if (ctx.firstTime('knife')) { await ctx.say(L().nekoNoTe); await ctx.say(L().safetyKnife); } else ctx.say(L().cutIntro);
    let hint = K.hand(a, { x: 165, y: 160 }, { x: 485, y: 480 }, 3);
    // なぞった きょり（点線の 向きに すすんだ ぶん）か、タップで きれる
    let best = 0;
    await new Promise((res) => {
      let down = null, start = null, doneCut = false;
      const finish = () => { if (doneCut) return; doneCut = true; res(); };
      sc.on(a, 'pointerdown', (e) => { down = e.pointerId; start = UI().toStage(e.clientX, e.clientY); best = 0; e.preventDefault(); if (hint) { hint.remove(); hint = null; } });
      sc.on(a, 'pointermove', (e) => {
        if (e.pointerId !== down) return;
        const q = UI().toStage(e.clientX, e.clientY);
        const along = ((q.x - start.x) + (q.y - start.y)) / Math.SQRT2;
        if (along > best + 40) { best = along; G.Sound.play('chop'); }
        knife.style.transform = `translate(${Math.max(0, along) / Math.SQRT2}px, ${Math.max(0, along) / Math.SQRT2}px)`;
        if (best > 220) finish();
      });
      sc.on(a, 'pointerup', (e) => { if (e.pointerId !== down) return; down = null; if (best < 30) finish(); else if (best <= 220) knife.style.transform = ''; });
    });
    // ほうちょうが 点線を とおって きれる
    for (let i = 1; i <= 4; i++) { knife.style.transition = 'transform .14s'; knife.style.transform = `translate(${i * 80}px, ${i * 80}px)`; G.Sound.play('chop'); await sc.wait(150); }
    line.remove();
    knife.remove();
    left.style.transition = right.style.transition = 'transform .5s cubic-bezier(.3,1.4,.5,1)';
    left.style.transform = 'translate(-30px, 20px)';
    right.style.transform = 'translate(30px, -20px)';
    const r = UI().rectOf(left);
    UI().sparkles(r.cx + 40, r.cy, 8, 150);
    await sc.wait(900);
  }

  /* ---------- たまごを わる ---------- */
  const bowlBack = () => svg('0 0 400 300', `<ellipse cx="200" cy="90" rx="180" ry="60" fill="#d9ecf3" ${inkA(6)}/>`);
  const bowlFront = () => svg('0 0 400 300', `<path d="M20 90 Q30 280 200 284 Q370 280 380 90 Q200 170 20 90Z" fill="#9ccdf0" ${inkA(6)}/>`);
  async function crack(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    K.layer(a, 60, 260, 400, 300, bowlBack());
    K.layer(a, 60, 260, 400, 300, svg('0 0 400 300', `<ellipse cx="200" cy="96" rx="150" ry="44" fill="#fffaf0"/><path d="M110 92 q40 -36 90 -10 q30 -20 60 6" fill="#fff" ${inkA(4)}/>`));
    const yolk = K.layer(a, 60, 260, 400, 300, svg('0 0 400 300', `<ellipse cx="230" cy="100" rx="56" ry="20" fill="#fff" opacity=".9"/><circle cx="230" cy="96" r="22" fill="#ffc83d" ${inkA(4)}/>`));
    yolk.style.opacity = '0';
    K.layer(a, 60, 260, 400, 300, bowlFront());
    const egg = K.layer(a, 430, 100, 150, 150, G.Art.ing('egg'), 'wk-egg');
    const crackLine = K.layer(a, 430, 100, 150, 150, svg('0 0 100 100', `<path d="M22 54 l12 -8 l10 10 l12 -10 l10 10 l12 -8" fill="none" ${inkA(4)}/>`));
    crackLine.style.opacity = '0';
    ctx.say(L().crackIntro);
    let hint = K.hand(a, { x: 505, y: 190 }, null, 3);
    let n = 0;
    await K.progress(sc, a, {
      need: 2, rub: false, sound: 'crack',
      idle: () => { hint = K.hand(a, { x: 505, y: 190 }, null, 3); },
      onStep: () => {
        if (hint) { hint.remove(); hint = null; }
        n++;
        egg.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(0)' }], { duration: 320 });
        if (n === 1) crackLine.style.opacity = '1';
      }
    });
    // ぱかっ
    egg.style.transition = crackLine.style.transition = 'transform .4s, opacity .4s';
    egg.style.transform = crackLine.style.transform = 'translate(-200px, 80px) rotate(-30deg)';
    await sc.wait(400);
    egg.style.opacity = crackLine.style.opacity = '0';
    yolk.style.transition = 'opacity .3s';
    yolk.style.opacity = '1';
    yolk.animate([{ transform: 'translateY(-80px)' }, { transform: 'translateY(0)' }], { duration: 300, easing: 'ease-in' });
    G.Sound.play('plopEgg');
    await sc.wait(900);
  }

  /* ---------- まぜる ---------- */
  async function mix(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, board(), 'wk-bg');
    // うえから 見た ボウル
    K.layer(a, 95, 110, 460, 460, svg('0 0 460 460', `<circle cx="230" cy="230" r="220" fill="#9ccdf0" ${inkA(6)}/><circle cx="230" cy="230" r="186" fill="#d9ecf3" ${inkA(4)}/>`));
    const batter = K.layer(a, 95, 110, 460, 460, '', 'wk-batter');
    const lerp = (x, y, t) => Math.round(x + (y - x) * t);
    const draw = (p) => {
      const c = `rgb(${lerp(255, 247, p)},${lerp(250, 222, p)},${lerp(240, 160, p)})`;
      batter.innerHTML = svg('0 0 460 460', `<circle cx="230" cy="230" r="170" fill="${c}"/>
        <g opacity="${(1 - p).toFixed(2)}"><circle cx="270" cy="200" r="36" fill="#ffc83d"/><path d="M130 260 q40 -60 90 -10 q30 30 -20 60 q-50 20 -70 -50z" fill="#fff"/><circle cx="200" cy="300" r="30" fill="#f2f6fb"/></g>
        <path d="M${230 + Math.cos(p * 20) * 80} ${230 + Math.sin(p * 20) * 80} a${60} ${60} 0 1 1 1 0" fill="none" stroke="#fff" stroke-width="6" opacity="${(0.2 + p * 0.4).toFixed(2)}"/>`);
    };
    draw(0);
    const whisk = K.layer(a, 260, 180, 130, 260, svg('0 0 130 260', `<path d="M65 250 V150" ${inkA(14).replace(INK, '#e9c48c')}/><path d="M65 250 V150" fill="none" ${inkA(4)}/>
      <path d="M65 150 C10 120 20 20 65 10 C110 20 120 120 65 150Z M65 150 C40 110 45 30 65 10 C85 30 90 110 65 150Z" fill="none" stroke="#a6a6c0" stroke-width="6"/>`), 'wk-whisk');
    ctx.say(L().mixIntro);
    const circle = () => K.hand(a, { x: 260, y: 300 }, { x: 400, y: 380 }, 2);
    let hint = circle();
    let t = 0;
    await K.progress(sc, a, {
      need: 8, rubDist: 1600, sound: 'stir',
      idle: () => { hint = circle(); },
      onStep: (p) => {
        if (hint) { hint.remove(); hint = null; }
        draw(p);
        t += 0.9;
        whisk.style.transform = `translate(${Math.cos(t) * 70}px, ${Math.sin(t) * 50}px) rotate(${Math.cos(t) * 12}deg)`;
      }
    });
    whisk.style.transition = 'transform .4s, opacity .4s';
    whisk.style.opacity = '0';
    const r = UI().rectOf(batter);
    UI().sparkles(r.cx, r.cy, 10, 160);
    await sc.wait(800);
  }

  /* ---------- やく（火を つけて、いい においで できあがり。まっていても 自動で できる。こげない） ---------- */
  const pan = () => svg('0 0 650 680', `<path d="M470 410 L630 470" stroke="${INK}" stroke-width="34" stroke-linecap="round"/><path d="M470 410 L630 470" stroke="#5a5060" stroke-width="22" stroke-linecap="round"/>
    <circle cx="300" cy="340" r="230" fill="#6e6878" ${inkA(6)}/><circle cx="300" cy="340" r="196" fill="#8a8494"/>`);
  const cake = (side) => side === 'top'
    ? svg('0 0 400 400', `<circle cx="200" cy="200" r="170" fill="#f7dfa0" ${inkA(5)}/>${[[150, 150], [240, 130], [270, 230], [170, 260], [210, 200], [120, 220]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#efc77c" stroke="#d9a85e" stroke-width="3"/>`).join('')}`)
    : svg('0 0 400 400', `<circle cx="200" cy="200" r="170" fill="#d98e44" ${inkA(5)}/><circle cx="200" cy="200" r="120" fill="#e9a65e"/><ellipse cx="160" cy="150" rx="40" ry="14" fill="#fff" opacity=".35" transform="rotate(-25 160 150)"/>`);
  async function fry(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, svg('0 0 650 680', `<rect x="20" y="60" width="610" height="600" rx="30" fill="#e8e6ee" ${inkA(5)}/>`), 'wk-bg');
    const flame = K.layer(a, 0, 0, 650, 680, svg('0 0 650 680', Array.from({ length: 14 }, (_, i) => {
      const t = i / 14 * Math.PI * 2, x = 300 + Math.cos(t) * 236, y = 340 + Math.sin(t) * 236;
      return `<path d="M${x} ${y} q-14 -26 0 -46 q14 20 0 46z" fill="#f6a24a" transform="rotate(${t * 180 / Math.PI + 90} ${x} ${y})"/>`;
    }).join('')), 'wk-flame');
    flame.style.opacity = '0';
    K.layer(a, 0, 0, 650, 680, pan());
    const pancake = K.layer(a, 100, 140, 400, 400, cake('top'), 'wk-cake');
    pancake.style.transform = 'scale(0)';
    const knob = K.layer(a, 520, 560, 110, 110, svg('0 0 110 110', `<circle cx="55" cy="55" r="48" fill="#fff" ${inkA(5)}/><rect x="47" y="14" width="16" height="50" rx="8" fill="#f37d9b" ${inkA(3)}/>`), 'wk-knob');
    if (ctx.firstTime('fire')) await ctx.say(L().safetyFire);
    ctx.say(L().fryIntro);
    let hint = K.hand(a, { x: 575, y: 610 }, null, 3);
    await K.progress(sc, a, { need: 1, rub: false, sound: 'click', idle: () => { hint = K.hand(a, { x: 575, y: 610 }, null, 3); }, onStep: () => { if (hint) { hint.remove(); hint = null; } } });
    knob.style.transition = 'transform .3s';
    knob.style.transform = 'rotate(90deg)';
    flame.style.transition = 'opacity .5s';
    flame.style.opacity = '1';
    flame.classList.add('on');
    await sc.wait(400);
    pancake.style.transition = 'transform 1s ease-out';
    pancake.style.transform = 'scale(1)';
    G.Sound.play('pour');
    await sc.wait(1000);
    G.Sound.sizzle(true);
    ctx.say(L().frySizzle);
    ctx.onSmell && ctx.onSmell();
    const steam = sc.interval(() => { const r = UI().rectOf(pancake); UI().hearts(r.cx + (Math.random() - 0.5) * 160, r.cy - 40, 1, '#ffffff'); }, 700);
    await sc.wait(3500);
    // いい においの しるし（ハートの ゆげ・ニャーちゃんの みみ）
    pancake.classList.add('ready');
    ctx.say(L().fryReady, 'face_happy');
    await Promise.race([sc.wait(6000), new Promise(res => sc.on(a, 'pointerdown', res))]);
    clearInterval(steam);
    G.Sound.play('sparkle');
    await sc.wait(300);
  }

  /* ---------- ひっくりかえす（上へ はじく。タップでも） ---------- */
  async function flip(ctx) {
    const a = area(ctx), sc = ctx.sc;
    K.layer(a, 0, 0, 650, 680, svg('0 0 650 680', `<rect x="20" y="60" width="610" height="600" rx="30" fill="#e8e6ee" ${inkA(5)}/>`), 'wk-bg');
    K.layer(a, 0, 0, 650, 680, pan());
    const pancake = K.layer(a, 100, 140, 400, 400, cake('top'), 'wk-cake');
    const spatula = K.layer(a, 420, 470, 200, 180, svg('0 0 200 180', `<path d="M60 70 L180 170" ${inkA(14).replace(INK, '#e9c48c')}/><path d="M60 70 L180 170" fill="none" ${inkA(4)}/><rect x="0" y="20" width="100" height="70" rx="12" fill="#c9c9d6" ${inkA(5)} transform="rotate(40 50 55)"/>`));
    G.Sound.sizzle(true);
    ctx.say(L().flipIntro);
    let hint = K.hand(a, { x: 300, y: 420 }, { x: 300, y: 200 }, 3);
    await new Promise((res) => {
      let down = null, start = null, fired = false;
      const go = () => { if (fired) return; fired = true; res(); };
      sc.on(a, 'pointerdown', (e) => { down = e.pointerId; start = UI().toStage(e.clientX, e.clientY); if (hint) { hint.remove(); hint = null; } e.preventDefault(); });
      sc.on(a, 'pointermove', (e) => { if (e.pointerId === down && start.y - UI().toStage(e.clientX, e.clientY).y > 70) go(); });
      sc.on(a, 'pointerup', (e) => { if (e.pointerId === down) { down = null; go(); } });
    });
    spatula.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-60px,-60px) rotate(-20deg)' }, { transform: 'translate(0,0)' }], { duration: 500 });
    G.Sound.play('flip');
    const anim = pancake.animate([
      { transform: 'translateY(0) scaleY(1)' },
      { transform: 'translateY(-260px) scaleY(0)', offset: 0.45 },
      { transform: 'translateY(-200px) scaleY(-1)', offset: 0.6 },
      { transform: 'translateY(0) scaleY(1)' }
    ], { duration: 900, easing: 'ease-in-out' });
    setTimeout(() => { pancake.innerHTML = cake('bottom'); }, 400);
    await new Promise(r => { anim.onfinish = r; });
    G.Sound.play('land');
    ctx.say(L().flipDone, 'face_happy');
    const r = UI().rectOf(pancake);
    UI().sparkles(r.cx, r.cy, 10, 180);
    await sc.wait(1600);
    G.Sound.sizzle(false);
  }

  return { scoop, filling, shape, wrap, spread, fill, cut, crack, mix, fry, flip };
})();
