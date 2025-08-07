import { aptos } from "@/utils/aptosClient";

export const checkCollectionExists = async (_creatorAddress?: string): Promise<boolean> => {
  try {
    // Check if shared collection exists (ignore legacy creatorAddress parameter)
    await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_collection_address`,
        functionArguments: [],
      },
    });

    console.log("Shared collection exists");
    return true;
  } catch (error: any) {
    console.log("Collection detection error:", error?.message || error);
    console.log("Shared collection not initialized yet - will show initialize button");
    return false;
  }
};