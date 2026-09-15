/*
  data/northern-stars.js
  -----------------------
  This file holds every INTERACTIVE star for the Northern Hemisphere sky.

  What is an "interactive" star?
    - It has a real name, a real approximate distance (in light-years),
      and can be clicked to play a musical note.
    - Stars that belong to a recognised constellation carry a
      `constellation` id that matches an entry in
      `northern-constellations.js`.
    - A few bright stars are NOT part of any drawn constellation in this
      curated version - they are simply lone interactive stars scattered
      around the sky (e.g. Polaris, Sirius).

  Coordinates:
    - `x` and `y` are positioned on a 1000 x 600 SVG canvas (see
      sky-renderer.js). They are hand-placed to loosely resemble the real
      relative positions of these stars, not exact planetarium data.

  Distance:
    - `distanceLightYears` uses widely published approximate distances.
      These are for atmosphere and musical mapping, not scientific use
      (see the project README for more on this).

  Note assignment:
    - Notes are NOT stored here. `audio-engine.js` calculates each star's
      note from its distance, combined with every star in BOTH
      hemispheres. This keeps a star's pitch consistent no matter which
      sky is loaded, and means the whole note system can be tuned in one
      place without touching this file.
*/

const NORTHERN_STARS = [
  // ----- Orion -----
  { id: "betelgeuse", name: "Betelgeuse", designation: "Alpha Orionis", hemisphere: "northern", x: 560, y: 120, distanceLightYears: 548, brightness: 0.95, colourTemperature: "warm", constellation: "orion" },
  { id: "bellatrix",  name: "Bellatrix",  designation: "Gamma Orionis", hemisphere: "northern", x: 620, y: 130, distanceLightYears: 245, brightness: 0.8,  colourTemperature: "cool", constellation: "orion" },
  { id: "alnitak",    name: "Alnitak",    designation: "Zeta Orionis",  hemisphere: "northern", x: 640, y: 170, distanceLightYears: 1260, brightness: 0.75, colourTemperature: "cool", constellation: "orion" },
  { id: "alnilam",    name: "Alnilam",    designation: "Epsilon Orionis", hemisphere: "northern", x: 615, y: 178, distanceLightYears: 2000, brightness: 0.85, colourTemperature: "cool", constellation: "orion" },
  { id: "mintaka",    name: "Mintaka",    designation: "Delta Orionis", hemisphere: "northern", x: 590, y: 185, distanceLightYears: 1200, brightness: 0.7,  colourTemperature: "cool", constellation: "orion" },
  { id: "saiph",      name: "Saiph",      designation: "Kappa Orionis", hemisphere: "northern", x: 600, y: 250, distanceLightYears: 650, brightness: 0.72, colourTemperature: "cool", constellation: "orion" },
  { id: "rigel",      name: "Rigel",      designation: "Beta Orionis",  hemisphere: "northern", x: 650, y: 245, distanceLightYears: 860, brightness: 1.0,  colourTemperature: "cool", constellation: "orion" },

  // ----- Ursa Major (The Big Dipper) -----
  { id: "dubhe",  name: "Dubhe",  designation: "Alpha Ursae Majoris", hemisphere: "northern", x: 180, y: 90,  distanceLightYears: 123, brightness: 0.78, colourTemperature: "warm", constellation: "ursa-major" },
  { id: "merak",  name: "Merak",  designation: "Beta Ursae Majoris",  hemisphere: "northern", x: 170, y: 130, distanceLightYears: 79,  brightness: 0.72, colourTemperature: "neutral", constellation: "ursa-major" },
  { id: "phecda", name: "Phecda", designation: "Gamma Ursae Majoris", hemisphere: "northern", x: 220, y: 150, distanceLightYears: 83,  brightness: 0.68, colourTemperature: "neutral", constellation: "ursa-major" },
  { id: "megrez", name: "Megrez", designation: "Delta Ursae Majoris", hemisphere: "northern", x: 250, y: 120, distanceLightYears: 58,  brightness: 0.55, colourTemperature: "neutral", constellation: "ursa-major" },
  { id: "alioth", name: "Alioth", designation: "Epsilon Ursae Majoris", hemisphere: "northern", x: 300, y: 110, distanceLightYears: 81, brightness: 0.8,  colourTemperature: "neutral", constellation: "ursa-major" },
  { id: "mizar",  name: "Mizar",  designation: "Zeta Ursae Majoris",  hemisphere: "northern", x: 340, y: 95,  distanceLightYears: 83,  brightness: 0.75, colourTemperature: "neutral", constellation: "ursa-major" },
  { id: "alkaid", name: "Alkaid", designation: "Eta Ursae Majoris",   hemisphere: "northern", x: 370, y: 80,  distanceLightYears: 104, brightness: 0.77, colourTemperature: "cool", constellation: "ursa-major" },

  // ----- Cassiopeia -----
  { id: "caph",      name: "Caph",      designation: "Beta Cassiopeiae",  hemisphere: "northern", x: 720, y: 100, distanceLightYears: 54,  brightness: 0.7, colourTemperature: "neutral", constellation: "cassiopeia" },
  { id: "schedar",   name: "Schedar",   designation: "Alpha Cassiopeiae", hemisphere: "northern", x: 760, y: 70,  distanceLightYears: 228, brightness: 0.78, colourTemperature: "warm", constellation: "cassiopeia" },
  { id: "gamma-cas", name: "Navi",      designation: "Gamma Cassiopeiae", hemisphere: "northern", x: 800, y: 100, distanceLightYears: 550, brightness: 0.82, colourTemperature: "cool", constellation: "cassiopeia" },
  { id: "ruchbah",   name: "Ruchbah",   designation: "Delta Cassiopeiae", hemisphere: "northern", x: 840, y: 75,  distanceLightYears: 99,  brightness: 0.66, colourTemperature: "neutral", constellation: "cassiopeia" },
  { id: "segin",     name: "Segin",     designation: "Epsilon Cassiopeiae", hemisphere: "northern", x: 880, y: 110, distanceLightYears: 442, brightness: 0.6, colourTemperature: "cool", constellation: "cassiopeia" },

  // ----- Cygnus (The Northern Cross) -----
  { id: "deneb",        name: "Deneb",   designation: "Alpha Cygni", hemisphere: "northern", x: 470, y: 300, distanceLightYears: 2600, brightness: 0.9, colourTemperature: "cool", constellation: "cygnus" },
  { id: "sadr",         name: "Sadr",    designation: "Gamma Cygni", hemisphere: "northern", x: 472, y: 350, distanceLightYears: 1800, brightness: 0.75, colourTemperature: "warm", constellation: "cygnus" },
  { id: "gienah-cygni", name: "Gienah",  designation: "Epsilon Cygni", hemisphere: "northern", x: 430, y: 370, distanceLightYears: 72, brightness: 0.65, colourTemperature: "warm", constellation: "cygnus" },
  { id: "delta-cygni",  name: "Fawaris", designation: "Delta Cygni", hemisphere: "northern", x: 510, y: 335, distanceLightYears: 165, brightness: 0.6, colourTemperature: "cool", constellation: "cygnus" },
  { id: "albireo",      name: "Albireo", designation: "Beta Cygni", hemisphere: "northern", x: 475, y: 440, distanceLightYears: 430, brightness: 0.62, colourTemperature: "warm", constellation: "cygnus" },

  // ----- Lyra -----
  { id: "vega",    name: "Vega",    designation: "Alpha Lyrae", hemisphere: "northern", x: 560, y: 350, distanceLightYears: 25,  brightness: 1.0,  colourTemperature: "cool", constellation: "lyra" },
  { id: "sheliak", name: "Sheliak", designation: "Beta Lyrae",  hemisphere: "northern", x: 580, y: 390, distanceLightYears: 960, brightness: 0.55, colourTemperature: "neutral", constellation: "lyra" },
  { id: "sulafat", name: "Sulafat", designation: "Gamma Lyrae", hemisphere: "northern", x: 600, y: 380, distanceLightYears: 620, brightness: 0.58, colourTemperature: "cool", constellation: "lyra" },

  // ----- Standalone bright stars (no drawn constellation in this version) -----
  { id: "polaris",  name: "Polaris",  designation: "Alpha Ursae Minoris", hemisphere: "northern", x: 500, y: 50,  distanceLightYears: 433, brightness: 0.65, colourTemperature: "neutral", constellation: null },
  { id: "sirius",   name: "Sirius",   designation: "Alpha Canis Majoris", hemisphere: "northern", x: 200, y: 400, distanceLightYears: 8.6,  brightness: 1.0, colourTemperature: "cool", constellation: null },
  { id: "capella",  name: "Capella",  designation: "Alpha Aurigae",       hemisphere: "northern", x: 350, y: 200, distanceLightYears: 43,   brightness: 0.9, colourTemperature: "warm", constellation: null },
  { id: "aldebaran",name: "Aldebaran",designation: "Alpha Tauri",         hemisphere: "northern", x: 300, y: 250, distanceLightYears: 65,   brightness: 0.82, colourTemperature: "warm", constellation: null },
  { id: "castor",   name: "Castor",   designation: "Alpha Geminorum",     hemisphere: "northern", x: 650, y: 350, distanceLightYears: 51,   brightness: 0.7, colourTemperature: "neutral", constellation: null },
  { id: "pollux",   name: "Pollux",   designation: "Beta Geminorum",      hemisphere: "northern", x: 670, y: 360, distanceLightYears: 34,   brightness: 0.75, colourTemperature: "warm", constellation: null },
  { id: "procyon",  name: "Procyon",  designation: "Alpha Canis Minoris", hemisphere: "northern", x: 250, y: 450, distanceLightYears: 11.5, brightness: 0.85, colourTemperature: "neutral", constellation: null },
  { id: "arcturus", name: "Arcturus", designation: "Alpha Bootis",        hemisphere: "northern", x: 750, y: 300, distanceLightYears: 37,   brightness: 0.92, colourTemperature: "warm", constellation: null },
  { id: "regulus",  name: "Regulus",  designation: "Alpha Leonis",        hemisphere: "northern", x: 150, y: 300, distanceLightYears: 79,   brightness: 0.7, colourTemperature: "cool", constellation: null },
];
