/* タイトル・キッチン（ホーム）・おしまい・シールちょう */
window.G = window.G || {};
G.Screens = G.Screens || {};

const NYA_X = 400, NYU_X = 1050; // キッチンで ニャーちゃん・ニューちゃんが 立つ ところ

/* ================= タイトル（5.1） ================= */
G.Screens.title = {
  bg: 'bg_kitchen', hud: false, bgm: 'room',
  enter(scr, sc) {
    const UI = G.UI, L = G.CHARACTER.lines;
    G.gearButton(scr, sc);
    const logo = UI.el('div', 'title-logo', `<div class="tl-bow">${G.Art.all.icon_cook()}</div><div class="tl-name">${G.CHARACTER.name}</div><div class="tl-sub">おりょうりゲーム</div>`);
    scr.appendChild(logo);
    UI.tap(logo, () => G.Voice.speak(G.CHARACTER.title, 'guide'), { sound: 'soft' });

    const chara = new G.Chara(scr, { x: 560, y: 778, h: 420 });
    chara.setMood('title');
    chara.setPose('title', 0);
    const nyu = new G.NyuSprite(scr, { x: 850, y: 778, h: 420 * G.CHARACTERS.nyu.scale });
    nyu.setPose('happy');
    const bubble = new UI.Bubble(scr);
    G.petting(chara, sc);

    const start = UI.el('div', 'btn-big btn-start', '<span>はじめる</span>');
    scr.appendChild(start);
    UI.tap(start, () => {
      if (G.State.overLimit()) {
        const p = chara.bubbleSpot(0.3);
        bubble.place(p.x, p.y, p.side);
        chara.flash('face_sleepy', 3500);
        bubble.say(L.limit);
        return;
      }
      G.Voice.speak('はじめる', 'guide');
      G.go('home', { from: 'title' });
    });

    sc.interval(() => {
      const r = chara.rect();
      UI.sparkles(r.x + Math.random() * r.w, r.y + Math.random() * r.h * 0.7, 1, 30);
    }, 1500);
    sc.interval(() => { chara.sway(1); nyu.hop(); }, 7000);
  }
};

