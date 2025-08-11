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
  console.log("Gas Station configured with API key:", GAS_STATION_API_KEY.substring(0, 10) + "...");
  console.log("🎉 Gas Station enabled - contracts configured for zero-fee transactions!");
} else {
  console.log("No Gas Station API key provided - using regular transactions");
}

// Re-enable Gas Station now that contracts are properly configured
const config = new AptosConfig({ 
  network: NETWORK, 
  clientConfig: { API_KEY: APTOS_API_KEY },
  pluginSettings: gasStationTransactionSubmitter ? {
    TRANSACTION_SUBMITTER: gasStationTransactionSubmitter,
  } : undefined,
});

export const aptos = new Aptos(config);

// Reuse same Aptos instance to utilize cookie based sticky routing
export function aptosClient() {
  return aptos;
}

// Export Gas Station submitter for direct use if needed (when API is fixed)
export const gasStationSubmitter = gasStationTransactionSubmitter;
