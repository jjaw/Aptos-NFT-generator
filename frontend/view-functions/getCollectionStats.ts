import { aptos } from "@/utils/aptosClient";

export interface CollectionStats {
  totalMinted: number;
  maxSupply: number;
}


export const getCollectionStats = async (_creatorAddress?: string): Promise<CollectionStats> => {
  try {
    // Get max supply - this is a constant and doesn't require collection initialization
    const maxSupplyResponse = await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_max_supply`,
        functionArguments: [],
      },
    });

    // Get total minted from shared collection (ignore legacy creatorAddress parameter)
    const totalMintedResponse = await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_total_minted`,
        functionArguments: [],
      },
    });

    return {
      totalMinted: Number(totalMintedResponse[0]),
      maxSupply: Number(maxSupplyResponse[0]),
    };
  } catch (error) {
    console.error("Error fetching shared collection stats:", error);
    // If we get an error, it likely means shared collection is not initialized
    // Return default values with 0 totalMinted and fallback maxSupply
    return {
      totalMinted: 0,
      maxSupply: 10000,
    };
  }
};