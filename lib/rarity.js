// Rarity Calculation Engine for Retro NFT Collection
// Implements the mathematical formula from PRD with smoothing and percentiles

// Shape probabilities from contract (SHAPE_CUMULATIVE_PROBS converted to percentages)
const SHAPE_RARITY = [
  { shape: "Circle", probability: 0.256 },     // 25.6%
  { shape: "Square", probability: 0.192 },     // 19.2%
  { shape: "Triangle", probability: 0.144 },   // 14.4%
  { shape: "Diamond", probability: 0.108 },    // 10.8%
  { shape: "Star", probability: 0.081 },       // 8.1%
  { shape: "Pentagon", probability: 0.061 },   // 6.1%
  { shape: "Hexagon", probability: 0.046 },    // 4.6%
  { shape: "Octagon", probability: 0.034 },    // 3.4%
  { shape: "Cross", probability: 0.026 },      // 2.6%
  { shape: "Heart", probability: 0.019 },      // 1.9%
  { shape: "Arrow", probability: 0.014 },      // 1.4%
  { shape: "Spiral", probability: 0.011 },     // 1.1%
  { shape: "Infinity", probability: 0.008 }    // 0.8%
];

// Background color prior (uniform across 13 colors)
const BACKGROUND_COLOR_PRIOR = 1 / 13; // ≈ 0.076923

// Word combination prior (100³ = 1,000,000 possible combinations)
const WORD_COMBINATION_PRIOR = 1 / 1000000;

/**
 * Get prior probability for a specific trait value
 */
function getPriorProbability(traitType, value) {
  switch (traitType) {
    case 'Shape':
      const shapeData = SHAPE_RARITY.find(s => s.shape === value);
      return shapeData ? shapeData.probability : 0.001; // fallback for unknown shapes
    
    case 'Background Color':
      return BACKGROUND_COLOR_PRIOR;
    
    case 'Words':
      return WORD_COMBINATION_PRIOR;
    
    default:
      return 0.001; // fallback for unknown trait types
  }
}

/**
 * Get adaptive smoothing parameter based on minted count
 */
function getSmoothingParameter(totalMinted) {
  if (totalMinted < 1000) return 200;
  if (totalMinted < 5000) return 100;
  return 50;
}

/**
 * Calculate smoothed probability for a trait value
 * Formula: P̂(v) = (c(v) + α · P₀(v)) / (N_T + α)
 */
function calculateSmoothedProbability(observedCount, totalCount, priorProbability, smoothingParameter) {
  const numerator = observedCount + (smoothingParameter * priorProbability);
  const denominator = totalCount + smoothingParameter;
  return numerator / denominator;
}

/**
 * Calculate information content (rarity score) for a token
 * Formula: IC(token) = Σ_{(T,v)} -log₂(P̂(v))
 */
function calculateInformationContent(tokenAttributes, traitCounts, totalMinted) {
  const smoothingParameter = getSmoothingParameter(totalMinted);
  let informationContent = 0;

  tokenAttributes.forEach(attr => {
    const { trait_type, value } = attr;
    
    // Get observed count for this trait value
    const observedCount = traitCounts[trait_type]?.[value] || 0;
    
    // Get total count for this trait type
    const totalCountForTrait = Object.values(traitCounts[trait_type] || {})
      .reduce((sum, count) => sum + count, 0);
    
    // Get prior probability
    const priorProbability = getPriorProbability(trait_type, value);
    
    // Calculate smoothed probability
    const smoothedProbability = calculateSmoothedProbability(
      observedCount,
      totalCountForTrait || totalMinted,
      priorProbability,
      smoothingParameter
    );
    
    // Add information content: -log₂(P̂(v))
    if (smoothedProbability > 0) {
      informationContent += -Math.log2(smoothedProbability);
    }
  });

  return informationContent;
}

/**
 * Normalize scores to 0-100 range and calculate percentiles
 */
