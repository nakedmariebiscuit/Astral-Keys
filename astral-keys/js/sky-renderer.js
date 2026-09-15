/*
  js/sky-renderer.js
  ------------------
  Draws the star map itself: the SVG canvas, the background "atmosphere"
  stars, the interactive stars, and the pan/zoom transform.

  Why SVG?
  The architecture document recommends SVG over HTML5 Canvas for this
  project because our dataset is small (a few hundred stars), and SVG
  gives each star its own real DOM element - which makes hovering,
  clicking, and keyboard focus far simpler than manually hit-testing
  pixels on a canvas.

  The map lives inside a fixed 1000 x 600 "world" coordinate system
  (see the `viewBox` on the <svg> element in index.html). Panning and
  zooming are done by changing a CSS transform on a <g> group that wraps
  everything - the coordinates in the data files never change.
*/

// How many soft, non-interactive background stars to scatter behind the
// interactive sky, purely for atmosphere (architecture doc section 5).
const BACKGROUND_STAR_COUNT = 160;

// Cached so we don't regenerate random background stars every render.
let cachedBackgroundStars = null;

/**
 * Produces a stable list of random background stars. Cached after first
 * call so switching modes/hemispheres doesn't make the backdrop jitter.
 */
function getBackgroundStars() {
  if (cachedBackgroundStars) return cachedBackgroundStars;

  cachedBackgroundStars = [];
  for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
    cachedBackgroundStars.push({
      x: Math.random() * 1000,
      y: Math.random() * 600,
      radius: 0.4 + Math.random() * 1.1,
      opacity: 0.2 + Math.random() * 0.5,
      // Slightly different twinkle timing per star keeps the sky feeling
      // alive rather than pulsing in unison.
      twinkleDuration: 3 + Math.random() * 5,
      twinkleDelay: Math.random() * 5,
    });
  }
  return cachedBackgroundStars;
}

/** Returns the star dataset for whichever hemisphere is active. */
function getActiveStars() {
  return appState.hemisphere === "northern" ? NORTHERN_STARS : SOUTHERN_STARS;
}

/** Returns the constellation dataset for whichever hemisphere is active. */
function getActiveConstellations() {
  return appState.hemisphere === "northern" ? NORTHERN_CONSTELLATIONS : SOUTHERN_CONSTELLATIONS;
}

/** Looks up a single star by id within the currently active hemisphere. */
function findStarById(starId) {
  return getActiveStars().find((star) => star.id === starId);
}

/** Looks up a single constellation by id within the active hemisphere. */
function findConstellationById(constellationId) {
  return getActiveConstellations().find((c) => c.id === constellationId);
}

/**
 * Renders the background atmosphere stars into the given SVG group.
 * These never receive hover/click handlers - they are decoration only.
 */
function renderBackgroundStars(groupElement) {
  groupElement.innerHTML = "";
  const stars = getBackgroundStars();

  stars.forEach((star) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", star.x);
    circle.setAttribute("cy", star.y);
    circle.setAttribute("r", star.radius);
    circle.setAttribute("class", "background-star");
    circle.setAttribute("opacity", star.opacity);
    if (!appState.reducedMotion) {
      circle.style.animationDuration = `${star.twinkleDuration}s`;
      circle.style.animationDelay = `${star.twinkleDelay}s`;
    }
    groupElement.appendChild(circle);
  });
}

/**
 * Renders every recognised constellation's connecting lines and label
 * into the given SVG group. Visibility (shown/faint/hidden) is handled
 * with the "mode-plain" / "mode-constellations" / "mode-create" CSS
 * classes on the group itself, set by ui-manager.js.
 */
