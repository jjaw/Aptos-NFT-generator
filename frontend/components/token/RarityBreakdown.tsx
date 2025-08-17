interface RarityComponent {
  trait_type: string;
  value: string;
  ic: number;
  frequency: number;
  total: number;
}

interface RarityBreakdownProps {
  components: RarityComponent[];
}

export function RarityBreakdown({ components }: RarityBreakdownProps) {
  if (!components || components.length === 0) {
    return null;
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4">
      <h3 className="text-lg font-bold text-cyan-400 font-mono mb-4">Rarity Breakdown</h3>
      
      <div className="space-y-3">
        {components.map((component, index) => {
          const percentage = ((component.frequency / component.total) * 100).toFixed(1);
          const isRare = parseFloat(percentage) < 10;
          
          return (
            <div
              key={index}
              className="bg-black/30 border border-gray-600 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-mono font-semibold">
                  {component.trait_type}: {component.value}
                </div>
                <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                  isRare 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                }`}>
                  {percentage}%
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>
                  {component.frequency.toLocaleString()} / {component.total.toLocaleString()} have this trait
                </span>
                <span>
                  IC: {component.ic.toFixed(2)}
                </span>
              </div>
              
              {/* Rarity Bar */}
              <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isRare ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-gray-500 to-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
        <div className="text-xs text-cyan-400 font-mono">
          <strong>Information Content (IC)</strong> measures how rare each trait is. 
          Higher IC values indicate rarer traits that contribute more to the overall rarity score.
        </div>
      </div>
    </div>
  );
}