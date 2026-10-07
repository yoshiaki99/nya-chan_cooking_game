/* りょうりの こうてい・その2（要件定義書 5.6 F-60〜F-6C。第2段階で 足した もの）
 * あらう・きる（ざいりょう）・こねる・のばす・かたぬき・ぬる（ソース・クリーム）・オーブン・にる・ひやす・
 * カップに いれる・かける・まく、と やく／ひっくりかえす の しゅるい（ごはん・やさい・たまご・おさかな・ハンバーグ）。
 * js/steps.js と 同じ きまり：タップだけでも すすむ・失敗しない・時間制限なし。
 */
window.G = window.G || {};

(function () {
  const K = G.StepKit;
  const UI = () => G.UI;
  const svg = (vb, body) => G.Art.svg(vb, body);
  const L = () => G.CHARACTER.lines;
  const ink = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const lerpC = (a, b, t) => {
    const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const board = () => svg('0 0 650 680', `<rect x="40" y="300" width="570" height="330" rx="28" fill="#f2d3a8" ${ink(5)}/>
    <rect x="70" y="330" width="510" height="270" rx="18" fill="none" stroke="#e2bd8c" stroke-width="5"/>`);
  const counter = () => svg('0 0 650 680', `<rect x="20" y="60" width="610" height="600" rx="30" fill="#e8e6ee" ${ink(5)}/>`);
  const tapHint = (a, x, y, times = 3) => K.hand(a, { x, y }, null, times);
  const fresh = (ctx, bg) => { K.layer(ctx.area, 0, 0, 650, 680, bg || board(), 'wk-bg'); return ctx.area; };
  // こする・タップで すすむ（ゆびの お手本つき）
  async function work(ctx, { need, rubDist, sound, hint, onStep, rub = true }) {
    const a = ctx.area;
    let h = hint ? hint() : null;
    await K.progress(ctx.sc, a, { need, rubDist, sound, rub, idle: () => { h = hint ? hint() : null; }, onStep: (p) => { if (h) { h.remove(); h = null; } onStep(p); } });
  }
  const sparkleAt = (el, n = 8, r = 140) => { const q = UI().rectOf(el); UI().sparkles(q.cx, q.cy, n, r); };

  /* ---------- あらう（F-60） ---------- */
  async function wash(ctx, step) {
    const a = fresh(ctx, svg('0 0 650 680', `<rect x="40" y="200" width="570" height="420" rx="40" fill="#c9c9d6" ${ink(5)}/>
      <rect x="80" y="240" width="490" height="340" rx="30" fill="#d9ecf3" ${ink(4)}/>
      <path d="M480 60 V140 Q480 170 450 170 H420" fill="none" stroke="#a6a6c0" stroke-width="24" stroke-linecap="round"/>
      <path d="M480 60 V140 Q480 170 450 170 H420" fill="none" ${ink(4)}/>`));
    const items = step.items || [step.item];
    const els = items.map((id, i) => K.layer(a, 325 - items.length * 95 + i * 190, 300, 180, 180, G.Art.ing(id), 'wk-item'));
    const water = K.layer(a, 380, 160, 80, 180, svg('0 0 80 180', `<path d="M40 0 V180" stroke="#9ccdf0" stroke-width="18" stroke-linecap="round" opacity=".8"/>`));
    water.style.opacity = '0';
    ctx.say(L().washIntro);
    G.Sound.shower(true);
    water.style.transition = 'opacity .3s';
    water.style.opacity = '1';
    await work(ctx, {
      need: 4, rubDist: 900, sound: 'bubble',
      hint: () => K.hand(a, { x: 250, y: 390 }, { x: 420, y: 390 }, 2),
      onStep: (p) => {
        els.forEach(e => e.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 300 }));
        const q = UI().rectOf(els[Math.floor(Math.random() * els.length)]);
        UI().sparkles(q.cx, q.cy, 3, 90, '#9ccdf0');
      }
    });
    G.Sound.shower(false);
    water.style.opacity = '0';
    els.forEach(e => sparkleAt(e, 6, 90));
    await ctx.sc.wait(700);
  }

  /* ---------- きる（ざいりょう。たての 点線を 上から 下へ なぞる・タップでも：F-61） ---------- */
  async function chop(ctx, step) {
    const sc = ctx.sc;
    const items = step.items || [step.item];
    const cuts = step.cuts || 2;
    fresh(ctx); // ひとことの あいだも まないたを 出しておく
    K.layer(ctx.area, 175, 230, 300, 300, G.Art.ing(items[0]));
    if (ctx.firstTime('knife')) { await ctx.say(L().nekoNoTe); await ctx.say(L().safetyKnife); } else ctx.say(L().cutIntro);
    for (const id of items) {
      const a = ctx.area;
      a.innerHTML = '';
      fresh(ctx);
      // ざいりょうを たてに わけた かけら（さいごに はなれる）
      const n = cuts + 1, W = 300, X = 175, Y = 230;
      const pieces = Array.from({ length: n }, (_, i) => {
        const e = K.layer(a, X, Y, W, W, G.Art.ing(id), 'wk-piece');
        e.style.clipPath = `inset(0 ${(100 - (i + 1) * 100 / n).toFixed(1)}% 0 ${(i * 100 / n).toFixed(1)}%)`;
        e.style.transition = 'transform .35s cubic-bezier(.3,1.5,.5,1)';
        return e;
      });
      const lines = K.layer(a, X, Y - 40, W, W + 80, svg(`0 0 ${W} ${W + 80}`, Array.from({ length: cuts }, (_, i) => `<path d="M${(i + 1) * W / n} 10 V${W + 70}" stroke="${INK}" stroke-width="6" stroke-dasharray="16 14" stroke-linecap="round"/>`).join('')), 'wk-line');
      const knife = K.layer(a, X + W / n - 60, Y - 150, 120, 120, svg('0 0 120 120', `<path d="M60 10 L60 70 L84 70 Q90 40 60 10Z" fill="#e8e8f0" ${ink(4)}/><path d="M66 72 V112" stroke="#e9b26e" stroke-width="16" stroke-linecap="round"/><path d="M66 72 V112" fill="none" ${ink(4)}/>`), 'wk-knife');
      G.Voice.speak(G.ingredient(id).label, 'guide');
      let done = 0;
      let h = K.hand(a, { x: X + W / n, y: Y - 20 }, { x: X + W / n, y: Y + W }, 2);
      await new Promise((res) => {
        let down = null, y0 = 0;
        const doCut = () => {
          if (h) { h.remove(); h = null; }
          done++;
          G.Sound.play('chop');
          knife.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(280px)' }, { transform: 'translateY(0)' }], { duration: 320 });
          pieces.forEach((p, i) => { p.style.transform = `translateX(${(i - (n - 1) / 2) * 18 * Math.min(done, cuts)}px)`; });
          if (done < cuts) knife.style.left = (X + (done + 1) * W / n - 60) + 'px';
          if (done >= cuts) { lines.remove(); setTimeout(() => { knife.remove(); res(); }, 360); }
        };
        sc.on(a, 'pointerdown', (e) => { down = e.pointerId; y0 = UI().toStage(e.clientX, e.clientY).y; e.preventDefault(); });
        sc.on(a, 'pointermove', (e) => { if (e.pointerId === down && UI().toStage(e.clientX, e.clientY).y - y0 > 90) { down = null; if (done < cuts) doCut(); } });
        sc.on(a, 'pointerup', (e) => { if (e.pointerId === down) { down = null; if (done < cuts) doCut(); } });
      });
      pieces.forEach(p => sparkleAt(p, 2, 60));
      await sc.wait(600);
    }
  }

  /* ---------- こねる（きじ・ハンバーグの たね。だんだん まるく：F-64） ---------- */
  const doughShape = (stage, color, oval) => {
    const paths = [
      'M90 200 Q60 120 140 110 Q170 60 230 100 Q310 80 320 160 Q350 230 280 250 Q220 280 160 250 Q90 260 90 200Z',
      'M80 190 Q70 110 150 100 Q200 70 260 100 Q330 120 320 190 Q320 250 240 262 Q160 270 110 250 Q80 230 80 190Z',
      oval ? 'M60 180 Q60 110 200 108 Q340 110 340 180 Q340 250 200 252 Q60 250 60 180Z' : 'M200 70 C280 70 320 120 320 180 C320 240 270 270 200 270 C130 270 80 240 80 180 C80 120 120 70 200 70Z'
    ];
    return svg('0 0 400 300', `<path d="${paths[stage]}" fill="${color}" ${ink(6)}/><ellipse cx="160" cy="140" rx="34" ry="12" fill="#fff" opacity=".35" transform="rotate(-20 160 140)"/>`);
  };
  async function knead(ctx, step) {
    const a = fresh(ctx);
    const color = step.color || '#f3dcb0';
    const d = K.layer(a, 125, 230, 400, 300, doughShape(0, color, step.oval), 'wk-dough');
    ctx.say(L()[step.say] || (step.oval ? L().patIntro : L().kneadIntro));
    let stage = 0;
    await work(ctx, {
      need: 6, rubDist: 1000, sound: 'squish',
      hint: () => tapHint(a, 325, 380, 4),
      onStep: (p) => {
        d.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.1,.88)' }, { transform: 'scale(1,1)' }], { duration: 240 });
        const s = Math.min(2, Math.floor(p * 2.01));
        if (s !== stage) { stage = s; d.innerHTML = doughShape(s, color, step.oval); sparkleAt(d, 5, 120); }
      }
    });
    d.innerHTML = doughShape(2, color, step.oval);
    await ctx.sc.wait(600);
  }

  /* ---------- のばす（めんぼうを 左右に。きじが ひろがる：F-65） ---------- */
  async function roll(ctx, step) {
    const a = fresh(ctx);
    const color = step.color || '#f3dcb0';
    const d = K.layer(a, 75, 290, 500, 320, '', 'wk-dough');
    const draw = (p) => {
      const rx = 90 + p * 140, ry = 70 + p * 60;
      d.innerHTML = svg('0 0 500 320', step.sheet
        ? `<rect x="${250 - rx}" y="${160 - ry}" width="${rx * 2}" height="${ry * 2}" rx="${30 - p * 16}" fill="${color}" ${ink(5)}/>`
        : `<ellipse cx="250" cy="160" rx="${rx}" ry="${ry}" fill="${color}" ${ink(5)}/>`);
    };
    draw(0);
    const pin = K.layer(a, 125, 280, 400, 80, svg('0 0 400 80', `<rect x="60" y="20" width="280" height="44" rx="22" fill="#f6e2c0" ${ink(5)}/>
      <rect x="4" y="30" width="64" height="24" rx="12" fill="#e9c48c" ${ink(4)}/><rect x="332" y="30" width="64" height="24" rx="12" fill="#e9c48c" ${ink(4)}/>`), 'wk-pin');
    ctx.say(L().rollIntro);
    let t = 0;
    await work(ctx, {
      need: 6, rubDist: 1200, sound: 'roll',
      hint: () => K.hand(a, { x: 230, y: 420 }, { x: 430, y: 420 }, 2),
      onStep: (p) => { draw(p); t++; pin.style.transform = `translateY(${(t % 2 ? 1 : -1) * 70 + 90}px)`; }
    });
    pin.style.transition = 'opacity .3s';
    pin.style.opacity = '0';
    sparkleAt(d, 8, 200);
    await ctx.sc.wait(600);
  }

  /* ---------- かたぬき（すきな ところを タッチ。ハート・ほし・ネコの かお：F-66） ---------- */
  const cutterShape = (k, x, y, r, fill, stroke = INK) => {
    if (k === 'heart') return `<path d="M${x} ${y + r * 0.8} C${x - r * 1.3} ${y - r * 0.1} ${x - r * 0.7} ${y - r * 1.1} ${x} ${y - r * 0.4} C${x + r * 0.7} ${y - r * 1.1} ${x + r * 1.3} ${y - r * 0.1} ${x} ${y + r * 0.8}Z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
    if (k === 'star') {
      let d = '';
      for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; d += (i ? 'L' : 'M') + (x + Math.cos(t) * rr).toFixed(1) + ' ' + (y + Math.sin(t) * rr).toFixed(1); }
      return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
    }
    return `<path d="M${x - r} ${y + r * 0.6} Q${x - r} ${y - r * 0.5} ${x - r * 0.75} ${y - r} L${x - r * 0.35} ${y - r * 0.6} Q${x} ${y - r * 0.75} ${x + r * 0.35} ${y - r * 0.6} L${x + r * 0.75} ${y - r} Q${x + r} ${y - r * 0.5} ${x + r} ${y + r * 0.6} Q${x} ${y + r * 1.05} ${x - r} ${y + r * 0.6}Z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
  };
  async function cutout(ctx, step) {
    const a = fresh(ctx), sc = ctx.sc;
    const color = step.color || '#f3dcb0';
    K.layer(a, 75, 290, 500, 320, svg('0 0 500 320', `<rect x="20" y="30" width="460" height="260" rx="14" fill="${color}" ${ink(5)}/>`));
    const marks = K.layer(a, 75, 290, 500, 320, '');
    const kinds = ['heart', 'star', 'cat'];
    const shapes = ctx.data.cookieShapes = [];
    ctx.say(L().cutoutIntro);
    let h = tapHint(a, 220, 440, 3);
    await new Promise((res) => {
      sc.on(a, 'pointerdown', (e) => {
        if (shapes.length >= 4) return;
        if (h) { h.remove(); h = null; }
        const q = UI().toStage(e.clientX, e.clientY);
        let x = q.x - AREA.x - 75, y = q.y - AREA.y - 290;
        const ok = x > 70 && x < 430 && y > 80 && y < 240 && shapes.every(s => Math.hypot(s.x - x, s.y - y) > 110);
        if (!ok) { x = 110 + shapes.length * 93; y = shapes.length % 2 ? 200 : 120; } // あいている ところに（救済）
        shapes.push({ k: kinds[shapes.length % 3], x, y });
        marks.innerHTML = svg('0 0 500 320', shapes.map(s => cutterShape(s.k, s.x, s.y, 46, '#e9c48c')).join(''));
        G.Sound.play('stamp');
        UI().sparkles(q.x, q.y, 4, 50);
        if (shapes.length >= 4) res();
        e.preventDefault();
      });
    });
    await sc.wait(700);
  }

  /* ---------- ぬる（ピザの ソース・ケーキの クリーム） ---------- */
  const bases = {
    pizza: (c = '#f3dcb0') => `<ellipse cx="250" cy="190" rx="230" ry="150" fill="${c}" ${ink(5)}/>`,
    cake: () => `<ellipse cx="250" cy="190" rx="200" ry="130" fill="#f7cd8c" ${ink(5)}/><ellipse cx="250" cy="190" rx="170" ry="104" fill="#fbe2b0"/>`,
    sheet: () => `<rect x="40" y="70" width="420" height="240" rx="16" fill="#f7cd8c" ${ink(5)}/>`
  };
  async function sauce(ctx, step) {
    const a = fresh(ctx);
    K.layer(a, 75, 210, 500, 380, svg('0 0 500 380', bases[step.base]()));
    const top = K.layer(a, 75, 210, 500, 380, svg('0 0 500 380', step.base === 'sheet'
      ? `<rect x="60" y="90" width="380" height="200" rx="12" fill="${step.color}"/>`
      : `<ellipse cx="250" cy="190" rx="${step.base === 'pizza' ? 200 : 186}" ry="${step.base === 'pizza' ? 124 : 118}" fill="${step.color}"/>`), 'wk-sauce');
    top.style.opacity = '0';
    K.layer(a, 520, 470, 110, 110, G.Art.ing(step.item));
    ctx.say(step.base === 'pizza' ? L().sauceSpread : L().creamSpread);
    await work(ctx, {
      need: 5, rubDist: 1100, sound: 'spread',
      hint: () => K.hand(a, { x: 230, y: 400 }, { x: 430, y: 420 }, 2),
      onStep: (p) => { top.style.opacity = String(0.15 + p * 0.85); }
    });
    top.style.opacity = '1';
    sparkleAt(top, 8, 180);
    await ctx.sc.wait(600);
  }

  /* ---------- オーブン（入れて、まって、チン！ F-6B） ---------- */
  const ovenArt = {
    pizza_raw: () => `<ellipse cx="150" cy="80" rx="130" ry="56" fill="#f3dcb0" ${ink(4)}/><ellipse cx="150" cy="80" rx="110" ry="44" fill="#e8473c"/>`,
    pizza: () => `<ellipse cx="150" cy="80" rx="130" ry="56" fill="#e9b26e" ${ink(4)}/><ellipse cx="150" cy="80" rx="110" ry="44" fill="#e8473c"/><path d="M70 74 q80 -40 160 0 q-40 30 -160 0z" fill="#ffe8a8"/>`,
    cookie_raw: (d) => (d.cookieShapes || []).map((s, i) => cutterShape(s.k, 50 + i * 66, 80, 30, '#f7e7c4')).join(''),
    cookie: (d) => (d.cookieShapes || []).map((s, i) => cutterShape(s.k, 50 + i * 66, 80, 30, '#e9b26e')).join(''),
    sponge_raw: () => `<path d="M40 60 h220 v60 h-220z" fill="#9ccdf0" ${ink(4)}/><ellipse cx="150" cy="60" rx="110" ry="20" fill="#fbe7b0" ${ink(3)}/>`,
    sponge: () => `<path d="M40 40 h220 v80 h-220z" fill="#9ccdf0" ${ink(4)}/><path d="M40 40 Q150 -10 260 40Z" fill="#e9a65e" ${ink(4)}/>`,
    pie_raw: () => `<ellipse cx="150" cy="80" rx="130" ry="50" fill="#f3dcb0" ${ink(4)}/><ellipse cx="150" cy="78" rx="104" ry="36" fill="#f6b25a"/>`,
    pie: () => `<ellipse cx="150" cy="80" rx="130" ry="50" fill="#e9b26e" ${ink(4)}/><ellipse cx="150" cy="78" rx="104" ry="36" fill="#e8902e"/><path d="M80 60 L220 96 M80 96 L220 60 M150 44 V112" stroke="#f3cf90" stroke-width="10" stroke-linecap="round"/>`,
    sheet_raw: () => `<rect x="30" y="50" width="240" height="70" rx="8" fill="#fbe7b0" ${ink(4)}/>`,
    sheet: () => `<rect x="30" y="50" width="240" height="70" rx="8" fill="#f2bb74" ${ink(4)}/>`
  };
  async function oven(ctx, step) {
    const a = fresh(ctx, svg('0 0 650 680', `<rect x="40" y="60" width="570" height="560" rx="40" fill="#fffaf0" ${ink(6)}/>
      <rect x="90" y="170" width="470" height="330" rx="26" fill="#3d3a48" ${ink(5)}/>
      <rect x="160" y="110" width="330" height="26" rx="13" fill="#d9d6de" ${ink(4)}/>`));
    const sc = ctx.sc;
    const glow = K.layer(a, 90, 170, 470, 330, svg('0 0 470 330', `<rect x="0" y="0" width="470" height="330" rx="26" fill="#ffb24d"/>`), 'wk-glow');
    glow.style.opacity = '0';
    const item = K.layer(a, 175, 520, 300, 160, svg('0 0 300 160', `<rect x="10" y="100" width="280" height="20" rx="8" fill="#a6a6c0" ${ink(3)}/>` + ovenArt[step.before](ctx.data)), 'wk-tray');
    const dial = K.layer(a, 520, 60, 90, 90, svg('0 0 90 90', `<circle cx="45" cy="45" r="36" fill="#fff" ${ink(4)}/><path d="M45 45 V16" ${ink(6)}/>`), 'wk-dial');
    if (ctx.firstTime('oven')) await ctx.say(L().safetyFire);
    ctx.say(L().ovenIntro);
    let h = tapHint(a, 325, 600, 3);
    await K.progress(sc, a, { need: 1, rub: false, sound: 'click', onStep: () => { if (h) { h.remove(); h = null; } } });
    item.style.transition = 'transform .7s ease-in-out';
    item.style.transform = 'translateY(-250px)';
    await sc.wait(700);
    glow.style.transition = 'opacity 1s';
    glow.style.opacity = '.55';
    dial.style.transition = 'transform 5s linear';
    dial.style.transform = 'rotate(360deg)';
    ctx.say(L().ovenWait);
    ctx.onSmell && ctx.onSmell();
    const steam = sc.interval(() => { const q = UI().rectOf(glow); UI().hearts(q.cx + (Math.random() - 0.5) * 300, q.y + 40, 1, '#ffffff'); }, 800);
    await sc.wait(5000);
    clearInterval(steam);
    item.innerHTML = svg('0 0 300 160', `<rect x="10" y="100" width="280" height="20" rx="8" fill="#a6a6c0" ${ink(3)}/>` + ovenArt[step.after](ctx.data));
    G.Sound.play('ding');
    glow.style.opacity = '0';
    item.style.transform = 'translateY(0)';
    await sc.wait(800);
    sparkleAt(item, 10, 160);
    await ctx.say(L().ovenDone, 'face_happy');
  }

  /* ---------- にる（おなべを ぐるぐる：F-6A） ---------- */
  async function boil(ctx, step) {
    const a = fresh(ctx, counter()), sc = ctx.sc;
    if (ctx.firstTime('fire')) await ctx.say(L().safetyFire);
    K.layer(a, 75, 90, 500, 500, svg('0 0 500 500', `<path d="M10 250 H60 M440 250 H490" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
      <circle cx="250" cy="250" r="200" fill="#f6a8a0" ${ink(6)}/><circle cx="250" cy="250" r="172" fill="#c9c9d6" ${ink(4)}/>`));
    const soup = K.layer(a, 75, 90, 500, 500, '', 'wk-soup');
    const items = step.items || [];
    const pos = items.map((_, i) => [180 + (i % 3) * 70, 200 + Math.floor(i / 3) * 90 + (i % 2) * 30]);
    const draw = (p) => {
      soup.innerHTML = svg('0 0 500 500', `<circle cx="250" cy="250" r="164" fill="${lerpC('#d9ecf3', step.color, p)}"/>
        ${items.map((id, i) => `<g transform="translate(${pos[i][0] - 40} ${pos[i][1] - 40}) scale(.8)">${G.Art.ing(id).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`).join('')}
        ${Array.from({ length: Math.round(p * 8) }, (_, i) => `<circle cx="${160 + (i * 61) % 200}" cy="${180 + (i * 43) % 160}" r="${8 + i % 3 * 3}" fill="#fff" opacity=".45"/>`).join('')}`);
    };
    draw(0);
    const ladle = K.layer(a, 260, 150, 150, 300, svg('0 0 150 300', `<path d="M75 0 V200" stroke="#a6a6c0" stroke-width="16" stroke-linecap="round"/><ellipse cx="75" cy="230" rx="50" ry="36" fill="#c9c9d6" ${ink(4)}/>`), 'wk-ladle');
    G.Sound.sizzle(true);
    ctx.say(L().boilIntro);
    let t = 0;
    await work(ctx, {
      need: 6, rubDist: 1400, sound: 'stir',
      hint: () => K.hand(a, { x: 250, y: 300 }, { x: 400, y: 400 }, 2),
      onStep: (p) => { draw(p); t += 0.9; ladle.style.transform = `translate(${Math.cos(t) * 80}px, ${Math.sin(t) * 60}px)`; G.Sound.play('bubble'); }
    });
    ctx.onSmell && ctx.onSmell();
    await ctx.say(L().boilDone, 'face_happy');
    G.Sound.sizzle(false);
  }

  /* ---------- ひやす（れいぞうこへ：F-6C） ---------- */
  async function chill(ctx, step) {
    const a = fresh(ctx, svg('0 0 650 680', `<rect x="160" y="30" width="330" height="620" rx="30" fill="#eaf6fb" ${ink(6)}/>
      <path d="M180 250 H470 M180 450 H470" stroke="#9ccdf0" stroke-width="10"/>`));
    const sc = ctx.sc;
    const cups = K.layer(a, 200, 520, 250, 130, svg('0 0 250 130', [0, 1, 2].map(i => `<path d="M${20 + i * 80} 40 h60 l-8 70 h-44z" fill="#fff6d8" ${ink(4)}/><ellipse cx="${50 + i * 80}" cy="44" rx="30" ry="9" fill="#ffe08a" ${ink(3)}/>`).join('')), 'wk-cups');
    const door = K.layer(a, 160, 30, 330, 620, svg('0 0 330 620', `<rect x="0" y="0" width="330" height="620" rx="30" fill="#fffdf8" ${ink(6)}/><rect x="270" y="200" width="20" height="200" rx="10" fill="#d9d6de" ${ink(4)}/>`), 'wk-door');
    door.style.transformOrigin = '0% 50%';
    door.style.transition = 'transform .5s, opacity .5s';
    door.style.transform = 'perspective(900px) rotateY(-80deg)';
    door.style.opacity = '0';
    ctx.say(L().chillIntro);
    let h = tapHint(a, 325, 580, 3);
    await K.progress(sc, a, { need: 1, rub: false, sound: 'place', onStep: () => { if (h) { h.remove(); h = null; } } });
    cups.style.transition = 'transform .6s';
    cups.style.transform = 'translateY(-200px)';
    await sc.wait(700);
    door.style.transform = 'none';
    door.style.opacity = '1';
    G.Sound.play('door');
    const sp = sc.interval(() => { const q = UI().rectOf(door); UI().sparkles(q.cx, q.cy, 3, 140, '#bfe2f5'); }, 500);
    await sc.wait(3000);
    clearInterval(sp);
    door.style.transform = 'perspective(900px) rotateY(-80deg)';
    door.style.opacity = '0';
    cups.innerHTML = svg('0 0 250 130', [0, 1, 2].map(i => `<path d="M${20 + i * 80} 40 h60 l-8 70 h-44z" fill="#ffe08a" ${ink(4)}/><ellipse cx="${50 + i * 80}" cy="44" rx="30" ry="9" fill="#a8683e" ${ink(3)}/>`).join(''));
    G.Sound.play('ding');
    await ctx.say(L().chillDone, 'face_happy');
  }

  /* ---------- カップに いれる（プリン） ---------- */
  async function pourCups(ctx) {
    const a = fresh(ctx);
    const fills = [0, 1, 2].map(i => K.layer(a, 110 + i * 150, 380, 130, 170, '', 'wk-cup'));
    const draw = (i, lv) => { fills[i].innerHTML = svg('0 0 130 170', `<path d="M10 20 h110 l-14 140 h-82z" fill="#fff" ${ink(5)}/>${lv ? `<path d="M${14 + (1 - lv) * 4} ${160 - lv * 130} h${102 - (1 - lv) * 8} l-${10 - lv * 0} ${lv * 130 - 4} h-82z" fill="#ffe08a"/>` : ''}`); };
    [0, 1, 2].forEach(i => draw(i, 0));
    const bowl = K.layer(a, 380, 120, 220, 160, svg('0 0 220 160', `<path d="M10 40 Q20 150 110 150 Q200 150 210 40Z" fill="#9ccdf0" ${ink(5)}/><ellipse cx="110" cy="40" rx="100" ry="24" fill="#ffe08a" ${ink(4)}/>`), 'wk-bowl');
    ctx.say(L().pourIntro);
    let n = 0;
    await work(ctx, {
      need: 3, rub: false, sound: 'pour',
      hint: () => tapHint(a, 175, 460, 3),
      onStep: () => { bowl.style.transform = `translate(${-250 + n * 150}px, 80px) rotate(-30deg)`; draw(n, 0.8); n++; }
    });
    bowl.style.transition = 'opacity .3s';
    bowl.style.opacity = '0';
    await ctx.sc.wait(700);
  }

  /* ---------- ごはんに かける（カレー） ---------- */
  async function pourOver(ctx, step) {
    const a = fresh(ctx, counter());
    const plate = K.layer(a, 75, 200, 500, 360, '', 'wk-plate');
    const draw = (p) => { plate.innerHTML = svg('0 0 500 360', `<ellipse cx="250" cy="200" rx="230" ry="130" fill="#fff" ${ink(5)}/>
      <path d="M60 210 Q60 120 200 110 Q260 112 260 210 Q160 260 60 210Z" fill="#fff" ${ink(4)}/>
      ${p > 0 ? `<path d="M250 ${210 - 90 * p} Q${330 + 80 * p} ${110} ${440} 200 Q350 ${270} 240 230Z" fill="${step.color}" ${ink(4)}/>` : ''}`); };
    draw(0);
    const ladle = K.layer(a, 420, 60, 180, 200, svg('0 0 180 200', `<path d="M150 0 L80 120" stroke="#a6a6c0" stroke-width="16" stroke-linecap="round"/><ellipse cx="70" cy="140" rx="54" ry="36" fill="${step.color}" ${ink(4)}/>`), 'wk-ladle');
    ctx.say(L().pourOverIntro);
    await work(ctx, {
      need: 3, rub: false, sound: 'pour',
      hint: () => tapHint(a, 420, 360, 3),
      onStep: (p) => { draw(p); ladle.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-30deg)' }, { transform: 'rotate(0)' }], { duration: 500 }); }
    });
    ladle.style.transition = 'opacity .3s';
    ladle.style.opacity = '0';
    sparkleAt(plate, 8, 180);
    await ctx.sc.wait(600);
  }

  /* ---------- くるくる まく（ロールケーキ） ---------- */
  async function rollup(ctx) {
    const a = fresh(ctx);
    const cake = K.layer(a, 75, 230, 500, 320, '', 'wk-roll');
    const draw = (s) => {
      const w = 420 - s * 120;
      cake.innerHTML = svg('0 0 500 320', s < 3
        ? `<rect x="${40 + (420 - w)}" y="80" width="${w}" height="160" rx="14" fill="#f2bb74" ${ink(5)}/><rect x="${56 + (420 - w)}" y="96" width="${w - 32}" height="128" rx="10" fill="#fffaf0"/>
           ${s > 0 ? `<ellipse cx="${60 + (420 - w)}" cy="160" rx="${30 + s * 18}" ry="${80}" fill="#f2bb74" ${ink(5)}/>` : ''}`
        : `<rect x="70" y="90" width="360" height="140" rx="70" fill="#f2bb74" ${ink(5)}/><circle cx="420" cy="160" r="70" fill="#f2bb74" ${ink(5)}/><path d="M420 160 m-40 0 a40 40 0 1 1 40 40 a26 26 0 1 1 -16 -26" fill="none" stroke="#fffaf0" stroke-width="12"/>`);
    };
    draw(0);
    ctx.say(L().rollupIntro);
    let s = 0;
    await work(ctx, {
      need: 3, rubDist: 700, sound: 'roll',
      hint: () => K.hand(a, { x: 500, y: 400 }, { x: 250, y: 400 }, 2),
      onStep: (p) => { const n = Math.min(3, Math.round(p * 3)); if (n !== s) { s = n; draw(s); sparkleAt(cake, 4, 140); } }
    });
    await ctx.sc.wait(600);
  }

  /* ---------- やく・ひっくりかえす（しゅるいを ふやす） ---------- */
  const panContent = {
    rice: (side, p) => `<circle cx="200" cy="200" r="150" fill="${lerpC('#ffffff', '#f6c27a', p)}" ${ink(4)}/>${[[140, 160], [230, 140], [260, 230], [170, 250], [210, 200], [120, 220]].map(([x, y], i) => i % 2 ? `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="4" fill="#f6a24a"/>` : `<rect x="${x - 10}" y="${y - 8}" width="20" height="16" rx="5" fill="#f8c8b0"/>`).join('')}`,
    veg: (side, p) => [[140, 160, 'carrot'], [240, 150, 'potato'], [200, 240, 'pumpkin'], [270, 240, 'chicken'], [130, 250, 'carrot']].map(([x, y, id]) => `<g transform="translate(${x - 45} ${y - 45}) scale(.9)">${G.Art.ing(id).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`).join(''),
    omelet: (side, p) => `<circle cx="200" cy="200" r="160" fill="${lerpC('#fff3b0', '#ffd95a', p)}" ${ink(4)}/><ellipse cx="200" cy="200" rx="90" ry="60" fill="#f6c27a" opacity="${p.toFixed(2)}"/>`,
    fish: (side) => `<path d="M60 200 Q140 120 260 160 L340 120 L330 200 L340 280 L260 240 Q140 280 60 200Z" fill="${side === 'bottom' ? '#e9b26e' : '#cfe3f7'}" ${ink(5)}/><circle cx="110" cy="190" r="8" fill="${INK}"/>${side === 'bottom' ? '<path d="M170 170 l20 20 l-20 20 M220 170 l20 20 l-20 20" fill="none" stroke="#b97a3e" stroke-width="7"/>' : ''}`,
    hamburg: (side) => [140, 270].map(x => `<ellipse cx="${x}" cy="200" rx="80" ry="58" fill="${side === 'bottom' ? '#a8683e' : '#f2a59a'}" ${ink(5)}/>`).join('')
  };
  const origFry = G.Steps.fry, origFlip = G.Steps.flip;
  const pan = () => svg('0 0 650 680', `<path d="M470 410 L630 470" stroke="${INK}" stroke-width="34" stroke-linecap="round"/><path d="M470 410 L630 470" stroke="#5a5060" stroke-width="22" stroke-linecap="round"/>
    <circle cx="300" cy="340" r="230" fill="#6e6878" ${ink(6)}/><circle cx="300" cy="340" r="196" fill="#8a8494"/>`);
  async function fryKind(ctx, step) {
    const a = fresh(ctx, counter()), sc = ctx.sc, kind = step.kind;
    K.layer(a, 0, 0, 650, 680, pan());
    const food = K.layer(a, 100, 140, 400, 400, '', 'wk-cake');
    const draw = (p) => { food.innerHTML = svg('0 0 400 400', panContent[kind]('top', p)); };
    draw(0);
    food.style.transform = 'scale(.2)';
    food.style.opacity = '0';
    if (ctx.firstTime('fire')) await ctx.say(L().safetyFire);
    ctx.say(L().fryIntro);
    const knob = K.layer(a, 520, 560, 110, 110, svg('0 0 110 110', `<circle cx="55" cy="55" r="48" fill="#fff" ${ink(5)}/><rect x="47" y="14" width="16" height="50" rx="8" fill="#f37d9b" ${ink(3)}/>`), 'wk-knob');
    let h = tapHint(a, 575, 610, 3);
    await K.progress(sc, a, { need: 1, rub: false, sound: 'click', onStep: () => { if (h) { h.remove(); h = null; } } });
    knob.style.transition = 'transform .3s';
    knob.style.transform = 'rotate(90deg)';
    food.style.transition = 'transform .6s cubic-bezier(.3,1.4,.5,1), opacity .4s';
    food.style.transform = 'none';
    food.style.opacity = '1';
    G.Sound.play('place');
    await sc.wait(500);
    G.Sound.sizzle(true);
    ctx.onSmell && ctx.onSmell();
    if (step.stir) { // いためる：フライがえしで まぜる
      ctx.say(L().stirIntro);
      await work(ctx, { need: 5, rubDist: 1100, sound: 'stir', hint: () => K.hand(a, { x: 220, y: 330 }, { x: 400, y: 360 }, 2), onStep: (p) => { draw(p); food.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 260 }); } });
    } else {
      ctx.say(L().frySizzle);
      for (let i = 1; i <= 6; i++) { await sc.wait(500); draw(i / 6); }
    }
    food.classList.add('ready');
    ctx.say(L().fryReady, 'face_happy');
    if (!step.stir) await Promise.race([sc.wait(4000), new Promise(res => sc.on(a, 'pointerdown', res))]);
    else await sc.wait(1200);
    if (!step.keepFire) G.Sound.sizzle(false);
  }
  async function flipKind(ctx, step) {
    const a = fresh(ctx, counter()), sc = ctx.sc, kind = step.kind;
    K.layer(a, 0, 0, 650, 680, pan());
    const food = K.layer(a, 100, 140, 400, 400, svg('0 0 400 400', panContent[kind]('top', 1)), 'wk-cake');
    G.Sound.sizzle(true);
    ctx.say(L().flipIntro);
    let h = K.hand(a, { x: 300, y: 420 }, { x: 300, y: 200 }, 3);
    await new Promise((res) => {
      let down = null, y0 = 0, fired = false;
      const go = () => { if (!fired) { fired = true; res(); } };
      sc.on(a, 'pointerdown', (e) => { down = e.pointerId; y0 = UI().toStage(e.clientX, e.clientY).y; if (h) { h.remove(); h = null; } e.preventDefault(); });
      sc.on(a, 'pointermove', (e) => { if (e.pointerId === down && y0 - UI().toStage(e.clientX, e.clientY).y > 70) go(); });
      sc.on(a, 'pointerup', (e) => { if (e.pointerId === down) { down = null; go(); } });
    });
    G.Sound.play('flip');
    const an = food.animate([{ transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(-240px) scaleY(0)', offset: 0.45 }, { transform: 'translateY(-180px) scaleY(-1)', offset: 0.6 }, { transform: 'translateY(0) scaleY(1)' }], { duration: 900, easing: 'ease-in-out' });
    setTimeout(() => { food.innerHTML = svg('0 0 400 400', panContent[kind]('bottom', 1)); }, 400);
    await new Promise(r => { an.onfinish = r; });
    G.Sound.play('land');
    ctx.say(L().flipDone, 'face_happy');
    sparkleAt(food, 10, 180);
    await sc.wait(1600);
    G.Sound.sizzle(false);
  }

  Object.assign(G.Steps, {
    wash, chop, knead, roll, cutout, sauce, oven, boil, chill, pourCups, pourOver, rollup,
    fry: (ctx, step) => (step && step.kind ? fryKind(ctx, step) : origFry(ctx, step)),
    flip: (ctx, step) => (step && step.kind ? flipKind(ctx, step) : origFlip(ctx, step))
  });

  /* ================= できあがりの 絵（第2段階の レシピ。viewBox 0 0 400 300） ================= */
  const C = (k, x, y, r, f) => cutterShape(k, x, y, r, f);
  Object.assign(G.Dish.foods, {
    omurice: () => `<path d="M60 230 Q40 110 200 100 Q360 110 340 230 Q200 262 60 230Z" fill="#ffd95a" ${ink(6)}/>
      <path d="M90 150 Q200 120 300 150" fill="none" stroke="#fff3b0" stroke-width="12" stroke-linecap="round"/>`,
    grillfish: () => `<path d="M40 170 Q140 70 260 120 L360 70 L340 170 L360 270 L260 220 Q140 270 40 170Z" fill="#e9b26e" ${ink(6)}/>
      <circle cx="90" cy="160" r="10" fill="${INK}"/><path d="M160 130 l26 30 l-26 30 M220 130 l26 30 l-26 30" fill="none" stroke="#b97a3e" stroke-width="9" stroke-linecap="round"/>`,
    pizza: () => `<circle cx="200" cy="170" r="150" fill="#e9b26e" ${ink(6)}/><circle cx="200" cy="170" r="124" fill="#e8473c"/>
      <path d="M100 150 Q200 80 300 150 Q260 250 140 230 Q90 200 100 150Z" fill="#ffe8a8"/>`,
    curry: () => `<path d="M40 190 Q40 100 170 92 Q230 94 230 190 Q140 250 40 190Z" fill="#fff" ${ink(5)}/>
      <path d="M200 100 Q360 100 370 190 Q300 250 200 230Z" fill="#d9902e" ${ink(5)}/>
      ${[[260, 150, '#f6a24a'], [320, 180, '#e2b77a'], [280, 200, '#f8c8b0'], [330, 140, '#5f9a56']].map(([x, y, c]) => `<rect x="${x - 14}" y="${y - 14}" width="28" height="28" rx="6" fill="${c}" ${ink(3)}/>`).join('')}`,
    hamburg: () => [130, 270].map(x => `<ellipse cx="${x}" cy="180" rx="100" ry="64" fill="#a8683e" ${ink(6)}/><ellipse cx="${x - 20}" cy="160" rx="40" ry="12" fill="#fff" opacity=".3"/>`).join(''),
    cookie: (d) => (d.cookieShapes && d.cookieShapes.length ? d.cookieShapes : [{ k: 'heart' }, { k: 'star' }, { k: 'cat' }, { k: 'heart' }])
      .map((s, i) => C(s.k, 90 + (i % 2) * 220 - (i > 1 ? 0 : 0) + (i > 1 ? 40 : 0), 120 + Math.floor(i / 2) * 110, 64, '#e9b26e')).join(''),
    pudding: () => [120, 280].map(x => `<path d="M${x - 70} 250 L${x - 50} 110 H${x + 50} L${x + 70} 250Z" fill="#ffe08a" ${ink(6)}/>
      <path d="M${x - 50} 110 Q${x - 50} 84 ${x} 84 Q${x + 50} 84 ${x + 50} 110 L${x + 54} 136 Q${x} 150 ${x - 54} 136Z" fill="#a8683e" ${ink(5)}/>`).join(''),
    sushi: () => [90, 200, 310].map(x => `<ellipse cx="${x}" cy="200" rx="54" ry="40" fill="#fff" ${ink(5)}/>${[[x - 20, 196], [x + 14, 206], [x, 186]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="7" ry="4" fill="#ece6d8"/>`).join('')}`).join(''),
    cake: () => `<path d="M60 260 V130 H340 V260Z" fill="#fffaf0" ${ink(6)}/><path d="M60 196 H340" stroke="#f6a8c8" stroke-width="16"/>
      <path d="M60 196 H340" stroke="#f2577e" stroke-width="5" stroke-dasharray="20 20"/>
      <path d="M60 130 q35 -24 70 0 q35 -24 70 0 q35 -24 70 0 q35 -24 70 0" fill="#fff" ${ink(5)}/>`,
    pumpkinpie: () => `<ellipse cx="200" cy="180" rx="170" ry="96" fill="#e9b26e" ${ink(6)}/><ellipse cx="200" cy="176" rx="140" ry="74" fill="#e8902e"/>
      <path d="M100 140 L300 210 M100 210 L300 140 M200 104 V248" stroke="#f3cf90" stroke-width="14" stroke-linecap="round"/>`,
    xmascake: () => `<rect x="40" y="110" width="290" height="140" rx="70" fill="#fffaf0" ${ink(6)}/><circle cx="320" cy="180" r="70" fill="#f2bb74" ${ink(6)}/>
      <path d="M320 180 m-44 0 a44 44 0 1 1 44 44 a28 28 0 1 1 -18 -28" fill="none" stroke="#fffaf0" stroke-width="13"/>
      <path d="M80 130 q30 -16 60 0 q30 -16 60 0 q30 -16 60 0" fill="none" stroke="#e9e0e4" stroke-width="7" stroke-linecap="round"/>`
  });
})();
