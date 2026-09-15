/*
  js/app.js
  ---------
  The entry point. Runs once the page has loaded, in this order:
    1. Work out the shared distance range used for musical pitch.
    2. Grab DOM references and wire up UI event listeners.
    3. Draw the sky for the first time.
    4. Re-draw the parts of the sky that depend on which hemisphere is
       active whenever it changes.

  If you're reading this project for the first time, this is the best
  place to start - every other file is a supporting module referenced
  from here.
*/

document.addEventListener("DOMContentLoaded", () => {
  initialiseGlobalDistanceRange();
  initialiseUI();

  buildSkyForCurrentHemisphere();

  // Whenever the hemisphere changes, the background stars stay put (the
  // "atmosphere" doesn't need to change) but the interactive stars and
  // recognised constellation lines must be rebuilt for the new dataset.
  let lastHemisphere = appState.hemisphere;
  subscribe((state) => {
    if (state.hemisphere !== lastHemisphere) {
      lastHemisphere = state.hemisphere;
      buildSkyForCurrentHemisphere();
    }
  });
});

function buildSkyForCurrentHemisphere() {
  renderBackgroundStars(document.getElementById("background-stars-group"));
  renderConstellationLines(document.getElementById("constellation-lines-group"));
  renderInteractiveStars(document.getElementById("interactive-stars-group"));
}
