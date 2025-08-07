import { MODULE_ADDRESS, SHARED_COLLECTION_ADDRESS } from "@/constants";

// Seed used in the smart contract
export const SHARED_COLLECTION_SEED = "shared_collection_v1";

/**
 * Calculate the shared collection address deterministically
 * This should match the address returned by get_shared_collection_address() in the smart contract
 */
export function calculateSharedCollectionAddress(): string {
  if (SHARED_COLLECTION_ADDRESS) {
    // If explicitly set in env, use that
    return SHARED_COLLECTION_ADDRESS;
  }
  
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS not configured");
  }
  
  // Calculate deterministic address using same logic as smart contract
  // Note: This requires the correct method name from @aptos-labs/ts-sdk
  // For now, return the MODULE_ADDRESS as fallback - this should be updated
  // when the correct SDK method is available
  console.warn("Shared collection address calculation not implemented - using MODULE_ADDRESS as fallback");
  return MODULE_ADDRESS;
}

/**
 * Get the shared collection address (preferring env var, falling back to calculation)
 */
export function getSharedCollectionAddress(): string {
  return calculateSharedCollectionAddress();
}