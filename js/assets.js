/* 画像の読み込み。ファイルが無いときは G.Art の絵を代わりに使う */
window.G = window.G || {};

G.Assets = (function () {
  const reg = {};

  function register(key, src) { reg[key] = { src, img: null, status: 'idle', promise: null, tries: 0, failedAt: 0 }; }

  /* 読みこめなかった絵は、すこし 時間を おいて もう一度 ためす（3回まで） */
  function load(key) {
    const r = reg[key];
    if (!r) return Promise.resolve(false);
    if (r.promise) return r.promise;
    if (r.status === 'missing' && (r.tries >= 3 || Date.now() - r.failedAt < 4000)) return Promise.resolve(false);
    r.status = 'loading';
    r.promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        r.img = img; r.status = 'ok'; resolve(true);
        if (img.decode) img.decode().catch(() => { });
      };
      img.onerror = () => {
        r.status = 'missing'; r.tries++; r.failedAt = Date.now(); r.promise = null;
        resolve(false);
      };
      img.src = r.src;
    });
    return r.promise;
  }

  function loadAll(keys, timeoutMs) {
    const all = Promise.all(keys.map(load));
    if (!timeoutMs) return all;
    return Promise.race([all, new Promise((res) => setTimeout(res, timeoutMs))]);
  }

  const has = (key) => !!reg[key] && reg[key].status === 'ok';
  const status = (key) => (reg[key] ? reg[key].status : 'none');
  const img = (key) => (has(key) ? reg[key].img : null);

  /* 表示用の要素をつくる。画像があれば <img>、なければ描いた絵 */
  function node(key, cls = '') {
    if (has(key)) {
      const el = document.createElement('img');
      el.src = reg[key].src;
      el.className = 'art ' + cls;
      el.draggable = false;
      el.alt = '';
      return el;
    }
    const el = document.createElement('div');
    el.className = 'art art-svg ' + cls;
    const f = G.Art.all[key];
    el.innerHTML = f ? f() : '';
    return el;
  }

  function init() {
    // 実際に ある ファイル（js/asset_list.js）だけ 読みに いく。無い 絵は はじめから 描いた絵（G.Art）に する
    const exists = (src) => !G.ASSET_FILES || G.ASSET_FILES.indexOf(src) >= 0;
    Object.entries(G.CHARACTER.images).forEach(([k, src]) => { if (exists(src)) register('chara:' + k, src); });
    Object.entries(G.ART_FILES).forEach(([k, src]) => { if (exists(src)) register(k, src); });
  }

  return { init, load, loadAll, has, status, img, node, keys: () => Object.keys(reg) };
})();

/* canvas を作る。描けないとき（メモリが たりない など）は null */
G.canvas2d = function (w, h, opts) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', opts);
  if (!ctx) { G.freeCanvas(c); return null; }
  return { c, ctx };
};
/* 使いおわった canvas の メモリを すぐ かえす（すてるだけだと GC まで のこる） */
G.freeCanvas = function (c) {
  if (c && (c.width || c.height)) { c.width = 0; c.height = 0; }
};

/*
 * ニャーちゃんの絵の下ごしらえ。
 * ・まわりの透明な余白を切りとる
 * ・リボンの色を変える（ピンクのリボンの部分だけ色相を回す）
 */
