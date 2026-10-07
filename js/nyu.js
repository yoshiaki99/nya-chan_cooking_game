/*
 * ニューちゃんの 表示と動き（G.NyuSprite）。絵を 1まい 出す かるい しくみ（おせわゲームと 同じ）。
 * 料理ゲームでは いつも テーブルに いる。ナプキンを 重ねたり、すわる・たべる 絵を 出したり するときは、
 * ニャーちゃんと 同じ しくみ（G.Chara）に 作りなおす（要件定義書 7.3）
 */
window.G = window.G || {};

G.NyuSprite = class {
  /* x, y = 足もとの まんなか（ステージ座標）。h = 高さ */
  constructor(parent, { x, y, h }) {
    const UI = G.UI;
    this.CH = G.CHARACTERS.nyu;
    this.x = x; this.y = y; this.h = h;
    this.el = UI.el('div', 'nyu');
    this.move = UI.el('div', 'ny-move');
    this.flip = UI.el('div', 'ny-flip');
    this.img = document.createElement('img');
    this.img.className = 'ny-img';
    this.img.alt = '';
    this.img.draggable = false;
    this.cloth = document.createElement('img'); // おそろいの ふく
    this.cloth.className = 'ny-img ny-cloth';
    this.cloth.alt = '';
    this.cloth.draggable = false;
    this.flip.appendChild(this.img);
    this.flip.appendChild(this.cloth);
    this.move.appendChild(this.flip);
    this.el.appendChild(UI.el('div', 'ny-shadow'));
    this.el.appendChild(this.move);
    parent.appendChild(this.el);
    this.place(x);
    this.setPose('base');
    this.tempTimer = null;
  }
  place(x) {
    this.x = x;
    G.UI.pos(this.el, x - this.h / 2, this.y - this.h, this.h, this.h);
  }
  src(key) {
    const s = this.CH.images[key];
    const ok = (p) => !G.ASSET_FILES || G.ASSET_FILES.indexOf(p) >= 0;
    return ok(s) ? s : this.CH.images.base;
  }
  setPose(key) { this.pose = key; this.img.src = this.src(key); this.dress(); }
  /* ニャーちゃんと おそろいの ふくを 着る（ニャーちゃんが 着ていなければ 着ない） */
  dress() {
    if (!this.cloth) return;
    const id = G.State.clothes();
    const url = id ? G.Accessory.clothesDataUrl(id, { noL: this.pose === 'wave' }, this.CH.clothesTransform) : '';
    if (url) { if (this.cloth.getAttribute('src') !== url) this.cloth.src = url; this.cloth.style.display = ''; }
    else this.cloth.style.display = 'none';
  }
  /* しばらく ちがう 顔に して、もとに もどす */
  flash(key, ms = 1600) {
    clearTimeout(this.tempTimer);
    this.setPose(key);
    this.tempTimer = setTimeout(() => { this.tempTimer = null; if (this.el.isConnected) this.setPose('base'); }, ms);
  }
  face(dir) { this.flip.style.transform = dir < 0 ? 'scaleX(-1)' : ''; }
  /* x まで ちょこちょこ 歩く */
  walkTo(x, ms) {
    return new Promise((res) => {
      this.face(x < this.x ? -1 : 1);
      this.el.classList.add('walking');
      this.el.style.transition = `left ${ms}ms linear`;
      void this.el.offsetWidth;
      this.place(x);
      setTimeout(() => {
        this.el.classList.remove('walking');
        this.el.style.transition = '';
        this.face(1);
        res();
      }, ms);
    });
  }
  hop() {
    this.move.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-36px)' }, { transform: 'translateY(0)' }],
      { duration: 420, easing: 'ease-out' });
  }
  /* 絵の わくに 対する 割合の 点（ステージ座標） */
  point(rx, ry) { return { x: this.x - this.h / 2 + this.h * rx, y: this.y - this.h + this.h * ry }; }
  remove() { clearTimeout(this.tempTimer); this.el.remove(); }
};
