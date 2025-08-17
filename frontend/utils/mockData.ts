// Mock data for gallery demo when API is not available

export interface MockToken {
  tokenId: string;
  name: string;
  image: string;
  mintedAt: string;
  attributes: Array<{ trait_type: string; value: string }>;
  rarity?: {
    score: number;
    percentile: number;
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
  };
}

// Shape probabilities from contract
const SHAPES = [
  { name: 'Circle', probability: 0.256 },
  { name: 'Square', probability: 0.192 },
  { name: 'Triangle', probability: 0.144 },
  { name: 'Diamond', probability: 0.108 },
  { name: 'Star', probability: 0.081 },
  { name: 'Pentagon', probability: 0.061 },
  { name: 'Hexagon', probability: 0.046 },
  { name: 'Octagon', probability: 0.034 },
  { name: 'Cross', probability: 0.026 },
  { name: 'Heart', probability: 0.019 },
  { name: 'Arrow', probability: 0.014 },
  { name: 'Spiral', probability: 0.011 },
  { name: 'Infinity', probability: 0.008 }
];

const BACKGROUND_COLORS = [
  '#FF0080', '#0080FF', '#8000FF', '#00FF80', '#FF8000',
  '#FFFF00', '#FF0040', '#00FFFF', '#FF4000', '#80FF00',
  '#4000FF', '#C0C0C0', '#FFBF00'
];

const WORDS = [
  'NEON', 'WAVE', 'GLOW', 'BEAM', 'FLUX', 'SYNC', 'GRID', 'CODE',
  'BYTE', 'HACK', 'ECHO', 'VIBE', 'NOVA', 'ZETA', 'APEX', 'CORE',
  'EDGE', 'FLOW', 'HYPE', 'IRIS', 'JADE', 'KILO', 'LOOP', 'MAZE',
  'NEXT', 'OMNI', 'PACE', 'QUAD', 'RAVE', 'SAGE', 'TECH', 'UNIT'
];

function generateMockToken(id: number): MockToken {
  // Deterministic generation based on ID
  const seed = id * 12345;
  
  // Select attributes
  const bgIndex = seed % BACKGROUND_COLORS.length;
  const backgroundColor = BACKGROUND_COLORS[bgIndex];
  
  const shapeIndex = Math.floor(seed / 7) % SHAPES.length;
  const shape = SHAPES[shapeIndex];
  
  const word1Index = (seed * 17) % WORDS.length;
  const word2Index = (seed * 23) % WORDS.length;
  const word3Index = (seed * 31) % WORDS.length;
  const wordCombination = `${WORDS[word1Index]} ${WORDS[word2Index]} ${WORDS[word3Index]}`;
  
  // Generate rarity score using deterministic but varied approach
  const shapeRarity = shape.probability;
  const bgRarity = 1 / BACKGROUND_COLORS.length;
  
  // Use a more realistic rarity distribution
  // Most tokens should be common, with few rare ones
  const seedHash = (seed * 2654435761) % 2147483647; // Simple hash
  const rarityRoll = (seedHash % 10000) / 10000; // 0 to 1
  
  // Create a realistic distribution
  let percentile;
  if (rarityRoll < 0.30) {
    percentile = Math.floor(rarityRoll * 100); // 0-30th percentile (30% of tokens)
  } else if (rarityRoll < 0.60) {
    percentile = 30 + Math.floor((rarityRoll - 0.30) * 100); // 30-60th percentile (30% of tokens)
  } else if (rarityRoll < 0.90) {
    percentile = 60 + Math.floor((rarityRoll - 0.60) * 100); // 60-90th percentile (30% of tokens)
  } else if (rarityRoll < 0.98) {
    percentile = 90 + Math.floor((rarityRoll - 0.90) * 100); // 90-98th percentile (8% of tokens)
  } else {
    percentile = 98 + Math.floor((rarityRoll - 0.98) * 100); // 98-100th percentile (2% of tokens)
  }
  
  percentile = Math.min(99, Math.max(1, percentile));
  const normalizedScore = percentile;
  
  let tier: 'S' | 'A' | 'B' | 'C' | 'D';
  if (percentile >= 98) tier = 'S';
  else if (percentile >= 90) tier = 'A';
  else if (percentile >= 60) tier = 'B';
  else if (percentile >= 30) tier = 'C';
  else tier = 'D';
  
  // Generate image URL
  const bgColor = backgroundColor.substring(1);
  const encodedWords = encodeURIComponent(wordCombination);
  const imageUrl = `https://www.aptosnft.com/api/nft/generate?bg=${bgColor}&shape=${shape.name}&words=${encodedWords}`;
  
  return {
    tokenId: id.toString(),
    name: `Retro NFT #${id}`,
    image: imageUrl,
    mintedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    attributes: [
      { trait_type: 'Background Color', value: backgroundColor },
      { trait_type: 'Shape', value: shape.name },
      { trait_type: 'Words', value: wordCombination }
    ],
    rarity: {
      score: Math.round(normalizedScore * 10) / 10,
      percentile,
      tier
    }
  };
}

export function generateMockTokens(count: number = 50, offset: number = 0): MockToken[] {
  const tokens: MockToken[] = [];
  for (let i = 1; i <= count; i++) {
    tokens.push(generateMockToken(offset + i));
  }
  return tokens;
}

export const mockCollectionStats = {
  totalSupply: 10000,
  totalMinted: 847,
  lastUpdated: new Date().toISOString()
};

export const mockTraitCounts = {
  'Background Color': BACKGROUND_COLORS.reduce((acc, color) => {
    acc[color] = Math.floor(Math.random() * 100) + 10;
    return acc;
  }, {} as Record<string, number>),
  
  'Shape': SHAPES.reduce((acc, shape) => {
    acc[shape.name] = Math.floor(shape.probability * 1000);
    return acc;
  }, {} as Record<string, number>),
  
  'Words': {}
};

// API-like functions for development
export async function fetchMockTokens(params: {
  q?: string;
  sort?: string;
  limit?: number;
  cursor?: string;
  traitFilters?: Record<string, string[]>;
}): Promise<{
  items: MockToken[];
  nextCursor?: string;
  total: number;
}> {
  const { q = '', sort = 'minted_desc', limit = 48, cursor = '0', traitFilters = {} } = params;
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const offset = parseInt(cursor);
  let tokens = generateMockTokens(limit, offset);
  
  // Apply search filter
  if (q) {
    tokens = tokens.filter(token => 
      token.name.toLowerCase().includes(q.toLowerCase()) ||
      token.tokenId.includes(q)
    );
  }
  
  // Apply trait filters
  if (Object.keys(traitFilters).length > 0) {
    tokens = tokens.filter(token => {
      return Object.entries(traitFilters).every(([traitType, values]) => {
        const tokenValue = token.attributes.find(attr => attr.trait_type === traitType)?.value;
        return tokenValue && values.includes(tokenValue);
      });
    });
  }
  
  // Apply sorting
  switch (sort) {
    case 'id_asc':
      tokens.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));
      break;
    case 'id_desc':
      tokens.sort((a, b) => parseInt(b.tokenId) - parseInt(a.tokenId));
      break;
    case 'rarity_desc':
      tokens.sort((a, b) => (b.rarity?.score || 0) - (a.rarity?.score || 0));
      break;
    case 'minted_desc':
    default:
      tokens.sort((a, b) => new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime());
      break;
  }
  
  const hasMore = offset + limit < 1000; // Simulate finite collection
  
  return {
    items: tokens,
    nextCursor: hasMore ? (offset + limit).toString() : undefined,
    total: 1000
  };
}