// The Aptos network the dapp is using
export const NETWORK = import.meta.env.VITE_APP_NETWORK ?? "testnet";
// The address of the published module
export const MODULE_ADDRESS = import.meta.env.VITE_MODULE_ADDRESS;
// The API key for the Aptos API
export const APTOS_API_KEY = import.meta.env.VITE_APTOS_API_KEY;
// The Gas Station API key for sponsored transactions
export const GAS_STATION_API_KEY = import.meta.env.VITE_APTOS_GAS_STATION_API_KEY;
// The shared collection address (calculated from module address + seed)
export const SHARED_COLLECTION_ADDRESS = import.meta.env.VITE_SHARED_COLLECTION_ADDRESS;
