window.GOUP = window.GOUP || {};

(function (G) {
  'use strict';

  const input = (G.input = {
    left: false,
    right: false,
    axis: 0,
    confirm: false,
    restart: false,
    pause: false,
    mute: false,
    _keys: Object.create(null)
  });

  const LEFT = new Set(['ArrowLeft', 'a', 'A']);
  const RIGHT = new Set(['ArrowRight', 'd', 'D']);
  const CONFIRM = new Set([' ', 'Spacebar', 'Enter']);
  const PREVENT = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar'
  ]);

  function syncKeys() {
    const k = input._keys;
    let left = false;
    let right = false;
    for (const code in k) {
      if (!k[code]) continue;
      if (LEFT.has(code)) left = true;
      if (RIGHT.has(code)) right = true;
    }
    input.left = left || input._touchLeft;
    input.right = right || input._touchRight;
    input.axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  }

  function onKeyDown(e) {
    if (PREVENT.has(e.key)) e.preventDefault();
    input._keys[e.key] = true;

    if (CONFIRM.has(e.key) && !e.repeat) input.confirm = true;
    if ((e.key === 'r' || e.key === 'R') && !e.repeat) input.restart = true;
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && !e.repeat) input.pause = true;
    if ((e.key === 'm' || e.key === 'M') && !e.repeat) input.mute = true;

    G.audio.unlock();
    syncKeys();
  }

  function onKeyUp(e) {
    if (PREVENT.has(e.key)) e.preventDefault();
    input._keys[e.key] = false;
    syncKeys();
  }

  function onBlur() {
    for (const code in input._keys) input._keys[code] = false;
    input._touchLeft = false;
    input._touchRight = false;
    syncKeys();
  }

  let pointerAxis = 0;

  function pointerDir(clientX) {
    const rect = G.canvas.getBoundingClientRect();
    if (!rect.width) return 0;
    const x = (clientX - rect.left) / rect.width;
    if (x < 0.34) return -1;
    if (x > 0.66) return 1;
    return 0;
  }

  function bindPointer() {
    const canvas = G.canvas;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', (e) => {
      G.audio.unlock();
      pointerAxis = pointerDir(e.clientX);
      input.left = pointerAxis < 0 || input._touchLeft;
      input.right = pointerAxis > 0 || input._touchRight;
      input.axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      canvas.setPointerCapture && e.pointerId != null && canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      pointerAxis = pointerDir(e.clientX);
      input.left = pointerAxis < 0 || input._touchLeft;
      input.right = pointerAxis > 0 || input._touchRight;
      input.axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    });

    const release = () => {
      pointerAxis = 0;
      input.left = !!input._touchLeft;
      input.right = !!input._touchRight;
      input.axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    };

    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function bindTouchButton(el, name) {
    if (!el) return;
    const set = (on) => {
      input['_' + name] = on;
      syncKeys();
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      G.audio.unlock();
      set(true);
    });
    el.addEventListener('pointerup', (e) => {
      e.preventDefault();
      set(false);
    });
    el.addEventListener('pointerleave', () => set(false));
    el.addEventListener('pointercancel', () => set(false));
  }

  G.input = Object.assign(input, {
    init(els) {
      window.addEventListener('keydown', onKeyDown, { passive: false });
      window.addEventListener('keyup', onKeyUp, { passive: false });
      window.addEventListener('blur', onBlur);
      bindPointer();
      bindTouchButton(els.left, 'touchLeft');
      bindTouchButton(els.right, 'touchRight');
    },
    /** Consume one-shot flags. */
    take() {
      const flags = {
        confirm: input.confirm,
        restart: input.restart,
        pause: input.pause,
        mute: input.mute
      };
      input.confirm = false;
      input.restart = false;
      input.pause = false;
      input.mute = false;
      return flags;
    },
    clear() {
      input.confirm = false;
      input.restart = false;
      input.pause = false;
      input.mute = false;
    },
    setTouchVisible(v) {
      input._touchVisible = v;
    }
  });
})(window.GOUP);
