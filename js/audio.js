window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  let ctx = null;
  let master = null;
  let muted = false;
  let failed = false;

  function ensure() {
    if (ctx || failed) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      failed = true;
      return null;
    }
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.26;
      master.connect(ctx.destination);
    } catch (err) {
      failed = true;
      ctx = null;
    }
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
  }

  function tone(opts) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    const freq = opts.freq || 440;
    const to = opts.to || null;
    const dur = opts.dur || 0.12;
    const vol = opts.vol == null ? 0.6 : opts.vol;
    const delay = opts.delay || 0;
    const t0 = c.currentTime + delay;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noise(opts) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    const dur = opts.dur || 0.1;
    const vol = opts.vol == null ? 0.3 : opts.vol;
    const t0 = c.currentTime + (opts.delay || 0);
    const frames = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, frames, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }

    const src = c.createBufferSource();
    src.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = opts.freq || 1200;
    filter.Q.value = opts.q || 0.9;

    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  const sounds = {
    jump() {
      tone({ freq: 300, to: 560, dur: 0.1, vol: 0.5, type: 'sine' });
    },
    land() {
      noise({ dur: 0.07, vol: 0.16, freq: 900 });
      tone({ freq: 190, to: 120, dur: 0.07, vol: 0.22, type: 'triangle' });
    },
    coin() {
      tone({ freq: 1046, dur: 0.06, vol: 0.28, type: 'square' });
      tone({ freq: 1568, dur: 0.09, vol: 0.24, type: 'square', delay: 0.05 });
    },
    spring() {
      tone({ freq: 380, to: 1250, dur: 0.18, vol: 0.5, type: 'square' });
    },
    jet() {
      noise({ dur: 0.18, vol: 0.12, freq: 700, q: 0.5 });
    },
    powerup() {
      [523, 659, 784, 1046].forEach((f, i) => {
        tone({ freq: f, dur: 0.09, vol: 0.26, type: 'triangle', delay: i * 0.055 });
      });
    },
    shieldHit() {
      tone({ freq: 320, to: 90, dur: 0.28, vol: 0.4, type: 'sawtooth' });
    },
    death() {
      tone({ freq: 430, to: 70, dur: 0.6, vol: 0.45, type: 'sawtooth' });
    },
    start() {
      [392, 523, 659].forEach((f, i) => {
        tone({ freq: f, dur: 0.11, vol: 0.3, type: 'triangle', delay: i * 0.07 });
      });
    },
    best() {
      [659, 784, 988, 1319].forEach((f, i) => {
        tone({ freq: f, dur: 0.14, vol: 0.3, type: 'triangle', delay: i * 0.09 });
      });
    },
    milestone() {
      [880, 1174].forEach((f, i) => {
        tone({ freq: f, dur: 0.1, vol: 0.22, type: 'sine', delay: i * 0.07 });
      });
    }
  };

  G.audio = {
    unlock,
    sfx(name) {
      const fn = sounds[name];
      if (fn) fn();
    },
    toggleMute() {
      muted = !muted;
      if (!muted) unlock();
      return muted;
    },
    isMuted() {
      return muted;
    }
  };
})(window.GOUP);
