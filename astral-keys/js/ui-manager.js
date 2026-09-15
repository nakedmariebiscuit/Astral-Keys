/*
  js/ui-manager.js
  -----------------
  Renders every interface panel (mode buttons, star info, constellation
  info, creation controls, naming overlay, settings, saved
  constellations drawer) and keeps them in sync with appState.

  Pattern used throughout this file:
    1. Grab references to DOM elements once, when the app starts
       (see `initialiseUI`).
    2. Subscribe to state changes with `subscribe(render)`.
    3. `render()` re-reads appState and updates the DOM to match.

  This "re-render on every state change" approach is simple to follow
  and is plenty fast for the small amount of UI this app has - there's
  no need for a heavier templating system.
*/

// A simple, minimal microphone icon (capsule + stand), drawn as inline
// SVG rather than an emoji so its colour and stroke weight stay
// consistent with the rest of the interface.
const MIC_ICON_SVG = `
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
`;

// DOM element references, filled in by initialiseUI().
const ui = {};

function initialiseUI() {
  ui.modeButtons = document.querySelectorAll("[data-mode-button]");
  ui.hemisphereSelect = document.getElementById("hemisphere-select");
  ui.worldGroup = document.getElementById("world-group");
  ui.starMapContainer = document.getElementById("star-map-container");
  ui.svgRoot = document.getElementById("sky-svg");

  ui.starInfoPanel = document.getElementById("star-info-panel");
  ui.constellationInfoPanel = document.getElementById("constellation-info-panel");
  ui.creationPanel = document.getElementById("creation-panel");
  ui.creationFeedback = document.getElementById("creation-feedback");
  ui.namingOverlay = document.getElementById("naming-overlay");
  ui.savedConstellationsPanel = document.getElementById("saved-constellations-panel");

  ui.settingsPanel = document.getElementById("settings-panel");
  ui.settingsButton = document.getElementById("settings-button");
  ui.volumeSlider = document.getElementById("volume-slider");
  ui.reducedMotionToggle = document.getElementById("reduced-motion-toggle");
  ui.resetViewButton = document.getElementById("reset-view-button");

  ui.audioActivationOverlay = document.getElementById("audio-activation-overlay");
  ui.zoomInButton = document.getElementById("zoom-in-button");
  ui.zoomOutButton = document.getElementById("zoom-out-button");
  ui.zoomResetButton = document.getElementById("zoom-reset-button");

  initialiseTooltip(document.getElementById("star-tooltip"), ui.starMapContainer);
  initialiseConstellationTooltip(document.getElementById("constellation-tooltip"), ui.starMapContainer);
  initialiseCreationFeedback(ui.creationFeedback);
  initialiseRecorder();

  attachStaticEventListeners();
  subscribe(render);
}

/* ------------------------------------------------------------------ */
/*  Static (one-time) event listeners                                  */
/* ------------------------------------------------------------------ */

function attachStaticEventListeners() {
  ui.modeButtons.forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.modeButton));
  });

  ui.hemisphereSelect.addEventListener("change", (event) => {
    switchHemisphere(event.target.value);
  });

  ui.settingsButton.addEventListener("click", () => {
    ui.settingsPanel.classList.toggle("is-open");
  });

  ui.volumeSlider.addEventListener("input", (event) => {
    setMasterVolume(parseFloat(event.target.value));
  });

  ui.reducedMotionToggle.addEventListener("change", (event) => {
    setState({ reducedMotion: event.target.checked });
  });

  ui.resetViewButton.addEventListener("click", resetMapView);
  ui.zoomInButton.addEventListener("click", () => zoomBy(1.25));
  ui.zoomOutButton.addEventListener("click", () => zoomBy(0.8));
  ui.zoomResetButton.addEventListener("click", resetMapView);

  // Clicking empty sky clears whatever is currently selected/focused.
  ui.svgRoot.addEventListener("click", () => {
    clearConstellationSelection();
    setState({ selectedStarId: null });
  });

  attachPanAndZoomHandlers();
  attachAudioActivationHandler();
  attachCreationPanelHandlers();
  attachNamingOverlayHandlers();
}

