import "./index.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";

import App from "@/App.tsx";
// Internal components
import { Toaster } from "@/components/ui/toaster.tsx";
import { WalletProvider } from "@/components/WalletProvider.tsx";
import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider>
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <WrongNetworkAlert />
          <Toaster />
        </QueryClientProvider>
      </WalletProvider>
    </MantineProvider>
  </React.StrictMode>,
);
