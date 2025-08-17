import { useQuery } from "@tanstack/react-query";
import { mockCollectionStats } from "@/utils/mockData";

interface CollectionStats {
  totalSupply: number;
  totalMinted: number;
  lastUpdated: string;
}

export function GalleryHeader() {
  const { data: stats, isLoading } = useQuery<CollectionStats>({
    queryKey: ['collection-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/nft/collection/stats');
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return response.json();
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.warn('Stats API failed, using mock data:', error);
        return mockCollectionStats;
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        {/* Collection Avatar & Title */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center text-2xl mr-4">
            🌆
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-mono tracking-wider">
              RETRO 80S COLLECTION
            </h1>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-lg text-gray-300 font-mono max-w-2xl mx-auto">
          A collection of randomly generated retro 80s style NFTs with unique backgrounds, shapes, and word combinations
        </p>
        
        {/* Stats */}
        <div className="mt-6 flex items-center justify-center space-x-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              {stats?.totalSupply?.toLocaleString() || '10,000'}
            </div>
            <div className="text-sm text-gray-400 font-mono">Items</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400 font-mono">
              {isLoading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-16 rounded"></div>
              ) : (
                stats?.totalMinted?.toLocaleString() || '0'
              )}
            </div>
            <div className="text-sm text-gray-400 font-mono">Minted</div>
          </div>
          
          {/* Future stats can be added here */}
          <div className="text-center opacity-50">
            <div className="text-2xl font-bold text-gray-500 font-mono">—</div>
            <div className="text-sm text-gray-500 font-mono">Owners</div>
          </div>
          
          <div className="text-center opacity-50">
            <div className="text-2xl font-bold text-gray-500 font-mono">—</div>
            <div className="text-sm text-gray-500 font-mono">Floor</div>
          </div>
        </div>
        
        {/* Decorative Line */}
        <div className="mt-6 flex justify-center">
          <div className="bg-gradient-to-r from-cyan-500 to-pink-500 h-1 w-32 rounded"></div>
        </div>
      </div>
    </div>
  );
}