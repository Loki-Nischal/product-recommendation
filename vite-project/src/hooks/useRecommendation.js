import { useState, useEffect } from 'react';
import { products } from '../data/products';

export const useRecommendation = (userPreferences, userBehavior = []) => {
  const [recommendations, setRecommendations] = useState([]);

  const calculateProductScore = (product, preferences, behavior) => {
    let score = 0;

    // 1. Category matching (30% weight)
    if (preferences.preferredCategories.includes(product.category)) {
      score += 30;
    }

    // 2. Tag matching (25% weight)
    const matchingTags = product.tags.filter(tag => 
      preferences.interests.includes(tag)
    ).length;
    score += (matchingTags / product.tags.length) * 25;

    // 3. Price range matching (20% weight)
    const [minPrice, maxPrice] = preferences.priceRange;
    if (product.price >= minPrice && product.price <= maxPrice) {
      score += 20;
    } else {
      // Partial score for near range
      const priceDiff = Math.min(
        Math.abs(product.price - minPrice),
        Math.abs(product.price - maxPrice)
      );
      score += Math.max(0, 20 - (priceDiff / 10));
    }

    // 4. Rating consideration (15% weight)
    score += (product.rating / 5) * 15;

    // 5. Behavior-based scoring (10% weight)
    const similarProductsViewed = behavior.filter(
      item => item.category === product.category
    ).length;
    score += Math.min(10, similarProductsViewed * 2);

    return Math.min(100, score);
  };

  useEffect(() => {
    const generateRecommendations = () => {
      const scoredProducts = products.map(product => ({
        ...product,
        matchScore: calculateProductScore(product, userPreferences, userBehavior)
      }));

      // Filter out products with very low scores and sort
      return scoredProducts
        .filter(product => product.matchScore > 20)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6); // Return top 6 recommendations
    };

    setRecommendations(generateRecommendations());
  }, [userPreferences, userBehavior]);

  return recommendations;
};