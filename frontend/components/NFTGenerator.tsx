import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { mintRandomNft } from "@/entry-functions/mintRandomNft";
import { getCollectionStats } from "@/view-functions/getCollectionStats";
import { previewRandomNft } from "@/view-functions/previewRandomNft";

interface NFTMetadata {
  background_color: string;
  shape: string;
  word_combination: string;
  token_id: number;
}

export function NFTGenerator() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [maxSupply, setMaxSupply] = useState<number>(10000);
  const [previewNft, setPreviewNft] = useState<NFTMetadata | null>(null);

  // Load collection stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getCollectionStats();
        setTotalMinted(stats.totalMinted);
        setMaxSupply(stats.maxSupply);
      } catch (error) {
        console.error("Failed to load collection stats:", error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate preview
  const generatePreview = async () => {
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const preview = await previewRandomNft(seed);
      setPreviewNft(preview);
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  };

  // Generate preview on component mount
  useEffect(() => {
    generatePreview();
  }, []);

  const handleMint = async () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint an NFT",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await signAndSubmitTransaction(
        mintRandomNft({
          user: account.address,
        })
      );

      toast({
        title: "NFT Minted! 🎉",
        description: `Transaction: ${response.hash}`,
        variant: "default",
      });

      // Refresh stats
      setTimeout(async () => {
        try {
          const stats = await getCollectionStats();
          setTotalMinted(stats.totalMinted);
        } catch (error) {
          console.error("Failed to refresh stats:", error);
        }
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Minting failed",
        description: error.message || "An error occurred while minting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderNFTPreview = (metadata: NFTMetadata) => {
    return (
      <div 
        className="w-64 h-64 rounded-lg border-2 border-cyan-400 shadow-lg shadow-pink-500/25 flex flex-col items-center justify-center p-4 font-mono text-center relative overflow-hidden"
        style={{ backgroundColor: metadata.background_color }}
      >
        {/* Scanlines effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent opacity-50"></div>
        
        {/* Shape */}
        <div className="text-6xl mb-4 drop-shadow-lg z-10">
          {getShapeEmoji(metadata.shape)}
        </div>
        
        {/* Words */}
        <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-2 z-10">
          <div className="text-white text-sm font-bold tracking-wider">
            {metadata.word_combination}
          </div>
        </div>
        
        {/* Retro effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/10 pointer-events-none"></div>
      </div>
    );
  };

  const getShapeEmoji = (shape: string): string => {
    const shapeEmojis: { [key: string]: string } = {
      'Circle': '⭕',
      'Square': '⬜',
      'Triangle': '🔺',
      'Diamond': '💎',
      'Star': '⭐',
      'Pentagon': '⬟',
      'Hexagon': '⬢',
      'Octagon': '⬣',
      'Cross': '✚',
      'Heart': '💖',
      'Arrow': '➤',
      'Spiral': '🌀',
      'Infinity': '♾️'
    };
    return shapeEmojis[shape] || '❓';
  };

  const progressPercentage = (totalMinted / maxSupply) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Collection Stats */}
      <div className="bg-black/50 backdrop-blur-sm border border-cyan-400 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-cyan-400 font-mono">
              {totalMinted.toLocaleString()}
            </div>
            <div className="text-gray-300 text-sm font-mono">MINTED</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-pink-400 font-mono">
              {maxSupply.toLocaleString()}
            </div>
            <div className="text-gray-300 text-sm font-mono">MAX SUPPLY</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400 font-mono">
              {progressPercentage.toFixed(1)}%
            </div>
            <div className="text-gray-300 text-sm font-mono">COMPLETE</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-pink-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Section */}
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-400 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white font-mono mb-4 text-center">
            PREVIEW GENERATOR
          </h3>
          
          <div className="flex flex-col items-center space-y-4">
            {previewNft && renderNFTPreview(previewNft)}
            
            <Button
              onClick={generatePreview}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono border border-purple-400"
            >
              GENERATE PREVIEW
            </Button>
            
            <p className="text-xs text-gray-400 text-center font-mono">
              This is just a preview. Your actual NFT will be randomly generated.
            </p>
          </div>
        </div>

        {/* Mint Section */}
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-400 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white font-mono mb-4 text-center">
            CLAIM YOUR NFT
          </h3>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center text-4xl">
                🎯
              </div>
              <p className="text-gray-300 font-mono text-sm">
                Each NFT is unique with randomized:
              </p>
              <ul className="text-cyan-300 font-mono text-xs mt-2 space-y-1">
                <li>• Background Color (5 variations)</li>
                <li>• Central Shape (13 rare shapes)</li>
                <li>• Word Combination (3 random words)</li>
              </ul>
            </div>
            
            <Button
              onClick={handleMint}
              disabled={isLoading || totalMinted >= maxSupply}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono border border-cyan-400 text-lg py-6"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>MINTING...</span>
                </div>
              ) : totalMinted >= maxSupply ? (
                "SOLD OUT"
              ) : (
                "CLAIM NFT"
              )}
            </Button>
            
            <div className="text-center text-xs text-gray-400 font-mono">
              <p>Free mint • Gas fees apply</p>
              <p>Powered by Aptos blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}