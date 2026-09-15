/*
  js/audio-engine.js
  ------------------
  Everything about turning a star's distance into a sound lives here.

  Two big jobs:
    1. DISTANCE -> NOTE
       Real star distances range from a few light-years to thousands, so
       a straight (linear) mapping would waste almost the entire musical
       range on the handful of very distant stars. Instead we map the
       LOGARITHM of the distance onto a pentatonic scale, so nearby and
       far stars both spread out musically.

    2. NOTE -> SOUND
       Once we know a note name (like "G3"), we use the Web Audio API to
       synthesise a soft, piano-like tone - no audio files needed.

  Customising the sound:
    - `PENTATONIC_NOTES` controls the available notes and their range.
      Add/remove notes here to change the musical scale.
    - `playNote()` controls the tone itself (oscillator type, envelope,
      reverb). Tweak the numbers there to change how "soft" or "bright"
      the instrument feels.
*/

// The full pool of notes stars can be assigned to, low to high.
// A pentatonic scale (C, D, E, G, A) always sounds harmonious together,
// no matter which notes end up playing at once.
const PENTATONIC_NOTES = [
  "C2", "D2", "E2", "G2", "A2",
  "C3", "D3", "E3", "G3", "A3",
  "C4", "D4", "E4", "G4", "A4",
  "C5",
];

// Semitone offset of each natural note name from C, used for frequency maths.
const NOTE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Converts a note name like "G3" into its frequency in Hz using standard
 * equal-temperament tuning (A4 = 440Hz).
 * @param {string} note - e.g. "C2", "A4"
 * @returns {number} frequency in Hz
 */
function noteToFrequency(note) {
  const letter = note[0];
  const octave = parseInt(note.slice(1), 10);
  const semitone = NOTE_SEMITONES[letter];
  // MIDI note number, using the standard convention where C4 = MIDI 60.
  const midiNumber = (octave + 1) * 12 + semitone;
  // Distance in semitones from A4 (MIDI 69) determines the frequency ratio.
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

/*
  The global distance range used for pitch mapping.
  Using ONE shared range (rather than a separate range per hemisphere)
  means a star's pitch never changes depending on which sky is loaded -
  this matches the "a star should always sound the same" rule from the
  architecture document.
*/
let globalDistanceRange = null;

/**
 * Scans both hemisphere datasets once and records the minimum and
 * maximum distance across every interactive star. Call this once when
 * the app starts, before any note is calculated.
 */
function initialiseGlobalDistanceRange() {
  const allStars = [...NORTHERN_STARS, ...SOUTHERN_STARS];
  const distances = allStars.map((star) => star.distanceLightYears);
  globalDistanceRange = {
    min: Math.min(...distances),
    max: Math.max(...distances),
  };
}

/**
 * Calculates which pentatonic note a star should play, based on its
 * distance from Earth. Closer stars map to lower notes; further stars
 * map to higher notes (this direction is an intentional, unconventional
 * musical choice - see the project README).
 * @param {number} distanceLightYears
 * @returns {string} a note name, e.g. "G3"
 */
function distanceToNote(distanceLightYears) {
  if (!globalDistanceRange) initialiseGlobalDistanceRange();

  const { min, max } = globalDistanceRange;

  // Logarithmic normalisation: astronomical distances span several
  // orders of magnitude, so we compare their logarithms rather than the
  // raw numbers. This spreads near and far stars across the full scale
  // instead of bunching everything near one end.
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logDistance = Math.log(distanceLightYears);

  // 0 = nearest star in the dataset, 1 = furthest star in the dataset.
  const normalised = (logDistance - logMin) / (logMax - logMin);

  // Snap the normalised position onto the nearest available note.
  const noteIndex = Math.round(normalised * (PENTATONIC_NOTES.length - 1));
  return PENTATONIC_NOTES[noteIndex];
}

/* ------------------------------------------------------------------ */
/*  Web Audio playback                                                 */
/* ------------------------------------------------------------------ */

let audioContext = null;
let masterGainNode = null;

// When set (during a recording), every note is ALSO routed to this node
// in addition to the normal speaker output - see recorder.js.
let recordingDestinationNode = null;

/**
 * Tells the audio engine to also send every future note to the given
 * MediaStreamAudioDestinationNode, for capturing a video recording.
 * Pass `null` to stop routing to a recording destination.
 */
function setRecordingDestination(node) {
  recordingDestinationNode = node;
}

/**
 * Creates the shared AudioContext and a master volume node. Must be
 * called from within a user gesture (e.g. a click) because most
 * browsers refuse to start audio otherwise.
 */
function unlockAudio() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGainNode = audioContext.createGain();
  masterGainNode.gain.value = appState.volume;
  masterGainNode.connect(audioContext.destination);

  setState({ audioEnabled: true });
}