function attachAudioActivationHandler() {
  const activate = () => {
    unlockAudio();
    ui.audioActivationOverlay.classList.add("is-hidden");
  };
  ui.audioActivationOverlay.addEventListener("click", activate);
  ui.audioActivationOverlay.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") activate();
  });
}

function attachCreationPanelHandlers() {
  document.getElementById("play-custom-chord-button").addEventListener("click", playActiveCustomConstellationChord);
  document.getElementById("undo-custom-star-button").addEventListener("click", undoLastCustomStar);
  document.getElementById("clear-custom-constellation-button").addEventListener("click", () => {
    if (appState.activeCustomConstellation.length === 0) return;
    const confirmed = window.confirm("Clear this constellation?");
    if (confirmed) clearCustomConstellation();
  });
  document.getElementById("finish-custom-constellation-button").addEventListener("click", () => {
    if (appState.activeCustomConstellation.length < MIN_CUSTOM_CONSTELLATION_STARS) {
      showCreationFeedback("Select at least two stars first.");
      return;
    }
    ui.namingOverlay.classList.add("is-open");
    document.getElementById("constellation-name-input").focus();
  });
}

function attachNamingOverlayHandlers() {
  const form = document.getElementById("naming-form");
  const savedConfirmation = document.getElementById("naming-saved-confirmation");
  const confirmationTitle = document.getElementById("saved-confirmation-title");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("constellation-name-input");
    const saved = saveCustomConstellation(input.value);
    if (saved) {
      input.value = "";
      const savedConstellation = appState.savedConstellations[appState.savedConstellations.length - 1];
      confirmationTitle.textContent = `"${savedConstellation.name}" saved!`;
      form.hidden = true;
      savedConfirmation.hidden = false;
    }
  });

  document.getElementById("keep-editing-button").addEventListener("click", () => {
    ui.namingOverlay.classList.remove("is-open");
  });

  document.getElementById("record-after-save-button").addEventListener("click", () => {
    const savedConstellation = appState.savedConstellations[appState.savedConstellations.length - 1];
    ui.namingOverlay.classList.remove("is-open");
    resetNamingOverlayToForm();
    openRecordingOverlay(savedConstellation);
  });

  document.getElementById("done-after-save-button").addEventListener("click", () => {
    ui.namingOverlay.classList.remove("is-open");
    resetNamingOverlayToForm();
  });
}

/** Restores the naming overlay's default (empty name-entry form) view,
 * ready for the next time someone finishes a constellation. */
function resetNamingOverlayToForm() {
  document.getElementById("naming-form").hidden = false;
  document.getElementById("naming-saved-confirmation").hidden = true;
}

/* ------------------------------------------------------------------ */
/*  Mode / hemisphere switching                                        */
/* ------------------------------------------------------------------ */

function switchMode(mode) {
  if (mode === appState.mode) return;
  setState({
    mode,
    selectedStarId: null,
    selectedConstellationId: null,
  });
}

function switchHemisphere(hemisphere) {
  if (hemisphere === appState.hemisphere) return;

  if (appState.activeCustomConstellation.length > 0) {
    const proceed = window.confirm(
      "Switching sky will clear your unfinished constellation. Continue?"
    );
    if (!proceed) {
      ui.hemisphereSelect.value = appState.hemisphere; // revert the dropdown
      return;
    }
  }

  setState({
    hemisphere,
    selectedStarId: null,
    hoveredStarId: null,
    selectedConstellationId: null,
    activeCustomConstellation: [],
    viewingSavedConstellationId: null,
  });
  resetMapView();
}

/* ------------------------------------------------------------------ */
/*  Pan & zoom                                                         */
/* ------------------------------------------------------------------ */

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;

function zoomBy(factor) {
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, appState.zoom * factor));
  setState({ zoom: newZoom });
}

function resetMapView() {
  setState({ zoom: 1, panX: 0, panY: 0 });
}

