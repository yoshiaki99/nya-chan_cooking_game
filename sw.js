/* オフラインでも遊べるようにする（https で開いたときだけ使われる）
 * ・はじめて開いたとき、ゲームに使うファイルを全部 端末の中に保存する。全部そろってから「準備完了」になる。
 * ・そのあとは保存したものだけで動くので、インターネットにつながっていなくても遊べる。
 * ・新しい版が公開されると、次に開いたときに、変わったファイルだけを受け取って入れかわる。
 * 下の VERSION と FILES は tools/build.py が自動で書きかえるので、手で直さなくてよい。 */
/* @@FILES-BEGIN */
const VERSION = 'dcfd2627e6';
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
  ["assets/voice/g_again.m4a", "ec2995b311"],
  ["assets/voice/g_back.m4a", "514bcd33ac"],
  ["assets/voice/g_bye.m4a", "21ea46fc70"],
  ["assets/voice/g_start.m4a", "159e8c98fc"],
  ["assets/voice/g_stickers_all.m4a", "df11e0df00"],
  ["assets/voice/g_yatta.m4a", "f9ce04e824"],
  ["assets/voice/m_acceptRequest.m4a", "82250162f4"],
  ["assets/voice/m_boilDone.m4a", "5514a97a4a"],
  ["assets/voice/m_boilIntro.m4a", "2b5166922f"],
  ["assets/voice/m_bookIntro.m4a", "e013a66187"],
  ["assets/voice/m_bookNotYet.m4a", "750abddb4a"],
  ["assets/voice/m_bye.m4a", "91edd43838"],
  ["assets/voice/m_carry.m4a", "b878b2a7ff"],
  ["assets/voice/m_cheer_1.m4a", "9b8ddf4411"],
  ["assets/voice/m_cheer_2.m4a", "02ed3c3ccd"],
  ["assets/voice/m_cheer_3.m4a", "579835a67d"],
  ["assets/voice/m_chillDone.m4a", "57a2b3fa81"],
  ["assets/voice/m_chillIntro.m4a", "2ecf55d962"],
  ["assets/voice/m_comingSoon.m4a", "8cb3c35d1e"],
  ["assets/voice/m_content_1.m4a", "f22e113b8b"],
  ["assets/voice/m_content_3.m4a", "a5f3908747"],
  ["assets/voice/m_content_4.m4a", "3d870ef7e5"],
  ["assets/voice/m_cookHint.m4a", "7518e72e6e"],
  ["assets/voice/m_crackIntro.m4a", "325b17d641"],
  ["assets/voice/m_creamSpread.m4a", "64cf1a3601"],
  ["assets/voice/m_cutIntro.m4a", "9a5762af9d"],
  ["assets/voice/m_cutoutIntro.m4a", "71102d9b50"],
  ["assets/voice/m_dailyHeart.m4a", "bf2134ee39"],
  ["assets/voice/m_decoClear.m4a", "79363d6ef6"],
  ["assets/voice/m_decoIntro.m4a", "86a575d884"],
  ["assets/voice/m_dressDone.m4a", "aa5f1bf5c3"],
  ["assets/voice/m_dressIntro.m4a", "be47adbf3e"],
  ["assets/voice/m_fillIntro.m4a", "6b1ed4d024"],
  ["assets/voice/m_fillingIntro.m4a", "5afe639470"],
  ["assets/voice/m_flipDone.m4a", "9973fcaae2"],
  ["assets/voice/m_flipIntro.m4a", "284973cd35"],
  ["assets/voice/m_fromOsewa.m4a", "2b167040dc"],
  ["assets/voice/m_fryIntro.m4a", "54eaef68b7"],
  ["assets/voice/m_fryReady.m4a", "2237cac523"],
  ["assets/voice/m_frySizzle.m4a", "ec23451660"],
  ["assets/voice/m_gatherDone.m4a", "edc582dd17"],
  ["assets/voice/m_gatherHint.m4a", "719bf237cb"],
  ["assets/voice/m_gatherIntro.m4a", "e2552ba267"],
  ["assets/voice/m_gatherWrong.m4a", "be37bfc25e"],
  ["assets/voice/m_giftRecipe.m4a", "f5d2d782c2"],
  ["assets/voice/m_goHomeNone.m4a", "51f07b2b8b"],
  ["assets/voice/m_greetAgain_1.m4a", "dba4e7dce1"],
  ["assets/voice/m_greetAgain_2.m4a", "7c86cfb549"],
  ["assets/voice/m_greetDaily.m4a", "82ae286b7e"],
  ["assets/voice/m_kneadIntro.m4a", "1476d46787"],
  ["assets/voice/m_limit.m4a", "f03841e8d2"],
  ["assets/voice/m_mixIntro.m4a", "a81347a982"],
  ["assets/voice/m_offlineHome.m4a", "503fd5ffa5"],
  ["assets/voice/m_ovenDone.m4a", "fc1efbc953"],
  ["assets/voice/m_ovenIntro.m4a", "c1f86a7ed0"],
  ["assets/voice/m_ovenWait.m4a", "7d2b6ddd54"],
  ["assets/voice/m_patIntro.m4a", "9a2542e5a9"],
  ["assets/voice/m_pet_1.m4a", "72514bb987"],
  ["assets/voice/m_pet_2.m4a", "3d9dc46cc0"],
  ["assets/voice/m_pet_3.m4a", "7e5718b1f5"],
  ["assets/voice/m_photoDelete.m4a", "d9dbc5478e"],
  ["assets/voice/m_photoSaved.m4a", "a7816e050e"],
  ["assets/voice/m_pickRecipe.m4a", "77e2ce5e02"],
  ["assets/voice/m_pourIntro.m4a", "70417847a9"],
  ["assets/voice/m_pourOverIntro.m4a", "6135f1ed0b"],
  ["assets/voice/m_quitAsk.m4a", "3cf2c29232"],
  ["assets/voice/m_readyCheck.m4a", "0498579b0f"],
  ["assets/voice/m_rollIntro.m4a", "f874162292"],
  ["assets/voice/m_rollupIntro.m4a", "1f9e89e199"],
  ["assets/voice/m_safetyFire.m4a", "6fdaeac184"],
  ["assets/voice/m_safetyKnife.m4a", "0b1d26b3de"],
  ["assets/voice/m_sauceIntro.m4a", "cf09ea5ece"],
  ["assets/voice/m_sauceSpread.m4a", "ccef463d03"],
  ["assets/voice/m_scoopIntro.m4a", "2e9b1a46b5"],
  ["assets/voice/m_shapeIntro.m4a", "9137db27b8"],
  ["assets/voice/m_spreadIntro.m4a", "1532f0b45a"],
  ["assets/voice/m_stepDone_1.m4a", "1e1e0a3e73"],
  ["assets/voice/m_stepDone_2.m4a", "efc8e2e94c"],
  ["assets/voice/m_stickerGet.m4a", "9ee3dc4671"],
  ["assets/voice/m_stirIntro.m4a", "9307d24d8a"],
  ["assets/voice/m_sushiIntro.m4a", "00d5d6cf18"],
  ["assets/voice/m_taste.m4a", "07ef967d1e"],
  ["assets/voice/m_together.m4a", "bb633d2c93"],
  ["assets/voice/m_unlockDress.m4a", "09705581e1"],
  ["assets/voice/m_unlockPlate.m4a", "e9ec4814f8"],
  ["assets/voice/m_unlockRecipe.m4a", "bf696b0c43"],
  ["assets/voice/m_washIntro.m4a", "93c20f9fc1"],
  ["assets/voice/m_wrapIntro.m4a", "57eb64abb6"],
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
  ["js/asset_list.js", "7107f5495a"],
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
  ["js/voice_clips.js", "e3bdce6ef1"],
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
