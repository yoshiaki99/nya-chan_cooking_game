/* 読み上げ（N-02：文字はすべて音声でも読み上げる）
 * 録音した声（assets/voice、一覧は js/voice_clips.js）がある文はそれを鳴らし、無い文はブラウザの読み上げ機能で読む */
window.G = window.G || {};

G.Voice = (function () {
  const synth = window.speechSynthesis;
  let voice = null, enabled = true, volume = 1, token = 0;

  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices().filter(v => /^ja(-|_|$)/i.test(v.lang));
    if (!vs.length) return;
    const prefer = ['Kyoko', 'O-Ren', 'Siri', 'Nanami', 'Google 日本語', 'Haruka', 'Ayumi'];
    voice = prefer.map(n => vs.find(v => v.name.indexOf(n) >= 0)).find(Boolean) || vs[0];
  }
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
  }

  function clean(text) {
    return String(text).replace(/〜/g, 'ー').replace(/[♪★☆]/g, '').replace(/…/g, '、').trim();
  }

  /* ---- 録音した声 ---- */
  // 空白のちがいは気にせずに、文と音声ファイルを対応させる
  const norm = (text) => String(text).replace(/\s+/g, '').replace(/〜/g, 'ー');
  const clips = {};
  Object.keys(G.VOICE_CLIPS || {}).forEach(k => { clips[norm(k)] = G.VOICE_CLIPS[k]; });
  const decoded = new Map(); // ファイル → 音のデータ（最近使ったものだけ取っておく）
  const KEEP = 24;
  let current = null; // いま鳴っている録音

  function load(src) {
    let p = decoded.get(src);
    if (p) { decoded.delete(src); decoded.set(src, p); return p; }
    const ctx = G.Sound.context();
    p = fetch(src)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(buf => new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej)));
    p.catch(() => decoded.delete(src)); // 読めなかったものは次にもう一度ためす
    decoded.set(src, p);
    while (decoded.size > KEEP) decoded.delete(decoded.keys().next().value);
    return p;
  }

  function playClip(src, my) {
    return load(src).then(buf => new Promise((resolve) => {
      if (my !== token) return resolve();
      const ctx = G.Sound.context();
      const s = ctx.createBufferSource();
      const g = ctx.createGain();
      s.buffer = buf; g.gain.value = volume;
      s.connect(g); g.connect(G.Sound.voiceOut());
      let done = false;
      const fin = () => {
        if (done) return; done = true;
        if (current && current.s === s) current = null;
        if (my === token) G.Sound.duck(false);
        resolve();
      };
      s.onended = fin;
      setTimeout(fin, buf.duration * 1000 + 1500); // 止まってしまったときの保険（画面を閉じたときなど）
      current = { s, fin };
      G.Sound.duck(true);
      s.start();
    }));
  }

  /* 鳴っている声を止める */
  function halt() {
    if (current) { const c = current; current = null; try { c.s.stop(); } catch (e) { /* なし */ } c.fin(); }
    if (synth && (synth.speaking || synth.pending)) synth.cancel();
  }

  /* iOS では最初の読み上げをタップの中で行う必要がある（録音した声は G.Sound.init で使えるようになる） */
  function unlock() {
    if (!synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* なし */ }
  }

  function synthSpeak(text, who, my, fallbackMs) {
    if (!synth) return new Promise(r => setTimeout(r, fallbackMs));
    return new Promise((resolve) => {
      const go = () => {
        if (my !== token) return resolve();
        const u = new SpeechSynthesisUtterance(clean(text));
        u.lang = 'ja-JP';
        if (voice) u.voice = voice;
        const ch = who === 'chara' ? G.CHARACTER : (G.CHARACTERS && G.CHARACTERS[who]);
        u.pitch = ch ? ch.voicePitch : 1.15;
        u.rate = who === 'chara' ? 1.0 : 1.05;
        u.volume = volume;
        let done = false;
        const fin = () => { if (done) return; done = true; if (my === token) G.Sound.duck(false); resolve(); };
        u.onend = fin; u.onerror = fin;
        setTimeout(fin, fallbackMs + 1500); // 読み上げが止まったときの保険
        G.Sound.duck(true);
        synth.speak(u);
      };
      if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(go, 60); } else go();
    });
  }

  /**
   * 読み上げる。終わったら（または読み上げなしのときは目安の時間で）resolve する
   * who: 'chara'（ニャーちゃんの声）| 'nyu'（ニューちゃんの声）| 'guide'（ボタンの名前など）
   */
  function speak(text, who = 'chara') {
    const my = ++token;
    halt();
    const fallbackMs = 900 + String(text).length * 120;
    if (!enabled || volume <= 0) return new Promise(r => setTimeout(r, fallbackMs));
    // ニューちゃんの声は「nyu:」をつけた文で さがす（ニャーちゃんと 同じ文でも、べつの声で 鳴らすため）
    const src = clips[norm((who === 'nyu' ? 'nyu:' : '') + text)];
    if (src && G.Sound.ready()) {
      // 録音が読めなかったとき（ファイルが無いなど）は、ブラウザの読み上げに切りかえる
      return playClip(src, my).catch(() => (my === token ? synthSpeak(text, who, my, fallbackMs) : undefined));
    }
    return synthSpeak(text, who, my, fallbackMs);
  }

  function stop() { token++; halt(); G.Sound.duck(false); }

  function set(opts) {
    if (opts.enabled != null) enabled = opts.enabled;
    if (opts.volume != null) volume = opts.volume;
    if (!enabled) stop();
  }

  return { speak, stop, unlock, set, available: () => !!synth || Object.keys(clips).length > 0 };
})();
