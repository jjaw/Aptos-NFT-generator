import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Initialize shared collection (admin only - for backwards compatibility)
export const initializeCollection = (): InputTransactionData => {
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::initialize_shared_collection`,
      functionArguments: [],
    },
  };
};

// Initialize shared collection explicitly
export const initializeSharedCollection = (): InputTransactionData => {
  return {
    data: {
      function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::initialize_shared_collection`,
      functionArguments: [],
    },
  };
};