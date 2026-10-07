/* 食べものの 絵（要件定義書 7.2・7.4）。線画＋べたぬりで、つや（白い ハイライト）と あたたかい色で おいしそうに
 * ・ing_*  … ざいりょう・トッピングの 絵（viewBox 0 0 100 100）
 * ・dish_* … できあがりの お料理（viewBox 0 0 120 100。レシピえらび・リクエストの ふきだし）
 * ネコの体に わるい 食べものは 描かない（5.9.1）
 */
window.G = window.G || {};

(function () {
  const svg = G.Art.svg;
  const INK = '#3b3236';
  const ink = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const shine = (x, y, r = 6) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#fff" opacity=".8" transform="rotate(-30 ${x} ${y})"/>`;
  const v = (body) => svg('0 0 100 100', body);

  /* ---------- ざいりょう ---------- */
  const ing = {
    rice: () => v(`<path d="M14 52h72q0 34 -36 34t-36 -34z" fill="#f2f0ea" ${ink()}/>
      <path d="M18 52q8 -26 32 -26t32 26z" fill="#fff" ${ink()}/>
      ${[[34, 42], [46, 36], [58, 40], [66, 47], [40, 48], [52, 46]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" fill="#e9e4d6"/>`).join('')}
      <path d="M26 66h48" stroke="#9ccdf0" stroke-width="5" stroke-linecap="round"/>`),
    nori: () => v(`<rect x="22" y="16" width="56" height="70" rx="4" fill="#33473a" ${ink()}/>
      <path d="M30 30h40M30 46h40M30 62h40" stroke="#4f6a57" stroke-width="3"/>`),
    salmon: () => v(`<path d="M14 58 Q22 30 54 30 Q86 32 88 52 Q84 70 52 74 Q22 74 14 58Z" fill="#f8a58a" ${ink()}/>
      <path d="M30 42 q10 14 0 26M46 36 q12 18 0 36M62 36 q10 16 0 34" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>${shine(36, 40)}`),
    okaka: () => v(`<path d="M16 70 Q50 86 84 70 L76 56 Q50 64 24 56Z" fill="#fff" ${ink()}/>
      ${[[30, 52, -20], [44, 46, 10], [58, 50, -10], [70, 54, 25], [50, 56, 0], [38, 58, 30]].map(([x, y, r]) => `<path d="M${x - 8} ${y} q8 -6 16 0 q-8 6 -16 0z" fill="#d79a6a" ${ink(2.5)} transform="rotate(${r} ${x} ${y})"/>`).join('')}`),
    tuna: () => v(`<rect x="18" y="36" width="64" height="44" rx="8" fill="#9ccdf0" ${ink()}/>
      <ellipse cx="50" cy="36" rx="32" ry="10" fill="#d9d6de" ${ink()}/>
      <ellipse cx="50" cy="36" rx="22" ry="6" fill="#f6d9b0"/>
      <path d="M36 58 q14 -10 28 0 q-14 10 -28 0z M64 58 l8 -6 v12z" fill="#fff" ${ink(2.5)}/>`),
    bread: () => v(`<path d="M20 86 V44 Q12 40 14 28 Q20 12 50 14 Q80 12 86 28 Q88 40 80 44 V86Z" fill="#e9b26e" ${ink()}/>
      <path d="M28 80 V46 Q22 42 24 32 Q30 22 50 22 Q70 22 76 32 Q78 42 72 46 V80Z" fill="#fff3d6"/>`),
    butter: () => v(`<path d="M16 64 L36 44 H86 L66 64Z" fill="#fff3b0" ${ink()}/>
      <path d="M16 64 V76 H66 V64 M66 76 L86 56 V44" fill="#ffe27a" ${ink()}/>
      <path d="M16 70 Q8 80 18 84 H70 Q80 80 76 72" fill="#fff" ${ink(3)}/>`),
    egg: () => v(`<path d="M50 12 C70 12 82 42 82 60 C82 78 68 88 50 88 C32 88 18 78 18 60 C18 42 30 12 50 12Z" fill="#fffaf0" ${ink()}/>${shine(38, 32, 7)}`),
    cucumber: () => v(`<path d="M18 74 Q14 64 26 56 L70 22 Q82 16 86 26 Q88 34 78 42 L34 76 Q24 84 18 74Z" fill="#7cc46e" ${ink()}/>
      ${[[38, 56], [52, 46], [64, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#4f9a48"/>`).join('')}${shine(56, 36, 5)}`),
    jam: () => v(`<path d="M26 34 h48 v44 q0 10 -10 10 h-28 q-10 0 -10 -10z" fill="#f2577e" ${ink()}/>
      <rect x="22" y="18" width="56" height="18" rx="5" fill="#fff" ${ink()}/>
      <path d="M22 26 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0" fill="none" stroke="#f37d9b" stroke-width="4"/>
      <circle cx="50" cy="60" r="12" fill="#fff" ${ink(3)}/><path d="M50 54 c-6 6 -6 10 0 12 c6 -2 6 -6 0 -12z" fill="#f2577e"/>`),
    flour: () => v(`<path d="M24 26 L30 16 H70 L76 26 L80 86 H20Z" fill="#fffaf0" ${ink()}/>
      <path d="M24 26 H76" ${ink(3)}/><ellipse cx="50" cy="58" rx="16" ry="12" fill="#ffe8a8" ${ink(3)}/>
      <path d="M44 58 q6 -10 12 0" fill="none" ${ink(2.5)}/>`),
    milk: () => v(`<path d="M30 30 L40 16 H60 L70 30 V86 H30Z" fill="#fff" ${ink()}/>
      <path d="M30 30 H70" ${ink(3)}/><path d="M30 52 h40 v18 h-40z" fill="#9ccdf0"/>
      <path d="M40 16 l10 -6 l10 6" fill="#fff" ${ink(3)}/>`),
    sugar: () => v(`<path d="M22 40 h56 v38 q0 10 -10 10 h-36 q-10 0 -10 -10z" fill="#f6c8d8" ${ink()}/>
      <path d="M28 40 q22 -22 44 0" fill="#fff" ${ink()}/>`),
    strawberry: () => v(`<path d="M50 88 C26 72 16 50 22 36 C28 24 42 26 50 30 C58 26 72 24 78 36 C84 50 74 72 50 88Z" fill="#f2577e" ${ink()}/>
      <path d="M34 26 L42 34 L50 22 L58 34 L66 26 L62 38 H38Z" fill="#7cc46e" ${ink(3)}/>
      ${[[38, 50], [52, 46], [62, 56], [44, 64], [56, 70], [34, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="#ffe27a"/>`).join('')}${shine(34, 44, 5)}`),
    banana: () => v(`<path d="M18 30 Q22 76 74 82 Q86 82 84 74 Q44 70 30 28 Q26 20 18 30Z" fill="#ffe27a" ${ink()}/>
      <path d="M18 30 l-4 -8 l8 0z" fill="#8a6a4a" ${ink(2.5)}/><path d="M32 40 Q44 66 74 76" fill="none" stroke="#f2c94c" stroke-width="4"/>`),
    whip: () => v(`<path d="M18 74 Q14 58 30 56 Q26 40 44 38 Q46 20 60 26 Q76 30 72 46 Q88 50 82 66 Q84 78 70 78 H30 Q18 80 18 74Z" fill="#fffaf0" ${ink()}/>
      <path d="M36 62 q14 -10 28 0M46 46 q8 -6 14 2" fill="none" stroke="#e9e0e4" stroke-width="4" stroke-linecap="round"/>`),
    honey: () => v(`<path d="M26 40 h48 v36 q0 12 -12 12 h-24 q-12 0 -12 -12z" fill="#f2b84a" ${ink()}/>
      <rect x="32" y="26" width="36" height="14" rx="4" fill="#e9b98a" ${ink()}/>
      <path d="M26 52 q12 10 24 0 q12 10 24 0" fill="none" stroke="#ffd98a" stroke-width="4"/>${shine(38, 64, 5)}`),
    blueberry: () => v(`${[[38, 58, 18], [62, 56, 16], [50, 38, 15]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6a78c8" ${ink()}/><path d="M${x - 4} ${y - r + 6} l4 4 l4 -4" fill="none" stroke="#3e4a8a" stroke-width="2.5"/>`).join('')}${shine(44, 32, 4)}`),
    carrot: () => v(`<path d="M22 80 L70 30 Q80 24 84 32 Q86 40 78 46 Z" fill="#f6a24a" ${ink()}/>
      <path d="M74 28 Q72 12 82 10 M78 30 Q90 18 94 26 M80 34 Q96 32 92 42" fill="none" stroke="#5aa84e" stroke-width="5" stroke-linecap="round"/>
      <path d="M44 62 l8 4M54 50 l8 4" ${ink(2.5)}/>`),
    tomato: () => v(`<circle cx="50" cy="56" r="32" fill="#f05a4e" ${ink()}/>
      <path d="M34 28 L44 34 L50 22 L56 34 L66 28 L60 40 H40Z" fill="#7cc46e" ${ink(3)}/>${shine(36, 44, 7)}`),
    cheese: () => v(`<path d="M14 66 L56 26 L88 50 V76 H14Z" fill="#ffd24d" ${ink()}/>
      <path d="M14 66 H88" ${ink(3)}/><circle cx="40" cy="72" r="4" fill="#f2b84a"/><circle cx="66" cy="58" r="6" fill="#f2b84a"/><circle cx="56" cy="40" r="3" fill="#f2b84a"/>`),
    broccoli: () => v(`<path d="M42 88 L46 58 H58 L60 88Z" fill="#a6d98e" ${ink()}/>
      ${[[34, 46, 16], [52, 34, 18], [70, 46, 16], [52, 54, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5aa84e" ${ink()}/>`).join('')}`),
    fish: () => v(`<path d="M12 50 Q36 22 66 36 L86 24 L82 50 L86 76 L66 64 Q36 78 12 50Z" fill="#9ccdf0" ${ink()}/>
      <circle cx="30" cy="46" r="4" fill="${INK}"/><path d="M48 40 q6 10 0 20" fill="none" ${ink(3)}/>`),
    greenpepper: () => v(`<path d="M50 30 C70 26 84 40 80 62 C76 84 60 86 50 80 C40 86 24 84 20 62 C16 40 30 26 50 30Z" fill="#5aa84e" ${ink()}/>
      <path d="M50 30 V16" ${ink(6)}/>${shine(34, 48, 6)}`),
    chicken: () => v(`<path d="M20 56 Q18 32 46 30 Q76 28 80 52 Q82 74 52 76 Q22 78 20 56Z" fill="#f8c8b0" ${ink()}/>
      <path d="M34 48 q16 -8 30 4" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>`),
    daikon: () => v(`<path d="M30 30 Q50 22 70 30 L64 80 Q50 96 36 80Z" fill="#fffaf0" ${ink()}/>
      <path d="M40 30 Q34 10 44 8 M50 28 V6 M60 30 Q66 10 58 8" fill="none" stroke="#5aa84e" stroke-width="6" stroke-linecap="round"/>
      <path d="M40 50 l6 2M54 62 l6 2" ${ink(2.5)}/>`),
    potato: () => v(`<path d="M18 56 Q16 30 46 28 Q80 26 84 50 Q86 76 54 78 Q20 80 18 56Z" fill="#e2b77a" ${ink()}/>
      ${[[36, 44], [60, 40], [52, 62], [70, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#a8803e"/>`).join('')}`),
    pumpkin: () => v(`<path d="M50 30 C20 26 10 50 14 64 C18 82 38 86 50 82 C62 86 82 82 86 64 C90 50 80 26 50 30Z" fill="#5f9a56" ${ink()}/>
      <path d="M50 30 C40 46 40 70 50 82 M50 30 C60 46 60 70 50 82" fill="none" ${ink(3)}/>
      <path d="M50 30 Q48 18 56 12" fill="none" stroke="#8a6a4a" stroke-width="6" stroke-linecap="round"/>`),
    tunafish: () => v(`<path d="M14 64 L26 36 H86 L74 64Z" fill="#e8475a" ${ink()}/><path d="M14 64 V72 H74 L86 44 V36" fill="#c93a4c" ${ink()}/>
      <path d="M34 44 l8 12M52 44 l8 12" stroke="#f6a0a8" stroke-width="4" stroke-linecap="round"/>`),
    salmonraw: () => v(`<path d="M14 64 L26 36 H86 L74 64Z" fill="#f8a070" ${ink()}/><path d="M14 64 V72 H74 L86 44 V36" fill="#e9884e" ${ink()}/>
      <path d="M32 44 l10 14M48 44 l10 14M64 44 l10 14" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`),
    seabream: () => v(`<path d="M14 64 L26 36 H86 L74 64Z" fill="#fbe7e4" ${ink()}/><path d="M14 64 V72 H74 L86 44 V36" fill="#f3c8c2" ${ink()}/>
      <path d="M28 40 H82" stroke="#f08a8a" stroke-width="5"/>`),
    icing: () => v(`<path d="M30 30 h40 l-6 50 h-28z" fill="#f7a8c8" ${ink()}/><path d="M44 80 l6 12 l6 -12" fill="#fff" ${ink(3)}/>
      <rect x="28" y="20" width="44" height="12" rx="4" fill="#fff" ${ink(3)}/>`),
    tomatosauce: () => v(`<path d="M36 22 h28 l6 14 v44 q0 8 -8 8 h-24 q-8 0 -8 -8 v-44z" fill="#f05a4e" ${ink()}/>
      <rect x="40" y="10" width="20" height="12" rx="3" fill="#fff" ${ink(3)}/>
      <circle cx="50" cy="58" r="11" fill="#fff" ${ink(3)}/><circle cx="50" cy="59" r="6" fill="#f05a4e"/>`)
  };
  Object.keys(ing).forEach(k => { G.Art.all['ing_' + k] = ing[k]; });
  G.Art.ing = (id) => (ing[id] ? ing[id]() : G.Art.all.plate());
  G.Art.hasIng = (id) => !!ing[id];

  /* ---------- できあがりの お料理（js/art_kitchen.js の おにぎり・サンドイッチ・ホットケーキ などに 足す） ---------- */
  const plate = `<ellipse cx="60" cy="84" rx="52" ry="12" fill="#fff" ${ink()}/>`;
  const d = (body) => svg('0 0 120 100', plate + body);
  const dishes = {
    dish_omurice: () => d(`<path d="M18 76 Q14 44 60 40 Q106 44 102 76Z" fill="#ffd95a" ${ink(5)}/>
      <path d="M44 58 c-6 -8 4 -14 8 -6 c4 -8 14 -2 8 6 l-8 8z" fill="#f05a4e"/>${shine(34, 54, 6)}`),
    dish_grillfish: () => d(`<path d="M14 66 Q40 42 76 54 L102 44 L98 66 L102 86 L76 76 Q40 88 14 66Z" fill="#e9b26e" ${ink(5)}/>
      <circle cx="30" cy="62" r="4" fill="${INK}"/><path d="M50 56 l8 8 l-8 8M64 56 l8 8 l-8 8" fill="none" stroke="#b97a3e" stroke-width="4"/>`),
    dish_pizza: () => d(`<circle cx="60" cy="66" r="44" fill="#f2c27a" ${ink(5)}/><circle cx="60" cy="66" r="36" fill="#f05a4e"/>
      <path d="M30 60 q30 -20 60 0 q-20 26 -60 0z" fill="#ffe8a8"/>
      ${[[44, 56], [70, 58], [58, 76], [80, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#5aa84e" ${ink(2.5)}/>`).join('')}`),
    dish_curry: () => d(`<path d="M14 70 Q14 44 60 42 Q106 44 106 70 Q60 92 14 70Z" fill="#fff" ${ink(4)}/>
      <path d="M58 46 Q100 46 102 68 Q80 84 58 82Z" fill="#e9a03e" ${ink(4)}/>
      ${[[70, 60, '#f6a24a'], [86, 66, '#f2e0a0'], [74, 74, '#f8c8b0']].map(([x, y, c]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="3" fill="${c}" ${ink(2.5)}/>`).join('')}`),
    dish_hamburg: () => d(`<ellipse cx="60" cy="64" rx="34" ry="20" fill="#a8683e" ${ink(5)}/>
      <path d="M34 58 q26 -16 52 0 q-6 14 -26 14 q-20 0 -26 -14z" fill="#f05a4e"/>${shine(46, 56, 5)}
      <circle cx="96" cy="72" r="8" fill="#5aa84e" ${ink(3)}/>`),
    dish_cookie: () => d(`${[[38, 66], [62, 58], [84, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#e9b26e" ${ink(4)}/><path d="M${x - 6} ${y - 2} h12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`).join('')}`),
    dish_pudding: () => d(`<path d="M34 80 L42 42 H78 L86 80Z" fill="#ffe08a" ${ink(5)}/>
      <path d="M42 42 Q42 34 60 34 Q78 34 78 42 L80 52 Q60 58 40 52Z" fill="#a8683e" ${ink(4)}/>
      <circle cx="60" cy="28" r="7" fill="#f2577e" ${ink(3)}/>`),
    dish_sushi: () => d(`${[[36, '#f05a4e'], [64, '#f8a58a'], [92, '#ffd95a']].map(([x, c]) => `<rect x="${x - 14}" y="62" width="28" height="18" rx="7" fill="#fff" ${ink(4)}/><rect x="${x - 16}" y="52" width="32" height="14" rx="6" fill="${c}" ${ink(4)}/>`).join('')}`),
    dish_cake: () => d(`<path d="M24 80 V50 H96 V80Z" fill="#fffaf0" ${ink(5)}/><path d="M24 64 H96" stroke="#f6a8c8" stroke-width="6"/>
      <path d="M24 50 q12 -8 24 0 q12 -8 24 0 q12 -8 24 0" fill="#fff" ${ink(4)}/>
      ${[40, 60, 80].map(x => `<circle cx="${x}" cy="40" r="7" fill="#f2577e" ${ink(3)}/>`).join('')}`)
  };
  Object.assign(G.Art.all, dishes);
  const prevDish = G.Art.dish;
  G.Art.dish = (id) => (dishes['dish_' + id] ? dishes['dish_' + id]() : prevDish(id));
})();
