import { NETWORK, APTOS_API_KEY, GAS_STATION_API_KEY, MODULE_ADDRESS } from "@/constants";
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
  console.log("Gas Station Submitter created:", !!gasStationSubmitter);
  console.log("Network:", NETWORK);
} else {
  console.log("No Gas Station API key provided - using regular transactions");
}

// Configure AptosConfig with proper gas station integration
const config = new AptosConfig({
  network: NETWORK,
  clientConfig: { API_KEY: APTOS_API_KEY },
  pluginSettings: gasStationSubmitter
    ? { TRANSACTION_SUBMITTER: gasStationSubmitter }
    : undefined,
});

export const aptos = new Aptos(config);

// Reuse same Aptos instance to utilize cookie-based sticky routing
export function aptosClient() {
  return aptos;
}

// Alternative approach: Use Aptos client directly with gas station
export async function submitTransactionViaGasStationDirect(
  senderAddress: string,
  transactionData: any
) {
  if (!gasStationSubmitter) {
    throw new Error("Gas station not available");
  }

  try {
    console.log("🚀 Attempting direct gas station transaction submission");
    console.log("Sender:", senderAddress);
    console.log("Transaction data:", transactionData);
    
    // Build transaction for gas station
    const transaction = {
      sender: senderAddress,
      data: transactionData,
    };
    
    console.log("Built transaction:", transaction);
    
    // Try to submit directly via gas station (this might require different approach)
    // For now, let's fall back to regular signAndSubmitTransaction but log the attempt
    console.log("⚠️ Direct gas station submission needs wallet signature - falling back");
    
    return null; // Will trigger fallback
  } catch (error) {
    console.error("❌ Gas station direct submission failed:", error);
    throw error;
  }
}
