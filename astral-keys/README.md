# Astral Keys — The Sound of Starlight

An interactive musical star map. Every star in the sky has a real,
approximate distance from Earth. Click it, and that distance becomes a
musical note. Nearby stars sound low; distant stars sound high. Click a
constellation and hear all of its stars as a chord. Draw your own
constellation and give it a name.

This is not an astronomy simulator. It's a calm, playable instrument
built out of a night sky — closer to a planetarium crossed with a music
box than a scientific tool.

---

## Features

- A curated, real Northern Hemisphere and Southern Hemisphere sky, with
  real star names, real approximate distances, and real constellation
  groupings.
- **Plain Sky** mode — hover and click individual stars to hear their note.
- **Constellations** mode — see traditional constellation lines and
  names; click one to hear its stars as a chord.
- **Create** mode — build your own constellation by clicking stars in
  order, undo or clear your work, play the chord, and name and save it
  for the rest of your browser session.
- **Record a shareable clip** — turn any saved constellation into a
  square, downloadable video: its stars connect one by one, then its
  chord swells in as they all glow together. No screen-share prompt
  needed - it's captured straight from a canvas with its own synthesised
  audio track.
- Pan (click-and-drag) and zoom (scroll wheel or on-screen buttons).
- A soft, warm, piano-inspired synthesised instrument (Web Audio API —
  no sound files needed).
- Volume control and a reduced-motion setting.
- Keyboard-accessible star interaction (Tab to a star, Enter/Space to
  play it).
- Designed to be embedded: resizable container, works in an iframe or
  a draggable window, no fixed full-screen assumptions.

---

## Controls

| Action | How |
|---|---|
| Hear a star | Click it (or Tab to focus it, then Enter/Space) |
| See star info | Hover it, or focus it with the keyboard |
| Switch sky | Hemisphere dropdown, top-right of the header |
| Change mode | Plain Sky / Constellations / Create buttons |
| Pan the sky | Click and drag empty space |
| Zoom | Scroll wheel, or the **+ / − / Reset** buttons |
| Hear a constellation chord | Constellations mode → click its lines or name |
| Build a constellation | Create mode → click stars in order |
| Undo last star | **Undo** button in the Create panel |
| Clear in-progress constellation | **Clear** button (asks for confirmation) |
| Save a constellation | **Finish** → name it → **Save Constellation** |
| Record a shareable clip | After saving → **Record a Clip**, or the microphone icon next to any saved constellation |
| Replay a saved constellation | Click it in "My Constellations" (top-right) |
| Adjust volume / motion | ⚙ settings button, top-right |

---

## Running locally

No build step, no dependencies. Just open the file:

```
astral-keys/index.html
```

directly in Chrome, Edge, Firefox, or Safari. (Opening it via a local
static server such as `python3 -m http.server` also works, and is
sometimes preferable in browsers that restrict local file access.)

---

## Folder structure

```
astral-keys/
├── index.html                 The single HTML page and app shell
├── README.md
│
├── css/
│   ├── main.css                Design tokens, layout, header, panels
│   ├── sky.css                 Stars, glows, twinkle, constellation lines
│   └── controls.css            Buttons, sliders, overlays, responsiveness
│
├── js/
│   ├── app.js                  Entry point — start here when reading the code
│   ├── state.js                The single shared "what's happening now" object
│   ├── sky-renderer.js         Builds the SVG sky (stars + constellation lines)
│   ├── star-interactions.js    Hover tooltip, click/keyboard activation
│   ├── audio-engine.js         Distance → note, and the Web Audio synth
│   ├── constellation-manager.js  Recognised-constellation selection & chords
│   ├── creation-manager.js     Custom constellation building, saving, undo
│   ├── recorder.js             Records a saved constellation as a downloadable clip
│   └── ui-manager.js           Renders every panel/control from the state
│
├── data/
│   ├── northern-stars.js
│   ├── southern-stars.js
│   ├── northern-constellations.js
│   └── southern-constellations.js
│
└── assets/
    └── icons/                  (reserved for future custom icon assets)
```

Every file has extensive comments explaining what it does, how, and
why — the project is intended to be easy to read for anyone learning
JavaScript.

---

## How the star data is organised

Each interactive star (in `data/northern-stars.js` / `southern-stars.js`)
is a plain object:

```js
{
  id: "betelgeuse",
  name: "Betelgeuse",
  designation: "Alpha Orionis",
  hemisphere: "northern",
  x: 560, y: 120,              // position on a 1000x600 map
  distanceLightYears: 548,
  brightness: 0.95,
  colourTemperature: "warm",   // "warm" | "cool" | "neutral"
  constellation: "orion",      // or null if it isn't part of a drawn constellation
}
```

Constellations (in `data/northern-constellations.js` /
`southern-constellations.js`) are kept in a **separate file** from the
stars themselves:

```js
{
  id: "orion",
  name: "Orion",
  hemisphere: "northern",
  starIds: ["betelgeuse", "bellatrix", "alnitak", /* ... */],
  lines: [["betelgeuse", "bellatrix"], ["betelgeuse", "alnitak"], /* ... */],
  labelPosition: { x: 615, y: 200 },
}
```

Keeping these separate means you can add, remove, or reshape a
constellation without touching any star's own data, as long as it
reuses existing star ids.