function renderConstellationLines(groupElement) {
  groupElement.innerHTML = "";
  const constellations = getActiveConstellations();

  constellations.forEach((constellation) => {
    const isSelected = appState.selectedConstellationId === constellation.id;
    const lineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    lineGroup.setAttribute("class", `constellation-group${isSelected ? " is-selected" : ""}`);
    lineGroup.dataset.constellationId = constellation.id;

    constellation.lines.forEach(([fromId, toId]) => {
      const fromStar = findStarById(fromId);
      const toStar = findStarById(toId);
      if (!fromStar || !toStar) return; // Guard against a data typo.

      // A wide, invisible line sits behind the thin visible one purely
      // to make clicking/hovering the constellation far more forgiving
      // than the 0.6px-wide visible line would allow on its own.
      const hitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hitLine.setAttribute("x1", fromStar.x);
      hitLine.setAttribute("y1", fromStar.y);
      hitLine.setAttribute("x2", toStar.x);
      hitLine.setAttribute("y2", toStar.y);
      hitLine.setAttribute("class", "constellation-line-hit");
      lineGroup.appendChild(hitLine);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromStar.x);
      line.setAttribute("y1", fromStar.y);
      line.setAttribute("x2", toStar.x);
      line.setAttribute("y2", toStar.y);
      line.setAttribute("class", "constellation-line");
      lineGroup.appendChild(line);
    });

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", constellation.labelPosition.x);
    label.setAttribute("y", constellation.labelPosition.y);
    label.setAttribute("class", "constellation-label");
    label.textContent = constellation.name;
    lineGroup.appendChild(label);

    lineGroup.addEventListener("click", (event) => {
      event.stopPropagation();
      if (appState.mode === "constellations") {
        handleConstellationClick(constellation.id);
      }
    });
    lineGroup.addEventListener("mouseenter", () => {
      if (appState.mode !== "constellations") return;
      lineGroup.classList.add("is-hovered");
      showConstellationTooltip(constellation, lineGroup);
    });
    lineGroup.addEventListener("mouseleave", () => {
      lineGroup.classList.remove("is-hovered");
      hideConstellationTooltip();
    });

    groupElement.appendChild(lineGroup);
  });
}

/**
 * Renders every interactive star for the current hemisphere into the
 * given SVG group, wiring up hover/click/keyboard handlers.
 */
function renderInteractiveStars(groupElement) {
  groupElement.innerHTML = "";
  const stars = getActiveStars();

  stars.forEach((star) => {
    const starGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    starGroup.setAttribute("class", "interactive-star");
    starGroup.dataset.starId = star.id;
    starGroup.setAttribute("tabindex", "0");
    starGroup.setAttribute("role", "button");
    starGroup.setAttribute("aria-label", `${star.name}, ${formatDistance(star.distanceLightYears)} away`);

    // A larger, invisible circle enlarges the click/tap target beyond
    // the star's tiny visible dot, per architecture doc section 7.
    const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hitArea.setAttribute("cx", star.x);
    hitArea.setAttribute("cy", star.y);
    hitArea.setAttribute("r", 14);
    hitArea.setAttribute("class", "star-hit-area");
    starGroup.appendChild(hitArea);

    const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    halo.setAttribute("cx", star.x);
    halo.setAttribute("cy", star.y);
    halo.setAttribute("r", 10);
    halo.setAttribute("class", "star-halo");
    starGroup.appendChild(halo);

    const radius = 1.6 + star.brightness * 2.2;
    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("cx", star.x);
    core.setAttribute("cy", star.y);
    core.setAttribute("r", radius);
    core.setAttribute("class", `star-core star-${star.colourTemperature}`);
    starGroup.appendChild(core);

    attachStarInteractionHandlers(starGroup, star);
    groupElement.appendChild(starGroup);
  });
}

/**
 * Formats a light-year distance for display, e.g. "4.4 light-years" or
 * "548 light-years".
 */
function formatDistance(distanceLightYears) {
  const rounded = distanceLightYears < 20
    ? Math.round(distanceLightYears * 10) / 10
    : Math.round(distanceLightYears);
  return `${rounded} light-year${rounded === 1 ? "" : "s"}`;
}

/**
 * Applies the current pan/zoom values as a CSS transform on the world
 * group. Called after any change to appState.zoom/panX/panY.
 */
function applyMapTransform(worldGroupElement) {
  const { zoom, panX, panY } = appState;
  worldGroupElement.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

/**
 * Draws (or redraws) the connecting lines for the constellation
 * currently being built in Create mode, plus highlight rings around
 * each chosen star. Recognised constellation lines are faded out while
 * this is visible (handled via CSS mode classes).
 */
function renderCustomConstellationLines(groupElement) {
  groupElement.innerHTML = "";
  const starIds = appState.activeCustomConstellation;
  const stars = starIds.map(findStarById).filter(Boolean);

  for (let i = 0; i < stars.length - 1; i++) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", stars[i].x);
    line.setAttribute("y1", stars[i].y);
    line.setAttribute("x2", stars[i + 1].x);
    line.setAttribute("y2", stars[i + 1].y);
    line.setAttribute("class", "custom-constellation-line");
    groupElement.appendChild(line);
  }

  stars.forEach((star) => {
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", star.x);
    ring.setAttribute("cy", star.y);
    ring.setAttribute("r", 9);
    ring.setAttribute("class", "custom-constellation-ring");
    groupElement.appendChild(ring);
  });
}
