/* おりょうりの 画面（要件定義書 5.4〜5.8）
 * ・recipes … レシピを えらぶ（5まいずつ）
 * ・cook    … ①ざいりょうを あつめる → ②こうてい（js/steps.js）→ ③もりつけ・デコレーション
 * ・eat     … ④いただきます（ニューちゃんが たべる → ハート）
 * とちゅうで やめても 何も へらない。とちゅうは 保存しない（N-31）
 */
window.G = window.G || {};
G.Screens = G.Screens || {};

/* ================= レシピを えらぶ（5.4） ================= */
G.Screens.recipes = {
  bg: 'bg_kitchen', hud: true, bgm: 'room',
  page: 0,
  enter(scr, sc) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines;
    UI.backButton(scr, () => G.go('home'));
    scr.appendChild(UI.el('div', 'recipe-shade'));
    const PER = 5;
    const pages = Math.ceil(G.RECIPES.length / PER);
    const box = UI.el('div', 'recipe-box');
    UI.pos(box, 0, 0, 1366, 1024);
    scr.appendChild(box);
    const bubble = new UI.Bubble(scr);
    const say = (t) => { bubble.place(683, 150, 'top'); return bubble.say(t); };

    const cardOf = (r) => {
      const has = S.hasRecipe(r);
      const ready = has && r.ready;
      const card = UI.el('div', 'recipe-card' + (has ? '' : ' locked') + (has && !r.ready ? ' soon' : ''));
      const pans = Array.from({ length: r.level }, () => `<span class="rc-pan">${G.Art.all.icon_cook()}</span>`).join('');
      card.innerHTML = `<div class="rc-art">${G.Art.dish(r.id)}</div>
        <div class="rc-name">${has ? r.label : '？'}</div>
        <div class="rc-level">${pans}</div>
        ${!has ? `<div class="rc-lock">${r.season ? r.season.when : G.Art.heart() + '<span>' + r.unlock + '</span>'}</div>` : ''}
        ${has && !r.ready ? '<div class="rc-soon">じゅんびちゅう</div>' : ''}
        ${S.request() === r.id && ready ? `<img class="rc-req" src="${G.CHARACTERS.nyu.images.base}" alt="">` : ''}`;
      UI.tap(card, () => {
        if (!has) {
          if (r.season) say(r.season.when + 'に とどく ニャー！');
          else say(G.CHARACTER.lines.lockRecipe);
          return;
        }
        if (!r.ready) { say(L.comingSoon); return; }
        G.Voice.speak(r.label + 'を つくる ニャー！', 'chara');
        G.go('cook', { recipe: r.id });
      }, { sound: has ? 'press' : 'lock' });
      return card;
    };
    const show = (pg) => {
      this.page = pg;
      box.innerHTML = '';
      const list = G.RECIPES.slice(pg * PER, pg * PER + PER);
      list.forEach((r, i) => {
        const row = i < 3 ? 0 : 1;
        const n = row === 0 ? Math.min(3, list.length) : list.length - 3;
        const col = row === 0 ? i : i - 3;
        const x = 683 - (n * 300 + (n - 1) * 40) / 2 + col * 340;
        const c = cardOf(r);
        UI.pos(c, x, 150 + row * 340, 300, 310);
        box.appendChild(c);
      });
      if (pages > 1) {
        [[-1, 60], [1, 1206]].forEach(([dir, x]) => {
          const to = (pg + dir + pages) % pages;
          const b = UI.el('div', 'page-btn', dir > 0 ? '▶' : '◀');
          UI.pos(b, x, 420, 100, 100);
          box.appendChild(b);
          UI.tap(b, () => show(to), { say: dir > 0 ? 'つぎの ページ' : 'まえの ページ', sound: 'swish' });
        });
        const dots = UI.el('div', 'page-dots', Array.from({ length: pages }, (_, i) => `<i class="${i === pg ? 'on' : ''}"></i>`).join(''));
        UI.pos(dots, 583, 850, 200, 40);
        box.appendChild(dots);
      }
    };
    const reqIdx = G.RECIPES.findIndex(r => r.id === S.request());
    show(this.page || (reqIdx >= 0 ? Math.floor(reqIdx / PER) : 0));
    sc.timeout(() => say(L.pickRecipe), 400);
  }
};