A smaller number of scattered "background" stars exist purely for
atmosphere — they're generated randomly at runtime in
`sky-renderer.js` rather than stored as data, since they don't need
names, distances, or interactivity.

---

## How musical notes are generated

Notes are **never stored** in the data files — they're calculated live
from each star's distance, in `js/audio-engine.js`:

1. The app finds the closest and furthest star across **both**
   hemispheres combined, so a star always sounds the same note
   regardless of which sky is currently loaded.
2. A star's distance is compared on a **logarithmic** scale against
   that closest/furthest range (astronomical distances span several
   orders of magnitude, so a straight linear mapping would waste most
   of the musical range on a handful of very distant stars).
3. The result is snapped onto the nearest note of a **pentatonic
   scale** (C, D, E, G, A across three octaves), which guarantees any
   combination of stars sounds harmonious together.
4. That note name (e.g. `"G3"`) is converted to a frequency in Hz using
   standard equal-temperament tuning, and played through the Web Audio
   API with a gentle attack and a smooth, piano-like release.

Because the note is calculated rather than stored, you can retune the
whole app (different scale, different octave range, a different
attack/release feel) by editing `audio-engine.js` alone.

---

## Customising the app

**Stars** — edit `data/northern-stars.js` / `southern-stars.js`. Add a
new object following the existing shape; `x`/`y` are on a 1000×600
canvas. Leave `constellation: null` for a standalone star.

**Constellations** — edit `data/northern-constellations.js` /
`southern-constellations.js`. `starIds` lists membership; `lines` lists
which pairs get connected; `labelPosition` places the name.

**Sounds** — edit `js/audio-engine.js`:
- `PENTATONIC_NOTES` — the available notes/range.
- `playNote()` — oscillator type, attack/release timing, harmonic layer.

**Colours** — edit the CSS custom properties at the top of
`css/main.css` (`:root { ... }`). Every other stylesheet reads from
these variables, so changing them re-themes the whole app.

**Animations** — twinkle timing lives in `sky-renderer.js`
(`twinkleDuration`/`twinkleDelay`) and `css/sky.css`
(`@keyframes twinkle`, `star-pulse-core`, `star-pulse-halo`). The
in-app "Reduce star animation" setting and the OS-level
`prefers-reduced-motion` setting are both respected automatically.

**Saved constellations persistence** — Version 1 intentionally keeps
saved constellations in memory only (they're lost on refresh), to keep
the initial scope honest and simple. To make them persist on a single
device, you could swap the plain array in `appState.savedConstellations`
(see `js/state.js`) for reads/writes to `localStorage` inside
`js/creation-manager.js`.

---

## Embedding Astral Keys elsewhere

The whole app lives inside one container:

```css
.astral-keys-app {
  width: 100%;
  height: 700px;
  min-height: 500px;
}
```

Just change those numbers (in `css/main.css`) to resize it. The app:

- Runs standalone by opening `index.html`.
- Can be embedded directly inside another page (copy the `astral-keys/`
  folder in, then include its CSS/JS as `index.html` does, or embed the
  whole page via `<iframe src="astral-keys/index.html">`).
- Works inside a draggable/resizable portfolio window, since nothing in
  the app assumes it fills the screen or has a fixed position.

---

## Recording and sharing a constellation

Any saved constellation can become a short, square (1:1) video clip:
its stars connect one by one, then its chord swells in as they all
glow together, with its name displayed and a small watermark.

**How it works, technically:** rather than asking for screen-share
permission (`getDisplayMedia`, which requires the person to pick a
window/tab every time), the animation is drawn directly onto a
`<canvas>`. `canvas.captureStream()` turns that into a live video
track, and the chord's audio is routed into a
`MediaStreamAudioDestinationNode` at the same time - both are combined
into one stream and recorded with `MediaRecorder`. No permission
dialog, no risk of capturing the wrong window.

**Format note:** Chrome, Firefox, and Edge's `MediaRecorder` produce
`.webm` video (not `.mp4`) - Safari's support varies. `.webm` plays
natively in every modern browser and uploads fine to Instagram,
Twitter/X, TikTok, Discord, etc. Getting guaranteed `.mp4` output would
require bundling a large transcoding library (like ffmpeg.wasm, tens of
megabytes), which felt like the wrong trade-off for this project's
"lightweight, no framework" spirit - see `js/recorder.js` if you'd like
to add that later.

To change the clip's pacing or look, the constants at the top of
`js/recorder.js` (`REVEAL_STAR_INTERVAL`, `CHORD_HOLD`, `CANVAS_SIZE`,
etc.) and the `paint...()` drawing functions further down are the
places to start.

---

## Preparing this project for GitHub

1. Copy the `astral-keys/` folder into a new repository.
2. Everything is self-contained — there is no build step, no
   `package.json`, and no external dependencies to install.
3. Suggested `.gitignore` is minimal/optional since there's nothing
   generated to ignore; an empty repo with just this folder is enough.
4. Enable GitHub Pages (Settings → Pages → deploy from the branch root)
   to host it live directly from `index.html`.

---

## Browser support

Chrome, Edge, Firefox, and Safari (current versions). Desktop-first —
it will run in a narrower window without breaking, but it isn't
optimised for mobile touchscreens in this version.
