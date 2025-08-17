import { Search, Filter } from "lucide-react";
import { useState, useCallback } from "react";

interface GalleryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onToggleFilters: () => void;
  showMobileFilters: boolean;
}

export function GalleryToolbar({ 
  searchQuery, 
  onSearchChange, 
  sortBy, 
  onSortChange,
  onToggleFilters,
  showMobileFilters
}: GalleryToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [onSearchChange]);

  const sortOptions = [
    { value: 'minted_desc', label: 'Recently Minted' },
    { value: 'id_asc', label: 'Token ID: Low → High' },
    { value: 'id_desc', label: 'Token ID: High → Low' },
    { value: 'rarity_desc', label: 'Rarity: High → Low' },
  ];

  return (
    <div className="container mx-auto px-4 mb-6">
      <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Side - Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Right Side - Sort & Filters */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none bg-black/50 border border-gray-600 rounded-lg px-3 py-2 pr-8 text-white font-mono text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-black">
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={onToggleFilters}
              className={`lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-sm transition-colors ${
                showMobileFilters
                  ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400'
                  : 'bg-black/50 border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400'
              }`}
            >
              <Filter className="w-4 h-4" />
              FILTERS
            </button>

            {/* View Toggle (Future) */}
            <div className="hidden md:flex items-center gap-1 bg-black/50 border border-gray-600 rounded-lg p-1">
              <button className="px-2 py-1 rounded bg-cyan-400/20 text-cyan-400 text-xs font-mono">
                GRID
              </button>
              <button className="px-2 py-1 rounded text-gray-400 text-xs font-mono hover:text-cyan-400 transition-colors opacity-50 cursor-not-allowed">
                LIST
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}