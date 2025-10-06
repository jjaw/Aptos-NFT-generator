import { lazy, Suspense } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
// Internal Components
import { Header } from "@/components/Header";
import { ProjectBanner } from "@/components/ProjectBanner";
import { Footer } from "@/components/Footer";

// Gallery styles
import "./gallery.css";

// Lazy-loaded components
const Gallery = lazy(() => import("@/components/gallery/Gallery"));
const TokenDetail = lazy(() => import("@/components/token/TokenDetail"));
const NFTGenerator = lazy(() => import("@/components/NFTGenerator"));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
      <div className="text-cyan-400 font-mono text-sm">Loading...</div>
    </div>
  </div>
);

function App() {
  const { connected } = useWallet();

  return (
    <HashRouter>
      <div className="relative min-h-screen bg-[#050818] flex flex-col overflow-hidden">
        {/* Neon atmosphere overlays */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.22),_transparent_60%)] opacity-80"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.07)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25"></div>
        </div>

        <ProjectBanner />
        <Header />
        
        <main className="relative z-10 flex-1">
          <Routes>
            {/* Gallery Route - Public, no wallet required */}
            <Route path="/gallery" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Gallery />
              </Suspense>
            } />
            
            {/* Token Detail Route - Public, no wallet required */}
            <Route path="/token/:id" element={
              <Suspense fallback={<LoadingSpinner />}>
                <TokenDetail />
              </Suspense>
            } />
            
            {/* Mint Route - Requires wallet connection */}
            <Route path="/mint" element={
              <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                  <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-300 via-sky-400 to-pink-400 bg-clip-text text-transparent mb-4 font-mono tracking-wider">
                    RETRO NFT GENERATOR
                  </h1>
                  <p className="text-xl text-cyan-300 font-mono">
                    Claim your unique 80s-style digital collectible
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="h-1 w-32 rounded bg-gradient-to-r from-cyan-400 to-pink-500"></div>
                  </div>
                </div>

                {connected ? (
                  <Suspense fallback={<LoadingSpinner />}>
                    <NFTGenerator />
                  </Suspense>
                ) : (
                  <div className="max-w-md mx-auto">
                    <div className="bg-black/50 backdrop-blur-sm border border-cyan-400 rounded-lg p-8 text-center shadow-2xl shadow-pink-500/25">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🎮</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 font-mono mb-2">
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
            } />
            
            {/* Default Route - Redirect to gallery */}
            <Route path="/" element={<Navigate to="/gallery" replace />} />
            
            {/* Catch all other routes - Redirect to gallery */}
            <Route path="*" element={<Navigate to="/gallery" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;
