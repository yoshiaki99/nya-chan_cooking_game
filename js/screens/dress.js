/* おしゃれ（エプロン・ぼうし：要件定義書 5.11）・レシピちょう（5.12） */
window.G = window.G || {};
G.Screens = G.Screens || {};

/* ✕（やめる）・✓（はい）で たしかめる（N-08）。art = まんなかに 出す 絵 */
G.confirmBox = function (sc, art, speak) {
  const UI = G.UI;
  const wrap = UI.el('div', 'confirm-wrap');
  wrap.innerHTML = `<div class="confirm"><div class="cf-q">${art}</div>
    <div class="cf-btns"><div class="cf-no">${G.Art.svg('0 0 100 100', '<path d="M28 28 L72 72 M72 28 L28 72" stroke="#fff" stroke-width="14" stroke-linecap="round"/>')}</div>
    <div class="cf-yes">${G.Art.svg('0 0 100 100', '<path d="M24 52 l18 18 l36 -40" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>')}</div></div></div>`;
  document.querySelector('#overlay').appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  if (speak) G.Voice.speak(speak, 'chara');
  sc.add(() => wrap.remove());
  return new Promise(res => {
    const close = (v) => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 250); res(v); };
    UI.tap(wrap.querySelector('.cf-no'), () => close(false), { say: 'やめる' });
    UI.tap(wrap.querySelector('.cf-yes'), () => close(true), { say: 'はい' });
  });
};

/* ================= おしゃれ（エプロン・ぼうし） ================= */
G.Screens.dress = {
  bg: 'bg_kitchen', hud: true, bgm: 'room',
  tab: 'body',
  enter(scr, sc) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines;
    UI.backButton(scr, () => G.go('home'));
    scr.appendChild(UI.el('div', 'recipe-shade'));
    const chara = new G.Chara(scr, { x: 360, y: 930, h: 660 });
    chara.setMood('face_happy');
    chara.setPose('face_happy', 0);
    const bubble = new UI.Bubble(scr);
    bubble.el.classList.add('narrow');
    const say = (t, face) => { const p = chara.point(0.5, 0.1); bubble.place(p.x, p.y, 'top'); if (face) chara.flash(face, 2200); return bubble.say(t); };
    G.petting(chara, sc);

    const panel = UI.el('div', 'apron-panel');
    UI.pos(panel, 0, 0, 1366, 1024);
    scr.appendChild(panel);
    const PER = 5;
    let page = 0;
    const tabs = [{ id: 'body', label: 'エプロン', icon: 'apron' }, { id: 'head', label: 'ぼうし', icon: 'chefhat' }];

    const show = () => {
      panel.innerHTML = '';
      // タブ
      tabs.forEach((t, i) => {
        const b = UI.el('div', 'dress-tab' + (this.tab === t.id ? ' sel' : ''));
        b.appendChild(G.Accessory.swatch(t.icon, null, 'dt-art'));
        b.appendChild(UI.el('div', 'dt-label', t.label));
        UI.pos(b, 690 + i * 300, 40, 280, 120);
        panel.appendChild(b);
        UI.tap(b, () => { this.tab = t.id; page = 0; show(); }, { say: t.label, sound: 'swish' });
      });
      const list = this.tab === 'body' ? G.CLOTHES : [{ id: null, label: 'なし', unlock: 0 }].concat(G.ACCESSORIES);
      const pages = Math.ceil(list.length / PER);
      const items = list.slice(page * PER, page * PER + PER);
      const cur = this.tab === 'body' ? S.wear().body : S.wear().head;
      items.forEach((it, i) => {
        const has = it.id === null || S.hasItem(it);
        const c = UI.el('div', 'swatch' + (has ? '' : ' locked') + (it.id === cur ? ' sel' : ''));
        if (it.id) c.appendChild(G.Accessory.swatch(it.id, null, 'sw-art'));
        else c.appendChild(UI.el('div', 'sw-art sw-none', '✕'));
        if (!has) c.appendChild(UI.el('div', 'sw-lock', it.season ? `<span class="sl-num">${it.season.when}</span>` : `<span class="sl-heart">${G.Art.heart()}</span><span class="sl-num">${it.unlock}</span>`));
        const row = i < 3 ? 0 : 1, col = row ? i - 3 : i;
        UI.pos(c, 720 + col * 200 + (row ? 100 : 0), 220 + row * 230, 170, 170);
        panel.appendChild(c);
        UI.tap(c, () => {
          if (!has) { say(it.season ? it.season.when + 'に とどく ニャー！' : G.CHARACTER.lines.lockDress); return; }
          S.setWear(this.tab, it.id);
          chara.redraw();
          chara.hop(30);
          const r = chara.rect();
          UI.sparkles(r.x + r.w / 2, r.y + r.h * 0.5, 14, 240);
          G.Sound.play('sparkle');
          say(L.dressDone, 'face_happy');
          show();
        }, { say: it.label, sound: has ? 'press' : 'lock' });
      });
      if (pages > 1) {
        [[-1, 640], [1, 1270]].forEach(([dir, x]) => {
          const b = UI.el('div', 'page-btn', dir > 0 ? '▶' : '◀');
          UI.pos(b, x, 360, 80, 100);
          panel.appendChild(b);
          UI.tap(b, () => { page = (page + dir + pages) % pages; show(); }, { sound: 'swish', say: dir > 0 ? 'つぎの ページ' : 'まえの ページ' });
        });
      }
      // エプロンの 色（F-A1。色が えらべる ものだけ）
      const body = G.CLOTHES.find(x => x.id === S.wear().body);
      if (this.tab === 'body' && body && body.colors) {
        body.colors.forEach((col, i) => {
          const d = UI.el('div', 'color-dot' + (S.clothColorIndex(body.id) === i ? ' sel' : ''));
          d.style.background = col;
          UI.pos(d, 860 + i * 120, 720, 96, 96);
          panel.appendChild(d);
          UI.tap(d, () => { S.setClothColor(body.id, i); chara.redraw(); G.Sound.play('sparkle'); show(); }, { say: 'いろ' });
        });
      }
    };
    show();
    sc.timeout(() => say(L.dressIntro), 400);
  }
};

