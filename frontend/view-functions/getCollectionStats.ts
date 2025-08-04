import { aptos } from "@/utils/aptosClient";

export interface CollectionStats {
  totalMinted: number;
  maxSupply: number;
}

export const getCollectionStats = async (): Promise<CollectionStats> => {
  try {
    const [totalMintedResponse, maxSupplyResponse] = await Promise.all([
      aptos.view({
        payload: {
          function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator::get_total_minted`,
          functionArguments: [],
        },
      }),
      aptos.view({
        payload: {
          function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator::get_max_supply`,
          functionArguments: [],
        },
      }),
    ]);

    return {
      totalMinted: Number(totalMintedResponse[0]),
      maxSupply: Number(maxSupplyResponse[0]),
    };
  } catch (error) {
    console.error("Error fetching collection stats:", error);
    return {
      totalMinted: 0,
      maxSupply: 10000,
    };
  }
};