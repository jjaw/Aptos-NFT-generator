// frontend/components/WalletProvider.tsx
import { PropsWithChildren } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useToast } from "@/components/ui/use-toast";
import { APTOS_API_KEY, NETWORK } from "@/constants";
import { aptosClient } from "@/utils/aptosClient";

export function WalletProvider({ children }: PropsWithChildren) {
  const { toast } = useToast();

  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{
        network: NETWORK,
        aptosApiKeys: { [NETWORK]: APTOS_API_KEY },
        // Add transaction submitter for gas station integration per MCP guidance
        transactionSubmitter: aptosClient().config.getTransactionSubmitter(),
      }}
      onError={(error) => {
        const msg =
          error && typeof error === "object" && "message" in (error as any)
            ? String((error as any).message)
            : String(error ?? "Unknown wallet error");
        toast({ variant: "destructive", title: "Wallet error", description: msg });
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
