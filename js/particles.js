window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const U = G.utils;
  const parts = [];
  const texts = [];

  function spawn(o) {
    if (parts.length > 260) parts.shift();
    parts.push({
      x: o.x,
      y: o.y,
      vx: o.vx || 0,
      vy: o.vy || 0,
      grav: o.grav == null ? 900 : o.grav,
      drag: o.drag == null ? 0.6 : o.drag,
      life: 0,
      max: o.life || 0.5,
      size: o.size || 4,
      endSize: o.endSize == null ? 0 : o.endSize,
      color: o.color || '#3f3a33',
      kind: o.kind || 'dot',
      rot: o.rot || 0,
      vr: o.vr || 0,
      wobble: o.wobble || 0
    });
  }

  function burst(x, y, count, o) {
    for (let i = 0; i < count; i++) {
      const a = U.rand(0, Math.PI * 2);
      const s = U.rand(o.speedMin || 40, o.speedMax || 190);
      spawn(
        Object.assign({}, o, {
          x: x + U.rand(-4, 4),
          y: y + U.rand(-4, 4),
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - (o.lift || 0),
          life: U.rand(o.lifeMin || 0.28, o.lifeMax || 0.6),
          size: U.rand(o.sizeMin || 3, o.sizeMax || 6),
          rot: U.rand(0, 6.28),
          vr: U.rand(-9, 9)
        })
      );
    }
  }

  function popup(x, y, text, color) {
    texts.push({ x, y, text, color: color || '#3f3a33', life: 0, max: 0.75 });
  }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life >= p.max) {
        parts.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }

    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life += dt;
      t.y -= 46 * dt;
      if (t.life >= t.max) texts.splice(i, 1);
    }
  }

  function draw(ctx) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const k = p.life / p.max;
      const size = U.lerp(p.size, p.endSize, k);
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = p.color;

      if (p.kind === 'square') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.restore();
      } else if (p.kind === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
          const r = s % 2 ? size * 0.44 : size;
          const a = (s / 8) * Math.PI * 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, size), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      const k = t.life / t.max;
      ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      ctx.font = 'bold 20px "Comic Sans MS", "Segoe Print", cursive';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  G.particles = {
    spawn,
    burst,
    popup,
    update,
    draw,
    clear() {
      parts.length = 0;
      texts.length = 0;
    }
  };
})(window.GOUP);