/* ================= レシピちょう ================= */
G.Screens.book = {
  bg: 'bg_kitchen', hud: true, bgm: 'room',
  page: 0,
  enter(scr, sc) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines;
    UI.backButton(scr, () => G.go('home'));
    scr.appendChild(UI.el('div', 'recipe-shade'));
    const box = UI.el('div', 'recipe-box');
    UI.pos(box, 0, 0, 1366, 1024);
    scr.appendChild(box);
    const bubble = new UI.Bubble(scr);
    const say = (t) => { bubble.place(683, 150, 'top'); return bubble.say(t); };
    const PER = 5, pages = Math.ceil(G.RECIPES.length / PER);
    const photos = S.photos();
    const latest = (rid) => photos.filter(p => p.r === rid).sort((a, b) => b.t - a.t)[0];
    const show = (pg) => {
      this.page = pg;
      box.innerHTML = '';
      const list = G.RECIPES.slice(pg * PER, pg * PER + PER);
      list.forEach((r, i) => {
        const n = S.cookedCount(r.id), ph = latest(r.id);
        const card = UI.el('div', 'recipe-card book-card' + (n ? '' : ' locked'));
        card.innerHTML = `<div class="rc-art">${ph ? G.Dish.svgOf(ph.r, ph.data, ph.deco) : G.Art.dish(r.id)}</div>
          <div class="rc-name">${n ? r.label : '？'}</div><div class="rc-level">${stamps(n, 5)}</div>`;
        const row = i < 3 ? 0 : 1, cnt = row ? list.length - 3 : Math.min(3, list.length), col = row ? i - 3 : i;
        UI.pos(card, 683 - (cnt * 300 + (cnt - 1) * 40) / 2 + col * 340, 150 + row * 340, 300, 310);
        box.appendChild(card);
        UI.tap(card, () => { if (!n) { say(L.bookNotYet); return; } G.go('bookpage', { recipe: r.id }); }, { sound: n ? 'press' : 'lock', say: n ? r.label : null });
      });
      [[-1, 60], [1, 1206]].forEach(([dir, x]) => {
        const b = UI.el('div', 'page-btn', dir > 0 ? '▶' : '◀');
        UI.pos(b, x, 420, 100, 100);
        box.appendChild(b);
        UI.tap(b, () => show((pg + dir + pages) % pages), { say: dir > 0 ? 'つぎの ページ' : 'まえの ページ', sound: 'swish' });
      });
      const dots = UI.el('div', 'page-dots', Array.from({ length: pages }, (_, i) => `<i class="${i === pg ? 'on' : ''}"></i>`).join(''));
      UI.pos(dots, 583, 850, 200, 40);
      box.appendChild(dots);
    };
    show(this.page || 0);
    sc.timeout(() => say(L.bookIntro), 400);
  }
};

