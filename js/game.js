window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const U = G.utils;
  const C = G.colors;
  const W = G.W;
  const H = G.H;
  const P = G.PHYS;
  const particles = G.particles;

  const FIXED = 1 / 60;
  const MAX_STEPS = 5;

  const JET_TIME = 2.6;
  const SHIELD_TIME = 12;
  const MAGNET_TIME = 8;
  const MAXES = { jet: JET_TIME, shield: SHIELD_TIME, magnet: MAGNET_TIME };

  const HINT_TIME = 5;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const frame = document.getElementById('frame');

  G.canvas = canvas;
  G.ctx = ctx;

  let dpr = 1;

  const player = new G.Player(W / 2 - 17, G.START_Y);
  const level = G.level;

  const game = {
    state: 'menu', // menu | playing | paused | dying | gameover
    time: 0,
    acc: 0,
    last: 0,
    runs: 0,
    cameraY: 0,
    minY: 0,
    score: 0,
    heightMeters: 0,
    coins: 0,
    best: 0,
    newBest: false,
    shake: 0,
    dieT: 0,
    jetSfxT: 0,
    hintT: 0,
    touch: false,
    nextMark: 0,
    coinMark: 0,
    celebrate: 0
  };


  /* ------------------------------------------------------------------ *
   * attract mode (menu backdrop)
   * ------------------------------------------------------------------ */

  const attract = { items: [], nextY: 0 };

  function buildAttract() {
    attract.items.length = 0;
    let y = H + 40;
    const types = ['normal', 'normal', 'spring', 'moving', 'fragile', 'normal'];
    for (let i = 0; i < 8; i++) {
      const w = U.rand(56, 92);
      attract.items.push({
        x: U.rand(14, W - w - 14),
        y,
        w,
        h: 15,
        type: U.pick(types),
        seed: Math.random() * 500,
        dir: U.chance(0.5) ? -1 : 1,
        speed: U.rand(40, 85),
        press: 0,
        fade: 1,
        broken: false
      });
      y -= U.rand(78, 128);
    }
    attract.nextY = y;
  }

  function stepAttract(dt) {
    for (let i = 0; i < attract.items.length; i++) {
      const it = attract.items[i];
      it.y += 30 * dt;
      if (it.type === 'moving') {
        it.x += it.dir * it.speed * dt;
        if (it.x <= 6) {
          it.x = 6;
          it.dir = 1;
        } else if (it.x + it.w >= W - 6) {
          it.x = W - it.w - 6;
          it.dir = -1;
        }
      }
      if (it.y > H + 60) {
        it.y = attract.nextY;
        attract.nextY -= U.rand(78, 128);
        it.x = U.rand(14, W - it.w - 14);
        it.type = U.chance(0.2) ? 'spring' : 'normal';
      }
    }

    // stand the doodle on a platform in the clear lower band (the menu card covers the middle)
    let lowest = null;
    let clear = null;
    for (let i = 0; i < attract.items.length; i++) {
      const it = attract.items[i];
      if (it.y > H - 24) continue;
      if (!lowest || it.y > lowest.y) lowest = it;
      if (it.y > H * 0.76 && (!clear || it.y > clear.y)) clear = it;
    }
    const stand = clear || lowest;
    if (stand) {
      player.x = stand.x + stand.w / 2 - player.w / 2;
      player.y = stand.y - player.h;
      player.vy = 0;
      player.vx = 0;
      player.onGround = true;
      player.tilt = 0;
      player.look = U.clamp(Math.sin(game.time * 0.7) * 0.6, -1, 1);
      const pop = game.celebrate > 0 ? 0.18 : 0.05;
      player.squashY = 1 + Math.sin(game.time * 4) * pop;
      player.squashX = 2 - player.squashY;
      player.rot = 0;
    } else {
      player.y = H + 120;
    }

    if (game.celebrate > 0) {
      game.celebrate -= dt;
      if (U.chance(dt * 6)) {
        particles.confetti(player.cx, player.y - 20, 3);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * flow
   * ------------------------------------------------------------------ */

  function start() {
    level.reset();
    level.setDifficulty(0);
    level.generateUpTo(G.START_Y - H - 300);

    player.reset(W / 2 - player.w / 2, G.START_Y);
    player.skin = G.progress.equippedSkin();
    particles.clear();

    game.runs++;
    game.state = 'playing';
    game.cameraY = G.START_Y - H * 0.6;
    game.minY = player.y;
    game.score = 0;
    game.heightMeters = 0;
    game.coins = 0;
    game.newBest = false;
    game.shake = 0;
    game.dieT = 0;
    game.jetSfxT = 0;
    game.hintT = game.runs <= 1 ? HINT_TIME : 0;
    game.nextMark = 0;
    game.coinMark = 0;
    game.celebrate = 0;

    G.ui.hideScreens();
    G.ui.showHud(true, game.touch);
    G.ui.setBestHot(false);
    G.input.clear();
    G.audio.sfx('start');
  }

  function toMenu(celebrate) {
    game.state = 'menu';
    level.reset();
    particles.clear();
    game.cameraY = 0;
    game.minY = 0;
    game.coins = 0;
    game.score = 0;
    buildAttract();
    player.reset(W / 2 - player.w / 2, G.START_Y);
    player.skin = G.progress.equippedSkin();
    game.celebrate = celebrate ? 2.2 : 0;
    G.ui.showMenu();
    G.input.clear();
  }

  function pause() {
    if (game.state !== 'playing') return;
    game.state = 'paused';
  }

  function resume() {
    if (game.state !== 'paused') return;
    game.state = 'playing';
  }

  function die() {
    if (player.shield > 0) {
      player.shield = 0;
      player.jet = 0;
      player.y = game.cameraY + 26;
      player.vy = -560;
      player.vx = 0;
      player.onGround = false;
      player.squashY = 1.3;
      player.squashX = 0.75;
      game.shake = 1;
      level.rescuePlatform(player.cx, game.cameraY + 150);
      G.audio.sfx('shieldHit');
      particles.burst(player.cx, player.cy, 20, {
        color: C.teal,
        kind: 'star',
        speedMin: 90,
        speedMax: 280,
        grav: 300,
        lifeMin: 0.3,
        lifeMax: 0.6,
        sizeMin: 3,
        sizeMax: 6
      });
      particles.popup(player.cx, player.y, 'SAVED!', C.tealDark);
      return;
    }

    player.dying = true;
    game.state = 'dying';
    game.dieT = 0.75;
    G.audio.sfx('death');
    game.shake = 0.8;
    particles.burst(player.cx, player.y + player.h - 8, 16, {
      color: C.green,
      kind: 'dot',
      speedMin: 60,
      speedMax: 240,
      grav: 900,
      lifeMin: 0.3,
      lifeMax: 0.7,
      sizeMin: 3,
      sizeMax: 6
    });
  }

  function gameOver() {
    game.state = 'gameover';

    const score = game.score;
    const prevBest = G.progress.data.best;
    const fresh = G.progress.recordRun(game.heightMeters, game.coins, score);

    game.best = G.progress.data.best;
    game.newBest = score > prevBest;

    G.ui.showOver({
      score: score,
      height: game.heightMeters,
      coins: game.coins,
      best: game.best,
      newBest: game.newBest,
      unlocks: fresh
    });

    if (fresh.length) {
      G.audio.sfx('best');
      G.ui.toast('unlock', 'Unlocked: ' + fresh.map((u) => u.name).join(' + '), 'open Skins to wear it');
    }
  }

  /* ------------------------------------------------------------------ *
   * collisions
   * ------------------------------------------------------------------ */

  function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
    const dx = Math.max(rx - cx, 0, cx - (rx + rw));
    const dy = Math.max(ry - cy, 0, cy - (ry + rh));
    return dx * dx + dy * dy <= r * r;
  }

  function land(pf) {
    pf.press = 1;
    if (pf.type === 'spring') {
      player.bounce(P.springJump, 'spring');
      game.shake = Math.max(game.shake, 0.5);
      G.audio.sfx('spring');
      particles.popup(player.cx, pf.y - 6, 'BOING!', C.yellowDark);
      particles.burst(player.cx, pf.y, 10, {
        color: C.yellow,
        kind: 'star',
        speedMin: 60,
        speedMax: 200,
        grav: 500,
        lifeMin: 0.25,
        lifeMax: 0.5,
        sizeMin: 2.5,
        sizeMax: 5
      });
    } else {
      player.bounce(P.jump, 'jump');
      G.audio.sfx('jump');
      particles.burst(player.cx, pf.y + 2, 5, {
        color: '#d8d2c4',
        kind: 'dot',
        speedMin: 25,
        speedMax: 90,
        grav: 600,
        lifeMin: 0.18,
        lifeMax: 0.34,
        sizeMin: 2,
        sizeMax: 4
      });
    }

    if (pf.type === 'fragile' && !pf.broken) {
      pf.break_();
      particles.burst(pf.cx, pf.y + pf.h / 2, 12, {
        color: C.tan,
        kind: 'square',
        speedMin: 50,
        speedMax: 190,
        grav: 1100,
        lifeMin: 0.3,
        lifeMax: 0.7,
        sizeMin: 2.5,
        sizeMax: 5
      });
    }
  }

  function collect(pu) {
    pu.taken = true;
    G.audio.sfx('powerup');
    game.shake = Math.max(game.shake, 0.45);

    if (pu.type === 'spring') {
      player.bounce(P.springJump * 1.05, 'spring');
      particles.popup(player.cx, player.y, 'SPRING!', C.yellowDark);
    } else if (pu.type === 'jet') {
      player.activateJet(JET_TIME);
      particles.popup(player.cx, player.y, 'JETPACK!', C.redDark);
    } else if (pu.type === 'shield') {
      player.shield = SHIELD_TIME;
      particles.popup(player.cx, player.y, 'SHIELD!', C.tealDark);
    } else {
      player.magnet = MAGNET_TIME;
      particles.popup(player.cx, player.y, 'MAGNET!', C.purpleDark);
    }

    particles.burst(pu.x, pu.y, 14, {
      color: pu.type === 'jet' ? C.red : pu.type === 'shield' ? C.teal : pu.type === 'magnet' ? C.purple : C.yellow,
      kind: 'star',
      speedMin: 70,
        speedMax: 250,
      grav: 420,
      lifeMin: 0.3,
      lifeMax: 0.6,
      sizeMin: 2.5,
      sizeMax: 6
    });
  }

  function checkCollisions(prevBottom) {
    if (player.vy <= 0) return;

    const plats = level.platforms;
    for (let i = 0; i < plats.length; i++) {
      const pf = plats[i];
      if (pf.broken) continue;
      if (player.x + player.w < pf.x || player.x > pf.x + pf.w) continue;
      const bottom = player.y + player.h;
      if (prevBottom <= pf.y + 8 && bottom >= pf.y) {
        player.y = pf.y - player.h;
        land(pf);
        return;
      }
    }
  }

  function checkItems() {
    const coins = level.coins;
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.taken) continue;
      if (circleHitsRect(c.x, c.y, c.r + 3, player.x, player.y, player.w, player.h)) {
        c.taken = true;
        game.coins++;
        game.score += P.coinValue;
        G.audio.sfx('coin');
        particles.burst(c.x, c.y, 6, {
          color: C.coin,
          kind: 'dot',
          speedMin: 40,
          speedMax: 150,
          grav: 400,
          lifeMin: 0.2,
          lifeMax: 0.45,
          sizeMin: 2,
          sizeMax: 4
        });
      }
    }

    const pus = level.powerups;
    for (let i = 0; i < pus.length; i++) {
      const pu = pus[i];
      if (pu.taken) continue;
      if (U.overlap(pu.x - 16, pu.y - 16, 32, 32, player.x, player.y, player.w, player.h)) {
        collect(pu);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * update
   * ------------------------------------------------------------------ */

  function updatePlaying(dt) {
    const axis = G.input.axis;
    const prevBottom = player.y + player.h;

    player.update(dt, axis);
    level.update(dt, player, game.cameraY + H);
    checkCollisions(prevBottom);
    checkItems();

    if (player.jet > 0) {
      game.jetSfxT -= dt;
      if (game.jetSfxT <= 0) {
        game.jetSfxT = 0.14;
        G.audio.sfx('jet');
      }
      particles.spawn({
        x: player.cx + U.rand(-5, 5),
        y: player.y + player.h - 6,
        vx: U.rand(-40, 40),
        vy: U.rand(180, 340),
        grav: -60,
        life: U.rand(0.18, 0.34),
        size: U.rand(3, 6.5),
        endSize: 0.5,
        color: Math.random() < 0.5 ? C.yellow : '#ff9a3c',
        kind: 'dot'
      });
    }

    if (player.y < game.minY) game.minY = player.y;
    game.heightMeters = Math.floor((G.START_Y - game.minY) / 12);
    level.setDifficulty(game.heightMeters);
    level.generateUpTo(game.cameraY - 620);
    game.score = Math.max(game.score, Math.floor((G.START_Y - game.minY) / 10) + game.coins * P.coinValue);

    // milestone feedback: height every 50m, coins every 50
    const mark = Math.floor(game.heightMeters / 50);
    if (mark > game.nextMark) {
      game.nextMark = mark;
      const m = mark * 50;
      particles.popup(player.cx, player.y - 26, m + 'm!', C.blueDark);
      particles.burst(player.cx, player.y, 10, {
        color: C.blue,
        kind: 'star',
        speedMin: 60,
        speedMax: 200,
        grav: 380,
        lifeMin: 0.3,
        lifeMax: 0.6,
        sizeMin: 2.5,
        sizeMax: 5
      });
      G.audio.sfx('milestone');
    }
    const coinMark = Math.floor(game.coins / 50);
    if (coinMark > game.coinMark) {
      game.coinMark = coinMark;
      particles.popup(player.cx, player.y - 46, coinMark * 50 + ' coins!', C.coinDark);
    }

    const desired = player.y - H * 0.58;
    if (desired < game.cameraY) game.cameraY += (desired - game.cameraY) * U.smooth(9, dt);

    if (game.hintT > 0) game.hintT -= dt;

    G.ui.setBestHot(game.score > G.progress.data.best);
    G.ui.setLiveGoal(game.heightMeters, game.coins, game.score);

    if (player.y > game.cameraY + H + 40) die();
  }

  function step(dt) {
    game.time += dt;

    const flags = G.input.take();
    if (flags.mute) G.ui.setMuted(G.audio.toggleMute());

    switch (game.state) {
      case 'menu':
        if (flags.confirm) start();
        break;
      case 'playing':
        if (flags.pause) pause();
        else if (flags.restart) start();
        break;
      case 'paused':
        if (flags.pause || flags.confirm) resume();
        else if (flags.restart) start();
        break;
      case 'dying':
        if (flags.restart || flags.confirm) start();
        break;
      case 'gameover':
        if (flags.confirm || flags.restart) start();
        else if (flags.pause) toMenu();
        break;
    }

    if (game.state === 'playing') {
      updatePlaying(dt);
    } else if (game.state === 'dying') {
      player.vy += P.gravity * dt;
      player.y += player.vy * dt;
      player.x += player.vx * dt;
      player.rot += 7 * dt;
      player.fade = U.clamp(1 - (0.75 - game.dieT) / 0.5, 0, 1);
      game.dieT -= dt;
      if (game.dieT <= 0) gameOver();
    } else if (game.state === 'menu') {
      stepAttract(dt);
    }

    particles.update(dt);
    if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 2.4);

    G.ui.setStats({
      score: game.score,
      height: game.heightMeters,
      coins: game.coins,
      best: game.best
    });
    G.ui.setEffects(player, MAXES);
  }

  /* ------------------------------------------------------------------ *
   * render
   * ------------------------------------------------------------------ */

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const shakeX = game.shake > 0 ? U.rand(-1, 1) * game.shake * 5 : 0;
    const shakeY = game.shake > 0 ? U.rand(-1, 1) * game.shake * 5 : 0;

    G.art.background(ctx, game.cameraY, game.time);

    ctx.save();
    ctx.translate(shakeX, shakeY - game.cameraY);

    if (game.state === 'menu') {
      for (let i = 0; i < attract.items.length; i++) {
        G.art.drawPlatform(ctx, attract.items[i], game.time);
      }
      player.draw(ctx, game.time);
    } else {
      level.draw(ctx, game.time);
      particles.draw(ctx);
      ctx.globalAlpha = game.state === 'dying' ? player.fade : 1;
      player.draw(ctx, game.time);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    G.art.drawVignette(ctx);

    if (game.state === 'playing' && game.hintT > 0) {
      G.art.drawHint(ctx, U.clamp(game.hintT / 1.2, 0, 1) * 0.85, game.time);
    }
    if (game.state === 'paused') G.art.drawPaused(ctx);
  }

  /* ------------------------------------------------------------------ *
   * loop + boot
   * ------------------------------------------------------------------ */

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 14;
    const scale = Math.max(
      0.3,
      Math.min((window.innerWidth - pad * 2) / W, (window.innerHeight - pad * 2) / H, 1.5)
    );
    const cw = Math.floor(W * scale);
    const ch = Math.floor(H * scale);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    if (frame) {
      frame.style.width = cw + 'px';
      frame.style.height = ch + 'px';
    }
  }

  function loop(now) {
    window.requestAnimationFrame(loop);
    if (!game.last) game.last = now;
    let dt = (now - game.last) / 1000;
    game.last = now;
    if (dt > 0.25) dt = 0.25;

    game.acc += dt;
    let steps = 0;
    while (game.acc >= FIXED && steps < MAX_STEPS) {
      step(FIXED);
      game.acc -= FIXED;
      steps++;
    }
    if (steps === MAX_STEPS) game.acc = 0;

    render();
  }

  function boot() {
    game.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    // load lifetime progress, then carry over a high score from an older save
    G.progress.load();
    const legacy = U.storage.get(G.BEST_KEY, 0) || 0;
    if (legacy > G.progress.data.best) {
      G.progress.data.best = legacy;
      G.progress.save();
    }
    game.best = G.progress.data.best;
    G.art.applyTheme(G.progress.equippedTheme());

    G.ui.init({
      play: start,
      again: start,
      menu: toMenu,
      mute: () => G.ui.setMuted(G.audio.toggleMute())
    });
    G.ui.setMuted(G.audio.isMuted());
    G.ui.refreshStats();
    G.input.init({ left: document.getElementById('touchLeft'), right: document.getElementById('touchRight') });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
    });
    window.addEventListener('pointerdown', () => G.audio.unlock(), { once: true });
    window.addEventListener('keydown', () => G.audio.unlock(), { once: true });

    player.skin = G.progress.equippedSkin();
    resize();
    toMenu();
    window.requestAnimationFrame(loop);
  }

  G.game = game;
  G.game.player = player;
  G.start = start;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.GOUP);