function normalizeScoresAndCalculatePercentiles(tokens) {
  // Calculate information content for all tokens
  const tokensWithIC = tokens.map(token => ({
    ...token,
    informationContent: token.informationContent || 0
  }));

  // Find min and max information content
  const icValues = tokensWithIC.map(t => t.informationContent);
  const minIC = Math.min(...icValues);
  const maxIC = Math.max(...icValues);
  const icRange = maxIC - minIC;

  // Normalize to 0-100 and calculate percentiles
  const tokensWithScores = tokensWithIC.map(token => {
    // Normalize score
    const normalizedScore = icRange > 0 ? 
      100 * (token.informationContent - minIC) / icRange : 50;
    
    return {
      ...token,
      normalizedScore
    };
  });

  // Sort by score for percentile calculation
  const sortedTokens = [...tokensWithScores].sort((a, b) => a.normalizedScore - b.normalizedScore);
  
  // Calculate percentiles
  const tokensWithPercentiles = sortedTokens.map((token, index) => {
    const percentile = Math.floor((index / (sortedTokens.length - 1)) * 100);
    
    // Determine tier based on percentile
    let tier;
    if (percentile >= 98) tier = 'S';
    else if (percentile >= 90) tier = 'A';
    else if (percentile >= 60) tier = 'B';
    else if (percentile >= 30) tier = 'C';
    else tier = 'D';

    return {
      ...token,
      rarity: {
        score: Math.round(token.normalizedScore * 10) / 10, // Round to 1 decimal
        percentile,
        tier,
        components: token.attributes.map(attr => {
          const observedCount = token.traitCounts?.[attr.trait_type]?.[attr.value] || 0;
          const totalCountForTrait = Object.values(token.traitCounts?.[attr.trait_type] || {})
            .reduce((sum, count) => sum + count, 0);
          
          return {
            trait_type: attr.trait_type,
            value: attr.value,
            ic: token.informationContent || 0,
            frequency: observedCount,
            total: totalCountForTrait
          };
        })
      }
    };
  });

  // Return tokens in original order with rarity data
  return tokens.map(originalToken => {
    const tokenWithRarity = tokensWithPercentiles.find(t => t.tokenId === originalToken.tokenId);
    return {
      ...originalToken,
      rarity: tokenWithRarity?.rarity || null
    };
  });
}

/**
 * Main function to calculate rarity for all tokens
 */
function calculateRarityForCollection(tokens, traitCounts) {
  if (!tokens.length) return tokens;

  const totalMinted = tokens.length;
  
  // Calculate information content for each token
  const tokensWithIC = tokens.map(token => {
    const informationContent = calculateInformationContent(
      token.attributes || [],
      traitCounts,
      totalMinted
    );
    
    return {
      ...token,
      informationContent,
      traitCounts // Store for component calculation
    };
  });

  // Normalize scores and calculate percentiles
  return normalizeScoresAndCalculatePercentiles(tokensWithIC);
}

/**
 * Calculate rarity for a single token (used for individual token queries)
 */
function calculateRarityForToken(tokenAttributes, traitCounts, totalMinted) {
  const informationContent = calculateInformationContent(
    tokenAttributes,
    traitCounts,
    totalMinted
  );

  // For single token, we can't calculate percentiles without all tokens
  // So we'll provide a simplified rarity estimate
  const estimatedScore = Math.min(100, Math.max(0, informationContent * 10));
  
  let tier;
  if (estimatedScore >= 80) tier = 'S';
  else if (estimatedScore >= 65) tier = 'A';
  else if (estimatedScore >= 45) tier = 'B';
  else if (estimatedScore >= 25) tier = 'C';
  else tier = 'D';

  return {
    score: Math.round(estimatedScore * 10) / 10,
    percentile: Math.round(estimatedScore), // Rough estimate
    tier,
    components: tokenAttributes.map(attr => {
      const observedCount = traitCounts[attr.trait_type]?.[attr.value] || 0;
      const totalCountForTrait = Object.values(traitCounts[attr.trait_type] || {})
        .reduce((sum, count) => sum + count, 0);
      
      return {
        trait_type: attr.trait_type,
        value: attr.value,
        ic: informationContent,
        frequency: observedCount,
        total: totalCountForTrait
      };
    })
  };
}

module.exports = {
  calculateRarityForCollection,
  calculateRarityForToken,
  getPriorProbability,
  getSmoothingParameter,
  calculateSmoothedProbability,
  calculateInformationContent,
  SHAPE_RARITY
};