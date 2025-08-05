import { aptos } from "@/utils/aptosClient";

export interface NFTMetadata {
  background_color: string;
  shape: string;
  word_combination: string;
  token_id: number;
}

export const previewRandomNft = async (seed: number): Promise<NFTMetadata> => {
  try {
    const response = await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::preview_random_nft`,
        functionArguments: [seed.toString()],
      },
    });

    const metadata = response[0] as any;
    return {
      background_color: metadata.background_color,
      shape: metadata.shape,
      word_combination: metadata.word_combination,
      token_id: Number(metadata.token_id),
    };
  } catch (error) {
    console.error("Error previewing NFT:", error);
    // Return a fallback preview
    return {
      background_color: "#FF0080",
      shape: "Circle",
      word_combination: "NEON WAVE GLOW",
      token_id: 0,
    };
  }
};