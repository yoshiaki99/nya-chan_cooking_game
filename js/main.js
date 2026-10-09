/* 全体の進行：画面の切り替え・背景・時間・保護者メニュー・起動 */
window.G = window.G || {};
G.Screens = G.Screens || {};

(function () {
  const UI = G.UI;
  const $ = (s) => document.querySelector(s);
  let current = null, currentName = null, sc = null, parentOpen = false;

  /* ---- 背景 ---- */
  let bgKey = null;
  G.setBg = function (key, force) {
    if (key === bgKey && !force) return;
    bgKey = key;
    const st = G.Assets.status(key);
    if (st === 'loading' || st === 'idle') { // 読みこみ中は仮の絵を出さず、届いてから切りかえる
      G.Assets.load(key).then(() => { if (bgKey === key) G.setBg(key, true); });
      return;
    }
    const bg = $('#bg');
    const layer = UI.el('div', 'bg-layer');
    layer.appendChild(G.Assets.node(key, 'bg-img'));
    bg.appendChild(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('show')));
    const olds = [...bg.querySelectorAll('.bg-layer')].filter(l => l !== layer);
    setTimeout(() => olds.forEach(o => o.remove()), 900);
  };

  /* ---- 画面の切り替え ---- */
  G.go = function (name, params = {}) {
    const def = G.Screens[name];
    if (!def) return;
    if (name === 'title' && G.Offline.updateReady) { G.State.saveNow(); location.reload(); return; }
    if (sc) sc.dispose();
    if (current && current.leave) current.leave();
    G.Voice.stop();
    G.Sound.shower(false);
    G.Sound.sizzle(false);
    const root = $('#screens');
    root.querySelectorAll('.screen').forEach(old => {
      old.classList.add('out');
      old.style.pointerEvents = 'none';
      setTimeout(() => { old.remove(); G.Chara.sweep(); }, 450); // 古い画面の ニャーちゃんの canvas も すぐ かえす
    });
    const scr = UI.el('div', 'screen screen-' + name);
    root.appendChild(scr);
    current = def; currentName = name; sc = G.scope();
    [...document.body.classList].filter(c => c.indexOf('scr-') === 0).forEach(c => document.body.classList.remove(c));
    document.body.classList.add('scr-' + name);
    document.body.classList.toggle('hud-on', !!def.hud);
    document.body.classList.toggle('on-home', name === 'home');
    G.setBg(def.bg || 'bg_kitchen');
    G.Sound.playBgm(def.bgm === undefined ? 'room' : def.bgm);
    def.enter(scr, sc, params);
  };
  G.currentScreen = () => currentName;

  /* ---- ごほうびのおしらせ（シール・あたらしい レシピ・きせつの プレゼント） ---- */
  let rewarding = false;
  G.checkRewards = async function () {
    if (rewarding) return false;
    const stickers = G.State.takeNewStickers();
    const un = G.State.takeNewUnlocks();
    const gifts = G.State.takeSeasonGifts();
    if (!stickers.length && !un.recipes.length && !un.clothes.length && !un.hats.length && !un.plates.length && !gifts.length) return false;
    rewarding = true;
    const L = G.CHARACTER.lines;
    for (const i of stickers) {
      const s = G.STICKERS[i];
      await UI.popup({ art: `<div class="sticker big"><span>${s.e}</span></div>`, title: 'シールを もらったよ！', speak: 'シールを もらったよ！ ' + s.label });
    }
    for (const r of un.recipes) await UI.popup({ art: G.Art.dish(r.id), title: 'あたらしい レシピ！', speak: r.label + '！ ' + L.unlockRecipe });
    for (const c of un.clothes.concat(un.hats)) await UI.popup({ art: G.Accessory.swatch(c.id), title: 'あたらしい おしゃれ！', speak: c.label + '！ ' + L.unlockDress });
    for (const p of un.plates) await UI.popup({ art: G.Art.plateSwatch(p.id), title: 'あたらしい おさら！', speak: p.label + '！ ' + L.unlockPlate });
    for (const r of gifts) { // きせつの プレゼント
      const art = G.recipe(r.id) ? G.Art.dish(r.id) : G.Accessory.swatch(r.id);
      await UI.popup({ art, title: r.season.name + 'の プレゼント！', speak: r.season.name + 'の ' + r.label + '！ ' + L.giftRecipe });
    }
    rewarding = false;
    return true;
  };
  G.isRewarding = () => rewarding;

  /* ---- 歯車（長押しで保護者メニュー：F-100） ---- */
  G.gearButton = function (scr, sc2) {
    const g = UI.el('div', 'btn-gear', `${G.Art.all.gear()}<svg class="gear-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/></svg>`);
    scr.appendChild(g);
    let timer = null;
    const cancel = () => { clearTimeout(timer); timer = null; g.classList.remove('holding'); };
    sc2.on(g, 'pointerdown', (e) => {
      e.preventDefault();
      g.classList.add('holding');
      timer = setTimeout(() => { cancel(); openParent(); }, 2000);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => sc2.on(g, ev, cancel));
    sc2.add(cancel);
    return g;
  };

  function openParent() {
    if (parentOpen) return;
    parentOpen = true;
    G.Voice.stop();
    const S = G.State, st = S.settings();
    const ov = $('#overlay');
    const wrap = UI.el('div', 'parent-wrap');
    const mins = Math.floor(S.playSecToday() / 60);
    wrap.innerHTML = `
      <div class="parent">
        <h2>保護者メニュー</h2>
        <section><h3>1日のプレイ時間の上限</h3>
          <div class="seg" data-k="limit"><button data-v="15">15分</button><button data-v="30">30分</button><button data-v="0">なし</button></div>
          <p class="note">今日のプレイ時間：約${mins}分（おせわゲームと合わせた時間）。上限になると、キッチンに戻ったときにニャーちゃんが「きょうは ここまで」と言って終わります（お料理の途中では終わりません）。おせわゲームにも上限を決めているときは、短いほうになります。</p></section>
        <section><h3>音量</h3>
          <label>BGM<input type="range" min="0" max="100" data-k="bgm" value="${Math.round(st.bgm * 100)}"></label>
          <label>効果音<input type="range" min="0" max="100" data-k="sfx" value="${Math.round(st.sfx * 100)}"></label>
          <div class="row"><span>読み上げ</span><div class="seg" data-k="voice"><button data-v="1">あり</button><button data-v="0">なし</button></div></div></section>
        <section><h3>ニューちゃんのおなかのすき方</h3>
          <div class="seg" data-k="decay"><button data-v="real">実際の時間（1時間で1品ぶん）</button><button data-v="play">遊んでいる間だけ（10分で1品ぶん）</button></div>
          <p class="note">ニューちゃんは3品食べると「おなか いっぱい」になります。次の日には必ずおなかがすいています。</p></section>
        <section><h3>オフラインで遊ぶ</h3>
          <p class="note offline-status">${offlineText()}</p>
          <p class="note">ホーム画面に追加すると、アプリのように全画面で遊べます。<br>
            iPad・iPhone（Safari）：共有ボタン →「ホーム画面に追加」<br>
            Android（Chrome）：右上のメニュー →「ホーム画面に追加」</p></section>
        <section><h3>データ</h3>
          <p class="note">ハート ${S.hearts()}こ／シール ${S.stickerCount()}まい</p>
          <button class="danger" data-act="reset">最初からやり直す</button></section>
        <section><h3>このゲームについて</h3>
          <p class="note">「${G.CHARACTER.title}」は、白いネコの${G.CHARACTER.name}になって、いろいろなお料理を作り、妹のニューちゃんに食べてもらう、小さなお子さま向けの無料のゲームです。失敗や罰はありません。ネコの体に悪いとされる食べもの（ねぎ類・チョコレートなど）は登場しません。</p>
          <p class="note"><b>ほんとうの料理について</b>：ゲームの中の料理は、遊びのために簡単にしてあります。火や包丁は、おとなの方と一緒に使うようにお声がけください。</p>
          <p class="note"><b>プライバシー</b>：名前などの個人情報は集めません。広告・課金・アクセス解析はありません。遊んだ記録（ハート・シール・レシピ・写真など）は、この端末のブラウザの中だけに保存され、外には送られません。</p>
          <p class="note">${G.CHARACTER.credit}</p>
          <p class="note">最終更新：${G.BUILD_INFO ? G.BUILD_INFO.label : '（開発用の版のため、ありません）'}</p></section>
        <button class="close" data-act="close">閉じる</button>
      </div>`;
    ov.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    const offlineEl = wrap.querySelector('.offline-status');
    Offline.onchange = () => { offlineEl.innerHTML = offlineText(); };

    const sync = () => {
      wrap.querySelectorAll('.seg').forEach(seg => {
        const k = seg.dataset.k;
        let v = S.settings()[k];
        if (k === 'voice') v = v ? '1' : '0';
        seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(v) === b.dataset.v));
      });
    };
    sync();
    wrap.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
      const k = b.parentElement.dataset.k;
      let v = b.dataset.v;
      if (k === 'limit') v = parseInt(v, 10);
      if (k === 'voice') v = v === '1';
      S.setSetting(k, v);
      G.Sound.play('tap');
      sync();
    }));
    wrap.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => {
      S.setSetting(r.dataset.k, r.value / 100);
    }));
    wrap.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('change', () => G.Sound.play('tap')));
    wrap.querySelector('[data-act=close]').addEventListener('click', close);
    wrap.querySelector('[data-act=reset]').addEventListener('click', () => {
      if (window.confirm('本当に最初からやり直しますか？\nこのゲームのハート・シール・レシピがすべて消えます。（設定・写真はそのまま残ります。おせわゲームのデータは消えません）')) {
        S.reset();
        close();
        G.go('title');
      }
    });
    function close() {
      Offline.onchange = null;
      wrap.classList.remove('show');
      setTimeout(() => wrap.remove(), 250);
      parentOpen = false;
      // 開いている あいだに 新しい版に 入れかわっていたら、ここで 読みこみ直す
      // （歯車は タイトル・キッチンに しか ないので、遊んでいる とちゅうでは ない）
      if (Offline.updateReady) { G.State.saveNow(); location.reload(); return; }
      lastTick = Date.now();
      if (currentName === 'home' && current.onTick) current.onTick();
    }
  }

  /* ---- 時間（1秒ごと） ---- */
  let lastTick = Date.now();
  let checkN = 0;
  function tick() {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (document.hidden) return;
    if (++checkN % 2 === 0) G.Chara.checkAll(); // 2びょうごとに、ニャーちゃんが きえていないか たしかめる
    if (parentOpen) return;
    if (currentName === 'title' || currentName === 'end' || !currentName) return;
    G.State.tick(dt);
    if (current && current.onTick) current.onTick();
  }

  /* ---- 起動 ---- */
  function preventGestures() {
    const block = (e) => e.preventDefault();
    document.addEventListener('gesturestart', block);
    document.addEventListener('gesturechange', block);
    document.addEventListener('dblclick', block);
    document.addEventListener('contextmenu', block);
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest && e.target.closest('.parent')) return;
      e.preventDefault();
    }, { passive: false });
    let lastEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastEnd < 320 && !(e.target.closest && e.target.closest('.parent'))) e.preventDefault();
      lastEnd = now;
    }, { passive: false });
    // 最初にさわったときに音と読み上げを使えるようにする（iPad は touchend / click で許可されることがある）
    ['pointerdown', 'touchend', 'click'].forEach(ev => {
      let voiceDone = false;
      document.addEventListener(ev, () => {
        G.Sound.init();
        if (!voiceDone) { voiceDone = true; G.Voice.unlock(); }
      }, { capture: true });
    });
  }

  function buildHud() {
    const hud = $('#hud');
    hud.innerHTML = `<div class="heart-counter"><div class="hc-icon">${G.Art.heart()}</div><div class="hc-num">0</div><div class="hc-book">${G.Art.all.icon_book()}</div></div>`;
    UI.setHeartCount(G.State.hearts());
    UI.tap(hud.querySelector('.heart-counter'), () => {
      if (currentName === 'home') G.go('stickers');
    }, { say: null, sound: 'tap' });
  }

  function boot() {
    G.Assets.init();
    G.State.load();
    G.Accessory.warm(G.State.wear(), G.State.ribbon());
    UI.fit();
    window.addEventListener('resize', UI.fit);
    window.addEventListener('orientationchange', () => setTimeout(UI.fit, 200));
    $('#rotate .rot-art').innerHTML = G.Art.rotateHint();
    preventGestures();
    buildHud();
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { G.State.saveNow(); G.Voice.stop(); }
      else {
        G.State.catchUp(); lastTick = Date.now(); if (current && current.onTick) current.onTick();
        UI.fit();
        G.Chara.checkAll(); // もどってきたら、ニャーちゃんが きえていないか すぐ たしかめる
      }
    });
    window.addEventListener('pagehide', () => G.State.saveNow());

    const first = ['bg_kitchen', 'chara:base', 'chara:title', 'chara:face_happy', 'chara:face_normal'];
    G.Assets.loadAll(first, 2500).then(() => {
      $('#boot').classList.add('hide');
      setTimeout(() => $('#boot').remove(), 600);
      if (G.Link.fromOsewa && !G.State.overLimit()) G.go('home', { from: 'osewa' }); // おせわゲームから きたら タイトルを とばす（F-D0）
      else G.go('title');
      G.Assets.loadAll(G.Assets.keys()).then(() => G.CharaArt.warm(G.State.ribbon()));
    });

    setupOffline();
  }

  /* ---- オフラインで遊ぶ：https で開いたときだけ、ゲーム全部を端末に保存する ---- */
  const Offline = G.Offline = { state: 'off', done: 0, total: 0, version: '', updating: false, updateReady: false, onchange: null };
  function setupOffline() {
    const O = Offline;
    if (location.protocol !== 'https:') return;
    if (!('serviceWorker' in navigator)) { O.state = 'unsupported'; return; }
    O.state = 'loading';
    const changed = () => { if (O.onchange) O.onchange(); };
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('message', (e) => {
      const m = e.data || {};
      if (m.type === 'offline-progress') { O.done = m.done; O.total = m.total; changed(); }
      if (m.type === 'offline-version') { O.version = m.version; O.total = m.total; changed(); }
    });
    // 新しい版に入れかわったら読みこみ直す。タイトル・おしまいの画面にいるときは すぐ、
    // あそんでいる とちゅうなら、次にアプリを開いたとき（またはタイトルに戻ったとき・保護者メニューを閉じたとき）
    const idle = () => { const n = G.currentScreen(); return !n || n === 'title' || n === 'end'; };
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;
      O.updateReady = true;
      if (idle() && !parentOpen) { G.State.saveNow(); location.reload(); }
    });
    let swReg = null;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (O.updateReady) { location.reload(); return; }
      // ホーム画面から ひらきなおした（とじずに 裏に あった）ときも、新しい版が ないか たしかめる
      if (swReg) swReg.update().catch(() => { });
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      swReg = reg;
      const refresh = () => {
        O.state = reg.active ? 'ready' : (reg.installing || reg.waiting ? 'loading' : 'error');
        O.updating = !!(reg.active && reg.installing);
        // 新しい版を 受け取っている とちゅうは、古い版に 話しかけない（話しかけると、入れかわりが 止まって しまう）。
        // 入れかわったら、新しい版の ほうから 版を 知らせてくる
        if (reg.active && !reg.installing && !reg.waiting) reg.active.postMessage('offline-version');
        changed();
      };
      const watch = (w) => { if (w) w.addEventListener('statechange', refresh); };
      watch(reg.installing);
      reg.addEventListener('updatefound', () => { O.done = 0; watch(reg.installing); refresh(); });
      refresh();
    }).catch(() => { O.state = 'error'; changed(); });
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
  }

  function offlineText() {
    const O = Offline;
    const prog = O.total ? `（${O.done}／${O.total}）` : '';
    switch (O.state) {
      case 'ready':
        return '<b class="ok">✓ 準備完了</b>：インターネットにつながっていなくても、この端末で遊べます。' +
          (O.updating ? `<br>新しい版を受け取っています…${prog}` : '') +
          (O.version ? `<br><span class="ver">版 ${O.version}・${O.total}ファイル</span>` : '');
      case 'loading':
        return `準備中です…${prog}<br>インターネットにつながったまま、しばらくお待ちください。`;
      case 'error':
        return 'まだ準備できていません。インターネットにつながっているときに、一度閉じて開き直してください。';
      case 'unsupported':
        return 'このブラウザはオフラインでの保存に対応していません（インターネットにつながっていれば遊べます）。';
      default:
        return 'いまは開発用のアドレス（http）で開いているため、オフライン用の保存は使いません。';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
