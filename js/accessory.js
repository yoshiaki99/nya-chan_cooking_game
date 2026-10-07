/*
 * アクセサリー（おしゃれ）：ぼうし・メガネ・くびかざり・はね・しっぽのリボン。
 * みみの リボン（えらんでいる リボン）と ふく（js/clothes.js）も、ここで いっしょに かさねる。
 * 絵はこのファイルの SVG。ニャーちゃんの 基準画（nya_base.png）の 座標で、線画風（黒い線＋パステル）に 描いてある。
 * 一度 画像にしておき、G.Chara が ニャーちゃんの絵の まえ（はねは うしろ）に かさねる。
 * 絵ごとの つける場所は G.CHARACTER.accessory。
 */
window.G = window.G || {};

G.Accessory = (function () {
  const RS = 0.8;   // 画像にするときの大きさ（ニャーちゃんの絵の下ごしらえ 1000/1254 と だいたい同じ）
  const PAD = 16;   // ふちのゆらぎ・線の太さのぶん
  const FRONT = ['body', 'tail', 'neck', 'face', 'bow', 'head']; // まえに描く順（あとのものほど手前）。body = ふく、bow = みみの リボン（ぼうしの うしろ）
  const BACK = ['back'];

  const HEART = 'M16 28C6 20 1 14 1 8.5 1 4 4.5 1 8.5 1c3 0 5.5 1.7 7.5 4.5C18 2.7 20.5 1 23.5 1 27.5 1 31 4 31 8.5 31 14 26 20 16 28z';
  const INK = '#1d1a1c';
  // 線の 属性（太さ w）。ニャーちゃんと 同じ 黒い 線
  const L = (w = 9, col = INK) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  // ニャーちゃんの 目（基準画 nya_base.png の 座標。メガネの 位置）
  const EYE_L = [518, 338], EYE_R = [706, 320];

  const DEFS = `<defs>
    <linearGradient id="rainbow" x1="0" x2="1"><stop offset="0" stop-color="#f6a1b5"/><stop offset=".2" stop-color="#f9c98a"/><stop offset=".4" stop-color="#f6e48a"/><stop offset=".6" stop-color="#a9e0b8"/><stop offset=".8" stop-color="#9fcdf2"/><stop offset="1" stop-color="#c8a9ec"/></linearGradient>
  </defs>`;

  /* ---------- 部品 ---------- */
  function starPath(R, r, n = 5) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  }
  const at = (x, y, inner, rot = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${inner}</g>`;
  const heart = (x, y, s, fill, w = 3) => at(x, y, `<path d="${HEART}" transform="translate(-16 -15)" fill="${fill}" ${L(w)}/>`, 0, s);
  function flower(x, y, r, petal, center, n = 5) {
    let s = '';
    for (let k = 0; k < n; k++) {
      const a = k * 2 * Math.PI / n - Math.PI / 2;
      s += `<circle cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" r="${(r * 0.46).toFixed(1)}" fill="${petal}" ${L(5)}/>`;
    }
    return s + `<circle cx="${x}" cy="${y}" r="${(r * 0.34).toFixed(1)}" fill="${center}" ${L(5)}/>`;
  }
  /* リボン（rb = えらんでいる リボン）。結び目が (0, 0)、w = はば */
  function bow(rb, w) {
    const s = w / 120;
    const fill = rb.swatch === 'rainbow' ? 'url(#rainbow)' : rb.swatch;
    const dots = rb.pattern === 'dots' ? `<g fill="#fff">${[[-38, -12], [-22, 4], [-44, 8], [38, -12], [22, 4], [44, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>` : '';
    const glit = rb.pattern === 'glitter' ? `<g fill="#fffbe6">${[[-36, -10], [30, -14], [44, 6], [-20, 8]].map(([x, y]) => at(x, y, `<path d="${starPath(7, 3, 4)}"/>`)).join('')}</g>` : '';
    return at(0, 0, `
      <path d="M-6 4 L-26 46 L-12 42 L-6 54 L2 8Z M6 4 L26 46 L12 42 L6 54 L-2 8Z" fill="${fill}" ${L(4.5 / s)}/>
      <path d="M0 0 C-20 -28 -54 -34 -56 -10 C-58 12 -26 20 0 0Z" fill="${fill}" ${L(4.5 / s)}/>
      <path d="M0 0 C20 -28 54 -34 56 -10 C58 12 26 20 0 0Z" fill="${fill}" ${L(4.5 / s)}/>
      ${dots}${glit}
      <ellipse cx="0" cy="0" rx="12" ry="13" fill="${fill}" ${L(4.5 / s)}/>`, 0, s);
  }
  function glassesArms(stroke, w) {
    return `<path d="M${EYE_L[0] - 56} ${EYE_L[1] - 6} L${EYE_L[0] - 110} ${EYE_L[1] - 18}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" fill="none"/>
      <path d="M${EYE_R[0] + 56} ${EYE_R[1] - 8} L${EYE_R[0] + 110} ${EYE_R[1] - 22}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  }
  const pearl = (x, y, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fbf7f2" ${L(4)}/><circle cx="${(x - r * .35).toFixed(1)}" cy="${(y - r * .35).toFixed(1)}" r="${(r * .3).toFixed(1)}" fill="#fff"/>`;
  const arcPts = (x0, x1, y0, dip, n) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [x0 + (x1 - x0) * t, y0 + dip * 4 * t * (1 - t)]; });

  /* ---------- 絵（rb = えらんでいる リボン）。ニャーちゃんの 基準画の 座標で 描いてある ---------- */
  // 目じるし（G.CHARACTER.accessory.pivot と 同じ）：あたま (615,200)・かお (612,330)・くび (617,604)・しっぽ (930,1045)・せなか (615,760)
  const ART = {
    tiara: () => at(615, 196, `
      <path d="M-120 10 L-104 -40 L-70 -6 L-36 -62 L0 -14 L36 -62 L70 -6 L104 -40 L120 10 Q0 -10 -120 10Z" fill="#f6d860" ${L(8)}/>
      <path d="M-128 8 Q0 -14 128 8 L130 30 Q0 8 -130 30Z" fill="#f6d860" ${L(8)}/>
      <path d="M0 -52 L16 -30 L0 -10 L-16 -30Z" fill="#8fd0f2" ${L(6)}/>
      ${[[-104, -40], [-36, -62], [36, -62], [104, -40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fbf7f2" ${L(5)}/>`).join('')}
      ${[-80, -40, 40, 80].map((x, i) => `<circle cx="${x}" cy="${i % 3 ? 14 : 18}" r="7" fill="${i % 2 ? '#f7a8c4' : '#c9b3ee'}" ${L(4)}/>`).join('')}`, -4, 1.3),

    flowers: () => {
      const pts = arcPts(440, 790, 226, -30, 7).map(([x, y], i) => [x, y - (x - 440) * 0.05]);
      const kinds = [['#ffffff', '#f6d860'], ['#f7a8c4', '#fff3b0'], ['#c9b3ee', '#f6d860'], ['#fff3b0', '#f39a6c']];
      let leaves = '', fl = '';
      pts.forEach(([x, y], i) => {
        leaves += `<ellipse cx="${x + 22}" cy="${y + 10}" rx="22" ry="10" transform="rotate(${i % 2 ? 30 : -20} ${x} ${y})" fill="#9fd68e" ${L(5)}/>`;
        const [p, c] = kinds[i % kinds.length];
        fl += flower(x, y, i % 2 ? 40 : 48, p, c);
      });
      return leaves + fl;
    },

    beret: (rb) => at(630, 178, `
      <path d="M-220 30 C-226 -46 -120 -96 10 -96 C150 -96 236 -50 226 22 C218 74 120 92 0 92 C-120 92 -216 76 -220 30Z" fill="#6f86c6" ${L(9)}/>
      <path d="M-120 -56 C-70 -76 0 -80 50 -72" fill="none" stroke="#a9b8e6" stroke-width="12" stroke-linecap="round"/>
      <path d="M-170 66 Q0 110 170 66 L166 94 Q0 136 -166 94Z" fill="#5a6fb0" ${L(8)}/>
      <path d="M6 -96 C2 -116 12 -128 26 -124 C36 -114 30 -102 24 -94Z" fill="#6f86c6" ${L(6)}/>
      ${at(160, 76, bow(rb, 90), 10)}`, -8),

    witch: () => at(615, 200, `
      <ellipse cx="0" cy="0" rx="250" ry="56" fill="#8a6bc4" ${L(9)}/>
      <path d="M-150 -10 C-130 -110 -80 -220 -10 -290 C20 -320 76 -330 104 -300 C64 -296 40 -264 52 -220 C80 -140 120 -70 150 -10 Q0 18 -150 -10Z" fill="#8a6bc4" ${L(9)}/>
      <path d="M-148 -18 Q0 12 148 -18 L136 -64 Q0 -36 -138 -64Z" fill="#f6a24a" ${L(8)}/>
      ${at(-6, -40, `<path d="${starPath(26, 11)}" fill="#ffe27a" ${L(6)}/>`)}
      ${at(-50, -160, `<path d="${starPath(14, 6)}" fill="#ffe27a" ${L(4)}/>`, 15)}`, -6),

    santa: () => at(615, 204, `
      <path d="M-170 -6 C-150 -150 -40 -240 90 -236 C180 -232 248 -180 270 -110 C224 -150 160 -156 126 -126 C160 -82 168 -36 164 -6Z" fill="#e5484d" ${L(9)}/>
      <rect x="-196" y="-36" width="392" height="70" rx="35" fill="#fffaf2" ${L(9)}/>
      <circle cx="272" cy="-112" r="42" fill="#fffaf2" ${L(9)}/>`, -6),

    glasses: () => `<g>
      <circle cx="${EYE_L[0]}" cy="${EYE_L[1]}" r="58" fill="#ffffff" fill-opacity=".18" stroke="#c99a3e" stroke-width="10"/>
      <circle cx="${EYE_R[0]}" cy="${EYE_R[1]}" r="58" fill="#ffffff" fill-opacity=".18" stroke="#c99a3e" stroke-width="10"/>
      <circle cx="${EYE_L[0]}" cy="${EYE_L[1]}" r="64" fill="none" ${L(4)}/><circle cx="${EYE_R[0]}" cy="${EYE_R[1]}" r="64" fill="none" ${L(4)}/>
      <path d="M${EYE_L[0] + 58} ${EYE_L[1] - 8} Q612 296 ${EYE_R[0] - 58} ${EYE_R[1] - 6}" fill="none" stroke="#c99a3e" stroke-width="10" stroke-linecap="round"/>
      ${glassesArms('#c99a3e', 9)}
      <path d="M${EYE_L[0] - 34} ${EYE_L[1] - 24} A40 40 0 0 1 ${EYE_L[0] - 6} ${EYE_L[1] - 42}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
      <path d="M${EYE_R[0] - 34} ${EYE_R[1] - 24} A40 40 0 0 1 ${EYE_R[0] - 6} ${EYE_R[1] - 42}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
    </g>`,

    heartglasses: () => `<g>
      ${[EYE_L, EYE_R].map(([x, y]) => at(x, y + 4, `<path d="${HEART}" transform="translate(-16 -15)" fill="#ff8fb4" fill-opacity=".55" ${L(1.3, '#c8336a')}/>`, -4, 4.4)).join('')}
      <path d="M${EYE_L[0] + 60} ${EYE_L[1] - 14} Q612 300 ${EYE_R[0] - 60} ${EYE_R[1] - 12}" fill="none" stroke="#c8336a" stroke-width="10" stroke-linecap="round"/>
      ${glassesArms('#c8336a', 9)}
    </g>`,

    starglasses: () => `<g>
      ${[EYE_L, EYE_R].map(([x, y]) => at(x, y + 4, `<path d="${starPath(76, 40)}" fill="#fff3a8" fill-opacity=".45" stroke="#e8a92a" stroke-width="11" stroke-linejoin="round"/><path d="${starPath(82, 44)}" fill="none" ${L(4)}/>`, -4)).join('')}
      <path d="M${EYE_L[0] + 64} ${EYE_L[1] - 12} Q612 300 ${EYE_R[0] - 64} ${EYE_R[1] - 10}" fill="none" stroke="#e8a92a" stroke-width="10" stroke-linecap="round"/>
      ${glassesArms('#e8a92a', 9)}
    </g>`,

    pearl: () => {
      const pts = arcPts(468, 768, 616, 86, 13);
      return pts.map(([x, y]) => pearl(x, y, 14)).join('') +
        `<path d="M618 700 C640 728 636 760 618 764 C600 760 596 728 618 700Z" fill="#fbf7f2" ${L(5)}/>`;
    },

    bell: () => `<g>
      <path d="M440 604 Q617 652 800 600 L802 630 Q617 684 438 634Z" fill="#e5484d" ${L(8)}/>
      ${at(618, 690, `
        <circle cx="0" cy="0" r="44" fill="#f6d860" ${L(8)}/>
        <path d="M-42 -6 Q0 10 42 -6" fill="none" ${L(6)}/>
        <circle cx="0" cy="16" r="8" fill="${INK}"/><path d="M0 18 L0 40" ${L(6)}/>
        <ellipse cx="-16" cy="-20" rx="11" ry="6" fill="#fff" transform="rotate(-30 -16 -20)"/>`)}
    </g>`,

    locket: () => `<g>
      <path d="M470 612 Q540 700 618 712 Q700 700 768 610" fill="none" stroke="#c99a3e" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>
      ${heart(618, 742, 2.6, '#f39ab6', 2.6)}
      <ellipse cx="604" cy="730" rx="8" ry="5" fill="#fff" transform="rotate(-30 604 730)"/>
    </g>`,

    wings: () => `<g>
      <path d="M470 700 C400 600 280 540 220 590 C170 640 230 720 300 740 C240 770 220 850 280 870 C340 890 420 820 470 780Z" fill="#e6dcfb" ${L(8)}/>
      <path d="M760 700 C830 600 950 540 1010 590 C1060 640 1000 720 930 740 C990 770 1010 850 950 870 C890 890 810 820 760 780Z" fill="#e6dcfb" ${L(8)}/>
      <path d="M440 720 C380 660 300 620 260 630 M440 760 C380 780 320 820 300 850 M790 720 C850 660 930 620 970 630 M790 760 C850 780 910 820 930 850" fill="none" stroke="#b39ce6" stroke-width="7" stroke-linecap="round"/>
      ${[[260, 600], [970, 600], [300, 860], [930, 860]].map(([x, y]) => at(x, y, `<path d="${starPath(18, 7, 4)}" fill="#fff3a8" ${L(4)}/>`)).join('')}
    </g>`,

    tailbow: (rb) => at(930, 1045, bow(rb, 170), -24),

    // みみの リボン（おしゃれの リボン）。結び目が (0, 0)
    earbow: (rb) => bow(rb, 190),

    // 料理ゲームの ぼうし（要件定義書 5.11 F-A2）
    chefhat: () => at(615, 190, `
      <path d="M-150 -30 C-230 -60 -220 -190 -120 -190 C-110 -270 30 -290 60 -210 C120 -280 250 -230 210 -130 C270 -110 250 -20 160 -30 Z" fill="#ffffff" ${L(9)}/>
      <path d="M-160 -40 Q0 -16 168 -40 L170 40 Q0 64 -170 40Z" fill="#ffffff" ${L(9)}/>
      <path d="M-60 -130 q20 -40 60 -30 M60 -150 q30 -20 60 10" fill="none" stroke="#e9e0e4" stroke-width="10" stroke-linecap="round"/>`, -4),
    kerchief: () => at(615, 200, `
      <path d="M-230 30 C-200 -70 -110 -120 0 -120 C110 -120 200 -70 230 30 Q0 60 -230 30Z" fill="#f6a8c8" ${L(9)}/>
      ${[[-120, -40], [0, -70], [120, -40], [-60, 10], [60, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#ffffff"/>`).join('')}
      <path d="M200 20 l70 30 l-20 -60z" fill="#f6a8c8" ${L(8)}/>`, -4),
    catband: () => at(615, 210, `
      <path d="M-240 20 Q0 -30 240 20 L236 70 Q0 20 -236 70Z" fill="#9fd0f0" ${L(9)}/>
      <path d="M-170 10 L-150 -110 L-80 -10Z M170 10 L150 -110 L80 -10Z" fill="#9fd0f0" ${L(9)}/>
      <path d="M-148 -70 L-140 -20 L-110 -20Z M148 -70 L140 -20 L110 -20Z" fill="#f6a8c8"/>`, -4)
  };
  // リボンの色で 絵が かわるもの
  const BY_RIBBON = { beret: true, tailbow: true, earbow: true };

  // リボン「なし」のときの ベレーぼう・しっぽのリボンは ピンク（要件定義書 F-68）
  const ribbonOf = (id) => G.RIBBONS.find(r => r.id === id && r.id !== 'none') || G.RIBBONS.find(r => r.id === 'pink');
  const isCloth = (id) => !ART[id] && G.ClothesArt.has(id);
  const known = (id) => !!ART[id] || isCloth(id);
  /* 絵の SVG。opts = { noL: 左の そでを 描かない, color: ふくの 色（なければ えらんでいる色） } */
  function markup(id, ribbonId, opts) {
    if (isCloth(id)) {
      const o = opts || {};
      const c = G.CLOTHES.find(x => x.id === id);
      return G.ClothesArt.markup(id, o.color || G.State.clothColor(id) || (c && c.colors ? c.colors[0] : null), o);
    }
    return ART[id](ribbonOf(ribbonId));
  }
  function svgDoc(inner, box, scale) {
    const [x, y, w, h] = box;
    const size = scale ? ` width="${Math.round(w * scale)}" height="${Math.round(h * scale)}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"${size}>${DEFS}${inner}</svg>`;
  }
  const dataUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  /* 絵の はんい（face_normal の座標）。はじめて使うときに 1回だけ はかる */
  let boxes = null;
  function box(id) {
    if (!boxes) {
      boxes = {};
      const NS = 'http://www.w3.org/2000/svg';
      const s = document.createElementNS(NS, 'svg');
      s.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden');
      document.body.appendChild(s);
      Object.keys(ART).concat(G.ClothesArt.ids()).forEach(k => {
        const g = document.createElementNS(NS, 'g');
        g.innerHTML = markup(k, 'pink');
        s.appendChild(g);
        const b = g.getBBox();
        boxes[k] = [Math.floor(b.x - PAD), Math.floor(b.y - PAD), Math.ceil(b.width + PAD * 2), Math.ceil(b.height + PAD * 2)];
      });
      s.remove();
    }
    return boxes[id];
  }

  /* 画像にした絵。読みこみは あとから終わる */
  const imgs = new Map();
  function raster(id, ribbonId, opts) {
    const o = opts || {};
    let key = BY_RIBBON[id] ? id + '|' + ribbonId : id;
    if (isCloth(id)) key += '|' + G.State.clothColor(id) + '|' + (o.noL ? 1 : 0);
    let r = imgs.get(key);
    if (r) return r;
    r = { img: new Image(), ok: false };
    r.p = new Promise((res) => {
      r.img.onload = () => {
        const done = () => { r.ok = true; res(true); };
        if (r.img.decode) r.img.decode().then(done, done); else done();
      };
      r.img.onerror = () => res(false);
    });
    r.img.src = dataUrl(svgDoc(markup(id, ribbonId, o), box(id), RS));
    imgs.set(key, r);
    return r;
  }

  /* その絵で つけられる場所（G.CHARACTER.accessory）。書いていない絵・場所は つけない */
  function anchors(k) {
    const T = G.CHARACTER.accessory;
    let a = T.poses[k], n = 0;
    while (typeof a === 'string' && n++ < 5) a = T.poses[a];
    return a && typeof a === 'object' ? a : null;
  }

  /*
   * いま つけるもの。k = 下ごしらえした絵の名前、geo = その絵の変換（G.CharaArt.geo）
   * かえすもの：{ id, slot, back, m: [a, b, c, d, e, f]（face_normal の座標 → canvas の座標）, r: 画像 }
   */
  function layout(k, geo, wear, ribbonId, hide) {
    const A = anchors(k);
    if (!A || !geo) return [];
    const P = G.CHARACTER.accessory.pivot;
    const out = [];
    FRONT.concat(BACK).forEach(slot => {
      const id = slot === 'bow' ? (ribbonId && ribbonId !== 'none' ? 'earbow' : null) : wear[slot];
      const at = slot === 'bow' ? 'bow' + (G.State.ribbonSide() === 'left' ? 'L' : 'R') : slot; // リボンは えらんだ みみ
      if (!id || !known(id) || !A[at] || !P[slot] || (hide && hide.indexOf(slot) >= 0)) return;
      const [tx, ty, rot, sc, opts] = A[at], [px, py] = P[slot];
      const th = rot * Math.PI / 180, k2 = sc * geo.s;
      const a = Math.cos(th) * k2, b = Math.sin(th) * k2;
      // canvas = (T + R·sc·(p − P))·s − (x0, y0)
      const e = tx * geo.s - geo.x0 - (a * px - b * py), f = ty * geo.s - geo.y0 - (b * px + a * py);
      out.push({ id, slot, back: BACK.indexOf(slot) >= 0, m: [a, b, -b, a, e, f], r: raster(id, ribbonId, opts) });
    });
    // まえのものは FRONT の順に
    return out.sort((x, y) => (FRONT.indexOf(x.slot) - FRONT.indexOf(y.slot)));
  }
  /* 絵の はんい（canvas の座標）。layout の1つずつ */
  function bounds(it) {
    const [x, y, w, h] = box(it.id), [a, b, c, d, e, f] = it.m;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([u, v]) => {
      const X = a * u + c * v + e, Y = b * u + d * v + f;
      x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
    });
    return [x0, y0, x1, y1];
  }
  /* ctx に描く（ctx はすでに canvas の座標に そろえてある） */
  function draw(ctx, it) {
    if (!it.r.ok) return false;
    const [x, y, w, h] = box(it.id);
    ctx.save();
    ctx.transform.apply(ctx, it.m);
    ctx.drawImage(it.r.img, x, y, w, h);
    ctx.restore();
    return true;
  }

  /* ボタン・おしらせ用の見本（<img>） */
  function swatch(id, ribbonId, cls = '', opts) {
    const el = document.createElement('img');
    el.className = 'art acc-art ' + cls;
    el.draggable = false;
    el.alt = '';
    el.src = dataUrl(svgDoc(markup(id, ribbonId || G.State.ribbon(), opts), box(id)));
    return el;
  }

  /* つけている絵を 先に画像にしておく */
  function warm(wear, ribbonId) {
    Object.values(wear).forEach(id => { if (id && known(id)) raster(id, ribbonId); });
  }

  /* ふくだけの 絵（基準画と 同じ 1254px の わく）。tf = SVG の transform（ニューちゃんの 体に 合わせる など） */
  function clothesDataUrl(id, opts, tf = '') {
    if (!isCloth(id)) return '';
    return dataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="1254" height="1254">${DEFS}<g transform="${tf}">${markup(id, null, opts)}</g></svg>`);
  }

  /* たしかめ用（tools/check_svg.js）：その アクセサリーの SVG */
  const swatchSvg = (id, ribbonId) => markup(id, ribbonId);

  return { layout, bounds, draw, swatch, warm, clothesDataUrl, swatchSvg };
})();
