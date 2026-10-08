window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const U = G.utils;
  const W = G.W;

  G.PHYS = {
    gravity: 2400,
    jump: 900,
    springJump: 1450,
    jetSpeed: 520,
    moveSpeed: 340,
    accel: 2600,
    drag: 2200,
    maxFall: 1500,
    coinPull: 170,
    coinValue: 5
  };

  class Player {
    constructor(x, y) {
      this.w = 34;
      this.h = 46;
      this.x = x;
      this.y = y - this.h;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.tilt = 0;
      this.squashX = 1;
      this.squashY = 1;
      this.look = 0;
      this.rot = 0;
      this.jet = 0;
      this.jetFade = 1;
      this.shield = 0;
      this.magnet = 0;
      this.springT = 0;
      this.dying = false;
      this.fade = 1;
      this.skin = null;
    }

    get cx() {
      return this.x + this.w / 2;
    }

    get cy() {
      return this.y + this.h / 2;
    }

    reset(x, y) {
      this.x = x;
      this.y = y - this.h;
      this.vx = 0;
      this.vy = 0;
      this.onGround = true;
      this.tilt = 0;
      this.squashX = 1;
      this.squashY = 1;
      this.look = 0;
      this.rot = 0;
      this.jet = 0;
      this.jetFade = 1;
      this.shield = 0;
      this.magnet = 0;
      this.springT = 0;
      this.dying = false;
      this.fade = 1;
    }

    bounce(speed, kind) {
      const P = G.PHYS;
      this.vy = -speed;
      this.onGround = true;
      if (kind === 'spring') {
        this.springT = 0.35;
        this.squashY = 1.42;
        this.squashX = 0.72;
      } else {
        this.squashY = 1.22;
        this.squashX = 0.82;
      }
    }

    activateJet(duration) {
      this.jet = duration;
      this.vy = -G.PHYS.jetSpeed;
    }

    update(dt, axis) {
      const P = G.PHYS;

      if (axis !== 0) {
        const boost = this.jet > 0 ? 1.2 : 1;
        const rate = this.jet > 0 ? P.accel * 0.45 : P.accel;
        this.vx = U.approach(this.vx, axis * P.moveSpeed * boost, rate * dt);
      } else {
        this.vx = U.approach(this.vx, 0, P.drag * dt);
      }
      this.x += this.vx * dt;

      if (this.jet > 0) {
        this.jet -= dt;
        this.vy = -P.jetSpeed;
        this.jetFade = U.clamp(this.jet / 0.5, 0.25, 1);
        if (this.jet <= 0) this.jet = 0;
      } else {
        this.vy += P.gravity * dt;
        if (this.vy > P.maxFall) this.vy = P.maxFall;
      }
      this.y += this.vy * dt;

      if (this.x + this.w < 0) this.x = W;
      else if (this.x > W) this.x = -this.w;

      if (this.shield > 0) this.shield = Math.max(0, this.shield - dt);
      if (this.magnet > 0) this.magnet = Math.max(0, this.magnet - dt);
      if (this.springT > 0) this.springT = Math.max(0, this.springT - dt);

      const k = U.smooth(13, dt);
      this.squashY += (1 - this.squashY) * k;
      this.squashX += (1 - this.squashX) * k;
      this.tilt += (U.clamp(this.vx / 1500, -0.2, 0.2) - this.tilt) * U.smooth(8, dt);
      this.look += (U.clamp(this.vx / 320, -1, 1) - this.look) * U.smooth(10, dt);

      if (this.vy > 40) this.onGround = false;
    }

    draw(ctx, t) {
      G.art.drawPlayer(ctx, this, t, this.skin);
    }
  }

  class Platform {
    constructor(x, y, w, type) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = 15;
      this.type = type || 'normal';
      this.seed = Math.random() * 500;
      this.press = 0;
      this.fade = 1;
      this.broken = false;
      this.gone = false;
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.speed = 40 + Math.random() * 60;
      this.moved = 0;
    }

    get cx() {
      return this.x + this.w / 2;
    }

    break_() {
      this.broken = true;
      this.type = 'fragile';
    }

    update(dt) {
      if (this.type === 'moving' && !this.broken) {
        this.x += this.dir * this.speed * dt;
        this.moved += Math.abs(this.dir * this.speed * dt);
        if (this.x <= 0) {
          this.x = 0;
          this.dir = 1;
        } else if (this.x + this.w >= W) {
          this.x = W - this.w;
          this.dir = -1;
        }
      }
      if (this.press > 0) this.press = Math.max(0, this.press - dt * 4.5);
      if (this.broken) {
        this.fade -= dt * 6;
        if (this.fade <= 0) {
          this.fade = 0;
          this.gone = true;
        }
      }
    }

    draw(ctx, t) {
      G.art.drawPlatform(ctx, this, t);
    }
  }

  class Coin {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.r = 9;
      this.phase = Math.random() * Math.PI * 2;
      this.seed = Math.random() * 500;
      this.taken = false;
    }

    update(dt, player) {
      if (this.taken || !player) return;
      if (player.magnet > 0) {
        const dx = player.cx - this.x;
        const dy = player.cy - this.y;
        const d = Math.hypot(dx, dy);
        if (d < G.PHYS.coinPull && d > 0.001) {
          const pull = G.PHYS.coinPull * (1 - d / G.PHYS.coinPull) * 8;
          this.x += (dx / d) * pull * dt;
          this.y += (dy / d) * pull * dt;
        }
      }
    }

    draw(ctx, t) {
      if (this.taken) return;
      G.art.drawCoin(ctx, this, t);
    }
  }

  class PowerUp {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.phase = Math.random() * Math.PI * 2;
      this.seed = Math.random() * 500;
      this.taken = false;
    }

    draw(ctx, t) {
      if (this.taken) return;
      G.art.drawPowerup(ctx, this, t);
    }
  }

  G.Player = Player;
  G.Platform = Platform;
  G.Coin = Coin;
  G.PowerUp = PowerUp;
})(window.GOUP);
