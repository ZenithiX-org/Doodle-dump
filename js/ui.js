window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const U = G.utils;
  const C = G.colors;

  const EFFECT_META = {
    jet: { label: 'JET', color: C.red },
    shield: { label: 'SHIELD', color: C.teal },
    magnet: { label: 'MAGNET', color: C.purple }
  };

  function $(id) {
    return document.getElementById(id);
  }

  const ui = {
    el: {},
    chips: {},
    cards: [],
    portraitRaf: 0,
    portraitTime: 0,
    openScreen: null,
    returnScreen: null,

    init(handlers) {
      this.el = {
        hud: $('hud'),
        score: $('score'),
        height: $('height'),
        coins: $('coins'),
        best: $('best'),
        muteBtn: $('muteBtn'),
        effects: $('effects'),
        nextUnlock: $('nextUnlock'),
        nuIcon: $('nuIcon'),
        nuName: $('nuName'),
        nuFill: $('nuFill'),
        nuText: $('nuText'),
        toasts: $('toasts'),
        menu: $('menu'),
        over: $('over'),
        wardrobe: $('wardrobe'),
        overScore: $('overScore'),
        overHeight: $('overHeight'),
        overCoins: $('overCoins'),
        overBest: $('overBest'),
        newBest: $('newBest'),
        unlockBanner: $('unlockBanner'),
        unlockName: $('unlockName'),
        unlockBtn: $('unlockBtn'),
        overGoal: $('overGoal'),
        menuGoal: $('menuGoal'),
        wardrobeGoal: $('wardrobeGoal'),
        playBtn: $('playBtn'),
        againBtn: $('againBtn'),
        menuSkinsBtn: $('menuSkinsBtn'),
        overSkinsBtn: $('overSkinsBtn'),
        overMenuBtn: $('overMenuBtn'),
        menuSkinCount: $('menuSkinCount'),
        overSkinCount: $('overSkinCount'),
        skinGrid: $('skinGrid'),
        themeGrid: $('themeGrid'),
        wardrobeCount: $('wardrobeCount'),
        wardrobeTotal: $('wardrobeTotal'),
        wardrobeClose: $('wardrobeClose'),
        wardrobeBack: $('wardrobeBack'),
        touch: $('touch'),
        touchLeft: $('touchLeft'),
        touchRight: $('touchRight'),
        lifeHeight: $('lifeHeight'),
        lifeCoins: $('lifeCoins'),
        lifeRuns: $('lifeRuns'),
        lifeBest: $('lifeBest')
      };

      this.el.playBtn.addEventListener('click', handlers.play);
      this.el.againBtn.addEventListener('click', handlers.again);
      this.el.muteBtn.addEventListener('click', handlers.mute);
      this.el.overMenuBtn.addEventListener('click', handlers.menu);
      this.el.menuSkinsBtn.addEventListener('click', () => this.openWardrobe('menu'));
      this.el.overSkinsBtn.addEventListener('click', () => this.openWardrobe('over'));
      this.el.unlockBtn.addEventListener('click', () => this.openWardrobe('over', true));
      this.el.wardrobeClose.addEventListener('click', () => this.closeWardrobe());
      this.el.wardrobeBack.addEventListener('click', () => this.closeWardrobe());

      for (const name in EFFECT_META) this.chips[name] = this.buildChip(name);
      this.buildWardrobe();
    },

    buildChip(name) {
      const meta = EFFECT_META[name];
      const el = document.createElement('div');
      el.className = 'eff';
      el.style.display = 'none';
      el.innerHTML =
        '<i style="background:' + meta.color + '"></i>' + meta.label + ' <span class="meter"><span></span></span>';
      this.el.effects.appendChild(el);
      return { el, fill: el.querySelector('.meter span') };
    },

    /* ---------------------------------------------------------------- *
     * screens
     * ---------------------------------------------------------------- */

    showMenu() {
      this.awardPending();
      this.openScreen = 'menu';
      this.el.menu.classList.remove('hidden');
      this.el.over.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.touch.classList.add('hidden');
      this.refreshStats();
    },

    showOver(stats) {
      this.openScreen = 'over';
      this.el.menu.classList.add('hidden');
      this.el.wardrobe.classList.add('hidden');
      this.el.over.classList.remove('hidden');
      this.el.hud.classList.add('hidden');
      this.el.touch.classList.add('hidden');
      this.setText(this.el.overScore, stats.score);
      this.setText(this.el.overHeight, stats.height + 'm');
      this.setText(this.el.overCoins, stats.coins);
      this.setText(this.el.overBest, stats.best);
      this.el.newBest.classList.toggle('hidden', !stats.newBest);
      this.refreshStats();

      if (stats.unlocks && stats.unlocks.length) {
        this.el.unlockBanner.classList.remove('hidden');
        this.setText(this.el.unlockName, stats.unlocks.map(nameOf).join(' + '));
      } else {
        this.el.unlockBanner.classList.add('hidden');
      }
      this.setGoal(this.el.overGoal, G.progress.data);
    },

    showHud(on, touch) {
      this.el.hud.classList.toggle('hidden', !on);
      this.el.touch.classList.toggle('hidden', !(on && touch));
    },

    hideScreens() {
      this.el.menu.classList.add('hidden');
      this.el.over.classList.add('hidden');
      this.el.wardrobe.classList.add('hidden');
      this.stopPortraits();
      this.openScreen = null;
    },

    setText(el, value) {
      const v = String(value);
      if (el.textContent !== v) el.textContent = v;
    },

    /* ---------------------------------------------------------------- *
     * live goal readout
     * ---------------------------------------------------------------- */

    setGoal(el, projected) {
      const next = G.progress.next(projected);
      if (!next) {
        this.setText(el, 'everything unlocked — you are a legend');
        return null;
      }
      const p = G.progress.reqProgress(next.item.req, projected);
      this.setText(el, 'next: ' + nameOf(next.item) + ' · ' + p.text);
      return next;
    },

    setLiveGoal(height, coins, score) {
      const projected = G.progress.projected(height, coins, score);
      const next = G.progress.next(projected);
      if (!next) {
        this.el.nextUnlock.classList.add('hidden');
        return;
      }
      const p = G.progress.reqProgress(next.item.req, projected);
      this.el.nextUnlock.classList.remove('hidden');
      this.setText(this.el.nuName, nameOf(next.item));
      this.setText(this.el.nuText, p.text);
      this.el.nuFill.style.width = (p.ratio * 100).toFixed(0) + '%';
      this.el.nuIcon.style.background = next.kind === 'theme' ? C.paper : bodyOf(next.item);
      this.el.nuIcon.style.boxShadow = '0 0 0 2.5px ' + C.ink;
    },

    setBestHot(hot) {
      this.el.best.parentNode.classList.toggle('hot', !!hot);
    },

    setStats(s) {
      this.setText(this.el.score, s.score);
      this.setText(this.el.height, s.height + 'm');
      this.setText(this.el.coins, s.coins);
      this.setText(this.el.best, s.best);
    },

    setEffects(player, maxes) {
      for (const name in EFFECT_META) {
        const chip = this.chips[name];
        const value = player[name] || 0;
        if (value <= 0) {
          if (chip.el.style.display !== 'none') chip.el.style.display = 'none';
          continue;
        }
        if (chip.el.style.display === 'none') chip.el.style.display = '';
        chip.fill.style.width = U.clamp((value / maxes[name]) * 100, 0, 100).toFixed(0) + '%';
      }
    },

    setMuted(muted) {
      this.el.muteBtn.textContent = muted ? '\u{1F507}' : '\u{1F50A}';
      this.el.muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    },

    /* ---------------------------------------------------------------- *
     * lifetime stats
     * ---------------------------------------------------------------- */

    /** Safety net: award anything already earned (e.g. imported save data). */
    awardPending() {
      const fresh = G.progress.checkUnlocks();
      if (fresh.length) {
        this.toast('unlock', 'Unlocked: ' + fresh.map((u) => u.name).join(' + '), 'available in Skins');
      }
      return fresh;
    },

    refreshStats() {
      const d = G.progress.data;
      this.setText(this.el.lifeHeight, fmt(d.totalHeight) + 'm');
      this.setText(this.el.lifeCoins, fmt(d.totalCoins));
      this.setText(this.el.lifeRuns, fmt(d.runs));
      this.setText(this.el.lifeBest, fmt(d.best));
      const count = G.progress.collected() + '/' + G.progress.total();
      this.setText(this.el.menuSkinCount, count);
      this.setText(this.el.overSkinCount, count);
      this.setText(this.el.wardrobeCount, String(G.progress.collected()));
      this.setText(this.el.wardrobeTotal, String(G.progress.total()));
      this.setGoal(this.el.menuGoal, d);
      this.setGoal(this.el.wardrobeGoal, d);
    },

    /* ---------------------------------------------------------------- *
     * wardrobe
     * ---------------------------------------------------------------- */

    buildWardrobe() {
      this.cards = [];
      this.el.skinGrid.innerHTML = '';
      this.el.themeGrid.innerHTML = '';

      for (const s of G.skins.SKINS) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'skin-card';
        card.innerHTML =
          '<span class="portrait-wrap"><canvas class="portrait" width="76" height="64"></canvas><span class="lock">&#128274;</span></span>' +
          '<span class="skin-name">' + s.name + '</span>' +
          '<span class="skin-state"></span>' +
          '<span class="skin-meter"><span class="skin-fill"></span></span>' +
          '<span class="skin-req"></span>';
        card.addEventListener('click', () => this.pickSkin(s.id));
        this.el.skinGrid.appendChild(card);
        this.cards.push({ el: card, kind: 'skin', item: s, canvas: card.querySelector('canvas') });
      }

      for (const t of G.skins.THEMES) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'skin-card theme-card';
        card.innerHTML =
          '<span class="portrait-wrap"><span class="swatch"><i></i><i></i></span><span class="lock">&#128274;</span></span>' +
          '<span class="skin-name">' + t.name + '</span>' +
          '<span class="skin-state"></span>' +
          '<span class="skin-meter"><span class="skin-fill"></span></span>' +
          '<span class="skin-req"></span>';
        card.addEventListener('click', () => this.pickTheme(t.id));
        this.el.themeGrid.appendChild(card);
        const swatch = card.querySelectorAll('.swatch i');
        swatch[0].style.background = t.paper;
        swatch[1].style.background =
          'repeating-linear-gradient(0deg, ' + t.gridMajor + ' 0 5px, transparent 5px 10px),' +
          'repeating-linear-gradient(90deg, ' + t.gridMajor + ' 0 5px, transparent 5px 10px)';
        this.cards.push({ el: card, kind: 'theme', item: t, canvas: null });
      }
    },

    openWardrobe(from, highlight) {
      this.awardPending();
      this.returnScreen = from || (this.openScreen === 'over' ? 'over' : 'menu');
      this.el.menu.classList.add('hidden');
      this.el.over.classList.add('hidden');
      this.el.wardrobe.classList.remove('hidden');
      this.openScreen = 'wardrobe';
      this.refreshCards(highlight ? this.highlightId : null);
      this.startPortraits();
    },

    closeWardrobe() {
      this.stopPortraits();
      this.el.wardrobe.classList.add('hidden');
      if (this.returnScreen === 'over') {
        this.el.over.classList.remove('hidden');
        this.openScreen = 'over';
      } else {
        this.el.menu.classList.remove('hidden');
        this.openScreen = 'menu';
      }
      this.refreshStats();
    },

    refreshCards(highlight) {
      const d = G.progress.data;
      for (const c of this.cards) {
        const unlocked = G.progress.isUnlocked(c.item.id);
        const equipped = d[c.kind] === c.item.id;
        c.el.classList.toggle('locked', !unlocked);
        c.el.classList.toggle('equipped', equipped);
        c.el.classList.toggle('fresh', highlight === c.item.id);
        const state = c.el.querySelector('.skin-state');
        const meter = c.el.querySelector('.skin-meter');
        const fill = c.el.querySelector('.skin-fill');
        const req = c.el.querySelector('.skin-req');

        if (equipped) {
          state.textContent = 'wearing';
          meter.classList.add('hidden');
          req.textContent = '';
        } else if (unlocked) {
          state.textContent = 'tap to wear';
          meter.classList.add('hidden');
          req.textContent = '';
        } else {
          const p = G.progress.reqProgress(c.item.req, d);
          state.textContent = 'locked';
          meter.classList.remove('hidden');
          fill.style.width = (p.ratio * 100).toFixed(0) + '%';
          req.textContent = p.text;
        }
      }
    },

    pickSkin(id) {
      if (!G.progress.isUnlocked(id)) {
        this.toast('locked', G.progress.reqText(G.skins.skin(id).req), 'keep climbing');
        return;
      }
      if (G.progress.equipSkin(id)) {
        G.game.player.skin = G.progress.equippedSkin();
        this.refreshCards();
        this.toast('equipped', G.skins.skin(id).name, G.skins.skin(id).tag);
        G.audio.sfx('powerup');
        this.burstCard(id);
      }
    },

    pickTheme(id) {
      if (!G.progress.isUnlocked(id)) {
        this.toast('locked', G.progress.reqText(G.skins.theme(id).req), 'keep climbing');
        return;
      }
      if (G.progress.equipTheme(id)) {
        this.refreshCards();
        this.toast('equipped', G.skins.theme(id).name, G.skins.theme(id).tag);
        G.audio.sfx('powerup');
        this.burstCard(id);
      }
    },

    burstCard(id) {
      const card = this.cards.find((c) => c.item.id === id);
      if (!card) return;
      card.el.classList.remove('pop');
      // force reflow so the animation replays
      void card.el.offsetWidth;
      card.el.classList.add('pop');
    },

    startPortraits() {
      if (this.portraitRaf) return;
      const tick = () => {
        this.portraitTime += 1 / 30;
        for (const c of this.cards) {
          if (!c.canvas) continue;
          const ctx = c.canvas.getContext('2d');
          G.art.portrait(ctx, c.item, this.portraitTime, 76, 64);
        }
        this.portraitRaf = window.requestAnimationFrame(tick);
      };
      tick();
    },

    stopPortraits() {
      if (this.portraitRaf) {
        window.cancelAnimationFrame(this.portraitRaf);
        this.portraitRaf = 0;
      }
    },

    /* ---------------------------------------------------------------- *
     * toasts
     * ---------------------------------------------------------------- */

    toast(kind, title, sub) {
      const el = document.createElement('div');
      el.className = 'toast toast-' + kind;
      el.innerHTML = '<span class="toast-title"></span><span class="toast-sub"></span>';
      el.querySelector('.toast-title').textContent = title;
      if (sub) el.querySelector('.toast-sub').textContent = sub;
      this.el.toasts.appendChild(el);
      window.setTimeout(() => {
        el.classList.add('out');
        window.setTimeout(() => el.remove(), 320);
      }, 2400);
      while (this.el.toasts.children.length > 3) {
        const first = this.el.toasts.firstElementChild || this.el.toasts.firstChild;
        if (!first) break;
        this.el.toasts.removeChild(first);
      }
    }
  };

  function fmt(n) {
    n = Math.floor(n || 0);
    return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  function nameOf(item) {
    return item.name;
  }

  function bodyOf(item) {
    return item.body || item.paper;
  }

  G.ui = ui;
})(window.GOUP);
