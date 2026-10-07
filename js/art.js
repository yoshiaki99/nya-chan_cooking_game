/*
 * ゲームの中で描く絵（SVG）。
 * 背景・アイテム・アイコンの画像ファイルが届くまでの代わり、およびメーターやボタンの小さな飾りに使う。
 */
window.G = window.G || {};

G.Art = (function () {
  const LINE = '#b9a294';
  let uid = 0;
  const id = (p) => p + (++uid);

  function svg(vb, inner, attrs = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${attrs}>${inner}</svg>`;
  }

  /* ---------- ハート・きらきら ---------- */
  const HEART_PATH = 'M16 28C6 20 1 14 1 8.5 1 4 4.5 1 8.5 1c3 0 5.5 1.7 7.5 4.5C18 2.7 20.5 1 23.5 1 27.5 1 31 4 31 8.5 31 14 26 20 16 28z';
  function heart(fill = '#f37d9b', stroke = '#ffffff', sw = 2.5) {
    return svg('-2 -2 36 34', `<path d="${HEART_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
      <ellipse cx="9" cy="8" rx="3.6" ry="2.4" fill="#fff" opacity=".55" transform="rotate(-30 9 8)"/>`);
  }
  function heartEmpty(color) {
    return svg('-2 -2 36 34', `<path d="${HEART_PATH}" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-opacity=".75" stroke-width="2.6" stroke-linejoin="round"/>`);
  }
  function sparkle(fill = '#fff6c9') {
    return svg('0 0 100 100', `<path d="M50 0C54 38 62 46 100 50 62 54 54 62 50 100 46 62 38 54 0 50 38 46 46 38 50 0z" fill="${fill}"/>`);
  }

  /* ---------- メーターのアイコン ---------- */
  const meterIcons = {
    hunger: () => svg('0 0 64 64', `
      <path d="M8 33c10-14 28-16 40-2-12 13-30 12-40 2z" fill="#8ec5e8" stroke="#5f97bf" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M46 31l12-9c-2 6-2 12 0 18z" fill="#7ab6de" stroke="#5f97bf" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M16 36c8 5 18 5 26 0" fill="none" stroke="#c9e6f7" stroke-width="3" stroke-linecap="round"/>
      <circle cx="17" cy="30" r="3" fill="#3d4a66"/><circle cx="16" cy="29" r="1" fill="#fff"/>`),
    clean: () => svg('0 0 64 64', `
      <circle cx="24" cy="36" r="16" fill="#e7f6fd" stroke="#79c4e6" stroke-width="3"/>
      <circle cx="44" cy="22" r="11" fill="#eef9ff" stroke="#9ad3ef" stroke-width="3"/>
      <circle cx="46" cy="46" r="7" fill="#f3fbff" stroke="#9ad3ef" stroke-width="2.5"/>
      <path d="M15 30a10 10 0 0 1 8-7" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M39 18a6 6 0 0 1 5-4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
    fun: () => yarnSvg('#f3a9c9', '#d97aa5', '#fbd3e5', '0 0 64 64', 32, 33, 22),
    energy: () => svg('0 0 64 64', `
      <path d="M40 8a24 24 0 1 0 16 38A20 20 0 0 1 40 8z" fill="#f6d66b" stroke="#d6aa36" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="26" cy="28" r="2.5" fill="#e9bd4a" opacity=".6"/><circle cx="20" cy="40" r="3.5" fill="#e9bd4a" opacity=".5"/>
      <path d="M50 14l2 4 4 1-4 2-2 4-2-4-4-2 4-1z" fill="#fff3b5"/>`)
  };

  function yarnSvg(fill, stroke, light, vb = '0 0 200 200', cx = 100, cy = 100, r = 62) {
    const k = r / 62;
    const t = (x, y) => `${cx + x * k} ${cy + y * k}`;
    return svg(vb, `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${3 * k + 0.5}"/>
      <path d="M${t(-50, -30)}C${t(-10, -50)} ${t(30, -40)} ${t(55, -10)}" fill="none" stroke="${light}" stroke-width="${5 * k}" stroke-linecap="round"/>
      <path d="M${t(-58, -6)}C${t(-10, -30)} ${t(36, -18)} ${t(60, 14)}" fill="none" stroke="${stroke}" stroke-opacity=".6" stroke-width="${4 * k}" stroke-linecap="round"/>
      <path d="M${t(-56, 18)}C${t(-14, -4)} ${t(30, 6)} ${t(52, 34)}" fill="none" stroke="${light}" stroke-width="${5 * k}" stroke-linecap="round"/>
      <path d="M${t(-40, 44)}C${t(-10, 26)} ${t(18, 32)} ${t(34, 52)}" fill="none" stroke="${stroke}" stroke-opacity=".6" stroke-width="${4 * k}" stroke-linecap="round"/>
      <path d="M${t(-20, -58)}C${t(-44, -20)} ${t(-40, 26)} ${t(-14, 58)}" fill="none" stroke="${stroke}" stroke-opacity=".45" stroke-width="${3.5 * k}" stroke-linecap="round"/>
      <path d="M${t(20, -58)}C${t(2, -20)} ${t(6, 30)} ${t(30, 56)}" fill="none" stroke="${light}" stroke-width="${4 * k}" stroke-linecap="round"/>
      <ellipse cx="${cx - 24 * k}" cy="${cy - 28 * k}" rx="${12 * k}" ry="${7 * k}" fill="#fff" opacity=".45" transform="rotate(-35 ${cx - 24 * k} ${cy - 28 * k})"/>`);
  }

  /* ---------- リボン（おしゃれの見本） ---------- */
  function bow(color, pattern) {
    const g = id('bg');
    let fill = color, extra = '', defs = '';
    if (color === 'rainbow') {
      defs = `<linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="#f6a1b5"/><stop offset=".2" stop-color="#f9c98a"/><stop offset=".4" stop-color="#f6e48a"/><stop offset=".6" stop-color="#a9e0b8"/><stop offset=".8" stop-color="#9fcdf2"/><stop offset="1" stop-color="#c8a9ec"/></linearGradient>`;
      fill = `url(#${g})`;
    }
    if (pattern === 'dots') {
      defs += `<pattern id="${g}d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.2" fill="#fff" opacity=".95"/><circle cx="13" cy="13" r="3.2" fill="#fff" opacity=".95"/></pattern>`;
      extra = `<g fill="url(#${g}d)"><path d="M60 45C40 18 10 10 8 30c-2 19 22 33 52 15z"/><path d="M60 45c20-27 50-35 52-15 2 19-22 33-52 15z"/></g>`;
    }
    if (pattern === 'glitter') {
      extra = `<g fill="#fffbe6">${[[28, 30], [44, 22], [86, 26], [96, 38], [50, 70], [72, 76], [22, 40]].map(([x, y]) => `<path transform="translate(${x} ${y}) scale(.09)" d="M50 0C54 38 62 46 100 50 62 54 54 62 50 100 46 62 38 54 0 50 38 46 46 38 50 0z"/>`).join('')}</g>`;
    }
    return svg('0 0 120 96', `<defs>${defs}</defs>
      <g stroke="#3b3236" stroke-width="3" stroke-linejoin="round">
        <path d="M56 50 38 88l13-4 7 11 5-42z" fill="${fill}"/>
        <path d="M64 50l18 38-13-4-7 11-5-42z" fill="${fill}"/>
        <path d="M60 45C40 18 10 10 8 30c-2 19 22 33 52 15z" fill="${fill}"/>
        <path d="M60 45c20-27 50-35 52-15 2 19-22 33-52 15z" fill="${fill}"/>
      </g>
      ${extra}
      <path d="M22 26c6-6 16-4 26 6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>
      <path d="M98 26c-6-6-16-4-26 6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="60" cy="46" rx="11" ry="13" fill="${fill}" stroke="#3b3236" stroke-width="3"/>
      <ellipse cx="57" cy="42" rx="4" ry="3" fill="#fff" opacity=".5"/>`);
  }

  /* ---------- アイテム ---------- */
  const items = {
    item_fish: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="142" rx="90" ry="38" fill="#fffdf9" stroke="${LINE}" stroke-width="3"/>
      <ellipse cx="100" cy="138" rx="70" ry="26" fill="#fbf4ea" stroke="#e6cb8d" stroke-width="3"/>
      <path d="M34 118c26-40 78-44 108-6-28 32-80 34-108 6z" fill="#8ec5e8" stroke="#5f97bf" stroke-width="3" stroke-linejoin="round"/>
      <path d="M140 112l30-24c-6 16-6 34 0 50z" fill="#7ab6de" stroke="#5f97bf" stroke-width="3" stroke-linejoin="round"/>
      <path d="M48 126c22 14 54 16 82 2" fill="none" stroke="#d2ecfa" stroke-width="7" stroke-linecap="round"/>
      <path d="M86 92c8-12 22-14 30-8" fill="#a8d4ef" stroke="#5f97bf" stroke-width="2.5"/>
      <path d="M84 108q6 6 0 12M98 106q6 7 0 14M112 106q6 7 0 14" fill="none" stroke="#6ea8cf" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="56" cy="112" r="7" fill="#3d4a66"/><circle cx="54" cy="110" r="2.4" fill="#fff"/>`),
    item_croissant: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="150" rx="88" ry="32" fill="#fffdf9" stroke="${LINE}" stroke-width="3"/>
      <ellipse cx="100" cy="146" rx="68" ry="21" fill="#fbf4ea" stroke="#e6cb8d" stroke-width="3"/>
      <g stroke="#b97a3c" stroke-width="3">
        <ellipse cx="38" cy="132" rx="15" ry="19" transform="rotate(-50 38 132)" fill="#e9a95a"/>
        <ellipse cx="162" cy="132" rx="15" ry="19" transform="rotate(50 162 132)" fill="#e9a95a"/>
        <ellipse cx="64" cy="112" rx="23" ry="30" transform="rotate(-28 64 112)" fill="#f0b765"/>
        <ellipse cx="136" cy="112" rx="23" ry="30" transform="rotate(28 136 112)" fill="#f0b765"/>
        <ellipse cx="100" cy="104" rx="33" ry="34" fill="#f4c277"/>
      </g>
      <g fill="none" stroke="#fbe0a8" stroke-width="6" stroke-linecap="round">
        <path d="M84 82c8-8 24-8 32 0"/><path d="M50 98c4-8 14-12 22-10"/><path d="M128 88c8-2 18 2 22 10"/>
      </g>
      <g fill="none" stroke="#d48f45" stroke-width="2.5" stroke-linecap="round" opacity=".7">
        <path d="M80 122c12 6 28 6 40 0"/><path d="M48 128c6 4 14 4 20 0"/><path d="M132 128c6 4 14 4 20 0"/>
      </g>`),
    item_macaron: () => {
      // マカロン 1こ（cx, cy = クリームの まんなか）
      const mac = (cx, cy, w, fill, dark, light) => {
        const l = cx - w / 2, r = cx + w / 2;
        return `
        <path d="M${l + 2} ${cy + 3}h${w - 4}c0 12-6 17-16 17H${l + 18}c-10 0-16-5-16-17z" fill="${fill}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="${l + 3}" y="${cy - 5}" width="${w - 6}" height="10" rx="5" fill="#fffaf2" stroke="#eadfcf" stroke-width="2.5"/>
        <path d="M${l} ${cy - 4}c0-18 12-26 ${w / 2}-26s${w / 2} 8 ${w / 2} 26z" fill="${fill}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${l + 2} ${cy - 5}q4 3 8 0t8 0 8 0 8 0 8 0 8 0 8 0" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
        <path d="M${l + 12} ${cy - 18}c4-6 10-9 18-9" fill="none" stroke="${light}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="${r - 14}" cy="${cy - 20}" r="2" fill="#fff" opacity=".7"/>`;
      };
      return svg('0 0 200 200', `
        <ellipse cx="100" cy="162" rx="84" ry="26" fill="#fffdf9" stroke="${LINE}" stroke-width="3"/>
        <ellipse cx="100" cy="158" rx="64" ry="16" fill="#fbf4ea" stroke="#e6cb8d" stroke-width="3"/>
        ${mac(66, 140, 66, '#c9b3ee', '#9a82c9', '#e6dbfa')}
        ${mac(134, 140, 66, '#a8e0c4', '#6fb593', '#d6f3e4')}
        ${mac(100, 98, 72, '#f6a9c0', '#d9799a', '#fcd6e2')}`);
    },
    item_pudding: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="166" rx="86" ry="24" fill="#fffdf9" stroke="${LINE}" stroke-width="3"/>
      <ellipse cx="100" cy="162" rx="66" ry="15" fill="#fbf4ea" stroke="#e6cb8d" stroke-width="3"/>
      <path d="M52 160l18-70q30-10 60 0l18 70q-48 12-96 0z" fill="#fde39e" stroke="#d6a54a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M70 90q30-10 60 0l4 16c1 8-8 8-9 1-2 10-11 10-12 1-2 12-12 12-13 1-2 9-11 9-12 0-2 8-10 8-11-1-1 7-10 7-9-2z" fill="#b8692c" stroke="#8f4f1f" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="100" cy="90" rx="30" ry="7" fill="#c97a36"/>
      <path d="M64 120c-4 14-6 26-6 34" fill="none" stroke="#fff6d6" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="100" cy="84" rx="20" ry="8" fill="#fffaf0" stroke="#e5d6c6" stroke-width="2.5"/>
      <ellipse cx="100" cy="74" rx="13" ry="7" fill="#fffaf0" stroke="#e5d6c6" stroke-width="2.5"/>
      <path d="M92 70q8-14 16 0" fill="#fffaf0" stroke="#e5d6c6" stroke-width="2.5"/>
      <path d="M100 56c4-12 12-18 22-20" fill="none" stroke="#6aa86a" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="58" r="11" fill="#e8455f" stroke="#bf3049" stroke-width="2.5"/>
      <ellipse cx="96" cy="54" rx="3.5" ry="2.5" fill="#fff" opacity=".7"/>`),
    item_water: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="180" rx="80" ry="10" fill="#e9d9cc" opacity=".6"/>
      <path d="M38 122L23 163c-2 6 2 10 9 11 40 10 96 10 136 0 7-1 11-5 9-11L162 122z" fill="#a9d6f2" stroke="#6fa8cf" stroke-width="3" stroke-linejoin="round"/>
      <path d="M25 164c44 12 106 12 150 0" fill="none" stroke="#8cc3e6" stroke-width="3" stroke-linecap="round"/>
      <path d="M34 142l-5 15" fill="none" stroke="#e3f3fc" stroke-width="5" stroke-linecap="round"/>
      <g fill="#f4fbff" transform="translate(100 157) scale(.82)">
      <path d="M0-1c7 0 12 6 12 11 0 5-5 6-12 6s-12-1-12-6c0-5 5-11 12-11z"/>
      <ellipse cx="-15" cy="-4" rx="4.5" ry="5.5" transform="rotate(-25 -15 -4)"/>
      <ellipse cx="-6" cy="-11" rx="4.5" ry="5.5" transform="rotate(-8 -6 -11)"/>
      <ellipse cx="6" cy="-11" rx="4.5" ry="5.5" transform="rotate(8 6 -11)"/>
      <ellipse cx="15" cy="-4" rx="4.5" ry="5.5" transform="rotate(25 15 -4)"/>
      </g>
      <ellipse cx="100" cy="121" rx="64" ry="19" fill="#c6e6f8" stroke="#6fa8cf" stroke-width="3"/>
      <path d="M53 111q11-5.5 29-6" fill="none" stroke="#eef8fe" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="100" cy="121" rx="54" ry="14" fill="#86bfe3" stroke="#6fa8cf" stroke-width="2.5"/>
      <ellipse cx="100" cy="124.5" rx="50" ry="10.5" fill="#d6eefc"/>
      <g fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
      <ellipse cx="100" cy="126" rx="10" ry="2.6"/>
      <path d="M76.5 128.1A25 6.2 0 0 0 123.5 128.1M123.5 123.9A25 6.2 0 0 0 76.5 123.9" opacity=".85"/>
      </g>
      <ellipse cx="66" cy="121" rx="7" ry="2.2" fill="#fff" opacity=".9"/>
      <g fill="#a6d8f5">
      <path d="M60 78q1.5 7 8 8-6.5 1-8 8-1.5-7-8-8 6.5-1 8-8z"/>
      <path d="M140 84q1 5 6 6-5 1-6 6-1-5-6-6 5-1 6-6z"/>
      </g>`),
    item_parfait: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="177" rx="74" ry="14" fill="#fffdf9" stroke="#b9a294" stroke-width="3"/>
      <ellipse cx="100" cy="174.5" rx="55" ry="9" fill="#fbf4ea" stroke="#e6cb8d" stroke-width="3"/>
      <g fill="#f4fbff" stroke="#9fbfd3" stroke-width="3" stroke-linejoin="round">
      <path d="M94 158c1 7-2 11-8 14h28c-6-3-9-7-8-14z"/>
      <ellipse cx="100" cy="173" rx="32" ry="6.5"/>
      <path d="M42 68a58 8 0 0 1 116 0l-42 86q-16 14-32 0z"/>
      </g>
      <path d="M48 70h104l-13 26q-39 6-78 0z" fill="#f9bfd0"/>
      <path d="M61 96Q65 91 70 96Q76 92 82 98Q88 94 94 99Q100 95 106 99Q112 94 118 98Q124 92 130 96Q135 91 139 96L130 114q-30 6-60 0z" fill="#f6d66b"/>
      <path d="M70 114q30 6 60 0l-9 18q-21 6-42 0z" fill="#fffaf0"/>
      <path d="M79 132q21 6 42 0l-9 18q-12 10-24 0z" fill="#f6a9c0"/>
      <g fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M61 96Q65 91 70 96Q76 92 82 98Q88 94 94 99Q100 95 106 99Q112 94 118 98Q124 92 130 96Q135 91 139 96" stroke="#e2b04a"/>
      <path d="M70 114q30 6 60 0" stroke="#ead9c4"/>
      <path d="M79 132q21 6 42 0" stroke="#e58aa6"/>
      </g>
      <g fill="#e8607c"><circle cx="68" cy="88" r="2.4"/><circle cx="88" cy="91" r="2.4"/><circle cx="110" cy="90" r="2.4"/><circle cx="130" cy="86" r="2.2"/><circle cx="99" cy="85" r="2"/></g>
      <g fill="#c98a3c"><circle cx="72" cy="106" r="2.2"/><circle cx="89" cy="110" r="2.2"/><circle cx="107" cy="106" r="2.2"/><circle cx="124" cy="106" r="2"/><circle cx="97" cy="103" r="1.8"/></g>
      <g fill="#fbe7a6"><ellipse cx="80" cy="104" rx="4.5" ry="2"/><ellipse cx="116" cy="110" rx="4.5" ry="2"/></g>
      <g fill="none" stroke="#9fbfd3" stroke-width="3" stroke-linejoin="round">
      <path d="M42 68l42 86q16 14 32 0l42-86"/>
      <path d="M42 68a58 6 0 0 0 116 0"/>
      </g>
      <g stroke="#fff" stroke-linecap="round" opacity=".85">
      <path d="M53 82l26 54" stroke-width="5"/>
      <path d="M146 84l-6 12" stroke-width="3"/>
      </g>
      <g transform="rotate(22 128 58)">
      <rect x="118" y="6" width="20" height="52" rx="3" fill="#f3d39a" stroke="#c99a5a" stroke-width="2.5"/>
      <path d="M128 8v48M120 17h16M120 28h16M120 39h16M120 50h16" stroke="#ddb070" stroke-width="2"/>
      </g>
      <g fill="#fffaf0" stroke="#dcc9b6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <path d="M45 72A12 12 0 0 1 60 58A14 14 0 0 1 84 52A17 17 0 0 1 116 52A14 14 0 0 1 140 58A12 12 0 0 1 155 72Q154 79 145 77Q134 83 122 78Q111 83 100 79Q89 83 78 78Q66 83 55 77Q46 79 45 72z"/>
      <path d="M60 60q-1 6 3 11M140 60q1 6-3 11" fill="none" stroke-width="2.5"/>
      <path d="M62 56A13 13 0 0 1 80 42A24 24 0 0 1 120 42A13 13 0 0 1 138 56Q137 62 129 61Q120 66 110 62Q100 67 90 62Q80 66 71 61Q63 62 62 56z"/>
      <path d="M80 44q-1 6 3 11M120 44q1 6-3 11" fill="none" stroke-width="2.5"/>
      </g>
      <path d="M100 11C91 13 78 25 80 36c1 6 10 8 20 8s19-2 20-8c2-11-11-23-20-25z" fill="#ef4f63" stroke="#c93a50" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M82 41l7-6 5 5 6-7 6 7 5-5 7 6-10 4h-16z" fill="#8fcf8f" stroke="#6aa86a" stroke-width="2" stroke-linejoin="round"/>
      <g fill="#ffe8a8"><circle cx="94" cy="24" r="1.6"/><circle cx="106" cy="24" r="1.6"/><circle cx="89" cy="31" r="1.6"/><circle cx="100" cy="31" r="1.6"/><circle cx="111" cy="31" r="1.6"/></g>
      <ellipse cx="89" cy="25" rx="3.2" ry="2" transform="rotate(-45 89 25)" fill="#fff" opacity=".75"/>
      <g transform="translate(0 4)" fill="#9ad69a" stroke="#5fa45f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M66 42c-9-6-7-17 3-20 5 9 3 16-3 20z"/>
      <path d="M68 46c-10 2-16-4-14-12 9-1 14 4 14 12z"/>
      <path d="M67 40l2-14M66 44l-9-8" stroke-width="1.5"/>
      </g>`),
    item_catfood: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="180" rx="84" ry="10" fill="#e9d9cc" opacity=".6"/>
      <path d="M38 122L24 162a76 16 0 0 0 152 0L162 122z" fill="#f4a3b8" stroke="#d98ea2" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="100" cy="122" rx="64" ry="15" fill="#f9cbd5" stroke="#d98ea2" stroke-width="3"/>
      <ellipse cx="100" cy="122" rx="52" ry="10" fill="#e58fa6"/>
      <path d="M58 128L57 111 64 96 70 83.5 81.6 80.4 84.3 84.2 93.5 82.5 93 78.5 92 71 99.2 74.3 109 72 117.3 78.3 127 82 133.5 89.5 137.5 96 145 112 144 128 122 133 100 134 78 133z" fill="#d29356"/>
      <g stroke="#b47843" stroke-width="2.5" stroke-linejoin="round">
      <circle cx="57" cy="111" r="8.5" fill="#dc9a59"/>
      <circle cx="64" cy="95" r="9" fill="#e8ad6c"/>
      <path transform="translate(75 79) rotate(-15)" d="M0-10c2.5 0 9 12 9 15s-16 2.5-18 0 6.5-15 9-15z" fill="#dc9a59"/>
      <circle cx="92" cy="69" r="8.5" fill="#e8ad6c"/>
      <path transform="translate(109 71) rotate(10)" d="M0-10c2.5 0 9 12 9 15s-16 2.5-18 0 6.5-15 9-15z" fill="#dc9a59"/>
      <circle cx="127" cy="81" r="9" fill="#e8ad6c"/>
      <path transform="translate(137.5 95) rotate(20)" d="M0-10c2.5 0 9 12 9 15s-16 2.5-18 0 6.5-15 9-15z" fill="#dc9a59"/>
      <circle cx="145" cy="112" r="8.5" fill="#dc9a59"/>
      <circle cx="101" cy="109" r="9" fill="#dc9a59"/>
      </g>
      <g transform="translate(100 88) rotate(-8) scale(1.35)">
      <path d="M-14 0c4-8 15-9 20-2l8-6c-1 5-1 11 0 16l-8-6c-5 7-16 6-20-2z" fill="#fde2b0" stroke="#b5773f" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M-10-4q4-2.5 9-1.5" fill="none" stroke="#fff6e4" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="-8" cy="0" r="1.7" fill="#8a5428"/>
      </g>
      <g transform="translate(72 115) rotate(-8) scale(-1.35 1.35)">
      <path d="M-14 0c4-8 15-9 20-2l8-6c-1 5-1 11 0 16l-8-6c-5 7-16 6-20-2z" fill="#fbd598" stroke="#b5773f" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M-10-4q4-2.5 9-1.5" fill="none" stroke="#fff6e4" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="-8" cy="0" r="1.7" fill="#8a5428"/>
      </g>
      <g transform="translate(130 116) rotate(6) scale(1.35)">
      <path d="M-14 0c4-8 15-9 20-2l8-6c-1 5-1 11 0 16l-8-6c-5 7-16 6-20-2z" fill="#fde2b0" stroke="#b5773f" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M-10-4q4-2.5 9-1.5" fill="none" stroke="#fff6e4" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="-8" cy="0" r="1.7" fill="#8a5428"/>
      </g>
      <g fill="none" stroke="#f3c48e" stroke-width="2.5" stroke-linecap="round">
      <path d="M87 65q3-3 7-3"/><path d="M122 77q3-3 6-3"/>
      </g>
      <path d="M36 122a64 15 0 0 0 128 0h-12a52 10 0 0 1-104 0z" fill="#f9cbd5" stroke="#d98ea2" stroke-width="3" stroke-linejoin="round"/>
      <path d="M46 131q16 7 34 8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <path d="M35 144l-7 18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
      <g fill="#fff5f7">
      <path d="M100 154c7 0 12 6 12 11 0 5-5 6-12 6s-12-1-12-6c0-5 5-11 12-11z"/>
      <ellipse cx="85" cy="151" rx="4.5" ry="5.5" transform="rotate(-25 85 151)"/>
      <ellipse cx="94" cy="144" rx="4.5" ry="5.5" transform="rotate(-8 94 144)"/>
      <ellipse cx="106" cy="144" rx="4.5" ry="5.5" transform="rotate(8 106 144)"/>
      <ellipse cx="115" cy="151" rx="4.5" ry="5.5" transform="rotate(25 115 151)"/>
      </g>`),
    item_softcream: () => svg('0 0 200 200', `
      <ellipse cx="100" cy="184.5" rx="60" ry="5.5" fill="#e9d9cc" opacity=".6"/>
      <ellipse cx="100" cy="179" rx="48" ry="7.5" fill="#f0d8a4" stroke="#b8934f" stroke-width="3"/>
      <path d="M78 150L62 176M122 150L138 176" stroke="#b8934f" stroke-width="9" stroke-linecap="round"/>
      <path d="M78 150L62 176M122 150L138 176" stroke="#e2c48a" stroke-width="4" stroke-linecap="round"/>
      <path d="M77 150A23 6.5 0 0 1 123 150" fill="none" stroke="#b8934f" stroke-width="9"/>
      <path d="M77 150A23 6.5 0 0 1 123 150" fill="none" stroke="#e2c48a" stroke-width="4"/>
      <path d="M62 116L97 170Q100 175 103 170L138 116z" fill="#f0c27a" stroke="#c9924a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M77 116L107.5 162.6M123 116L92.5 162.6M92 116L115 151.1M108 116L85 151.1M107 116L122.5 139.7M93 116L77.5 139.7M122 116L130 128.2M78 116L70 128.2" stroke="#d39e57" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M72 124l12 26" stroke="#fbe0a8" stroke-width="4" stroke-linecap="round"/>
      <path d="M77 150A23 6.5 0 0 0 123 150" fill="none" stroke="#b8934f" stroke-width="9"/>
      <path d="M77 150A23 6.5 0 0 0 123 150" fill="none" stroke="#e2c48a" stroke-width="4"/>
      <rect x="56" y="107" width="88" height="16" rx="8" fill="#f5cd8a" stroke="#c9924a" stroke-width="3"/>
      <g fill="#fffaf0" stroke="#c9ad92" stroke-width="3" stroke-linejoin="round">
      <path d="M36 99C34 80 64 70 100 69C136 68 166 76 164 94C163 110 134 118 100 118C66 118 37 113 36 99z"/>
      <path d="M48 80C46 62 72 52 100 51C128 50 150 60 153 78C155 88 155 97 149 100C142 104 130 94 100 93C72 92 49 92 48 80z"/>
      <path d="M62 58C60 43 80 33 100 32C120 31 136 40 138 55C140 63 140 71 135 74C129 77 120 69 100 68C80 67 63 68 62 58z"/>
      <path d="M82 45C80 33 90 27 100 23C107 20 109 15 103 10C114 10 122 18 122 27C122 35 118 41 119 45"/>
      </g>
      <g fill="none" stroke="#f0dfc7" stroke-width="7" stroke-linecap="round">
      <path d="M42 103C46 111 70 113 100 113C130 113 155 108 159 97"/>
      <path d="M53 85C57 88 76 88 100 88.5C125 89 136 96 144 96C148 95 150 91 149 87"/>
      <path d="M67 61C70 64 84 64 100 64C116 65 124 70 130 70C134 69 135 66 134 63"/>
      </g>
      <path d="M106 13c6 3 9 9 6 15-3 5-9 7-16 7" fill="none" stroke="#f0dfc7" stroke-width="3" stroke-linecap="round"/>
      <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round">
      <path d="M41 103c-1-4 0-8 4-11"/><path d="M53 81c0-5 2-9 7-12"/><path d="M67 56c0-5 3-9 9-11"/><path d="M86 37c1-4 4-7 9-9"/>
      </g>
      <g fill="#fff"><ellipse cx="50" cy="98" rx="2.8" ry="2"/><ellipse cx="64" cy="76" rx="2.5" ry="1.8"/><ellipse cx="78" cy="53" rx="2.2" ry="1.6"/></g>`),
    item_shrimp: () => {
      // まるまった エビ。しっぽ → あたまの じゅんに かさねる
      const segs = [[-255, 13], [-220, 17], [-180, 20], [-140, 23], [-95, 25]];
      const at = (deg, R = 40) => [100 + R * Math.cos(deg * Math.PI / 180), 106 + R * Math.sin(deg * Math.PI / 180)];
      const body = segs.map(([a, r]) => {
        const [x, y] = at(a);
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f8a27c" stroke="#d9694a" stroke-width="3"/>
          <path d="M${x - r * 0.55} ${y - r * 0.5}a${r * 0.75} ${r * 0.75} 0 0 1 ${r * 1.1} 0" fill="none" stroke="#ffd9c6" stroke-width="4" stroke-linecap="round" transform="rotate(${a + 90} ${x} ${y})"/>`;
      }).join('');
      const [tx, ty] = at(-255, 40);
      const [hx, hy] = at(-50, 40);
      return svg('0 0 200 200', `
        <ellipse cx="100" cy="168" rx="84" ry="22" fill="#fffdf9" stroke="${LINE}" stroke-width="3"/>
        <ellipse cx="100" cy="164" rx="64" ry="13" fill="#fbf4ea" stroke="#e6cb8d" stroke-width="3"/>
        <g fill="#f2865e" stroke="#d9694a" stroke-width="3" stroke-linejoin="round">
          <path d="M${tx} ${ty}l38-14c0 12-14 22-34 18z"/><path d="M${tx} ${ty}l36 16c-10 10-28 8-36-4z"/>
        </g>
        ${body}
        <g fill="none" stroke="#d9694a" stroke-width="2.5" stroke-linecap="round">
          <path d="M${hx + 10} ${hy - 14}c14-22 28-28 42-24"/><path d="M${hx + 16} ${hy - 6}c16-12 30-12 40-4"/>
          <path d="M84 96l-6 6M96 92l-4 8M108 94l-2 8"/>
        </g>
        <circle cx="${hx}" cy="${hy}" r="26" fill="#f8a27c" stroke="#d9694a" stroke-width="3"/>
        <path d="M${hx - 16} ${hy - 12}c8-10 22-12 32-4" fill="none" stroke="#ffd9c6" stroke-width="5" stroke-linecap="round"/>
        <circle cx="${hx + 6}" cy="${hy - 2}" r="6" fill="#3d4a66"/><circle cx="${hx + 4}" cy="${hy - 4}" r="2.2" fill="#fff"/>
        <ellipse cx="${hx - 6}" cy="${hy + 10}" rx="6" ry="3.5" fill="#f37d9b" opacity=".5"/>`);
    },
    item_towel: () => svg('0 0 200 200', `
      <path d="M30 70c46-14 94-14 140 0v84c-46 14-94 14-140 0z" fill="#f6b8c6" stroke="#d98ea2" stroke-width="3"/>
      <path d="M30 70c46-14 94-14 140 0v26c-46-14-94-14-140 0z" fill="#f9cbd5"/>
      <path d="M30 128c46-12 94-12 140 0" fill="none" stroke="#fff" stroke-width="7" opacity=".9"/>
      <path d="M30 142c46-12 94-12 140 0" fill="none" stroke="#fff" stroke-width="4" opacity=".9"/>
      <g fill="#fff" opacity=".5"><circle cx="60" cy="110" r="2"/><circle cx="90" cy="104" r="2"/><circle cx="120" cy="108" r="2"/><circle cx="150" cy="112" r="2"/></g>`),
    item_yarn: () => svg('0 0 200 200', `
      <path d="M150 150c20 10 30 24 22 34-8 8-26 0-36 6" fill="none" stroke="#7fb3d6" stroke-width="4" stroke-linecap="round"/>
      ${yarnSvg('#a9d6f2', '#7fb3d6', '#d6eefc').replace(/^<svg[^>]*>|<\/svg>$/g, '')}`)
  };

  /* ---------- おふろ（バスタブ・じゃぐち・シャワー・せっけん・おもちゃ）と ねんねの ベッド ---------- */
  // バスタブは うしろ・まえ の 2まい（y=72 で わける）。ニャーちゃんを あいだに はさむ
  const bath = {
    bath_tub_back: () => svg('0 0 760 380', `
      <g stroke-linejoin="round" stroke-linecap="round">
      <path d="M20 75V72A360 55 0 0 1 740 72V75H720V72A340 45 0 0 0 40 72V75Z" fill="#ffe08e"/>
      <path d="M40 75V72A340 45 0 0 1 720 72V75Z" fill="#eaf6fa"/>
      <path d="M53.7 75V72A328 39 0 0 1 706.3 72V75Z" fill="#cfeefc"/>
      <path d="M53.7 72A328 39 0 0 1 706.3 72" fill="none" stroke="#8cc8e6" stroke-width="3"/>
      <path d="M40 72A340 45 0 0 1 720 72" fill="none" stroke="#3b3236" stroke-width="3.5"/>
      <path d="M20 72A360 55 0 0 1 740 72" fill="none" stroke="#3b3236" stroke-width="5"/>
      <path d="M140 35.6A350 50 0 0 1 250 25.6" fill="none" stroke="#fff" stroke-width="4"/>
      <path d="M560 29.1A350 50 0 0 1 610 34.3" fill="none" stroke="#fff" stroke-width="4"/>
      <g fill="none" stroke="#fff" stroke-width="3.5">
      <path d="M104 64q14-7 28 0q14 7 28 0"/>
      <path d="M200 52q12-6 24 0"/>
      <path d="M588 58q14-7 28 0q14 7 28 0"/>
      <path d="M520 48q12-6 24 0"/>
      </g>
      <ellipse cx="300" cy="46" rx="18" ry="4" fill="#fff" opacity=".8"/>
      </g>`),
    bath_tub_front: () => svg('0 0 760 380', `
      <g stroke-linejoin="round" stroke-linecap="round">
      <g transform="translate(228 248) rotate(4) scale(.9)">
      <path d="M-22 0C-20 30-12 46-13 60C-30 62-40 78-37 92C-35 104-20 106-12 101C-6 106 6 106 12 101C20 106 35 104 37 92C40 78 30 62 13 60C12 46 20 30 22 0Z" fill="#f3cf8f" stroke="#3b3236" stroke-width="4"/>
      <path d="M-12 101l1-9M12 101l-1-9" fill="none" stroke="#3b3236" stroke-width="3"/>
      </g>
      <g transform="translate(532 248) rotate(-4) scale(.9)">
      <path d="M-22 0C-20 30-12 46-13 60C-30 62-40 78-37 92C-35 104-20 106-12 101C-6 106 6 106 12 101C20 106 35 104 37 92C40 78 30 62 13 60C12 46 20 30 22 0Z" fill="#f3cf8f" stroke="#3b3236" stroke-width="4"/>
      <path d="M-12 101l1-9M12 101l-1-9" fill="none" stroke="#3b3236" stroke-width="3"/>
      </g>
      <g transform="translate(170 262) rotate(8)">
      <path d="M-22 0C-20 30-12 46-13 60C-30 62-40 78-37 92C-35 104-20 106-12 101C-6 106 6 106 12 101C20 106 35 104 37 92C40 78 30 62 13 60C12 46 20 30 22 0Z" fill="#f3cf8f" stroke="#3b3236" stroke-width="4"/>
      <path d="M-12 101l1-9M12 101l-1-9" fill="none" stroke="#3b3236" stroke-width="3"/>
      <path d="M-12 30C-10 40-8 48-8 54" fill="none" stroke="#fff" stroke-width="4"/>
      <ellipse cx="-24" cy="82" rx="4" ry="7" fill="#fff"/>
      </g>
      <g transform="translate(590 262) rotate(-8)">
      <path d="M-22 0C-20 30-12 46-13 60C-30 62-40 78-37 92C-35 104-20 106-12 101C-6 106 6 106 12 101C20 106 35 104 37 92C40 78 30 62 13 60C12 46 20 30 22 0Z" fill="#f3cf8f" stroke="#3b3236" stroke-width="4"/>
      <path d="M-12 101l1-9M12 101l-1-9" fill="none" stroke="#3b3236" stroke-width="3"/>
      <path d="M-12 30C-10 40-8 48-8 54" fill="none" stroke="#fff" stroke-width="4"/>
      <ellipse cx="-24" cy="82" rx="4" ry="7" fill="#fff"/>
      </g>
      <path d="M34 80V84C38 230 120 300 380 300C640 300 722 230 726 84V80Z" fill="#fff"/>
      <path d="M78 130C92 210 150 262 250 278" fill="none" stroke="#e3f2f7" stroke-width="14"/>
      <path d="M694 150C690 186 676 214 656 234" fill="none" stroke="#e3f2f7" stroke-width="10"/>
      <g fill="#fbe0e8"><ellipse cx="380" cy="214" rx="21" ry="16"/><ellipse cx="352" cy="190" rx="8" ry="10"/><ellipse cx="370" cy="179" rx="8" ry="10"/><ellipse cx="390" cy="179" rx="8" ry="10"/><ellipse cx="408" cy="190" rx="8" ry="10"/></g>
      <path d="M34 84C38 230 120 300 380 300C640 300 722 230 726 84" fill="none" stroke="#3b3236" stroke-width="5"/>
      <path d="M20 72V84A360 55 0 0 0 740 84V72Z" fill="#f6d27a"/>
      <path d="M20 72V84A360 55 0 0 0 740 84V72" fill="none" stroke="#3b3236" stroke-width="5"/>
      <path d="M20 72A360 55 0 0 0 740 72H720A340 45 0 0 1 40 72Z" fill="#ffe08e"/>
      <path d="M40 72A340 45 0 0 0 720 72Z" fill="#eaf6fa"/>
      <path d="M53.7 72A328 39 0 1 0 706.3 72Z" fill="#cfeefc"/>
      <path d="M53.7 72A328 39 0 1 0 706.3 72" fill="none" stroke="#8cc8e6" stroke-width="3"/>
      <path d="M40 72A340 45 0 0 0 720 72" fill="none" stroke="#3b3236" stroke-width="3.5"/>
      <path d="M20 72A360 55 0 0 0 740 72" fill="none" stroke="#3b3236" stroke-width="5"/>
      <g fill="none" stroke="#fff" stroke-width="3.5">
      <path d="M130 90q14-7 28 0q14 7 28 0"/>
      <path d="M282.3 76.4A104 13 0 0 0 477.7 76.4"/>
      <path d="M246.9 77.9A140 19 0 0 0 293.8 87M466.2 87A140 19 0 0 0 513.1 77.9" stroke-width="3"/>
      <path d="M560 94q14-7 28 0q14 7 28 0"/>
      <path d="M90 110.6A360 55 0 0 0 170 122.7" stroke-width="3.5"/>
      </g>
      </g>`),
    bath_faucet: () => svg('0 0 150 130', `
      <g stroke-linejoin="round" stroke-linecap="round">
      <rect x="16" y="92" width="24" height="16" rx="5" fill="#ecd08f" stroke="#3b3236" stroke-width="3.5"/>
      <circle cx="28" cy="76" r="21" fill="#ecd08f" stroke="#3b3236" stroke-width="4"/>
      <circle cx="28" cy="76" r="11" fill="#f6e2b0" stroke="#3b3236" stroke-width="3"/>
      <path d="M18 64q6-5 13-5" fill="none" stroke="#fff" stroke-width="3.5"/>
      <path d="M64 80H100Q124 80 124 96" fill="none" stroke="#3b3236" stroke-width="24"/>
      <path d="M64 80H100Q124 80 124 96" fill="none" stroke="#ecd08f" stroke-width="16"/>
      <path d="M88 75H100Q110 75 116 82" fill="none" stroke="#fff" stroke-width="3.5"/>
      <rect x="110" y="96" width="28" height="13" rx="5" fill="#ecd08f" stroke="#3b3236" stroke-width="4"/>
      <path d="M115 100h8" stroke="#fff" stroke-width="3"/>
      <rect x="46" y="60" width="36" height="34" rx="10" fill="#ecd08f" stroke="#3b3236" stroke-width="4"/>
      <path d="M53 69v12" stroke="#fff" stroke-width="3.5"/>
      <rect x="58" y="44" width="12" height="18" rx="3" fill="#ecd08f" stroke="#3b3236" stroke-width="4"/>
      <path d="M40 34H88M64 34V12" fill="none" stroke="#3b3236" stroke-width="17"/>
      <path d="M40 34H88M64 34V12" fill="none" stroke="#ecd08f" stroke-width="9"/>
      <path d="M42 31H52M61 13V22" fill="none" stroke="#fff" stroke-width="3"/>
      <circle cx="64" cy="34" r="12" fill="#f7a8c4" stroke="#3b3236" stroke-width="4"/>
      <ellipse cx="60" cy="30" rx="4" ry="3" fill="#fff"/>
      </g>`),
    item_shower: () => svg('0 0 150 150', `
      <g stroke-linejoin="round" stroke-linecap="round">
      <path d="M31 119L21 129" fill="none" stroke="#3b3236" stroke-width="18"/>
      <path d="M31 119L21 129" fill="none" stroke="#ecd08f" stroke-width="10"/>
      <path d="M33 117L84 66" fill="none" stroke="#3b3236" stroke-width="24"/>
      <path d="M33 117L84 66" fill="none" stroke="#ecd08f" stroke-width="16"/>
      <path d="M31 111L66 76" fill="none" stroke="#fff" stroke-width="3.5"/>
      <ellipse cx="100" cy="44" rx="32" ry="22" transform="rotate(-45 100 44)" fill="#ecd08f" stroke="#3b3236" stroke-width="4"/>
      <path d="M130.6 29.4L122.6 21.4L77.4 66.6L85.4 74.6Z" fill="#ecd08f"/>
      <path d="M130.6 29.4L122.6 21.4M85.4 74.6L77.4 66.6" fill="none" stroke="#3b3236" stroke-width="4"/>
      <ellipse cx="108" cy="52" rx="32" ry="22" transform="rotate(-45 108 52)" fill="#fff3d6" stroke="#3b3236" stroke-width="4"/>
      <g transform="translate(108 52) rotate(-45) scale(1 .69)" fill="#3b3236">
      <circle r="3.4"/><circle cx="16" r="3.2"/><circle cx="8" cy="13.9" r="3.2"/><circle cx="-8" cy="13.9" r="3.2"/><circle cx="-16" r="3.2"/><circle cx="-8" cy="-13.9" r="3.2"/><circle cx="8" cy="-13.9" r="3.2"/>
      </g>
      <path d="M91 46q3-7 11-11" fill="none" stroke="#fff" stroke-width="3.5"/>
      </g>`),
    item_soap_lavender: () => svg('0 0 140 110', `
      <ellipse cx="70" cy="101" rx="52" ry="5" fill="#9a7fd0" opacity=".3"/><path d="M16 58C16 46 22 36 40 36H100C118 36 124 46 124 58V78C124 90 118 100 100 100H40C22 100 16 90 16 78Z" fill="#b49be6" stroke="#3b3236" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 84C26 92 32 95 42 95H98C108 95 114 92 118 84" fill="none" stroke="#9a7fd0" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity=".7"/><path d="M40 36H100C118 36 124 46 124 58C124 70 118 80 100 80H40C22 80 16 70 16 58C16 46 22 36 40 36Z" fill="#cdb6f0" stroke="#3b3236" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M44 42H96C110 42 116 50 116 58C116 66 110 74 96 74H44C30 74 24 66 24 58C24 50 30 42 44 42Z" fill="none" stroke="#dccbf6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 70L82 46M42 70L106 63" fill="none" stroke="#6fae6a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M52 64C46 58 38 57 33 60C38 65 45 67 52 64Z" fill="#a6dca0" stroke="#6fae6a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><g fill="#b597ea" stroke="#8466c4" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="57.5" cy="57.8" rx="4.5" ry="3.1" transform="rotate(-56 57.5 57.8)"/><ellipse cx="64.7" cy="59.2" rx="4.2" ry="2.9" transform="rotate(-6 64.7 59.2)"/><ellipse cx="66.9" cy="52.5" rx="4" ry="2.7" transform="rotate(-56 66.9 52.5)"/><ellipse cx="73.8" cy="53.3" rx="3.7" ry="2.5" transform="rotate(-6 73.8 53.3)"/><ellipse cx="76.4" cy="47.1" rx="3.4" ry="2.3" transform="rotate(-56 76.4 47.1)"/><ellipse cx="82" cy="46" rx="3.2" ry="2.1" transform="rotate(-31 82 46)"/></g><g fill="#b597ea" stroke="#8466c4" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="73.7" cy="64.1" rx="4.3" ry="2.9" transform="rotate(-31.2 73.7 64.1)"/><ellipse cx="80.6" cy="68" rx="4" ry="2.7" transform="rotate(18.8 80.6 68)"/><ellipse cx="86.6" cy="63" rx="3.7" ry="2.5" transform="rotate(-31.2 86.6 63)"/><ellipse cx="93.4" cy="66.3" rx="3.5" ry="2.4" transform="rotate(18.8 93.4 66.3)"/><ellipse cx="99.4" cy="61.9" rx="3.2" ry="2.2" transform="rotate(-31.2 99.4 61.9)"/><ellipse cx="106" cy="63" rx="3" ry="2" transform="rotate(-6.2 106 63)"/></g><path d="M28 52C30 46 36 42 44 41.5" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="108" cy="74" rx="5" ry="2.2" fill="#fff" opacity=".8"/><path d="M26 84C28 86 31 87 35 87.3" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" opacity=".7"/><circle cx="124" cy="30" r="10" fill="#fff" stroke="#7fb6d6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M118.5 29A5.5 5.5 0 0 1 123 24.5" fill="none" stroke="#bfe0f0" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="131" cy="47" r="4.5" fill="#fff" stroke="#7fb6d6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="14" cy="36" r="6.5" fill="#fff" stroke="#7fb6d6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.4 35.4A3.6 3.6 0 0 1 13.4 32.4" fill="none" stroke="#bfe0f0" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`),
    item_soap_sakura: () => svg('0 0 140 110', `
      <ellipse cx="70" cy="101" rx="52" ry="5" fill="#e48aa6" opacity=".3"/><path d="M16 58C16 46 22 36 40 36H100C118 36 124 46 124 58V78C124 90 118 100 100 100H40C22 100 16 90 16 78Z" fill="#f2a6bd" stroke="#3b3236" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 84C26 92 32 95 42 95H98C108 95 114 92 118 84" fill="none" stroke="#e48aa6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity=".7"/><path d="M40 36H100C118 36 124 46 124 58C124 70 118 80 100 80H40C22 80 16 70 16 58C16 46 22 36 40 36Z" fill="#f9c1d1" stroke="#3b3236" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M44 42H96C110 42 116 50 116 58C116 66 110 74 96 74H44C30 74 24 66 24 58C24 50 30 42 44 42Z" fill="none" stroke="#fcd9e3" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><g fill="#fbd9e4" stroke="#e48aa6" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M70 58C59.8 55.1 57.7 48.3 64.4 45.4L70 47.7L75.6 45.4C82.3 48.3 80.2 55.1 70 58Z"/><path d="M70 58C71.7 51.7 82.7 48.5 89.7 51.1L87.5 54.8L93.1 57.1C90.3 61.5 78 62.6 70 58Z"/><path d="M70 58C81.3 57 90.1 61.8 87.8 66.3L80.8 66.3L78.7 70C70.3 69.9 64.7 63.7 70 58Z"/><path d="M70 58C75.3 63.7 69.7 69.9 61.3 70L59.2 66.3L52.2 66.3C49.9 61.8 58.7 57 70 58Z"/><path d="M70 58C62 62.6 49.7 61.5 46.9 57.1L52.5 54.8L50.3 51.1C57.3 48.5 68.3 51.7 70 58Z"/></g><path d="M70 55.2L70 50.7M74.8 57.1L82.4 55.8M72.9 60.3L77.6 63.9M67.1 60.3L62.4 63.9M65.2 57.1L57.6 55.8" fill="none" stroke="#f1a7bf" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="70" cy="58" rx="5.5" ry="3.5" fill="#ffe08e" stroke="#e48aa6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M28 52C30 46 36 42 44 41.5" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="108" cy="74" rx="5" ry="2.2" fill="#fff" opacity=".8"/><path d="M26 84C28 86 31 87 35 87.3" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" opacity=".7"/><circle cx="18" cy="30" r="9.5" fill="#fff" stroke="#7fb6d6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M12.8 29.1A5.2 5.2 0 0 1 17.1 24.8" fill="none" stroke="#bfe0f0" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="8" cy="46" r="4" fill="#fff" stroke="#7fb6d6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="126" cy="34" r="6.5" fill="#fff" stroke="#7fb6d6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M122.4 33.4A3.6 3.6 0 0 1 125.4 30.4" fill="none" stroke="#bfe0f0" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`),
    petal_lavender: () => svg('0 0 40 40', `
      <path d="M13.9 35.7C16.6 28.5 21.1 19.5 28.3 8.7" fill="none" stroke="#5fa86a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><path d="M16.1 30.3C12.1 29.8 8.9 27.6 8 24C12.1 24 15.2 26.2 16.1 30.3Z" fill="#a6dca0" stroke="#5fa86a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><g fill="#b597ea" stroke="#7d62b8" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="17.7" cy="21.9" rx="4.1" ry="2.8" transform="rotate(-95.9 17.7 21.9)"/><ellipse cx="24.6" cy="20.4" rx="3.7" ry="2.5" transform="rotate(-25.9 24.6 20.4)"/><ellipse cx="22.6" cy="14" rx="3.4" ry="2.3" transform="rotate(-95.9 22.6 14)"/><ellipse cx="28.8" cy="12" rx="3.1" ry="2.1" transform="rotate(-25.9 28.8 12)"/><ellipse cx="29.2" cy="6.9" rx="2.8" ry="1.9" transform="rotate(-60.9 29.2 6.9)"/></g>`),
    petal_sakura: () => svg('0 0 40 40', `
      <path d="M13.6 35.4C3.1 24.3 6.2 8 16.8 4.6L22 12.3L30.9 9.8C36.9 19.2 28.7 33.7 13.6 35.4Z" fill="#f9c1d1" stroke="#e48aa6" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M15.3 30.7L20.1 17.5M14.3 26.1L14.4 18.7M19 27.8L23.8 22.1" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity=".7"/>`),
    toy_duck: () => svg('0 0 130 120', `
      <g stroke="#3b3236" stroke-linejoin="round" stroke-linecap="round" stroke-width="3.5">
      <g fill="#ffe27a" stroke-width="7"><path d="M12 48C22 58 36 62 50 62H92C118 60 124 82 114 96C106 106 88 108 64 108C40 108 22 102 16 88C12 78 10 62 12 48Z"/><circle cx="80" cy="40" r="26"/></g>
      <g fill="#ffe27a" stroke="none"><path d="M12 48C22 58 36 62 50 62H92C118 60 124 82 114 96C106 106 88 108 64 108C40 108 22 102 16 88C12 78 10 62 12 48Z"/><circle cx="80" cy="40" r="26"/></g>
      <path d="M77 13C76 9 79 5 84 4M83 13C84 10 88 8 92 9" fill="none" stroke-width="3"/>
      <path d="M100 34C108 29 119 32 124 39C119 45 108 46 100 44Z" fill="#f6a24a"/>
      <path d="M105 40H118" fill="none" stroke-width="2.5"/>
      <ellipse cx="110" cy="35" rx="3" ry="1.5" fill="#fff" stroke="none"/>
      <ellipse cx="88" cy="31" rx="4" ry="5" fill="#3b3236" stroke="none"/>
      <circle cx="89.5" cy="29" r="1.5" fill="#fff" stroke="none"/>
      <ellipse cx="88" cy="47" rx="6" ry="3.5" fill="#f9a7b8" stroke="none"/>
      <path d="M34 75C50 70 74 70 82 80C88 90 78 98 62 98C50 98 41 90 34 75Z" fill="#ffd45c" stroke-width="3"/><path d="M52 87C60 89 67 89 73 87" fill="none" stroke-width="2.5"/>
      <path d="M63 32C65 26 69 22 74 20M24 86C28 94 36 99 46 101" fill="none" stroke="#fff" stroke-width="4"/>
      </g>`),
    toy_boat: () => svg('0 0 150 140', `
      <g stroke="#3b3236" stroke-linejoin="round" stroke-linecap="round" stroke-width="3.5">
      <path d="M62 13L40 20L62 27Z" fill="#f7a8c4" stroke-width="3"/>
      <rect x="59" y="10" width="6" height="82" rx="3" fill="#f3cf8f" stroke-width="3"/>
      <circle cx="62" cy="9" r="4.5" fill="#ffe27a" stroke-width="3"/>
      <path d="M66 20C94 38 116 58 122 73H66Z" fill="#fff"/>
      <path d="M86 66C72 57 73 45 80 45C83 45 85 47 86 50C87 47 89 45 92 45C99 45 100 57 86 66Z" fill="#f78fb3" stroke-width="3"/>
      <rect x="60" y="73" width="66" height="6" rx="3" fill="#f3cf8f" stroke-width="3"/>
      <path d="M10 88H124C132 88 138 84 142 80C138 104 122 125 100 125H46C28 125 16 108 10 88Z" fill="#a9e0c4"/>
      <path d="M20 97H128" fill="none" stroke="#fff" stroke-width="4"/>
      <g fill="#fff" stroke-width="3"><circle cx="50" cy="110" r="5.5"/><circle cx="74" cy="110" r="5.5"/><circle cx="98" cy="110" r="5.5"/></g>
      </g>`),
    toy_can: () => svg('0 0 160 130', `
      <g stroke="#3b3236" stroke-linejoin="round" stroke-linecap="round" stroke-width="3.5">
      <path d="M50 72C12 60 4 114 46 104" fill="none" stroke-width="13"/>
      <path d="M50 72C12 60 4 114 46 104" fill="none" stroke="#9fd0f2" stroke-width="6.5"/>
      <g transform="translate(147 33) rotate(-45)">
      <path d="M-69 -7.5L-17 -4.5V4.5L-69 7.5Z" fill="#9fd0f2"/>
      <path d="M-19 -5L-3.5 -11.5V11.5L-19 5Z" fill="#9fd0f2" stroke-width="3"/>
      <ellipse cx="-1.5" cy="0" rx="6" ry="12.5" fill="#d6eefc" stroke-width="3"/>
      <g fill="#3b3236" stroke="none"><circle cx="-1.5" cy="0" r="1.5"/><circle cx="-1.5" cy="-6.8" r="1.5"/><circle cx="-1.5" cy="6.8" r="1.5"/><circle cx="0.9" cy="-3.4" r="1.5"/><circle cx="0.9" cy="3.4" r="1.5"/><circle cx="-3.9" cy="-3.4" r="1.5"/><circle cx="-3.9" cy="3.4" r="1.5"/></g>
      </g>
      <path d="M40 62L36 114Q36 125 47 125H99Q110 125 110 114L106 62Z" fill="#9fd0f2"/>
      <ellipse cx="73" cy="62" rx="33" ry="8" fill="#6fb3e3"/>
      <path d="M47 74L44.5 108" fill="none" stroke="#fff" stroke-width="5"/>
      <g fill="#fff"><g stroke-width="5"><circle cx="80" cy="89" r="6.5"/><circle cx="86.7" cy="93.8" r="6.5"/><circle cx="84.1" cy="101.7" r="6.5"/><circle cx="75.9" cy="101.7" r="6.5"/><circle cx="73.3" cy="93.8" r="6.5"/></g><g stroke="none"><circle cx="80" cy="89" r="6.5"/><circle cx="86.7" cy="93.8" r="6.5"/><circle cx="84.1" cy="101.7" r="6.5"/><circle cx="75.9" cy="101.7" r="6.5"/><circle cx="73.3" cy="93.8" r="6.5"/></g></g>
      <circle cx="80" cy="96" r="4.5" fill="#ffe27a" stroke-width="2.5"/>
      </g>`),
    toy_fish: () => svg('0 0 150 110', `
      <g stroke="#3b3236" stroke-linejoin="round" stroke-linecap="round" stroke-width="3.5">
      <path d="M48 58C30 38 14 20 7 30C2 40 10 52 16 58C10 64 2 76 7 86C14 96 30 78 48 58Z" fill="#f2868a"/>
      <path d="M52 36C48 8 90 -2 109 32" fill="#f2868a"/>
      <path d="M62 86C58 102 80 106 92 90" fill="#f2868a"/>
      <path d="M18 38L32 52M18 78L32 64M70 18L74 27M87 17.5L85.5 26" fill="none" stroke="#fff" stroke-width="3"/>
      <ellipse cx="84" cy="59" rx="46" ry="34" fill="#f8a39a"/>
      <path d="M95 60C86 60 70 63 65 73C62 81 72 87 79 83C88 77 93 68 95 60Z" fill="#f2868a" stroke-width="3"/>
      <path d="M88 64L72 72M89 67L78 79" fill="none" stroke="#fff" stroke-width="2.5"/>
      <g fill="#fff" stroke="none"><circle cx="64" cy="42" r="5"/><circle cx="49" cy="60" r="4"/><circle cx="53" cy="75" r="3.5"/><circle cx="94" cy="84" r="3.5"/><circle cx="86" cy="36" r="4"/></g>
      <circle cx="110" cy="48" r="11" fill="#fff" stroke-width="3"/>
      <circle cx="112" cy="49" r="6.5" fill="#3b3236" stroke="none"/>
      <circle cx="114.5" cy="46" r="2.4" fill="#fff" stroke="none"/>
      <ellipse cx="107" cy="67" rx="6" ry="3.5" fill="#f47d93" stroke="none"/>
      <path d="M117 67Q123 74 128.5 65" fill="none" stroke-width="3"/>
      </g>`),
    item_bed: () => svg('0 0 560 360', `
      <g stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="282" cy="345" rx="260" ry="10" fill="#000" opacity=".08"/>
      <rect x="26" y="306" width="42" height="42" rx="9" fill="#f3cf8f" stroke="#3b3236" stroke-width="4"/>
      <rect x="478" y="306" width="44" height="42" rx="9" fill="#f3cf8f" stroke="#3b3236" stroke-width="4"/>
      <rect x="58" y="234" width="410" height="64" rx="14" fill="#f6c3cf" stroke="#3b3236" stroke-width="5"/>
      <rect x="78" y="250" width="366" height="34" rx="10" fill="#fbdde5" stroke="#3b3236" stroke-width="3"/>
      <path d="M94 258H190" stroke="#fff" stroke-width="3.5" fill="none"/>
      <rect x="62" y="194" width="412" height="44" rx="16" fill="#fffdf8" stroke="#3b3236" stroke-width="4"/>
      <path d="M78 194H458C468 194 474 200 474 210V216q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0q-10.3 8 -20.6 0V210C62 200 68 194 78 194Z" fill="#e6dcf8" stroke="#3b3236" stroke-width="3.5"/>
      <path d="M90 228h8M118 228h8M146 228h8M174 228h8M202 228h8M230 228h8M258 228h8M286 228h8M314 228h8M342 228h8M370 228h8M398 228h8M426 228h8" stroke="#ebcfa6" stroke-width="3" fill="none"/>
      <path d="M90 201H230" stroke="#fff" stroke-width="3.5" fill="none"/>
      <path d="M452 322V100C452 60 476 40 500 40C524 40 548 60 548 100V322Z" fill="#f6c3cf" stroke="#3b3236" stroke-width="5"/>
      <path d="M467 306V106C467 76 484 58 500 58C516 58 533 76 533 106V306Z" fill="#fbdde5" stroke="#3b3236" stroke-width="3"/>
      <path d="M459 120V300" stroke="#fff" stroke-width="4" fill="none"/>
      <path transform="translate(500 104) scale(1.1)" d="M0 12C-4 8-15 2-15-5C-15-11-10-14-6-14C-3-14-1-12 0-9C1-12 3-14 6-14C10-14 15-11 15-5C15 2 4 8 0 12Z" fill="#f48fb1" stroke="#3b3236" stroke-width="2.8"/>
      <ellipse cx="492" cy="96" rx="4" ry="2.5" fill="#fff"/>
      <path d="M14 322V204C14 184 28 170 47 170C66 170 80 184 80 204V322Z" fill="#f6c3cf" stroke="#3b3236" stroke-width="5"/>
      <path d="M28 306V212C28 198 36 186 47 186C58 186 66 198 66 212V306Z" fill="#fbdde5" stroke="#3b3236" stroke-width="3"/>
      <path d="M21 214V300" stroke="#fff" stroke-width="4" fill="none"/>
      <path transform="translate(47 214) scale(.6)" d="M0 12C-4 8-15 2-15-5C-15-11-10-14-6-14C-3-14-1-12 0-9C1-12 3-14 6-14C10-14 15-11 15-5C15 2 4 8 0 12Z" fill="#f48fb1" stroke="#3b3236" stroke-width="5"/>
      <path d="M372 202C364 184 366 164 376 148C414 136 466 134 502 146C512 164 512 186 504 202C466 210 410 210 372 202Z" fill="#fffefa" stroke="#3b3236" stroke-width="4"/>
      <path d="M382 194C420 201 460 201 496 194" stroke="#ece4f6" stroke-width="7" fill="none"/>
      <path d="M398 152C426 145 456 144 480 147" stroke="#ece4f6" stroke-width="4" fill="none"/>
      <path d="M386 160q8 5 6 13M492 158q-8 5-6 13" stroke="#d6c8ec" stroke-width="3.5" fill="none"/>
      </g>`)
  };

  /* ---------- お世話ボタンのアイコン ---------- */
  const icons = {
    icon_food: () => items.item_fish(),
    icon_play: () => items.item_yarn(),
    icon_bath: () => svg('0 0 200 200', `
      <g fill="#f4fbff" stroke="#8fcdea" stroke-width="3"><circle cx="64" cy="70" r="24"/><circle cx="100" cy="52" r="30"/><circle cx="140" cy="70" r="22"/><circle cx="160" cy="36" r="10"/><circle cx="40" cy="38" r="8"/></g>
      <path d="M22 92h156c0 44-22 64-78 64S22 136 22 92z" fill="#ffffff" stroke="${LINE}" stroke-width="3"/>
      <path d="M16 86h168a6 6 0 0 1 0 12H16a6 6 0 0 1 0-12z" fill="#ecd08f" stroke="#b8913f" stroke-width="3"/>
      <path d="M50 152l-10 22M150 152l10 22" stroke="#c9a253" stroke-width="9" stroke-linecap="round"/>
      <path d="M40 112c10 24 34 30 60 30" fill="none" stroke="#e9f4f8" stroke-width="7" stroke-linecap="round"/>`),
    icon_sleep: () => svg('0 0 200 200', `
      <path d="M118 22a74 74 0 1 0 52 118A62 62 0 0 1 118 22z" fill="#f6d66b" stroke="#d6aa36" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="78" cy="88" r="7" fill="#e9bd4a" opacity=".55"/><circle cx="64" cy="122" r="10" fill="#e9bd4a" opacity=".45"/><circle cx="98" cy="136" r="6" fill="#e9bd4a" opacity=".5"/>
      <g fill="#fff3b5" stroke="#e5c35a" stroke-width="2"><path d="M160 30l5 11 11 3-11 4-5 11-5-11-11-4 11-3z"/><path d="M172 84l3 7 7 2-7 3-3 7-3-7-7-3 7-2z"/></g>`),
    icon_dress: () => bow('#f4a3b8'),
    icon_bye: () => svg('0 0 200 200', `
      <path d="M50 52q-14 12-14 30M34 44q-22 18-20 46" fill="none" stroke="#f0b7c6" stroke-width="7" stroke-linecap="round"/>
      <path d="M150 52q14 12 14 30M166 44q22 18 20 46" fill="none" stroke="#f0b7c6" stroke-width="7" stroke-linecap="round"/>
      <path d="M100 186c-30 0-44-16-44-42 0-30 18-50 44-50s44 20 44 50c0 26-14 42-44 42z" fill="#ffffff" stroke="${LINE}" stroke-width="3.5"/>
      <g fill="#ffffff" stroke="${LINE}" stroke-width="3.5"><ellipse cx="64" cy="82" rx="16" ry="20"/><ellipse cx="88" cy="60" rx="16" ry="21"/><ellipse cx="114" cy="60" rx="16" ry="21"/><ellipse cx="138" cy="82" rx="16" ry="20"/></g>
      <g fill="#f6b3c4"><ellipse cx="64" cy="84" rx="8" ry="10"/><ellipse cx="88" cy="62" rx="8" ry="11"/><ellipse cx="114" cy="62" rx="8" ry="11"/><ellipse cx="138" cy="84" rx="8" ry="10"/><path d="M100 168c-16 0-26-8-26-20 0-14 12-24 26-24s26 10 26 24c0 12-10 20-26 20z"/></g>`),
    icon_book: () => svg('0 0 200 200', `
      <path d="M100 48c-26-16-60-18-84-10v122c24-8 58-6 84 10 26-16 60-18 84-10V38c-24-8-58-6-84 10z" fill="#fff8ef" stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M100 48v122" stroke="${LINE}" stroke-width="3"/>
      <path d="M100 48c-26-16-60-18-84-10v122c24-8 58-6 84 10" fill="#fde3ea" opacity=".8"/>
      <path transform="translate(38 76) scale(1.35)" d="${HEART_PATH}" fill="#f37d9b"/>
      <path transform="translate(118 68) scale(.55)" d="M50 0C54 38 62 46 100 50 62 54 54 62 50 100 46 62 38 54 0 50 38 46 46 38 50 0z" fill="#f1c74f"/>
      <circle cx="152" cy="132" r="14" fill="#93c9ef"/>`),
    gear: () => svg('0 0 64 64', `
      <path d="M28 4h8l1.6 7.2a21 21 0 0 1 6 2.5l6.2-4 5.7 5.7-4 6.2a21 21 0 0 1 2.5 6L61 28v8l-7.2 1.6a21 21 0 0 1-2.5 6l4 6.2-5.7 5.7-6.2-4a21 21 0 0 1-6 2.5L36 61h-8l-1.6-7.2a21 21 0 0 1-6-2.5l-6.2 4-5.7-5.7 4-6.2a21 21 0 0 1-2.5-6L3 36v-8l7.2-1.6a21 21 0 0 1 2.5-6l-4-6.2 5.7-5.7 6.2 4a21 21 0 0 1 6-2.5z" fill="#d8c8bd" stroke="#a89385" stroke-width="2"/>
      <circle cx="32" cy="32" r="9" fill="#fff8ef" stroke="#a89385" stroke-width="2"/>`),
    back: () => svg('0 0 100 100', `
      <path d="M58 22 28 50l30 28" fill="none" stroke="#c95f7f" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M32 50h44" stroke="#c95f7f" stroke-width="13" stroke-linecap="round"/>`),
    lock: () => svg('0 0 64 64', `
      <path d="M20 28v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#b9a294" stroke-width="6"/>
      <rect x="12" y="28" width="40" height="30" rx="8" fill="#e6d6ca" stroke="#b9a294" stroke-width="3"/>
      <circle cx="32" cy="42" r="4" fill="#b9a294"/>`)
  };

  /* ---------- 背景：おへや（ニャーちゃんと 同じ 線画風：こい線 ＋ パステルの べたぬり） ---------- */
  const BGINK = '#3b3236';
  const ink = (w = 4, col = BGINK) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  function bgRoom(night = false) {
    const c = night ? {
      wall: '#56547e', dot: '#68669a', wains: '#4a5c78', rail: '#6d6a96', floor: '#6c5c76', plank: '#5a4c64',
      sky: '#232a5a', hill: '#3c5a5a', tree: '#3f6a62', trunk: '#5a4a52', curt: '#8676a6', frame: '#7c7aa6',
      piano: '#7a5f70', pianoP: '#6a5262', keys: '#d8d2dc', rug: '#86648e', rugIn: '#9c7aa2', pot: '#a2707a', leaf: '#4f7a66',
      pic: '#e9e2c4', shade: '#ffe08a', ink: '#221c26'
    } : {
      wall: '#fff3da', dot: '#f9dfb6', wains: '#d5efe0', rail: '#ffffff', floor: '#f3d8b0', plank: '#ddb98d',
      sky: '#cdeaf8', hill: '#b6e3a8', tree: '#9fd68e', trunk: '#c79a6e', curt: '#ffe39a', frame: '#ffffff',
      piano: '#d9ae8c', pianoP: '#c79a76', keys: '#ffffff', rug: '#f8c6d3', rugIn: '#fde3ea', pot: '#f0a98c', leaf: '#8fd08a',
      pic: '#fffaf0', shade: '#fff1b8', ink: BGINK
    };
    const I = (w) => ink(w, c.ink);
    const p = id('r');
    const planks = [772, 852, 942].map(y => `<path d="M0 ${y}H1366" stroke="${c.plank}" stroke-width="3"/>`).join('') +
      [[140, 704, 772], [480, 772, 852], [820, 704, 772], [1120, 772, 852], [300, 852, 942], [700, 852, 942], [1040, 942, 1024], [1240, 852, 942], [460, 942, 1024]]
        .map(([x, a, b]) => `<path d="M${x} ${a}V${b}" stroke="${c.plank}" stroke-width="3"/>`).join('');
    const whites = Array.from({ length: 15 }, (_, i) => `<path d="M${84 + i * 25} 548V602" ${I(2.5)}/>`).join('');
    const blacks = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map(i => `<rect x="${78 + i * 25 + 17}" y="548" width="14" height="32" rx="3" fill="${c.ink}"/>`).join('');
    const sky = night
      ? `${[[900, 220], [960, 190], [1090, 210], [1120, 300], [930, 330], [1040, 360]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 3 : 4.5}" fill="#fff6c9"/>`).join('')}
         <path d="M1062 228 a40 40 0 1 0 34 56 a32 32 0 1 1 -34 -56z" fill="#fff0a8" ${I(4)}/>`
      : `<circle cx="1080" cy="250" r="34" fill="#ffe27a" ${I(4)}/>
         <path d="M908 236 q8 -26 34 -20 q14 -20 38 -6 q26 0 26 22 q0 18 -24 18 h-60 q-22 0 -14 -14z" fill="#fff" ${I(4)}/>`;
    const glow = night ? `<radialGradient id="${p}g"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>` : '';
    return svg('0 0 1366 1024', `
      <defs>
        <pattern id="${p}d" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="5" fill="${c.dot}"/><circle cx="48" cy="48" r="5" fill="${c.dot}"/></pattern>
        <clipPath id="${p}w"><path d="M880 540V290a140 140 0 0 1 280 0v250z"/></clipPath>
        ${glow}
      </defs>
      <!-- かべ -->
      <rect width="1366" height="700" fill="${c.wall}"/>
      <rect y="30" width="1366" height="486" fill="url(#${p}d)"/>
      <rect y="-4" width="1366" height="30" fill="${c.rail}" ${I(4)}/>
      <rect y="520" width="1366" height="168" fill="${c.wains}"/>
      <rect y="508" width="1366" height="18" fill="${c.rail}" ${I(4)}/>
      ${[40, 300, 1180].map(x => `<rect x="${x}" y="548" width="200" height="110" rx="14" fill="none" ${I(3)} opacity=".35"/>`).join('')}
      <rect y="682" width="1366" height="22" fill="${c.rail}" ${I(4)}/>
      <!-- ゆか -->
      <rect y="704" width="1366" height="320" fill="${c.floor}"/>
      ${planks}

      <!-- まど -->
      <g clip-path="url(#${p}w)">
        <rect x="870" y="140" width="300" height="410" fill="${c.sky}"/>
        ${sky}
        <path d="M870 470 q80 -50 160 -10 q70 -40 140 0 v90 h-300z" fill="${c.hill}" ${I(4)}/>
        <path d="M950 470v-40M1080 460v-60" ${ink(8, c.trunk)}/>
        <circle cx="950" cy="420" r="36" fill="${c.tree}" ${I(4)}/><circle cx="1080" cy="392" r="46" fill="${c.tree}" ${I(4)}/>
      </g>
      <path d="M880 540V290a140 140 0 0 1 280 0v250z" fill="none" stroke="${c.frame}" stroke-width="22"/>
      <path d="M880 540V290a140 140 0 0 1 280 0v250z" fill="none" ${I(5)}/>
      <path d="M868 552V290a152 152 0 0 1 304 0v262" fill="none" ${I(4)}/>
      <path d="M1020 150v390M880 380h280" stroke="${c.frame}" stroke-width="12"/>
      <path d="M1020 150v390M880 380h280" fill="none" ${I(3)} opacity=".6"/>
      <rect x="852" y="540" width="336" height="24" rx="8" fill="${c.frame}" ${I(4)}/>
      <!-- カーテン -->
      <path d="M820 120 C850 120 880 130 892 140 C880 300 884 460 906 600 C870 610 840 610 812 600 C830 440 826 280 820 120Z" fill="${c.curt}" ${I(4)}/>
      <path d="M1220 120 C1190 120 1160 130 1148 140 C1160 300 1156 460 1134 600 C1170 610 1200 610 1228 600 C1210 440 1214 280 1220 120Z" fill="${c.curt}" ${I(4)}/>
      <path d="M846 170c6 120 8 280 -4 400M1194 170c-6 120 -8 280 4 400" fill="none" ${I(3)} opacity=".45"/>
      <path d="M804 104h432v34c-36 26-72 26-108 4-36 24-72 24-108 0-36 24-72 24-108 0-36 22-72 22-108-4z" fill="${c.curt}" ${I(4)}/>

      <!-- えを かざる がくぶち（おえかきの え が ここに はいる） -->
      <rect x="306" y="166" width="228" height="166" rx="10" fill="#e9c48c" ${I(4)}/>
      <rect x="322" y="182" width="196" height="134" rx="4" fill="${c.pic}" ${I(3)}/>
      <g transform="translate(420 250)">
        <path d="M-50 0 C-30 -34 30 -34 44 0 C30 34 -30 34 -50 0Z" fill="#9ccdf0" ${I(4)}/>
        <path d="M44 0 L74 -24 L70 24 Z" fill="#9ccdf0" ${I(4)}/>
        <circle cx="-26" cy="-6" r="5" fill="${c.ink}"/>
      </g>

      <!-- ピアノ -->
      <g>
        <rect x="50" y="318" width="404" height="30" rx="10" fill="${c.piano}" ${I(4)}/>
        <rect x="62" y="346" width="380" height="176" fill="${c.piano}" ${I(4)}/>
        <rect x="88" y="366" width="328" height="136" rx="12" fill="${c.pianoP}" ${I(3)}/>
        <g transform="rotate(-3 250 410)"><rect x="196" y="378" width="112" height="76" rx="4" fill="#fffdf6" ${I(3)}/>
          <path d="M208 396h88M208 410h88M208 424h88M208 438h88" stroke="${c.ink}" stroke-width="1.5" opacity=".35"/>
          <circle cx="228" cy="410" r="5" fill="${c.ink}"/><circle cx="254" cy="424" r="5" fill="${c.ink}"/><circle cx="282" cy="402" r="5" fill="${c.ink}"/></g>
        <rect x="44" y="520" width="416" height="28" rx="6" fill="${c.piano}" ${I(4)}/>
        <rect x="70" y="548" width="364" height="54" fill="${c.keys}" ${I(4)}/>
        ${whites}${blacks}
        <rect x="62" y="602" width="380" height="80" fill="${c.piano}" ${I(4)}/>
        <path d="M236 668h32" ${I(8)}/>
        <!-- おはなの はちうえ -->
        <path d="M100 318 l8 -40 h44 l8 40z" fill="${c.pot}" ${I(4)}/>
        <path d="M130 278 v-30" ${I(5)}/>
        <g fill="#f7a8c4">${[[112, 244], [130, 230], [148, 244], [130, 256]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" ${I(3)}/>`).join('')}</g>
        <circle cx="130" cy="244" r="8" fill="#ffe27a" ${I(3)}/>
        <!-- スタンドの あかり -->
        <path d="M244 318 v-46" ${I(5)}/>
        <path d="M210 272 h68 l-12 -44 h-44z" fill="${c.shade}" ${I(4)}/>
        ${night ? `<circle cx="244" cy="252" r="170" fill="url(#${p}g)"/>` : ''}
      </g>

      <!-- はちうえ（右） -->
      <g>
        <path d="M1250 700 l-14 -86 h96 l-14 86z" fill="${c.pot}" ${I(4)}/>
        <path d="M1284 614 C1270 560 1230 540 1214 500 M1284 614 C1290 550 1310 520 1340 500 M1284 614 C1284 560 1280 520 1290 470" fill="none" ${I(5)}/>
        ${[[1214, 500, -30], [1340, 500, 30], [1290, 470, 0], [1250, 560, -50], [1316, 548, 50]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="24" ry="40" transform="rotate(${r} ${x} ${y})" fill="${c.leaf}" ${I(4)}/>`).join('')}
      </g>

      <!-- じゅうたん -->
      <ellipse cx="683" cy="900" rx="480" ry="108" fill="${c.rug}" ${I(4)}/>
      <ellipse cx="683" cy="900" rx="400" ry="80" fill="none" stroke="${c.rugIn}" stroke-width="8" stroke-dasharray="18 14"/>
    `, 'preserveAspectRatio="xMidYMid slice"');
  }

  /* ---------- 背景：おふろば（線画風） ---------- */
  function bgBath() {
    const p = id('b');
    const I = (w) => ink(w);
    const tiles = [];
    for (let x = 0; x <= 1366; x += 76) tiles.push(`M${x} 320V700`);
    for (let y = 320; y <= 700; y += 76) tiles.push(`M0 ${y}H1366`);
    return svg('0 0 1366 1024', `
      <defs>
        <pattern id="${p}f" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#fff6f8"/><rect width="60" height="60" fill="#fbdde5"/><rect x="60" y="60" width="60" height="60" fill="#fbdde5"/></pattern>
      </defs>
      <!-- かべ -->
      <rect width="1366" height="320" fill="#fff7e8"/>
      <rect y="-4" width="1366" height="30" fill="#fff" ${I(4)}/>
      <rect y="320" width="1366" height="384" fill="#d9f1f3"/>
      <path d="${tiles.join('')}" stroke="#b3dde2" stroke-width="3"/>
      <rect y="306" width="1366" height="18" fill="#fff" ${I(4)}/>
      <!-- ゆか -->
      <rect y="700" width="1366" height="324" fill="url(#${p}f)"/>
      <rect y="694" width="1366" height="14" fill="#fff" ${I(4)}/>
      <!-- まるい まど -->
      <circle cx="683" cy="160" r="86" fill="#cdeaf8" ${I(5)}/>
      <circle cx="683" cy="160" r="100" fill="none" stroke="#fff" stroke-width="18"/>
      <circle cx="683" cy="160" r="110" fill="none" ${I(4)}/>
      <path d="M683 74v172M597 160h172" stroke="#fff" stroke-width="10"/>
      <path d="M640 130 q10 -18 30 -12 q14 -12 28 0 q16 0 14 14 h-66z" fill="#fff" ${I(3)}/>
      <!-- かがみ -->
      <ellipse cx="240" cy="226" rx="96" ry="120" fill="#e6f5fb" ${I(5)}/>
      <ellipse cx="240" cy="226" rx="108" ry="132" fill="none" stroke="#f3cf8f" stroke-width="14"/>
      <ellipse cx="240" cy="226" rx="116" ry="140" fill="none" ${I(4)}/>
      <path d="M192 168c18 -28 46 -38 66 -34M182 214c10 -16 20 -24 30 -26" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
      <!-- シャワーの ホルダー（シャワーは べつの 絵） -->
      <path d="M86 520h40v22a20 20 0 0 1-40 0z" fill="#ecd08f" ${I(4)}/>
      <rect x="96" y="500" width="20" height="24" rx="6" fill="#f3cf8f" ${I(4)}/>
      <!-- タオルかけ（タオルは べつの 絵） -->
      <path d="M1046 352h250" ${I(10)}/>
      <path d="M1046 352h250" stroke="#f3cf8f" stroke-width="5" stroke-linecap="round"/>
      <circle cx="1046" cy="352" r="12" fill="#f3cf8f" ${I(4)}/><circle cx="1296" cy="352" r="12" fill="#f3cf8f" ${I(4)}/>
      <!-- せっけんの たな -->
      <path d="M990 624l20 34h18l-8-34zM1270 624l-20 34h-18l8-34z" fill="#f3cf8f" ${I(4)}/>
      <rect x="962" y="606" width="346" height="20" rx="8" fill="#fff" ${I(4)}/>
      <path d="M978 612h120" stroke="#e8f4f8" stroke-width="5" stroke-linecap="round"/>
      <!-- うかぶ あわ -->
      <g fill="#fff" ${ink(3, '#7fb6d6')}><circle cx="480" cy="190" r="18"/><circle cx="520" cy="246" r="10"/><circle cx="860" cy="256" r="14"/><circle cx="900" cy="214" r="8"/></g>
      <!-- バスマット（タオルで ふく ところ） -->
      <ellipse cx="1180" cy="984" rx="190" ry="46" fill="#f7c3d0" ${I(4)}/>
      <ellipse cx="1180" cy="984" rx="158" ry="32" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="4 16" stroke-linecap="round"/>
    `, 'preserveAspectRatio="xMidYMid slice"');
  }

  /* ---------- メイク ---------- */
  // k < 1 で こく、k > 1 で うすく
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1)));
    return `rgb(${ch.join(',')})`;
  }
  const glints = (pts, r = 1) => pts.map(([x, y, s]) => `<path transform="translate(${x - 5 * s * r} ${y - 5 * s * r}) scale(${0.1 * s * r})" d="M50 0C54 38 62 46 100 50 62 54 54 62 50 100 46 62 38 54 0 50 38 46 46 38 50 0z" fill="#fffdf0"/>`).join('');
  function starPts(cx, cy, ro, ri) {
    const p = [];
    for (let k = 0; k < 10; k++) {
      const t = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? ri : ro;
      p.push((cx + Math.cos(t) * r).toFixed(1) + ',' + (cy + Math.sin(t) * r).toFixed(1));
    }
    return p.join(' ');
  }
  // ほっぺの コンパクト
  function compact(color, heartShape) {
    return svg('0 0 120 120', `
      <circle cx="60" cy="60" r="47" fill="#f6e2b0" stroke="#c9a253" stroke-width="3"/>
      <circle cx="60" cy="60" r="39" fill="#fff8ef" stroke="#e2c48a" stroke-width="2"/>
      ${heartShape ? `<path transform="translate(60 61) scale(1.9) translate(-16 -14.5)" d="${HEART_PATH}" fill="${color}"/>` : `<circle cx="60" cy="60" r="33" fill="${color}"/>`}
      <ellipse cx="45" cy="44" rx="13" ry="7" fill="#fff" opacity=".45" transform="rotate(-35 45 44)"/>`);
  }
  // くちべに（たてに おいたもの）
  function lipstick(color, glitter) {
    return svg('0 0 120 120', `<g transform="rotate(18 60 64)">
      <path d="M45 52V30q0-5 5-7l18-9q6-3 6 3v35z" fill="${color}" stroke="${shade(color, 0.72)}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M52 47V31" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
      ${glitter ? glints([[64, 30, 1.2], [58, 42, 0.8], [68, 20, 0.7]]) : ''}
      <rect x="42" y="50" width="36" height="18" rx="3" fill="#f6e2b0" stroke="#b8913f" stroke-width="3"/>
      <rect x="38" y="66" width="44" height="44" rx="7" fill="#f7c6d3" stroke="#d98ea2" stroke-width="3"/>
      <rect x="38" y="78" width="44" height="7" fill="#ecd08f"/>
    </g>`);
  }
  // アイシャドウの いろ
  function shadowPan(color, glitter) {
    return svg('0 0 120 120', `
      <rect x="13" y="13" width="94" height="94" rx="24" fill="#fff8ef" stroke="#c9a253" stroke-width="3"/>
      <circle cx="60" cy="60" r="35" fill="${color}" stroke="${shade(color, 0.82)}" stroke-width="2"/>
      <path d="M37 52q8-17 27-19" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>
      ${glitter ? glints([[70, 48, 1.3], [50, 70, 1], [76, 74, 0.8], [58, 40, 0.6]]) : ''}`);
  }
  function palette() {
    return svg('0 0 120 120', `
      <rect x="10" y="28" width="100" height="66" rx="16" fill="#fff8ef" stroke="#c9a253" stroke-width="3"/>
      <circle cx="35" cy="61" r="15" fill="#f59cc2"/><circle cx="60" cy="61" r="15" fill="#b597ec"/><circle cx="85" cy="61" r="15" fill="#86c3f0"/>
      <g fill="#fff" opacity=".5"><ellipse cx="30" cy="55" rx="5" ry="3"/><ellipse cx="55" cy="55" rx="5" ry="3"/><ellipse cx="80" cy="55" rx="5" ry="3"/></g>`);
  }
  // シールの 形（おえかきの スタンプ）。it = { shape: 'heart' | 'star' | 'flower', color }
  function stickerSvg(it) {
    const c = it.color;
    const shape = (fill, extra) => {
      if (it.shape === 'star') return `<polygon points="${starPts(60, 63, 48, 24)}" fill="${fill}" ${extra}/>`;
      if (it.shape === 'heart') return `<path transform="translate(60 62) scale(2.9) translate(-16 -14.5)" d="${HEART_PATH}" fill="${fill}" ${extra.replace(/stroke-width="(\d+)"/, (m, w) => `stroke-width="${(w / 2.9).toFixed(2)}"`)}/>`;
      if (it.shape === 'gem') return `<polygon points="34,24 86,24 108,50 60,104 12,50" fill="${fill}" ${extra}/>`;
      return [0, 1, 2, 3, 4].map(k => { const t = -Math.PI / 2 + k * Math.PI * 2 / 5; return `<circle cx="${(60 + Math.cos(t) * 24).toFixed(1)}" cy="${(62 + Math.sin(t) * 24).toFixed(1)}" r="22" fill="${fill}" ${extra}/>`; }).join('');
    };
    const S = 'stroke="#ffffff" stroke-width="10" stroke-linejoin="round"';
    let inner = `<g transform="translate(0 4)" opacity=".16">${shape('#7a3c50', 'stroke="#7a3c50" stroke-width="10" stroke-linejoin="round"')}</g>`;
    inner += shape(c, S);
    if (it.shape === 'flower') inner += [0, 1, 2, 3, 4].map(k => { const t = -Math.PI / 2 + k * Math.PI * 2 / 5; return `<circle cx="${(60 + Math.cos(t) * 24).toFixed(1)}" cy="${(62 + Math.sin(t) * 24).toFixed(1)}" r="22" fill="${c}"/>`; }).join('') + '<circle cx="60" cy="62" r="15" fill="#ffd96a"/>';
    if (it.shape === 'gem') inner += `<g fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3"><path d="M12 50h96M48 24 38 50l22 54M72 24l10 26-22 54"/></g>`;
    inner += '<ellipse cx="42" cy="44" rx="10" ry="6" fill="#fff" opacity=".6" transform="rotate(-35 42 44)"/>';
    return svg('0 0 120 120', inner);
  }
  function makeupSwatch(cat, it) {
    if (cat === 'cheek') return compact(it.color, it.shape === 'heart');
    if (cat === 'lip') return lipstick(it.color, it.glitter);
    return shadowPan(it.color, it.glitter);
  }
  // 手に もつ道具。左上（14, 14）が 先っぽ
  function makeupTool(cat, it) {
    const c = it ? it.color : '#f98bb0';
    if (cat === 'cheek') return svg('0 0 120 120', `<g transform="translate(14 14) rotate(45)">
      <rect x="58" y="-7" width="80" height="14" rx="7" fill="#f4b3c2" stroke="#d98ea2" stroke-width="3"/>
      <rect x="44" y="-11" width="18" height="22" rx="4" fill="#ecd08f" stroke="#b8913f" stroke-width="3"/>
      <path d="M46-12C30-26 2-20 0 0c2 20 30 26 46 12z" fill="#fff7ef" stroke="${LINE}" stroke-width="3"/>
      <path d="M0 0C3-15 18-20 27-17c-5 10-5 24 0 34C18 20 3 15 0 0z" fill="${c}"/></g>`);
    if (cat === 'lip') return svg('0 0 120 120', `<g transform="translate(14 14) rotate(45)">
      <rect x="50" y="-15" width="72" height="30" rx="6" fill="#f7c6d3" stroke="#d98ea2" stroke-width="3"/>
      <rect x="64" y="-15" width="8" height="30" fill="#ecd08f"/>
      <rect x="37" y="-13" width="16" height="26" rx="3" fill="#f6e2b0" stroke="#b8913f" stroke-width="3"/>
      <path d="M39-10H10q-8 0-8 7l4 13h33z" fill="${c}" stroke="${shade(c, 0.72)}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12-4h22" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/></g>`);
    if (cat === 'eye') return svg('0 0 120 120', `<g transform="translate(14 14) rotate(45)">
      <rect x="26" y="-5" width="100" height="10" rx="5" fill="#ecd08f" stroke="#b8913f" stroke-width="2.5"/>
      <ellipse cx="16" cy="0" rx="19" ry="11" fill="${c}" stroke="${shade(c, 0.78)}" stroke-width="2.5"/>
      <ellipse cx="10" cy="-4" rx="7" ry="3" fill="#fff" opacity=".5"/></g>`);
    return cotton();
  }
  // メイクを おとす ハートの コットン
  function cotton() {
    return svg('0 0 120 120', `
      <path d="M60 106.5 C27 80.2 10.5 60.4 10.5 42.2 10.5 27.4 22.1 17.5 35.3 17.5 45.1 17.5 53.4 23.1 60 32.3 66.6 23.1 74.8 17.5 84.8 17.5 97.9 17.5 109.5 27.4 109.5 42.2 109.5 60.4 93 80.2 60 106.5Z" fill="#fdeef4" stroke="#c89cb0" stroke-width="3.6" stroke-linejoin="round"/>
      <path d="M58.6 101.6 C28.1 77.2 12.9 58.9 12.9 42.1 12.9 28.4 23.5 19.2 35.7 19.2 44.9 19.2 52.5 24.4 58.6 33 64.7 24.4 72.3 19.2 81.5 19.2 93.7 19.2 104.3 28.4 104.3 42.1 104.3 58.9 89.1 77.2 58.6 101.6Z" fill="#fff7fa"/>
      <path d="M60 98.7 C33.2 77.2 19.8 61.2 19.8 46.4 19.8 34.4 29.2 26.3 39.9 26.3 47.9 26.3 54.6 30.9 60 38.4 65.4 30.9 72.1 26.3 80.1 26.3 90.8 26.3 100.2 34.4 100.2 46.4 100.2 61.2 86.8 77.2 60 98.7Z" fill="none" stroke="#e2c0cf" stroke-width="2.4" stroke-dasharray="1.5 6.5" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="#f2dfe7"><circle cx="44" cy="54" r="2.6"/><circle cx="62" cy="50" r="2.4"/><circle cx="78" cy="45" r="2.6"/><circle cx="54" cy="68" r="2.6"/><circle cx="74" cy="64" r="2.4"/><circle cx="62" cy="83" r="2.4"/><circle cx="88" cy="52" r="2.2"/></g>
      <ellipse cx="33" cy="37" rx="10" ry="5" fill="#ffffff" transform="rotate(-35 33 37)"/>
      <circle cx="47" cy="33" r="2.4" fill="#ffffff"/>`);
  }


  function makeupCat(cat) {
    if (cat === 'cheek') return compact('#f98bb0');
    if (cat === 'lip') return lipstick('#e0263f');
    if (cat === 'eye') return palette();
    return cotton();
  }

  /* ---------- よこに してね ---------- */
  function rotateHint() {
    return svg('0 0 240 200', `
      <g class="rot-tab"><rect x="80" y="30" width="80" height="130" rx="14" fill="#fff" stroke="#c95f7f" stroke-width="6"/><circle cx="120" cy="146" r="5" fill="#c95f7f"/></g>
      <path d="M200 120a80 80 0 0 0-50-74" fill="none" stroke="#e2c48a" stroke-width="8" stroke-linecap="round"/>
      <path d="M150 34l2 20 18-8z" fill="#e2c48a"/>`);
  }

  const all = Object.assign({}, items, bath, icons, {
    bg_room: () => bgRoom(false),
    bg_room_night: () => bgRoom(true),
    bg_bath: () => bgBath(),
    ribbon_pink: () => bow('#f4a3b8'),
    ribbon_blue: () => bow('#93c9ef'),
    ribbon_yellow: () => bow('#f5d76a'),
    icon_makeup: () => lipstick('#f2588f')
  });

  return { svg, heart, heartEmpty, sparkle, meterIcons, bow, rotateHint, all, HEART_PATH, makeupSwatch, makeupTool, makeupCat, sticker: stickerSvg };
})();
