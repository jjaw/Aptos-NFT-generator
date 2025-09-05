import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { RarityBadge } from "../gallery/RarityBadge";
import { AttributeTable } from "./AttributeTable";
import { RarityBreakdown } from "./RarityBreakdown";
import { PostMintBanner } from "./PostMintBanner";
import { getCollectionStats, type CollectionStats } from "@/view-functions/getCollectionStats";

interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
  rarity?: {
    score: number;
    percentile: number;
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
    components?: Array<{
      trait_type: string;
      value: string;
      ic: number;
      frequency: number;
      total: number;
    }>;
  };
}

interface RecentMintData {
  tokenId: number;
  transactionHash: string;
  timestamp: number;
}

export function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const tokenId = parseInt(id || '0');
  const [recentMintData, setRecentMintData] = useState<RecentMintData | null>(null);

  // Get collection stats to check if token exists
  const { data: collectionStats } = useQuery<CollectionStats>({
    queryKey: ['collection-stats'],
    queryFn: () => getCollectionStats(),
    staleTime: 5000, // Keep fresh for 5 seconds
  });

  const { data: metadata, isLoading, error } = useQuery<TokenMetadata>({
    queryKey: ['token-metadata', tokenId, collectionStats?.totalMinted],
    queryFn: async () => {
      // Check if token exists first
      if (collectionStats && tokenId > collectionStats.totalMinted) {
        throw new Error('TOKEN_NOT_MINTED');
      }
      
      // Try to get real data
      const response = await fetch(`/api/nft/metadata/${tokenId}`);
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        return response.json();
      }
      
      // If we get here, the token should exist but API failed
      throw new Error('API_ERROR');
    },
    enabled: !!tokenId && !!collectionStats, // Wait for both tokenId and collection stats
  });

  // Check for recent mint data on component mount
  useEffect(() => {
    const checkRecentMint = () => {
      try {
        const storedMintData = sessionStorage.getItem('recentMint');
        if (storedMintData) {
          const mintData: RecentMintData = JSON.parse(storedMintData);
          
          // Check if this token matches the recently minted one
          // and if the mint was recent (within last 5 minutes)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          
          if (mintData.tokenId === tokenId && mintData.timestamp > fiveMinutesAgo) {
            setRecentMintData(mintData);
            console.log("🎉 Detected recent mint for token:", tokenId);
          } else {
            // Clear stale data
            sessionStorage.removeItem('recentMint');
          }
        }
      } catch (error) {
        console.error('Error checking recent mint data:', error);
        sessionStorage.removeItem('recentMint');
      }
    };

    checkRecentMint();
  }, [tokenId]);

  const handleDismissPostMintBanner = () => {
    setRecentMintData(null);
    sessionStorage.removeItem('recentMint');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata?.name || `Retro NFT #${tokenId}`,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-600 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-700 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-600 rounded"></div>
                <div className="h-6 bg-gray-700 rounded w-24"></div>
                <div className="h-20 bg-gray-700 rounded"></div>
                <div className="h-40 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    const isRecentlyMinted = recentMintData && recentMintData.tokenId === tokenId;
    const errorMessage = error?.message || '';
    
    // Determine error type and appropriate messaging
    const isTokenNotMinted = errorMessage === 'TOKEN_NOT_MINTED';
    const isApiError = errorMessage === 'API_ERROR';
    
    let emoji, title, description;
    
    if (isRecentlyMinted && isApiError) {
      // Recently minted but API can't load it yet
      emoji = '⏳';
      title = 'NFT Processing...';
      description = 'Your NFT was minted successfully! It may take a moment to appear in our system. Try refreshing in a few seconds.';
    } else if (isTokenNotMinted) {
      // Token ID is beyond minted count
      emoji = '🚫';
      title = 'NFT Not Minted Yet';
      description = 'This NFT hasn\'t been minted yet. Only NFTs 1-' + (collectionStats?.totalMinted || 0) + ' are currently available.';
    } else if (isApiError) {
      // Token should exist but API failed
      emoji = '⚡';
      title = 'System Glitch Detected';
      description = 'We\'re experiencing technical difficulties accessing this NFT\'s data. Our retro systems are working to resolve this glitch. Please try again in a few moments.';
    } else {
      // Generic error
      emoji = '❌';
      title = 'Token Not Found';
      description = 'Unable to locate this NFT in our database.';
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Show post-mint banner even if NFT not found */}
          {recentMintData && (
            <div className="mb-8">
              <PostMintBanner
                transactionHash={recentMintData.transactionHash}
                onDismiss={handleDismissPostMintBanner}
              />
            </div>
          )}
          
          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-xl font-bold text-white font-mono mb-2">{title}</h2>
          <p className="text-gray-400 font-mono mb-4 leading-relaxed">{description}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {(isRecentlyMinted || isApiError) && (
              <button
                onClick={() => window.location.reload()}
                className="bg-cyan-400 hover:bg-cyan-500 text-black font-mono font-bold px-4 py-2 rounded transition-colors"
              >
                ⚡ Refresh Page
              </button>
            )}
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-mono font-bold px-4 py-2 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>

          <div className="flex items-center gap-4">
            {/* Previous/Next Navigation */}
            <div className="flex items-center gap-2">
              <Link
                to={`/token/${Math.max(1, tokenId - 1)}`}
                className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                title="Previous token"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="text-gray-400 font-mono text-sm">
                {tokenId} / 10,000
              </span>
              <Link
                to={`/token/${Math.min(10000, tokenId + 1)}`}
                className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                title="Next token"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
              title="Share this token"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post-Mint Success Banner */}
        {recentMintData && (
          <PostMintBanner
            transactionHash={recentMintData.transactionHash}
            onDismiss={handleDismissPostMintBanner}
          />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg overflow-hidden border border-cyan-400/30">
            <img
              src={metadata.image}
              alt={metadata.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Title & Rarity */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white font-mono">
                  {metadata.name}
                </h1>
                {metadata.rarity && (
                  <RarityBadge
                    tier={metadata.rarity.tier}
                    percentile={metadata.rarity.percentile}
                    className="text-sm px-3 py-1"
                  />
                )}
              </div>
              {metadata.rarity && (
                <div className="text-gray-400 font-mono text-sm">
                  Rarity Score: {metadata.rarity.score} • {metadata.rarity.percentile}th percentile
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-400 font-mono mb-2">Description</h3>
              <p className="text-gray-300 font-mono text-sm leading-relaxed">
                {metadata.description}
              </p>
            </div>

            {/* Attributes */}
            <AttributeTable attributes={metadata.attributes} />

            {/* Rarity Breakdown */}
            {metadata.rarity?.components && (
              <RarityBreakdown components={metadata.rarity.components} />
            )}

            {/* Future: Owner Info, Trading History, etc. */}
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export for lazy loading
export default TokenDetail;