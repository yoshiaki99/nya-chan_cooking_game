/* 読み上げに使う声のファイル（tools/make_voice.py が自動で作る。手で直さない）
 * 文がこの表とぴったり同じとき（空白のちがいは気にしない）に、この音声を使う。無い文はブラウザが読み上げる。
 * 「nyu:」で はじまるものは ニューちゃんの 声。
 * いまは おせわゲームと 文が まったく 同じ セリフの 声だけ（要件定義書 7.5 N-51）。 */
window.G = window.G || {};

G.VOICE_CLIPS = {
  "ゴロゴロ ニャー…": 'assets/voice/m_pet_1.m4a',
  "きもちいい ニャー〜": 'assets/voice/m_pet_2.m4a',
  "うふふ、 くすぐったい ニャー": 'assets/voice/m_pet_3.m4a',
  "きょうは ここまで。 また あした ニャー": 'assets/voice/m_limit.m4a',
  "シールを もらった ニャー！": 'assets/voice/m_stickerGet.m4a',
  "きょうの ごあいさつ ニャー": 'assets/voice/m_dailyHeart.m4a',
  "nyu:えへへ、 くすぐったい ニャー": 'assets/voice/n_pet_1.m4a',
  "nyu:きもちいい ニャー〜": 'assets/voice/n_pet_2.m4a',
  "nyu:もっと なでて ニャー！": 'assets/voice/n_pet_3.m4a',
  "ぜんぶ あつめたよ！": 'assets/voice/g_stickers_all.m4a'
};
