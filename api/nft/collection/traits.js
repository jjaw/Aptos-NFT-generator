// Vercel API Route for NFT Collection Trait Aggregations
// URL: /api/nft/collection/traits

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow GET and HEAD requests only
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const INDEXER_API_URL = 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql';
    const COLLECTION_NAME = '0x7981b8f6eda3d2b0ce7ee77ce99dbcf9b26e2cfd1b50bf6cf7ad97fb6b99d575';

    // Query to get all tokens in the collection for trait analysis
    const graphqlQuery = {
      query: `
        query GetCollectionTraits($collection_id: String!) {
          current_token_datas_v2(
            where: {
              collection_id: { _eq: $collection_id }
            }
            limit: 10000
          ) {
            token_name
            description
          }
        }
      `,
      variables: {
        collection_id: COLLECTION_NAME
      }
    };

    console.log('Fetching traits for collection:', COLLECTION_NAME);

    const response = await fetch(INDEXER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      throw new Error(`Indexer API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const tokens = data.data?.current_token_datas_v2 || [];
    const totalMinted = tokens.length; // Use actual token count since aggregate is not available

    // Initialize trait counters
    const traitCounts = {
      'Background Color': {},
      'Shape': {},
      'Words': {}
    };

    // Process each token to extract and count traits
    tokens.forEach(token => {
      const attributes = parseTokenDescription(token.description || '');
      
      // Count background colors
      if (attributes.backgroundColor) {
        const color = attributes.backgroundColor;
        traitCounts['Background Color'][color] = (traitCounts['Background Color'][color] || 0) + 1;
      }

      // Count shapes
      if (attributes.shape) {
        const shape = attributes.shape;
        traitCounts['Shape'][shape] = (traitCounts['Shape'][shape] || 0) + 1;
      }

      // Count individual words from word combinations
      if (attributes.wordCombination) {
        const individualWords = attributes.wordCombination.split(' ');
        individualWords.forEach(word => {
          if (word.trim()) {
            traitCounts['Words'][word.trim()] = (traitCounts['Words'][word.trim()] || 0) + 1;
          }
        });
      }
    });

    // If no minted tokens found, provide default trait structure based on contract
    if (totalMinted === 0) {
      traitCounts['Background Color'] = getDefaultBackgroundColors();
      traitCounts['Shape'] = getDefaultShapes();
      traitCounts['Words'] = {}; // Words are too numerous to pre-populate
    }

    // Collection stats
    const stats = {
      totalSupply: 10000, // Max supply from contract
      totalMinted: totalMinted,
      lastUpdated: new Date().toISOString()
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    // For HEAD requests, only send headers
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({
      traits: traitCounts,
      stats
    });

  } catch (error) {
    console.error('Error fetching collection traits:', error);
    
    return res.status(500).json({ 
      error: 'Unable to fetch collection traits',
      details: error.message
    });
  }
};

// Helper function to parse token description
function parseTokenDescription(description) {
  if (!description) return {};
  
  const bgMatch = description.match(/(#[A-Fa-f0-9]{6}) background/);
  const shapeMatch = description.match(/background, (\w+) shape/);
  const wordsMatch = description.match(/words: (.+)$/);
  
  return {
    backgroundColor: bgMatch ? bgMatch[1] : null,
    shape: shapeMatch ? shapeMatch[1] : null,
    wordCombination: wordsMatch ? wordsMatch[1].trim() : null
  };
}

// Default background colors from contract (13 colors)
function getDefaultBackgroundColors() {
  return {
    '#FF0080': 0, // NEON_PINK
    '#0080FF': 0, // ELECTRIC_BLUE
    '#8000FF': 0, // CYBER_PURPLE
    '#00FF80': 0, // LASER_GREEN
    '#FF8000': 0, // SUNSET_ORANGE
    '#FFFF00': 0, // ACID_YELLOW
    '#FF0040': 0, // HOT_MAGENTA
    '#00FFFF': 0, // PLASMA_CYAN
    '#FF4000': 0, // RETRO_RED
    '#80FF00': 0, // VOLT_LIME
    '#4000FF': 0, // NEON_VIOLET
    '#C0C0C0': 0, // CHROME_SILVER
    '#FFBF00': 0  // GOLDEN_AMBER
  };
}

// Default shapes from contract with rarity ordering
function getDefaultShapes() {
  return {
    'Circle': 0,    // 25.6%
    'Square': 0,    // 19.2%
    'Triangle': 0,  // 14.4%
    'Diamond': 0,   // 10.8%
    'Star': 0,      // 8.1%
    'Pentagon': 0,  // 6.1%
    'Hexagon': 0,   // 4.6%
    'Octagon': 0,   // 3.4%
    'Cross': 0,     // 2.6%
    'Heart': 0,     // 1.9%
    'Arrow': 0,     // 1.4%
    'Spiral': 0,    // 1.1%
    'Infinity': 0   // 0.8%
  };
}