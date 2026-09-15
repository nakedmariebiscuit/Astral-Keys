/*
  js/constellation-manager.js
  ----------------------------
  Handles everything about recognised constellations in Constellation
  mode: selecting one, showing its info panel, and playing its chord.

  Custom (user-drawn) constellations are handled separately, in
  creation-manager.js.
*/

/**
 * Called when a constellation's lines/label are clicked while in
 * Constellation mode.
 */
function handleConstellationClick(constellationId) {
  if (!appState.audioEnabled) unlockAudio();

  const alreadySelected = appState.selectedConstellationId === constellationId;
  setState({ selectedConstellationId: alreadySelected ? null : constellationId });

  if (!alreadySelected) {
    playConstellationChord(constellationId);
  }
}

/** Clears the current constellation selection (e.g. clicking empty sky). */
function clearConstellationSelection() {
  if (appState.selectedConstellationId) {
    setState({ selectedConstellationId: null });
  }
}

/**
 * Plays every star in a constellation together as a chord.
 */
function playConstellationChord(constellationId) {
  const constellation = findConstellationById(constellationId);
  if (!constellation) return;

  const notes = constellation.starIds
    .map(findStarById)
    .filter(Boolean)
    .map((star) => ({
      note: distanceToNote(star.distanceLightYears),
      colourTemperature: star.colourTemperature,
    }));

  playChord(notes);
}

/* ------------------------------------------------------------------ */
/*  Hover tooltip - shows the constellation's popular name              */
/* ------------------------------------------------------------------ */

let constellationTooltipElement = null;
let constellationTooltipContainerElement = null;

/** Called once from ui-manager.js to hand this module the DOM nodes it needs. */
function initialiseConstellationTooltip(tooltipEl, containerEl) {
  constellationTooltipElement = tooltipEl;
  constellationTooltipContainerElement = containerEl;
}

/**
 * Shows a small tooltip near the pointer naming the constellation being
 * hovered - its official name, plus the popular name people usually
 * know it by (e.g. Ursa Major / "The Big Dipper"), when that differs.
 */
function showConstellationTooltip(constellation, lineGroupElement) {
  if (!constellationTooltipElement || !constellationTooltipContainerElement) return;

  const hasDistinctCommonName =
    constellation.commonName && constellation.commonName !== constellation.name;

  constellationTooltipElement.innerHTML = hasDistinctCommonName
    ? `
      <div class="tooltip-name">${constellation.commonName}</div>
      <div class="tooltip-designation">${constellation.name}</div>
    `
    : `<div class="tooltip-name">${constellation.name}</div>`;
  constellationTooltipElement.classList.add("is-visible");

  const groupRect = lineGroupElement.getBoundingClientRect();
  const containerRect = constellationTooltipContainerElement.getBoundingClientRect();

  let left = groupRect.left - containerRect.left + groupRect.width / 2;
  let top = groupRect.top - containerRect.top - 14;

  const tooltipRect = constellationTooltipElement.getBoundingClientRect();
  left -= tooltipRect.width / 2;
  const maxLeft = containerRect.width - tooltipRect.width - 8;
  const maxTop = containerRect.height - tooltipRect.height - 8;
  left = Math.max(8, Math.min(left, maxLeft));
  top = Math.max(8, Math.min(top, maxTop));

  constellationTooltipElement.style.left = `${left}px`;
  constellationTooltipElement.style.top = `${top}px`;
}

function hideConstellationTooltip() {
  if (!constellationTooltipElement) return;
  constellationTooltipElement.classList.remove("is-visible");
}

/**
 * Builds the data needed to render a constellation's info panel:
 * name, star count, nearest/furthest star, and its chord notes in
 * order from lowest to highest.
 */
function getConstellationInfo(constellationId) {
  const constellation = findConstellationById(constellationId);
  if (!constellation) return null;

  const stars = constellation.starIds.map(findStarById).filter(Boolean);
  const sortedByDistance = [...stars].sort((a, b) => a.distanceLightYears - b.distanceLightYears);

  const notesLowToHigh = stars
    .map((star) => ({ note: distanceToNote(star.distanceLightYears), order: PENTATONIC_NOTES.indexOf(distanceToNote(star.distanceLightYears)) }))
    .sort((a, b) => a.order - b.order)
    .map((n) => n.note);

  return {
    name: constellation.name,
    starCount: stars.length,
    nearestStar: sortedByDistance[0],
    furthestStar: sortedByDistance[sortedByDistance.length - 1],
    notes: notesLowToHigh,
  };
}
