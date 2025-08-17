// Vercel API Route for Rarity Refresh (Admin/Cron Trigger)
// URL: /api/nft/rarity/refresh

const { calculateRarityForCollection } = require('../../../lib/rarity');

// In-memory cache for rarity data (in production, use Redis)
global.rarityCache = global.rarityCache || {
  data: null,
  lastUpdated: null,
  isUpdating: false
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if update is already in progress
    if (global.rarityCache.isUpdating) {
      return res.status(200).json({
        status: 'in_progress',
        message: 'Rarity update already in progress',
        lastUpdated: global.rarityCache.lastUpdated
      });
    }

    // Start the update process
    global.rarityCache.isUpdating = true;
    const updateStartTime = new Date().toISOString();

    console.log('Starting rarity refresh at:', updateStartTime);

    const INDEXER_API_URL = 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql';
    const COLLECTION_NAME = 'Retro 80s NFT Collection 2025-01-08-v2-unique';

    // Fetch all tokens in the collection
    const graphqlQuery = {
      query: `
        query GetAllCollectionTokens($collection_name: String!) {
          current_token_datas_v2(
            where: {
              collection_name: { _eq: $collection_name }
            }
            limit: 10000
            order_by: { token_name: asc }
          ) {
            token_name
            token_data_id_hash
            token_uri
            description
            last_transaction_timestamp
            current_token_data {
              metadata
            }
          }
        }
      `,
      variables: {
        collection_name: COLLECTION_NAME
      }
    };

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
    console.log(`Fetched ${tokens.length} tokens for rarity calculation`);

    // Process tokens and build trait counts
    const traitCounts = {
      'Background Color': {},
      'Shape': {},
      'Words': {}
    };

    const processedTokens = tokens.map(token => {
      const tokenIdMatch = token.token_name?.match(/Retro NFT #(\d+)/);
      const tokenId = tokenIdMatch ? tokenIdMatch[1] : '0';

      // Parse attributes from description
      const attributes = parseTokenDescription(token.description || '');

      // Count traits
      if (attributes.backgroundColor) {
        const color = attributes.backgroundColor;
        traitCounts['Background Color'][color] = (traitCounts['Background Color'][color] || 0) + 1;
      }

      if (attributes.shape) {
        const shape = attributes.shape;
        traitCounts['Shape'][shape] = (traitCounts['Shape'][shape] || 0) + 1;
      }

      if (attributes.wordCombination) {
        const words = attributes.wordCombination;
        traitCounts['Words'][words] = (traitCounts['Words'][words] || 0) + 1;
      }

      // Generate image URL
      const bgColor = attributes.backgroundColor?.substring(1) || 'FF0080';
      const encodedWords = encodeURIComponent(attributes.wordCombination || 'DEMO NEON WAVE');
      const imageUrl = `https://www.aptosnft.com/api/nft/generate?bg=${bgColor}&shape=${attributes.shape || 'Circle'}&words=${encodedWords}`;

      return {
        tokenId,
        name: token.token_name || `Retro NFT #${tokenId}`,
        image: imageUrl,
        mintedAt: token.last_transaction_timestamp || new Date().toISOString(),
        attributes: [
          { trait_type: 'Background Color', value: attributes.backgroundColor || '#FF0080' },
          { trait_type: 'Shape', value: attributes.shape || 'Circle' },
          { trait_type: 'Words', value: attributes.wordCombination || 'DEMO NEON WAVE' }
        ]
      };
    });

    console.log('Trait counts:', JSON.stringify(traitCounts, null, 2));

    // Calculate rarity for all tokens
    const tokensWithRarity = calculateRarityForCollection(processedTokens, traitCounts);

    console.log(`Calculated rarity for ${tokensWithRarity.length} tokens`);

    // Update cache
    global.rarityCache.data = {
      tokens: tokensWithRarity,
      traitCounts,
      totalMinted: tokensWithRarity.length,
      calculatedAt: updateStartTime
    };
    global.rarityCache.lastUpdated = updateStartTime;
    global.rarityCache.isUpdating = false;

    console.log('Rarity refresh completed at:', new Date().toISOString());

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    return res.status(200).json({
      status: 'updated',
      updatedAt: updateStartTime,
      tokensProcessed: tokensWithRarity.length,
      message: 'Rarity data refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing rarity data:', error);
    
    // Reset updating flag on error
    global.rarityCache.isUpdating = false;
    
    return res.status(500).json({ 
      status: 'error',
      error: 'Unable to refresh rarity data',
      details: error.message,
      lastUpdated: global.rarityCache.lastUpdated
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