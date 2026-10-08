window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const KEY = 'goup.progress.v1';

  const RAINBOW = ['#ff6b6b', '#ff9a3c', '#ffd23f', '#8bd450', '#4ecdc4', '#5fb0ee', '#b18bff', '#ff6b9d'];

  /* ------------------------------------------------------------------ *
   * unlockable doodles
   * ------------------------------------------------------------------ */

  const SKINS = [
    { id: 'sprout', name: 'Classic Sprout', tag: 'the original', body: '#93dd55', shade: '#c6f0a2', extras: 'none', free: true },
    { id: 'sky', name: 'Blue Sky', tag: 'head in the clouds', body: '#5fb0ee', shade: '#aedbf8', extras: 'none', req: { totalHeight: 50 } },
    { id: 'lemon', name: 'Lemon Drop', tag: 'sour but cute', body: '#ffd23f', shade: '#fff0a8', extras: 'none', req: { totalCoins: 25 } },
    { id: 'bubble', name: 'Bubblegum', tag: 'sticky fingers', body: '#ff6b9d', shade: '#ffc7db', extras: 'antenna', req: { runs: 3 } },
    { id: 'mint', name: 'Mint Chip', tag: 'extra fresh', body: '#4ecdc4', shade: '#bdf3ef', extras: 'none', req: { totalCoins: 100 } },
    { id: 'grape', name: 'Grape Soda', tag: 'fizzy & fast', body: '#b18bff', shade: '#e0d2ff', extras: 'cap', req: { totalHeight: 250 } },
    { id: 'tangerine', name: 'Tangerine', tag: 'vitamin C', body: '#ff8a5c', shade: '#ffcdb6', extras: 'none', req: { runs: 8 } },
    { id: 'ocean', name: 'Ocean Deep', tag: 'way down below', body: '#3d8bd4', shade: '#a9cdf0', extras: 'cape', req: { totalHeight: 600 } },
    { id: 'cherry', name: 'Cherry Bomb', tag: 'boom!', body: '#e04b5a', shade: '#f8aeb6', extras: 'halo', req: { totalCoins: 400 } },
    { id: 'gold', name: 'Golden Bean', tag: 'money dripping', body: '#ffc93c', shade: '#ffe9a8', extras: 'crown', req: { best: 1500 } },
    { id: 'rainbow', name: 'Rainbow Rd', tag: 'never dull', rainbow: true, body: '#ff6b6b', shade: '#ffffff', extras: 'wings', req: { runs: 20 } },
    { id: 'cosmic', name: 'Cosmic Bean', tag: 'past the stars', body: '#7b5cff', shade: '#cfc4ff', extras: 'halo', star: true, req: { totalHeight: 2000 } }
  ];

  /* ------------------------------------------------------------------ *
   * unlockable papers
   * ------------------------------------------------------------------ */

  const THEMES = [
    {
      id: 'grid', name: 'Grid Paper', tag: 'notebook classic', free: true,
      paper: '#fdf7e6', grid: '#d5e4f5', gridMajor: '#bcd5ee', margin: '#f6d2d2',
      ink: '#3f3a33', cloud: 'rgba(255,255,255,0.92)', cloudLine: '#bcd5ee', note: '#3f3a33'
    },
    {
      id: 'blueprint', name: 'Blueprint', tag: 'night shift',
      paper: '#22315c', grid: '#31447a', gridMajor: '#41589b', margin: '#5b6fb0',
      ink: '#eef3ff', cloud: 'rgba(180,205,255,0.16)', cloudLine: '#6f8ccc', note: '#cfe0ff',
      req: { totalHeight: 400 }
    },
    {
      id: 'rose', name: 'Rose Paper', tag: 'love notes',
      paper: '#fdeef2', grid: '#f7d3de', gridMajor: '#eeb6c9', margin: '#f2b8c6',
      ink: '#4a3740', cloud: 'rgba(255,255,255,0.9)', cloudLine: '#eeb6c9', note: '#4a3740',
      req: { runs: 10 }
    },
    {
      id: 'midnight', name: 'Midnight', tag: 'after hours',
      paper: '#1d2130', grid: '#2b3145', gridMajor: '#3b4459', margin: '#4a5570',
      ink: '#f2f4f8', cloud: 'rgba(255,255,255,0.07)', cloudLine: '#4a5570', note: '#c9d2e4',
      req: { totalCoins: 750 }
    }
  ];

  const REQ_LABEL = {
    totalHeight: (v) => Math.round(v) + 'm climbed',
    totalCoins: (v) => Math.round(v) + ' coins',
    runs: (v) => Math.round(v) + ' runs',
    best: (v) => Math.round(v) + ' pts'
  };

  function defaults() {
    return {
      totalHeight: 0,
      totalCoins: 0,
      runs: 0,
      best: 0,
      skin: 'sprout',
      theme: 'grid',
      unlocked: ['sprout', 'grid']
    };
  }

  const data = defaults();

  function load() {
    const saved = G.utils.storage.get(KEY, null) || {};
    for (const k in saved) {
      if (Object.prototype.hasOwnProperty.call(saved, k)) data[k] = saved[k];
    }
    if (!Array.isArray(data.unlocked)) data.unlocked = ['sprout', 'grid'];
    if (!isUnlocked(data.skin)) data.skin = 'sprout';
    if (!isUnlocked(data.theme)) data.theme = 'grid';
    return data;
  }

  function save() {
    G.utils.storage.set(KEY, data);
  }

  function find(list, id) {
    for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function skin(id) {
    return find(SKINS, id) || SKINS[0];
  }

  function theme(id) {
    return find(THEMES, id) || THEMES[0];
  }

  function isUnlocked(id) {
    return data.unlocked.indexOf(id) !== -1;
  }

  function reqMet(req, src) {
    const d = src || data;
    for (const k in req) if (d[k] < req[k]) return false;
    return true;
  }

  function ratio(req, src) {
    const d = src || data;
    let worst = 1;
    for (const k in req) {
      worst = Math.min(worst, d[k] / req[k]);
    }
    return Math.max(0, Math.min(1, worst));
  }

  function reqText(req) {
    const parts = [];
    for (const k in req) {
      if (parts.indexOf(REQ_LABEL[k](req[k])) === -1) parts.push(REQ_LABEL[k](req[k]));
    }
    return parts.join(' + ');
  }

  /** Human-readable current/target for the tightest requirement. */
  function reqProgress(req, src) {
    const d = src || data;
    let tightest = null;
    for (const k in req) {
      const pct = d[k] / req[k];
      if (!tightest || pct < tightest.pct) tightest = { key: k, pct: pct, have: d[k], need: req[k] };
    }
    return {
      text: Math.min(tightest.need, Math.floor(tightest.have)) + ' / ' + tightest.need + ' ' + short(tightest.key),
      ratio: Math.max(0, Math.min(1, tightest.pct))
    };
  }

  function short(key) {
    return key === 'totalHeight' ? 'm' : key === 'totalCoins' ? 'coins' : key === 'runs' ? 'runs' : 'pts';
  }

  function all() {
    return SKINS.concat(THEMES);
  }

  /** Award anything newly earned. Returns the fresh unlocks. */
  function checkUnlocks() {
    const fresh = [];
    for (const item of all()) {
      if (item.free || isUnlocked(item.id)) continue;
      if (reqMet(item.req)) {
        data.unlocked.push(item.id);
        fresh.push(item);
      }
    }
    if (fresh.length) save();
    return fresh;
  }

  /** Bank a finished run: lifetime stats, high score, unlock checks. */
  function recordRun(heightMeters, coins, score) {
    data.runs++;
    data.totalHeight += Math.max(0, Math.floor(heightMeters));
    data.totalCoins += Math.max(0, Math.floor(coins));
    if (score > data.best) data.best = score;
    save();
    return checkUnlocks();
  }

  /** Stats as they *will* be when the current run ends (for live goals). */
  function projected(runHeight, runCoins, runScore) {
    return {
      totalHeight: data.totalHeight + Math.max(0, Math.floor(runHeight)),
      totalCoins: data.totalCoins + Math.max(0, Math.floor(runCoins)),
      runs: data.runs + 1,
      best: Math.max(data.best, runScore || 0)
    };
  }

  /** Closest unlock still to earn, measured against projected stats. */
  function next(src) {
    const d = src || data;
    let best = null;
    for (const item of all()) {
      if (item.free || isUnlocked(item.id) || !item.req) continue;
      const r = ratio(item.req, d);
      if (!best || r > best.ratio) best = { item: item, ratio: r, kind: SKINS.indexOf(item) !== -1 ? 'skin' : 'theme' };
    }
    return best;
  }

  function equipSkin(id) {
    if (!isUnlocked(id) || data.skin === id) return false;
    data.skin = id;
    save();
    return true;
  }

  function equipTheme(id) {
    if (!isUnlocked(id) || data.theme === id) return false;
    data.theme = id;
    save();
    G.art.applyTheme(theme(id));
    return true;
  }

  G.skins = {
    SKINS: SKINS,
    THEMES: THEMES,
    RAINBOW: RAINBOW,
    skin: skin,
    theme: theme,
    isUnlocked: isUnlocked,
    reqText: reqText,
    reqProgress: reqProgress
  };

  G.progress = {
    data: data,
    load: load,
    save: save,
    isUnlocked: isUnlocked,
    reqText: reqText,
    reqProgress: reqProgress,
    recordRun: recordRun,
    projected: projected,
    next: next,
    equipSkin: equipSkin,
    equipTheme: equipTheme,
    checkUnlocks: checkUnlocks,
    equippedSkin: function () {
      return skin(data.skin);
    },
    equippedTheme: function () {
      return theme(data.theme);
    },
    total() {
      return all().length;
    },
    collected() {
      return data.unlocked.length;
    }
  };
})(window.GOUP);
