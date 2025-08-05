import { aptos } from "@/utils/aptosClient";

export interface CollectionStats {
  totalMinted: number;
  maxSupply: number;
}


export const getCollectionStats = async (creatorAddress?: string): Promise<CollectionStats> => {
  try {
    // Get max supply - this is a constant and doesn't require collection initialization
    const maxSupplyResponse = await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_max_supply`,
        functionArguments: [],
      },
    });

    // Get total minted - handle case where collection might not be initialized
    const actualCreatorAddress = creatorAddress || import.meta.env.VITE_MODULE_ADDRESS;
    const totalMintedResponse = await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_total_minted`,
        functionArguments: [actualCreatorAddress],
      },
    });

    return {
      totalMinted: Number(totalMintedResponse[0]),
      maxSupply: Number(maxSupplyResponse[0]),
    };
  } catch (error) {
    console.error("Error fetching collection stats:", error);
    // If we get an error, it likely means collection is not initialized
    // Return default values with 0 totalMinted and fallback maxSupply
    return {
      totalMinted: 0,
      maxSupply: 10000,
    };
  }
};