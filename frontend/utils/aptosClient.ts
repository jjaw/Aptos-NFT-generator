import { NETWORK, APTOS_API_KEY, GAS_STATION_API_KEY } from "@/constants";
import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { GasStationTransactionSubmitter } from "@aptos-labs/gas-station-client";

// Create Gas Station transaction submitter if API key is available
export const gasStationSubmitter = GAS_STATION_API_KEY
  ? new GasStationTransactionSubmitter({
      network: NETWORK,
      apiKey: GAS_STATION_API_KEY,
    })
  : undefined;

// Logging (optional)
if (GAS_STATION_API_KEY) {
  console.log("Gas Station configured with API key:", GAS_STATION_API_KEY.substring(0, 10) + "...");
  console.log("🎉 Gas Station enabled - contracts configured for zero-fee transactions!");
} else {
  console.log("No Gas Station API key provided - using regular transactions");
}

// Keep pluginSettings; cast config init to satisfy older ts-sdk typings
const config = new AptosConfig({
  network: NETWORK,
  clientConfig: { API_KEY: APTOS_API_KEY },
  pluginSettings: gasStationSubmitter
    ? { TRANSACTION_SUBMITTER: gasStationSubmitter }
    : undefined,
} as any);

export const aptos = new Aptos(config);

// Reuse same Aptos instance to utilize cookie-based sticky routing
export function aptosClient() {
  return aptos;
}
