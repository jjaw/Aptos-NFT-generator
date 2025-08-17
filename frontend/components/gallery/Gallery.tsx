import { useState, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { GalleryHeader } from "./GalleryHeader";
import { GalleryToolbar } from "./GalleryToolbar";
import { FilterSidebar } from "./FilterSidebar";
import { TokenGrid } from "./TokenGrid";
import { fetchMockTokens } from "@/utils/mockData";

interface Token {
  tokenId: string;
  name: string;
  image: string;
  mintedAt: string;
  attributes: Array<{ trait_type: string; value: string }>;
  rarity?: {
    score: number;
    percentile: number;
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
  };
}

interface ApiResponse {
  items: Token[];
  nextCursor?: string;
  total: number;
}

export function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse URL parameters
  const searchQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'minted_desc';
  
  // Parse trait filters from URL
  const selectedFilters: Record<string, string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    const match = key.match(/^traits\[(.+)\]$/);
    if (match) {
      const traitType = match[1];
      selectedFilters[traitType] = selectedFilters[traitType] || [];
      selectedFilters[traitType].push(value);
    }
  }

  // Build API query parameters
  const buildQueryParams = useCallback((cursor?: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (sortBy) params.set('sort', sortBy);
    if (cursor) params.set('cursor', cursor);
    
    // Add trait filters
    Object.entries(selectedFilters).forEach(([traitType, values]) => {
      values.forEach(value => {
        params.append(`traits[${traitType}]`, value);
      });
    });
    
    return params.toString();
  }, [searchQuery, sortBy, selectedFilters]);

  // Infinite query for tokens
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery<ApiResponse>({
    queryKey: ['collection-tokens', searchQuery, sortBy, selectedFilters],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string || '0';
      
      try {
        // Try API first
        const queryString = buildQueryParams(cursor);
        console.log('Fetching tokens with query:', queryString);
        
        const response = await fetch(`/api/nft/collection/list?${queryString}`);
        
        console.log('API Response status:', response.status);
        console.log('API Response headers:', response.headers.get('content-type'));
        
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();
          console.log('Received API data:', data);
          return data;
        } else {
          const responseText = await response.text();
          console.log('API Response text:', responseText);
          throw new Error(`API failed: ${response.status} - ${responseText}`);
        }
      } catch (apiError) {
        console.warn('API failed, using mock data:', apiError);
        
        // Fallback to mock data
        return await fetchMockTokens({
          q: searchQuery,
          sort: sortBy,
          limit: 48,
          cursor,
          traitFilters: selectedFilters
        });
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all tokens from pages
  const allTokens = data?.pages.flatMap(page => page.items) || [];

  // URL state management
  const updateSearchParams = useCallback((updates: Record<string, string | string[] | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        newParams.delete(key);
        value.forEach(v => newParams.append(key, v));
      } else {
        newParams.set(key, value);
      }
    });
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Event handlers
  const handleSearchChange = useCallback((query: string) => {
    updateSearchParams({ q: query || null });
  }, [updateSearchParams]);

  const handleSortChange = useCallback((sort: string) => {
    updateSearchParams({ sort });
  }, [updateSearchParams]);

  const handleFilterChange = useCallback((traitType: string, values: string[]) => {
    const filterKey = `traits[${traitType}]`;
    updateSearchParams({ [filterKey]: values.length > 0 ? values : null });
  }, [updateSearchParams]);

  const handleClearAllFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    // Remove all trait filters
    for (const key of Array.from(newParams.keys())) {
      if (key.startsWith('traits[')) {
        newParams.delete(key);
      }
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle window resize for mobile filters
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white font-mono mb-2">
            Failed to load collection
          </h2>
          <p className="text-gray-400 font-mono mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-cyan-400 hover:bg-cyan-500 text-black font-mono font-bold px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <GalleryHeader />
      
      <GalleryToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onToggleFilters={() => setShowMobileFilters(!showMobileFilters)}
        showMobileFilters={showMobileFilters}
      />

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAllFilters={handleClearAllFilters}
            />
          </div>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
              <div className="absolute inset-x-4 top-4 bottom-4 max-w-sm mx-auto">
                <div className="h-full overflow-y-auto">
                  <FilterSidebar
                    selectedFilters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    onClearAllFilters={handleClearAllFilters}
                    className="h-full"
                  />
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="absolute top-4 right-4 text-white hover:text-cyan-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <TokenGrid
              tokens={allTokens}
              isLoading={isLoading || isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              onLoadMore={fetchNextPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export for lazy loading
export default Gallery;