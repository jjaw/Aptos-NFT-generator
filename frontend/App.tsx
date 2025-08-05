import { useWallet } from "@aptos-labs/wallet-adapter-react";
// Internal Components
import { Header } from "@/components/Header";
import { NFTGenerator } from "@/components/NFTGenerator";

function App() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900">
      {/* Retro grid background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmY0MGZmIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      
      <Header />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 font-mono tracking-wider">
            RETRO NFT GENERATOR
          </h1>
          <p className="text-xl text-cyan-300 font-mono">
            Claim your unique 80s-style digital collectible
          </p>
          <div className="mt-4 flex justify-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-1 w-32 rounded"></div>
          </div>
        </div>

        {connected ? (
          <NFTGenerator />
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-black/50 backdrop-blur-sm border border-cyan-400 rounded-lg p-8 text-center shadow-2xl shadow-pink-500/25">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono mb-2">
                  CONNECT WALLET
                </h2>
                <p className="text-cyan-300 font-mono text-sm">
                  Initialize your digital identity to claim your retro NFT
                </p>
              </div>
              <div className="border-t border-cyan-400/30 pt-4">
                <p className="text-gray-400 text-xs font-mono">
                  Compatible with all Aptos wallets
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
