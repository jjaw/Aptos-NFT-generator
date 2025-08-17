import { generateLocalPreview, type NFTMetadata } from "@/utils/localPreview";

export interface NFTMetadata {
  background_color: string;
  shape: string;
  word_combination: string;
  token_id: number;
}

export const previewRandomNft = async (seed: number): Promise<NFTMetadata> => {
  // Use local preview generator instead of contract call
  // This is faster, more reliable, and uses the exact same logic as the contract
  return generateLocalPreview(seed);
};