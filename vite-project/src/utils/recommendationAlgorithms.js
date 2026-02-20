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
      // if (product.rating >= 4.5) finalScore *= 1.15;

      // Penalize out-of-stock items
      if (product.stock === 0) finalScore *= 0.1;

      return {
        ...product,
        matchScore: Math.min(100, finalScore),
        algorithm: 'hybrid'
      };
    });
  }
  ,
  // Simple client-side Item-based Collaborative Filtering (tag/category co-occurrence)
  collaborative: (products, userBehavior = [], opts = {}) => {
    // Build interest profile from user behavior: count tags and categories
    const tagCounts = {};
    const categoryCounts = {};
    const weightByAction = opts.weightByAction || { view: 1, like: 3, add_to_cart: 4, purchase: 6 };

    userBehavior.forEach(b => {
      const w = weightByAction[b.action] || 1;
      (b.tags || []).forEach(t => {
        const k = String(t).toLowerCase();
        tagCounts[k] = (tagCounts[k] || 0) + w;
      });
      if (b.category) {
        const c = String(b.category).toLowerCase();
        categoryCounts[c] = (categoryCounts[c] || 0) + w;
      }
    });

    // If there's no behavior signal, return empty scored list
    const hasSignal = Object.keys(tagCounts).length > 0 || Object.keys(categoryCounts).length > 0;
    if (!hasSignal) return products.map(p => ({ ...p, matchScore: 0 }));

    // Normalize counts to a 0-1 range
    const maxTag = Math.max(0, ...Object.values(tagCounts));
    const maxCat = Math.max(0, ...Object.values(categoryCounts));

    return products.map(product => {
      const pTags = Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];
      const tagScore = pTags.reduce((s, t) => s + (tagCounts[t] || 0), 0) / (maxTag || 1);
      const cat = String(product.category || '').toLowerCase();
      const catScore = (categoryCounts[cat] || 0) / (maxCat || 1);

      // Combine tag and category signals, weight tags higher
      let score = (0.7 * tagScore + 0.3 * catScore) * 100;

      // Small boost for high-rated items
      if ((product.rating || 0) >= 4.5) score *= 1.05;

      // Penalize out-of-stock
      if ((product.stock || 0) === 0) score *= 0.2;

      return { ...product, matchScore: Math.min(100, Math.round(score)), algorithm: 'collaborative' };
    }).sort((a, b) => b.matchScore - a.matchScore);
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