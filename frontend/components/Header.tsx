import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { CustomWalletSelector } from "./CustomWalletSelector";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative z-20 border-b border-cyan-400/30 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center px-3 py-3 sm:px-4 sm:py-4 max-w-screen-xl mx-auto w-full min-w-0 relative">
        {/* Left side - Logo */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink min-w-0">
          <Link to="/gallery" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity flex-shrink min-w-0">
            <div className="text-lg sm:text-xl md:text-2xl">🌆</div>
            <h1 className="text-sm sm:text-lg md:text-xl font-bold text-cyan-400 font-mono tracking-wider whitespace-nowrap">
              APTOS.NFT
            </h1>
          </Link>
        </div>

        {/* Center - Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
          <Link
            to="/gallery"
            className={`px-3 py-2 text-sm font-mono font-medium rounded transition-colors ${
              location.pathname === '/gallery'
                ? 'text-cyan-400 bg-cyan-400/10'
                : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/5'
            }`}
          >
            GALLERY
          </Link>
          <Link
            to="/mint"
            className={`px-3 py-2 text-sm font-mono font-medium rounded transition-colors ${
              location.pathname === '/mint'
                ? 'text-pink-400 bg-pink-400/10'
                : 'text-gray-300 hover:text-pink-400 hover:bg-pink-400/5'
            }`}
          >
            MINT
          </Link>
        </nav>

        {/* Center - Mobile Menu Button */}
        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            className="flex flex-col justify-center items-center w-5 h-5 space-y-0.5 hover:opacity-80 transition-opacity"
          >
            <div className={`w-3.5 h-0.5 bg-cyan-400 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
            <div className={`w-3.5 h-0.5 bg-cyan-400 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-3.5 h-0.5 bg-cyan-400 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
          </button>
        </div>

        {/* Right side - Wallet and status */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0 ml-auto">
          <div className="flex items-center text-xs font-mono text-gray-300">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="whitespace-nowrap text-xs">TESTNET</span>
            </span>
          </div>
          <div className="min-w-0 flex-shrink-0">
            <div className="text-xs sm:text-sm">
              <CustomWalletSelector />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cyan-400/30 bg-black/40 backdrop-blur-sm">
          <nav className="px-4 py-3 space-y-2">
            <Link 
              to="/gallery" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-3 text-base font-mono font-medium rounded transition-colors ${
                location.pathname === '/gallery' 
                  ? 'text-cyan-400 bg-cyan-400/10' 
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/5'
              }`}
            >
              🖼️ GALLERY
            </Link>
            <Link 
              to="/mint" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-3 text-base font-mono font-medium rounded transition-colors ${
                location.pathname === '/mint' 
                  ? 'text-pink-400 bg-pink-400/10' 
                  : 'text-gray-300 hover:text-pink-400 hover:bg-pink-400/5'
              }`}
            >
              ⚡ MINT
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
