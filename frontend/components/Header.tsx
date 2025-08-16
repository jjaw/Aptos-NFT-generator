import { CustomWalletSelector } from "./CustomWalletSelector";

export function Header() {
  return (
    <div className="relative z-20 border-b border-cyan-400/30 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-4 max-w-screen-xl mx-auto w-full flex-wrap">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🌆</div>
          <h1 className="text-xl font-bold text-cyan-400 font-mono tracking-wider">
            RETRO.NFT
          </h1>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="hidden md:flex items-center space-x-4 text-sm font-mono text-gray-300">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>TESTNET</span>
            </span>
          </div>
          <CustomWalletSelector />
        </div>
      </div>
    </div>
  );
}
