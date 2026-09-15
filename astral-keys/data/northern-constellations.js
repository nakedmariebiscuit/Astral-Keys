/*
  data/northern-constellations.js
  ---------------------------------
  Recognised constellations for the Northern sky.

  Each entry lists:
    - id / name / hemisphere
    - starIds: which stars (from northern-stars.js) belong to it
    - lines: pairs of star ids that should be connected with a line,
      describing the traditional "stick figure" shape
    - labelPosition: where to draw the constellation's name, roughly at
      the visual centre of its stars

  Keeping constellation data separate from star data means either file
  can be edited independently - for example, adding a new constellation
  never requires touching the star list, as long as it reuses existing
  star ids.
*/

const NORTHERN_CONSTELLATIONS = [
  {
    id: "orion",
    name: "Orion",
    commonName: "Orion",
    hemisphere: "northern",
    starIds: ["betelgeuse", "bellatrix", "alnitak", "alnilam", "mintaka", "saiph", "rigel"],
    lines: [
      ["betelgeuse", "bellatrix"],
      ["betelgeuse", "alnitak"],
      ["alnitak", "alnilam"],
      ["alnilam", "mintaka"],
      ["mintaka", "bellatrix"],
      ["alnitak", "saiph"],
      ["mintaka", "rigel"],
    ],
    labelPosition: { x: 615, y: 200 },
  },
  {
    id: "ursa-major",
    name: "Ursa Major",
    commonName: "The Big Dipper",
    hemisphere: "northern",
    starIds: ["dubhe", "merak", "phecda", "megrez", "alioth", "mizar", "alkaid"],
    lines: [
      ["dubhe", "merak"],
      ["merak", "phecda"],
      ["phecda", "megrez"],
      ["megrez", "dubhe"],
      ["megrez", "alioth"],
      ["alioth", "mizar"],
      ["mizar", "alkaid"],
    ],
    labelPosition: { x: 260, y: 60 },
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    commonName: "Cassiopeia",
    hemisphere: "northern",
    starIds: ["caph", "schedar", "gamma-cas", "ruchbah", "segin"],
    lines: [
      ["caph", "schedar"],
      ["schedar", "gamma-cas"],
      ["gamma-cas", "ruchbah"],
      ["ruchbah", "segin"],
    ],
    labelPosition: { x: 800, y: 55 },
  },
  {
    id: "cygnus",
    name: "Cygnus",
    commonName: "The Northern Cross",
    hemisphere: "northern",
    starIds: ["deneb", "sadr", "gienah-cygni", "delta-cygni", "albireo"],
    lines: [
      ["deneb", "sadr"],
      ["sadr", "gienah-cygni"],
      ["sadr", "delta-cygni"],
      ["sadr", "albireo"],
    ],
    labelPosition: { x: 490, y: 320 },
  },
  {
    id: "lyra",
    name: "Lyra",
    commonName: "Lyra",
    hemisphere: "northern",
    starIds: ["vega", "sheliak", "sulafat"],
    lines: [
      ["vega", "sheliak"],
      ["sheliak", "sulafat"],
      ["sulafat", "vega"],
    ],
    labelPosition: { x: 580, y: 330 },
  },
];
