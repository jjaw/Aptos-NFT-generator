import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Mint from shared collection (no arguments needed)
export const mintRandomNft = (): InputTransactionData => {
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::mint_random_nft`,
      functionArguments: [],
    },
  };
};

// Legacy function for backwards compatibility
export type MintRandomNftArguments = {
  creatorAddress: string; // The creator's account address where collection is stored
};

export const mintRandomNftLegacy = (_args: MintRandomNftArguments): InputTransactionData => {
  // For backwards compatibility, ignore the creator address and use shared collection
  return mintRandomNft();
};