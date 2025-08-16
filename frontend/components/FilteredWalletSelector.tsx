// frontend/components/FilteredWalletSelector.tsx
import { useMemo } from "react";
import { useWallet, WalletContext } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

const BLOCKED_WALLETS = new Set<string>(["Dev T wallet", "T wallet"]);

export function FilteredWalletSelector() {
  const original = useWallet();

  const filteredWallets = useMemo(
    () => (original.wallets ?? []).filter(w => !BLOCKED_WALLETS.has(String(w.name))),
    [original.wallets]
  );

  const filteredContext = useMemo(
    () => ({ ...original, wallets: filteredWallets }),
    [original, filteredWallets]
  );

  return (
    <WalletContext.Provider value={filteredContext}>
      <WalletSelector />
    </WalletContext.Provider>
  );
}
