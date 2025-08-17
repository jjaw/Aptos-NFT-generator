// Vercel API Route for NFT Collection Statistics
// URL: /api/nft/collection/stats

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
    const MODULE_ADDRESS = '0x099d43f357f7993b7021e53c6a7cf9d74a81c11924818a0230ed7625fbcddb2b';
    const COLLECTION_NAME = 'Retro 80s NFT Collection 2025-01-08-v2-unique';

    // Try to get live data from the smart contract first
    let totalMinted = 0;
    
    try {
      // Query the smart contract for total minted count
      const APTOS_API_URL = 'https://fullnode.testnet.aptoslabs.com/v1';
      const contractResponse = await fetch(`${APTOS_API_URL}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: `${MODULE_ADDRESS}::retro_nft_generator_da::get_total_minted`,
          type_arguments: [],
          arguments: []
        })
      });

      if (contractResponse.ok) {
        const contractData = await contractResponse.json();
        totalMinted = parseInt(contractData[0]) || 0;
        console.log('Got minted count from contract:', totalMinted);
      } else {
        console.log('Contract query failed, falling back to indexer');
      }
    } catch (contractError) {
      console.log('Contract query error, falling back to indexer:', contractError.message);
    }

    // Fallback to indexer if contract query fails
    if (totalMinted === 0) {
      const graphqlQuery = {
        query: `
          query GetCollectionStats($collection_name: String!) {
            current_token_datas_v2_aggregate(
              where: {
                collection_name: { _eq: $collection_name }
              }
            ) {
              aggregate {
                count
              }
            }
          }
        `,
        variables: {
          collection_name: COLLECTION_NAME
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
        if (!indexerData.errors) {
          totalMinted = indexerData.data?.current_token_datas_v2_aggregate?.aggregate?.count || 0;
          console.log('Got minted count from indexer:', totalMinted);
        }
      }
    }

    // Collection statistics
    const stats = {
      totalSupply: 10000, // Max supply from contract constant
      totalMinted: totalMinted,
      lastUpdated: new Date().toISOString(),
      // Future fields for marketplace integration:
      // floorPrice: null,
      // volume24h: null,
      // uniqueHolders: null
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute (live data)

    // For HEAD requests, only send headers
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Error fetching collection stats:', error);
    
    // Return fallback stats on error
    const fallbackStats = {
      totalSupply: 10000,
      totalMinted: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch live data'
    };

    return res.status(200).json(fallbackStats);
  }
};