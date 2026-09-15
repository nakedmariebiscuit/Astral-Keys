/*
  js/recorder.js
  ---------------
  Lets a person turn a saved constellation into a short, square,
  shareable video clip: its stars connect one by one, then its chord
  swells in as all of them glow together - captured straight from a
  <canvas> (no screen-share permission prompt needed) with its audio
  piped in live from the Web Audio synth.

  How the capture works, in plain terms:
    1. We draw the whole animation onto an off-DOM-of-the-main-map
       <canvas>, frame by frame, using requestAnimationFrame.
    2. `canvas.captureStream(30)` turns that canvas into a live video
       track - whatever is drawn on it becomes the recording.
    3. `audioContext.createMediaStreamDestination()` gives us an audio
       track that the chord's notes are ALSO routed into (see
       `setRecordingDestination` in audio-engine.js), alongside the
       normal speaker output.
    4. Both tracks are combined into one MediaStream and handed to
       `MediaRecorder`, which produces a single downloadable video file
       when we call `.stop()`.

  Browser format note: MediaRecorder only reliably produces `.webm`
  video in Chrome/Firefox/Edge (Safari support varies). `.webm` plays
  and uploads fine on every major platform, so that's what we save.
*/

// ---- Timing (all in milliseconds) - tweak these to change the pacing ----
const REVEAL_PRE_ROLL = 500; // blank beat before the first star appears
const REVEAL_STAR_INTERVAL = 480; // gap between each star lighting up
const REVEAL_STAR_RAMP = 280; // how long each star takes to glow in / line to draw
const CHORD_SWELL_RAMP = 350; // how long the "all together" glow takes to bloom
const CHORD_HOLD = 1900; // how long the chord rings out before the clip ends
const POST_HOLD = 500; // final still beat so the last frame doesn't feel cut off

const CANVAS_SIZE = 720; // recorded resolution, square per the chosen 1:1 format
const CANVAS_PADDING_RATIO = 0.22; // breathing room around the constellation's shape

// Feature detection - recording is only offered where the browser can do it.
const RECORDING_SUPPORTED =
  typeof MediaRecorder !== "undefined" &&
  typeof HTMLCanvasElement !== "undefined" &&
  HTMLCanvasElement.prototype.captureStream !== undefined;

let recordingState = "idle"; // "idle" | "recording" | "done"
let activeConstellation = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTimestamp = null;
let animationFrameId = null;
let chordHasPlayed = false;
let recordedObjectUrl = null;

/* ------------------------------------------------------------------ */
/*  DOM references (filled in by initialiseRecorder)                   */
/* ------------------------------------------------------------------ */

const recorderUi = {};

function initialiseRecorder() {
  recorderUi.overlay = document.getElementById("recording-overlay");
  recorderUi.title = document.getElementById("recording-modal-title");
  recorderUi.canvas = document.getElementById("recording-canvas");
  recorderUi.video = document.getElementById("recording-preview-video");
  recorderUi.indicator = document.getElementById("recording-indicator");
  recorderUi.timer = document.getElementById("recording-timer");
  recorderUi.idleControls = document.getElementById("recording-controls-idle");
  recorderUi.doneControls = document.getElementById("recording-controls-done");
  recorderUi.startButton = document.getElementById("start-recording-button");
  recorderUi.cancelButton = document.getElementById("cancel-recording-button");
  recorderUi.downloadLink = document.getElementById("download-recording-link");
  recorderUi.recordAgainButton = document.getElementById("record-again-button");
  recorderUi.closeButton = document.getElementById("close-recording-button");
  recorderUi.unsupportedNotice = document.getElementById("recording-unsupported-notice");

  recorderUi.startButton.addEventListener("click", () => startRecording(activeConstellation));
  recorderUi.cancelButton.addEventListener("click", closeRecordingOverlay);
  recorderUi.recordAgainButton.addEventListener("click", () => resetToIdle(activeConstellation));
  recorderUi.closeButton.addEventListener("click", closeRecordingOverlay);
  recorderUi.overlay.addEventListener("click", (event) => {
    if (event.target === recorderUi.overlay) closeRecordingOverlay();
  });
}

