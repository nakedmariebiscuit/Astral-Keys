/*
  js/star-interactions.js
  ------------------------
  Wires up what happens when a person hovers, clicks, or keyboard-focuses
  an individual interactive star: the tooltip, the glow/pulse animation,
  and (depending on the current mode) playing its note or adding it to
  a custom constellation.
*/

/**
 * Attaches all pointer/keyboard handlers for one star's SVG group.
 * Called once per star when the sky is rendered.
 * @param {SVGGElement} starGroup
 * @param {Object} star - the star's data record
 */
function attachStarInteractionHandlers(starGroup, star) {
  const showTooltipAndHighlight = () => {
    setState({ hoveredStarId: star.id });
    showStarTooltip(star, starGroup);
  };

  const hideTooltipAndHighlight = () => {
    if (appState.hoveredStarId === star.id) {
      setState({ hoveredStarId: null });
    }
    hideStarTooltip();
  };

  starGroup.addEventListener("mouseenter", showTooltipAndHighlight);
  starGroup.addEventListener("mouseleave", hideTooltipAndHighlight);
  starGroup.addEventListener("focus", showTooltipAndHighlight);
  starGroup.addEventListener("blur", hideTooltipAndHighlight);

  starGroup.addEventListener("click", (event) => {
    event.stopPropagation();
    handleStarActivation(star, starGroup);
  });

  starGroup.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleStarActivation(star, starGroup);
    }
  });
}

/**
 * The single entry point for "a star was activated" (by click or by
 * keyboard). Behaviour depends on the current interaction mode.
 */
function handleStarActivation(star, starGroup) {
  // The very first interaction anywhere in the app unlocks audio.
  if (!appState.audioEnabled) unlockAudio();

  pulseStar(starGroup);

  const note = distanceToNote(star.distanceLightYears);
  playNote(note, star.colourTemperature);

  if (appState.mode === "create") {
    addStarToCustomConstellation(star.id);
  } else {
    setState({ selectedStarId: star.id });
  }
}

/**
 * Plays the brief "brighten, expand, soft pulse, settle" visual
 * response described in the architecture document (section 8).
 */
function pulseStar(starGroup) {
  starGroup.classList.remove("is-pulsing"); // restart animation if re-triggered quickly
  // Force reflow so removing/re-adding the class always restarts the CSS animation.
  void starGroup.offsetWidth;
  starGroup.classList.add("is-pulsing");
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

let tooltipElement = null;
let starMapContainerElement = null;

/** Called once from app.js to hand this module the DOM nodes it needs. */
function initialiseTooltip(tooltipEl, mapContainerEl) {
  tooltipElement = tooltipEl;
  starMapContainerElement = mapContainerEl;
}

/**
 * Shows and positions the hover tooltip next to a star, keeping it
 * inside the bounds of the app container (architecture doc section 7).
 */
function showStarTooltip(star, starGroup) {
  if (!tooltipElement || !starMapContainerElement) return;

  tooltipElement.innerHTML = `
    <div class="tooltip-name">${star.name}</div>
    <div class="tooltip-designation">${star.designation}</div>
    <div class="tooltip-distance">${formatDistance(star.distanceLightYears)} away</div>
    <div class="tooltip-note">Note: ${distanceToNote(star.distanceLightYears)}</div>
  `;
  tooltipElement.classList.add("is-visible");

  // Find the star's on-screen position (accounting for pan/zoom/scroll)
  // by asking the browser directly, rather than recomputing the map
  // transform by hand.
  const starRect = starGroup.getBoundingClientRect();
  const containerRect = starMapContainerElement.getBoundingClientRect();

  let left = starRect.left - containerRect.left + starRect.width / 2 + 14;
  let top = starRect.top - containerRect.top - 10;

  // Keep the tooltip from spilling outside the container on any edge.
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const maxLeft = containerRect.width - tooltipRect.width - 8;
  const maxTop = containerRect.height - tooltipRect.height - 8;
  left = Math.max(8, Math.min(left, maxLeft));
  top = Math.max(8, Math.min(top, maxTop));

  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
}

function hideStarTooltip() {
  if (!tooltipElement) return;
  tooltipElement.classList.remove("is-visible");
}
