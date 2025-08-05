import { aptos } from "@/utils/aptosClient";

export const checkCollectionExists = async (creatorAddress?: string): Promise<boolean> => {
  try {
    // Try to call get_collection_address - this will fail if collection doesn't exist
    const actualCreatorAddress = creatorAddress || import.meta.env.VITE_MODULE_ADDRESS;
    await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_collection_address`,
        functionArguments: [actualCreatorAddress],
      },
    });

    console.log("Collection exists");
    return true;
  } catch (error) {
    // If there's an error calling get_collection_address, collection doesn't exist
    console.log("Collection not initialized yet - will show initialize button");
    return false;
  }
};