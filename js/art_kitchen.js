/* キッチンの 絵（要件定義書 4.4・7.4）。おへやの 背景と 同じ 線画風（こい線 ＋ パステルの べたぬり）
 * ・bg_kitchen / bg_kitchen_night … 左に キッチン、右に テーブル（画像ファイルを 置けば 差しかわる）
 * ・kitchen_table … テーブル（ニューちゃんの まえに 重ねて 出す。すわっているように 見せる）
 * ・icon_cook・icon_apron・icon_recipe・icon_door … 下の ボタンの 絵
 * ・dish_* … お料理の 絵（リクエストの ふきだし・レシピえらび）
 */
window.G = window.G || {};

(function () {
  const svg = G.Art.svg;
  const INK = '#3b3236';
  const ink = (w = 4, col = INK) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  let seq = 0;
  const uid = (p) => p + 'k' + (++seq);

  /* ---------- 背景：キッチンと ダイニング ---------- */
  function bgKitchen(night = false) {
    const c = night ? {
      wall: '#56547e', tile: '#626a96', tileLine: '#7478a6', floor: '#6c5c76', plank: '#5a4c64',
      counter: '#7a6a8a', top: '#9a8eb0', door: '#8a7a9a', fridge: '#8a96b6', metal: '#a6a6c0',
      sky: '#232a5a', frame: '#7c7aa6', curt: '#8676a6', shelf: '#7a5f70', pot: '#a2707a', leaf: '#4f7a66',
      lamp: '#ffe08a', ink: '#221c26'
    } : {
      wall: '#fff3da', tile: '#ffffff', tileLine: '#d9ecf3', floor: '#f3d8b0', plank: '#ddb98d',
      counter: '#bfe3d0', top: '#fffaf0', door: '#d5efe0', fridge: '#fffdf8', metal: '#d9d6de',
      sky: '#cdeaf8', frame: '#ffffff', curt: '#ffe39a', shelf: '#e9c48c', pot: '#f0a98c', leaf: '#8fd08a',
      lamp: '#fff1b8', ink: INK
    };
    const I = (w) => ink(w, c.ink);
    const p = uid('bg');
    // かべの タイル（キッチンの うしろだけ）
    const tiles = [];
    for (let x = 0; x <= 700; x += 50) tiles.push(`M${x} 330V560`);
    for (let y = 330; y <= 560; y += 50) tiles.push(`M0 ${y}H700`);
    const planks = [772, 852, 942].map(y => `<path d="M0 ${y}H1366" stroke="${c.plank}" stroke-width="3"/>`).join('') +
      [[200, 704, 772], [560, 772, 852], [900, 704, 772], [1180, 772, 852], [340, 852, 942], [760, 852, 942], [1080, 942, 1024], [460, 942, 1024]]
        .map(([x, a, b]) => `<path d="M${x} ${a}V${b}" stroke="${c.plank}" stroke-width="3"/>`).join('');
    const sky = night
      ? `${[[960, 200], [1010, 170], [1120, 190], [1150, 260], [990, 280]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 3 : 4.5}" fill="#fff6c9"/>`).join('')}
         <path d="M1078 196 a34 34 0 1 0 30 48 a27 27 0 1 1 -30 -48z" fill="#fff0a8" ${I(4)}/>`
      : `<circle cx="1110" cy="214" r="30" fill="#ffe27a" ${I(4)}/>
         <path d="M950 210 q8 -24 32 -18 q13 -18 35 -5 q24 0 24 20 q0 16 -22 16 h-56 q-20 0 -13 -13z" fill="#fff" ${I(4)}/>`;
    const glow = night ? `<radialGradient id="${p}g"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>` : '';
    return svg('0 0 1366 1024', `
      <defs>
        <clipPath id="${p}w"><rect x="910" y="150" width="280" height="200" rx="12"/></clipPath>
        ${glow}
      </defs>
      <!-- かべ・ゆか -->
      <rect width="1366" height="704" fill="${c.wall}"/>
      <rect y="-4" width="1366" height="30" fill="${c.frame}" ${I(4)}/>
      <rect y="330" width="700" height="230" fill="${c.tile}"/>
      <path d="${tiles.join('')}" stroke="${c.tileLine}" stroke-width="3"/>
      <rect y="682" width="1366" height="22" fill="${c.frame}" ${I(4)}/>
      <rect y="704" width="1366" height="320" fill="${c.floor}"/>
      ${planks}

      <!-- うえの とだな -->
      <rect x="170" y="110" width="510" height="170" rx="10" fill="${c.counter}" ${I(4)}/>
      <path d="M340 116v158M510 116v158" ${I(4)}/>
      ${[255, 425, 595].map(x => `<circle cx="${x}" cy="248" r="7" fill="${c.top}" ${I(3)}/>`).join('')}

      <!-- れいぞうこ -->
      <rect x="18" y="150" width="150" height="534" rx="16" fill="${c.fridge}" ${I(5)}/>
      <path d="M18 360h150" ${I(4)}/>
      <path d="M146 220v80M146 400v100" ${ink(9, c.metal)}/>
      <path d="M146 220v80M146 400v100" fill="none" ${I(3)}/>
      <!-- れいぞうこの マグネット（おえかき） -->
      <rect x="44" y="410" width="62" height="74" rx="4" fill="#fffaf0" ${I(3)} transform="rotate(-6 75 447)"/>
      <circle cx="75" cy="410" r="7" fill="#f7a8c4" ${I(3)}/>
      <path d="M58 460 q16 -18 34 0" fill="none" stroke="#f37d9b" stroke-width="4" stroke-linecap="round"/>

      <!-- カウンター（ながし・コンロ） -->
      <rect x="168" y="560" width="532" height="124" fill="${c.counter}" ${I(4)}/>
      <path d="M346 566v112M524 566v112" ${I(4)}/>
      ${[257, 435, 612].map(x => `<path d="M${x - 26} 600h52" ${I(6)}/>`).join('')}
      <rect x="156" y="540" width="556" height="26" rx="8" fill="${c.top}" ${I(4)}/>
      <!-- ながし -->
      <path d="M210 540v-6h120v6" fill="none" ${I(4)}/>
      <path d="M300 534v-62q0 -20 -20 -20h-16" fill="none" ${ink(9, c.metal)}/>
      <path d="M300 534v-62q0 -20 -20 -20h-16" fill="none" ${I(3)}/>
      <!-- コンロと フライパン -->
      <rect x="450" y="528" width="200" height="14" rx="4" fill="${c.metal}" ${I(3)}/>
      <ellipse cx="510" cy="522" rx="46" ry="10" fill="${c.metal}" ${I(4)}/>
      <path d="M556 520h62" ${ink(10, c.ink)}/>
      <!-- なべ -->
      <path d="M572 528v-54h70v54" fill="#f6a8a0" ${I(4)}/>
      <path d="M564 474h86" ${I(5)}/><path d="M598 474v-10h18v10" fill="none" ${I(4)}/>

      <!-- かべの おたま・フライがえし -->
      <path d="M380 300h210" ${I(5)}/>
      <path d="M420 300v80" ${I(5)}/><ellipse cx="420" cy="392" rx="20" ry="14" fill="${c.metal}" ${I(4)}/>
      <path d="M480 300v70" ${I(5)}/><rect x="466" y="368" width="28" height="34" rx="4" fill="${c.metal}" ${I(4)}/>
      <path d="M540 300v84" ${I(5)}/><ellipse cx="540" cy="396" rx="12" ry="20" fill="#e9c48c" ${I(4)}/>

      <!-- まど（テーブルの うえ） -->
      <g clip-path="url(#${p}w)">
        <rect x="900" y="140" width="300" height="220" fill="${c.sky}"/>
        ${sky}
        <path d="M900 320 q80 -40 150 -8 q70 -30 150 0 v40 h-300z" fill="${night ? '#3c5a5a' : '#b6e3a8'}" ${I(4)}/>
      </g>
      <rect x="910" y="150" width="280" height="200" rx="12" fill="none" stroke="${c.frame}" stroke-width="18"/>
      <rect x="910" y="150" width="280" height="200" rx="12" fill="none" ${I(5)}/>
      <path d="M1050 156v188" stroke="${c.frame}" stroke-width="10"/>
      <rect x="890" y="348" width="320" height="22" rx="8" fill="${c.frame}" ${I(4)}/>
      <path d="M870 120h360" ${I(5)}/>
      <path d="M876 124c20 0 30 120 10 210h-28c-6 -80 0 -150 18 -210zM1224 124c-20 0 -30 120 -10 210h28c6 -80 0 -150 -18 -210z" fill="${c.curt}" ${I(4)}/>

      <!-- はちうえ -->
      <path d="M1262 690 l-12 -70 h80 l-12 70z" fill="${c.pot}" ${I(4)}/>
      <path d="M1290 620 C1280 580 1250 560 1240 530 M1290 620 C1296 570 1312 550 1336 530" fill="none" ${I(5)}/>
      ${[[1240, 530, -30], [1336, 530, 30], [1288, 512, 0]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="36" transform="rotate(${r} ${x} ${y})" fill="${c.leaf}" ${I(4)}/>`).join('')}

      <!-- テーブルの うえの あかり -->
      <path d="M1050 26v120" ${I(4)}/>
      <path d="M1000 186 q50 -64 100 0z" fill="${c.lamp}" ${I(4)}/>
      ${night ? `<circle cx="1050" cy="200" r="220" fill="url(#${p}g)"/>` : ''}

      <!-- いす（テーブルの うしろ） -->
      <path d="M975 440v250M1125 440v250" ${ink(14, night ? '#7a5f70' : '#e9b98a')}/>
      <path d="M975 440v250M1125 440v250" fill="none" ${I(4)}/>
      <rect x="958" y="420" width="184" height="44" rx="18" fill="${night ? '#7a5f70' : '#e9b98a'}" ${I(4)}/>
    `, 'preserveAspectRatio="xMidYMid slice"');
  }

  /* テーブル（まえに 重ねる）。ステージ座標の 840〜1260 × 600〜780 に おく */
  function kitchenTable() {
    return svg('0 0 420 190', `
      <path d="M50 40v140M370 40v140" ${ink(16, '#e9b98a')}/>
      <path d="M50 40v140M370 40v140" fill="none" ${ink(4)}/>
      <rect x="10" y="8" width="400" height="40" rx="14" fill="#fffaf0" ${ink(4)}/>
      <path d="M24 48 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0" fill="#f9c6d3" ${ink(3)}/>`);
  }

  /* ---------- 背景：カウンターの アップ（おりょうりの 画面） ---------- */
  function bgCounter() {
    const tiles = [];
    for (let x = 0; x <= 1366; x += 64) tiles.push(`M${x} 0V250`);
    for (let y = 0; y <= 250; y += 64) tiles.push(`M0 ${y}H1366`);
    const grain = [330, 420, 560, 700, 840, 960].map((y, i) => `<path d="M0 ${y} q${340 + i * 30} ${i % 2 ? 18 : -18} 683 0 t683 0" fill="none" stroke="#ecd2a6" stroke-width="5"/>`).join('');
    return svg('0 0 1366 1024', `
      <rect width="1366" height="260" fill="#ffffff"/>
      <path d="${tiles.join('')}" stroke="#d9ecf3" stroke-width="4"/>
      <rect y="250" width="1366" height="774" fill="#f8e3bf"/>
      ${grain}
      <rect y="236" width="1366" height="30" fill="#fffaf0" ${ink(4)}/>`, 'preserveAspectRatio="xMidYMid slice"');
  }

  /* テーブル（まえから 見た。いただきますの 画面）。900×424 */
  function tableFront() {
    return svg('0 0 900 424', `
      <path d="M70 120 V420 M830 120 V420" ${ink(26, '#e9b98a')}/>
      <path d="M70 120 V420 M830 120 V420" fill="none" ${ink(5)}/>
      <rect x="10" y="20" width="880" height="110" rx="26" fill="#fffaf0" ${ink(5)}/>
      <path d="M24 130 ${Array.from({ length: 22 }, () => 'q20 26 40 0').join(' ')}" fill="#f9c6d3" ${ink(4)}/>
      <path d="M40 60 h820" stroke="#fde3ea" stroke-width="10" stroke-dasharray="40 30" stroke-linecap="round"/>`);
  }

  /* ---------- ボタンの 絵 ---------- */
  const icons = {
    icon_cook: () => svg('0 0 100 100', `
      <path d="M62 56 l30 -30" ${ink(12, INK)}/>
      <ellipse cx="42" cy="60" rx="34" ry="26" fill="#9a9aae" ${ink(4)}/>
      <ellipse cx="42" cy="56" rx="26" ry="18" fill="#c9c9d6"/>
      <ellipse cx="40" cy="56" rx="14" ry="10" fill="#fff" ${ink(3)}/><circle cx="40" cy="56" r="6" fill="#ffd24d"/>`),
    icon_apron: () => svg('0 0 100 100', `
      <path d="M36 14 q14 12 28 0" fill="none" ${ink(5)}/>
      <path d="M32 20h36v18l14 6 -4 46h-56l-4 -46 14 -6z" fill="#f6a8c8" ${ink(4)}/>
      <rect x="38" y="56" width="24" height="18" rx="4" fill="#fff" ${ink(3)}/>
      <path d="M18 44h14M68 44h14" ${ink(4)}/>`),
    icon_recipe: () => svg('0 0 100 100', `
      <path d="M50 22 q-18 -10 -38 -4 v62 q20 -6 38 4 q18 -10 38 -4 v-62 q-20 -6 -38 4z" fill="#fff6dc" ${ink(4)}/>
      <path d="M50 22v62" ${ink(4)}/>
      <circle cx="30" cy="46" r="10" fill="#ffd24d" ${ink(3)}/>
      <path d="M60 40h18M60 52h18M60 64h14" ${ink(3)}/>`),
    icon_door: () => svg('0 0 100 100', `
      <rect x="24" y="10" width="52" height="82" rx="6" fill="#e9b98a" ${ink(4)}/>
      <rect x="32" y="20" width="36" height="26" rx="4" fill="#cdeaf8" ${ink(3)}/>
      <circle cx="64" cy="58" r="5" fill="#ffd24d" ${ink(3)}/>
      <path d="M50 70 c-8 -6 -12 -10 -12 -14 a6 6 0 0 1 12 -2 a6 6 0 0 1 12 2 c0 4 -4 8 -12 14z" fill="#f37d9b" ${ink(2)}/>`),
    plate: () => svg('0 0 100 60', `<ellipse cx="50" cy="32" rx="44" ry="22" fill="#fff" ${ink(4)}/><ellipse cx="50" cy="30" rx="28" ry="12" fill="none" stroke="#d9ecf3" stroke-width="4"/>`),
    plate_full: () => svg('0 0 100 60', `<ellipse cx="50" cy="32" rx="44" ry="22" fill="#ffd9a8" ${ink(4)}/><ellipse cx="50" cy="30" rx="28" ry="12" fill="#ffb86b" ${ink(3)}/>`)
  };

  /* ---------- お料理の 絵（第1段階で ふやす。まだ 無い お料理は おさらだけ） ---------- */
  const dishes = {
    dish_onigiri: () => svg('0 0 120 100', `
      <ellipse cx="60" cy="84" rx="52" ry="12" fill="#fff" ${ink(4)}/>
      <path d="M60 14 C76 14 104 58 104 70 C104 82 88 86 60 86 C32 86 16 82 16 70 C16 58 44 14 60 14Z" fill="#fff" ${ink(5)}/>
      <rect x="40" y="58" width="40" height="28" rx="3" fill="#3a4a3f" ${ink(3)}/>
      <circle cx="60" cy="44" r="7" fill="#f6a08c"/>`),
    dish_sandwich: () => svg('0 0 120 100', `
      <ellipse cx="60" cy="84" rx="52" ry="12" fill="#fff" ${ink(4)}/>
      <path d="M16 78 L60 22 L104 78Z" fill="#ffe6b0" ${ink(5)}/>
      <path d="M26 66 L94 66" stroke="#9fd68e" stroke-width="8"/><path d="M34 56 L86 56" stroke="#ffd24d" stroke-width="7"/>`),
    dish_pancake: () => svg('0 0 120 100', `
      <ellipse cx="60" cy="84" rx="52" ry="12" fill="#fff" ${ink(4)}/>
      <ellipse cx="60" cy="70" rx="40" ry="12" fill="#e9a65e" ${ink(4)}/>
      <ellipse cx="60" cy="56" rx="40" ry="12" fill="#f2bb74" ${ink(4)}/>
      <ellipse cx="60" cy="42" rx="40" ry="12" fill="#f7cd8c" ${ink(4)}/>
      <rect x="50" y="30" width="20" height="12" rx="3" fill="#fff3b0" ${ink(3)}/>`),
    dish_pumpkinpie: () => svg('0 0 120 100', `
      <ellipse cx="60" cy="84" rx="52" ry="12" fill="#fff" ${ink(4)}/>
      <path d="M14 72 L60 30 L106 72 Q60 86 14 72Z" fill="#f6a24a" ${ink(5)}/>
      <path d="M14 72 Q60 86 106 72 L106 80 Q60 94 14 80Z" fill="#e9b98a" ${ink(4)}/>
      <circle cx="50" cy="60" r="4" fill="${INK}"/><circle cx="68" cy="60" r="4" fill="${INK}"/>
      <path d="M50 70 q9 6 18 0" fill="none" ${ink(3)}/>`),
    dish_xmascake: () => svg('0 0 120 100', `
      <ellipse cx="60" cy="84" rx="52" ry="12" fill="#fff" ${ink(4)}/>
      <rect x="18" y="44" width="84" height="34" rx="16" fill="#fffaf0" ${ink(5)}/>
      <circle cx="98" cy="61" r="13" fill="#fffaf0" ${ink(4)}/><path d="M98 54a7 7 0 1 1 -1 0" fill="none" stroke="#f6a8c8" stroke-width="3"/>
      <circle cx="40" cy="42" r="7" fill="#f2577e" ${ink(3)}/><circle cx="62" cy="40" r="7" fill="#f2577e" ${ink(3)}/>`)
  };
  G.Art.dish = (id) => (dishes['dish_' + id] || icons.plate)();

  Object.assign(G.Art.all, icons, dishes, {
    bg_kitchen: () => bgKitchen(false),
    bg_kitchen_night: () => bgKitchen(true),
    kitchen_table: () => kitchenTable(),
    bg_counter: () => bgCounter(),
    table_front: () => tableFront()
  });
})();