/**
 * Opens the recording overlay for a given saved (or just-saved)
 * constellation. `constellation` needs { name, hemisphere, starIds }.
 */
function openRecordingOverlay(constellation) {
  activeConstellation = constellation;
  recorderUi.title.textContent = `Record "${constellation.name}"`;
  recorderUi.overlay.classList.add("is-open");

  if (!RECORDING_SUPPORTED) {
    recorderUi.idleControls.hidden = true;
    recorderUi.doneControls.hidden = true;
    recorderUi.unsupportedNotice.hidden = false;
    return;
  }

  resetToIdle(constellation);
}

function closeRecordingOverlay() {
  cancelAnimationFrame(animationFrameId);
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  setRecordingDestination(null);
  stopPreviewVideo();
  recorderUi.overlay.classList.remove("is-open");
}

/**
 * Fully stops the preview video and detaches its source. Just hiding
 * an element with CSS does NOT stop a <video> from playing - without
 * this, a recorded clip's audio could keep quietly playing (and even
 * looping) in the background after the overlay was closed.
 */
function stopPreviewVideo() {
  recorderUi.video.pause();
  recorderUi.video.removeAttribute("src");
  recorderUi.video.load();
}

/** Returns the overlay to its "ready to record" starting state. */
function resetToIdle(constellation) {
  recordingState = "idle";
  activeConstellation = constellation;

  stopPreviewVideo();
  if (recordedObjectUrl) {
    URL.revokeObjectURL(recordedObjectUrl);
    recordedObjectUrl = null;
  }

  recorderUi.canvas.hidden = false;
  recorderUi.video.hidden = true;
  recorderUi.indicator.hidden = true;
  recorderUi.idleControls.hidden = false;
  recorderUi.doneControls.hidden = true;
  recorderUi.unsupportedNotice.hidden = true;

  drawStaticPreviewFrame(constellation);
}

/** Draws a single calm "ready" frame - all stars dim, unconnected. */
function drawStaticPreviewFrame(constellation) {
  const ctx = recorderUi.canvas.getContext("2d");
  const layout = buildLayout(constellation);
  paintBackground(ctx);
  layout.stars.forEach((star) => paintStar(ctx, star, 0.35, false));
}

/* ------------------------------------------------------------------ */
/*  Layout - fitting a constellation's real coordinates into a square  */
/* ------------------------------------------------------------------ */

/**
 * Works out where each star should be drawn on the square canvas,
 * scaling and centring the constellation's own shape (from its real
 * map coordinates) to fill the frame with even padding on all sides.
 */
function buildLayout(constellation) {
  const stars = constellation.starIds.map(findStarById).filter(Boolean);

  const minX = Math.min(...stars.map((s) => s.x));
  const maxX = Math.max(...stars.map((s) => s.x));
  const minY = Math.min(...stars.map((s) => s.y));
  const maxY = Math.max(...stars.map((s) => s.y));

  // Guard against a perfectly vertical/horizontal pair of stars, which
  // would otherwise produce a zero-width or zero-height bounding box.
  const shapeWidth = Math.max(maxX - minX, 40);
  const shapeHeight = Math.max(maxY - minY, 40);

  const padding = CANVAS_SIZE * CANVAS_PADDING_RATIO;
  const available = CANVAS_SIZE - padding * 2;
  const scale = available / Math.max(shapeWidth, shapeHeight);

  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;

  const positioned = stars.map((star) => ({
    ...star,
    screenX: CANVAS_SIZE / 2 + (star.x - centreX) * scale,
    screenY: CANVAS_SIZE / 2 + (star.y - centreY) * scale,
  }));

  return { stars: positioned };
}

/* ------------------------------------------------------------------ */
/*  Drawing helpers                                                     */
/* ------------------------------------------------------------------ */

