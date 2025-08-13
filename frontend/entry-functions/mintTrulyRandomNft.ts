import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Mint from shared collection using true Aptos randomness
export const mintTrulyRandomNft = (): InputTransactionData => {
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::mint_truly_random_nft`,
      functionArguments: [],
    },
  };
};