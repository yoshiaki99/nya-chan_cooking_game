/* おりょうりの 道具と、つくっている とちゅうの 食べものの 絵（js/steps.js・js/steps2.js・js/screens/cook.js で つかう）
 * ・名前（キー）ごとに 1まいの 絵。水彩の 画像（js/data.js の ART_FILES）が あれば それを、なければ ここの 線画を 出す。
 * ・G.Art.pic(key)        … その 絵の SVG（画像が あれば <image> を 1つ 入れた SVG）
 * ・G.Art.fade(a, b, t)   … a の 絵の 上に b の 絵を こさ t で かさねる（だんだん やける・まざる など）
 * ・G.Art.hasPic(key)     … 水彩の 画像が あるか
 * 画像は もとの 絵と 同じ 大きさ（viewBox）・同じ 場所に 描いて あるので、そのまま 入れかえられる。
 */
window.G = window.G || {};

(function () {
  const svg = G.Art.svg;
  const INK = '#3b3236';
  const ink = (w = 4, col = INK) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  /* ---------- 画像との 入れかえ ---------- */
  const vbCache = {};
  const fileOf = (key) => {
    const src = G.ART_FILES && G.ART_FILES[key];
    return src && (!G.ASSET_FILES || G.ASSET_FILES.indexOf(src) >= 0) ? src : null;
  };
  const vbOf = (key) => {
    if (!vbCache[key]) {
      const f = G.Art.all[key];
      const m = f ? /viewBox="([^"]+)"/.exec(f()) : null;
      vbCache[key] = m ? m[1] : '0 0 100 100';
    }
    return vbCache[key];
  };
  const image = (key, extra = '') => {
    const [x, y, w, h] = vbOf(key).split(/\s+/).map(Number);
    return `<image href="${fileOf(key)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${extra}/>`;
  };
  const strip = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  G.Art.hasPic = (key) => !!fileOf(key);
  G.Art.pic = (key) => {
    if (fileOf(key)) return svg(vbOf(key), image(key));
    const f = G.Art.all[key];
    return f ? f() : '';
  };
  /* つかう まえに ファイルを 読んでおく（はじめて 出す ときに 一瞬 からっぽに ならないように）。
   * 画像そのものは もたない（ブラウザの キャッシュに 入るだけ） */
  G.Art.warm = (keys) => {
    keys.forEach(k => { const src = fileOf(k); if (src) { const im = new Image(); im.decoding = 'async'; im.src = src; } });
  };
  G.Art.fade = (a, b, t) => {
    t = Math.max(0, Math.min(1, t));
    if (fileOf(a) && fileOf(b)) return svg(vbOf(a), image(a) + (t > 0 ? image(b, ` opacity="${t.toFixed(2)}"`) : ''));
    return svg(vbOf(a), strip(G.Art.pic(a)) + (t > 0 ? `<g opacity="${t.toFixed(2)}">${strip(G.Art.pic(b))}</g>` : ''));
  };

  /* ---------- 作業場の 下じき（650×680） ---------- */
  const W = (body) => svg('0 0 650 680', body);
  const wk = {
    wk_board: () => W(`<rect x="40" y="300" width="570" height="330" rx="28" fill="#f2d3a8" ${ink(5)}/>
      <rect x="70" y="330" width="510" height="270" rx="18" fill="none" stroke="#e2bd8c" stroke-width="5"/>`),
    wk_counter: () => W(`<rect x="20" y="60" width="610" height="600" rx="30" fill="#e8e6ee" ${ink(5)}/>`),
    wk_sink: () => W(`<rect x="40" y="200" width="570" height="420" rx="40" fill="#c9c9d6" ${ink(5)}/>
      <rect x="80" y="240" width="490" height="340" rx="30" fill="#d9ecf3" ${ink(4)}/>
      <path d="M480 60 V140 Q480 170 450 170 H420" fill="none" stroke="#a6a6c0" stroke-width="24" stroke-linecap="round"/>
      <path d="M480 60 V140 Q480 170 450 170 H420" fill="none" ${ink(4)}/>`),
    wk_oven: () => W(`<rect x="40" y="60" width="570" height="560" rx="40" fill="#fffaf0" ${ink(6)}/>
      <rect x="90" y="170" width="470" height="330" rx="26" fill="#3d3a48" ${ink(5)}/>
      <rect x="160" y="110" width="330" height="26" rx="13" fill="#d9d6de" ${ink(4)}/>`),
    wk_fridge: () => W(`<rect x="160" y="30" width="330" height="620" rx="30" fill="#eaf6fb" ${ink(6)}/>
      <path d="M180 250 H470 M180 450 H470" stroke="#9ccdf0" stroke-width="10"/>`),
    tool_pan: () => W(`<path d="M470 410 L630 470" stroke="${INK}" stroke-width="34" stroke-linecap="round"/><path d="M470 410 L630 470" stroke="#5a5060" stroke-width="22" stroke-linecap="round"/>
      <circle cx="300" cy="340" r="230" fill="#6e6878" ${ink(6)}/><circle cx="300" cy="340" r="196" fill="#8a8494"/>`)
  };

  /* ---------- 道具 ---------- */
  const handle = (d) => `<path d="${d}" ${ink(14, '#e9c48c')}/><path d="${d}" fill="none" ${ink(4)}/>`;
  const tools = {
    tool_ricecooker: () => svg('0 0 240 260', `
      <rect x="20" y="70" width="200" height="170" rx="40" fill="#fffaf0" ${ink(5)}/>
      <path d="M30 80 Q120 10 210 80" fill="#f6a8c8" ${ink(5)}/>
      <rect x="90" y="150" width="60" height="30" rx="8" fill="#9ccdf0" ${ink(4)}/>
      <path d="M40 40 q10 -20 20 0 M80 24 q10 -20 20 0" fill="none" stroke="#c9c9d6" stroke-width="5" stroke-linecap="round"/>`),
    tool_shamoji: () => svg('0 0 90 150', `${handle('M45 150 V70')}<ellipse cx="45" cy="44" rx="34" ry="42" fill="#f6e2c0" ${ink(5)}/>`),
    tool_wrap: () => svg('0 0 320 220', `<path d="M10 120 L60 30 H280 L310 130 L250 210 H40Z" fill="#eef7fb" opacity=".9" ${ink(4)}/>`),
    tool_knife_cut: () => svg('0 0 120 120', `<path d="M20 100 L70 50 L90 30 Q100 40 90 60 L40 110Z" fill="#e8e8f0" ${ink(4)}/>${handle('M20 100 L4 116')}`),
    tool_knife: () => svg('0 0 120 120', `<path d="M60 10 L60 70 L84 70 Q90 40 60 10Z" fill="#e8e8f0" ${ink(4)}/><path d="M66 72 V112" stroke="#e9b26e" stroke-width="16" stroke-linecap="round"/><path d="M66 72 V112" fill="none" ${ink(4)}/>`),
    tool_bowl_back: () => svg('0 0 400 300', `<ellipse cx="200" cy="90" rx="180" ry="60" fill="#d9ecf3" ${ink(6)}/>`),
    tool_bowl_front: () => svg('0 0 400 300', `<path d="M20 90 Q30 280 200 284 Q370 280 380 90 Q200 170 20 90Z" fill="#9ccdf0" ${ink(6)}/>`),
    tool_bowl_top: () => svg('0 0 460 460', `<circle cx="230" cy="230" r="220" fill="#9ccdf0" ${ink(6)}/><circle cx="230" cy="230" r="186" fill="#d9ecf3" ${ink(4)}/>`),
    tool_whisk: () => svg('0 0 130 260', `${handle('M65 250 V150')}
      <path d="M65 150 C10 120 20 20 65 10 C110 20 120 120 65 150Z M65 150 C40 110 45 30 65 10 C85 30 90 110 65 150Z" fill="none" stroke="#a6a6c0" stroke-width="6"/>`),
    tool_knob: () => svg('0 0 110 110', `<circle cx="55" cy="55" r="48" fill="#fff" ${ink(5)}/><rect x="47" y="14" width="16" height="50" rx="8" fill="#f37d9b" ${ink(3)}/>`),
    tool_spatula: () => svg('0 0 200 180', `${handle('M60 70 L180 170')}<rect x="0" y="20" width="100" height="70" rx="12" fill="#c9c9d6" ${ink(5)} transform="rotate(40 50 55)"/>`),
    tool_pin: () => svg('0 0 400 80', `<rect x="60" y="20" width="280" height="44" rx="22" fill="#f6e2c0" ${ink(5)}/>
      <rect x="4" y="30" width="64" height="24" rx="12" fill="#e9c48c" ${ink(4)}/><rect x="332" y="30" width="64" height="24" rx="12" fill="#e9c48c" ${ink(4)}/>`),
    tool_oven_dial: () => svg('0 0 90 90', `<circle cx="45" cy="45" r="36" fill="#fff" ${ink(4)}/><path d="M45 45 V16" ${ink(6)}/>`),
    tool_oven_tray: () => svg('0 0 300 160', `<rect x="10" y="100" width="280" height="20" rx="8" fill="#a6a6c0" ${ink(3)}/>`),
    tool_pot: () => svg('0 0 500 500', `<path d="M10 250 H60 M440 250 H490" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
      <circle cx="250" cy="250" r="200" fill="#f6a8a0" ${ink(6)}/><circle cx="250" cy="250" r="172" fill="#c9c9d6" ${ink(4)}/>`),
    tool_ladle: () => svg('0 0 150 300', `<path d="M75 0 V200" stroke="#a6a6c0" stroke-width="16" stroke-linecap="round"/><ellipse cx="75" cy="230" rx="50" ry="36" fill="#c9c9d6" ${ink(4)}/>`),
    tool_ladle_curry: () => svg('0 0 180 200', `<path d="M150 0 L80 120" stroke="#a6a6c0" stroke-width="16" stroke-linecap="round"/><ellipse cx="70" cy="140" rx="54" ry="36" fill="#d9902e" ${ink(4)}/>`),
    tool_pour_bowl: () => svg('0 0 220 160', `<path d="M10 40 Q20 150 110 150 Q200 150 210 40Z" fill="#9ccdf0" ${ink(5)}/><ellipse cx="110" cy="40" rx="100" ry="24" fill="#ffe08a" ${ink(4)}/>`),
    tool_fridge_door: () => svg('0 0 330 620', `<rect x="0" y="0" width="330" height="620" rx="30" fill="#fffdf8" ${ink(6)}/><rect x="270" y="200" width="20" height="200" rx="10" fill="#d9d6de" ${ink(4)}/>`),
    tool_tray: () => svg('0 0 600 200', `<rect x="10" y="40" width="580" height="140" rx="30" fill="#f8c6d3" ${ink(5)}/><rect x="34" y="60" width="532" height="100" rx="20" fill="#fde3ea"/>`),
    tool_shelf: () => svg('0 0 640 60', `<rect x="10" y="10" width="620" height="34" rx="10" fill="#e9c48c" ${ink(5)}/>`),
    tool_gfridge_in: () => svg('0 0 310 700', `<rect x="6" y="6" width="298" height="688" rx="28" fill="#eaf6fb" ${ink(6)}/>
      <path d="M20 250 H290 M20 470 H290" stroke="#9ccdf0" stroke-width="8"/>`),
    tool_gfridge_door: () => svg('0 0 310 700', `<rect x="6" y="6" width="298" height="688" rx="28" fill="#fffdf8" ${ink(6)}/>
      <path d="M6 300 H304" ${ink(5)}/><rect x="250" y="80" width="20" height="150" rx="10" fill="#d9d6de" ${ink(4)}/>
      <rect x="250" y="360" width="20" height="200" rx="10" fill="#d9d6de" ${ink(4)}/>`),
    tool_cloth: () => svg('0 0 100 100', `<path d="M16 30 Q50 14 84 30 L78 78 Q50 90 22 78Z" fill="#9ccdf0" ${ink(4)}/><path d="M26 44 h48M28 60 h44" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`)
  };

  /* ---------- つくっている とちゅうの 食べもの ---------- */
  const grains = (pts, rx = 7, ry = 4) => pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ece6d8"/>`).join('');
  const ricePile = (lv) => {
    const w = 50 + lv * 26, h = 30 + lv * 26;
    return svg('0 0 260 220', `<path d="M${130 - w} 175 C${130 - w} ${175 - h} ${130 - w / 2} ${175 - h * 1.25} 130 ${175 - h * 1.25} C${130 + w / 2} ${175 - h * 1.25} ${130 + w} ${175 - h} ${130 + w} 175 Q130 190 ${130 - w} 175Z" fill="#fff" ${ink(5)}/>
      ${Array.from({ length: lv * 3 }, (_, i) => `<ellipse cx="${130 - w * 0.6 + ((i * 41) % (w * 1.2))}" cy="${170 - ((i * 23) % Math.max(10, h))}" rx="6" ry="3.5" fill="#ece6d8"/>`).join('')}`);
  };
  /* おにぎりの 形（0 = ひらたい ごはん、1 = まるい、2 = まるい さんかく、3 = さんかく）。ぐ は G.Art.onigiri で かさねる */
  const RICE_SHAPES = [
    'M70 236 C70 150 140 120 200 120 C260 120 330 150 330 236 Q200 262 70 236Z',
    'M200 70 C280 70 320 140 320 190 C320 240 270 260 200 260 C130 260 80 240 80 190 C80 140 120 70 200 70Z',
    'M200 56 C250 56 320 150 322 200 C322 248 276 262 200 262 C124 262 78 248 78 200 C80 150 150 56 200 56Z',
    'M200 40 C240 40 330 170 330 210 C330 250 280 262 200 262 C120 262 70 250 70 210 C70 170 160 40 200 40Z'
  ];
  const riceBall = (s) => `<path d="${RICE_SHAPES[s]}" fill="#fff" ${ink(6)}/>${grains([[170, 190], [230, 200], [150, 215], [250, 222], [200, 180]])}`;
  const NORI = `<path d="M140 196 H260 V262 Q200 266 140 262Z" fill="#33473a" ${ink(5)}/><path d="M152 214h96M152 236h96" stroke="#4f6a57" stroke-width="4"/>`;
  const BREAD_IN = 'M70 352 V146 Q54 134 58 102 Q66 58 200 58 Q334 58 342 102 Q346 134 330 146 V352Z';
  const bread = (buttered) => svg('0 0 400 400', `<path d="M40 380 V130 Q20 120 24 80 Q34 20 200 24 Q366 20 376 80 Q380 120 360 130 V380Z" fill="#e9b26e" ${ink(6)}/>
    <path d="M62 360 V140 Q44 130 48 96 Q58 48 200 48 Q342 48 352 96 Q356 130 338 140 V360Z" fill="#fff3d6"/>${buttered ? `<path d="${BREAD_IN}" fill="#ffe27a" opacity=".8"/>` : ''}`);
  // はさむ ぐ（いちばん下の 1まいめの 場所。2まいめから 上に ずらして かさねる）
  const FILL_COLORS = { egg: '#ffe27a', tuna: '#f6d9b0', cucumber: '#7cc46e', cheese: '#ffd24d', jam: '#f2577e', salmon: '#f8a58a', okaka: '#c98a5a' };
  const fillLayer = (id) => {
    const y = 300, c = FILL_COLORS[id] || '#fff3b0';
    if (id === 'cucumber') return [0, 1, 2, 3, 4].map(k => `<circle cx="${110 + k * 45}" cy="${y - 60 + (k % 2) * 30}" r="28" fill="#a6d98e" ${ink(4)}/><circle cx="${110 + k * 45}" cy="${y - 60 + (k % 2) * 30}" r="12" fill="#e6f5d8"/>`).join('');
    if (id === 'cheese') return `<rect x="80" y="${y - 150}" width="240" height="170" rx="6" fill="${c}" ${ink(4)}/><circle cx="160" cy="${y - 90}" r="10" fill="#f2b84a"/><circle cx="240" cy="${y - 40}" r="14" fill="#f2b84a"/>`;
    return `<path d="M80 ${y} Q70 ${y - 160} 200 ${y - 170} Q330 ${y - 160} 320 ${y}Q200 ${y + 20} 80 ${y}Z" fill="${c}" ${ink(4)}/>`;
  };
  const sandHalf = (side) => {
    const d = side ? 'M40 40 L360 40 L360 360Z' : 'M40 40 L40 360 L360 360Z';
    return svg('0 0 400 400', `<path d="${d}" fill="#fff3d6" stroke="#e9b26e" stroke-width="22" stroke-linejoin="round"/><path d="${d}" fill="none" ${ink(6)}/>`);
  };
  const lerpC = (a, b, t) => {
    const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const batter = (p) => {
    const lerp = (x, y) => Math.round(x + (y - x) * p);
    return svg('0 0 460 460', `<circle cx="230" cy="230" r="170" fill="rgb(${lerp(255, 247)},${lerp(250, 222)},${lerp(240, 160)})"/>
      ${p < 1 ? `<circle cx="270" cy="200" r="36" fill="#ffc83d"/><path d="M130 260 q40 -60 90 -10 q30 30 -20 60 q-50 20 -70 -50z" fill="#fff"/><circle cx="200" cy="300" r="30" fill="#f2f6fb"/>` : ''}`);
  };
  const pancake = (side) => side === 'top'
    ? svg('0 0 400 400', `<circle cx="200" cy="200" r="170" fill="#f7dfa0" ${ink(5)}/>${[[150, 150], [240, 130], [270, 230], [170, 260], [210, 200], [120, 220]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#efc77c" stroke="#d9a85e" stroke-width="3"/>`).join('')}`)
    : svg('0 0 400 400', `<circle cx="200" cy="200" r="170" fill="#d98e44" ${ink(5)}/><circle cx="200" cy="200" r="120" fill="#e9a65e"/><ellipse cx="160" cy="150" rx="40" ry="14" fill="#fff" opacity=".35" transform="rotate(-25 160 150)"/>`);
  const P = (body) => svg('0 0 400 400', body);
  const panRice = (p) => P(`<circle cx="200" cy="200" r="150" fill="${lerpC('#ffffff', '#f6c27a', p)}" ${ink(4)}/>${[[140, 160], [230, 140], [260, 230], [170, 250], [210, 200], [120, 220]].map(([x, y], i) => i % 2 ? `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="4" fill="#f6a24a"/>` : `<rect x="${x - 10}" y="${y - 8}" width="20" height="16" rx="5" fill="#f8c8b0"/>`).join('')}`);
  const panOmelet = (p) => P(`<circle cx="200" cy="200" r="160" fill="${lerpC('#fff3b0', '#ffd95a', p)}" ${ink(4)}/><ellipse cx="200" cy="200" rx="90" ry="60" fill="#f6c27a" opacity="${p}"/>`);
  const panFish = (bottom) => P(`<path d="M60 200 Q140 120 260 160 L340 120 L330 200 L340 280 L260 240 Q140 280 60 200Z" fill="${bottom ? '#e9b26e' : '#cfe3f7'}" ${ink(5)}/><circle cx="110" cy="190" r="8" fill="${INK}"/>${bottom ? '<path d="M170 170 l20 20 l-20 20 M220 170 l20 20 l-20 20" fill="none" stroke="#b97a3e" stroke-width="7"/>' : ''}`);
  const panHamburg = (bottom) => P([140, 270].map(x => `<ellipse cx="${x}" cy="200" rx="80" ry="58" fill="${bottom ? '#a8683e' : '#f2a59a'}" ${ink(5)}/>`).join(''));
  const DOUGH = [
    'M90 200 Q60 120 140 110 Q170 60 230 100 Q310 80 320 160 Q350 230 280 250 Q220 280 160 250 Q90 260 90 200Z',
    'M80 190 Q70 110 150 100 Q200 70 260 100 Q330 120 320 190 Q320 250 240 262 Q160 270 110 250 Q80 230 80 190Z',
    'M200 70 C280 70 320 120 320 180 C320 240 270 270 200 270 C130 270 80 240 80 180 C80 120 120 70 200 70Z',
    'M60 180 Q60 110 200 108 Q340 110 340 180 Q340 250 200 252 Q60 250 60 180Z'
  ];
  const dough = (s, color) => svg('0 0 400 300', `<path d="${DOUGH[s]}" fill="${color}" ${ink(6)}/><ellipse cx="160" cy="140" rx="34" ry="12" fill="#fff" opacity=".35" transform="rotate(-20 160 140)"/>`);
  /* かたぬきの 形（viewBox 0 0 100 100 の まんなかに 半径 r） */
  const cutterShape = (k, x, y, r, fill, stroke = INK) => {
    if (k === 'heart') return `<path d="M${x} ${y + r * 0.8} C${x - r * 1.3} ${y - r * 0.1} ${x - r * 0.7} ${y - r * 1.1} ${x} ${y - r * 0.4} C${x + r * 0.7} ${y - r * 1.1} ${x + r * 1.3} ${y - r * 0.1} ${x} ${y + r * 0.8}Z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
    if (k === 'star') {
      let d = '';
      for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; d += (i ? 'L' : 'M') + (x + Math.cos(t) * rr).toFixed(1) + ' ' + (y + Math.sin(t) * rr).toFixed(1); }
      return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
    }
    return `<path d="M${x - r} ${y + r * 0.6} Q${x - r} ${y - r * 0.5} ${x - r * 0.75} ${y - r} L${x - r * 0.35} ${y - r * 0.6} Q${x} ${y - r * 0.75} ${x + r * 0.35} ${y - r * 0.6} L${x + r * 0.75} ${y - r} Q${x + r} ${y - r * 0.5} ${x + r} ${y + r * 0.6} Q${x} ${y + r * 1.05} ${x - r} ${y + r * 0.6}Z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
  };
  const cookie = (k, baked) => svg('0 0 100 100', cutterShape(k, 50, 50, 44, baked ? '#e9b26e' : '#f7e7c4'));
  const B = (body) => svg('0 0 500 380', body);
  const O = (body) => svg('0 0 300 160', body);
  const cups = (done) => svg('0 0 250 130', [0, 1, 2].map(i => `<path d="M${20 + i * 80} 40 h60 l-8 70 h-44z" fill="${done ? '#ffe08a' : '#fff6d8'}" ${ink(4)}/><ellipse cx="${50 + i * 80}" cy="44" rx="30" ry="9" fill="${done ? '#a8683e' : '#ffe08a'}" ${ink(3)}/>`).join(''));
  const cup = (full) => svg('0 0 130 170', `<path d="M10 20 h110 l-14 140 h-82z" fill="#fff" ${ink(5)}/>${full ? '<path d="M14.8 56 h100.4 l-10 100 h-82z" fill="#ffe08a"/>' : ''}`);
  const soup = (color) => svg('0 0 500 500', `<circle cx="250" cy="250" r="164" fill="${color}"/>`);
  const curryPlate = (p) => svg('0 0 500 360', `<ellipse cx="250" cy="200" rx="230" ry="130" fill="#fff" ${ink(5)}/>
    <path d="M60 210 Q60 120 200 110 Q260 112 260 210 Q160 260 60 210Z" fill="#fff" ${ink(4)}/>
    ${p > 0 ? `<path d="M250 ${210 - 90 * p} Q${330 + 80 * p} 110 440 200 Q350 270 240 230Z" fill="#d9902e" ${ink(4)}/>` : ''}`);
  const rollup = (s) => {
    const w = 420 - s * 120;
    return svg('0 0 500 320', s < 3
      ? `<rect x="${40 + (420 - w)}" y="80" width="${w}" height="160" rx="14" fill="#f2bb74" ${ink(5)}/><rect x="${56 + (420 - w)}" y="96" width="${w - 32}" height="128" rx="10" fill="#fffaf0"/>
         ${s > 0 ? `<ellipse cx="${60 + (420 - w)}" cy="160" rx="${30 + s * 18}" ry="80" fill="#f2bb74" ${ink(5)}/>` : ''}`
      : `<rect x="70" y="90" width="360" height="140" rx="70" fill="#f2bb74" ${ink(5)}/><circle cx="420" cy="160" r="70" fill="#f2bb74" ${ink(5)}/><path d="M420 160 m-40 0 a40 40 0 1 1 40 40 a26 26 0 1 1 -16 -26" fill="none" stroke="#fffaf0" stroke-width="12"/>`);
  };

  const foods = {
    food_rice_pile1: () => ricePile(1), food_rice_pile2: () => ricePile(2), food_rice_pile3: () => ricePile(3),
    food_onigiri0: () => svg('0 0 400 300', riceBall(0)), food_onigiri1: () => svg('0 0 400 300', riceBall(1)),
    food_onigiri2: () => svg('0 0 400 300', riceBall(2)), food_onigiri3: () => svg('0 0 400 300', riceBall(3)),
    food_onigiri_nori: () => svg('0 0 400 300', riceBall(3) + NORI),
    food_bread: () => bread(false), food_bread_butter: () => bread(true),
    fill_egg: () => svg('0 0 400 400', fillLayer('egg')), fill_tuna: () => svg('0 0 400 400', fillLayer('tuna')),
    fill_cucumber: () => svg('0 0 400 400', fillLayer('cucumber')), fill_cheese: () => svg('0 0 400 400', fillLayer('cheese')),
    fill_jam: () => svg('0 0 400 400', fillLayer('jam')),
    food_sand_l: () => sandHalf(false), food_sand_r: () => sandHalf(true),
    food_bowl_flour: () => svg('0 0 400 300', `<ellipse cx="200" cy="96" rx="150" ry="44" fill="#fffaf0"/><path d="M110 92 q40 -36 90 -10 q30 -20 60 6" fill="#fff" ${ink(4)}/>`),
    food_bowl_egg: () => svg('0 0 400 300', `<ellipse cx="230" cy="100" rx="56" ry="20" fill="#fff" opacity=".9"/><circle cx="230" cy="96" r="22" fill="#ffc83d" ${ink(4)}/>`),
    food_batter0: () => batter(0), food_batter1: () => batter(1),
    food_pancake_top: () => pancake('top'), food_pancake_bottom: () => pancake('bottom'),
    pan_rice0: () => panRice(0), pan_rice1: () => panRice(1),
    pan_omelet0: () => panOmelet(0), pan_omelet1: () => panOmelet(1),
    pan_fish_top: () => panFish(false), pan_fish_bottom: () => panFish(true),
    pan_hamburg_top: () => panHamburg(false), pan_hamburg_bottom: () => panHamburg(true),
    food_dough0: () => dough(0, '#f3dcb0'), food_dough1: () => dough(1, '#f3dcb0'), food_dough2: () => dough(2, '#f3dcb0'),
    food_meat0: () => dough(0, '#f2a59a'), food_meat1: () => dough(1, '#f2a59a'), food_meat2: () => dough(2, '#f2a59a'), food_meat_oval: () => dough(3, '#f2a59a'),
    food_sushirice0: () => dough(0, '#ffffff'), food_sushirice1: () => dough(1, '#ffffff'), food_sushirice_oval: () => dough(3, '#ffffff'),
    food_dough_flat: () => svg('0 0 500 320', `<ellipse cx="250" cy="160" rx="230" ry="130" fill="#f3dcb0" ${ink(5)}/>`),
    food_dough_sheet: () => svg('0 0 500 320', `<rect x="20" y="30" width="460" height="260" rx="14" fill="#f3dcb0" ${ink(5)}/>`),
    cookie_raw_heart: () => cookie('heart', false), cookie_raw_star: () => cookie('star', false), cookie_raw_cat: () => cookie('cat', false),
    cookie_heart: () => cookie('heart', true), cookie_star: () => cookie('star', true), cookie_cat: () => cookie('cat', true),
    base_pizza: () => B(`<ellipse cx="250" cy="190" rx="230" ry="150" fill="#f3dcb0" ${ink(5)}/>`),
    base_pizza_sauce: () => B(`<ellipse cx="250" cy="190" rx="230" ry="150" fill="#f3dcb0" ${ink(5)}/><ellipse cx="250" cy="190" rx="200" ry="124" fill="#e8473c"/>`),
    base_cake: () => B(`<ellipse cx="250" cy="190" rx="200" ry="130" fill="#f7cd8c" ${ink(5)}/><ellipse cx="250" cy="190" rx="170" ry="104" fill="#fbe2b0"/>`),
    base_cake_cream: () => B(`<ellipse cx="250" cy="190" rx="200" ry="130" fill="#f7cd8c" ${ink(5)}/><ellipse cx="250" cy="190" rx="186" ry="118" fill="#fffaf0"/>`),
    base_sheet: () => B(`<rect x="40" y="70" width="420" height="240" rx="16" fill="#f7cd8c" ${ink(5)}/>`),
    base_sheet_cream: () => B(`<rect x="40" y="70" width="420" height="240" rx="16" fill="#f7cd8c" ${ink(5)}/><rect x="60" y="90" width="380" height="200" rx="12" fill="#fffaf0"/>`),
    oven_pizza_raw: () => O(`<ellipse cx="150" cy="80" rx="130" ry="56" fill="#f3dcb0" ${ink(4)}/><ellipse cx="150" cy="80" rx="110" ry="44" fill="#e8473c"/>`),
    oven_pizza: () => O(`<ellipse cx="150" cy="80" rx="130" ry="56" fill="#e9b26e" ${ink(4)}/><ellipse cx="150" cy="80" rx="110" ry="44" fill="#e8473c"/><path d="M70 74 q80 -40 160 0 q-40 30 -160 0z" fill="#ffe8a8"/>`),
    oven_sponge_raw: () => O(`<path d="M40 60 h220 v60 h-220z" fill="#9ccdf0" ${ink(4)}/><ellipse cx="150" cy="60" rx="110" ry="20" fill="#fbe7b0" ${ink(3)}/>`),
    oven_sponge: () => O(`<path d="M40 40 h220 v80 h-220z" fill="#9ccdf0" ${ink(4)}/><path d="M40 40 Q150 -10 260 40Z" fill="#e9a65e" ${ink(4)}/>`),
    oven_pie_raw: () => O(`<ellipse cx="150" cy="80" rx="130" ry="50" fill="#f3dcb0" ${ink(4)}/><ellipse cx="150" cy="78" rx="104" ry="36" fill="#f6b25a"/>`),
    oven_pie: () => O(`<ellipse cx="150" cy="80" rx="130" ry="50" fill="#e9b26e" ${ink(4)}/><ellipse cx="150" cy="78" rx="104" ry="36" fill="#e8902e"/><path d="M80 60 L220 96 M80 96 L220 60 M150 44 V112" stroke="#f3cf90" stroke-width="10" stroke-linecap="round"/>`),
    oven_sheet_raw: () => O(`<rect x="30" y="50" width="240" height="70" rx="8" fill="#fbe7b0" ${ink(4)}/>`),
    oven_sheet: () => O(`<rect x="30" y="50" width="240" height="70" rx="8" fill="#f2bb74" ${ink(4)}/>`),
    soup_water: () => soup('#d9ecf3'), soup_curry: () => soup('#d9902e'), soup_pumpkin: () => soup('#f6a24a'),
    food_cups_raw: () => cups(false), food_cups_done: () => cups(true),
    food_cup_empty: () => cup(false), food_cup_full: () => cup(true),
    food_curry_plate0: () => curryPlate(0), food_curry_plate1: () => curryPlate(1),
    food_rollup0: () => rollup(0), food_rollup1: () => rollup(1), food_rollup2: () => rollup(2), food_rollup3: () => rollup(3)
  };

  Object.assign(G.Art.all, wk, tools, foods);
  G.Art.cutterShape = cutterShape;
  G.Art.FILL_COLORS = FILL_COLORS;
  G.Art.NORI = NORI;
  G.Art.lerpC = lerpC;

  /* おにぎり（形 s に、ぐ を のせる。nori = のりを まいた さいごの 形） */
  G.Art.onigiri = (s, filling, { showFilling = true, nori = false } = {}) => {
    const base = strip(G.Art.pic(nori ? 'food_onigiri_nori' : 'food_onigiri' + s));
    if (!showFilling || !filling) return svg('0 0 400 300', base);
    const fy = [180, 150, 130, 110][s], r = s === 0 ? 30 : 18;
    const dot = G.Art.hasPic('ing_' + filling)
      ? `<g transform="translate(${200 - r * 1.5} ${fy - r * 1.5}) scale(${r * 3 / 100})">${strip(G.Art.pic('ing_' + filling))}</g>`
      : `<circle cx="200" cy="${fy}" r="${r}" fill="${FILL_COLORS[filling] || '#f8a58a'}" ${ink(3)}/>`;
    return svg('0 0 400 300', base + dot);
  };
})();
