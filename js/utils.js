window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  G.W = 480;
  G.H = 800;

  const U = (G.utils = {});

  U.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (lo, hi) => lo + Math.random() * (hi - lo);
  U.randInt = (lo, hi) => Math.floor(lo + Math.random() * (hi - lo + 1));
  U.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  U.chance = (p) => Math.random() < p;
  U.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);

  /** Frame-rate independent easing factor. */
  U.smooth = (rate, dt) => 1 - Math.exp(-rate * dt);

  U.approach = (value, target, maxDelta) => {
    if (value < target) return Math.min(value + maxDelta, target);
    if (value > target) return Math.max(value - maxDelta, target);
    return target;
  };

  U.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  U.easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  /** Deterministic 0..1 hash, used for hand-drawn line wobble. */
  U.hash = function (n) {
    const s = Math.sin(n * 127.1) * 43758.5453123;
    return s - Math.floor(s);
  };

  U.overlap = (ax, ay, aw, ah, bx, by, bw, bh) =>
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  U.storage = {
    get(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        /* private mode: high score simply won't persist */
      }
    }
  };

  G.BEST_KEY = 'goup.best.v1';
})(window.GOUP);
