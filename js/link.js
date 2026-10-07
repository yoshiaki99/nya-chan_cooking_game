/* おせわゲームとの 行き来（要件定義書 5.14・6.7 N-65〜N-68）
 * 2つの ゲームは 同じ サイト（yoshiaki99.github.io）に あるので、ページを 切りかえて 行き来し、
 * ハートは 端末の 中の「わたしばこ」（nya-link-v1）を とおして わたす。サーバーは つかわない。
 *
 * わたしばこ = { v: 1,
 *   box:   [{ id, hearts, together, t }],   … とどけもの。料理ゲームは 足すだけ、おせわゲームが 受けとって 消す
 *   play:  { day, sec },                     … 2つの ゲームで あわせた 今日の プレイ時間（F-D9）
 *   limit: { osewa: 分, ryouri: 分 } }       … それぞれの 保護者メニューの 上限（0 = なし）。みじかい ほうを つかう
 * こわれていたり 知らない 版だったり したら、何も しない（N-68）
 */
window.G = window.G || {};

G.Link = (function () {
  const KEY = 'nya-link-v1';
  const OSEWA_KEY = 'nya-osewa-v1';          // おせわゲームの セーブデータ（あるか 見るだけ。書きかえない：N-67）
  const OSEWA_URL = '../nya-chan_care_game/'; // おなじ サイトの おせわゲーム
  const ME = 'ryouri';
  const fromOsewa = new URLSearchParams(location.search).get('from') === 'osewa';
  // アドレスの しるしは 読んだら けす（読みこみなおしたときに また タイトルを とばさないように）
  if (fromOsewa && history.replaceState) { try { history.replaceState(null, '', location.pathname); } catch (e) { /* なし */ } }

  const today = () => { const t = new Date(); return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); };
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { v: 1, box: [], play: { day: today(), sec: 0 }, limit: {} };
      const d = JSON.parse(raw);
      if (!d || d.v !== 1 || !Array.isArray(d.box)) return null; // 知らない 版・こわれている
      if (!d.play || d.play.day !== today()) d.play = { day: today(), sec: 0 };
      if (!d.limit || typeof d.limit !== 'object') d.limit = {};
      return d;
    } catch (e) { return null; }
  }
  function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }

  function hasOsewaSave() {
    try { return !!localStorage.getItem(OSEWA_KEY); } catch (e) { return false; }
  }
  /* 「おうちに かえる」を 出すか（F-D1） */
  const canGoHome = () => fromOsewa || hasOsewaSave();

  /* まだ 持ちかえっていない ハート（と いっしょに たべた 回数）を わたしばこに 入れる（F-D2・F-D4・F-D8）。
   * 入れた ハートの 数を かえす。わたしばこが つかえない ときは 0（ハートは 料理ゲームに のこり、つぎに わたす） */
  function sendHome() {
    const S = G.State;
    const hearts = S.unsentHearts(), together = S.togetherCount();
    if (!hearts && !together) return 0;
    const d = read();
    if (!d) return 0;
    d.box.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), hearts, together, t: Date.now() });
    if (!write(d)) return 0;
    S.markSent(hearts);
    S.clearTogether();
    return hearts;
  }

  /* プレイ時間を あわせて かぞえる（F-D9）。main.js から 1秒ごと */
  let pend = 0;
  function addPlay(sec) {
    pend += sec;
    if (pend < 5) return; // 5びょうごとに まとめて 書く
    const d = read();
    if (!d) return;
    d.play.sec += pend; pend = 0;
    write(d);
  }
  function playSecToday() { const d = read(); return d ? d.play.sec + pend : 0; }
  function setLimit(min) { const d = read(); if (!d) return; d.limit[ME] = min || 0; write(d); }
  /* 2つの ゲームの 上限の みじかい ほう（分。0 = なし） */
  function limitMin() {
    const d = read();
    const all = d ? Object.values(d.limit).filter(v => v > 0) : [];
    return all.length ? Math.min.apply(null, all) : 0;
  }

  /* おせわゲームが この 端末で ひらける か（インターネットに つながっていないのに、まだ 保存されて いないと ひらけない：F-D10） */
  async function osewaReachable() {
    if (navigator.onLine !== false) return true;
    try { return (await caches.keys()).some(k => k.indexOf('nya-osewa-') === 0); } catch (e) { return false; }
  }
  function goOsewa() {
    G.State.saveNow();
    location.href = OSEWA_URL + '?from=ryouri';
  }

  return { fromOsewa, canGoHome, sendHome, addPlay, playSecToday, setLimit, limitMin, osewaReachable, goOsewa };
})();
