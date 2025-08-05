import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export type MintRandomNftArguments = {
  creatorAddress: string; // The creator's account address where collection is stored
};

export const mintRandomNft = (args: MintRandomNftArguments): InputTransactionData => {
  const { creatorAddress } = args;
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::mint_random_nft`,
      functionArguments: [creatorAddress],
    },
  };
};