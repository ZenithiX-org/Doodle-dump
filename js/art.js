window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const U = G.utils;
  const W = G.W;
  const H = G.H;

  const C = (G.colors = {
    paper: '#fdf7e6',
    grid: '#d5e4f5',
    gridMajor: '#bcd5ee',
    margin: '#f6d2d2',
    ink: '#3f3a33',
    inkSoft: 'rgba(63,58,51,0.35)',
    green: '#93dd55',
    greenDark: '#4f9c2f',
    greenShade: '#c6f0a2',
    plat: '#7ed24f',
    platDark: '#4a942c',
    blue: '#5fb0ee',
    blueDark: '#2b7cc0',
    tan: '#e6b078',
    tanDark: '#a9743c',
    yellow: '#ffd23f',
    yellowDark: '#d99b00',
    red: '#ff6b6b',
    redDark: '#c93b3b',
    teal: '#4ecdc4',
    tealDark: '#2a9d94',
    purple: '#b18bff',
    purpleDark: '#7a4bd6',
    coin: '#ffce3a',
    coinDark: '#d99b00',
    white: '#fffefb'
  });

  const FONT = '"Comic Sans MS", "Segoe Print", "Bradley Hand", cursive';

  /* ------------------------------------------------------------------ *
   * hand-drawn primitives
   * ------------------------------------------------------------------ */

  function jitter(pts, seed, amp) {
    const out = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
      out[i] = [
        pts[i][0] + (U.hash(seed + i * 1.73) - 0.5) * amp,
        pts[i][1] + (U.hash(seed + i * 3.11 + 57) - 0.5) * amp
      ];
    }
    return out;
  }

  function trace(ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  }

  /** Stroke a wobbly path through pts. */
  function rough(ctx, pts, seed, amp, close) {
    trace(ctx, jitter(pts, seed, amp == null ? 1.3 : amp), !!close);
    ctx.stroke();
  }

  /** Fill + wobbly outline. */
  function shape(ctx, pts, fill, ink, lw, seed, amp, close) {
    const p = jitter(pts, seed, amp == null ? 1.3 : amp);
    trace(ctx, p, close !== false);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (ink) {
      ctx.lineWidth = lw || 2.6;
      ctx.strokeStyle = ink;
      ctx.stroke();
    }
  }

  function rectPts(x, y, w, h, per) {
    const n = per || 4;
    const pts = [];
    const stepX = w / n;
    const stepY = h / n;
    for (let i = 0; i < n; i++) pts.push([x + i * stepX, y]);
    for (let i = 0; i < n; i++) pts.push([x + w, y + i * stepY]);
    for (let i = 0; i < n; i++) pts.push([x + w - i * stepX, y + h]);
    for (let i = 0; i < n; i++) pts.push([x, y + h - i * stepY]);
    return pts;
  }

  function roundRectPts(x, y, w, h, r, per) {
    const n = per || 2;
    const rad = Math.min(r, w / 2, h / 2);
    const pts = [];
    const corners = [
      [x + w - rad, y + rad, -Math.PI / 2, 0],
      [x + w - rad, y + h - rad, 0, Math.PI / 2],
      [x + rad, y + h - rad, Math.PI / 2, Math.PI],
      [x + rad, y + rad, Math.PI, (3 * Math.PI) / 2]
    ];
    for (let c = 0; c < 4; c++) {
      const corner = corners[c];
      for (let i = 0; i <= n; i++) {
        const a = corner[2] + ((corner[3] - corner[2]) * i) / n;
        pts.push([corner[0] + Math.cos(a) * rad, corner[1] + Math.sin(a) * rad]);
      }
    }
    return pts;
  }

  function ellipsePts(cx, cy, rx, ry, seg) {
    const n = seg || 16;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }

  function circle(ctx, cx, cy, r, fill, ink, lw, seed, amp, seg) {
    shape(ctx, ellipsePts(cx, cy, r, r, seg || 14), fill, ink, lw, seed, amp, true);
  }

  function line(ctx, x1, y1, x2, y2, color, lw, seed, amp) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 2.6;
    rough(ctx, [[x1, y1], [x2, y2]], seed || 1, amp == null ? 1.1 : amp, false);
  }

  /* ------------------------------------------------------------------ *
   * background
   * ------------------------------------------------------------------ */

  const CLOUDS = [];
  const SPARKS = [];
  const NOTES = [
    '9 + 10 = 19',
    'y = 2x + 1',
    'E = mc²',
    'π ≈ 3.14',
    '7 × 8 = 56',
    '√16 = 4',
    '100% GO UP!',
    '5 + 3 = 8',
    'a² + b² = c²',
    '2 + 2 = 5?'
  ];

  (function buildBackdrop() {
    for (let i = 0; i < 10; i++) {
      CLOUDS.push({
        x: 12 + U.hash(i * 3.13) * (W - 116),
        y: i * 250 + U.hash(i * 7.77) * 150,
        s: 0.65 + U.hash(i * 5.31) * 0.65,
        sp: 0.14 + U.hash(i * 2.21) * 0.2
      });
    }
    for (let i = 0; i < 16; i++) {
      SPARKS.push({
        x: 16 + U.hash(i * 9.41) * (W - 32),
        y: i * 165 + U.hash(i * 4.13) * 90,
        s: 0.6 + U.hash(i * 6.77) * 0.7,
        sp: 0.3 + U.hash(i * 8.53) * 0.3
      });
    }
  })();

  function wrapY(y, span) {
    return ((y % span) + span) % span - 150;
  }

  function drawCloud(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineWidth = 2.4;
    shape(ctx, [
      [-46, 6], [-44, -6], [-30, -14], [-18, -8], [-8, -20],
      [6, -22], [18, -10], [32, -14], [44, -4], [46, 6]
    ], 'rgba(255,255,255,0.92)', C.gridMajor, 2.4, 31, 1.1, false);
    line(ctx, -46, 6, 46, 6, C.gridMajor, 2.2, 47);
    ctx.restore();
  }

  function drawSpark(ctx, x, y, s, t) {
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.4 + x * 0.05);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = 0.5 * pulse;
    shape(
      ctx,
      [[0, -14], [3.5, -3.5], [14, 0], [3.5, 3.5], [0, 14], [-3.5, 3.5], [-14, 0], [-3.5, -3.5]],
      C.yellow,
      C.yellowDark,
      2,
      73,
      0.8,
      true
    );
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function background(ctx, camY, t) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    const cell = 40;
    const off = ((camY * 0.5) % cell + cell) % cell;

    ctx.lineWidth = 1;
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    for (let x = 0; x <= W; x += cell) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = -cell; y <= H; y += cell) {
      ctx.moveTo(0, y + off);
      ctx.lineTo(W, y + off);
    }
    ctx.stroke();

    ctx.strokeStyle = C.gridMajor;
    ctx.beginPath();
    for (let x = 0; x <= W; x += cell * 4) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = -cell * 4; y <= H; y += cell * 4) {
      ctx.moveTo(0, y + off);
      ctx.lineTo(W, y + off);
    }
    ctx.stroke();

    // notebook margin
    ctx.strokeStyle = C.margin;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(30, H);
    ctx.stroke();

    const cloudSpan = 10 * 250;
    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      const y = wrapY(c.y - camY * c.sp, cloudSpan);
      if (y > -120 && y < H + 120) drawCloud(ctx, c.x, y, c.s);
    }

    const sparkSpan = 16 * 165;
    for (let i = 0; i < SPARKS.length; i++) {
      const s = SPARKS[i];
      const y = wrapY(s.y - camY * s.sp, sparkSpan);
      if (y > -60 && y < H + 60) drawSpark(ctx, s.x, y, s.s, t);
    }

    const noteSpan = NOTES.length * 340;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = C.ink;
    for (let i = 0; i < NOTES.length; i++) {
      const sp = 0.5;
      const y = wrapY(i * 340 + 120 - camY * sp, noteSpan);
      if (y > -40 && y < H + 40) {
        ctx.save();
        ctx.translate(70 + ((i * 137) % (W - 140)), y);
        ctx.rotate(((i % 5) - 2) * 0.06);
        ctx.font = '17px ' + FONT;
        ctx.fillText(NOTES[i], 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  let vignette = null;

  function drawVignette(ctx) {
    if (!vignette) {
      vignette = document.createElement('canvas');
      vignette.width = W;
      vignette.height = H;
      const vc = vignette.getContext('2d');
      const g = vc.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.78);
      g.addColorStop(0, 'rgba(63,58,51,0)');
      g.addColorStop(1, 'rgba(63,58,51,0.13)');
      vc.fillStyle = g;
      vc.fillRect(0, 0, W, H);
    }
    ctx.drawImage(vignette, 0, 0);
  }

  /* ------------------------------------------------------------------ *
   * platforms
   * ------------------------------------------------------------------ */

  function drawHatch(ctx, x, y, w, h, color, seed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const hx = x + 10 + i * (w - 26) * 0.6;
      rough(ctx, [[hx, y + h - 4], [hx + 6, y + 4]], seed + i * 5, 0.8, false);
    }
  }

  function drawSpringTop(ctx, pf) {
    const lift = 24 * (1 - (pf.press || 0));
    const topY = pf.y - lift;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const coils = 3;
    const w = pf.w * 0.52;
    const cx = pf.x + pf.w / 2;
    const steps = coils * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = cx - w / 2 + t * w;
      const y = pf.y - 2 - t * (lift - 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    shape(ctx, roundRectPts(cx - w / 2 - 8, topY - 8, w + 16, 9, 4, 2), C.red, C.ink, 2.6, pf.seed, 1, true);
  }

  function drawPlatform(ctx, pf, t) {
    const alpha = pf.fade == null ? 1 : pf.fade;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    let fill = C.plat;
    let dark = C.platDark;
    let seed = pf.seed;
    if (pf.type === 'moving') {
      fill = C.blue;
      dark = C.blueDark;
    } else if (pf.type === 'fragile') {
      fill = C.tan;
      dark = C.tanDark;
    }

    const press = pf.press || 0;
    const h = pf.h * (1 - press * 0.55);
    const w = pf.w * (1 + press * 0.08);

    shape(ctx, roundRectPts(pf.x, pf.y, w, h, 6, 2), fill, C.ink, 2.8, seed, 1.2, true);
    drawHatch(ctx, pf.x, pf.y, w, h, dark, seed + 11);

    if (pf.type === 'fragile') {
      ctx.strokeStyle = 'rgba(63,58,51,0.55)';
      ctx.lineWidth = 1.8;
      rough(ctx, [[pf.x + w * 0.42, pf.y + 1], [pf.x + w * 0.5, pf.y + h * 0.5], [pf.x + w * 0.4, pf.y + h - 1]], seed + 21, 0.7, false);
      rough(ctx, [[pf.x + w * 0.52, pf.y + h * 0.5], [pf.x + w * 0.66, pf.y + h - 1]], seed + 31, 0.7, false);
    }

    if (pf.type === 'moving') {
      const dir = pf.dir;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.6;
      const off = ((t * pf.speed * 0.35) % 16) - 16;
      for (let i = 0; i < 3; i++) {
        const bx = pf.x + w * (0.24 + i * 0.26) + (dir > 0 ? off : -off);
        rough(
          ctx,
          [
            [bx - 5 * dir, pf.y + 3],
            [bx + 3 * dir, pf.y + h / 2],
            [bx - 5 * dir, pf.y + h - 3]
          ],
          seed + i * 13,
          0.6,
          false
        );
      }
    }

    if (pf.type === 'spring') drawSpringTop(ctx, pf);

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * items
   * ------------------------------------------------------------------ */

  function drawCoin(ctx, coin, t) {
    const spin = Math.abs(Math.cos(t * 2.4 + coin.phase));
    const sx = Math.max(0.14, spin);
    ctx.save();
    ctx.translate(coin.x, coin.y + Math.sin(t * 2.2 + coin.phase) * 2.5);
    ctx.scale(sx, 1);
    circle(ctx, 0, 0, coin.r, C.coin, C.coinDark, 2.4, coin.seed, 0.9, 14);
    ctx.globalAlpha *= 0.5;
    circle(ctx, 0, 0, coin.r * 0.62, null, C.coinDark, 1.6, coin.seed + 5, 0.6, 12);
    ctx.globalAlpha /= 0.5;
    // little sparkle instead of a glyph: reads cleanly at 18px
    ctx.fillStyle = C.coinDark;
    shape(
      ctx,
      [[0, -6], [1.8, -1.8], [6, 0], [1.8, 1.8], [0, 6], [-1.8, 1.8], [-6, 0], [-1.8, -1.8]],
      C.coinDark,
      null,
      0,
      coin.seed + 9,
      0.4,
      true
    );
    ctx.restore();
  }

  function badgeBase(ctx, x, y, size, fill, dark, seed) {
    const h = size / 2;
    shape(ctx, roundRectPts(x - h, y - h, size, size, 8, 2), fill, C.ink, 2.8, seed, 1.1, true);
    shape(ctx, roundRectPts(x - h + 4, y - h + 4, size - 8, 5, 2.5, 1), 'rgba(255,255,255,0.5)', null, 0, seed, 0.6, true);
    return dark;
  }

  function drawPowerup(ctx, pu, t) {
    const bob = Math.sin(t * 3 + pu.phase) * 4;
    ctx.save();
    ctx.translate(pu.x, pu.y + bob);
    ctx.rotate(Math.sin(t * 1.6 + pu.phase) * 0.12);

    if (pu.type === 'spring') {
      badgeBase(ctx, 0, 0, 32, C.yellow, C.yellowDark, pu.seed);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-9, 9);
      ctx.lineTo(-4, 1);
      ctx.lineTo(4, 6);
      ctx.lineTo(9, -4);
      ctx.stroke();
      line(ctx, -11, -8, 11, -8, C.ink, 2.8, pu.seed + 3);
    } else if (pu.type === 'jet') {
      badgeBase(ctx, 0, 0, 32, C.red, C.redDark, pu.seed);
      shape(ctx, roundRectPts(-5, -11, 10, 15, 3, 2), C.white, C.ink, 2.2, pu.seed + 2, 0.8, true);
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.moveTo(-4, 5);
      ctx.lineTo(0, 13 + Math.sin(t * 14) * 2);
      ctx.lineTo(4, 5);
      ctx.closePath();
      ctx.fill();
    } else if (pu.type === 'shield') {
      badgeBase(ctx, 0, 0, 32, C.teal, C.tealDark, pu.seed);
      shape(
        ctx,
        [[0, -11], [9, -6], [9, 3], [0, 12], [-9, 3], [-9, -6]],
        C.white,
        C.ink,
        2.2,
        pu.seed + 4,
        0.8,
        true
      );
    } else {
      badgeBase(ctx, 0, 0, 32, C.purple, C.purpleDark, pu.seed);
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 4.4;
      ctx.beginPath();
      ctx.arc(0, 1, 7, Math.PI, 0);
      ctx.stroke();
      line(ctx, -7, 1, -7, 7, C.white, 4.4, pu.seed + 6, 0.4);
      line(ctx, 7, 1, 7, 7, C.white, 4.4, pu.seed + 7, 0.4);
      line(ctx, -7, 7, -3, 7, C.ink, 2, pu.seed + 8, 0.3);
      line(ctx, 7, 7, 3, 7, C.ink, 2, pu.seed + 9, 0.3);
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * player
   * ------------------------------------------------------------------ */

  function drawPlayer(ctx, p, t) {
    const cx = p.x + p.w / 2;
    const by = p.y + p.h;

    ctx.save();
    ctx.translate(cx, by);
    if (p.rot) ctx.rotate(p.rot);
    ctx.rotate(p.tilt);
    ctx.scale(p.squashX * 1.1, p.squashY * 1.1);

    if (p.jet > 0) {
      // jetpack canister behind the body
      const flick = 1 + Math.sin(t * 30) * 0.12;
      shape(ctx, roundRectPts(-9, -34, 18, 22, 5, 2), C.red, C.ink, 2.6, 88, 0.9, true);
      const flame = 16 * flick * p.jetFade;
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.moveTo(-6, -13);
      ctx.lineTo(0, -13 + flame);
      ctx.lineTo(6, -13);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,60,0.75)';
      ctx.beginPath();
      ctx.moveTo(-3.5, -13);
      ctx.lineTo(0, -13 + flame * 0.5);
      ctx.lineTo(3.5, -13);
      ctx.closePath();
      ctx.fill();
    }

    // body
    const body = ellipsePts(0, -23, 17, 24, 18);
    shape(ctx, body, C.green, C.ink, 2.8, 13, 1.1, true);
    // belly shade
    ctx.save();
    ctx.globalAlpha = 0.55;
    shape(ctx, ellipsePts(0, -12, 12, 9, 12), C.greenShade, null, 0, 29, 0.8, true);
    ctx.restore();

    // arms
    const swing = Math.sin(t * 6) * (p.onGround ? 0 : 2) + (p.jet > 0 ? -8 : 0);
    line(ctx, -16, -26, -24, -14 + swing, C.ink, 2.8, 41, 0.9);
    line(ctx, 16, -26, 24, -14 - swing, C.ink, 2.8, 43, 0.9);

    // feet
    shape(ctx, ellipsePts(-8, -3, 6, 4.2, 10), C.green, C.ink, 2.4, 53, 0.7, true);
    shape(ctx, ellipsePts(8, -3, 6, 4.2, 10), C.green, C.ink, 2.4, 59, 0.7, true);

    // eyes
    const look = p.look * 2.2;
    circle(ctx, -6.5, -30, 6, C.white, C.ink, 2.2, 67, 0.7, 12);
    circle(ctx, 6.5, -30, 6, C.white, C.ink, 2.2, 71, 0.7, 12);
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(-6.5 + look, -30 + 0.6, 2.6, 0, Math.PI * 2);
    ctx.arc(6.5 + look, -30 + 0.6, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // smile
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (p.jet > 0) {
      ctx.arc(0, -21, 5, 0, Math.PI * 2);
    } else {
      ctx.arc(0, -24, 6.5, 0.25 * Math.PI, 0.75 * Math.PI);
    }
    ctx.stroke();

    // cheeks
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(-11, -24, 3.2, 0, Math.PI * 2);
    ctx.arc(11, -24, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();

    if (p.shield > 0) {
      ctx.save();
      ctx.translate(cx, p.y + p.h / 2);
      const pulse = 0.9 + Math.sin(t * 8) * 0.06;
      ctx.scale(pulse, pulse);
      ctx.globalAlpha = 0.26 + 0.12 * Math.sin(t * 8);
      circle(ctx, 0, 0, 35, C.teal, C.teal, 2.4, 91, 1.2, 16);
      ctx.globalAlpha = 0.95;
      circle(ctx, 0, 0, 35, null, C.tealDark, 2.8, 93, 1.4, 16);
      // rotating dashes
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -t * 26;
      circle(ctx, 0, 0, 35, null, C.white, 3, 95, 0, 20);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ *
   * overlays drawn on canvas
   * ------------------------------------------------------------------ */

  function drawArrow(ctx, x, y, dir, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    shape(
      ctx,
      [[-16, -20], [4, -20], [4, -30], [20, 0], [4, 30], [4, 20], [-16, 20]],
      'rgba(255,255,255,0.75)',
      C.ink,
      2.6,
      97,
      1.2,
      true
    );
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawHint(ctx, alpha, t) {
    const bob = Math.sin(t * 3) * 5;
    drawArrow(ctx, 58, H - 150 + bob, -1, alpha);
    drawArrow(ctx, W - 58, H - 150 - bob, 1, alpha);
  }

  function drawCentered(ctx, text, y, size, color) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + size + 'px ' + FONT;
    ctx.lineWidth = size * 0.22;
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeText(text, W / 2, y);
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, y);
    ctx.restore();
  }

  function drawPaused(ctx) {
    ctx.fillStyle = 'rgba(63,58,51,0.42)';
    ctx.fillRect(0, 0, W, H);
    drawCentered(ctx, 'PAUSED', H / 2 - 12, 46, C.ink);
    drawCentered(ctx, 'press P to keep going', H / 2 + 30, 17, C.ink);
  }

  G.art = {
    colors: C,
    FONT,
    rough,
    shape,
    rectPts,
    ellipsePts,
    circle,
    line,
    background,
    drawVignette,
    drawPlatform,
    drawCoin,
    drawPowerup,
    drawPlayer,
    drawHint,
    drawPaused,
    drawCentered
  };
})(window.GOUP);
