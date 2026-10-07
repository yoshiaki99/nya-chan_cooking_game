/*
 * メイク（おしゃれ）：ニャーちゃんの絵に ほっぺ・くちべに・アイシャドウを描く。
 * 絵ごとの顔の場所は G.CHARACTER.face。顔のまわりだけを描きなおした小さな canvas をつくり、
 * G.Chara が もとの絵の上に かさねる。
 */
window.G = window.G || {};

G.Makeup = (function () {
  const CATS = ['cheek', 'lip', 'eye'];
  const LIMIT = 20;    // 作った絵を とっておく数
  const cache = new Map();

  const catOf = (id) => G.MAKEUP.find(c => c.id === id);
  const itemOf = (cat, id) => { const c = catOf(cat); return (id && c && c.items.find(i => i.id === id)) || null; };
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const rnd = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }

  /* 顔の向き。目と目をむすぶ線を よこ(u)、それと直角に あごの方を した(v) とする。
     座標は 下ごしらえした絵（G.CharaArt）の canvas の上 */
  function frame(key) {
    const k = G.CharaArt.resolve(key);
    const A = G.CHARACTER.face[k], geo = G.CharaArt.geo(k);
    if (!A || !geo) return null;
    const P = (p) => ({ x: p[0] * geo.s - geo.x0, y: p[1] * geo.s - geo.y0 });
    const L = P(A.eyes[0]), R = P(A.eyes[1]);
    const ex = R.x - L.x, ey = R.y - L.y, d = Math.hypot(ex, ey);
    const down = { x: -ey / d, y: ex / d };
    const eyes = A.eyes.map(e => {
      const c = P(e), r = e[2] * geo.s;
      const lift = A.closed ? 0.1 : 1.0; // まぶた（まつげの線）は 目のまんなかより上
      return { c, r, lid: { x: c.x - down.x * r * lift, y: c.y - down.y * r * lift } };
    });
    return {
      k, A, s: geo.s, d, ang: Math.atan2(ey, ex), down, eyes,
      cheeks: A.cheeks.map((c, i) => ({ p: P(c), r: d * 0.3 * (i ? 0.8 : 1), far: i === 1 })),
      mouth: { p: P(A.mouth), rx: A.mouth[2] * geo.s, ry: A.mouth[3] * geo.s },
      at: (u, v) => ({ x: L.x + ex * u - ey * v, y: L.y + ey * u + ex * v }),
      local: (p) => { const qx = p.x - L.x, qy = p.y - L.y; return { u: (qx * ex + qy * ey) / (d * d), v: (qy * ex - qx * ey) / (d * d) }; }
    };
  }

  /* セーブしてあるメイクと、ぬっている とちゅう（pv）を あわせる。a = こさ（0〜1） */
  function look(st, pv) {
    const out = { cheek: [], lip: [], eye: [], live: !!pv };
    const keep = pv && pv.remove ? 1 - pv.p : 1;
    const add = (list, e) => { if (e.a > 0.01) list.push(e); };
    CATS.forEach(c => {
      const cur = itemOf(c, st[c]);
      if (pv && pv.cat === c) {
        const nx = itemOf(c, pv.id);
        if (cur && cur !== nx) add(out[c], { it: cur, a: 1 - pv.p });
        if (nx) add(out[c], { it: nx, a: cur === nx ? 1 : pv.p });
      } else if (cur) add(out[c], { it: cur, a: keep });
    });
    return CATS.some(c => out[c].length) ? out : null;
  }

  function sig(lk) {
    const n = (x, k = 2) => (+x || 0).toFixed(k);
    return CATS.map(c => lk[c].map(e => e.it.id + '@' + n(e.a)).join(',')).join('|');
  }

  /* 顔のまわりを描きなおした絵 { c, x, y }。メイクが無い・顔の場所が わからない絵は null */
  /* ぬっている とちゅう（lk.live）の絵は キャッシュせず temp: true をつける（描いたら すぐ すてる） */
  function overlay(key, base, ribbonId, lk) {
    if (!lk || !base || !G.CharaArt.canRecolor()) return null;
    try {
      const f = frame(key);
      if (!f) return null;
      const ck = f.k + '|' + (base._mid || ribbonId) + '|' + sig(lk); // どの 絵から 作ったか（色替えに しっぱいした ピンクの絵 などと まざらない）
      if (!lk.live && cache.has(ck)) {
        const v = cache.get(ck);
        cache.delete(ck); cache.set(ck, v); // さいきん使った ものを うしろへ
        return v;
      }
      const out = render(f, base, lk);
      if (!out) return null;
      if (lk.live) { out.temp = true; return out; }
      cache.set(ck, out);
      while (cache.size > LIMIT) {
        const old = cache.keys().next().value;
        G.freeCanvas(cache.get(old).c);
        cache.delete(old);
      }
      return out;
    } catch (e) { return null; }
  }
  /* とっておいた絵を ぜんぶ すてる */
  function reset() { cache.forEach(v => G.freeCanvas(v.c)); cache.clear(); }

  function render(f, base, lk) {
    // 描きなおす はんい
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const grow = (p, rx, ry = rx) => {
      x0 = Math.min(x0, p.x - rx); x1 = Math.max(x1, p.x + rx);
      y0 = Math.min(y0, p.y - ry); y1 = Math.max(y1, p.y + ry);
    };
    if (lk.cheek.length) f.cheeks.forEach(c => grow(c.p, c.r * 1.05));
    if (lk.eye.length) f.eyes.forEach(e => grow(e.lid, e.r * 1.6));
    const M = f.mouth, lipPad = Math.max(2, f.d * 0.014) + 2;
    if (lk.lip.length) grow(M.p, Math.max(M.rx, M.ry) + lipPad);
    const bx = Math.max(0, Math.floor(x0)), by = Math.max(0, Math.floor(y0));
    const bw = Math.min(base.width, Math.ceil(x1)) - bx, bh = Math.min(base.height, Math.ceil(y1)) - by;
    if (!(bw > 0 && bh > 0)) return null; // NaN のときも ここで やめる

    const t = G.canvas2d(bw, bh, { willReadFrequently: true });
    if (!t) return null;
    const c = t.c, ctx = t.ctx;
    try {
      ctx.drawImage(base, -bx, -by);
      if (lk.cheek.length || lk.eye.length) tint(ctx, f, lk, bx, by, bw, bh);
      if (lk.lip.length) lip(ctx, f, lk.lip, bx, by, bw, bh);
    } catch (e) { G.freeCanvas(c); throw e; }
    return { c, x: bx, y: by };
  }

  /* ---- ほっぺ・アイシャドウ：白い毛の上だけに、かけあわせて（乗算で）ぬる ---- */
  function tint(ctx, f, lk, bx, by, bw, bh) {
    const p = canvas(bw, bh), pc = p.getContext('2d', { willReadFrequently: true });
    try { tintWith(p, pc, ctx, f, lk, bx, by, bw, bh); } finally { G.freeCanvas(p); } // 下書きの canvas は すぐ すてる
  }
  function tintWith(p, pc, ctx, f, lk, bx, by, bw, bh) {
    pc.translate(-bx, -by);
    const blob = (x, y, rx, ry, color, a, stops) => {
      pc.save();
      pc.translate(x, y); pc.rotate(f.ang); pc.scale(rx, ry);
      const g = pc.createRadialGradient(0, 0, 0, 0, 0, 1);
      stops.forEach(([o, k]) => g.addColorStop(o, rgba(color, k * a)));
      pc.fillStyle = g;
      pc.beginPath(); pc.arc(0, 0, 1, 0, Math.PI * 2); pc.fill();
      pc.restore();
    };
    lk.cheek.forEach(({ it, a }) => f.cheeks.forEach(ch => {
      const sx = ch.far ? 0.78 : 1;
      if (it.shape === 'heart') {
        blob(ch.p.x, ch.p.y, ch.r * sx, ch.r * 0.85, it.color, a, [[0, 0.32], [0.7, 0.18], [1, 0]]);
        pc.save();
        pc.translate(ch.p.x, ch.p.y); pc.rotate(f.ang); pc.scale(sx, 1);
        heartPath(pc, ch.r * 0.6);
        pc.fillStyle = rgba(it.color, 0.85 * a);
        pc.fill();
        pc.restore();
      } else {
        blob(ch.p.x, ch.p.y, ch.r * sx, ch.r * 0.82, it.color, a, [[0, 0.8], [0.45, 0.6], [0.8, 0.22], [1, 0]]);
      }
    }));
    lk.eye.forEach(({ it, a }) => f.eyes.forEach(e => {
      const up = f.A.closed ? 0.5 : 0.35; // まぶたの線より 少し上を こく
      blob(e.lid.x - f.down.x * e.r * up, e.lid.y - f.down.y * e.r * up, e.r * 1.4, e.r * (f.A.closed ? 0.7 : 0.85), it.color, a,
        [[0, 0.82], [0.5, 0.55], [1, 0]]);
    }));
    // あいている目の中（白目・黒目）には ぬらない
    if (!f.A.closed) {
      pc.save();
      pc.globalCompositeOperation = 'destination-out';
      f.eyes.forEach(e => {
        pc.save();
        pc.translate(e.c.x, e.c.y); pc.rotate(f.ang); pc.scale(e.r * 1.25, e.r * 1.08);
        pc.beginPath(); pc.arc(0, 0, 1, 0, Math.PI * 2); pc.fill();
        pc.restore();
      });
      pc.restore();
    }

    const im = ctx.getImageData(0, 0, bw, bh), d = im.data;
    const pm = pc.getImageData(0, 0, bw, bh).data;
    for (let i = 0; i < d.length; i += 4) {
      const pa = pm[i + 3];
      if (!pa || d[i + 3] < 250) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (b > r + 10) continue; // 青い目
      const v = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const w = (pa / 255) * clamp01((v - 160) / 60); // 線・まつげには ぬらない
      if (w <= 0) continue;
      d[i] = r * (1 - w * (1 - pm[i] / 255));
      d[i + 1] = g * (1 - w * (1 - pm[i + 1] / 255));
      d[i + 2] = b * (1 - w * (1 - pm[i + 2] / 255));
    }
    ctx.putImageData(im, 0, 0);

    // きらきらの アイシャドウ
    lk.eye.forEach(({ it, a }) => {
      if (!it.glitter) return;
      f.eyes.forEach((e, n) => {
        for (let k = 0; k < 7; k++) {
          const t = rnd(n * 31 + k) * 2 - 1, h = 0.4 + rnd(n * 17 + k * 7) * 0.9;
          const x = e.lid.x + Math.cos(f.ang) * t * e.r * 1.1 - f.down.x * e.r * h;
          const y = e.lid.y + Math.sin(f.ang) * t * e.r * 1.1 - f.down.y * e.r * h;
          spark(ctx, x - bx, y - by, e.r * (0.1 + rnd(k * 5 + n) * 0.1), a);
        }
      });
    });
  }

  /* ---- くちべに：くちの線を見つけて、その色で ふとく ぬる ---- */
  function lip(ctx, f, list, bx, by, bw, bh) {
    const M = f.mouth, pad = Math.max(2, f.d * 0.014);
    const R = Math.max(M.rx, M.ry);
    const mx0 = Math.max(0, Math.floor(M.p.x - R - bx)), my0 = Math.max(0, Math.floor(M.p.y - R - by));
    const mw = Math.min(bw, Math.ceil(M.p.x + R - bx)) - mx0, mh = Math.min(bh, Math.ceil(M.p.y + R - by)) - my0;
    if (mw <= 0 || mh <= 0) return;
    const d = ctx.getImageData(mx0, my0, mw, mh).data;
    const mask = canvas(mw, mh), thick = canvas(mw, mh), col = canvas(mw, mh);
    try { lipWith(mask, thick, col, ctx, f, list, d, mx0, my0, mw, mh, bx, by, M, pad); } finally { [mask, thick, col].forEach(G.freeCanvas); } // 下書きは すぐ すてる
  }
  function lipWith(mask, thick, col, ctx, f, list, d, mx0, my0, mw, mh, bx, by, M, pad) {
    const mc = mask.getContext('2d');
    const mi = mc.createImageData(mw, mh), md = mi.data;
    const cs = Math.cos(f.ang), sn = Math.sin(f.ang);
    const pts = [];
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const i = (y * mw + x) * 4;
        if (d[i + 3] < 200) continue;
        const qx = x + mx0 + bx - M.p.x, qy = y + my0 + by - M.p.y;
        const lu = (qx * cs + qy * sn) / M.rx, lv = (qy * cs - qx * sn) / M.ry;
        const e = lu * lu + lv * lv;
        if (e >= 1) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (b > r + 10 || r - g > 85) continue; // 青い目・赤い くちの中・はな は のぞく
        const v = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const ink = clamp01((226 - v) / 40) * Math.min(1, (1 - e) * 3);
        if (ink <= 0.05) continue;
        md[i] = md[i + 1] = md[i + 2] = 255;
        md[i + 3] = ink * 255;
        if (ink > 0.6 && (x * 7 + y * 13) % 5 === 0) pts.push([x, y]);
      }
    }
    mc.putImageData(mi, 0, 0);
    // まわりに ずらして かさねて、線を ふとくする
    const tc = thick.getContext('2d');
    for (let k = 0; k < 12; k++) {
      const t = k / 12 * Math.PI * 2;
      tc.drawImage(mask, Math.cos(t) * pad, Math.sin(t) * pad);
      tc.drawImage(mask, Math.cos(t) * pad * 0.5, Math.sin(t) * pad * 0.5);
    }
    tc.drawImage(mask, 0, 0);
    const cc = col.getContext('2d');
    list.forEach(({ it, a }) => {
      cc.globalCompositeOperation = 'copy';
      cc.drawImage(thick, 0, 0);
      cc.globalCompositeOperation = 'source-in';
      cc.fillStyle = it.color;
      cc.fillRect(0, 0, mw, mh);
      ctx.globalAlpha = a * 0.92;
      ctx.drawImage(col, mx0, my0);
      // つや
      cc.globalCompositeOperation = 'copy';
      cc.drawImage(mask, 0, -pad);
      cc.globalCompositeOperation = 'source-in';
      cc.fillStyle = '#ffffff';
      cc.fillRect(0, 0, mw, mh);
      ctx.globalAlpha = a * 0.16;
      ctx.drawImage(col, mx0, my0);
      ctx.globalAlpha = 1;
      if (it.glitter) {
        for (let k = 0; k < Math.min(pts.length, 8); k++) {
          const [x, y] = pts[Math.floor(rnd(k * 13 + 3) * pts.length)];
          spark(ctx, mx0 + x, my0 + y, f.d * (0.022 + rnd(k) * 0.02), a);
        }
      }
    });
    ctx.globalAlpha = 1;
  }

  /* ---- ハートの ほっぺ の 形 ---- */
  function heartPath(c, R) {
    // R = おおきさ（まんなかから はしまで）
    c.beginPath();
    c.moveTo(0, R * 0.9);
    c.bezierCurveTo(-R * 0.35, R * 0.62, -R * 1.05, R * 0.18, -R * 1.0, -R * 0.35);
    c.bezierCurveTo(-R * 0.96, -R * 0.82, -R * 0.4, -R * 1.0, 0, -R * 0.52);
    c.bezierCurveTo(R * 0.4, -R * 1.0, R * 0.96, -R * 0.82, R * 1.0, -R * 0.35);
    c.bezierCurveTo(R * 1.05, R * 0.18, R * 0.35, R * 0.62, 0, R * 0.9);
    c.closePath();
  }
  /* きらっと ひかる 星 */
  function spark(c, x, y, R, a = 1) {
    c.save();
    c.globalAlpha = a;
    c.translate(x, y);
    c.beginPath();
    c.moveTo(0, -R); c.quadraticCurveTo(R * 0.12, -R * 0.12, R, 0); c.quadraticCurveTo(R * 0.12, R * 0.12, 0, R);
    c.quadraticCurveTo(-R * 0.12, R * 0.12, -R, 0); c.quadraticCurveTo(-R * 0.12, -R * 0.12, 0, -R);
    c.fillStyle = '#fffdf2';
    c.shadowColor = 'rgba(255, 220, 140, .9)';
    c.shadowBlur = R * 0.8;
    c.fill();
    c.restore();
  }

  /* ---- ぬる場所（ゆびの ヒント用）。canvas の座標 ---- */
  function targets(key, cat) {
    const f = frame(key);
    if (!f) return [];
    if (cat === 'cheek') return f.cheeks.map(c => ({ x: c.p.x, y: c.p.y, r: c.r * 0.7 }));
    if (cat === 'eye') return f.eyes.map(e => ({ x: e.lid.x - f.down.x * e.r * 0.4, y: e.lid.y - f.down.y * e.r * 0.4, r: e.r * 1.1 }));
    if (cat === 'lip') return [{ x: f.mouth.p.x, y: f.mouth.p.y, r: f.mouth.rx * 0.9 }];
    return [];
  }

  /* 顔の中の位置（目と目を むすぶ線を 1 とした u, v）→ canvas の座標 */
  function faceAt(key, u, v) { const f = frame(key); return f ? f.at(u, v) : null; }
  function hasFace(key) { return !!frame(key); }

  return { look, overlay, reset, targets, faceAt, hasFace, itemOf, catOf };
})();
