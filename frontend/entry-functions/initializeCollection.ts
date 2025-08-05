import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

export const initializeCollection = (): InputTransactionData => {
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::initialize_collection`,
      functionArguments: [],
    },
  };
};