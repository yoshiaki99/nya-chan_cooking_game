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
      seenUnlock: 0,  // あたらしい レシピ・エプロン・ぼうし・おさらの おしらせを した ハートの 数
      plate: 'round', // さいごに えらんだ おさら
      together: 0,    // ニャーちゃんも いっしょに たべた 回数（まだ おせわゲームに つたえていない ぶん：F-D8）
      gifts: [],      // とどいた きせつの レシピ・エプロン
      cooked: {},     // レシピの id → 作った 回数
      tummy: 0,       // ニューちゃんが たべた 数（G.TUMMY_FULL で いっぱい：F-85）
      request: null,  // ニューちゃんの リクエスト（レシピの id：F-30）
      firstDone: false, // はじめての おにぎりを 作ったか（F-31）
      safety: {},     // 火・ほうちょうを はじめて つかったときの ひとことを 言ったか（F-6F。1回だけ）
      // おせわゲームと 同じ しくみ（js/chara.js・js/accessory.js）が 読む おしゃれ。エプロン（body）・ぼうし（head）
      ribbon: 'none',
      ribbonSide: 'right',
      makeup: { cheek: null, lip: null, eye: null },
      wear: { head: 'chefhat', face: null, neck: null, back: null, tail: null, body: 'apron' },
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
    if (d.seenRecipes != null) { d.seenUnlock = Math.max(d.seenUnlock, d.seenRecipes); delete d.seenRecipes; } // まえの 版の セーブ
    if (d.wear.body && !G.CLOTHES.some(c => c.id === d.wear.body)) d.wear.body = 'apron';
    if (d.wear.head && !G.ACCESSORIES.some(c => c.id === d.wear.head)) d.wear.head = 'chefhat';
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
  function noteTogether() { d.together++; save(); }
  const togetherCount = () => d.together;
  function clearTogether() { d.together = 0; save(); }
  /* はじめての ときだけ true（火・ほうちょうの ひとこと：F-6F） */
  function firstTime(kind) {
    if (d.safety[kind]) return false;
    d.safety[kind] = true; save();
    return true;
  }
  /* あたらしく ふえた レシピ・エプロン・ぼうし・おさら（F-92） */
  function takeNewUnlocks() {
    const isNew = (x) => !x.season && x.unlock > d.seenUnlock && x.unlock <= d.hearts;
    const out = { recipes: G.RECIPES.filter(isNew), clothes: G.CLOTHES.filter(isNew), hats: G.ACCESSORIES.filter(isNew), plates: G.PLATES.filter(isNew) };
    const all = [].concat(out.recipes, out.clothes, out.hats, out.plates);
    if (all.length) { d.seenUnlock = Math.max.apply(null, all.map(x => x.unlock)); save(); }
    return out;
  }
  /* その月の きせつの プレゼント（レシピ・エプロン）を とどける（とどいたら ずっと つかえる：F-93） */
  function takeSeasonGifts() {
    const m = new Date().getMonth() + 1;
    const out = G.RECIPES.concat(G.CLOTHES).filter(r => r.season && r.season.month === m && d.gifts.indexOf(r.id) < 0);
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
  function setWear(slot, id) { d.wear[slot] = id; save(); }
  const hasItem = (x) => (x.season ? d.gifts.indexOf(x.id) >= 0 : x.unlock <= d.hearts); // エプロン・ぼうし・おさら
  const clothColorIndex = (id) => d.clothColor[id] || 0;
  function setClothColor(id, i) { d.clothColor[id] = i; save(); }
  const plate = () => (G.PLATES.some(p => p.id === d.plate && hasItem(p)) ? d.plate : 'round');
  function setPlate(id) { d.plate = id; save(); }
  function clothColor(id) {
    const c = G.CLOTHES.find(x => x.id === id);
    return c && c.colors ? c.colors[(d.clothColor[id] || 0) % c.colors.length] : null;
  }
  function addMeter() { /* げんきメーターは ない（js/chara.js の なでる から よばれる） */ }
  function level() { return 0; }

  /* ---- しゃしん（大きいので、ふだんのセーブとは べつの場所に しまう） ---- */
  /* レシピちょうの しゃしん（F-B0〜F-B2）。絵そのものではなく、お料理・もりつけの データを のこして、見るときに 描く（小さく すむ）
   * { t: とった時刻, r: レシピ, data, deco } */
  const ALBUM_KEY = KEY + '-album';
  function photos() {
    try { const raw = localStorage.getItem(ALBUM_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function writePhotos(list) { try { localStorage.setItem(ALBUM_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  /* 1まい のこす。30まいを こえたら 古いものから はずす。ただし レシピごとに いちばん新しい 1まいは のこす（F-B1） */
  function addPhoto(entry) {
    const list = photos();
    list.push(entry);
    while (list.length > G.PHOTO_MAX) {
      const i = list.findIndex(p => list.some(q => q !== p && q.r === p.r && q.t > p.t));
      list.splice(i >= 0 ? i : 0, 1);
    }
    while (!writePhotos(list) && list.length > 1) list.shift();
  }
  function removePhoto(t) { writePhotos(photos().filter(p => p.t !== t)); }

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
    hasRecipe, recipes, markCooked, cookedCount, nextRequest, request, firstTime, noteTogether, togetherCount, clearTogether, takeNewUnlocks, takeSeasonGifts,
    addHearts, hearts, unsentHearts, markSent, stickerCount, takeNewStickers, heartsToNextSticker,
    ribbon, ribbonSide, makeup, wear, clothes, clothColor, clothColorIndex, setClothColor, setWear, hasItem, plate, setPlate,
    addMeter, level, photos, addPhoto, removePhoto,
    isNewDay, markDay, pet, playSecToday, overLimit, settings, setSetting, reset
  };
})();
