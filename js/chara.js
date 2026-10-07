/* ニャーちゃん（表示と動き） */
window.G = window.G || {};

G.Chara = class {
  /* x, y = 足もとのまんなか（ステージ座標）。h = 高さ
     acc = アクセサリーを つける（おふろでは はずす）。accHide = つけない場所（'face' など）
     wearOver = いまだけ ちがう ものを 着る（ねんねの パジャマ など。{ body: 'pajama' }） */
  constructor(parent, { x, y, h, wide = 1.3, acc = true, accHide = null, wearOver = null }) {
    const E = G.UI.el;
    this.x = x; this.y = y; this.h = h; this.w = h * wide;
    this.el = E('div', 'chara');
    G.UI.pos(this.el, x - this.w / 2, y - h, this.w, h);
    this.mover = E('div', 'm-move');
    this.jumper = E('div', 'm-jump');
    this.flipper = E('div', 'm-flip');
    this.actor = E('div', 'm-act');
    this.breather = E('div', 'm-breath');
    // 絵は2まい（入れかえるときに ふわっと かさねる）。1まいごとに、アクセサリーの うしろ（はね）と まえ が つく
    this.groups = [E('div', 'm-pose'), E('div', 'm-pose')];
    this.layers = [E('canvas', 'm-layer'), E('canvas', 'm-layer')];
    this.accB = [E('canvas', 'm-acc'), E('canvas', 'm-acc')];
    this.accF = [E('canvas', 'm-acc'), E('canvas', 'm-acc')];
    this.groups.forEach((g, i) => {
      g.appendChild(this.accB[i]); g.appendChild(this.layers[i]); g.appendChild(this.accF[i]);
      this.breather.appendChild(g);
    });
    this.acc = acc;
    this.accHide = accHide || [];
    this.wearOver = wearOver;
    this.actor.appendChild(this.breather);
    this.flipper.appendChild(this.actor);
    this.jumper.appendChild(this.flipper);
    this.mover.appendChild(E('div', 'm-shadow'));
    this.mover.appendChild(this.jumper);
    this.el.appendChild(this.mover);
    parent.appendChild(this.el);
    this.front = 0;
    this.pose = null;
    this.mood = 'face_normal';
    this.offset = { x: 0, y: 0 };
    this.facing = 1;
    this.tempTimer = null;
    this.preview = null; // メイクを ぬっている とちゅう（G.Makeup.look）
    this.drawnKey = [null, null]; // それぞれの canvas に いま描いてある絵（下ごしらえした絵の名前）
    this.probe = [null, null];    // それぞれの canvas の たしかめ用の1点
    this.shown = null;            // いま まえに 見えている 絵（setPose で たのんだ 名前）
    this.degraded = false;        // リボンの 色を まだ 変えられていない
    this.dead = false;
    this.retryTimer = null; this.retries = 0;
    this.freeTimer = null;
    G.Chara.live.add(this);
  }

  /*
   * 顔・ポーズを かえる。うらの canvas に描いて、ちゃんと描けたときだけ まえに出す。
   * 描けなかったら（絵が まだ ない・メモリが たりない など）いまの絵を 出したまま、すこし あとで もう一度 ためす
   */
  setPose(key, fade = 220) {
    if (this.dead || (key === this.pose && !this._force)) return;
    this._force = false;
    this.pose = key;
    G.CharaArt.pending(key).forEach(p => p.then(ok => {
      if (ok && this.pose === key && this.el.isConnected) this.redraw();
    }));
    if (this.paint(key, fade) && !this.degraded) {
      this.retries = 0;
      clearTimeout(this.retryTimer); this.retryTimer = null;
    } else this.retryLater(); // 描けなかった・リボンの 色が まだ ちがう → すこし あとで もう一度
  }
  retryLater() {
    if (this.retryTimer || this.retries >= 8) return;
    const ms = Math.min(4000, 250 * Math.pow(2, this.retries++));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.dead && this.el.isConnected) this.redraw();
    }, ms);
  }

  paint(key, fade) {
    this.settle(); // いれかえの とちゅうなら おわらせる（下で まだ 見えている 絵に 描きこまないように）
    const bi = 1 - this.front;
    let res = this.drawLayer(bi, key);
    if (res && res.blank) {
      // 用意してあった絵の中身が きえていたか、canvas の メモリが とれなかった。どちらも 作りなおして もう一度
      G.CharaArt.reset();
      this.freeGroup(bi); // width を 0 に して、canvas の メモリも とりなおさせる
      res = this.drawLayer(bi, key);
      // それでも 見えないとき、読みとり そのものが こわれていたら（そのあいだ たしかめは とまる）たしかめずに 描く
      if (res && res.blank && !G.CharaArt.readbackOk()) res = this.drawLayer(bi, key);
    }
    if (!res || res.blank) { this.freeGroup(bi); return false; }
    this.degraded = !res.exact;
    const { src } = res, back = this.layers[bi];
    const sc = (G.CHARACTER.poseScale[key] || 1) * Math.min(this.w / src.width, this.h / src.height);
    back.style.width = (src.width * sc) + 'px';
    back.style.height = (src.height * sc) + 'px';
    const shift = (G.CHARACTER.poseShift[key] || 0) * this.h;
    back.style.transform = `translateX(calc(-50% + ${shift}px))`;
    try { this.paintAcc(bi, key, src, sc, shift); } catch (e) { // アクセサリーが 描けなくても ニャーちゃんは 出す
      this.accB[bi].style.display = this.accF[bi].style.display = 'none';
    }
    this.swap(bi, fade, key);
    return true;
  }

  /* i ばんめの canvas に 絵を描く。{ src } = 描けた / { blank: true } = 描いたのに 見えない / null = 絵が まだ ない */
  drawLayer(i, key) {
    let src = null;
    try { src = G.CharaArt.get(key, G.State.ribbon()); } catch (e) { src = null; }
    if (!src) return null;
    const exact = G.CharaArt.exact();
    const k = G.CharaArt.resolve(key);
    const c = this.layers[i];
    this.drawnKey[i] = null; this.probe[i] = null;
    if (c.width !== src.width || c.height !== src.height) { c.width = src.width; c.height = src.height; }
    const ctx = c.getContext('2d');
    if (!ctx) return { blank: true };
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, src.width, src.height);
    ctx.drawImage(src, 0, 0);
    let mk = null;
    try { mk = G.Makeup.overlay(key, src, G.State.ribbon(), this.look()); } catch (e) { mk = null; }
    if (mk && mk.c.width && mk.c.height) { // メイク：顔のまわりだけ 描きなおした絵に入れかえる
      ctx.clearRect(mk.x, mk.y, mk.c.width, mk.c.height);
      ctx.drawImage(mk.c, mk.x, mk.y);
    }
    if (mk && mk.temp) G.freeCanvas(mk.c); // ぬっている とちゅうの絵は 1回 使うだけ
    if (this.night) { // 夜は うすいラベンダー色を重ねて、部屋の明るさになじませる
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = G.CHARACTER.nightTint;
      ctx.fillRect(0, 0, src.width, src.height);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(src, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    const g = G.CharaArt.geo(k), probe = g && g.probe ? g.probe.slice() : null;
    // ぬっている とちゅう（メイクの プレビュー）は 1こまずつ たしかめない（おもくなるので）。おわったあとの 描きなおしと 見はりで たしかめる
    if (!this.preview && !G.CharaArt.drawnAt(c, probe)) return { blank: true };
    this.drawnKey[i] = k; this.probe[i] = probe;
    return { src, exact };
  }

  /* うらの絵を まえに出す。あたらしい絵が ほぼ 出てから 古い絵を けすので、とちゅうで すけて見えない */
  swap(bi, fade, key) {
    const fi = this.front;
    const gb = this.groups[bi], gf = this.groups[fi];
    const half = Math.round(fade * 0.5);
    gb.style.transition = `opacity ${fade}ms ease`;
    gf.style.transition = `opacity ${half}ms ease ${half}ms`;
    gb.style.opacity = '1';
    gf.style.opacity = '0';
    gb.style.zIndex = '2'; gf.style.zIndex = '1';
    this.front = bi;
    this.shown = key;
    // 見えなくなった 古い絵の canvas は 空にして メモリを かえす
    clearTimeout(this.freeTimer);
    this.freeTimer = setTimeout(() => {
      this.freeTimer = null;
      if (this.front !== fi) this.freeGroup(fi);
    }, fade + 150);
  }
  /* いれかえの とちゅうなら、すぐ おわらせる（まえの 絵を すっかり 出して、古い 絵を けす） */
  settle() {
    if (!this.freeTimer) return;
    clearTimeout(this.freeTimer); this.freeTimer = null;
    const f = this.groups[this.front], o = this.groups[1 - this.front];
    f.style.transition = o.style.transition = 'none';
    f.style.opacity = '1'; o.style.opacity = '0';
    void getComputedStyle(o).opacity; // いま すぐ きりかえる（このあと つける transition に まざらないように）
  }
  freeGroup(i) {
    G.freeCanvas(this.layers[i]); G.freeCanvas(this.accB[i]); G.freeCanvas(this.accF[i]);
    this.drawnKey[i] = null; this.probe[i] = null;
  }
  /* いま 見えている 絵の 名前（メイクの 場所の 計算は こちらを つかう。たのんだ 顔が まだ 描けていないことが あるので） */
  artPose() { return this.shown || this.pose; }

  /* アクセサリー（G.Accessory）。絵のそとに はみだすので、べつの canvas に描いて 絵に ぴったり かさねる */
  paintAcc(i, key, src, sc, shift) {
    const B = this.accB[i], F = this.accF[i];
    const k = G.CharaArt.resolve(key);
    const wear = this.wearOver ? Object.assign({}, G.State.wear(), this.wearOver) : G.State.wear();
    const list = this.acc ? G.Accessory.layout(k, G.CharaArt.geo(k), wear, G.State.ribbon(), this.accHide) : [];
    B.style.display = F.style.display = 'none';
    list.forEach(it => {
      if (!it.r.ok) it.r.p.then(ok => { if (ok && this.pose === key && this.el.isConnected) this.redraw(); });
    });
    [[B, list.filter(it => it.back)], [F, list.filter(it => !it.back)]].forEach(([c, items]) => {
      if (!items.length) { G.freeCanvas(c); return; }
      // アクセサリーの ある ところ だけの はんい（絵の canvas の座標）
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      items.forEach(it => {
        const b = G.Accessory.bounds(it);
        x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
      });
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2;
      const w = x1 - x0, h = y1 - y0;
      if (!(w > 0 && h > 0 && w < 8000 && h < 8000)) return;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(-x0, -y0);
      items.forEach(it => G.Accessory.draw(ctx, it));
      ctx.restore();
      if (this.night) { // 絵と同じ 夜の色
        const t = G.canvas2d(w, h);
        if (t) {
          t.ctx.drawImage(c, 0, 0);
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = G.CHARACTER.nightTint;
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(t.c, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          G.freeCanvas(t.c);
        }
      }
      c.style.display = '';
      c.style.width = (w * sc) + 'px';
      c.style.height = (h * sc) + 'px';
      c.style.bottom = ((src.height - y1) * sc) + 'px';
      c.style.transform = `translateX(calc(-50% + ${shift + ((x0 + x1) / 2 - src.width / 2) * sc}px))`;
    });
  }
  redraw() { this._force = true; this.setPose(this.pose || this.mood, 0); }
  look() { return G.Makeup.look(G.State.makeup(), this.preview); }
  setNight(on) {
    if (this.night === on) return;
    this.night = on;
    this._force = true;
    this.setPose(this.pose || this.mood, 900);
  }
  /* いま見えている絵が きえていないか（'blank' = 描いたのに 見えない / 'undrawn' = まだ 描けていない） */
  lost() {
    if (this.dead || !this.el.isConnected || !this.pose) return false;
    const i = this.front;
    if (!this.drawnKey[i]) return this.retryTimer ? false : 'undrawn';
    return G.CharaArt.drawnAt(this.layers[i], this.probe[i]) ? false : 'blank';
  }

  /* ふだんの顔 */
  setMood(key) {
    this.mood = key;
    if (!this.tempTimer) this.setPose(key);
  }
  /* しばらくだけ別の顔にする */
  flash(key, ms = 1800) {
    if (this.dead) return;
    clearTimeout(this.tempTimer);
    this.setPose(key);
    this.tempTimer = setTimeout(() => { this.tempTimer = null; this.setPose(this.mood); }, ms);
  }
  clearFlash() { clearTimeout(this.tempTimer); this.tempTimer = null; }

  /* 見えている絵の位置（ステージ座標） */
  rect() { return G.UI.rectOf(this.layers[this.front]); }
  point(rx, ry) {
    const r = this.rect();
    const fx = this.facing < 0 ? 1 - rx : rx;
    return { x: r.x + r.w * fx, y: r.y + r.h * ry };
  }
  mouth() { return this.point(G.CHARACTER.mouth.x, G.CHARACTER.mouth.y); }
  /* ステージの点 ⇔ いま見えている絵（canvas）の点 */
  toArt(p) {
    const c = this.layers[this.front], r = G.UI.rectOf(c);
    const x = (p.x - r.x) / r.w * c.width;
    return { x: this.facing < 0 ? c.width - x : x, y: (p.y - r.y) / r.h * c.height };
  }
  fromArt(q) {
    const c = this.layers[this.front], r = G.UI.rectOf(c);
    const x = this.facing < 0 ? c.width - q.x : q.x;
    return { x: r.x + x / c.width * r.w, y: r.y + q.y / c.height * r.h };
  }
  artScale() { const c = this.layers[this.front]; return c.width ? G.UI.rectOf(c).w / c.width : 1; }
  /* ふきだしの しっぽの先。見えている絵の左右のはしの外に出すので、顔や耳にかからない。
     顔のある側に置き、場所がたりなければ反対側に置く */
  bubbleSpot(ry = 0.3, need = 380) {
    const r = this.rect();
    const roomR = 1366 - (r.x + r.w * 0.92), roomL = r.x + r.w * 0.08;
    let side = this.facing < 0 ? 'left' : 'right';
    if (side === 'right' && roomR < need && roomL > roomR) side = 'left';
    if (side === 'left' && roomL < need && roomR > roomL) side = 'right';
    return { x: r.x + r.w * (side === 'right' ? 0.92 : 0.08), y: r.y + r.h * ry, side };
  }
  /* 頭の上に出すとき（ねむっているときなど） */
  topSpot(rx = 0.5, ry = 0.02) { const p = this.point(rx, ry); return { x: p.x, y: p.y, side: 'top' }; }
  head() { return this.point(0.62, 0.12); }

  /* ---- うごき ---- */
  hop(height = 50, dur = 520) {
    G.Sound.play('hop');
    return this.jumper.animate([
      { transform: 'translateY(0) scale(1,1)' },
      { transform: 'translateY(0) scale(1.06,.92)', offset: 0.15 },
      { transform: `translateY(-${height}px) scale(.96,1.05)`, offset: 0.5 },
      { transform: 'translateY(0) scale(1.05,.94)', offset: 0.85 },
      { transform: 'translateY(0) scale(1,1)' }
    ], { duration: dur, easing: 'ease-in-out' }).finished.catch(() => { });
  }
  wiggle() {
    return this.actor.animate([
      { transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' },
      { transform: 'rotate(-3deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(0)' }
    ], { duration: 1100, easing: 'ease-in-out' }).finished.catch(() => { });
  }
  tilt(deg = 6, dur = 1600) {
    return this.actor.animate([
      { transform: 'rotate(0)' }, { transform: `rotate(${deg}deg)`, offset: 0.3 }, { transform: `rotate(${deg}deg)`, offset: 0.7 }, { transform: 'rotate(0)' }
    ], { duration: dur, easing: 'ease-in-out' }).finished.catch(() => { });
  }
  stretch() {
    return this.actor.animate([
      { transform: 'scale(1,1)' }, { transform: 'scale(.96,1.07)', offset: 0.4 }, { transform: 'scale(.96,1.07)', offset: 0.7 }, { transform: 'scale(1,1)' }
    ], { duration: 1800, easing: 'ease-in-out' }).finished.catch(() => { });
  }
  squish() {
    return this.actor.animate([
      { transform: 'scale(1,1)' }, { transform: 'scale(1.06,.93)', offset: 0.3 }, { transform: 'scale(.98,1.03)', offset: 0.65 }, { transform: 'scale(1,1)' }
    ], { duration: 420, easing: 'ease-out' }).finished.catch(() => { });
  }
  sway(times = 2) {
    return this.actor.animate([
      { transform: 'rotate(0)' }, { transform: 'rotate(-5deg)', offset: 0.25 }, { transform: 'rotate(5deg)', offset: 0.75 }, { transform: 'rotate(0)' }
    ], { duration: 1400, iterations: times, easing: 'ease-in-out' }).finished.catch(() => { });
  }
  face(dir) {
    if (dir === this.facing) return;
    this.facing = dir;
    this.flipper.style.transform = dir < 0 ? 'scaleX(-1)' : '';
  }
  /* 足もとを (x, y) へ動かす */
  moveTo(x, y, dur = 900, bouncy = true) {
    const dx = x - this.x, dy = y - this.y;
    const from = `translate(${this.offset.x}px,${this.offset.y}px)`, to = `translate(${dx}px,${dy}px)`;
    this.offset = { x: dx, y: dy };
    const a = this.mover.animate([{ transform: from }, { transform: to }], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
    if (bouncy) {
      const n = Math.max(1, Math.round(dur / 300));
      this.jumper.animate([
        { transform: 'translateY(0)' }, { transform: 'translateY(-26px)', offset: 0.5 }, { transform: 'translateY(0)' }
      ], { duration: dur / n, iterations: n, easing: 'ease-in-out' });
    }
    return a.finished.catch(() => { });
  }
  feet() { return { x: this.x + this.offset.x, y: this.y + this.offset.y }; }

  /* もう使わない。canvas の メモリも すぐ かえす */
  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.clearFlash();
    clearTimeout(this.retryTimer); clearTimeout(this.freeTimer);
    this.el.remove();
    this.freeGroup(0); this.freeGroup(1);
    G.Chara.live.delete(this);
  }
};

/* いま ある ニャーちゃん ぜんぶ */
G.Chara.live = new Set();
/* 画面ごと はずされた ニャーちゃんを かたづける（G.go が 古い画面を けしたあと） */
G.Chara.sweep = function () {
  G.Chara.live.forEach(m => { if (!m.el.isConnected) m.destroy(); });
};
/* 見えているはずの ニャーちゃんが きえていないか たしかめて、きえていたら 描きなおす。
   iPad では メモリが たりないときなどに canvas の中身が きえることがあるので、その 保険（main.js から ときどき よぶ） */
G.Chara.checkAll = function () {
  G.Chara.live.forEach(m => {
    const s = m.lost();
    if (!s) return;
    if (!m.retryTimer) m.retries = 0; // まち中の やりなおしが あれば、その かぞえかたを つづける
    m.redraw(); // 用意してあった絵まで きえていたら、描いたときの たしかめで 気づいて 作りなおす
  });
};

/* なでる（F-13）：タップでも、なぞっても */
G.petting = function (chara, sc, opts = {}) {
  let down = null, last = 0, moved = 0, lastP = null;
  const doPet = (p) => {
    const now = Date.now();
    if (now - last < 450) return;
    last = now;
    G.Sound.play(Math.random() < 0.7 ? 'purr' : 'meow');
    chara.flash('face_dreamy', 1700);
    chara.squish();
    G.UI.hearts(p.x, p.y, 2);
    G.State.addMeter('fun', 0.25);
    if (G.State.pet()) G.UI.giveHearts(1, p.x, p.y);
    if (opts.onPet) opts.onPet(p);
  };
  sc.on(chara.el, 'pointerdown', (e) => {
    if (opts.enabled && !opts.enabled()) return;
    down = e.pointerId; moved = 0;
    try { chara.el.setPointerCapture(e.pointerId); } catch (_) { /* なし */ }
    lastP = G.UI.toStage(e.clientX, e.clientY);
    doPet(lastP);
    e.preventDefault();
  });
  sc.on(chara.el, 'pointermove', (e) => {
    if (e.pointerId !== down) return;
    const p = G.UI.toStage(e.clientX, e.clientY);
    moved += Math.hypot(p.x - lastP.x, p.y - lastP.y);
    lastP = p;
    if (moved > 60) { moved = 0; doPet(p); }
  });
  const up = (e) => { if (e.pointerId === down) down = null; };
  sc.on(chara.el, 'pointerup', up);
  sc.on(chara.el, 'pointercancel', up);
};
