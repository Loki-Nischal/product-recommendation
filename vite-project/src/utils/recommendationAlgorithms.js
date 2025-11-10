// Advanced recommendation algorithms
export const recommendationAlgorithms = {
  // Content-Based Filtering
  contentBased: (products, userPreferences, userBehavior) => {
    return products.map(product => {
      let score = 0;
      
      // Category weight
      if (userPreferences.preferredCategories.includes(product.category)) {
        score += 40;
      }
      
      // Tag similarity
      const tagIntersection = product.tags.filter(tag => 
        userPreferences.interests.includes(tag)
      );
      score += (tagIntersection.length / product.tags.length) * 30;
      
      // Price preference
      const [minPrice, maxPrice] = userPreferences.priceRange;
      if (product.price >= minPrice && product.price <= maxPrice) {
        score += 20;
      }
      
      // User behavior
      const behaviorWeight = userBehavior.filter(
        behavior => behavior.category === product.category
      ).length * 5;
      score += Math.min(10, behaviorWeight);
      
      return { ...product, matchScore: Math.min(100, score) };
    });
  },
  
  // Hybrid Approach (Combines multiple methods)
  hybrid: (products, userPreferences, userBehavior, weights = {}) => {
    const contentBasedResults = recommendationAlgorithms.contentBased(
      products, userPreferences, userBehavior
    );
    
    // Apply additional business rules
    return contentBasedResults.map(product => {
      let finalScore = product.matchScore;
      
      // Boost new products
      if (product.isNew) finalScore *= 1.2;
      
      // Boost high-rated products
      if (product.rating >= 4.5) finalScore *= 1.15;
      
      // Penalize out-of-stock items
      if (product.stock === 0) finalScore *= 0.1;
      
      return {
        ...product,
        matchScore: Math.min(100, finalScore),
        algorithm: 'hybrid'
      };
    });
  }
};

// Utility function to generate explanations for recommendations
export const generateExplanation = (product, userPreferences, userBehavior) => {
  const reasons = [];
  
  if (userPreferences.preferredCategories.includes(product.category)) {
    reasons.push(`Matches your interest in ${product.category}`);
  }
  
  const commonTags = product.tags.filter(tag => 
    userPreferences.interests.includes(tag)
  );
  if (commonTags.length > 0) {
    reasons.push(`Includes your interests: ${commonTags.slice(0, 2).join(', ')}`);
  }
  
  const similarViews = userBehavior.filter(
    behavior => behavior.category === product.category
  ).length;
  if (similarViews > 0) {
    reasons.push(`Based on your browsing history`);
  }
  
  if (product.rating >= 4.5) {
    reasons.push(`Highly rated by other users`);
  }
  
  return reasons.length > 0 ? reasons : ['Popular item you might like'];
};