// Vercel API Route for NFT Collection Listing
// URL: /api/nft/collection/list?q=...&sort=...&traits[Type]=Value&cursor=...&limit=48

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
    
    // Parse query parameters
    const { 
      q = '', 
      sort = 'minted_desc', 
      limit = '48', 
      cursor = '0' 
    } = req.query;

    const limitNum = Math.min(parseInt(limit) || 48, 100); // Cap at 100
    const offsetNum = parseInt(cursor) || 0;

    // Parse trait filters from query params
    const traitFilters = {};
    Object.keys(req.query).forEach(key => {
      const match = key.match(/^traits\[(.+)\]$/);
      if (match) {
        const traitType = match[1];
        const values = Array.isArray(req.query[key]) ? req.query[key] : [req.query[key]];
        traitFilters[traitType] = values;
      }
    });

    // Build GraphQL query
    let whereClause = {
      collection_id: { _eq: COLLECTION_NAME },
      // Note: In a real implementation, we'd also filter by creator_address
      // creator_address: { _eq: process.env.APTOS_CREATOR_ADDRESS }
    };

    // Add search filter
    if (q.trim()) {
      whereClause._or = [
        { token_name: { _ilike: `%${q.trim()}%` } },
        { description: { _ilike: `%${q.trim()}%` } }
      ];
    }

    // Add trait filters (simplified for demo - in real implementation would parse token descriptions)
    // For now, we'll implement trait filtering in post-processing

    // Build order clause
    let orderBy = [];
    switch (sort) {
      case 'minted_desc':
        orderBy = [{ last_transaction_timestamp: 'desc' }];
        break;
      case 'id_asc':
        // Use transaction timestamp for proper numerical ordering (oldest first = lowest ID)
        orderBy = [{ last_transaction_timestamp: 'asc' }];
        break;
      case 'id_desc':
        // Use transaction timestamp for proper numerical ordering (newest first = highest ID)
        orderBy = [{ last_transaction_timestamp: 'desc' }];
        break;
      case 'rarity_desc':
        // For demo, we'll sort by token_name and add rarity in post-processing
        orderBy = [{ token_name: 'asc' }];
        break;
      default:
        orderBy = [{ last_transaction_timestamp: 'desc' }];
    }

    const graphqlQuery = {
      query: `
        query GetCollectionTokens(
          $limit: Int!,
          $offset: Int!,
          $where: current_token_datas_v2_bool_exp!,
          $order_by: [current_token_datas_v2_order_by!]!
        ) {
          current_token_datas_v2(
            where: $where,
            limit: $limit,
            offset: $offset,
            order_by: $order_by
          ) {
            token_name
            token_data_id
            token_uri
            description
            last_transaction_timestamp
          }
        }
      `,
      variables: {
        limit: limitNum,
        offset: offsetNum,
        where: whereClause,
        order_by: orderBy
      }
    };

    console.log('GraphQL Query:', JSON.stringify(graphqlQuery, null, 2));

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
    console.log('Indexer response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const tokens = data.data?.current_token_datas_v2 || [];
    // Since aggregate query is not available, estimate total count for pagination
    const totalCount = tokens.length === limitNum ? offsetNum + limitNum + 1 : offsetNum + tokens.length;

    // Try to get cached rarity data
    let rarityData = null;
    if (global.rarityCache && global.rarityCache.data) {
      rarityData = global.rarityCache.data;
    }

    // Process tokens and add rarity
    const processedTokens = tokens.map((token, index) => {
      // Extract token ID from name
      const tokenIdMatch = token.token_name?.match(/Retro NFT #(\d+)/);
      const tokenId = tokenIdMatch ? tokenIdMatch[1] : '0';

      // Parse attributes from description (fallback)
      const attributes = parseTokenDescription(token.description || '');

      // Get rarity from cache or generate demo rarity
      let rarity = null;
      if (rarityData) {
        const cachedToken = rarityData.tokens.find(t => t.tokenId === tokenId);
        rarity = cachedToken?.rarity || null;
      }
      
      // Fallback to demo rarity if no cached data
      if (!rarity) {
        rarity = generateDemoRarity(parseInt(tokenId));
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
        ],
        rarity
      };
    });

    // Apply trait filters in post-processing
    let filteredTokens = processedTokens;
    if (Object.keys(traitFilters).length > 0) {
      filteredTokens = processedTokens.filter(token => {
        return Object.entries(traitFilters).every(([traitType, values]) => {
          if (traitType === 'Words') {
            // For words, check if any individual word in the combination matches any selected word
            const tokenValue = token.attributes.find(attr => attr.trait_type === traitType)?.value;
            if (!tokenValue) return false;
            const tokenWords = tokenValue.split(' ').map(w => w.trim());
            return values.some(selectedWord => tokenWords.includes(selectedWord));
          } else {
            // For other traits, use exact matching
            const tokenValue = token.attributes.find(attr => attr.trait_type === traitType)?.value;
            return tokenValue && values.includes(tokenValue);
          }
        });
      });
    }

    // Sort by rarity if requested (demo implementation)
    if (sort === 'rarity_desc') {
      filteredTokens.sort((a, b) => (b.rarity?.score || 0) - (a.rarity?.score || 0));
    }

    // Pagination for filtered results
    const hasMore = offsetNum + limitNum < totalCount && filteredTokens.length === limitNum;
    const nextCursor = hasMore ? (offsetNum + limitNum).toString() : undefined;

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    // For HEAD requests, only send headers
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({
      items: filteredTokens,
      nextCursor,
      total: totalCount,
      query: { q, sort, traitFilters, limit: limitNum, cursor: offsetNum }
    });

  } catch (error) {
    console.error('Error fetching collection tokens:', error);
    
    return res.status(500).json({ 
      error: 'Unable to fetch collection tokens',
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

// Hash-based rarity generation (eliminates predictable patterns)
function generateDemoRarity(tokenId) {
  // Use simple hash function to break linear patterns
  const seed = tokenId || 1;
  
  // Create hash-like mixing to eliminate predictable sequences
  let hash = seed;
  hash = ((hash * 17) + 31) ^ (hash >> 3);
  hash = ((hash * 7919) + 1013) ^ (hash >> 7);
  hash = ((hash * 2971) + 8191) ^ (hash >> 11);
  
  // Generate score between 20-100 using the hash
  const score = 20 + (Math.abs(hash) % 80);
  const percentile = Math.floor(score);
  
  let tier;
  if (percentile >= 98) tier = 'S';
  else if (percentile >= 90) tier = 'A';
  else if (percentile >= 60) tier = 'B';
  else if (percentile >= 30) tier = 'C';
  else tier = 'D';

  return {
    score,
    percentile,
    tier
  };
}