function attachPanAndZoomHandlers() {
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let panOrigin = { x: 0, y: 0 };

  ui.starMapContainer.addEventListener("mousedown", (event) => {
    // Ignore drags that start on a star or a UI panel so clicking a
    // star never accidentally begins a pan (architecture doc section 19).
    if (event.target.closest(".interactive-star") || event.target.closest(".constellation-group")) return;
    isPanning = true;
    panStart = { x: event.clientX, y: event.clientY };
    panOrigin = { x: appState.panX, y: appState.panY };
    ui.starMapContainer.classList.add("is-grabbing");
  });

  window.addEventListener("mousemove", (event) => {
    if (!isPanning) return;
    const dx = event.clientX - panStart.x;
    const dy = event.clientY - panStart.y;
    setState({ panX: panOrigin.x + dx, panY: panOrigin.y + dy });
  });

  window.addEventListener("mouseup", () => {
    isPanning = false;
    ui.starMapContainer.classList.remove("is-grabbing");
  });

  ui.starMapContainer.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      zoomBy(factor);
    },
    { passive: false }
  );
}

/* ------------------------------------------------------------------ */
/*  Main render function - runs on every state change                  */
/* ------------------------------------------------------------------ */

function render(state) {
  renderModeButtons(state);
  renderSvgModeClass(state);
  applyMapTransform(ui.worldGroup);
  renderStarHighlights(state);
  renderConstellationHighlights(state);
  renderStarInfoPanel(state);
  renderConstellationInfoPanel(state);
  renderCreationPanel(state);
  renderSavedConstellationsPanel(state);
  renderSettingsControls(state);
  renderReducedMotionClass(state);
  renderCustomConstellationLines(document.getElementById("custom-constellation-group"));
}

function renderModeButtons(state) {
  ui.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modeButton === state.mode);
  });
}

function renderSvgModeClass(state) {
  ui.svgRoot.classList.remove("mode-plain", "mode-constellations", "mode-create");
  ui.svgRoot.classList.add(`mode-${state.mode}`);
}

function renderReducedMotionClass(state) {
  document.body.classList.toggle("reduced-motion", state.reducedMotion);
}

/** Adds/removes CSS classes marking which star is hovered/selected. */
function renderStarHighlights(state) {
  document.querySelectorAll(".interactive-star").forEach((starGroup) => {
    const starId = starGroup.dataset.starId;
    starGroup.classList.toggle("is-hovered", starId === state.hoveredStarId);
    starGroup.classList.toggle("is-selected", starId === state.selectedStarId);

    const isInCustomConstellation = state.activeCustomConstellation.includes(starId);
    starGroup.classList.toggle("is-in-custom-constellation", isInCustomConstellation);

    const viewingSaved = state.savedConstellations.find((c) => c.id === state.viewingSavedConstellationId);
    starGroup.classList.toggle("is-in-viewed-constellation", Boolean(viewingSaved && viewingSaved.starIds.includes(starId)));
  });
}

/**
 * Keeps each constellation's `.is-selected` class in sync with
 * appState.selectedConstellationId. This runs on every state change
 * (not just when the sky is first built) so clicking a constellation
 * visibly lights up its lines and label immediately.
 */
function renderConstellationHighlights(state) {
  document.querySelectorAll(".constellation-group").forEach((group) => {
    const isSelected = group.dataset.constellationId === state.selectedConstellationId;
    group.classList.toggle("is-selected", isSelected);
  });
}

function renderStarInfoPanel(state) {
  const star = state.selectedStarId ? findStarById(state.selectedStarId) : null;
  if (!star || state.mode === "create") {
    ui.starInfoPanel.classList.remove("is-visible");
    return;
  }
  ui.starInfoPanel.classList.add("is-visible");
  ui.starInfoPanel.innerHTML = `
    <div class="panel-title">${star.name}</div>
    <div class="panel-subtitle">${star.designation}</div>
    <div class="panel-row">${formatDistance(star.distanceLightYears)} away</div>
    <div class="panel-row">Note: ${distanceToNote(star.distanceLightYears)}</div>
  `;
}

