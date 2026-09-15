/*
  data/southern-stars.js
  -----------------------
  Interactive stars for the Southern Hemisphere sky.

  See northern-stars.js for a full explanation of every field - this
  file follows exactly the same shape so the rest of the app can treat
  both hemispheres identically.
*/

const SOUTHERN_STARS = [
  // ----- Crux (The Southern Cross) -----
  { id: "acrux",         name: "Acrux",         designation: "Alpha Crucis", hemisphere: "southern", x: 220, y: 270, distanceLightYears: 320, brightness: 0.95, colourTemperature: "cool", constellation: "crux" },
  { id: "mimosa",        name: "Mimosa",        designation: "Beta Crucis",  hemisphere: "southern", x: 260, y: 240, distanceLightYears: 280, brightness: 0.85, colourTemperature: "cool", constellation: "crux" },
  { id: "gacrux",        name: "Gacrux",        designation: "Gamma Crucis", hemisphere: "southern", x: 210, y: 190, distanceLightYears: 88,  brightness: 0.8,  colourTemperature: "warm", constellation: "crux" },
  { id: "delta-crucis",  name: "Imai",          designation: "Delta Crucis", hemisphere: "southern", x: 180, y: 230, distanceLightYears: 345, brightness: 0.6,  colourTemperature: "cool", constellation: "crux" },

  // ----- Centaurus -----
  { id: "alpha-centauri", name: "Alpha Centauri", designation: "Rigil Kentaurus", hemisphere: "southern", x: 300, y: 320, distanceLightYears: 4.37, brightness: 1.0, colourTemperature: "warm", constellation: "centaurus" },
  { id: "hadar",          name: "Hadar",          designation: "Beta Centauri",   hemisphere: "southern", x: 330, y: 290, distanceLightYears: 390,  brightness: 0.9, colourTemperature: "cool", constellation: "centaurus" },

  // ----- Scorpius -----
  { id: "dschubba",      name: "Dschubba",      designation: "Delta Scorpii", hemisphere: "southern", x: 500, y: 340, distanceLightYears: 400, brightness: 0.65, colourTemperature: "cool", constellation: "scorpius" },
  { id: "antares",       name: "Antares",       designation: "Alpha Scorpii", hemisphere: "southern", x: 530, y: 370, distanceLightYears: 550, brightness: 0.95, colourTemperature: "warm", constellation: "scorpius" },
  { id: "sargas",        name: "Sargas",        designation: "Theta Scorpii", hemisphere: "southern", x: 580, y: 410, distanceLightYears: 272, brightness: 0.6,  colourTemperature: "neutral", constellation: "scorpius" },
  { id: "kappa-scorpii", name: "Girtab",        designation: "Kappa Scorpii", hemisphere: "southern", x: 610, y: 430, distanceLightYears: 480, brightness: 0.62, colourTemperature: "cool", constellation: "scorpius" },
  { id: "shaula",        name: "Shaula",        designation: "Lambda Scorpii", hemisphere: "southern", x: 650, y: 440, distanceLightYears: 570, brightness: 0.78, colourTemperature: "cool", constellation: "scorpius" },

  // ----- Carina -----
  { id: "canopus",     name: "Canopus",     designation: "Alpha Carinae", hemisphere: "southern", x: 720, y: 180, distanceLightYears: 310, brightness: 1.0,  colourTemperature: "neutral", constellation: "carina" },
  { id: "miaplacidus", name: "Miaplacidus", designation: "Beta Carinae",  hemisphere: "southern", x: 760, y: 220, distanceLightYears: 113, brightness: 0.72, colourTemperature: "neutral", constellation: "carina" },
  { id: "avior",       name: "Avior",       designation: "Epsilon Carinae", hemisphere: "southern", x: 790, y: 200, distanceLightYears: 630, brightness: 0.68, colourTemperature: "warm", constellation: "carina" },
  { id: "aspidiske",   name: "Aspidiske",   designation: "Iota Carinae", hemisphere: "southern", x: 770, y: 160, distanceLightYears: 690, brightness: 0.6,  colourTemperature: "neutral", constellation: "carina" },

  // ----- Sagittarius (The Teapot) -----
  { id: "kaus-australis", name: "Kaus Australis", designation: "Epsilon Sagittarii", hemisphere: "southern", x: 420, y: 220, distanceLightYears: 143, brightness: 0.8, colourTemperature: "neutral", constellation: "sagittarius" },
  { id: "nunki",          name: "Nunki",          designation: "Sigma Sagittarii",   hemisphere: "southern", x: 460, y: 180, distanceLightYears: 228, brightness: 0.72, colourTemperature: "cool", constellation: "sagittarius" },
  { id: "ascella",        name: "Ascella",        designation: "Zeta Sagittarii",    hemisphere: "southern", x: 440, y: 210, distanceLightYears: 88,  brightness: 0.55, colourTemperature: "neutral", constellation: "sagittarius" },
  { id: "alnasl",         name: "Alnasl",         designation: "Gamma Sagittarii",   hemisphere: "southern", x: 400, y: 190, distanceLightYears: 96,  brightness: 0.58, colourTemperature: "warm", constellation: "sagittarius" },

  // ----- Standalone bright stars -----
  { id: "achernar",  name: "Achernar",  designation: "Alpha Eridani",    hemisphere: "southern", x: 150, y: 100, distanceLightYears: 139, brightness: 0.85, colourTemperature: "cool", constellation: null },
  { id: "fomalhaut", name: "Fomalhaut", designation: "Alpha Piscis Austrini", hemisphere: "southern", x: 850, y: 350, distanceLightYears: 25, brightness: 0.85, colourTemperature: "neutral", constellation: null },
  { id: "peacock",   name: "Peacock",   designation: "Alpha Pavonis",    hemisphere: "southern", x: 600, y: 100, distanceLightYears: 183, brightness: 0.68, colourTemperature: "cool", constellation: null },
  { id: "atria",     name: "Atria",     designation: "Alpha Trianguli Australis", hemisphere: "southern", x: 370, y: 270, distanceLightYears: 391, brightness: 0.66, colourTemperature: "warm", constellation: null },
];
