import { NETWORK, APTOS_API_KEY, GAS_STATION_API_KEY } from "@/constants";
import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { GasStationTransactionSubmitter } from "@aptos-labs/gas-station-client";

// Create Gas Station transaction submitter if API key is available
const gasStationTransactionSubmitter = GAS_STATION_API_KEY 
  ? new GasStationTransactionSubmitter({
      network: NETWORK,
      apiKey: GAS_STATION_API_KEY,
    })
  : undefined;

// Log Gas Station configuration for debugging
if (GAS_STATION_API_KEY) {
  console.log("Gas Station API key available:", GAS_STATION_API_KEY.substring(0, 10) + "...");
  console.log("⚠️ IMPORTANT: Gas Station APIs require backend implementation due to CORS restrictions");
  console.log("💡 For now, using regular transactions. Implement backend proxy for sponsored transactions.");
} else {
  console.log("No Gas Station API key provided - using regular transactions");
}

// IMPORTANT: Gas Station APIs don't support CORS and must be called from backend
// Frontend browsers cannot directly call Gas Station endpoints
// For now, use regular transactions until backend proxy is implemented
const config = new AptosConfig({ 
  network: NETWORK, 
  clientConfig: { API_KEY: APTOS_API_KEY },
  // Disable Gas Station client-side due to CORS restrictions
  // To enable: implement backend proxy server for Gas Station API calls
  // pluginSettings: gasStationTransactionSubmitter ? {
  //   TRANSACTION_SUBMITTER: gasStationTransactionSubmitter,
  // } : undefined,
});

export const aptos = new Aptos(config);

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  return aptos;
}

// Export Gas Station submitter for direct use if needed (when API is fixed)
export const gasStationSubmitter = gasStationTransactionSubmitter;