/* ================= おりょうり（5.5〜5.7） ================= */
G.Screens.cook = {
  bg: 'bg_counter', hud: false, bgm: 'room',
  enter(scr, sc, params) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines, N = G.CHARACTERS.nyu.lines, K = G.StepKit;
    const recipe = G.recipe(params.recipe) || G.recipe('onigiri');
    const pick = (a) => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
    const data = {};

    /* ニャーちゃん（左に 小さく。ガイドの セリフ） */
    const chara = new G.Chara(scr, { x: 210, y: 830, h: 340 });
    chara.setMood('face_normal');
    chara.setPose('face_normal', 0);
    const bubble = new UI.Bubble(scr);
    bubble.el.classList.add('narrow'); // ニャーちゃんの 上に 出して、作業場に かさねない
    const say = (text, face, ms = 2400) => {
      const p = chara.point(0.5, 0.12);
      bubble.place(p.x, p.y, 'top');
      if (face) chara.flash(face, ms);
      return sc.guard(bubble.say(text));
    };
    const cheer = () => { chara.hop(26); return say(pick(L.stepDone), 'face_happy', 1600); };

    /* じゅんばんの まる（上の まんなか）：ざいりょう・こうてい・もりつけ */
    const stages = ['gather'].concat(recipe.steps.map(s => s.t), ['deco']);
    const dots = UI.el('div', 'step-dots', stages.map(() => '<i></i>').join(''));
    UI.pos(dots, 465, 26, 600, 60);
    scr.appendChild(dots);
    const setStage = (i) => [...dots.children].forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'now' : ''; });

    /* もどる（たしかめてから：F-6H） */
    let quitting = false;
    UI.backButton(scr, async () => {
      if (quitting) return;
      quitting = true;
      const ok = await confirmQuit(scr);
      quitting = false;
      if (ok) G.go('home');
    });
    async function confirmQuit(parent) {
      const wrap = UI.el('div', 'confirm-wrap');
      wrap.innerHTML = `<div class="confirm"><div class="cf-q">${G.Art.dish(recipe.id)}</div>
        <div class="cf-btns"><div class="cf-no">${G.Art.svg('0 0 100 100', '<path d="M28 28 L72 72 M72 28 L28 72" stroke="#fff" stroke-width="14" stroke-linecap="round"/>')}</div>
        <div class="cf-yes">${G.Art.svg('0 0 100 100', '<path d="M24 52 l18 18 l36 -40" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>')}</div></div></div>`;
      document.querySelector('#overlay').appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('show'));
      G.Voice.speak(L.quitAsk, 'chara');
      return new Promise(res => {
        const close = (v) => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 250); res(v); };
        // ✕ = つづける、✓ = やめる（キッチンに もどる）
        UI.tap(wrap.querySelector('.cf-no'), () => close(false), { say: 'つづける' });
        UI.tap(wrap.querySelector('.cf-yes'), () => close(true), { say: 'やめる' });
        sc.add(() => wrap.remove());
      });
    }

    /* ニューちゃんが ときどき のぞきに くる（F-23。右下から あたまだけ） */
    let nyu = null;
    const peek = async (line) => {
      if (!nyu) {
        nyu = new G.NyuSprite(scr, { x: 1250, y: 1150, h: 360 });
        nyu.el.classList.add('peek');
      }
      nyu.el.classList.add('show');
      nyu.setPose('happy');
      const nb = new UI.Bubble(scr);
      const p = nyu.point(0.5, 0.06);
      nb.place(p.x - 60, p.y, 'top');
      await sc.guard(nb.say(line, { who: 'nyu' }));
      nyu.el.classList.remove('show');
    };

    const ctx = {
      scr, sc, data, recipe, say, cheer,
      firstTime: (k) => S.firstTime(k),
      onSmell: () => sc.timeout(() => peek(N.smell), 900)
    };

    (async () => {
      /* ① ざいりょう */
      setStage(0);
      await gather();
      /* ② こうてい */
      const tasteAt = recipe.steps.length >= 3 ? 1 + Math.floor(Math.random() * (recipe.steps.length - 1)) : -1;
      for (let i = 0; i < recipe.steps.length; i++) {
        const step = recipe.steps[i];
        setStage(i + 1);
        const area = UI.el('div', 'work');
        UI.pos(area, AREA.x, AREA.y, AREA.w, AREA.h);
        scr.appendChild(area);
        area.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300 });
        ctx.area = area;
        await sc.guard(G.Steps[step.t](ctx, step));
        await cheer();
        if (i === tasteAt) { // ときどき あじみ（F-6G）
          chara.flash('face_happy', 2600);
          await say(L.taste);
          await peek(N.sneaky);
        }
        area.style.transition = 'opacity .3s';
        area.style.opacity = '0';
        await sc.wait(300);
        area.remove();
      }
      /* ③ もりつけ・デコレーション */
      setStage(stages.length - 1);
      const deco = await decorate();
      G.go('eat', { recipe: recipe.id, data, deco });
    })();

    /* ---------- ① ざいりょうを あつめる（5.5） ---------- */
    async function gather() {
      const need = recipe.items.slice();
      const got = new Set();
      // ほかの ざいりょう（たなと れいぞうこに 1つずつ）
      const others = (where) => G.INGREDIENTS.filter(x => x.where === where && G.Art.hasIng(x.id) && need.indexOf(x.id) < 0);
      const one = (list) => list[Math.floor(Math.random() * list.length)];
      const extra = [one(others('shelf')), one(others('fridge'))].filter(Boolean).map(x => x.id);
      const shelfItems = need.filter(id => G.ingredient(id).where === 'shelf').concat(extra.filter(id => G.ingredient(id).where === 'shelf'));
      const fridgeItems = need.filter(id => G.ingredient(id).where === 'fridge').concat(extra.filter(id => G.ingredient(id).where === 'fridge'));
      shuffle(shelfItems); shuffle(fridgeItems);

      const root = UI.el('div', 'gather');
      UI.pos(root, 0, 0, 1366, 1024);
      scr.appendChild(root);
      // ひつような ざいりょうの リスト（上）
      const list = UI.el('div', 'need-list');
      UI.pos(list, 720 - (need.length * 110 + 30) / 2, 100, need.length * 110 + 30, 130);
      root.appendChild(list);
      const slots = {};
      need.forEach(id => {
        const s = UI.el('div', 'need-slot', G.Art.ing(id));
        list.appendChild(s);
        slots[id] = s;
        UI.tap(s, () => G.Voice.speak(G.ingredient(id).label, 'guide'), { sound: 'soft' });
      });
      // トレー（ここに おく）
      const tray = UI.el('div', 'tray', G.Art.svg('0 0 600 200', `<rect x="10" y="40" width="580" height="140" rx="30" fill="#f8c6d3" stroke="#3b3236" stroke-width="5"/><rect x="34" y="60" width="532" height="100" rx="20" fill="#fde3ea"/>`));
      UI.pos(tray, 430, 640, 580, 200);
      root.appendChild(tray);
      const trayRect = () => ({ x: 410, y: 520, w: 620, h: 360 });
      // たな（上の まんなか）
      const shelf = UI.el('div', 'shelf', G.Art.svg('0 0 640 60', `<rect x="10" y="10" width="620" height="34" rx="10" fill="#e9c48c" stroke="#3b3236" stroke-width="5"/>`));
      UI.pos(shelf, 420, 450, 600, 60);
      root.appendChild(shelf);
      // れいぞうこ（右）
      const fridge = UI.el('div', 'fridge');
      UI.pos(fridge, 1030, 130, 310, 700);
      fridge.innerHTML = `<div class="fr-in">${G.Art.svg('0 0 310 700', `<rect x="6" y="6" width="298" height="688" rx="28" fill="#eaf6fb" stroke="#3b3236" stroke-width="6"/>
          <path d="M20 250 H290 M20 470 H290" stroke="#9ccdf0" stroke-width="8"/>`)}</div>
        <div class="fr-door">${G.Art.svg('0 0 310 700', `<rect x="6" y="6" width="298" height="688" rx="28" fill="#fffdf8" stroke="#3b3236" stroke-width="6"/>
          <path d="M6 300 H304" stroke="#3b3236" stroke-width="5"/><rect x="250" y="80" width="20" height="150" rx="10" fill="#d9d6de" stroke="#3b3236" stroke-width="4"/>
          <rect x="250" y="360" width="20" height="200" rx="10" fill="#d9d6de" stroke="#3b3236" stroke-width="4"/>`)}</div>`;
      root.appendChild(fridge);

      let wrong = 0;
      const done = new Promise((resolve) => {
        const place = (id, el, x, y) => {
          UI.pos(el, x, y, 120, 120);
          root.appendChild(el);
          K.dragOrTap(sc, el, {
            target: trayRect,
            check: () => need.indexOf(id) >= 0 && !got.has(id),
            onReject: () => {
              wrong++;
              say(L.gatherWrong, 'face_prim');
              if (wrong >= 2) root.querySelectorAll('.ing').forEach(e => { if (need.indexOf(e.dataset.id) >= 0 && !got.has(e.dataset.id)) e.classList.add('glow'); });
            },
            onPlace: async (tapped) => {
              got.add(id);
              el.classList.add('used');
              el.classList.remove('glow');
              G.Voice.speak(G.ingredient(id).label, 'guide');
              const slotX = 460 + (got.size - 1) * 120;
              if (tapped) await K.flyTo(el, { x: slotX + 60, y: 710 }, 480);
              el.getAnimations().forEach(an => an.cancel());
              el.style.transform = '';
              UI.pos(el, slotX, 650, 120, 120);
              el.classList.add('on-tray');
              G.Sound.play('place');
              slots[id].classList.add('got');
              const r = UI.rectOf(slots[id]);
              UI.sparkles(r.cx, r.cy, 5, 50);
              if (got.size === need.length) resolve();
            }
          });
        };
        shelfItems.forEach((id, i) => {
          const el = UI.el('div', 'ing', G.Art.ing(id));
          el.dataset.id = id;
          place(id, el, 720 - shelfItems.length * 70 + i * 140 + 10, 330);
        });
        // れいぞうこは タッチで ひらく
        let opened = false;
        const open = () => {
          if (opened) return;
          opened = true;
          fridge.classList.add('open');
          G.Sound.play('door');
          fridgeItems.forEach((id, i) => {
            const el = UI.el('div', 'ing in-fridge', G.Art.ing(id));
            el.dataset.id = id;
            place(id, el, 1055 + (i % 2) * 135, 180 + Math.floor(i / 2) * 220);
            el.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: 200 + i * 80, fill: 'backwards' });
          });
        };
        UI.tap(fridge.querySelector('.fr-door'), open, { sound: false, say: 'れいぞうこ' });
        sc.timeout(() => { if (!opened) UI.hand(root, { x: 1150, y: 450 }, null, { times: 3 }); }, 3500);
      });
      await say(L.gatherIntro);
      say(L.gatherHint);
      await done;
      await say(L.gatherDone, 'face_happy');
      root.style.transition = 'opacity .4s';
      root.style.opacity = '0';
      await sc.wait(400);
      root.remove();
    }

    /* ---------- ③ もりつけ・デコレーション（5.7） ---------- */
    async function decorate() {
      const deco = { pieces: [], strokes: [], plate: S.plate() };
      const root = UI.el('div', 'deco');
      UI.pos(root, 0, 0, 1366, 1024);
      scr.appendChild(root);
      // おさら（ステージの 420,200 から 660×475。絵の 1 = 1.32px）
      const BOX = { x: 420, y: 200, w: 660, h: 475 };
      const SC = BOX.w / 500;
      const plate = UI.el('div', 'deco-plate');
      UI.pos(plate, BOX.x, BOX.y, BOX.w, BOX.h);
      root.appendChild(plate);
      const redraw = () => { plate.innerHTML = G.Dish.svgOf(recipe.id, data, deco); };
      redraw();
      plate.animate([{ transform: 'translateY(-60px) scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      const toDish = (p) => ({ x: (p.x - BOX.x) / SC, y: (p.y - BOX.y) / SC });
      const inPlate = (q) => ((q.x - 250) / 240) ** 2 + ((q.y - 230) / 130) ** 2 <= 1.05;

      // パレット（下）：トッピング・ソース・ふきん・できた
      const tools = recipe.toppings.map(id => ({ kind: 'piece', id }));
      if (recipe.sauce) tools.push({ kind: 'sauce', id: recipe.sauce });
      let sel = tools[0];
      const btns = [];
      const startX = 750 - (tools.length * 130 + 300) / 2;
      tools.forEach((t, i) => {
        const b = UI.el('div', 'deco-tool' + (t.kind === 'sauce' ? ' sauce' : ''), G.Art.ing(t.id));
        UI.pos(b, startX + i * 130, 850, 116, 116);
        root.appendChild(b);
        btns.push(b);
        b.style.touchAction = 'none';
        // おしたら えらぶ。そのまま おさらへ ドラッグしたら そこに おく。タップだけなら、おさらの どこかに おく（救済）
        let down = null, ghost = null, moved = 0, st = null;
        sc.on(b, 'pointerdown', (e) => {
          down = e.pointerId; moved = 0; st = UI.toStage(e.clientX, e.clientY);
          try { b.setPointerCapture(e.pointerId); } catch (_) { /* なし */ }
          select(t); G.Sound.play('tap');
          if (t.kind === 'piece') { ghost = UI.el('div', 'deco-ghost', G.Art.ing(t.id)); UI.pos(ghost, st.x - 48, st.y - 48, 96, 96); root.appendChild(ghost); }
          e.preventDefault();
        });
        sc.on(b, 'pointermove', (e) => {
          if (e.pointerId !== down) return;
          const q = UI.toStage(e.clientX, e.clientY);
          moved = Math.max(moved, Math.hypot(q.x - st.x, q.y - st.y));
          if (ghost) UI.pos(ghost, q.x - 48, q.y - 48);
        });
        sc.on(b, 'pointerup', (e) => {
          if (e.pointerId !== down) return;
          down = null;
          if (ghost) { ghost.remove(); ghost = null; }
          const q = toDish(UI.toStage(e.clientX, e.clientY));
          if (moved > 20 && t.kind === 'piece' && inPlate(q)) { addPiece(t.id, q); return; }
          if (moved <= 20) {
            G.Voice.speak(G.ingredient(t.id).label, 'guide');
            if (t.kind === 'piece') addPiece(t.id, randomSpot());
            else autoSauce(t.id);
          }
        });
        sc.on(b, 'pointercancel', () => { down = null; if (ghost) { ghost.remove(); ghost = null; } });
      });
      const select = (t) => { sel = t; btns.forEach((b, i) => b.classList.toggle('sel', tools[i] === t)); };
      select(sel);
      const randomSpot = () => {
        const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.6;
        return { x: 250 + Math.cos(a) * 200 * r, y: 225 + Math.sin(a) * 100 * r };
      };
      const sauceColor = (id) => ({ honey: '#f2b84a', tomatosauce: '#e8473c', icing: '#f7a8c8' })[id] || '#f2b84a';
      function addPiece(id, q) {
        if (deco.pieces.length >= 30) { G.Sound.play('soft'); return; } // たくさん おいても おそくならないように（F-76）
        deco.pieces.push({ id, x: Math.round(q.x), y: Math.round(q.y), r: Math.round((Math.random() - 0.5) * 40) });
        redraw();
        G.Sound.play('place');
        UI.sparkles(BOX.x + q.x * SC, BOX.y + q.y * SC, 3, 40);
        firstAct();
      }
      function autoSauce(id) { // タップだけで、ハートの 形に ソースを かける（救済）
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = i / 40 * Math.PI * 2;
          const x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          pts.push([Math.round(250 + x * 5), Math.round(190 + y * 5)]);
        }
        deco.strokes.push({ c: sauceColor(id), pts });
        redraw();
        G.Sound.play('pour');
        firstAct();
      }
      // おさらの 上を さわる：えらんだ トッピングを おく／ソースで 描く
      plate.style.touchAction = 'none';
      let drawing = null, pDown = null;
      sc.on(plate, 'pointerdown', (e) => {
        pDown = e.pointerId;
        try { plate.setPointerCapture(e.pointerId); } catch (_) { /* なし */ }
        const q = toDish(UI.toStage(e.clientX, e.clientY));
        if (sel.kind === 'sauce') { drawing = { c: sauceColor(sel.id), pts: [[Math.round(q.x), Math.round(q.y)]] }; deco.strokes.push(drawing); firstAct(); }
        else if (inPlate(q)) addPiece(sel.id, q);
        e.preventDefault();
      });
      sc.on(plate, 'pointermove', (e) => {
        if (e.pointerId !== pDown || !drawing) return;
        const q = toDish(UI.toStage(e.clientX, e.clientY));
        const last = drawing.pts[drawing.pts.length - 1];
        if (Math.hypot(q.x - last[0], q.y - last[1]) < 6) return;
        if (drawing.pts.length > 300) return;
        drawing.pts.push([Math.round(q.x), Math.round(q.y)]);
        redraw();
      });
      const endDraw = (e) => { if (e.pointerId !== pDown) return; pDown = null; if (drawing && drawing.pts.length === 1) drawing.pts.push([drawing.pts[0][0] + 1, drawing.pts[0][1]]); drawing = null; redraw(); };
      sc.on(plate, 'pointerup', endDraw);
      sc.on(plate, 'pointercancel', endDraw);

      // おさらを えらぶ（右。もっている ものだけ：F-70）
      const plates = G.PLATES.filter(p => S.hasItem(p));
      if (plates.length > 1) {
        const pbtns = plates.map((pl, i) => {
          const b = UI.el('div', 'plate-btn' + (pl.id === deco.plate ? ' sel' : ''), G.Art.plateSwatch(pl.id));
          UI.pos(b, 1180, 200 + i * 100, 150, 86);
          root.appendChild(b);
          UI.tap(b, () => {
            deco.plate = pl.id; S.setPlate(pl.id); redraw();
            pbtns.forEach(x => x.classList.toggle('sel', x === b));
          }, { sound: 'place', say: pl.label });
          return b;
        });
      }

      // ふきん（ぜんぶ やりなおし）
      const cloth = UI.el('div', 'deco-tool cloth', G.Art.svg('0 0 100 100', `<path d="M16 30 Q50 14 84 30 L78 78 Q50 90 22 78Z" fill="#9ccdf0" stroke="#3b3236" stroke-width="4" stroke-linejoin="round"/><path d="M26 44 h48M28 60 h44" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`));
      UI.pos(cloth, startX + tools.length * 130 + 20, 850, 116, 116);
      root.appendChild(cloth);
      UI.tap(cloth, () => {
        if (!deco.pieces.length && !deco.strokes.length) return;
        deco.pieces = []; deco.strokes = [];
        plate.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0)' }], { duration: 400 });
        redraw();
        say(L.decoClear);
      }, { sound: 'swish', say: 'ふきん' });

      let acted = false;
      function firstAct() { if (acted) return; acted = true; if (hintH) hintH.remove(); }
      await say(L.decoIntro);
      let hintH = UI.hand(root, { x: startX + 58, y: 900 }, { x: 750, y: 420 }, { times: 2 });
      if (recipe.sauce) say(L.sauceIntro);
      // できた（✓）は いつでも おせる（何も のせなくても よい：F-73）
      await K.checkButton(sc, root, startX + tools.length * 130 + 160, 843);
      btns.forEach(b => b.classList.add('used'));
      cloth.classList.add('used');
      chara.hop(40);
      UI.sparkles(750, 430, 16, 300);
      G.Sound.play('fanfare');
      await say(L.decoDone, 'face_happy');
      // しゃしんを とって レシピちょうに のこす（F-74）
      const flash = UI.el('div', 'photo-flash');
      document.querySelector('#fx').appendChild(flash);
      G.Sound.play('shutter');
      setTimeout(() => flash.remove(), 600);
      S.addPhoto({ t: Date.now(), r: recipe.id, data, deco });
      await say(L.photoSaved, 'face_happy');
      return deco;
    }

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  }
};

