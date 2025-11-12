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
    const NEW_CONTRACT_ADDRESS = '0x099d43f357f7993b7021e53c6a7cf9d74a81c11924818a0230ed7625fbcddb2b';
    
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

    // When search query or trait filters are applied, we need to fetch ALL tokens to filter correctly
    // Otherwise we only filter within the first page of results
    const hasFilters = q.trim() || Object.keys(traitFilters).length > 0;

    // Build GraphQL query
    let whereClause = {
      collection_id: { _eq: COLLECTION_NAME }
    };

    // Note: Search and trait filtering are done in post-processing for accuracy
    // This allows for word-level matching instead of simple pattern matching

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

    // Fetch tokens with pagination when filters are applied (indexer limits to 100 per request)
    let tokens = [];

    if (hasFilters) {
      // Fetch ALL tokens using pagination
      const BATCH_SIZE = 100;
      let offset = 0;
      let hasMore = true;

      console.log('Filters applied, fetching all tokens with pagination...');

      while (hasMore) {
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
            limit: BATCH_SIZE,
            offset: offset,
            where: whereClause,
            order_by: orderBy
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

        const batch = data.data?.current_token_datas_v2 || [];
        tokens = tokens.concat(batch);

        console.log(`Fetched batch at offset ${offset}: ${batch.length} tokens (total so far: ${tokens.length})`);

        // Continue if we got a full batch, stop if we got less (end of data)
        if (batch.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          offset += BATCH_SIZE;
        }

        // Safety limit: stop after fetching 10,000 tokens
        if (offset >= 10000) {
          console.log('Reached safety limit of 10,000 tokens');
          hasMore = false;
        }
      }
    } else {
      // No filters, fetch single page only
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

      console.log('No filters, fetching single page:', JSON.stringify({ limit: limitNum, offset: offsetNum }));

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

      tokens = data.data?.current_token_datas_v2 || [];
    }

    // Deduplicate tokens by token_data_id to ensure each unique token is processed only once
    const uniqueTokens = Array.from(
      new Map(tokens.map(token => [token.token_data_id || token.token_name, token])).values()
    );

    console.log(`List API: Fetched ${tokens.length} records, ${uniqueTokens.length} unique tokens`);

    // Diagnostic logging: identify all creator addresses in the collection
    const creatorAddresses = new Set(uniqueTokens.map(t => {
      return t.token_data_id?.split('::')[0];
    }));
    console.log('List API - Creator addresses found:', Array.from(creatorAddresses));

    // ========== MALFORMED TOKEN VALIDATION ==========
    // Identify and skip tokens with invalid name formats (non-numeric token IDs)
    const validTokenPattern = /^Retro NFT #(\d+)$/;
    const malformedTokens = [];
    const validTokens = [];

    uniqueTokens.forEach(token => {
      // Clean control characters for validation
      const cleanName = token.token_name?.replace(/[\x00-\x1F\x7F]/g, '') || '';
      const isValid = validTokenPattern.test(cleanName);

      if (!isValid) {
        // Extract words from description for diagnostic logging
        const attributes = parseTokenDescription(token.description || '');
        const words = attributes.wordCombination ? attributes.wordCombination.split(' ') : [];

        malformedTokens.push({
          name: token.token_name,
          cleanName,
          words,
          token_data_id: token.token_data_id
        });
      } else {
        validTokens.push(token);
      }
    });

    // Log comprehensive malformed token summary ONCE at the start
    console.log('========== LIST API: MALFORMED TOKENS SUMMARY ==========');
    console.log(`Total malformed tokens being skipped: ${malformedTokens.length}`);
    console.log('All malformed tokens:', JSON.stringify(malformedTokens.map(t => ({
      name: t.name,
      cleanName: t.cleanName,
      words: t.words
    })), null, 2));
    console.log('==========================================================');

    // Try to get cached rarity data
    let rarityData = null;
    if (global.rarityCache && global.rarityCache.data) {
      rarityData = global.rarityCache.data;
    }

    // Process ONLY valid tokens and add rarity
    const processedTokens = validTokens.map((token, index) => {
      // Extract token ID from name with improved parsing
      // First, strip control characters from the name
      const cleanName = token.token_name?.replace(/[\x00-\x1F\x7F]/g, '');
      const tokenIdMatch = cleanName?.match(/Retro NFT #(\d+)/);

      // If name parsing fails, try to extract from token_data_id
      let tokenId = tokenIdMatch ? tokenIdMatch[1] : null;
      if (!tokenId && token.token_data_id) {
        // token_data_id format: address::module::TokenName
        const idParts = token.token_data_id.split('::');
        const lastPart = idParts[idParts.length - 1];
        const idFromDataId = lastPart.match(/\d+/);
        tokenId = idFromDataId ? idFromDataId[0] : String(index);
      }

      // Final fallback to index if all parsing fails
      tokenId = tokenId || String(index);

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

    // Apply search filter in post-processing (to match mock data behavior)
    let filteredTokens = processedTokens;

    if (q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      filteredTokens = filteredTokens.filter(token => {
        // Search by name or ID
        const nameMatch = token.name.toLowerCase().includes(searchTerm);
        const idMatch = token.tokenId.includes(q.trim());

        // Search by individual words in word combination
        const wordsAttribute = token.attributes.find(attr => attr.trait_type === 'Words');
        const wordMatch = wordsAttribute ?
          wordsAttribute.value.split(' ').some(word => word.toLowerCase().includes(searchTerm)) :
          false;

        return nameMatch || idMatch || wordMatch;
      });
    }

    // Apply trait filters in post-processing
    if (Object.keys(traitFilters).length > 0) {
      console.log('DEBUG LIST API: Applying trait filters:', JSON.stringify(traitFilters));
      console.log('DEBUG LIST API: Total tokens before filtering:', filteredTokens.length);

      filteredTokens = filteredTokens.filter(token => {
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

      console.log('DEBUG LIST API: Total tokens after filtering:', filteredTokens.length);

      // Debug: If filtering by #8000FF, show all matched tokens
      if (traitFilters['Background Color']?.includes('#8000FF')) {
        console.log('DEBUG LIST API: Tokens with #8000FF background:', JSON.stringify(filteredTokens.map(t => ({
          name: t.name,
          tokenId: t.tokenId,
          backgroundColor: t.attributes.find(attr => attr.trait_type === 'Background Color')?.value
        })), null, 2));
      }
    }

    // Sort by rarity if requested (demo implementation)
    if (sort === 'rarity_desc') {
      filteredTokens.sort((a, b) => (b.rarity?.score || 0) - (a.rarity?.score || 0));
    }

    // Apply pagination to filtered results
    const totalFiltered = filteredTokens.length;
    const paginatedTokens = filteredTokens.slice(offsetNum, offsetNum + limitNum);

    // Calculate pagination metadata
    const hasMore = offsetNum + limitNum < totalFiltered;
    const nextCursor = hasMore ? (offsetNum + limitNum).toString() : undefined;

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    // For HEAD requests, only send headers
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json({
      items: paginatedTokens,
      nextCursor,
      total: totalFiltered,
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