/* 作った 回数の スタンプ（フライパン。5回・10回で きんいろ：F-B4。数字は 出さない） */
function stamps(n, max) {
  const gold = n >= 10 ? 2 : n >= 5 ? 1 : 0;
  return Array.from({ length: Math.min(n, max) }, (_, i) => `<span class="rc-pan${i < gold ? ' gold' : ''}">${G.Art.all.icon_cook()}</span>`).join('');
}

/* ================= レシピちょうの ページ（1つの レシピ） ================= */
G.Screens.bookpage = {
  bg: 'bg_kitchen', hud: true, bgm: 'room',
  enter(scr, sc, params) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines;
    const r = G.recipe(params.recipe);
    UI.backButton(scr, () => G.go('book'));
    scr.appendChild(UI.el('div', 'recipe-shade'));
    const root = UI.el('div', 'recipe-box');
    UI.pos(root, 0, 0, 1366, 1024);
    scr.appendChild(root);
    let sel = 0;
    const draw = () => {
      root.innerHTML = '';
      const list = S.photos().filter(p => p.r === r.id).sort((a, b) => b.t - a.t).slice(0, 5);
      const page = UI.el('div', 'book-page');
      UI.pos(page, 150, 40, 1080, 900);
      root.appendChild(page);
      const title = UI.el('div', 'bk-title', r.label);
      UI.pos(title, 190, 70, 600, 80);
      root.appendChild(title);
      UI.tap(title, () => G.Voice.speak(r.label, 'guide'), { sound: 'soft' });
      // しゃしん（大きく）
      const ph = list[Math.min(sel, list.length - 1)];
      const big = UI.el('div', 'bk-photo', ph ? G.Dish.svgOf(ph.r, ph.data, ph.deco) : `<div class="bk-nophoto">${G.Art.dish(r.id)}</div>`);
      UI.pos(big, 190, 160, 560, 403);
      root.appendChild(big);
      // ちいさい しゃしん
      list.forEach((p, i) => {
        const t = UI.el('div', 'bk-thumb' + (i === Math.min(sel, list.length - 1) ? ' sel' : ''), G.Dish.svgOf(p.r, p.data, p.deco));
        UI.pos(t, 190 + i * 112, 600, 100, 72);
        root.appendChild(t);
        UI.tap(t, () => { sel = i; draw(); }, { sound: 'tap' });
      });
      // けす（ゴミばこ。たしかめてから：F-B2）
      if (ph) {
        const del = UI.el('div', 'bk-trash', G.Art.svg('0 0 100 100', `<path d="M24 32 h52 l-6 56 h-40z" fill="#d9ecf3" stroke="#3b3236" stroke-width="5" stroke-linejoin="round"/><path d="M18 28 h64 M40 20 h20" stroke="#3b3236" stroke-width="6" stroke-linecap="round"/><path d="M40 44 v34 M60 44 v34" stroke="#3b3236" stroke-width="4" stroke-linecap="round"/>`));
        UI.pos(del, 650, 590, 100, 100);
        root.appendChild(del);
        UI.tap(del, async () => {
          if (await G.confirmBox(sc, G.Dish.svgOf(ph.r, ph.data, ph.deco), L.photoDelete)) { S.removePhoto(ph.t); sel = 0; draw(); }
        }, { sound: 'press', say: 'けす' });
      }
      // ざいりょう・つくりかた（F-B3）
      const side = UI.el('div', 'bk-side');
      UI.pos(side, 790, 160, 410, 720);
      side.innerHTML = `<div class="bk-h">ざいりょう</div>
        <div class="bk-ings">${r.items.map(id => `<div class="bk-ing"><div class="bk-ing-art">${G.Art.ing(id)}</div><div>${G.ingredient(id).label}</div></div>`).join('')}</div>
        <div class="bk-h">つくりかた</div>
        <ol class="bk-steps">${r.steps.map(st => `<li>${G.STEPS[st.t].label.replace(/（.*）/, '')}</li>`).join('')}<li>もりつけ</li></ol>
        <div class="bk-h">つくった かず</div><div class="bk-stamps">${stamps(S.cookedCount(r.id), 10)}</div>`;
      root.appendChild(side);
      side.querySelectorAll('.bk-ing').forEach((e, i) => UI.tap(e, () => G.Voice.speak(G.ingredient(r.items[i]).label, 'guide'), { sound: 'soft' }));
      // もう一度 つくる
      if (r.ready && S.hasRecipe(r)) {
        const again = UI.el('div', 'btn-big bk-cook', '<span>つくる</span>');
        UI.pos(again, 280, 740, 380, 120);
        root.appendChild(again);
        UI.tap(again, () => G.go('cook', { recipe: r.id }), { say: r.label + 'を つくる' });
      }
    };
    draw();
  }
};