// A small, fixed field of background dots for atmosphere, generated
// once per module load so the clip doesn't get a different sky if
// re-recorded.
const CLIP_BACKGROUND_STARS = Array.from({ length: 55 }, () => ({
  x: Math.random() * CANVAS_SIZE,
  y: Math.random() * CANVAS_SIZE,
  radius: 0.6 + Math.random() * 1.4,
  baseOpacity: 0.15 + Math.random() * 0.35,
  twinklePeriod: 2200 + Math.random() * 2600,
  twinklePhase: Math.random() * Math.PI * 2,
}));

function paintBackground(ctx, elapsed = 0) {
  const gradient = ctx.createRadialGradient(
    CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.4, CANVAS_SIZE * 0.1,
    CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.75
  );
  gradient.addColorStop(0, "#101b36");
  gradient.addColorStop(1, "#04060d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  CLIP_BACKGROUND_STARS.forEach((dot) => {
    const twinkle = Math.sin(elapsed / dot.twinklePeriod * Math.PI * 2 + dot.twinklePhase);
    const opacity = Math.max(0, dot.baseOpacity + twinkle * 0.12);
    ctx.beginPath();
    ctx.fillStyle = `rgba(244, 239, 228, ${opacity.toFixed(3)})`;
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

const COLOUR_BY_TEMPERATURE = {
  warm: "255, 217, 168",
  cool: "188, 216, 255",
  neutral: "244, 239, 228",
};

/** Draws one star, with an optional glow halo scaled by `intensity` (0-1). */
function paintStar(ctx, star, intensity, drawHalo = true) {
  const colour = COLOUR_BY_TEMPERATURE[star.colourTemperature] || COLOUR_BY_TEMPERATURE.neutral;
  const coreRadius = (2 + star.brightness * 2.6) * (0.7 + intensity * 0.3);

  if (drawHalo && intensity > 0.01) {
    const haloRadius = 10 + intensity * 22;
    const halo = ctx.createRadialGradient(
      star.screenX, star.screenY, 0,
      star.screenX, star.screenY, haloRadius
    );
    halo.addColorStop(0, `rgba(${colour}, ${0.45 * intensity})`);
    halo.addColorStop(1, `rgba(${colour}, 0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(star.screenX, star.screenY, haloRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.fillStyle = `rgba(${colour}, ${(0.55 + intensity * 0.45).toFixed(3)})`;
  ctx.arc(star.screenX, star.screenY, coreRadius, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws a connecting line between two stars, partially if `progress` < 1. */
function paintConnectingLine(ctx, fromStar, toStar, progress) {
  if (progress <= 0) return;
  const endX = fromStar.screenX + (toStar.screenX - fromStar.screenX) * progress;
  const endY = fromStar.screenY + (toStar.screenY - fromStar.screenY) * progress;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(232, 199, 137, 0.75)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.moveTo(fromStar.screenX, fromStar.screenY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function paintTitleCard(ctx, name, opacity) {
  if (opacity <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#eef1f9";
  ctx.font = '500 34px "Iowan Old Style", "Palatino Linotype", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, CANVAS_SIZE / 2, CANVAS_SIZE - 64);
  ctx.restore();
}

function paintWatermark(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#93a0bf";
  ctx.font = '600 13px -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("ASTRAL KEYS", CANVAS_SIZE / 2, CANVAS_SIZE - 28);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  The recording lifecycle                                            */
/* ------------------------------------------------------------------ */

function startRecording(constellation) {
  if (!appState.audioEnabled) unlockAudio();

  recordingState = "recording";
  recorderUi.idleControls.hidden = true;
  recorderUi.indicator.hidden = false;

  const layout = buildLayout(constellation);
  const totalDuration =
    REVEAL_PRE_ROLL +
    layout.stars.length * REVEAL_STAR_INTERVAL +
    CHORD_SWELL_RAMP +
    CHORD_HOLD +
    POST_HOLD;
  const swellStart = REVEAL_PRE_ROLL + layout.stars.length * REVEAL_STAR_INTERVAL;

  // ---- Audio capture setup ----
  const streamDestination = audioContext.createMediaStreamDestination();
  setRecordingDestination(streamDestination);

  // ---- Video capture setup ----
  const canvasStream = recorderUi.canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...streamDestination.stream.getAudioTracks(),
  ]);

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(combinedStream, { mimeType: pickSupportedMimeType() });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };
  mediaRecorder.onstop = () => finaliseRecording(constellation.name);
  mediaRecorder.start();

  chordHasPlayed = false;
  recordingStartTimestamp = null;

  const notes = layout.stars.map((star) => ({
    note: distanceToNote(star.distanceLightYears),
    colourTemperature: star.colourTemperature,
  }));

  const tick = (timestamp) => {
    if (recordingStartTimestamp === null) recordingStartTimestamp = timestamp;
    const elapsed = timestamp - recordingStartTimestamp;

    renderRecordingFrame(layout, constellation.name, elapsed, swellStart);
    updateRecordingTimer(elapsed);

    if (!chordHasPlayed && elapsed >= swellStart) {
      chordHasPlayed = true;
      playChord(notes);
    }

    if (elapsed < totalDuration) {
      animationFrameId = requestAnimationFrame(tick);
    } else {
      setRecordingDestination(null);
      mediaRecorder.stop();
    }
  };
  animationFrameId = requestAnimationFrame(tick);
}

/** Draws exactly one frame of the recording animation for a given elapsed time. */
function renderRecordingFrame(layout, name, elapsed, swellStart) {
  const ctx = recorderUi.canvas.getContext("2d");
  paintBackground(ctx, elapsed);

  layout.stars.forEach((star, index) => {
    const revealTime = REVEAL_PRE_ROLL + index * REVEAL_STAR_INTERVAL;
    const revealProgress = clamp01((elapsed - revealTime) / REVEAL_STAR_RAMP);

    if (index > 0) {
      const previousStar = layout.stars[index - 1];
      paintConnectingLine(ctx, previousStar, star, revealProgress);
    }
  });

  const swellProgress = clamp01((elapsed - swellStart) / CHORD_SWELL_RAMP);
  // A gentle overshoot-then-settle curve, so the "all together" moment
  // reads as a soft bloom rather than a flat linear fade-in.
  const swellBoost = Math.sin(swellProgress * Math.PI * 0.5);

  layout.stars.forEach((star, index) => {
    const revealTime = REVEAL_PRE_ROLL + index * REVEAL_STAR_INTERVAL;
    const revealProgress = clamp01((elapsed - revealTime) / REVEAL_STAR_RAMP);
    const intensity = Math.max(revealProgress * 0.6, swellBoost);
    paintStar(ctx, star, intensity);
  });

  const titleOpacity = clamp01((elapsed - swellStart) / (CHORD_SWELL_RAMP + 300));
  paintTitleCard(ctx, name, titleOpacity);
  paintWatermark(ctx);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function updateRecordingTimer(elapsedMs) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  recorderUi.timer.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Picks the best video/audio container+codec combination this browser supports. */
function pickSupportedMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function finaliseRecording(constellationName) {
  if (!recorderUi.overlay.classList.contains("is-open")) return;

  recordingState = "done";
  recorderUi.indicator.hidden = true;
  recorderUi.doneControls.hidden = false;

  const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "video/webm" });
  recordedObjectUrl = URL.createObjectURL(blob);

  recorderUi.canvas.hidden = true;
  recorderUi.video.hidden = false;
  recorderUi.video.src = recordedObjectUrl;
  recorderUi.video.play().catch(() => {
    /* Autoplay can be blocked in some browsers - the person can press play manually. */
  });

  const safeName = constellationName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "constellation";
  recorderUi.downloadLink.href = recordedObjectUrl;
  recorderUi.downloadLink.download = `astral-keys-${safeName}.webm`;
}
