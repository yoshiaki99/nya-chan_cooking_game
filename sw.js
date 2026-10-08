/* オフラインでも遊べるようにする（https で開いたときだけ使われる）
 * ・はじめて開いたとき、ゲームに使うファイルを全部 端末の中に保存する。全部そろってから「準備完了」になる。
 * ・そのあとは保存したものだけで動くので、インターネットにつながっていなくても遊べる。
 * ・新しい版が公開されると、次に開いたときに、変わったファイルだけを受け取って入れかわる。
 * 下の VERSION と FILES は tools/build.py が自動で書きかえるので、手で直さなくてよい。 */
/* @@FILES-BEGIN */
const VERSION = '8816ae3cd0';
const FILES = [
  ["index.html", "64bc28997f"],
  ["assets/characters/nya_act_bath_fluffy.png", "81401cdcec"],
  ["assets/characters/nya_act_bath_foam.png", "fdbed4afb1"],
  ["assets/characters/nya_act_eat.png", "f029eafb01"],
  ["assets/characters/nya_act_play_yarn.png", "3f6380a2da"],
  ["assets/characters/nya_act_sleep.png", "f03dcdeb39"],
  ["assets/characters/nya_act_wave.png", "a6d137a608"],
  ["assets/characters/nya_base.png", "4d2b1d5ae6"],
  ["assets/characters/nya_face_dreamy.png", "be6987c530"],
  ["assets/characters/nya_face_happy.png", "ea1641a05f"],
  ["assets/characters/nya_face_lonely.png", "94b995b1f7"],
  ["assets/characters/nya_face_normal.png", "4f1e1e4813"],
  ["assets/characters/nya_face_prim.png", "84a42f9573"],
  ["assets/characters/nya_face_sleepy.png", "bcce724536"],
  ["assets/characters/nyu_act_wave.png", "2e2839f778"],
  ["assets/characters/nyu_base.png", "123b0e4a49"],
  ["assets/characters/nyu_face_dreamy.png", "ef8f9b193a"],
  ["assets/characters/nyu_face_happy.png", "0d77fd75bc"],
  ["assets/voice/g_stickers_all.m4a", "df11e0df00"],
  ["assets/voice/m_dailyHeart.m4a", "e3131c40d5"],
  ["assets/voice/m_limit.m4a", "e45c2c58e9"],
  ["assets/voice/m_pet_1.m4a", "72514bb987"],
  ["assets/voice/m_pet_2.m4a", "718be50255"],
  ["assets/voice/m_pet_3.m4a", "7b2de7ce54"],
  ["assets/voice/m_stickerGet.m4a", "6e66fa8c72"],
  ["assets/voice/n_pet_1.m4a", "f93b39b8b9"],
  ["assets/voice/n_pet_2.m4a", "80a3228bca"],
  ["assets/voice/n_pet_3.m4a", "033df42af4"],
  ["css/style.css", "a18e96d754"],
  ["icons/apple-touch-icon.png", "945d5717c3"],
  ["icons/icon-192.png", "f648e4cac7"],
  ["icons/icon-512.png", "1b9afb9000"],
  ["icons/og-image.png", "187919959d"],
  ["js/accessory.js", "6ea0171015"],
  ["js/art.js", "142c4f87e9"],
  ["js/art_food.js", "0fbaef392e"],
  ["js/art_kitchen.js", "4d9c2df5a4"],
  ["js/asset_list.js", "f635f04f1f"],
  ["js/assets.js", "44269b1a2d"],
  ["js/audio.js", "6dcb18e42b"],
  ["js/chara.js", "47379dcf34"],
  ["js/character.js", "f0fea7e739"],
  ["js/character_nyu.js", "2fe2840f29"],
  ["js/clothes.js", "f2402b204e"],
  ["js/data.js", "ce1fcaf70d"],
  ["js/link.js", "fba3f5034a"],
  ["js/main.js", "7eadf3177f"],
  ["js/makeup.js", "1cb014dcba"],
  ["js/nyu.js", "dbce41d0a5"],
  ["js/recipes.js", "0c1f702d3e"],
  ["js/screens/cook.js", "f2644fd852"],
  ["js/screens/dress.js", "4bb92b5b26"],
  ["js/screens/main.js", "d26775c9fe"],
  ["js/state.js", "1fc5af9495"],
  ["js/steps.js", "1d0e870a39"],
  ["js/steps2.js", "f96e423792"],
  ["js/ui.js", "7b01161cdc"],
  ["js/voice.js", "eafb619e48"],
  ["js/voice_clips.js", "70e3f732f7"],
  ["manifest.webmanifest", "d287190fa4"]
];
/* @@FILES-END */

// キャッシュの 名前。おせわゲーム（nya-osewa-）と 同じ サイトに あるので、名前で 分けて、
// 古い キャッシュを 消すときも じぶんの もの（nya-ryouri-）だけ 消す（要件定義書 6.7 N-61）
const PREFIX = 'nya-ryouri-';
const CACHE = PREFIX + VERSION;
const SCOPE = new URL(self.registration.scope);
const REV = new Map(FILES);
const keyOf = (path, rev) => new URL(path + '?rev=' + rev, SCOPE).href;

async function tell(msg) {
  const list = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  list.forEach(c => c.postMessage(msg));
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const queue = FILES.slice();
    let done = 0;
    const worker = async () => {
      while (queue.length) {
        const [path, rev] = queue.shift();
        const key = keyOf(path, rev);
        let res = await caches.match(key); // 前の版と同じファイルは、取りなおさない
        if (!res) {
          res = await fetch(new URL(path, SCOPE).href, { cache: 'reload' });
          if (!res.ok) throw new Error(path + ' ' + res.status);
        }
        await cache.put(key, res);
        done++;
        tell({ type: 'offline-progress', done, total: FILES.length });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    tell({ type: 'offline-version', version: VERSION, total: FILES.length });
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'offline-version' && e.source) e.source.postMessage({ type: 'offline-version', version: VERSION, total: FILES.length });
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  let path = decodeURIComponent(url.pathname.slice(SCOPE.pathname.length));
  if (path === '') path = 'index.html';
  const rev = REV.get(path);
  if (rev) {
    e.respondWith(caches.open(CACHE)
      .then(c => c.match(keyOf(path, rev)))
      .then(hit => hit || fetch(req)));
    return;
  }
  if (path.startsWith('assets/')) {
    // まだ無い絵は、すぐ「無い」と返す（ゲームが描いた仮の絵になる）
    e.respondWith(new Response('', { status: 404 }));
  }
  // それ以外は、ふつうにサーバーから受け取る
});
