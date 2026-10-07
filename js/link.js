/* おせわゲームとの 行き来（要件定義書 5.14・6.7 N-65〜N-68）
 * 2つの ゲームは 同じ サイト（yoshiaki99.github.io）に あるので、ページを 切りかえて 行き来する。
 * いまは「おせわゲームから 来たか」「おうちに かえる ボタンを 出すか」だけ。
 * ハートを わたす「わたしばこ」（nya-link-v1）は 第2.5段階で 作る */
window.G = window.G || {};

G.Link = (function () {
  const OSEWA_KEY = 'nya-osewa-v1'; // おせわゲームの セーブデータ（読むだけ。書きかえない：N-67）
  const fromOsewa = new URLSearchParams(location.search).get('from') === 'osewa';
  // アドレスの しるしは 読んだら けす（読みこみなおしたときに また タイトルを とばさないように）
  if (fromOsewa && history.replaceState) { try { history.replaceState(null, '', location.pathname); } catch (e) { /* なし */ } }

  function hasOsewaSave() {
    try { return !!localStorage.getItem(OSEWA_KEY); } catch (e) { return false; }
  }
  /* 「おうちに かえる」を 出すか（F-D1） */
  const canGoHome = () => fromOsewa || hasOsewaSave();

  return { fromOsewa, canGoHome };
})();