/* ================= キッチン（5.2） ================= */
G.Screens.home = {
  bg: 'bg_kitchen', hud: true, bgm: 'room',
  enter(scr, sc, params) {
    const UI = G.UI, S = G.State, L = G.CHARACTER.lines, N = G.CHARACTERS.nyu.lines;
    const pick = (a) => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
    let busy = false;

    G.gearButton(scr, sc);

    /* ニャーちゃん（左・キッチンの まえ） */
    const chara = new G.Chara(scr, { x: NYA_X, y: 778, h: 440 });
    chara.setMood('face_normal');
    chara.setPose('face_normal', 0);
    const bubble = new UI.Bubble(scr);
    const say = async (text, face, ms = 2600) => {
      const p = chara.bubbleSpot(0.34);
      bubble.place(p.x, p.y, 'right');
      if (face) chara.flash(face, ms);
      await bubble.say(text);
    };
    G.petting(chara, sc, { enabled: () => !G.isRewarding() });

    /* ニューちゃん（右・テーブルで まっている）。テーブルを まえに 重ねて すわっているように 見せる */
    const nyuH = 400 * G.CHARACTERS.nyu.scale;
    const nyu = new G.NyuSprite(scr, { x: NYU_X, y: 720, h: nyuH });
    nyu.el.classList.add('at-table');
    const table = G.Assets.node('kitchen_table', 'kitchen-table');
    UI.pos(table, 840, 590, 420, 190);
    scr.appendChild(table);
    const nyuBubble = new UI.Bubble(scr);
    const sayNyu = (text, face, ms = 2400) => {
      const p = nyu.point(0.5, 0.06);
      nyuBubble.place(p.x, p.y, 'top');
      if (face) nyu.flash(face, ms);
      return nyuBubble.say(text, { who: 'nyu' });
    };
    UI.tap(nyu.el, () => {
      if (G.isRewarding()) return;
      nyu.flash('dreamy', 1800);
      nyu.hop();
      G.Sound.play('meow');
      const h = nyu.point(0.5, 0.2);
      UI.hearts(h.x, h.y, 3);
      if (S.pet()) UI.giveHearts(1, h.x, h.y); // なでて もらえる ハートは ニャーちゃんと あわせて 1日5こまで（F-22）
      if (!busy) sayNyu(pick(N.pet));
    }, { sound: 'soft' });

    /* ニューちゃんの おなか（テーブルの うえの おさら 3まい：F-25） */
    const tummyBox = UI.el('div', 'tummy');
    UI.pos(tummyBox, NYU_X - 150, 556, 300, 56); // テーブルの うえに おさらを ならべる
    scr.appendChild(tummyBox);
    const drawTummy = () => {
      const n = S.tummyPlates();
      let h = '';
      for (let i = 0; i < G.TUMMY_FULL; i++) h += `<div class="tm-plate">${(i < n ? G.Art.all.plate_full : G.Art.all.plate)()}</div>`;
      tummyBox.innerHTML = h;
    };
    drawTummy();

    /* リクエストの ふきだし（F-30） */
    const req = UI.el('div', 'request');
    UI.pos(req, NYU_X + 110, 250, 170, 150);
    scr.appendChild(req);
    const showRequest = () => {
      const r = G.recipe(S.request() || S.nextRequest());
      req.innerHTML = `<div class="rq-dish">${G.Art.dish(r.id)}</div>`;
      req.classList.add('show');
      return r;
    };
    // ふきだしを タッチすると、その おりょうりに すぐ すすむ（F-33）
    UI.tap(req, () => {
      const r = G.recipe(S.request());
      if (!r || busy || G.isRewarding()) return;
      if (!r.ready) { sayNyu(r.label + '！ ' + N.request, 'happy'); return; }
      G.Voice.speak(r.label + 'を つくる ニャー！', 'chara');
      G.go('cook', { recipe: r.id });
    }, { sound: 'soft' });

    /* 下の ボタン（F-21）：つくる・おしゃれ・レシピちょう・（おうちに かえる）・またね */
    const comingSoon = () => { if (!busy) say(L.comingSoon, 'face_prim'); };
    const buttons = [
      { id: 'cook', label: 'つくる', icon: 'icon_cook', fn: () => G.go('recipes') },
      { id: 'dress', label: 'おしゃれ', icon: 'icon_apron', fn: () => G.go('dress') },
      { id: 'recipes', label: 'レシピ', icon: 'icon_recipe', fn: () => G.go('book') }
    ];
    if (G.Link.canGoHome()) buttons.push({ id: 'home', label: 'おうち', icon: 'icon_door', fn: goHome });
    buttons.forEach((b, i) => {
      const el = UI.el('div', 'btn-care care-' + b.id);
      UI.pos(el, 84 + i * 176, 838);
      el.appendChild(G.Assets.node(b.icon, 'bc-icon'));
      el.appendChild(UI.el('div', 'bc-label', b.label));
      scr.appendChild(el);
      UI.tap(el, () => { if (!G.isRewarding()) b.fn(); }, { say: b.label });
    });
    /* おせわゲームに かえる。ハートを 持ちかえる（5.14 F-D1〜F-D5） */
    async function goHome() {
      if (busy) return;
      busy = true;
      if (!(await G.Link.osewaReachable())) { await say(L.offlineHome, 'face_prim'); busy = false; return; }
      const n = S.unsentHearts();
      chara.hop(36);
      const talk = say(n ? L.goHomeHearts : L.goHomeNone, 'face_happy');
      sayNyu(N.byeHome, 'happy');
      const sent = G.Link.sendHome();
      const door = scr.querySelector('.care-home');
      if (sent && door) {
        const d = UI.rectOf(door), p = chara.point(0.5, 0.3);
        for (let i = 0; i < Math.min(sent, 10); i++) sc.timeout(() => {
          const h = UI.el('div', 'fx fx-heart', G.Art.heart());
          UI.pos(h, p.x - 28, p.y - 28, 56, 56);
          document.querySelector('#fx').appendChild(h);
          h.animate([{ transform: 'translate(0,0) scale(.5)' }, { transform: `translate(${(d.cx - p.x) / 2}px, ${-160}px) scale(1.2)`, offset: 0.5 }, { transform: `translate(${d.cx - p.x}px, ${d.cy - p.y}px) scale(.4)` }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => h.remove();
          G.Sound.play('heart');
        }, i * 160);
      }
      await talk;
      G.Sound.play('door');
      await sc.wait(600);
      G.Link.goOsewa();
    }

    const bye = UI.el('div', 'btn-care btn-bye');
    UI.pos(bye, 1180, 838);
    bye.appendChild(G.Assets.node('icon_bye', 'bc-icon'));
    bye.appendChild(UI.el('div', 'bc-label', 'またね'));
    scr.appendChild(bye);
    UI.tap(bye, () => G.go('end', { reason: 'bye' }), { say: 'またね' });

    /* なにもしていないときの動き（F-23・F-24） */
    const idles = [
      async () => { await chara.sway(2); },
      async () => { chara.flash('face_happy', 1600); await chara.hop(30); },
      async () => { chara.flash('face_dreamy', 2300); await chara.tilt(-7, 2100); },
      async () => { nyu.hop(); await sc.wait(500); nyu.hop(); },
      async () => { nyu.face(-1); await sc.wait(1600); nyu.face(1); }
    ];
    let idleAt = Date.now() + 6000, hintAt = Date.now() + 20000;
    sc.interval(async () => {
      if (busy || G.isRewarding()) return;
      const now = Date.now();
      if (now > hintAt) {
        hintAt = now + 25000 + Math.random() * 8000; idleAt = now + 7000; busy = true;
        if (S.isFull()) await say(pick(L.content), 'face_happy');
        else await sayNyu(pick(N.hungry), 'happy');
        busy = false; return;
      }
      if (now > idleAt) {
        idleAt = now + 7000 + Math.random() * 5000;
        await idles[Math.floor(Math.random() * idles.length)]();
      }
    }, 500);
    sc.on(scr, 'pointerdown', () => { idleAt = Date.now() + 6000; hintAt = Math.max(hintAt, Date.now() + 12000); });

    /* 時間がたったら（main.js から1秒ごと） */
    this.onTick = () => {
      drawTummy();
      if (S.overLimit() && !busy) { busy = true; G.go('end', { reason: 'limit' }); }
    };

    /* はいったとき：ごあいさつ・ごほうび・リクエスト */
    (async () => {
      busy = true;
      if (S.overLimit()) { await sc.wait(600); G.go('end', { reason: 'limit' }); return; }
      await sc.wait(700);
      if (params.from === 'osewa') { // おせわゲームから きた（F-D0）
        chara.hop(36);
        await sc.guard(say(L.fromOsewa, 'face_happy', 3000));
        await sc.guard(sayNyu(N.welcome, 'happy'));
      } else if (params.from === 'title') {
        if (S.isNewDay()) {
          S.markDay();
          chara.hop(40);
          await sc.guard(say(L.greetDaily, 'face_happy', 3800));
          const p = chara.point(0.5, 0.3);
          UI.word(L.dailyHeart, p.x, p.y - 40, '#e7799a', 44);
          G.Voice.speak(L.dailyHeart, 'guide');
          UI.giveHearts(1, p.x, p.y);
          await sc.wait(1600);
        } else {
          await sc.guard(say(pick(L.greetAgain), 'face_happy', 3000));
        }
      }
      await sc.guard(G.checkRewards());
      await sc.wait(300);
      if (!S.isFull()) {
        showRequest();
        await sc.guard(sayNyu(N.request, 'happy'));
        await sc.guard(say(L.acceptRequest, 'face_happy'));
      } else {
        await sc.guard(sayNyu(N.full, 'dreamy'));
      }
      busy = false;
      hintAt = Date.now() + 20000;
    })();
    sc.interval(() => { if (!busy) G.checkRewards(); }, 1500);
  },
  leave() { this.onTick = null; }
};

/* ================= おしまい ================= */
G.Screens.end = {
  bg: 'bg_kitchen', hud: false, bgm: 'room',
  enter(scr, sc, params) {
    const UI = G.UI, L = G.CHARACTER.lines;
    const reason = params.reason || 'bye';
    G.State.saveNow();
    const title = UI.el('div', 'end-title', 'またね！');
    scr.appendChild(title);

    const chara = new G.Chara(scr, { x: 560, y: 790, h: 480 });
    chara.setMood('act_wave');
    chara.setPose('act_wave', 0);
    const nyu = new G.NyuSprite(scr, { x: 870, y: 790, h: 480 * G.CHARACTERS.nyu.scale });
    nyu.setPose('wave');
    const bubble = new UI.Bubble(scr);
    const nyuBubble = new UI.Bubble(scr);
    const again = UI.el('div', 'btn-big btn-again', '<span>はじめに もどる</span>');
    scr.appendChild(again);
    again.style.opacity = '0';
    again.style.pointerEvents = 'none';

    (async () => {
      await sc.wait(500);
      const r = chara.rect();
      bubble.place(r.x + r.w * 0.2, r.y + r.h * 0.3, 'left');
      chara.wiggle();
      G.Sound.play('meow');
      await sc.guard(bubble.say(reason === 'limit' ? L.limit : L.bye, { keep: true }));
      if (reason !== 'limit') {
        const p = nyu.point(0.5, 0.06);
        nyuBubble.place(p.x, p.y, 'top');
        nyu.hop();
        await sc.guard(nyuBubble.say(G.CHARACTERS.nyu.lines.bye, { who: 'nyu', keep: true }));
      }
      const h = chara.point(0.5, 0.3);
      UI.hearts(h.x, h.y, 5);
      await sc.wait(1200);
      G.Sound.stopBgm();
      again.style.transition = 'opacity .6s';
      again.style.opacity = '1';
      again.style.pointerEvents = '';
    })();
    UI.tap(again, () => G.go('title'), { say: 'はじめに もどる' });
  }
};

/* ================= シールちょう ================= */
G.Screens.stickers = {
  bg: 'bg_kitchen', hud: true,
  enter(scr, sc) {
    const UI = G.UI, S = G.State;
    UI.backButton(scr, () => G.go('home'));
    const book = UI.el('div', 'book');
    UI.pos(book, 170, 150, 1030, 690);
    scr.appendChild(book);
    const have = S.stickerCount();
    G.STICKERS.forEach((s, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const slot = UI.el('div', i < have ? 'sticker' : 'slot', i < have ? `<span>${s.e}</span>` : '?');
      UI.pos(slot, 64 + col * 190, 34 + row * 160, 140, 140);
      if (i < have) {
        slot.style.transform = `rotate(${((i * 37) % 17) - 8}deg)`;
        UI.tap(slot, () => {
          slot.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.25) rotate(-10deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 450 });
          const r = UI.rectOf(slot);
          UI.sparkles(r.cx, r.cy, 6, 90);
          G.Voice.speak(s.label, 'guide');
        }, { sound: 'sparkle' });
      }
      book.appendChild(slot);
    });

    const prog = UI.el('div', 'book-progress');
    if (have >= G.STICKERS.length) {
      prog.innerHTML = '<span class="bp-crown">👑</span><span class="bp-text">ぜんぶ あつめたよ！</span>';
    } else {
      const left = S.heartsToNextSticker(), got = G.HEARTS_PER_STICKER - left;
      let h = '';
      for (let i = 0; i < G.HEARTS_PER_STICKER; i++) h += `<div class="bp-h">${i < got ? G.Art.heart() : G.Art.heartEmpty('#f37d9b')}</div>`;
      prog.innerHTML = '<div class="bp-label">つぎの シールまで</div>' + h + '<div class="bp-next">?</div>';
    }
    UI.pos(prog, 133, 880, 1100, 100);
    scr.appendChild(prog);
    sc.timeout(() => G.Voice.speak(have >= G.STICKERS.length ? 'ぜんぶ あつめたよ！' : 'シールちょう。 つぎの シールまで ハート あと ' + S.heartsToNextSticker() + 'こ', 'guide'), 400);
  }
};
