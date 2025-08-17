import { Link } from "react-router-dom";
import { RarityBadge } from "./RarityBadge";

interface TokenCardProps {
  tokenId: string;
  name: string;
  image: string;
  rarity?: {
    score: number;
    percentile: number;
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
  };
  className?: string;
}

export function TokenCard({ tokenId, name, image, rarity, className = '' }: TokenCardProps) {
  return (
    <Link 
      to={`/token/${tokenId}`}
      className={`group block bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg overflow-hidden hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-400/10 hover:-translate-y-1 transition-all duration-300 ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-900/50 to-pink-900/50 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white font-mono text-sm font-bold bg-black/50 px-3 py-1 rounded">
            VIEW DETAILS
          </div>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="p-3">
        <h3 className="text-cyan-400 font-mono font-bold text-sm truncate">
          {name}
        </h3>
        {rarity && (
          <div className="mt-2 flex items-center justify-between">
            <RarityBadge 
              tier={rarity.tier} 
              percentile={rarity.percentile}
              className="text-xs px-2 py-1"
            />
            <div className="text-xs text-gray-400 font-mono">
              Score: {rarity.score}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}