/* ================= いただきます（5.8） ================= */
G.Screens.eat = {
  bg: 'bg_kitchen', hud: true, bgm: 'room',
  enter(scr, sc, params) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines, N = G.CHARACTERS.nyu.lines;
    const pick = (a) => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
    const recipe = G.recipe(params.recipe);
    const deco = params.deco || { pieces: [], strokes: [] };
    const wasFull = S.isFull();
    const isRequest = S.request() === recipe.id;

    /* ニューちゃん（まんなか・テーブルの うしろ）と ニャーちゃん（ひだり） */
    const nyu = new G.NyuSprite(scr, { x: 760, y: 700, h: 470 * G.CHARACTERS.nyu.scale });
    nyu.el.classList.add('at-table');
    const table = UI.el('div', 'table-front', G.Art.all.table_front());
    UI.pos(table, 330, 600, 900, 424);
    scr.appendChild(table);
    const chara = new G.Chara(scr, { x: 190, y: 860, h: 420 });
    chara.setMood('face_happy');
    chara.setPose('face_happy', 0);
    const bubble = new UI.Bubble(scr);
    const nb = new UI.Bubble(scr);
    const say = (t, face, ms = 2400) => { const p = chara.bubbleSpot(0.3); bubble.place(p.x, p.y, 'right'); if (face) chara.flash(face, ms); return sc.guard(bubble.say(t)); };
    const sayNyu = (t, face, ms = 2400) => { const p = nyu.point(0.5, 0.04); nb.place(p.x, p.y, 'top'); if (face) nyu.flash(face, ms); return sc.guard(nb.say(t, { who: 'nyu' })); };
    UI.tap(nyu.el, () => { nyu.flash('dreamy', 1500); nyu.hop(); if (S.pet()) { const h = nyu.point(0.5, 0.2); UI.giveHearts(1, h.x, h.y); } }, { sound: 'soft' });

    /* お料理（はじめは ニャーちゃんの そば → テーブルに はこぶ：F-80） */
    const dish = UI.el('div', 'eat-dish', G.Dish.svgOf(recipe.id, params.data || {}, deco));
    UI.pos(dish, 260, 430, 340, 245);
    scr.appendChild(dish);
    const TARGET = { x: 760, y: 700 };

    (async () => {
      await sc.wait(500);
      await say(L.carry);
      const hint = UI.hand(scr, { x: 430, y: 560 }, TARGET, { times: 3 });
      await new Promise(res => G.StepKit.dragOrTap(sc, dish, {
        target: () => ({ x: 480, y: 520, w: 560, h: 400 }),
        onPlace: () => { hint.remove(); dish.classList.add('used'); res(); }
      }));
      dish.getAnimations().forEach(a => a.cancel());
      dish.style.transition = 'left .5s ease-in-out, top .5s ease-in-out, width .5s, height .5s, transform .5s';
      dish.style.transform = '';
      UI.pos(dish, 760 - 230, 400, 460, 331); // おさらの まんなかが テーブルの うえ（y 630 くらい）に くる
      G.Sound.play('place');
      await sc.wait(600);
      await sayNyu(N.peek, 'happy');

      if (wasFull) {
        /* おなか いっぱい：おみやげに もって かえる（F-85。むりに たべさせない） */
        await sayNyu(N.later, 'dreamy');
        dish.style.transition = 'transform .6s, opacity .6s';
        dish.style.transform = 'translateY(-40px) scale(.4)';
        dish.style.opacity = '0';
        const h = nyu.point(0.5, 0.3);
        UI.giveHearts(1, h.x, h.y);
      } else {
        /* ときどき ニャーちゃんも いっしょに たべる（F-88・F-89）。1日の さいしょの 1品・おさかな・ケーキの ときは 出やすい */
        const likely = S.tummy() < 0.1 || ['grillfish', 'sushi', 'cake', 'xmascake'].indexOf(recipe.id) >= 0;
        const together = params.together != null ? params.together : Math.random() < (likely ? 0.6 : 0.3);
        let dish2 = null;
        if (together) {
          await say(L.together, 'face_happy');
          await sayNyu(N.togetherYay, 'happy');
          await sc.guard(chara.moveTo(1060, 700, 1100));
          dish2 = UI.el('div', 'eat-dish', G.Dish.svgOf(recipe.id, params.data || {}, deco));
          UI.pos(dish2, 1060 - 150, 476, 300, 216);
          scr.appendChild(dish2);
          dish2.animate([{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'none' }], { duration: 400 });
          G.Sound.play('place');
          await sc.wait(500);
        } else await say(L.serve, 'face_happy');
        await sayNyu(N.itadaki, 'happy');
        /* もぐもぐ：3かいで たべおわる */
        const parts = [dish, dish2].filter(Boolean).flatMap(dd => ['.dish-food', '.dish-deco', '.dish-sauce'].map(q => dd.querySelector(q))).filter(Boolean);
        parts.forEach(g => { g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center bottom'; g.style.transition = 'transform .4s, opacity .4s'; });
        for (let i = 1; i <= 3; i++) {
          nyu.flash('happy', 700);
          nyu.hop();
          if (together) { chara.flash('face_happy', 700); chara.hop(20); }
          G.Sound.play('munch');
          const p = nyu.point(0.5, 0.35);
          UI.word('もぐもぐ', p.x + 150, p.y, '#c95f7f', 40);
          const s = 1 - i / 3;
          parts.forEach(g => { g.style.transform = `scale(${Math.max(0.001, s)})`; g.style.opacity = String(s > 0 ? 1 : 0); });
          if (i === 2) sayNyu(pick(N.munch));
          await sc.wait(900);
        }
        if (together) {
          await say(L.togetherYum, 'face_happy');
          await sayNyu(N.togetherYum, 'happy');
          S.noteTogether();
          const hc = chara.point(0.5, 0.2);
          UI.giveHearts(1, hc.x, hc.y); // なかよし ハート（F-89）
        }
        S.eat();
        /* よろこぶ（お料理ごと・デコレーションごとの ひとこと：F-82） */
        nyu.flash('dreamy', 2600);
        const h = nyu.point(0.5, 0.2);
        UI.hearts(h.x, h.y, 6);
        UI.sparkles(h.x, h.y, 10, 200);
        const fav = ['pancake', 'grillfish', 'sushi'].indexOf(recipe.id) >= 0; // ニューちゃんの だいこうぶつ（ホットケーキ・おさかな）
        const comment = fav ? N.favorite : deco.strokes.length ? N.decoDraw : deco.pieces.length >= 10 ? N.decoMany : pick(N.yum);
        await sayNyu(comment, 'dreamy');
        if (isRequest) await sayNyu(N.remember, 'happy');
        await sayNyu(N.gochiso, 'happy');
        UI.giveHearts(2 + (isRequest ? 1 : 0), h.x, h.y); // 1品 2こ、リクエストどおりなら +1（F-84・F-32）
      }
      S.markCooked(recipe.id);
      S.nextRequest();
      await sc.wait(1500);
      const back = UI.el('div', 'btn-big btn-back-kitchen', '<span>キッチンに もどる</span>');
      scr.appendChild(back);
      UI.tap(back, () => G.go('home', { from: 'eat' }), { say: 'キッチンに もどる' });
    })();
  }
};
