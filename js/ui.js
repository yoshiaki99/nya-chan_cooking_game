/* 画面の部品と演出 */
window.G = window.G || {};

G.UI = (function () {
  const W = 1366, H = 1024;
  let scale = 1;
  const $ = (s) => document.querySelector(s);

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function pos(e, x, y, w, h) {
    e.style.left = x + 'px'; e.style.top = y + 'px';
    if (w != null) e.style.width = w + 'px';
    if (h != null) e.style.height = h + 'px';
    return e;
  }

  /* ---- 画面の大きさに合わせる ---- */
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!(vw > 0 && vh > 0)) return; // アプリの切りかえ中などに 0 が くることがある（画面ごと きえないように）
    scale = Math.min(vw / W, vh / H);
    const st = $('#stage');
    st.style.transform = `translate(${(vw - W * scale) / 2}px, ${(vh - H * scale) / 2}px) scale(${scale})`;
    document.body.classList.toggle('portrait', vh > vw * 1.05);
  }
  function toStage(cx, cy) {
    const r = $('#stage').getBoundingClientRect();
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
  }
  function rectOf(e) {
    const r = e.getBoundingClientRect();
    const p = toStage(r.left, r.top);
    const w = r.width / scale, h = r.height / scale;
    return { x: p.x, y: p.y, w, h, cx: p.x + w / 2, cy: p.y + h / 2 };
  }

  /* ---- タップ（押した瞬間に音と動き。離したときに実行） ---- */
  function tap(target, fn, opts = {}) {
    let active = null;
    const pad = opts.pad == null ? 40 : opts.pad;
    target.addEventListener('pointerdown', (e) => {
      if (active != null) return;
      active = e.pointerId;
      try { target.setPointerCapture(e.pointerId); } catch (_) { /* なし */ }
      target.classList.add('pressed');
      if (opts.sound !== false) G.Sound.play(opts.sound || 'press');
      if (opts.onDown) opts.onDown(e);
      e.preventDefault();
    });
    const end = (e, ok) => {
      if (e.pointerId !== active) return;
      active = null;
      target.classList.remove('pressed');
      if (!ok) return;
      if (!target.isConnected || target.closest('.screen.out')) return; // もう ほかの画面に うつった あとの ボタン
      const r = target.getBoundingClientRect();
      const p = pad * scale;
      if (e.clientX >= r.left - p && e.clientX <= r.right + p && e.clientY >= r.top - p && e.clientY <= r.bottom + p) {
        if (opts.say) G.Voice.speak(opts.say, 'guide');
        fn(e);
      }
    };
    target.addEventListener('pointerup', (e) => end(e, true));
    target.addEventListener('pointercancel', (e) => end(e, false));
    return target;
  }

  /* ---- ふきだし ---- */
  class Bubble {
    constructor(parent) {
      this.el = el('div', 'bubble');
      this.text = el('div', 'bubble-text');
      this.el.appendChild(this.text);
      parent.appendChild(this.el);
      this.token = 0;
      this.last = '';
      tap(this.el, () => { if (this.last) this.say(this.last, { quiet: true }); }, { sound: 'soft' });
    }
    /* x, y = しっぽの先（ニャーちゃんの頭のそば）。side = ふきだしが出る向き */
    /* side: 'right' | 'left'（横に出す）| 'top'（上に出して、しっぽを下へ） */
    place(x, y, side = 'right') {
      this.ax = x; this.ay = y; this.side = side;
      this.el.classList.toggle('left', side === 'left');
      this.el.classList.toggle('top', side === 'top');
      this.el.style.left = x + 'px'; this.el.style.top = y + 'px';
    }
    say(text, opts = {}) {
      const my = ++this.token;
      this.last = text;
      this.text.textContent = text;
      this.el.classList.remove('show');
      this.el.style.left = this.ax + 'px';
      this.el.style.top = this.ay + 'px';
      this.text.style.maxWidth = '';
      void this.el.offsetWidth;
      // 画面からはみ出すときは、まず幅をせまくして改行する（ニャーちゃんの顔に重ねないため）
      const PAD = 16;
      const lift = this.side === 'top' ? 28 : 0; // 上に出すときは しっぽの ぶん さらに 上
      const overTop = () => PAD - (this.ay - lift - this.el.offsetHeight);
      // 上に出す ふきだしが 画面の 上に はみ出すときは、横に ひろげて 行を へらす（narrow は まわりに かさねないため ひろげない）
      if (this.side === 'top' && overTop() > 0 && !this.el.classList.contains('narrow')) {
        this.text.style.maxWidth = (W - PAD * 2) + 'px';
      }
      let w = this.el.offsetWidth;
      if (this.side === 'top') {
        const half = w / 2;
        const cx = Math.min(W - PAD - half, Math.max(PAD + half, this.ax));
        this.el.style.left = cx + 'px';
      } else {
        const avail = this.side === 'left' ? this.ax - 26 - PAD : W - PAD - this.ax - 26;
        if (w > avail) { this.text.style.maxWidth = Math.max(300, avail) + 'px'; w = this.el.offsetWidth; }
        if (this.side === 'left') {
          const over = PAD - (this.ax - 26 - w);
          if (over > 0) this.el.style.left = (this.ax + over) + 'px';
        } else {
          const over = this.ax + 26 + w - (W - PAD);
          if (over > 0) this.el.style.left = (this.ax - over) + 'px';
        }
      }
      // それでも 上に はみ出すときは、文字が 切れないように 下へ ずらす
      const down = overTop();
      if (down > 0) this.el.style.top = (this.ay + down) + 'px';
      this.el.classList.add('show');
      const p = G.Voice.speak(text, opts.who || 'chara');
      return p.then(() => new Promise(r => setTimeout(r, opts.hold != null ? opts.hold : 1400))).then(() => {
        if (my === this.token && !opts.keep) this.el.classList.remove('show');
      });
    }
    hide() { this.token++; this.el.classList.remove('show'); }
  }

  /* ---- 演出 ---- */
  const fxLayer = () => $('#fx');
  function particle(html, cls, x, y, size) {
    const p = el('div', 'fx ' + (cls || ''), html);
    pos(p, x - size / 2, y - size / 2, size, size);
    fxLayer().appendChild(p);
    return p;
  }
  function animateAndRemove(p, frames, o) {
    const a = p.animate(frames, o);
    a.onfinish = () => p.remove();
    return a;
  }
  function hearts(x, y, n = 3, color) {
    for (let i = 0; i < n; i++) {
      const s = 34 + Math.random() * 22;
      const p = particle(G.Art.heart(color || ['#f37d9b', '#f69ab3', '#ee6f90'][i % 3]), 'fx-heart', x, y, s);
      const dx = (Math.random() - 0.5) * 140, dy = -120 - Math.random() * 120;
      animateAndRemove(p, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(1.1)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${dx}px,${dy}px) scale(.9)`, opacity: 0 }
      ], { duration: 1200 + Math.random() * 400, delay: i * 90, easing: 'ease-out', fill: 'both' });
    }
  }
  function sparkles(x, y, n = 6, spread = 90, color) {
    for (let i = 0; i < n; i++) {
      const s = 24 + Math.random() * 30;
      const p = particle(G.Art.sparkle(color || ['#fff6c9', '#ffffff', '#ffe08a'][i % 3]), 'fx-spark', x, y, s);
      const a = Math.random() * Math.PI * 2, r = spread * (0.4 + Math.random() * 0.6);
      animateAndRemove(p, [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${Math.cos(a) * r * 1.2}px,${Math.sin(a) * r * 1.2}px) scale(0) rotate(180deg)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 300, delay: i * 40, easing: 'ease-out', fill: 'both' });
    }
  }
  function notes(x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      const p = particle(['♪', '♫', '♬'][Math.floor(Math.random() * 3)], 'fx-note', x, y, 60);
      p.style.color = ['#e47f9a', '#8fb9e0', '#c3a3ec', '#e2b04a'][Math.floor(Math.random() * 4)];
      const dx = 40 + Math.random() * 80, dy = -110 - Math.random() * 60;
      animateAndRemove(p, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: `translate(${dx * 0.4}px,${dy * 0.4}px) scale(1) rotate(-10deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx}px,${dy}px) scale(1) rotate(10deg)`, opacity: 0 }
      ], { duration: 1300, delay: i * 120, easing: 'ease-out', fill: 'both' });
    }
  }
  function word(text, x, y, color = '#c95f7f', size = 46) {
    const p = particle(text, 'fx-word', x, y, 10);
    p.style.color = color; p.style.fontSize = size + 'px';
    animateAndRemove(p, [
      { transform: 'translate(-50%,0) scale(.4)', opacity: 0 },
      { transform: 'translate(-50%,-30px) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%,-70px) scale(1)', opacity: 0 }
    ], { duration: 1300, easing: 'ease-out', fill: 'both' });
  }
  function zzz(x, y) {
    const p = particle('Z', 'fx-z', x, y, 40);
    p.style.fontSize = (34 + Math.random() * 20) + 'px';
    animateAndRemove(p, [
      { transform: 'translate(0,0) scale(.5) rotate(-10deg)', opacity: 0 },
      { transform: 'translate(50px,-36px) scale(1) rotate(5deg)', opacity: 0.9, offset: 0.4 },
      { transform: 'translate(130px,-90px) scale(1.2) rotate(-5deg)', opacity: 0 }
    ], { duration: 2600, easing: 'ease-out', fill: 'both' });
  }

  /* ---- ハートをもらう ---- */
  let shownHearts = 0;
  function hud() { return $('#hud'); }
  function setHeartCount(n) {
    shownHearts = n;
    const c = $('#hud .hc-num');
    if (c) c.textContent = n;
  }
  function giveHearts(n, x, y) {
    G.State.addHearts(n);
    const target = $('#hud .hc-icon');
    const visible = target && document.body.classList.contains('hud-on');
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (!visible) { hearts(x, y, 1); setHeartCount(shownHearts + 1); G.Sound.play('heart'); return; }
        const t = rectOf(target);
        const p = particle(G.Art.heart(), 'fx-heart', x, y, 56);
        const mx = (x + t.cx) / 2 + (Math.random() - 0.5) * 200, my = Math.min(y, t.cy) - 120;
        const a = p.animate([
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${mx - x}px,${my - y}px) scale(1.2)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${t.cx - x}px,${t.cy - y}px) scale(.7)`, opacity: 1 }
        ], { duration: 950, easing: 'ease-in-out', fill: 'both' });
        a.onfinish = () => {
          p.remove();
          setHeartCount(shownHearts + 1);
          G.Sound.play('heart');
          const ic = $('#hud .heart-counter');
          if (ic) ic.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 });
        };
      }, i * 220);
    }
  }

  /* ---- げんきメーター ---- */
  function meterBar(mt) {
    const box = el('div', 'meter meter-' + mt.id);
    const icon = el('div', 'meter-icon', G.Art.meterIcons[mt.id]());
    const hs = el('div', 'meter-hearts');
    for (let i = 0; i < 5; i++) hs.appendChild(el('div', 'mh'));
    box.appendChild(icon); box.appendChild(hs);
    let lastLv = -1;
    box.update = (animate) => {
      const lv = G.State.level(mt.id);
      if (lv === lastLv) return;
      [...hs.children].forEach((h, i) => {
        const on = i < lv;
        const was = h.classList.contains('on');
        if (on !== was || lastLv < 0) {
          h.classList.toggle('on', on);
          h.innerHTML = on ? G.Art.heart(mt.color, '#ffffff', 3) : G.Art.heartEmpty(mt.color);
          if (on && animate && lastLv >= 0) h.animate([{ transform: 'scale(.2)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 420, delay: (i - lastLv) * 140, fill: 'backwards' });
        }
      });
      box.classList.toggle('low', lv <= 1);
      lastLv = lv;
    };
    box.update(false);
    return box;
  }

  /* ---- いつも左上の「もどる」（N-07） ---- */
  function backButton(parent, fn) {
    const b = el('div', 'btn-back', `<div class="bb-icon">${G.Art.all.back()}</div><div class="bb-label">もどる</div>`);
    parent.appendChild(b);
    tap(b, fn, { sound: 'back', say: 'もどる' });
    return b;
  }

  /* ---- ゆびの ヒント ---- */
  function hand(parent, from, to, opts = {}) {
    const h = el('div', 'hint-hand', '👆');
    parent.appendChild(h);
    pos(h, from.x - 40, from.y - 10);
    const frames = to ? [
      { transform: 'translate(0,0) scale(1)', opacity: 0 },
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.12 },
      { transform: 'translate(0,0) scale(.85)', opacity: 1, offset: 0.24 },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.85)`, opacity: 1, offset: 0.75 },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(1)`, opacity: 0 }
    ] : [
      { transform: 'translateY(0) scale(1)', opacity: 0.95 },
      { transform: 'translateY(18px) scale(.88)', opacity: 1, offset: 0.5 },
      { transform: 'translateY(0) scale(1)', opacity: 0.95 }
    ];
    const a = h.animate(frames, { duration: to ? 2200 : 1000, iterations: opts.times || Infinity, easing: 'ease-in-out' });
    a.onfinish = () => h.remove();
    return { remove: () => h.remove(), el: h };
  }

  /* ---- おしらせ（シール・リボン） ---- */
  function popup({ art, title, speak, onClose }) {
    const ov = $('#overlay');
    const wrap = el('div', 'popup-wrap');
    const card = el('div', 'popup');
    const a = el('div', 'popup-art');
    if (typeof art === 'string') a.innerHTML = art; else if (art) a.appendChild(art);
    const t = el('div', 'popup-title', title);
    const ok = el('div', 'btn-big btn-ok', '<span>やったね！</span>');
    card.appendChild(a); card.appendChild(t); card.appendChild(ok);
    wrap.appendChild(card); ov.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    G.Sound.play('fanfare');
    setTimeout(() => { const r = rectOf(a); sparkles(r.cx, r.cy, 12, 200); }, 300);
    if (speak) setTimeout(() => G.Voice.speak(speak, 'chara'), 500);
    return new Promise((resolve) => {
      tap(ok, () => {
        wrap.classList.remove('show');
        setTimeout(() => { wrap.remove(); if (onClose) onClose(); resolve(); }, 300);
      }, { say: 'やったね' });
    });
  }

  return { W, H, el, pos, fit, toStage, rectOf, tap, Bubble, hearts, sparkles, notes, word, zzz, giveHearts, setHeartCount, meterBar, backButton, hand, popup, hud, getScale: () => scale };
})();

/* 画面ごとの後かたづけをまとめる */
G.scope = function () {
  const timers = new Set(), cleanups = [];
  let alive = true;
  return {
    get alive() { return alive; },
    timeout(fn, ms) { if (!alive) return 0; const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms); timers.add(id); return id; },
    interval(fn, ms) { if (!alive) return 0; const id = setInterval(() => { if (alive) fn(); }, ms); timers.add(id); return id; },
    wait(ms) { return new Promise(res => { if (!alive) return; const id = setTimeout(() => { timers.delete(id); if (alive) res(); }, ms); timers.add(id); }); },
    on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); cleanups.push(() => target.removeEventListener(ev, fn, opt)); },
    add(fn) { cleanups.push(fn); },
    guard(p) { return new Promise(res => p.then(v => { if (alive) res(v); })); },
    dispose() {
      alive = false;
      timers.forEach(id => { clearTimeout(id); clearInterval(id); });
      timers.clear();
      cleanups.splice(0).forEach(f => { try { f(); } catch (e) { /* なし */ } });
    }
  };
};
