/*
  data/southern-constellations.js
  ---------------------------------
  Recognised constellations for the Southern sky.
  See northern-constellations.js for a full explanation of the shape.
*/

const SOUTHERN_CONSTELLATIONS = [
  {
    id: "crux",
    name: "Crux",
    commonName: "The Southern Cross",
    hemisphere: "southern",
    starIds: ["acrux", "mimosa", "gacrux", "delta-crucis"],
    lines: [
      ["gacrux", "acrux"],
      ["delta-crucis", "mimosa"],
    ],
    labelPosition: { x: 230, y: 235 },
  },
  {
    id: "centaurus",
    name: "Centaurus",
    commonName: "Centaurus",
    hemisphere: "southern",
    starIds: ["alpha-centauri", "hadar"],
    lines: [["alpha-centauri", "hadar"]],
    labelPosition: { x: 315, y: 350 },
  },
  {
    id: "scorpius",
    name: "Scorpius",
    commonName: "The Scorpion",
    hemisphere: "southern",
    starIds: ["dschubba", "antares", "sargas", "kappa-scorpii", "shaula"],
    lines: [
      ["dschubba", "antares"],
      ["antares", "sargas"],
      ["sargas", "kappa-scorpii"],
      ["kappa-scorpii", "shaula"],
    ],
    labelPosition: { x: 560, y: 320 },
  },
  {
    id: "carina",
    name: "Carina",
    commonName: "Carina",
    hemisphere: "southern",
    starIds: ["canopus", "miaplacidus", "avior", "aspidiske"],
    lines: [
      ["canopus", "miaplacidus"],
      ["miaplacidus", "avior"],
      ["avior", "aspidiske"],
      ["aspidiske", "canopus"],
    ],
    labelPosition: { x: 755, y: 130 },
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    commonName: "The Teapot",
    hemisphere: "southern",
    starIds: ["kaus-australis", "nunki", "ascella", "alnasl"],
    lines: [
      ["kaus-australis", "alnasl"],
      ["alnasl", "nunki"],
      ["nunki", "ascella"],
      ["ascella", "kaus-australis"],
    ],
    labelPosition: { x: 440, y: 150 },
  },
];
