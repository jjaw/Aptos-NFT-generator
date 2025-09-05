import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ExternalLink, Zap, Grid3X3 } from "lucide-react";
import { NETWORK } from "@/constants";

interface PostMintBannerProps {
  transactionHash: string;
  onDismiss: () => void;
}

export function PostMintBanner({ transactionHash, onDismiss }: PostMintBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  const explorerUrl = `https://explorer.aptoslabs.com/txn/${transactionHash}?network=${NETWORK}`;

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6 animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-400/50 rounded-lg p-6 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmY0MGZmIiBzdHJva2Utd2lkdGg9IjAuMjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          {/* Success message */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono">
                Congratulations!
              </h2>
              <p className="text-cyan-300 font-mono">
                You just minted this NFT successfully!
              </p>
            </div>
          </div>

          {/* Transaction details */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-cyan-400 font-mono">TRANSACTION:</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono text-gray-300 break-all">
              <span className="hidden sm:inline">{transactionHash}</span>
              <span className="sm:hidden">{transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors ml-2 flex-shrink-0"
                title="View on Aptos Explorer"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Explorer</span>
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/mint"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono font-bold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-center"
            >
              <Zap className="w-4 h-4" />
              Mint Another
            </Link>
            
            <Link
              to="/gallery"
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono font-bold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-center"
            >
              <Grid3X3 className="w-4 h-4" />
              View Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}