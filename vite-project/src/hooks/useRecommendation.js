import { useState, useEffect } from 'react';
import { recommendationAlgorithms, generateExplanation } from '../utils/recommendationAlgorithms';

// Accept `products` as the first argument so we can use live data from the API
export const useRecommendation = (products = [], userPreferences, userBehavior = []) => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const generateRecommendations = () => {
      const scoredProducts = recommendationAlgorithms.hybrid(
        products,
        userPreferences,
        userBehavior
      );

      // Add explanations to recommendations
      const recommendationsWithExplanations = scoredProducts
        .filter(product => product.matchScore > 20)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6)
        .map(product => ({
          ...product,
          explanation: generateExplanation(product, userPreferences, userBehavior)
        }));

      return recommendationsWithExplanations;
    };

    setRecommendations(generateRecommendations());
  }, [products, userPreferences, userBehavior]);

  return recommendations;
};