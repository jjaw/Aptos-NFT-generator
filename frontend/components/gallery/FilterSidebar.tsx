import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mockTraitCounts } from "@/utils/mockData";

interface TraitCounts {
  [traitType: string]: {
    [value: string]: number;
  };
}

interface FilterSidebarProps {
  selectedFilters: Record<string, string[]>;
  onFilterChange: (traitType: string, values: string[]) => void;
  onClearAllFilters: () => void;
  className?: string;
}

export function FilterSidebar({ 
  selectedFilters, 
  onFilterChange, 
  onClearAllFilters,
  className = '' 
}: FilterSidebarProps) {
  const { data: traitsData, isLoading } = useQuery<{ traits: TraitCounts }>({
    queryKey: ['collection-traits'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/nft/collection/traits');
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return response.json();
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.warn('Traits API failed, using mock data:', error);
        return { traits: mockTraitCounts };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTraitValueToggle = (traitType: string, value: string) => {
    const currentValues = selectedFilters[traitType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange(traitType, newValues);
  };

  const hasActiveFilters = Object.values(selectedFilters).some(values => values.length > 0);

  if (isLoading) {
    return (
      <div className={`bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="space-y-1">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="h-3 bg-gray-800 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cyan-400 font-mono">FILTERS</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="text-sm text-gray-400 hover:text-pink-400 font-mono transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([traitType, values]) =>
              values.map((value) => (
                <div
                  key={`${traitType}-${value}`}
                  className="flex items-center gap-1 bg-cyan-400/20 border border-cyan-400 text-cyan-400 px-2 py-1 rounded text-xs font-mono"
                >
                  <span>{traitType}: {value}</span>
                  <button
                    onClick={() => handleTraitValueToggle(traitType, value)}
                    className="hover:text-pink-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Trait Filters */}
      <div className="space-y-4">
        {traitsData?.traits && Object.entries(traitsData.traits).map(([traitType, values]) => (
          <div key={traitType}>
            <h4 className="text-sm font-semibold text-white font-mono mb-2 border-b border-gray-600 pb-1">
              {traitType}
            </h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(values)
                .sort(([, a], [, b]) => b - a) // Sort by count descending
                .map(([value, count]) => {
                  const isSelected = selectedFilters[traitType]?.includes(value) || false;
                  return (
                    <label
                      key={value}
                      className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTraitValueToggle(traitType, value)}
                          className="mr-2 rounded border-gray-600 bg-black/50 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300 font-mono truncate" title={value}>
                          {value}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono ml-2">
                        {count}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}