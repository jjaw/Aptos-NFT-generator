import { aptos } from "@/utils/aptosClient";

export const checkCollectionExists = async (creatorAddress?: string): Promise<boolean> => {
  try {
    // Use the current user's address as creator address for checking
    const actualCreatorAddress = creatorAddress || import.meta.env.VITE_MODULE_ADDRESS;
    
    // Try to call get_collection_address - this will FAIL if NFTCollection resource doesn't exist
    await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_collection_address`,
        functionArguments: [actualCreatorAddress],
      },
    });

    console.log("Collection exists at creator address:", actualCreatorAddress);
    return true;
  } catch (error: any) {
    console.log("Collection detection error:", error?.message || error);
    console.log("Collection not initialized yet - will show initialize button");
    return false;
  }
};