G.CharaArt = (function () {
  const MAXD = 1000;
  const src = new Map();     // 絵の名前 → 下ごしらえした canvas
  const geos = new Map();    // 絵の名前 → 元の絵から canvas への変換（canvas = 元 × s − x0, y0）と、たしかめ用の1点 probe
  const colored = new Map(); // 絵の名前|リボン → canvas
  let coloredRibbon = null;
  let canRead = true;
  let warmToken = 0;
  let seq = 0;            // 用意した 絵の canvas の 通し番号（メイクの キャッシュが どの 絵から 作ったかを 見分ける）
  let lastExact = true;   // さいごの get() が、えらんでいる リボンの 色の 絵を かえせたか
  let probeOffUntil = 0;  // 読みとり そのものが こわれていると わかったら、しばらく たしかめを やめる
  let resetAt = -1e9;

  function resolve(key) {
    let k = key;
    const seen = new Set();
    while (k && !G.Assets.has('chara:' + k) && !seen.has(k)) { seen.add(k); k = G.CHARACTER.fallbacks[k]; }
    return G.Assets.has('chara:' + k) ? k : 'base';
  }
  /* まだ読みこみ中（または 読みなおし中）の、もっと合う絵（読みこめたら描き直す） */
  function pending(key) {
    const out = [];
    const wait = (k) => {
      const st = G.Assets.status('chara:' + k);
      if (st === 'loading' || st === 'missing') out.push(G.Assets.load('chara:' + k));
    };
    let k = key;
    const seen = new Set();
    while (k && !G.Assets.has('chara:' + k) && !seen.has(k)) {
      seen.add(k);
      wait(k);
      k = G.CHARACTER.fallbacks[k];
    }
    if (!G.Assets.has('chara:base') && !seen.has('base')) wait('base');
    return out;
  }
  const hasOwn = (key) => G.Assets.has('chara:' + key);

  /* 絵の まんなかの近くで、しっかり 色が ついている 1点（d = ピクセル、はんい x0〜x1, y0〜y1） */
  function findProbe(d, w, x0, y0, x1, y1) {
    const cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2);
    const R = Math.max(x1 - x0, y1 - y0) / 2;
    for (let r = 0; r <= R; r += 3) {
      for (const [x, y] of [[cx, cy + r], [cx, cy - r], [cx + r, cy], [cx - r, cy]]) {
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        if (d[(y * w + x) * 4 + 3] >= 240) return [x, y]; // 絵の ふつうの ところは 253 くらい
      }
    }
    return null;
  }

  /* 下ごしらえ。描けなかったとき（メモリが たりない など）は キャッシュせずに null（つぎに もう一度 ためす） */
  function prep(k) {
    if (src.has(k)) return src.get(k);
    const img = G.Assets.img('chara:' + k);
    if (!img) return null;
    const s = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
    const t = G.canvas2d(w, h, { willReadFrequently: true });
    if (!t) return null;
    t.ctx.drawImage(img, 0, 0, w, h);
    let out = t.c;
    const geo = { s, x0: 0, y0: 0, probe: null };
    let d = null;
    if (canRead) {
      try { d = t.ctx.getImageData(0, 0, w, h).data; } catch (e) {
        if (!e || e.name !== 'SecurityError') { G.freeCanvas(t.c); return null; }
        canRead = false; // file:// で開いたときなど。色替えはできない
      }
    }
    if (d) {
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) {
        const row = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (d[row + x * 4 + 3] > 20) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) { G.freeCanvas(t.c); return null; } // 何も 描けていない
      const pad = 6;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
      x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
      const o = G.canvas2d(x1 - x0 + 1, y1 - y0 + 1, { willReadFrequently: true });
      if (!o) { G.freeCanvas(t.c); return null; }
      o.ctx.drawImage(t.c, x0, y0, o.c.width, o.c.height, 0, 0, o.c.width, o.c.height);
      G.freeCanvas(t.c); // 切りとる前の 大きな canvas は もう いらない
      out = o.c;
      geo.x0 = x0; geo.y0 = y0;
      const p = findProbe(d, w, x0, y0, x1, y1);
      if (p) geo.probe = [p[0] - x0, p[1] - y0];
    }
    out._mid = ++seq;
    src.set(k, out);
    geos.set(k, geo);
    return out;
  }

  function hsvToRgb(h, s, v) {
    const i = Math.floor(h * 6), f = h * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: return [v, t, p]; case 1: return [q, v, p]; case 2: return [p, v, t];
      case 3: return [p, q, v]; case 4: return [t, p, v]; default: return [v, p, q];
    }
  }

  /* 色を変えた絵。描けなかったときは null（k = 絵の名前。たしかめ用の1点を見る） */
  function recolor(base, rb, k) {
    const w = base.width, h = base.height;
    const t = G.canvas2d(w, h, { willReadFrequently: true });
    if (!t) return null;
    const c = t.c, ctx = t.ctx;
    ctx.drawImage(base, 0, 0);
    let im;
    try { im = ctx.getImageData(0, 0, w, h); } catch (e) {
      if (e && e.name === 'SecurityError') canRead = false;
      G.freeCanvas(c);
      return null;
    }
    const d = im.data;
    const g = geos.get(k);
    if (g && g.probe && d[(g.probe[1] * w + g.probe[0]) * 4 + 3] < 64) { G.freeCanvas(c); return null; } // 描けていない
    const H = G.CHARACTER.ribbonHue;
    // 色相 = 360 - 60t（赤がいちばん強く、青 > 緑のとき）
    const tMax = (360 - H.from) / 60, tMin = (360 - H.to) / 60;
    const tSoftHi = tMax - 10 / 60, tSoftLo = tMin + 4.5 / 60;
    const pattern = rb.pattern;
    const hue = (rb.hue != null ? rb.hue : 350) / 360;
    const satMul = rb.sat || 1, valMul = rb.val || 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] < 8) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r < g || r < b || b <= g) continue;
        const delta = r - g; // r が最大、g が最小
        if (delta < 8) continue;
        const t = (b - g) / delta;
        if (t > tMax || t < tMin) continue;
        let wgt = t > tSoftHi ? (tMax - t) / (tMax - tSoftHi) : (t < tSoftLo ? (t - tMin) / (tSoftLo - tMin) : 1);
        const s = delta / r;
        wgt *= Math.min(1, Math.max(0, (s - 0.06) / 0.08));
        if (wgt <= 0) continue;
        const v = r / 255;
        let nr, ng, nb;
        if (pattern === 'dots') {
          const off = (Math.floor(y / 30) % 2) * 15;
          const dx = ((x + off) % 30) - 15, dy = (y % 30) - 15;
          const inDot = (dx * dx + dy * dy) < 48;
          if (!inDot) continue;
          nr = ng = nb = Math.min(1, v * 1.04);
          wgt *= 0.9;
        } else if (pattern === 'rainbow') {
          const hh = ((x / w) * 1.6 + y / h * 0.3) % 1;
          [nr, ng, nb] = hsvToRgb(hh, Math.min(1, s * 1.35 + 0.08), Math.min(1, v * 1.0));
        } else {
          [nr, ng, nb] = hsvToRgb(hue, Math.min(1, s * satMul), Math.min(1, v * valMul));
          if (pattern === 'glitter') {
            const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            if (n - Math.floor(n) > 0.965) { nr = ng = 1; nb = 0.92; }
          }
        }
        d[i] = r + (nr * 255 - r) * wgt;
        d[i + 1] = g + (ng * 255 - g) * wgt;
        d[i + 2] = b + (nb * 255 - b) * wgt;
      }
    }
    ctx.putImageData(im, 0, 0);
    c._mid = ++seq;
    return c;
  }

  function get(key, ribbonId) {
    lastExact = true;
    const k = resolve(key);
    const base = prep(k);
    if (!base) return null;
    const rb = G.RIBBONS.find(r => r.id === ribbonId) || G.RIBBONS[0];
    if (rb.id === 'pink' || !canRead || !G.CHARACTER.ribbonHue) { // ぬりかえを 使わない キャラクターは いつも そのまま
      if (colored.size && coloredRibbon !== 'pink') { dropColored(); coloredRibbon = 'pink'; } // 前の色の絵は もう いらない
      return base;
    }
    if (coloredRibbon !== rb.id) { dropColored(); coloredRibbon = rb.id; }
    const ck = k + '|' + rb.id;
    if (!colored.has(ck)) {
      const c = recolor(base, rb, k);
      if (!c) { lastExact = false; return base; } // 色を変えられなかったら、ひとまず ピンクの まま（つぎに もう一度 ためす）
      colored.set(ck, c);
    }
    return colored.get(ck);
  }
  /* 前のリボンの絵は すぐ メモリを かえす（描くときに その場で 使うだけなので、のこっていても 使われない） */
  function dropColored() { colored.forEach(G.freeCanvas); colored.clear(); }

  /* ひまなときに、よく使う絵を先に用意しておく。あたらしく よばれたら 前のぶんは やめる */
  function warm(ribbonId, keys) {
    const my = ++warmToken;
    const list = (keys || ['face_normal', 'face_happy', 'face_dreamy', 'face_prim', 'face_sleepy', 'face_lonely']).slice();
    const step = () => {
      if (my !== warmToken) return;
      const k = list.shift();
      if (!k) return;
      try { get(k, ribbonId); } catch (e) { /* 使うときに もう一度 ためす */ }
      setTimeout(step, 30);
    };
    setTimeout(step, 50);
  }

  /* 用意した絵を ぜんぶ すてる（中身が きえていたときに 作りなおすため）。geos は 絵の ファイルだけで きまるので のこす。
     つづけて よばれても 3びょうに 1回だけ（作りなおしは おもいので） */
  function reset() {
    const now = Date.now();
    if (now - resetAt < 3000) return;
    resetAt = now;
    warmToken++;
    src.forEach(G.freeCanvas); src.clear();
    dropColored(); coloredRibbon = null;
    if (G.Makeup && G.Makeup.reset) G.Makeup.reset();
    const rb = G.State.ribbon();
    setTimeout(() => warm(rb), 1500); // よく使う 顔を ひまなときに 作りなおす
  }

  /* canvas c の たしかめ用の1点 p が 見えているか（すきとおっていないか） */
  function drawnAt(c, p) {
    if (!p || !canRead || Date.now() < probeOffUntil) return true; // たしかめられない ときは 描けたことにする
    if (!c.width || !c.height) return false;
    try {
      const ctx = c.getContext('2d');
      return !!ctx && ctx.getImageData(p[0], p[1], 1, 1).data[3] > 64;
    } catch (e) { return true; }
  }
  function drawn(c, k) { const g = geos.get(k); return drawnAt(c, g && g.probe); }

  /* 読みとり そのものが こわれていないか（作りなおしても 見えなかった ときだけ よぶ）。
     こわれていたら 1分 たしかめを やめて false（そのあいだは ニャーちゃんを たしかめずに 出す） */
  function readbackOk() {
    const t = G.canvas2d(256, 256);
    if (!t) return true; // canvas が 作れない ＝ メモリが たりないだけ（読みとりの せいではない）
    try {
      t.ctx.fillStyle = '#c34';
      t.ctx.fillRect(0, 0, 256, 256);
      const ok = t.ctx.getImageData(128, 128, 1, 1).data[3] > 200;
      if (!ok) probeOffUntil = Date.now() + 60000;
      return ok;
    } catch (e) { return true; } finally { G.freeCanvas(t.c); }
  }

  return { get, resolve, pending, hasOwn, warm, reset, drawn, drawnAt, readbackOk, exact: () => lastExact, geo: (k) => geos.get(k), canRecolor: () => canRead };
})();