/**
 * Updates the master volume. Safe to call even before audio is unlocked.
 * @param {number} volume - 0 (silent) to 1 (full volume)
 */
function setMasterVolume(volume) {
  setState({ volume });
  if (masterGainNode) {
    masterGainNode.gain.value = volume;
  }
}

/**
 * Plays a single soft, piano-like note.
 *
 * The "piano" character comes from layering a couple of gentle
 * oscillators together and shaping their volume with a slow attack and
 * a long, smooth release - a simplified stand-in for a real piano's
 * complex overtones, chosen to keep the app lightweight (no audio
 * sample files required).
 *
 * @param {string} note - e.g. "G3"
 * @param {string} [colourTemperature] - "warm" | "cool" | "neutral";
 *   subtly shapes the tone (see architecture doc section 10).
 */
function playNote(note, colourTemperature = "neutral") {
  if (!audioContext) return; // Audio hasn't been unlocked yet.

  const frequency = noteToFrequency(note);
  const now = audioContext.currentTime;

  // A little reverb-like tail, built from a short noise burst through a
  // convolver, gives the note a soft, spacious quality instead of
  // sounding dry and clipped-off.
  const noteGain = audioContext.createGain();
  noteGain.connect(masterGainNode);
  if (recordingDestinationNode) {
    noteGain.connect(recordingDestinationNode);
  }

  // Gentle attack, moderate sustain, smooth release envelope.
  const attackTime = 0.02;
  const releaseTime = 1.6;
  const peakVolume = 0.28;

  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(peakVolume, now + attackTime);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + releaseTime);

  // Warm stars get a rounder, mellower tone (more of a sine wave).
  // Cool/blue stars get a slightly brighter tone (a touch of triangle wave).
  const primaryType = colourTemperature === "cool" ? "triangle" : "sine";

  const oscillator1 = audioContext.createOscillator();
  oscillator1.type = primaryType;
  oscillator1.frequency.value = frequency;
  oscillator1.connect(noteGain);

  // A quiet octave-up layer adds shimmer, like a piano string's harmonics.
  const oscillator2 = audioContext.createOscillator();
  oscillator2.type = "sine";
  oscillator2.frequency.value = frequency * 2;
  const harmonicGain = audioContext.createGain();
  harmonicGain.gain.value = 0.08;
  oscillator2.connect(harmonicGain);
  harmonicGain.connect(noteGain);

  oscillator1.start(now);
  oscillator2.start(now);
  oscillator1.stop(now + attackTime + releaseTime + 0.1);
  oscillator2.stop(now + attackTime + releaseTime + 0.1);
}

/**
 * Plays several notes together as a chord (used for constellations).
 * A tiny random delay per note (a few milliseconds) keeps the chord
 * from sounding like a single flat, mechanical stab.
 * @param {Array<{note: string, colourTemperature?: string}>} notes
 */
function playChord(notes) {
  if (!audioContext) return;
  notes.forEach(({ note, colourTemperature }, index) => {
    const humanDelay = index * 12; // milliseconds
    setTimeout(() => playNote(note, colourTemperature), humanDelay);
  });
}