function renderConstellationInfoPanel(state) {
  if (state.mode !== "constellations" || !state.selectedConstellationId) {
    ui.constellationInfoPanel.classList.remove("is-visible");
    return;
  }
  const info = getConstellationInfo(state.selectedConstellationId);
  if (!info) {
    ui.constellationInfoPanel.classList.remove("is-visible");
    return;
  }

  ui.constellationInfoPanel.classList.add("is-visible");
  ui.constellationInfoPanel.innerHTML = `
    <div class="panel-title">${info.name.toUpperCase()}</div>
    <div class="panel-row">${info.starCount} main stars</div>
    <div class="panel-row">Nearest star: ${info.nearestStar.name}</div>
    <div class="panel-row">Furthest star: ${info.furthestStar.name}</div>
    <div class="panel-row panel-chord">Chord: ${info.notes.join(" · ")}</div>
    <button class="panel-button" id="replay-constellation-chord">Play Chord</button>
  `;
  document.getElementById("replay-constellation-chord").addEventListener("click", () => {
    playConstellationChord(state.selectedConstellationId);
  });
}

function renderCreationPanel(state) {
  if (state.mode !== "create") {
    ui.creationPanel.classList.remove("is-visible");
    return;
  }
  ui.creationPanel.classList.add("is-visible");

  const starIds = state.activeCustomConstellation;
  const stars = starIds.map(findStarById).filter(Boolean);

  const listMarkup = stars.length
    ? stars
        .map((star) => `<div class="creation-list-row"><span>${star.name}</span><span>${distanceToNote(star.distanceLightYears)}</span></div>`)
        .join("")
    : `<div class="creation-empty-hint">Select stars to draw your constellation.</div>`;

  document.getElementById("creation-star-list").innerHTML = listMarkup;
  document.getElementById("creation-count").textContent = `${stars.length} of ${MAX_CUSTOM_CONSTELLATION_STARS} stars selected`;

  const canPlayOrFinish = stars.length >= MIN_CUSTOM_CONSTELLATION_STARS;
  document.getElementById("play-custom-chord-button").disabled = !canPlayOrFinish;
  document.getElementById("finish-custom-constellation-button").disabled = !canPlayOrFinish;
  document.getElementById("undo-custom-star-button").disabled = stars.length === 0;
  document.getElementById("clear-custom-constellation-button").disabled = stars.length === 0;
}

function renderSavedConstellationsPanel(state) {
  if (state.savedConstellations.length === 0) {
    ui.savedConstellationsPanel.classList.remove("is-visible");
    return;
  }
  ui.savedConstellationsPanel.classList.add("is-visible");

  const relevant = state.savedConstellations.filter((c) => c.hemisphere === state.hemisphere);
  if (relevant.length === 0) {
    ui.savedConstellationsPanel.classList.remove("is-visible");
    return;
  }

  const rows = relevant
    .map(
      (c) => `
        <div class="saved-constellation-row${c.id === state.viewingSavedConstellationId ? " is-active" : ""}">
          <button class="saved-name-button" data-saved-id="${c.id}">
            <span class="saved-name">${c.name}</span>
            <span class="saved-count">${c.starIds.length} stars</span>
          </button>
          <button class="saved-record-button" data-record-saved-id="${c.id}" aria-label="Record a clip of ${c.name}" title="Record a clip">${MIC_ICON_SVG}</button>
        </div>`
    )
    .join("");

  ui.savedConstellationsPanel.innerHTML = `<div class="panel-title">My Constellations</div>${rows}`;

  ui.savedConstellationsPanel.querySelectorAll("[data-saved-id]").forEach((rowButton) => {
    rowButton.addEventListener("click", () => {
      const id = rowButton.dataset.savedId;
      viewSavedConstellation(id);
      playSavedConstellationChord(id);
    });
  });

  ui.savedConstellationsPanel.querySelectorAll("[data-record-saved-id]").forEach((recordButton) => {
    recordButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = recordButton.dataset.recordSavedId;
      const constellation = state.savedConstellations.find((c) => c.id === id);
      if (constellation) openRecordingOverlay(constellation);
    });
  });
}

function renderSettingsControls(state) {
  ui.volumeSlider.value = state.volume;
  ui.reducedMotionToggle.checked = state.reducedMotion;
}
