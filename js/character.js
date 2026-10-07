/*
 * キャラクター設定（要件定義書 2章。見た目・性格は おせわゲームと 同じ）
 * 名前・絵・セリフをこのファイル1か所にまとめてある。
 * キャラクターの絵を差し替えるときは、このファイルと assets/characters の絵だけを替えればよい。
 */
window.G = window.G || {};

G.CHARACTER = {
  name: 'ニャーちゃん',
  title: 'ニャーちゃん おりょうりゲーム',
  // 保護者メニュー「このゲームについて」に出す 権利の表示
  credit: 'キャラクター「ニャーちゃん」の著作権は、作者に帰属します。',

  // ゲームで使うキャラクターの絵（背景透過PNG。1254×1254 の正方形に、足もとを下にそろえて置く）
  // 表情・動作の絵は tools/make_poses.js が 基準画 nya_base.png から 作る。まだ無い絵は fallbacks の絵で代わりに出す
  images: {
    base:        'assets/characters/nya_base.png',
    face_normal: 'assets/characters/nya_face_normal.png',
    face_happy:  'assets/characters/nya_face_happy.png',
    face_dreamy: 'assets/characters/nya_face_dreamy.png',
    face_prim:   'assets/characters/nya_face_prim.png',
    face_sleepy: 'assets/characters/nya_face_sleepy.png',
    face_lonely: 'assets/characters/nya_face_lonely.png',
    act_eat:     'assets/characters/nya_act_eat.png',
    act_foam:    'assets/characters/nya_act_bath_foam.png',
    act_fluffy:  'assets/characters/nya_act_bath_fluffy.png',
    act_yarn:    'assets/characters/nya_act_play_yarn.png',
    act_sleep:   'assets/characters/nya_act_sleep.png',
    act_wave:    'assets/characters/nya_act_wave.png',
    title:       'assets/characters/nya_act_wave.png' // タイトルは 手を ふる 絵
  },

  // 絵がまだ無いときに代わりに使う絵
  fallbacks: {
    face_normal: 'base', face_happy: 'base', face_dreamy: 'face_happy', face_prim: 'face_normal',
    face_sleepy: 'face_normal', face_lonely: 'face_normal',
    act_eat: 'face_happy', act_foam: 'face_happy', act_fluffy: 'face_happy',
    act_yarn: 'face_happy', act_sleep: 'face_sleepy', act_wave: 'face_happy',
    title: 'face_happy'
  },

  // 絵ごとの表示の大きさ（1 = 枠いっぱい）。横に なって ねる 絵は 小さめに
  poseScale: { act_sleep: 0.78 },

  // 絵ごとの横のずれの補正（高さに対する割合）
  poseShift: {},

  // 夜の場面でニャーちゃんに重ねる色（乗算）
  nightTint: 'rgb(222, 213, 242)',

  // リボンは 絵の色を ぬりかえない（ニャーちゃんは 耳・舌・ほっぺが ピンクなので）。
  // ribbonHue: { from, to } を書くと、その色相の部分を ぬりかえる しくみが はたらく（いまは 使わない）
  ribbonHue: null,

  // 口もと（ごはんを運ぶ場所）の位置。絵の外わくに対する割合
  mouth: { x: 0.49, y: 0.33 },

  // おふろで シャワーを もつ 手（手を ふる 絵 act_wave の あげた 手）の 位置。絵の外わくに対する割合
  showerPaw: { x: 0.175, y: 0.5 },

  // メイクを描く場所（元の絵のピクセル）。絵ごとに：
  //   eyes   = [左目, 右目]。それぞれ [x, y, 大きさ]（あいている目は黒目のまんなか、とじた目はまつげの線のまんなか）
  //   closed = 目をとじている絵 / cheeks = [左のほっぺ, 右のほっぺ] / mouth = [x, y, よこはば, たてはば]
  // ここに無い絵（おふろの あわ など）には メイクを描かない。絵を差し替えたら、ここも合わせる
  face: (function () {
    // 立っている 絵は みんな 基準画と 同じ 顔の いち（tools/make_poses.js で 目・口だけ かきかえている）
    const F = { eyes: [[518, 338, 46], [706, 320, 46]], cheeks: [[430, 413], [829, 391]], mouth: [617, 430, 124, 26] };
    const closed = Object.assign({}, F, { closed: true, eyes: [[518, 340, 46], [706, 322, 46]] });
    return {
      base: F, face_normal: F, face_prim: closed, face_lonely: Object.assign({}, F, { eyes: [[518, 346, 40], [706, 328, 40]] }),
      face_happy: closed, face_dreamy: closed, face_sleepy: closed,
      act_eat: closed, act_wave: closed, act_yarn: closed, act_fluffy: closed,
      // 横に なって ねる 絵（基準画を 右に 90° まわした 座標：x' = 1227 − y、y' = x + 165）
      act_sleep: { eyes: [[887, 683, 46], [905, 871, 46]], closed: true, cheeks: [[814, 595], [836, 994]], mouth: [797, 782, 26, 124] }
    };
  })(),

  // アクセサリーを つける場所。アクセサリー・ふく・みみの リボンの絵は、基準画の 座標で描いてある（js/accessory.js・js/clothes.js）。
  //   pivot = 絵の上の 目じるし（あたま=おでこの上、かお=目と目のあいだ、くび=くびの まんなか、しっぽ=しっぽの まんなか、
  //           せなか=せなか、body=からだ、bow=みみの リボンの 結び目）
  //   bowL・bowR = みみの リボンの 場所（画面で 見て ひだりの みみ・みぎの みみ。G.State.ribbonSide で えらぶ）
  //   poses = 絵ごとに、目じるしが来る場所 [x, y, 回転(度), 大きさ, オプション]。ほかの絵の名前を書くと その絵と同じ
  // ここに無い絵（おふろの あわ など）・書いていない場所には つけない。絵を差し替えたら、ここも合わせる
  accessory: (function () {
    // みみの リボンの 結び目（基準画の 座標）と かたむき（度）。ひだり = 画面で 見て ひだりの みみ
    const EAR_L = [400, 222, -24], EAR_R = [856, 198, 22];
    const pivot = { head: [615, 200], face: [612, 330], neck: [617, 604], tail: [930, 1045], back: [615, 760], body: [615, 880], bow: [0, 0] };
    const base = {};
    Object.keys(pivot).forEach(k => { if (k !== 'bow') base[k] = pivot[k].concat([0, 1]); });
    base.bowL = [EAR_L[0], EAR_L[1], EAR_L[2], 1];
    base.bowR = [EAR_R[0], EAR_R[1], EAR_R[2], 1];
    // ねる 絵は 基準画を 右に 90° まわした 座標（x' = 1227 − y、y' = x + 165）
    const lie = (e) => [1227 - e[1], e[0] + 165, e[2] + 90, 1];
    return {
      pivot,
      poses: {
        base,
        face_normal: 'base', face_happy: 'base', face_dreamy: 'base', face_prim: 'base', face_sleepy: 'base', face_lonely: 'base',
        act_eat: 'base', act_yarn: 'base', act_fluffy: 'base',
        // 手を あげている 絵：左の そでは 描かない
        act_wave: Object.assign({}, base, { body: [615, 880, 0, 1, { noL: true }] }),
        // ねる 絵（右に 90° まわした 絵）：もうふの 中は つけない（ぼうしと みみの リボンだけ。メガネも はずす）
        act_sleep: { head: [1027, 780, 90, 1], bowL: lie(EAR_L), bowR: lie(EAR_R) }
      }
    };
  })(),

  // あそぶ（毛糸玉）の絵の中の毛糸玉の位置。絵の外わくに対する割合（tools/make_poses.js の YARN）
  yarnBallInPose: { x: 0.287, y: 0.905 },

  // 鳴き声・声の高さ（読み上げ）
  voicePitch: 1.45,

  // セリフ（ひらがな・カタカナのみ）。配列のものはその中から1つ選ぶ
  // セリフの最後には いつも「ニャー」をつける（要件定義書 2.3。tools/check_lines.js で たしかめられる）
  // プレイヤーは ニャーちゃん。ニャーちゃんの セリフは「ひとりごと」と「つぎに する ことの ガイド」（2.1）
  lines: {
    greetDaily:  'にゃっほー！ きょうも おりょうり する ニャー！',
    greetAgain:  ['おかえり！ また いっしょに つくろう ニャー', 'にゃっほー！ キッチンに きた ニャー！'],
    content:     ['なにを つくろう ニャー？', 'ニューちゃんに おいしいの つくって あげる ニャー！', 'エプロン、 きもちが ひきしまる ニャー', 'いい においが すると しあわせ ニャー〜'],
    pet:         ['ゴロゴロ ニャー…', 'きもちいい ニャー〜', 'うふふ、 くすぐったい ニャー'],
    cookHint:    'したの フライパンを おして ニャー！',
    fromOsewa:   'キッチンに きた！ おりょうり する ニャー！',
    acceptRequest: 'まかせて ニャー！',
    comingSoon:  'もうすこし まってね。 いま じゅんびちゅう ニャー！',

    // おりょうり（js/screens/cook.js・js/steps.js）
    pickRecipe:  'なにを つくる ニャー？',
    gatherIntro: 'ざいりょうを あつめる ニャー！',
    gatherHint:  'れいぞうこと たなから だす ニャー',
    gatherWrong: 'それは こんど つかう ニャー',
    gatherDone:  'ぜんぶ そろった ニャー！',
    scoopIntro:  'ごはんを よそう ニャー！',
    fillingIntro: 'なかの ぐは どれに する ニャー？',
    shapeIntro:  'ぎゅっ ぎゅっと にぎる ニャー！',
    wrapIntro:   'のりを まく ニャー！',
    spreadIntro: 'パンに バターを ぬる ニャー！',
    fillIntro:   'すきな ぐを はさむ ニャー！',
    readyCheck:  'できたら チェックを おして ニャー',
    cutIntro:    'てんせんに そって きる ニャー！',
    nekoNoTe:    'きるときは ねこの て ニャー！',
    safetyKnife: 'ほんとうの ほうちょうは、 おとなの ひとと いっしょに つかう ニャー！',
    safetyFire:  'ほんとうの ひは、 おとなの ひとと いっしょに つかう ニャー！',
    crackIntro:  'たまごを こつん ニャー！',
    mixIntro:    'ぐるぐる まぜまぜ ニャー〜',
    fryIntro:    'コンロの つまみを おして ニャー！',
    frySizzle:   'ジュージュー… いい におい ニャー〜',
    fryReady:    'いい におい！ いまが ちょうどいい ニャー！',
    flipIntro:   'えいっと ひっくりかえす ニャー！',
    flipDone:    'くるっ！ じょうず ニャー！',
    cheer:       ['いいかんじ ニャー！', 'じょうず ニャー！', 'その ちょうし ニャー！'],
    stepDone:    ['できた ニャー！', 'ばっちり ニャー！'],
    taste:       'ちょっと あじみ… ぺろり！ おいしい ニャー！',
    decoIntro:   'すきな ものを のせて かざる ニャー！',
    sauceIntro:  'ソースで おえかき も できる ニャー！',
    decoClear:   'きれいに ふいた ニャー',
    decoDone:    'できた ニャー！',
    carry:       'ニューちゃんの ところへ はこぶ ニャー！',
    serve:       'めしあがれ ニャー！',
    quitAsk:     'おりょうり、 やめる ニャー？',

    limit:       'きょうは ここまで。 また あした ニャー',
    bye:         'また いっしょに つくろう ニャー！',

    stickerGet:  'シールを もらった ニャー！',
    unlockRecipe: 'あたらしい レシピを おぼえた ニャー！',
    giftRecipe:  'プレゼントが とどいた ニャー！',
    dailyHeart:  'きょうの ごあいさつ ニャー'
  }
};

// キャラクターごとの 設定（ニューちゃんは js/character_nyu.js）
G.CHARACTERS = G.CHARACTERS || {};
G.CHARACTERS.nya = G.CHARACTER;
