import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo } from "react";
import { TokenCard } from "./TokenCard";

interface Token {
  tokenId: string;
  name: string;
  image: string;
  rarity?: {
    score: number;
    percentile: number;
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
  };
}

interface TokenGridProps {
  tokens: Token[];
  isLoading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function TokenGrid({ 
  tokens, 
  isLoading, 
  hasNextPage, 
  onLoadMore,
  className = ''
}: TokenGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate grid layout based on screen size
  const getColumnsPerRow = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width >= 1280) return 6; // xl screens - 6 cols
    if (width >= 1024) return 5; // lg screens - 5 cols
    if (width >= 768) return 4;  // md screens - 4 cols  
    if (width >= 640) return 3;  // sm screens - 3 cols
    return 2; // mobile - 2 cols
  };

  const columnsPerRow = getColumnsPerRow();
  
  // Group tokens into rows
  const rows = useMemo(() => {
    const grouped = [];
    for (let i = 0; i < tokens.length; i += columnsPerRow) {
      grouped.push(tokens.slice(i, i + columnsPerRow));
    }
    return grouped;
  }, [tokens, columnsPerRow]);

  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0), // +1 for loading row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Estimated row height
    overscan: 3,
  });

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-700"></div>
      <div className="p-3">
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-2/3"></div>
      </div>
    </div>
  );

  // Empty state
  if (!isLoading && tokens.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-slate-100 font-mono mb-2">No items found</h3>
        <p className="text-gray-400 font-mono text-center max-w-md">
          No items match your current filters. Try adjusting your search or clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={parentRef}
        style={{
          height: '600px',
          overflow: 'auto',
        }}
        className="scrollbar-thin scrollbar-thumb-cyan-400/20 scrollbar-track-transparent"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowIndex = virtualRow.index;
            const isLoaderRow = rowIndex >= rows.length;
            
            if (isLoaderRow) {
              // Trigger load more when loader row comes into view
              if (hasNextPage && !isLoading) {
                onLoadMore();
              }
              
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={`grid gap-4 p-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`}>
                    {Array.from({ length: columnsPerRow }, (_, index) => (
                      <LoadingSkeleton key={index} />
                    ))}
                  </div>
                </div>
              );
            }

            const rowTokens = rows[rowIndex];
            
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={`grid gap-4 p-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`}>
                  {rowTokens.map((token) => (
                    <TokenCard
                      key={token.tokenId}
                      tokenId={token.tokenId}
                      name={token.name}
                      image={token.image}
                      rarity={token.rarity}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono">
            <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
            <span>Loading more NFTs...</span>
          </div>
        </div>
      )}
    </div>
  );
}
