window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const U = G.utils;
  const W = G.W;
  const H = G.H;

  G.START_Y = 620;

  const MAX_GAP = 138;
  const MIN_GAP = 68;

  class Level {
    constructor() {
      this.platforms = [];
      this.coins = [];
      this.powerups = [];
      this.nextY = 0;
      this.lastCx = 0;
      this.difficulty = 0;
      this.since = 0;
      this.sincePower = 0;
      this.powerCount = 0;
      this.lastPower = null;
      this.reset();
    }

    reset() {
      this.platforms.length = 0;
      this.coins.length = 0;
      this.powerups.length = 0;
      this.difficulty = 0;
      this.since = 0;
      this.sincePower = 0;
      this.powerCount = 0;
      this.lastPower = null;

      const start = new G.Platform(W / 2 - 64, G.START_Y, 128, 'normal');
      this.platforms.push(start);
      this.nextY = start.y;
      this.lastCx = start.cx;
    }

    setDifficulty(heightMeters) {
      this.difficulty = U.clamp(heightMeters / 750, 0, 1);
    }

    /** Keep the world populated above the given world Y. */
    generateUpTo(targetY) {
      let guard = 0;
      while (this.nextY > targetY && guard++ < 200) this.spawnNext();
    }

    spawnNext() {
      const d = this.difficulty;
      const gap = U.clamp(U.lerp(76, MAX_GAP, d) * U.rand(0.94, 1.06), MIN_GAP, MAX_GAP);
      const y = this.nextY - gap;

      const w = U.clamp(U.rand(58, 92) * (1 - 0.1 * d), 46, 96);

      const maxShift = 118 + 62 * d;
      const prevCx = this.lastCx;
      const cx = U.clamp(prevCx + U.rand(-maxShift, maxShift), w / 2 + 8, W - w / 2 - 8);
      const x = cx - w / 2;

      const movingChance = d > 0.1 ? Math.min(0.38, (d - 0.1) * 0.72) : 0;
      const fragileChance = d > 0.2 ? Math.min(0.26, (d - 0.2) * 0.5) : 0;
      const roll = Math.random();

      let type = 'normal';
      if (roll < movingChance) type = 'moving';
      else if (roll < movingChance + fragileChance) type = 'fragile';
      else if (this.since >= 5 && Math.random() < 0.13) type = 'spring';

      const pf = new G.Platform(x, y, w, type);
      this.platforms.push(pf);

      // coins arcing between the old and new platform
      if (U.chance(0.34)) {
        const n = U.randInt(3, 5);
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          this.coins.push(
            new G.Coin(U.lerp(prevCx, cx, t), U.lerp(this.nextY, y, t) - 28 - Math.sin(t * Math.PI) * 10)
          );
        }
      }
      // small row hovering above a sturdy platform
      if (type !== 'fragile' && U.chance(0.22)) {
        const n = U.randInt(2, 4);
        for (let i = 0; i < n; i++) {
          this.coins.push(new G.Coin(cx + (i - (n - 1) / 2) * 26, y - 30));
        }
      }

      this.since = type === 'spring' ? 0 : this.since + 1;
      this.sincePower++;
      if (this.sincePower >= U.randInt(9, 14)) {
        this.sincePower = 0;
        this.spawnPowerUp(cx, y);
      }

      this.nextY = y;
      this.lastCx = cx;
    }

    spawnPowerUp(cx, platformY) {
      const pool = ['spring', 'jet', 'shield', 'magnet'].filter((k) => k !== this.lastPower);
      this.powerCount++;
      const type = this.powerCount <= 2 ? 'spring' : U.pick(pool);
      this.lastPower = type;
      this.powerups.push(new G.PowerUp(U.clamp(cx, 30, W - 30), platformY - 56, type));
    }

    /** Drop a safety platform under the player (used when a shield saves them). */
    rescuePlatform(cx, y) {
      const w = 84;
      const x = U.clamp(cx - w / 2, 6, W - w - 6);
      const pf = new G.Platform(x, y, w, 'normal');
      this.platforms.push(pf);
      return pf;
    }

    update(dt, player, bottomY) {
      const list = this.platforms;
      for (let i = 0; i < list.length; i++) list[i].update(dt);
      for (let i = 0; i < this.coins.length; i++) this.coins[i].update(dt, player);

      if (bottomY != null) this.cull(bottomY);
    }

    cull(bottomY) {
      const limit = bottomY + 320;
      for (let i = this.platforms.length - 1; i >= 0; i--) {
        if (this.platforms[i].gone || this.platforms[i].y > limit) this.platforms.splice(i, 1);
      }
      for (let i = this.coins.length - 1; i >= 0; i--) {
        if (this.coins[i].taken || this.coins[i].y > limit) this.coins.splice(i, 1);
      }
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        if (this.powerups[i].taken || this.powerups[i].y > limit) this.powerups.splice(i, 1);
      }
    }

    draw(ctx, t) {
      for (let i = 0; i < this.coins.length; i++) this.coins[i].draw(ctx, t);
      for (let i = 0; i < this.powerups.length; i++) this.powerups[i].draw(ctx, t);
      for (let i = 0; i < this.platforms.length; i++) this.platforms[i].draw(ctx, t);
    }
  }

  G.Level = Level;
  G.level = new Level();
  G.MAX_GAP = MAX_GAP;
})(window.GOUP);
