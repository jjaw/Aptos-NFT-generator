// Vercel API Route for NFT Metadata
// URL: https://www.aptosnft.com/api/nft/metadata?id=12345

module.exports = (req, res) => {
  // Allow GET and HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract token ID from query parameters
  const { id } = req.query;
  
  // Validate token ID
  if (!id) {
    return res.status(400).json({ error: 'Missing token ID parameter' });
  }

  // Convert token ID to number and use as seed for deterministic generation
  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    return res.status(400).json({ error: 'Invalid token ID' });
  }

  // Generate deterministic NFT attributes based on token ID
  // This matches the logic in the smart contract
  const generateMetadata = (seed) => {
    // Background colors (5 variations)
    const backgroundColors = ['#FF0080', '#0080FF', '#FF8000', '#8000FF', '#00FF80'];
    const bgIndex = seed % backgroundColors.length;
    const backgroundColor = backgroundColors[bgIndex];

    // Shapes (13 variations)  
    const shapes = ['Circle', 'Square', 'Triangle', 'Diamond', 'Star', 'Pentagon', 'Hexagon', 'Octagon', 'Cross', 'Heart', 'Arrow', 'Spiral', 'Infinity'];
    const shapeIndex = Math.floor(seed / 7) % shapes.length;
    const shape = shapes[shapeIndex];

    // Words (using same algorithm as smart contract)
    const fourLetterWords = ['NEON', 'GLOW', 'WAVE', 'SYNC', 'FLUX', 'BEAM', 'CORE', 'VOLT', 'ECHO', 'RUSH', 'FIRE', 'VOID', 'NOVA', 'RAGE', 'VIBE', 'HACK', 'CODE', 'DATA', 'LINK', 'MESH', 'NODE', 'PEAK', 'EDGE', 'FLOW', 'GRID', 'HYPE', 'IRIS', 'JADE', 'KILO', 'LOOP', 'MEGA', 'NULL', 'APEX', 'BYTE', 'CHIP', 'DEMO', 'EXIT', 'FAST', 'GAME', 'HOST', 'ICON', 'JUMP', 'KICK', 'LITE', 'MODE', 'NEXT', 'OPEN', 'PING', 'QUIT', 'ROOT', 'SAVE', 'TECH', 'USER', 'VIEW', 'WIFI', 'ZOOM', 'ABLE', 'BOLD', 'CALM', 'DEEP', 'EPIC', 'FREE', 'GOOD', 'HIGH', 'JUST', 'KEEN', 'LIVE', 'MILD', 'NICE', 'ONLY', 'PURE', 'REAL', 'SOFT', 'TRUE', 'VAST', 'WISE', 'ZERO', 'SAGE'];
    
    const wordSeed = Math.floor(seed * 1.618);
    const word1Index = wordSeed % fourLetterWords.length;
    const word2Index = Math.floor(wordSeed / 17) % fourLetterWords.length;
    const word3Index = Math.floor(wordSeed / 23) % fourLetterWords.length;
    
    const wordCombination = `${fourLetterWords[word1Index]} ${fourLetterWords[word2Index]} ${fourLetterWords[word3Index]}`;

    return {
      backgroundColor,
      shape,
      wordCombination,
      tokenId
    };
  };

  const metadata = generateMetadata(tokenId);
  
  // Generate image URL (properly encoded)
  const bgColor = metadata.backgroundColor.substring(1); // Remove #
  const encodedWords = encodeURIComponent(metadata.wordCombination);
  const imageUrl = `https://www.aptosnft.com/api/nft/generate?bg=${bgColor}&shape=${metadata.shape}&words=${encodedWords}`;

  // Create the metadata JSON
  const nftMetadata = {
    name: `Retro NFT #${tokenId}`,
    description: `A unique retro 80s NFT with ${metadata.backgroundColor} background, ${metadata.shape} shape, and words: ${metadata.wordCombination}`,
    image: imageUrl,
    attributes: [
      {
        trait_type: "Background Color",
        value: metadata.backgroundColor
      },
      {
        trait_type: "Shape", 
        value: metadata.shape
      },
      {
        trait_type: "Words",
        value: metadata.wordCombination
      }
    ]
  };

  // Set headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Access-Control-Allow-Origin', '*');

  // For HEAD requests, only send headers
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  // Return the metadata JSON
  return res.status(200).json(nftMetadata);
};