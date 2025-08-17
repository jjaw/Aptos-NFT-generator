// Local preview generator that replicates the smart contract's randomization logic
// This eliminates the need to call the contract for previews

export interface NFTMetadata {
  background_color: string;
  shape: string;
  word_combination: string;
  token_id: number;
}

// Background colors (copied exactly from contract lines 34-46)
const BACKGROUND_COLORS = [
  "#FF0080", // NEON_PINK
  "#0080FF", // ELECTRIC_BLUE
  "#8000FF", // CYBER_PURPLE
  "#00FF80", // LASER_GREEN
  "#FF8000", // SUNSET_ORANGE
  "#FFFF00", // ACID_YELLOW
  "#FF0040", // HOT_MAGENTA
  "#00FFFF", // PLASMA_CYAN
  "#FF4000", // RETRO_RED
  "#80FF00", // VOLT_LIME
  "#4000FF", // NEON_VIOLET
  "#C0C0C0", // CHROME_SILVER
  "#FFBF00"  // GOLDEN_AMBER
];

// Shape names (copied exactly from contract lines 49-53)
const SHAPE_NAMES = [
  "Circle", "Square", "Triangle", "Diamond", "Star",
  "Pentagon", "Hexagon", "Octagon", "Cross", "Heart",
  "Arrow", "Spiral", "Infinity"
];

// Cumulative probabilities for shapes (copied exactly from contract lines 56-59)
const SHAPE_CUMULATIVE_PROBS = [
  2000, 3500, 4625, 5469, 6102, 6577, 6933, 7200, 7400, 7550,
  7663, 7747, 7810
];

// Four-letter words for combinations (copied exactly from contract lines 62-76)
const FOUR_LETTER_WORDS = [
  "NEON", "WAVE", "GLOW", "BEAM", "FLUX", "SYNC", "GRID", "CODE",
  "BYTE", "HACK", "ECHO", "VIBE", "NOVA", "ZETA", "APEX", "CORE",
  "EDGE", "FLOW", "HYPE", "IRIS", "JADE", "KILO", "LOOP", "MAZE",
  "NEXT", "OMNI", "PACE", "QUAD", "RAVE", "SAGE", "TECH", "UNIT",
  "VOID", "WARP", "XRAY", "YARN", "ZOOM", "BOLT", "CALM", "DAWN",
  "FURY", "GATE", "HERO", "ICON", "JACK", "KICK", "LOCK", "MECH",
  "NODE", "OPEN", "PEAK", "QUIT", "RISK", "SLIM", "TANK", "USER",
  "VERY", "WILD", "XBOX", "YEAR", "ZERO", "ATOM", "BLUE", "CHIP",
  "DATA", "EPIC", "FAST", "GOLD", "HARD", "ITEM", "JOLT", "KEEP",
  "LOAD", "MEGA", "NANO", "OPAL", "PLUG", "QUIZ", "RUSH", "SOUL",
  "TIDE", "UBER", "VOLT", "WISE", "OXEN", "YOGI", "ZINC", "ALTO",
  "BETA", "CURE", "DUNE", "ECHO", "FIRE", "GURU", "HOPE", "ICON",
  "JUMP", "KING", "LION", "MINT", "NOVA", "ONYX", "PURE", "QUIT"
];

// Get shape index based on weighted probabilities (copied from contract lines 518-531)
function getShapeIndex(rand: number): number {
  for (let i = 0; i < SHAPE_CUMULATIVE_PROBS.length; i++) {
    if (rand < SHAPE_CUMULATIVE_PROBS[i]) {
      return i;
    }
  }
  // Fallback to last shape
  return SHAPE_CUMULATIVE_PROBS.length - 1;
}

// Generate random metadata using the exact same algorithm as the contract
// Replicates the logic from contract's generate_random_metadata function (lines 459-515)
export function generateLocalPreview(seed: number): NFTMetadata {
  const tokenId = 0; // Preview uses token_id = 0, same as contract line 703
  
  // Generate background color using hash-based randomization (13 colors)
  // Same algorithm as contract lines 461-462
  const bgSeed = seed + (tokenId << 4) + 0x1000;
  const bgIndex = bgSeed % 13;
  const backgroundColor = BACKGROUND_COLORS[bgIndex];

  // Generate shape using OPTIMAL prime that creates maximum distribution gaps
  // Same algorithm as contract lines 493-495
  const shapeRand = (tokenId * 3571) % 7810;
  const shapeIndex = getShapeIndex(shapeRand);
  const shape = SHAPE_NAMES[shapeIndex];

  // Generate three random words using hash-based randomization
  // For preview (tokenId=0), we need different variations to avoid identical words
  const wordBaseSeed = seed + (tokenId << 16) + 0x3000;
  const word1Index = wordBaseSeed % FOUR_LETTER_WORDS.length;
  const word2Index = (wordBaseSeed + 12345) % FOUR_LETTER_WORDS.length;
  const word3Index = (wordBaseSeed + 67890) % FOUR_LETTER_WORDS.length;
  
  const word1 = FOUR_LETTER_WORDS[word1Index];
  const word2 = FOUR_LETTER_WORDS[word2Index];
  const word3 = FOUR_LETTER_WORDS[word3Index];
  
  const wordCombination = `${word1} ${word2} ${word3}`;

  return {
    background_color: backgroundColor,
    shape: shape,
    word_combination: wordCombination,
    token_id: tokenId,
  };
}