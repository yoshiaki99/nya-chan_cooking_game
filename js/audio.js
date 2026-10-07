/* 音（Web Audio で合成。音のファイルは使わない） */
window.G = window.G || {};

G.Sound = (function () {
  let ctx = null, master, bgmBus, sfxBus, voiceBus, noiseBuf = null;
  const vol = { bgm: 0.6, sfx: 0.8 };
  let ducked = false;

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function m(name) { // 'C#4' → MIDI
    const r = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    let n = NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
    return 12 * (parseInt(r[3], 10) + 1) + n;
  }
  const mtof = (x) => 440 * Math.pow(2, (x - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* なし */ }
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 20; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    bgmBus = ctx.createGain(); bgmBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    voiceBus = ctx.createGain(); voiceBus.connect(master); // 録音した声（js/voice.js）
    applyVol();
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });
  }

  function applyVol() {
    if (!ctx) return;
    bgmBus.gain.setTargetAtTime(vol.bgm * 0.5 * (ducked ? 0.35 : 1), ctx.currentTime, 0.15);
    sfxBus.gain.setTargetAtTime(vol.sfx, ctx.currentTime, 0.02);
  }
  function setVolume(bgm, sfx) { vol.bgm = bgm; vol.sfx = sfx; applyVol(); }
  function duck(on) { ducked = on; applyVol(); }

  function noise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function env(g, t, peak, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function tone(o) {
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.dur));
    const g = ctx.createGain();
    env(g, t, o.vol || 0.2, o.attack || 0.006, o.dur);
    osc.connect(g); g.connect(o.dest || sfxBus);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }

  function noiseHit(o) {
    const t = ctx.currentTime + (o.at || 0);
    const s = ctx.createBufferSource(); s.buffer = noise();
    const f = ctx.createBiquadFilter(); f.type = o.ftype || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1500, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    env(g, t, o.vol || 0.2, o.attack || 0.005, o.dur);
    s.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + o.dur + 0.05);
  }

  /* ---- 楽器 ---- */
  function piano(midi, t, dur = 0.8, v = 0.3, dest = sfxBus) {
    const f = mtof(midi);
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(5000, f * 5);
    g.connect(lp); lp.connect(dest);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(v * 0.4, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
    [[1, 'triangle', 1], [2, 'sine', 0.3], [3, 'sine', 0.08]].forEach(([mul, type, amp]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.8);
    });
  }
  function musicBox(midi, t, dur = 1.2, v = 0.18, dest = sfxBus) {
    const f = mtof(midi);
    [[1, 1, 1.4], [4, 0.12, 0.4], [2, 0.18, 0.9]].forEach(([mul, amp, d]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const g = ctx.createGain(); env(g, t, v * amp, 0.004, d * Math.max(1, dur));
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + d * Math.max(1, dur) + 0.05);
    });
  }
  function softBass(midi, t, dur, v, dest) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(midi);
    const g = ctx.createGain(); env(g, t, v, 0.02, dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }


  /* ---- 効果音 ---- */
  const sfx = {
    tap: () => tone({ f: 620, f2: 940, dur: 0.09, vol: 0.16 }),
    press: () => { tone({ f: 523, f2: 784, dur: 0.1, vol: 0.18 }); tone({ type: 'triangle', f: 1046, dur: 0.12, vol: 0.05, at: 0.03 }); },
    back: () => tone({ f: 700, f2: 420, dur: 0.14, vol: 0.15 }),
    soft: () => tone({ f: 440, f2: 520, dur: 0.12, vol: 0.1 }),
    heart: () => { tone({ f: 1318, dur: 0.25, vol: 0.09 }); tone({ f: 1760, dur: 0.35, vol: 0.09, at: 0.08 }); },
    sparkle: () => [2093, 2637, 3136, 4186].forEach((f, i) => tone({ f, dur: 0.4, vol: 0.05, at: i * 0.06 })),
    chime: () => [m('C6'), m('E6'), m('G6')].forEach((n, i) => musicBox(n, ctx.currentTime + i * 0.09, 0.8, 0.16)),
    fanfare: () => { [m('C5'), m('E5'), m('G5'), m('C6')].forEach((n, i) => piano(n, ctx.currentTime + i * 0.13, 0.5, 0.22)); piano(m('E6'), ctx.currentTime + 0.55, 1.2, 0.2); setTimeout(() => sfx.sparkle(), 600); },
    purr: () => {
      const t = ctx.currentTime, dur = 1.3;
      const s = ctx.createBufferSource(); s.buffer = noise();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      const am = ctx.createGain(); am.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 23;
      const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.15); g.gain.setValueAtTime(0.9, t + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(lp); lp.connect(am); am.connect(g); g.connect(sfxBus);
      s.start(t); lfo.start(t); s.stop(t + dur); lfo.stop(t + dur);
    },
    meow: () => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(560, t); o.frequency.linearRampToValueAtTime(860, t + 0.14); o.frequency.linearRampToValueAtTime(620, t + 0.42);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(2200, t + 0.15); f.frequency.linearRampToValueAtTime(1000, t + 0.42);
      const g = ctx.createGain(); env(g, t, 0.07, 0.04, 0.48);
      o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.5);
      tone({ f: 700, f2: 650, dur: 0.45, vol: 0.05, attack: 0.04 });
    },
    munch: () => [0, 0.13, 0.26].forEach(at => noiseHit({ at, f: 1600 + Math.random() * 600, q: 1.4, dur: 0.07, vol: 0.28 })),
    bubble: () => tone({ f: 300 + Math.random() * 200, f2: 1100 + Math.random() * 400, dur: 0.08, vol: 0.1 }),
    popBubble: () => tone({ f: 1200 + Math.random() * 300, f2: 500, dur: 0.05, vol: 0.07 }),
    swish: () => noiseHit({ f: 600, f2: 2600, q: 0.8, dur: 0.28, vol: 0.12, attack: 0.05 }),
    yawn: () => { tone({ type: 'triangle', f: 540, f2: 300, dur: 0.9, vol: 0.06, attack: 0.15 }); },
    hop: () => tone({ f: 320, f2: 640, dur: 0.14, vol: 0.12 }),
    land: () => tone({ f: 260, f2: 160, dur: 0.1, vol: 0.12 }),
    roll: () => { noiseHit({ ftype: 'lowpass', f: 380, dur: 0.7, vol: 0.18, attack: 0.05 }); tone({ f: 120, f2: 90, dur: 0.6, vol: 0.06 }); },
    whoosh: () => noiseHit({ f: 400, f2: 1800, q: 0.7, dur: 0.35, vol: 0.1, attack: 0.08 }),
    flutter: () => [0, 0.07, 0.14].forEach(at => noiseHit({ at, f: 2400, q: 2, dur: 0.05, vol: 0.06 })),
    lock: () => { tone({ f: 330, dur: 0.12, vol: 0.12 }); tone({ f: 330, dur: 0.12, vol: 0.1, at: 0.14 }); },
    lightsOff: () => tone({ type: 'triangle', f: 660, f2: 330, dur: 0.6, vol: 0.06, attack: 0.05 }),
    wake: () => [m('G5'), m('C6'), m('E6'), m('G6')].forEach((n, i) => musicBox(n, ctx.currentTime + i * 0.12, 0.8, 0.16)),
    // あそぶ（ねこじゃらし・ネズミの おもちゃ・おえかき・しゃしん）・おふろの おもちゃ
    squeak: () => { tone({ type: 'triangle', f: 1900, f2: 2600, dur: 0.07, vol: 0.07 }); tone({ type: 'triangle', f: 2200, f2: 3000, dur: 0.06, vol: 0.06, at: 0.09 }); },
    pounce: () => { tone({ f: 380, f2: 900, dur: 0.16, vol: 0.12 }); noiseHit({ at: 0.14, f: 1800, q: 1.2, dur: 0.08, vol: 0.12 }); },
    scribble: () => noiseHit({ f: 2600 + Math.random() * 1200, q: 3, dur: 0.06, vol: 0.05 }),
    stamp: () => { tone({ f: 260, f2: 180, dur: 0.08, vol: 0.14 }); tone({ f: 1200, f2: 1600, dur: 0.1, vol: 0.05, at: 0.05 }); },
    pour: () => { noiseHit({ f: 900, f2: 1700, q: 1.6, dur: 1.4, vol: 0.09, attack: 0.15 }); noiseHit({ ftype: 'lowpass', f: 500, dur: 1.4, vol: 0.06, attack: 0.2 }); },
    plop: () => { tone({ f: 900, f2: 300, dur: 0.12, vol: 0.12 }); tone({ f: 1500, f2: 2400, dur: 0.08, vol: 0.05, at: 0.08 }); },
    shutter: () => { noiseHit({ f: 3000, q: 0.8, dur: 0.05, vol: 0.22 }); noiseHit({ at: 0.09, f: 2200, q: 0.8, dur: 0.06, vol: 0.18 }); tone({ f: 1800, f2: 1200, dur: 0.06, vol: 0.05 }); },
    // おでかけ（ドア・はなび・たいこ・すず・おばけ）
    door: () => { tone({ type: 'triangle', f: 330, f2: 300, dur: 0.1, vol: 0.12 }); [m('E5'), m('G5'), m('C6')].forEach((n, i) => musicBox(n, ctx.currentTime + 0.12 + i * 0.09, 0.9, 0.14)); },
    whistle: () => tone({ f: 500, f2: 1500, dur: 0.6, vol: 0.04, attack: 0.08 }),
    boom: () => {
      noiseHit({ ftype: 'lowpass', f: 420, dur: 0.7, vol: 0.32, attack: 0.008 });
      tone({ f: 96, f2: 48, dur: 0.5, vol: 0.14 });
      for (let i = 0; i < 7; i++) noiseHit({ at: 0.18 + Math.random() * 0.6, f: 3200 + Math.random() * 2400, q: 2, dur: 0.04, vol: 0.05 });
    },
    don: () => { tone({ f: 120, f2: 66, dur: 0.4, vol: 0.34, attack: 0.004 }); noiseHit({ ftype: 'lowpass', f: 260, dur: 0.14, vol: 0.22 }); },
    jingle: () => [0, 0.09, 0.18, 0.27, 0.4, 0.49].forEach((at, i) => { tone({ f: [2349, 2637, 2794][i % 3], dur: 0.3, vol: 0.035, at }); noiseHit({ at, f: 7000, q: 3, dur: 0.05, vol: 0.03 }); }),
    boo: () => { tone({ type: 'triangle', f: 520, f2: 300, dur: 0.7, vol: 0.12, attack: 0.06 }); tone({ type: 'sine', f: 780, f2: 450, dur: 0.6, vol: 0.04, attack: 0.08, at: 0.05 }); },
    // おりょうり（とんとん・ぱかっ・まぜまぜ・チン！・くるっ）
    chop: () => { noiseHit({ f: 1400, q: 1.2, dur: 0.05, vol: 0.3 }); tone({ f: 220, f2: 140, dur: 0.07, vol: 0.12 }); },
    crack: () => { noiseHit({ f: 2600, q: 2, dur: 0.04, vol: 0.25 }); tone({ f: 900, f2: 500, dur: 0.06, vol: 0.06, at: 0.03 }); },
    plopEgg: () => { tone({ f: 500, f2: 200, dur: 0.16, vol: 0.12 }); },
    stir: () => noiseHit({ f: 700 + Math.random() * 300, f2: 1300, q: 1.5, dur: 0.18, vol: 0.06, attack: 0.04 }),
    squish: () => { tone({ type: 'triangle', f: 260, f2: 200, dur: 0.12, vol: 0.1 }); noiseHit({ ftype: 'lowpass', f: 700, dur: 0.1, vol: 0.08 }); },
    spread: () => noiseHit({ f: 1800, f2: 1200, q: 1, dur: 0.16, vol: 0.05, attack: 0.04 }),
    click: () => { tone({ f: 1500, dur: 0.03, vol: 0.12 }); tone({ f: 900, dur: 0.04, vol: 0.08, at: 0.05 }); },
    ding: () => { musicBox(m('E6'), ctx.currentTime, 1.4, 0.22); musicBox(m('C6'), ctx.currentTime + 0.18, 1.6, 0.18); },
    flip: () => { noiseHit({ f: 500, f2: 2000, q: 0.8, dur: 0.22, vol: 0.12, attack: 0.03 }); tone({ f: 400, f2: 800, dur: 0.18, vol: 0.06 }); },
    place: () => tone({ f: 700, f2: 1000, dur: 0.07, vol: 0.12 })
  };

  function play(name) {
    if (!ctx || ctx.state !== 'running' || vol.sfx <= 0) return;
    try { sfx[name] && sfx[name](); } catch (e) { /* 音が出なくても続ける */ }
  }

  /* フライパンの ジュージュー（つけっぱなし） */
  let sizzleNode = null;
  function sizzle(on) {
    if (!ctx) return;
    if (on && !sizzleNode && vol.sfx > 0) {
      const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 3800; hp.Q.value = 0.6;
      const am = ctx.createGain(); am.gain.value = 0.6;
      const lfo = ctx.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 9;
      const lg = ctx.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.4);
      s.connect(hp); hp.connect(am); am.connect(g); g.connect(sfxBus); s.start(); lfo.start();
      sizzleNode = { s, g, lfo };
    } else if (!on && sizzleNode) {
      const { s, g, lfo } = sizzleNode; sizzleNode = null;
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      s.stop(ctx.currentTime + 0.8); lfo.stop(ctx.currentTime + 0.8);
    }
  }

  let showerNode = null;
  function shower(on) {
    if (!ctx) return;
    if (on && !showerNode) {
      const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.3);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfxBus); s.start();
      showerNode = { s, g };
    } else if (!on && showerNode) {
      const { s, g } = showerNode; showerNode = null;
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      s.stop(ctx.currentTime + 0.6);
    }
  }

  /* ---- BGM ---- */
  const CH = {
    C: [m('C3'), [m('G3'), m('C4'), m('E4')]], G7: [m('G2'), [m('F3'), m('B3'), m('D4')]],
    F: [m('F2'), [m('A3'), m('C4'), m('F4')]], Am: [m('A2'), [m('A3'), m('C4'), m('E4')]],
    Dm: [m('D3'), [m('F3'), m('A3'), m('D4')]]
  };
  /* おへやの 曲：あかるく はずむ 4びょうし（ニャーちゃんの おうち。要件定義書 7.2） */
  function hop() {
    const bars = [
      [['G4', .5], ['C5', .5], ['E5', .5], ['G5', .5], ['E5', 1], ['C5', 1]],
      [['D5', .5], ['E5', .5], ['F5', .5], ['D5', .5], ['B4', 1], ['G4', 1]],
      [['A4', .5], ['C5', .5], ['E5', .5], ['A5', .5], ['G5', 1], ['E5', 1]],
      [['F5', .5], ['E5', .5], ['D5', .5], ['C5', .5], ['D5', 2]],
      [['A4', .5], ['C5', .5], ['F5', .5], ['A5', .5], ['G5', 1], ['F5', 1]],
      [['E5', .5], ['G5', .5], ['E5', .5], ['C5', .5], ['G4', 2]],
      [['D5', .5], ['F5', .5], ['A5', .5], ['F5', .5], ['B4', .5], ['D5', .5], ['G5', 1]],
      [['C5', 1], ['G4', .5], ['E4', .5], ['C5', 2]]
    ];
    const second = bars.slice(0, 3).concat([[['F5', .5], ['E5', .5], ['D5', .5], ['B4', .5], ['C5', 2]]], bars.slice(4, 7),
      [[['C5', .5], ['E5', .5], ['G5', .5], ['E5', .5], ['C6', 2]]]);
    const chords = ['C', 'G7', 'Am', 'G7', 'F', 'C', 'G7', 'C', 'C', 'G7', 'Am', 'G7', 'F', 'C', 'G7', 'C'];
    const ev = [];
    let b = 0;
    bars.concat(second).forEach(bar => bar.forEach(([n, d]) => {
      ev.push({ b, d: d * 0.72, n: m(n), v: 0.15, i: 'p' }); // すこし みじかく（はずむように）
      b += d;
    }));
    chords.forEach((c, bar) => {
      const [bass, tri] = CH[c];
      [0, 2].forEach(k => ev.push({ b: bar * 4 + k, d: 0.8, n: k ? bass + 7 : bass, v: 0.11, i: 'b' }));
      [1, 3].forEach(k => tri.forEach(n => ev.push({ b: bar * 4 + k, d: 0.32, n, v: 0.03, i: 'p' })));
      [1.5, 3.5].forEach(k => tri.forEach(n => ev.push({ b: bar * 4 + k, d: 0.22, n: n + 12, v: 0.016, i: 'm' })));
    });
    ev.sort((a, c) => a.b - c.b);
    return { ev, len: chords.length * 4, bpm: 132 };
  }
  function lullaby() {
    const A = [['C5', 1], ['C5', 1], ['C5', 1], ['D5', 1], ['E5', 2], ['D5', 2], ['C5', 1], ['E5', 1], ['D5', 1], ['D5', 1], ['C5', 4]];
    const B = [['D5', 1], ['D5', 1], ['D5', 1], ['D5', 1], ['A4', 2], ['A4', 2], ['D5', 1], ['C5', 1], ['B4', 1], ['A4', 1], ['G4', 4]];
    const mel = [].concat(A, A, B, A);
    const bass = ['C3', 'G2', 'C3', 'C3', 'C3', 'G2', 'C3', 'C3', 'G2', 'D3', 'D3', 'G2', 'C3', 'G2', 'C3', 'C3'];
    const ev = [];
    let b = 0;
    mel.forEach(([n, d]) => { ev.push({ b, d, n: m(n), v: 0.2, i: 'm' }); b += d; });
    bass.forEach((n, bar) => ev.push({ b: bar * 4, d: 3.5, n: m(n), v: 0.07, i: 'b' }));
    ev.sort((a, c) => a.b - c.b);
    return { ev, len: 64, bpm: 84 };
  }

  /* ---- おでかけの 曲（どれも この ゲームの ための メロディ） ---- */
  // ふしを ならべて ev に たす。k = 音の ながさの わりあい（みじかいと はずむ）、up = 半音 いくつ 上で ならすか。かえすもの：ぜんぶの 拍
  function melody(ev, notes, v, inst, k = 0.75, up = 0) {
    let b = 0;
    notes.forEach(([n, d]) => { ev.push({ b, d: d * k, n: m(n) + up, v, i: inst }); b += d; });
    return b;
  }
  /* おまつり：にぎやかな ヨナぬきの ふし ＋ たいこの ような ベース */
  function matsuri() {
    const mel = [
      ['A4', .5], ['B4', .5], ['D5', 1], ['B4', .5], ['A4', .5], ['G4', 1],
      ['A4', .5], ['B4', .5], ['A4', .5], ['G4', .5], ['E4', 2],
      ['G4', .5], ['A4', .5], ['B4', 1], ['D5', .5], ['E5', .5], ['D5', 1],
      ['B4', .5], ['A4', .5], ['G4', .5], ['A4', .5], ['B4', 2],
      ['D5', .5], ['E5', .5], ['D5', .5], ['B4', .5], ['A4', 1], ['B4', 1],
      ['G4', .5], ['A4', .5], ['B4', .5], ['A4', .5], ['G4', 1], ['E4', 1],
      ['G4', .5], ['A4', .5], ['B4', .5], ['D5', .5], ['B4', .5], ['A4', .5], ['G4', 1],
      ['A4', 1], ['G4', .5], ['E4', .5], ['D4', 2]
    ];
    const ev = [];
    const len = melody(ev, mel, 0.15, 'p', 0.7);
    melody(ev, mel, 0.035, 'm', 0.5, 12); // ふえの ように 上で かさねる
    ['D3', 'E3', 'G2', 'D3', 'G2', 'E3', 'G2', 'D3'].forEach((n, bar) => {
      [0, 2].forEach(k => ev.push({ b: bar * 4 + k, d: 0.5, n: m(n), v: 0.15, i: 'b' }));
      ev.push({ b: bar * 4 + 3.5, d: 0.25, n: m(n), v: 0.08, i: 'b' }); // どん・どん・どどん
    });
    ev.sort((a, c) => a.b - c.b);
    return { ev, len, bpm: 124 };
  }
  /* ハロウィン：ちょっと ふしぎで かわいい、ぽつぽつ みじかい ふし ＋ ずんちゃ の ベース */
  function halloween() {
    const mel = [
      ['A4', .5], ['C5', .5], ['E5', .5], ['F5', .5], ['E5', 1], ['C5', 1],
      ['D5', .5], ['F5', .5], ['A5', .5], ['F5', .5], ['E5', 2],
      ['C5', .5], ['E5', .5], ['G5', .5], ['E5', .5], ['D5', 1], ['B4', 1],
      ['C5', .5], ['B4', .5], ['A4', .5], ['G#4', .5], ['A4', 2],
      ['A4', .5], ['C5', .5], ['E5', .5], ['F5', .5], ['E5', 1], ['C5', 1],
      ['D5', .5], ['F5', .5], ['A5', .5], ['G5', .5], ['F5', 1], ['E5', 1],
      ['D5', .5], ['C5', .5], ['B4', .5], ['C5', .5], ['D5', .5], ['E5', .5], ['G#4', 1],
      ['A4', 1], ['E4', 1], ['A4', 2]
    ];
    const ev = [];
    const len = melody(ev, mel, 0.14, 'p', 0.45);
    ['A2', 'D3', 'C3', 'E2', 'A2', 'D3', 'E2', 'A2'].forEach((n, bar) =>
      [0, 1, 2, 3].forEach(k => ev.push({ b: bar * 4 + k, d: 0.35, n: m(n) + (k % 2 ? 7 : 0), v: k % 2 ? 0.07 : 0.12, i: 'b' })));
    ev.sort((a, c) => a.b - c.b);
    return { ev, len, bpm: 112 };
  }
  /* クリスマス：オルゴールの ワルツ（3びょうし） */
  function xmas() {
    const mel = [
      ['E5', 1], ['G5', 1], ['E5', 1], ['D5', 2], ['C5', 1], ['D5', 1], ['E5', 1], ['G5', 1], ['A5', 3],
      ['G5', 1], ['A5', 1], ['G5', 1], ['E5', 2], ['C5', 1], ['D5', 1], ['E5', 1], ['D5', 1], ['G4', 3],
      ['E5', 1], ['G5', 1], ['E5', 1], ['D5', 2], ['C5', 1], ['D5', 1], ['E5', 1], ['A5', 1], ['G5', 3],
      ['A5', 1], ['G5', 1], ['E5', 1], ['F5', 2], ['D5', 1], ['E5', 1], ['D5', 1], ['B4', 1], ['C5', 3]
    ];
    const ev = [];
    const len = melody(ev, mel, 0.2, 'm', 1);
    ['C', 'G7', 'C', 'F', 'C', 'Am', 'G7', 'G7', 'C', 'G7', 'Dm', 'C', 'Am', 'Dm', 'G7', 'C'].forEach((c, bar) => {
      const [bass, tri] = CH[c];
      ev.push({ b: bar * 3, d: 1.6, n: bass, v: 0.1, i: 'b' });
      [1, 2].forEach(k => tri.forEach(n => ev.push({ b: bar * 3 + k, d: 0.4, n, v: 0.028, i: 'p' })));
    });
    ev.sort((a, c) => a.b - c.b);
    return { ev, len, bpm: 138 };
  }
  const SONGS = { room: hop, lullaby, matsuri, halloween, xmas };

  let bgm = null;
  function playBgm(name) {
    if (!ctx) return;
    if (bgm && bgm.name === name) return;
    stopBgm();
    if (!name || !SONGS[name]) return;
    const song = SONGS[name]();
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
    g.connect(bgmBus);
    const cur = { name, song, g, start: ctx.currentTime + 0.15, idx: 0, loop: 0, timer: null };
    const spb = 60 / song.bpm;
    cur.timer = setInterval(() => {
      if (ctx.state !== 'running') return;
      const horizon = ctx.currentTime + 0.35;
      for (; ;) {
        const e = song.ev[cur.idx];
        const t = cur.start + (cur.loop * song.len + e.b) * spb;
        if (t > horizon) break;
        if (t > ctx.currentTime - 0.05) {
          if (e.i === 'p') piano(e.n, t, e.d * spb, e.v, g);
          else if (e.i === 'm') musicBox(e.n, t, e.d * spb, e.v, g);
          else softBass(e.n, t, e.d * spb, e.v, g);
        }
        cur.idx++;
        if (cur.idx >= song.ev.length) { cur.idx = 0; cur.loop++; }
      }
    }, 80);
    bgm = cur;
  }
  function stopBgm() {
    if (!bgm) return;
    const cur = bgm; bgm = null;
    clearInterval(cur.timer);
    if (ctx) {
      cur.g.gain.cancelScheduledValues(ctx.currentTime);
      cur.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      setTimeout(() => cur.g.disconnect(), 2500);
    }
  }

  return {
    init, play, shower, sizzle, playBgm, stopBgm, setVolume, duck, m,
    ready: () => !!ctx && ctx.state === 'running',
    context: () => ctx, voiceOut: () => voiceBus
  };
})();
