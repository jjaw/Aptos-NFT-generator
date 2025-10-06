interface RarityBadgeProps {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  percentile: number;
  className?: string;
}

export function RarityBadge({ tier, percentile, className = '' }: RarityBadgeProps) {
  const tierConfig = {
    S: { 
      bg: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
      text: 'text-black', 
      border: 'border-yellow-400',
      shadow: 'shadow-yellow-400/30'
    },
    A: { 
      bg: 'bg-gradient-to-r from-sky-500 to-fuchsia-500', 
      text: 'text-slate-100', 
      border: 'border-sky-400',
      shadow: 'shadow-sky-400/30'
    },
    B: { 
      bg: 'bg-gradient-to-r from-blue-400 to-cyan-500', 
      text: 'text-slate-100', 
      border: 'border-blue-400',
      shadow: 'shadow-blue-400/30'
    },
    C: { 
      bg: 'bg-gradient-to-r from-green-400 to-emerald-500', 
      text: 'text-slate-100', 
      border: 'border-green-400',
      shadow: 'shadow-green-400/30'
    },
    D: { 
      bg: 'bg-gradient-to-r from-gray-400 to-gray-600', 
      text: 'text-slate-100', 
      border: 'border-gray-400',
      shadow: 'shadow-gray-400/30'
    }
  };

  const config = tierConfig[tier];

  return (
    <div 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold font-mono border shadow-lg ${config.bg} ${config.text} ${config.border} ${config.shadow} ${className}`}
      title={`Rarity: ${tier} tier • Top ${100 - percentile}% (${percentile}th percentile)`}
    >
      <span className="font-black tracking-wider">{tier}</span>
      <span className="mx-1">•</span>
      <span className="font-semibold">{percentile}th</span>
    </div>
  );
}
