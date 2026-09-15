/*
  js/creation-manager.js
  -----------------------
  Everything about Create Mode: building a custom constellation star by
  star, undoing/clearing, naming and saving it, and re-playing anything
  saved earlier in this browser session.

  Saved constellations intentionally live only in memory (the
  `appState.savedConstellations` array) rather than localStorage, matching
  the "temporary, session-only" scope agreed for Version 1 - see the
  architecture document, section 17, and the README for how to upgrade
  this later if you want constellations to survive a page refresh.
*/

const MAX_CUSTOM_CONSTELLATION_STARS = 8;
const MIN_CUSTOM_CONSTELLATION_STARS = 2;
const CONSTELLATION_NAME_CHAR_LIMIT = 30;

/**
 * Adds a star to the constellation currently being drawn, unless it is
 * already in it or the maximum has been reached.
 */
function addStarToCustomConstellation(starId) {
  const current = appState.activeCustomConstellation;

  if (current.includes(starId)) {
    showCreationFeedback(`This constellation already includes ${findStarById(starId).name}.`);
    return;
  }

  if (current.length >= MAX_CUSTOM_CONSTELLATION_STARS) {
    showCreationFeedback(`You can select up to ${MAX_CUSTOM_CONSTELLATION_STARS} stars.`);
    return;
  }

  setState({ activeCustomConstellation: [...current, starId] });
}

/** Removes the most recently added star from the in-progress constellation. */
function undoLastCustomStar() {
  const current = appState.activeCustomConstellation;
  if (current.length === 0) return;
  setState({ activeCustomConstellation: current.slice(0, -1) });
}

/** Clears the entire in-progress custom constellation. */
function clearCustomConstellation() {
  setState({ activeCustomConstellation: [] });
}

/** Plays the in-progress (not-yet-named) constellation as a chord. */
function playActiveCustomConstellationChord() {
  const starIds = appState.activeCustomConstellation;
  if (starIds.length < MIN_CUSTOM_CONSTELLATION_STARS) {
    showCreationFeedback("Select at least two stars first.");
    return;
  }
  if (!appState.audioEnabled) unlockAudio();

  const notes = starIds
    .map(findStarById)
    .filter(Boolean)
    .map((star) => ({ note: distanceToNote(star.distanceLightYears), colourTemperature: star.colourTemperature }));
  playChord(notes);
}

/**
 * Finalises the in-progress constellation under a given name and adds
 * it to the session's saved list. Falls back to a default name if the
 * field was left blank.
 * @param {string} rawName
 */
function saveCustomConstellation(rawName) {
  const starIds = appState.activeCustomConstellation;
  if (starIds.length < MIN_CUSTOM_CONSTELLATION_STARS) {
    showCreationFeedback("Select at least two stars first.");
    return false;
  }

  const trimmedName = rawName.trim().slice(0, CONSTELLATION_NAME_CHAR_LIMIT);
  const name = trimmedName.length > 0 ? trimmedName : "Untitled Constellation";

  const savedConstellation = {
    id: `custom-${Date.now()}`,
    name,
    hemisphere: appState.hemisphere,
    starIds: [...starIds],
  };

  setState({
    savedConstellations: [...appState.savedConstellations, savedConstellation],
    activeCustomConstellation: [],
    viewingSavedConstellationId: savedConstellation.id,
  });

  return true;
}

/** Plays a previously-saved custom constellation's chord. */
function playSavedConstellationChord(savedConstellationId) {
  const saved = appState.savedConstellations.find((c) => c.id === savedConstellationId);
  if (!saved) return;
  if (!appState.audioEnabled) unlockAudio();

  const notes = saved.starIds
    .map(findStarById)
    .filter(Boolean)
    .map((star) => ({ note: distanceToNote(star.distanceLightYears), colourTemperature: star.colourTemperature }));
  playChord(notes);
}

/**
 * Selects a saved constellation for viewing on the map (draws its
 * lines and highlights its stars, without editing it).
 */
function viewSavedConstellation(savedConstellationId) {
  setState({ viewingSavedConstellationId: savedConstellationId });
}

/* ------------------------------------------------------------------ */
/*  Small inline feedback messages (architecture doc section 26)       */
/* ------------------------------------------------------------------ */

let creationFeedbackElement = null;
let feedbackTimeoutId = null;

function initialiseCreationFeedback(element) {
  creationFeedbackElement = element;
}

function showCreationFeedback(message) {
  if (!creationFeedbackElement) return;
  creationFeedbackElement.textContent = message;
  creationFeedbackElement.classList.add("is-visible");

  clearTimeout(feedbackTimeoutId);
  feedbackTimeoutId = setTimeout(() => {
    creationFeedbackElement.classList.remove("is-visible");
  }, 2600);
}
