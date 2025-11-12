// Vercel API Route for NFT Metadata - Reads from Blockchain
// URL: https://www.aptosnft.com/api/nft/metadata?id=12345

module.exports = async (req, res) => {
  // Set CORS headers for all requests first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    return res.status(400).json({ error: 'Invalid token ID' });
  }

  try {
    const APTOS_API_URL = 'https://fullnode.testnet.aptoslabs.com/v1';
    const INDEXER_API_URL = 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql';
    const MODULE_ADDRESS = '0x099d43f357f7993b7021e53c6a7cf9d74a81c11924818a0230ed7625fbcddb2b';
    
    let tokenDescription = null;
    
    // Try the Aptos Indexer GraphQL API first for scalable token lookup
    try {
      const graphqlQuery = {
        query: `
          query GetTokenData($token_name: String!) {
            current_token_datas_v2(
              where: {
                token_name: {_eq: $token_name}
              }
              limit: 1
            ) {
              description
              token_name
              collection_id
            }
          }
        `,
        variables: {
          token_name: `Retro NFT #${tokenId}`
        }
      };
      
      const indexerResponse = await fetch(INDEXER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlQuery)
      });
      
      if (indexerResponse.ok) {
        const indexerData = await indexerResponse.json();
        console.log('Indexer response for token', tokenId, ':', JSON.stringify(indexerData, null, 2));
        if (indexerData.data?.current_token_datas_v2?.length > 0) {
          tokenDescription = indexerData.data.current_token_datas_v2[0].description;
        }
      } else {
        console.log('Indexer response failed:', indexerResponse.status, await indexerResponse.text());
      }
    } catch (indexerError) {
      console.log('Indexer lookup failed, falling back to transaction search:', indexerError.message);
    }
    
    // Fallback: Search recent transactions if indexer fails
    if (!tokenDescription) {
      const txResponse = await fetch(`${APTOS_API_URL}/accounts/${MODULE_ADDRESS}/transactions?limit=500`);
      
      if (txResponse.ok) {
        const transactions = await txResponse.json();
        
        for (const tx of transactions) {
          if (tx.success && tx.events) {
            for (const event of tx.events) {
              if (event.data && event.data.description) {
                const tokenIdMatch = event.data.description.match(/Retro NFT #(\d+)/);
                if (tokenIdMatch && parseInt(tokenIdMatch[1]) === tokenId) {
                  tokenDescription = event.data.description;
                  break;
                }
              }
            }
            if (tokenDescription) break;
          }
        }
      }
    }
    
    // If still not found, return 404
    if (!tokenDescription) {
      return res.status(404).json({
        error: 'Token not found',
        tokenId: tokenId,
        message: 'Token may not exist or may not be indexed yet.',
        note: 'This API reads real blockchain data. Make sure the token ID exists.'
      });
    }
    
    // Parse the description to extract metadata
    const metadata = parseTokenDescription(tokenDescription);
    
    // Generate image URL with the correct parameters
    const bgColor = metadata.backgroundColor.substring(1); // Remove #
    const encodedWords = encodeURIComponent(metadata.wordCombination);
    const imageUrl = `https://www.aptosnft.com/api/nft/generate?bg=${bgColor}&shape=${metadata.shape}&words=${encodedWords}`;
    
    // Create the metadata JSON with real blockchain data
    const nftMetadata = {
      name: `Retro NFT #${tokenId}`,
      description: tokenDescription,
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
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour (shorter since we're reading from blockchain)
    res.setHeader('Access-Control-Allow-Origin', '*');

    // For HEAD requests, only send headers
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    // Return the metadata JSON from blockchain
    return res.status(200).json(nftMetadata);
    
  } catch (error) {
    console.error('Error fetching blockchain metadata:', error);
    
    return res.status(500).json({ 
      error: 'Unable to fetch metadata from blockchain',
      details: error.message,
      tokenId: tokenId
    });
  }
};

// Helper function to parse token description
function parseTokenDescription(description) {
  // Parse: "A unique retro 80s NFT with #FF0040 background, Hexagon shape, and words: HARD GATE VOLT"
  const bgMatch = description.match(/(#[A-Fa-f0-9]{6}) background/);
  const shapeMatch = description.match(/background, (\w+) shape/);
  const wordsMatch = description.match(/words: (.+)$/);
  
  return {
    backgroundColor: bgMatch ? bgMatch[1] : '#000000',
    shape: shapeMatch ? shapeMatch[1] : 'Unknown',
    wordCombination: wordsMatch ? wordsMatch[1].trim() : 'UNKNOWN WORDS'
  };
}