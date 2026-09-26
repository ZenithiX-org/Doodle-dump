# Go Up!

A Doodle Jump-style vertical platformer that runs in the browser. No build step, no
dependencies — open `index.html` in a browser and play.

## Play

Open `index.html` (double-click works), then:

| Input | Action |
| --- | --- |
| `←` `→` or `A` `D` | steer |
| hold left/right screen side | steer (touch) |
| `Space` / `Enter` | start & restart |
| `R` | restart |
| `P` / `Esc` | pause |
| `M` | mute |

You jump automatically. Score is height plus coins; the high score is saved in
`localStorage`.

## Rules of the climb

- **Spring** — huge bounce. **Jetpack** — fly up for a couple of seconds.
- **Shield** — survives one fall and drops you back on a platform.
- **Magnet** — coins drift into you.
- Platforms get meaner as you climb: gaps widen, then moving and breakable
  platforms start appearing. Falling off the bottom ends the run.

## Layout

```
index.html          markup + overlay screens
css/style.css       doodle UI styling
js/utils.js         math, RNG, storage, canvas size
js/audio.js         procedural WebAudio sound effects
js/input.js         keyboard + touch/pointer input
js/particles.js     particle & floating-text effects
js/art.js           hand-drawn rendering (paper, character, platforms, items)
js/entities.js      player physics, platform, coin, power-up
js/level.js         procedural generation & difficulty curve
js/ui.js            HUD, screens, high score
js/game.js          game loop, collisions, camera, scoring
```
