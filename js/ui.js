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

  G.ui = {
    el: {},
    chips: {},
    last: {},

    init(handlers) {
      this.el = {
        hud: $('hud'),
        score: $('score'),
        height: $('height'),
        coins: $('coins'),
        best: $('best'),
        muteBtn: $('muteBtn'),
        effects: $('effects'),
        menu: $('menu'),
        over: $('over'),
        menuBest: $('menuBest'),
        overScore: $('overScore'),
        overHeight: $('overHeight'),
        overCoins: $('overCoins'),
        overBest: $('overBest'),
        newBest: $('newBest'),
        playBtn: $('playBtn'),
        againBtn: $('againBtn'),
        menuBtn: $('menuBtn'),
        touch: $('touch'),
        touchLeft: $('touchLeft'),
        touchRight: $('touchRight')
      };

      this.el.playBtn.addEventListener('click', handlers.play);
      this.el.againBtn.addEventListener('click', handlers.again);
      this.el.menuBtn.addEventListener('click', handlers.menu);
      this.el.muteBtn.addEventListener('click', handlers.mute);

      for (const name in EFFECT_META) this.chips[name] = this.buildChip(name);
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

    showMenu(best) {
      this.el.menu.classList.remove('hidden');
      this.el.over.classList.add('hidden');
      this.el.hud.classList.add('hidden');
      this.el.touch.classList.add('hidden');
      this.setText(this.el.menuBest, best);
    },

    showOver(stats) {
      this.el.menu.classList.add('hidden');
      this.el.over.classList.remove('hidden');
      this.el.hud.classList.add('hidden');
      this.setText(this.el.overScore, stats.score);
      this.setText(this.el.overHeight, stats.height + 'm');
      this.setText(this.el.overCoins, stats.coins);
      this.setText(this.el.overBest, stats.best);
      this.el.newBest.classList.toggle('hidden', !stats.newBest);
    },

    showHud(on, touch) {
      this.el.hud.classList.toggle('hidden', !on);
      this.el.touch.classList.toggle('hidden', !(on && touch));
    },

    hideScreens() {
      this.el.menu.classList.add('hidden');
      this.el.over.classList.add('hidden');
    },

    setText(el, value) {
      const v = String(value);
      if (el.textContent !== v) el.textContent = v;
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
        const pct = U.clamp((value / maxes[name]) * 100, 0, 100);
        chip.fill.style.width = pct.toFixed(0) + '%';
      }
    },

    setMuted(muted) {
      this.el.muteBtn.textContent = muted ? '\u{1F507}' : '\u{1F50A}';
      this.el.muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    }
  };
})(window.GOUP);
