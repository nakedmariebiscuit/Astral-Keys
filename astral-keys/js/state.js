/*
  js/state.js
  -----------
  Astral Keys keeps ALL of its "what is happening right now" information
  in one place: the `appState` object below.

  Why do this?
  Instead of scattering flags and variables across many files (which
  quickly becomes confusing and buggy), every other module reads from
  and writes to this single object. This makes the app's behaviour much
  easier to reason about, debug, and extend.

  How to use it:
    - Read a value directly:      appState.mode
    - Change a value the "safe" way with `setState`, which also notifies
      any part of the app that asked to be told about changes:
        setState({ mode: "constellations" });

  Feel free to add new fields here if you extend the app - just remember
  that any code depending on the field should read it from `appState`,
  not keep its own private copy.
*/

const appState = {
  // Which hemisphere is currently loaded: "northern" | "southern"
  hemisphere: "northern",

  // Which interaction mode is active: "plain" | "constellations" | "create"
  mode: "plain",

  // The star currently focused/selected for its info panel (Plain Sky mode)
  selectedStarId: null,

  // The star currently under the mouse cursor or keyboard focus
  hoveredStarId: null,

  // The constellation currently selected in Constellation mode
  selectedConstellationId: null,

  // The constellation the user is actively drawing in Create mode.
  // Stored as an ordered array of star ids - order matters, since it
  // defines the connecting lines and the undo history.
  activeCustomConstellation: [],

  // Constellations the user has finished and named, kept only for the
  // current browser session (see js/creation-manager.js).
  savedConstellations: [],

  // Which saved custom constellation (if any) is currently being viewed
  viewingSavedConstellationId: null,

  // Pan and zoom for the star map
  zoom: 1,
  panX: 0,
  panY: 0,

  // User preferences
  volume: 0.7,
  reducedMotion: false,

  // Whether the Web Audio system has been unlocked by a user gesture yet.
  // Most browsers block sound until the user interacts with the page.
  audioEnabled: false,
};

// Anything that wants to know "the state changed, please re-render"
// pushes a function into this list with `subscribe()`.
const stateSubscribers = [];

/**
 * Call this to be notified whenever setState() is used.
 * @param {Function} callback - receives the full appState object.
 */
function subscribe(callback) {
  stateSubscribers.push(callback);
}

/**
 * The ONE function every module should use to change app state.
 * Merges `changes` into appState, then notifies every subscriber.
 * @param {Object} changes - partial state to merge in.
 */
function setState(changes) {
  Object.assign(appState, changes);
  stateSubscribers.forEach((callback) => callback(appState));
}
