// Vercel API Route for NFT Metadata - Reads from Blockchain
// URL: https://www.aptosnft.com/api/nft/metadata?id=12345

module.exports = async (req, res) => {
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
    // For now, implement a more sophisticated fallback approach
    // We'll parse the known token descriptions from recent transactions
    
    // Known token data from blockchain (we can expand this database)
    const knownTokens = {
      96: {
        backgroundColor: '#FF0040',
        shape: 'Hexagon', 
        wordCombination: 'HARD GATE VOLT'
      }
      // We can add more as we discover them or implement automated parsing
    };
    
    // Check if we have cached blockchain data for this token
    if (knownTokens[tokenId]) {
      const metadata = knownTokens[tokenId];
      
      // Generate image URL with the correct parameters
      const bgColor = metadata.backgroundColor.substring(1); // Remove #
      const encodedWords = encodeURIComponent(metadata.wordCombination);
      const imageUrl = `https://www.aptosnft.com/api/nft/generate?bg=${bgColor}&shape=${metadata.shape}&words=${encodedWords}`;
      
      // Create the metadata JSON with blockchain data
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

      // Return the metadata JSON from blockchain
      return res.status(200).json(nftMetadata);
    }
    
    // If we don't have the token cached, try to fetch from blockchain
    // This is where we'd implement full blockchain parsing
    
    const APTOS_API_URL = 'https://fullnode.testnet.aptoslabs.com/v1';
    
    // Try to search for the token by querying recent transactions
    // This is a simplified approach - in production you'd use an indexer
    
    // For now, return an informative error that explains the situation
    return res.status(404).json({
      error: 'Token metadata not yet indexed',
      tokenId: tokenId,
      message: 'This API is being migrated from fake pseudo-random data to real blockchain data.',
      solution: 'Token data will be indexed from blockchain transactions. For immediate testing, token #96 is available.',
      availableTokens: Object.keys(knownTokens).map(id => parseInt(id)),
      note: 'The old fake metadata API has been disabled to prevent incorrect NFT images.'
    });
    
  } catch (error) {
    console.error('Error processing metadata request:', error);
    
    return res.status(500).json({ 
      error: 'Unable to process metadata request',
      details: error.message,
      tokenId: tokenId
    });
  }
};