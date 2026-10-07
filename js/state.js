/* セーブデータ（要件定義書 6.5 N-30〜N-32：自動で端末の中に保存する）
 * 保存名は nya-ryouri-v1。おせわゲーム（nya-osewa-v1）とは 同じ サイトに あるので、名前で 分ける（6.7 N-60） */
window.G = window.G || {};

G.State = (function () {
  const KEY = 'nya-ryouri-v1';
  const PET_EVERY = 6;   // なでる 6回で ハート1つ
  const PET_MAX = 5;     // なでて もらえる ハートは 1日5つまで（F-22）

  function today() {
    const t = new Date();
    return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
  }

  function defaults() {
    return {
      v: 1,
      hearts: 0,      // ぜんぶで ためた ハート（へらない：F-94）
      sent: 0,        // おせわゲームに もう 持ちかえった ハート（F-D4）
      seenStickers: 0,
      seenRecipes: 0, // あたらしい レシピの おしらせを した ハートの 数
      gifts: [],      // とどいた きせつの レシピ・エプロン
      cooked: {},     // レシピの id → 作った 回数
      tummy: 0,       // ニューちゃんが たべた 数（G.TUMMY_FULL で いっぱい：F-85）
      request: null,  // ニューちゃんの リクエスト（レシピの id：F-30）
      firstDone: false, // はじめての おにぎりを 作ったか（F-31）
      safety: {},     // 火・ほうちょうを はじめて つかったときの ひとことを 言ったか（F-6F。1回だけ）
      // おせわゲームと 同じ しくみ（js/chara.js・js/accessory.js）が 読む おしゃれ。エプロン・ぼうしは 第2段階
      ribbon: 'none',
      ribbonSide: 'right',
      makeup: { cheek: null, lip: null, eye: null },
      wear: { head: null, face: null, neck: null, back: null, tail: null, body: null },
      clothColor: {},
      lastTime: Date.now(),
      lastDay: null,
      play: { day: today(), sec: 0 },
      pet: { day: today(), count: 0, hearts: 0 },
      settings: { limit: 0, bgm: 0.6, sfx: 0.8, voice: true, decay: 'real' }
    };
  }

  let d = defaults();
  let saveTimer = null;

  function merge(base, src) {
    Object.keys(src || {}).forEach(k => {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], src[k]);
      else base[k] = src[k];
    });
    return base;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      d = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) { d = defaults(); }
    if (d.request && !G.recipe(d.request)) d.request = null;
    catchUp();
    applySettings();
  }
  function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }

  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    d.lastTime = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* 保存できなくても遊べる */ }
  }
  function save() { if (!saveTimer) saveTimer = setTimeout(saveNow, 400); }

  /* ニューちゃんの おなかが すく（F-86）。つぎの日には かならず ぺこぺこ */
  function digest(hours) {
    d.tummy = Math.max(0, d.tummy - G.TUMMY_PER_HOUR * hours);
  }
  /* ゲームを閉じていたあいだの分 */
  function catchUp() {
    const hrs = Math.max(0, (Date.now() - d.lastTime) / 3.6e6);
    if (d.lastDay && d.lastDay !== today()) d.tummy = 0;
    else if (d.settings.decay === 'real') digest(hrs);
    d.lastTime = Date.now();
  }

  /* 遊んでいるあいだ、1秒ごとに呼ぶ */
  function tick(sec) {
    if (sec > 90) { catchUp(); return; } // 画面を閉じていたなど
    const mul = d.settings.decay === 'real' ? 1 : 6;
    digest(mul * sec / 3600);
    if (d.play.day !== today()) d.play = { day: today(), sec: 0 };
    d.play.sec += sec;
    d.lastTime = Date.now();
    save();
  }

  /* ---- ニューちゃんの おなか ---- */
  const tummy = () => d.tummy;
  const tummyPlates = () => Math.min(G.TUMMY_FULL, Math.ceil(d.tummy - 0.01)); // おさらの 絵で 見せる数
  const isFull = () => d.tummy >= G.TUMMY_FULL - 0.01;
  function eat() { d.tummy = Math.min(G.TUMMY_FULL, d.tummy + 1); save(); }

  /* ---- レシピ ---- */
  const hasRecipe = (r) => (r.season ? d.gifts.indexOf(r.id) >= 0 : r.unlock <= d.hearts);
  const recipes = () => G.RECIPES.filter(hasRecipe);
  function markCooked(id) { d.cooked[id] = (d.cooked[id] || 0) + 1; if (id === 'onigiri') d.firstDone = true; save(); }
  const cookedCount = (id) => d.cooked[id] || 0;
  /* つぎの リクエスト（F-31）：はじめは かならず おにぎり。おなじものが つづかないように */
  function nextRequest() {
    if (!d.firstDone) { d.request = 'onigiri'; save(); return d.request; }
    const list = recipes().filter(r => r.ready && r.id !== d.request); // まだ 作れない レシピは たのまない
    d.request = list.length ? list[Math.floor(Math.random() * list.length)].id : 'onigiri';
    save();
    return d.request;
  }
  const request = () => d.request;
  /* はじめての ときだけ true（火・ほうちょうの ひとこと：F-6F） */
  function firstTime(kind) {
    if (d.safety[kind]) return false;
    d.safety[kind] = true; save();
    return true;
  }
  function takeNewRecipes() {
    const out = G.RECIPES.filter(r => !r.season && r.unlock > d.seenRecipes && r.unlock <= d.hearts);
    if (out.length) { d.seenRecipes = Math.max.apply(null, out.map(r => r.unlock)); save(); }
    return out;
  }
  /* その月の きせつの レシピを とどける（とどいたら ずっと 作れる：F-93） */
  function takeSeasonGifts() {
    const m = new Date().getMonth() + 1;
    const out = G.RECIPES.filter(r => r.season && r.season.month === m && d.gifts.indexOf(r.id) < 0);
    if (out.length) { out.forEach(r => d.gifts.push(r.id)); save(); }
    return out;
  }

  /* ---- ハート・シール ---- */
  function addHearts(n) { d.hearts += n; save(); }
  const hearts = () => d.hearts;
  const unsentHearts = () => Math.max(0, d.hearts - d.sent);
  function markSent(n) { d.sent += n; saveNow(); }
  const stickerCount = () => Math.min(G.STICKERS.length, Math.floor(d.hearts / G.HEARTS_PER_STICKER));
  function takeNewStickers() {
    const out = [];
    for (let i = d.seenStickers; i < stickerCount(); i++) out.push(i);
    d.seenStickers = stickerCount(); save();
    return out;
  }
  function heartsToNextSticker() {
    if (stickerCount() >= G.STICKERS.length) return 0;
    return G.HEARTS_PER_STICKER - (d.hearts % G.HEARTS_PER_STICKER);
  }

  /* ---- おしゃれ（js/chara.js・js/accessory.js が 読む） ---- */
  const ribbon = () => d.ribbon;
  const ribbonSide = () => (d.ribbonSide === 'left' ? 'left' : 'right');
  const makeup = () => d.makeup;
  const wear = () => d.wear;
  const clothes = () => d.wear.body || null;
  function clothColor(id) {
    const c = G.CLOTHES.find(x => x.id === id);
    return c && c.colors ? c.colors[(d.clothColor[id] || 0) % c.colors.length] : null;
  }
  function addMeter() { /* げんきメーターは ない（js/chara.js の なでる から よばれる） */ }
  function level() { return 0; }

  /* ---- しゃしん（大きいので、ふだんのセーブとは べつの場所に しまう） ---- */
  const ALBUM_KEY = KEY + '-album';
  function photos() {
    try { const raw = localStorage.getItem(ALBUM_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }

  /* ---- 毎日 ---- */
  const isNewDay = () => d.lastDay !== today();
  function markDay() { d.lastDay = today(); save(); }
  function pet() {
    if (d.pet.day !== today()) d.pet = { day: today(), count: 0, hearts: 0 };
    d.pet.count++;
    let heart = false;
    if (d.pet.count % PET_EVERY === 0 && d.pet.hearts < PET_MAX) { d.pet.hearts++; heart = true; }
    save();
    return heart;
  }

  /* ---- プレイ時間（F-C0） ---- */
  function playSecToday() { return d.play.day === today() ? d.play.sec : 0; }
  function overLimit() { return d.settings.limit > 0 && playSecToday() >= d.settings.limit * 60; }

  /* ---- 保護者の設定 ---- */
  const settings = () => d.settings;
  function setSetting(k, v) { d.settings[k] = v; applySettings(); saveNow(); }
  function applySettings() {
    const s = d.settings;
    G.Sound.setVolume(s.bgm, s.sfx);
    G.Voice.set({ enabled: s.voice });
  }
  /* 最初からやり直す：料理ゲームの データだけ 消す（N-63。おせわゲームの データには さわらない）。
   * まだ 持ちかえっていない ハートは なくなる。持ちかえった ぶんは おせわゲームに のこる */
  function reset() {
    const keep = d.settings;
    d = defaults();
    d.settings = keep;
    saveNow();
  }

  return {
    load, save, saveNow, hasSave, tick, catchUp,
    tummy, tummyPlates, isFull, eat,
    hasRecipe, recipes, markCooked, cookedCount, nextRequest, request, firstTime, takeNewRecipes, takeSeasonGifts,
    addHearts, hearts, unsentHearts, markSent, stickerCount, takeNewStickers, heartsToNextSticker,
    ribbon, ribbonSide, makeup, wear, clothes, clothColor, addMeter, level, photos,
    isNewDay, markDay, pet, playSecToday, overLimit, settings, setSetting, reset
  };
})();
