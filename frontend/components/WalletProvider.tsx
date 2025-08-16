// frontend/components/WalletProvider.tsx
import { PropsWithChildren } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useToast } from "@/components/ui/use-toast";
import { APTOS_API_KEY, NETWORK } from "@/constants";

export function WalletProvider({ children }: PropsWithChildren) {
  const { toast } = useToast();

  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{
        network: NETWORK,
        // keep using the per-network map your version expects
        aptosApiKeys: { [NETWORK]: APTOS_API_KEY },
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
