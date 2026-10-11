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
  const pic = (key) => G.Art.pic(key);
  const strip = (s) => s.replace(/^<svg[^>]*>|<\/svg>$/g, '');
  const board = () => pic('wk_board');
  const counter = () => pic('wk_counter');
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
    const a = fresh(ctx, pic('wk_sink'));
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
      const knife = K.layer(a, X + W / n - 60, Y - 150, 120, 120, pic('tool_knife'), 'wk-knife');
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
  // きじ（こむぎこ）・ハンバーグの たね・すしめし。2 は まるく（oval なら たまご形）
  const doughShape = (stage, color, oval) => {
    const kind = color === '#f2a59a' ? 'food_meat' : color === '#ffffff' ? 'food_sushirice' : 'food_dough';
    let key = kind + (stage === 2 && oval ? '_oval' : stage);
    if (!G.Art.all[key]) key = kind + (oval ? '_oval' : Math.min(stage, 1));
    return pic(key);
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
    // きじの 絵（500×320 いっぱいの 大きさ）を、ちいさく ちぢめた ところから だんだん ひろげる
    const draw = (p) => {
      const k = (90 + p * 140) / 230, ky = (70 + p * 60) / 130;
      d.innerHTML = svg('0 0 500 320', `<g transform="translate(${250 * (1 - k)} ${160 * (1 - ky)}) scale(${k} ${ky})">${strip(pic(step.sheet ? 'food_dough_sheet' : 'food_dough_flat'))}</g>`);
    };
    draw(0);
    const pin = K.layer(a, 125, 280, 400, 80, pic('tool_pin'), 'wk-pin');
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
  // かたぬきの 形（k = heart・star・cat）を (x, y) に 半径 r で。baked = やけた 色
  const cutterShape = (k, x, y, r, baked) => {
    const s = r / 44;
    return `<g transform="translate(${x - 50 * s} ${y - 50 * s}) scale(${s})">${strip(pic((baked ? 'cookie_' : 'cookie_raw_') + k))}</g>`;
  };
  async function cutout(ctx, step) {
    const a = fresh(ctx), sc = ctx.sc;
    K.layer(a, 75, 290, 500, 320, pic('food_dough_sheet'));
    const marks = K.layer(a, 75, 290, 500, 320, '');
    marks.style.filter = 'drop-shadow(0 4px 3px rgba(120, 80, 40, .5)) saturate(1.3) brightness(.95)'; // 生地の 上で 型が 見えるように
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
        marks.innerHTML = svg('0 0 500 320', shapes.map(s => cutterShape(s.k, s.x, s.y, 46, false)).join(''));
        G.Sound.play('stamp');
        UI().sparkles(q.x, q.y, 4, 50);
        if (shapes.length >= 4) res();
        e.preventDefault();
      });
    });
    await sc.wait(700);
  }

  /* ---------- ぬる（ピザの ソース・ケーキの クリーム） ---------- */
  async function sauce(ctx, step) {
    const a = fresh(ctx);
    // ぬる まえ（base_<しゅるい>）の 上に、ぬった あと（base_<しゅるい>_sauce／_cream）を だんだん こく かさねる
    K.layer(a, 75, 210, 500, 380, pic('base_' + step.base));
    const top = K.layer(a, 75, 210, 500, 380, pic('base_' + step.base + (step.base === 'pizza' ? '_sauce' : '_cream')), 'wk-sauce');
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
  // オーブンに 入れる もの（300×160。クッキーは かたぬきした 形を ならべる）
  const ovenArt = (name, d) => {
    if (name === 'cookie_raw' || name === 'cookie') return (d.cookieShapes || []).map((s, i) => cutterShape(s.k, 50 + i * 66, 80, 30, name === 'cookie')).join('');
    return strip(pic('oven_' + name));
  };
  async function oven(ctx, step) {
    const a = fresh(ctx, pic('wk_oven'));
    const sc = ctx.sc;
    const glow = K.layer(a, 90, 170, 470, 330, svg('0 0 470 330', `<rect x="0" y="0" width="470" height="330" rx="26" fill="#ffb24d"/>`), 'wk-glow');
    glow.style.opacity = '0';
    const tray = (name) => svg('0 0 300 160', strip(pic('tool_oven_tray')) + ovenArt(name, ctx.data));
    const item = K.layer(a, 175, 520, 300, 160, tray(step.before), 'wk-tray');
    const dial = K.layer(a, 520, 60, 90, 90, pic('tool_oven_dial'), 'wk-dial');
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
    item.innerHTML = tray(step.after);
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
    K.layer(a, 75, 90, 500, 500, pic('tool_pot'));
    const soup = K.layer(a, 75, 90, 500, 500, '', 'wk-soup');
    const items = step.items || [];
    const pos = items.map((_, i) => [180 + (i % 3) * 70, 200 + Math.floor(i / 3) * 90 + (i % 2) * 30]);
    const draw = (p) => {
      soup.innerHTML = svg('0 0 500 500', `${strip(G.Art.fade('soup_water', step.color === '#f6a24a' ? 'soup_pumpkin' : 'soup_curry', p))}
        ${items.map((id, i) => `<g transform="translate(${pos[i][0] - 40} ${pos[i][1] - 40}) scale(.8)">${strip(G.Art.ing(id))}</g>`).join('')}
        ${Array.from({ length: Math.round(p * 8) }, (_, i) => `<circle cx="${160 + (i * 61) % 200}" cy="${180 + (i * 43) % 160}" r="${8 + i % 3 * 3}" fill="#fff" opacity=".45"/>`).join('')}`);
    };
    draw(0);
    const ladle = K.layer(a, 260, 150, 150, 300, pic('tool_ladle'), 'wk-ladle');
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
    const a = fresh(ctx, pic('wk_fridge'));
    const sc = ctx.sc;
    const cups = K.layer(a, 200, 520, 250, 130, pic('food_cups_raw'), 'wk-cups');
    const door = K.layer(a, 160, 30, 330, 620, pic('tool_fridge_door'), 'wk-door');
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
    cups.innerHTML = pic('food_cups_done');
    G.Sound.play('ding');
    await ctx.say(L().chillDone, 'face_happy');
  }

  /* ---------- カップに いれる（プリン） ---------- */
  async function pourCups(ctx) {
    const a = fresh(ctx);
    const fills = [0, 1, 2].map(i => K.layer(a, 110 + i * 150, 380, 130, 170, '', 'wk-cup'));
    const draw = (i, lv) => { fills[i].innerHTML = pic(lv ? 'food_cup_full' : 'food_cup_empty'); };
    [0, 1, 2].forEach(i => draw(i, 0));
    const bowl = K.layer(a, 380, 120, 220, 160, pic('tool_pour_bowl'), 'wk-bowl');
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
    const draw = (p) => { plate.innerHTML = G.Art.fade('food_curry_plate0', 'food_curry_plate1', p); };
    draw(0);
    const ladle = K.layer(a, 420, 60, 180, 200, pic('tool_ladle_curry'), 'wk-ladle');
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
    const draw = (s) => { cake.innerHTML = pic('food_rollup' + s); };
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
  // フライパンの 中みの 絵。p = やけぐあい（0〜1）。ごはん・たまごは だんだん やけた 絵に かわる
  const panContent = {
    rice: (side, p) => strip(G.Art.fade('pan_rice0', 'pan_rice1', p)),
    veg: () => [[140, 160, 'carrot'], [240, 150, 'potato'], [200, 240, 'pumpkin'], [270, 240, 'chicken'], [130, 250, 'carrot']].map(([x, y, id]) => `<g transform="translate(${x - 45} ${y - 45}) scale(.9)">${strip(G.Art.ing(id))}</g>`).join(''),
    omelet: (side, p) => strip(G.Art.fade('pan_omelet0', 'pan_omelet1', p)),
    fish: (side) => strip(pic(side === 'bottom' ? 'pan_fish_bottom' : 'pan_fish_top')),
    hamburg: (side) => strip(pic(side === 'bottom' ? 'pan_hamburg_bottom' : 'pan_hamburg_top'))
  };
  const origFry = G.Steps.fry, origFlip = G.Steps.flip;
  const pan = () => pic('tool_pan');
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
    const knob = K.layer(a, 520, 560, 110, 110, pic('tool_knob'), 'wk-knob');
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
  const C = (k, x, y, r) => cutterShape(k, x, y, r, true);
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
      .map((s, i) => C(s.k, 90 + (i % 2) * 220 + (i > 1 ? 40 : 0), 120 + Math.floor(i / 2) * 110, 64)).join(''),
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
  // できあがりの 絵（水彩の 画像の キー final_<レシピ>）。おにぎり・サンドイッチ・クッキーは 部品を くみあわせる（G.Dish.foodOf）
  Object.keys(G.Dish.foods).filter(id => ['onigiri', 'sandwich', 'cookie'].indexOf(id) < 0)
    .forEach(id => { G.Art.all['final_' + id] = () => svg('0 0 400 300', G.Dish.foods[id]({})); });
})();
