/*
 * エプロンの絵（料理ゲーム 要件定義書 5.11。おせわゲームの 着せ替えの しくみを つかう）。
 * ニャーちゃんの基準画（nya_base.png、1254px）と同じ座標で描いてある。G.Accessory が 体の上に かさねる。
 * 線は ニャーちゃんと同じ 黒くて太い線、ぬりは パステルの べたぬり。
 * opts.noL = 左うで（画面の左がわ）の そでを 描かない（手を あげている絵のとき）
 */
window.G = window.G || {};

G.ClothesArt = (function () {
  const INK = '#1d1a1c', W = 11;
  // 線の 属性。w = 太さ（同じ 属性を 2つ 書くと SVG の 画像が こわれるので、太さは ここで かえる）
  const line = (w = W) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  // 体の目じるし（基準画のピクセル）
  // くび y600、からだの よこ x426〜812（〜y800）、わきの下 (462,906) (776,906)、こし y1040、また y1100、あし 〜y1200
  const NECK_L = [430, 600], NECK_R = [802, 600];

  /* そで（左）。right=true で 左右を はんてん */
  function sleeve(fill, long, right) {
    const pts = long
      ? [[428, 800], [400, 816], [366, 840], [340, 866], [330, 902], [334, 930], [396, 952], [444, 930], [464, 906]]
      : [[428, 800], [400, 816], [368, 840], [348, 862], [434, 932], [464, 906]];
    const p = pts.map(([x, y]) => right ? [1230 - x, y] : [x, y]);
    return `<path d="M${p.map(q => q.join(' ')).join(' L')}Z" fill="${fill}" ${line()}/>`;
  }
  /* からだ（どう）の 形。hem = すその 高さ、flare = すその ひろがり */
  function torso(fill, hem, flare = 0, neck = 'round') {
    const nl = neck === 'v'
      ? `M${NECK_L} L548 600 L615 700 L682 600 L${NECK_R}`
      : `M${NECK_L} L540 600 Q615 664 690 600 L${NECK_R}`;
    return `<path d="${nl} L812 800 L778 906 L${792 + flare} ${hem} Q615 ${hem + 18} ${438 - flare} ${hem} L462 906 L424 800 Z" fill="${fill}" ${line()}/>`;
  }
  const sleeves = (fill, opts, long) => (opts.noL ? '' : sleeve(fill, long, false)) + sleeve(fill, long, true);
  const button = (x, y, c = '#fff8e8') => `<circle cx="${x}" cy="${y}" r="13" fill="${c}" ${line(7)}/>`;

  /* エプロン（料理ゲーム：要件定義書 5.11）。むねあて・ひも・スカート・ポケット。pat = もようの SVG（むねと スカートに かさねる） */
  function apron(fill, pat = '', strap = '#fffaf0') {
    const bib = 'M520 660 L710 660 L716 880 L514 880 Z';
    const skirtP = 'M470 860 L760 860 Q790 1000 776 1130 Q615 1150 454 1130 Q440 1000 470 860 Z';
    return `<path d="M520 664 L470 600 M710 664 L760 600" fill="none" stroke="${strap}" stroke-width="22" stroke-linecap="round"/>
      <path d="M520 664 L470 600 M710 664 L760 600" fill="none" ${line(5)}/>
      <path d="${skirtP}" fill="${fill}" ${line()}/>
      <path d="${bib}" fill="${fill}" ${line()}/>
      <clipPath id="apronclip"><path d="${skirtP}"/><path d="${bib}"/></clipPath>
      <g clip-path="url(#apronclip)">${pat}</g>
      <path d="${skirtP}" fill="none" ${line()}/><path d="${bib}" fill="none" ${line()}/>
      <path d="M440 870 Q615 892 790 870" fill="none" stroke="${strap}" stroke-width="24" stroke-linecap="round"/>
      <path d="M440 870 Q615 892 790 870" fill="none" ${line(5)}/>
      <path d="M790 870 q40 10 52 52 M790 874 q50 -14 70 18" fill="none" stroke="${strap}" stroke-width="16" stroke-linecap="round"/>
      <rect x="560" y="960" width="110" height="90" rx="16" fill="#ffffff" opacity=".85" ${line(7)}/>`;
  }
  const dots = (c) => Array.from({ length: 42 }, (_, i) => `<circle cx="${470 + (i % 7) * 50 + (Math.floor(i / 7) % 2) * 25}" cy="${680 + Math.floor(i / 7) * 80}" r="12" fill="${c}"/>`).join('');
  const check = (c) => Array.from({ length: 8 }, (_, i) => `<rect x="${450 + i * 45}" y="640" width="22" height="520" fill="${c}" opacity=".5"/><rect x="440" y="${650 + i * 64}" width="360" height="30" fill="${c}" opacity=".5"/>`).join('');
  const motif = (f) => [[560, 760], [670, 740], [520, 940], [700, 960], [610, 1080], [500, 1090], [730, 1080]].map(([x, y]) => f(x, y)).join('');
  const berry = (x, y) => `<path d="M${x} ${y + 26} C${x - 22} ${y + 10} ${x - 22} ${y - 14} ${x} ${y - 10} C${x + 22} ${y - 14} ${x + 22} ${y + 10} ${x} ${y + 26}Z" fill="#f2577e" ${line(5)}/><path d="M${x - 12} ${y - 14} l12 8 l12 -8" fill="#7cc46e" ${line(4)}/>`;
  const fishM = (x, y) => `<path d="M${x - 30} ${y} Q${x - 4} ${y - 22} ${x + 18} ${y} L${x + 34} ${y - 12} V${y + 12} L${x + 18} ${y} Q${x - 4} ${y + 22} ${x - 30} ${y}Z" fill="#9ccdf0" ${line(5)}/>`;
  const paw = (x, y) => `<ellipse cx="${x}" cy="${y + 8}" rx="16" ry="13" fill="#f6a8c8"/>${[[-16, -12], [-5, -20], [7, -20], [17, -12]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="6" fill="#f6a8c8"/>`).join('')}`;

  const ART = {
    apron:      (c) => apron(c || '#f6a8c8'),
    checkapron: (c) => apron('#fff6c9', check(c || '#f6c94a')),
    dotapron:   (c) => apron(c || '#9fd0f0', dots('#ffffff')),
    strawapron: () => apron('#fffaf0', motif(berry), '#f6a8c8'),
    fishapron:  () => apron('#e6f3fb', motif(fishM), '#9ccdf0'),
    pawapron:   () => apron('#fff2f6', motif(paw), '#f6a8c8'),
    chefcoat:   (c, o) => `${torso('#ffffff', 1110, 20, 'v')}${sleeves('#ffffff', o, true)}
      ${[[580, 720], [650, 720], [580, 820], [650, 820], [580, 920], [650, 920]].map(([x, y]) => button(x, y, '#e9e0e4')).join('')}
      <path d="M548 600 L615 680 L682 600" fill="none" stroke="#f37d9b" stroke-width="14" stroke-linecap="round"/>`,
    witchapron: () => apron('#8a6bc4', motif((x, y) => `<circle cx="${x}" cy="${y}" r="16" fill="#f6a24a" ${line(4)}/>`), '#f6a24a'),
    santaapron: () => apron('#e5484d', motif((x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#ffffff"/>`), '#ffffff')
  };

  /* id の服を c（色）で描く */
  function markup(id, color, opts) {
    const f = ART[id];
    return f ? `<g>${f(color, opts || {})}</g>` : '';
  }
  return { markup, has: (id) => !!ART[id], ids: () => Object.keys(ART) };
})();
