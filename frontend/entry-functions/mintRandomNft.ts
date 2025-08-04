import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export type MintRandomNftArguments = {
  user: string; // The user's account address
};

export const mintRandomNft = (args: MintRandomNftArguments): InputTransactionData => {
  const { user } = args;
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator::mint_random_nft`,
      functionArguments: [],
    },
  };
};