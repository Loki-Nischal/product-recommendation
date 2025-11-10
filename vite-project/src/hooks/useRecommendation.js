import { useState, useEffect } from 'react';
import { products } from '../data/products';
import { recommendationAlgorithms, generateExplanation } from '../utils/recommendationAlgorithms';

export const useRecommendation = (userPreferences, userBehavior = []) => {
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
  }, [userPreferences, userBehavior]);

  return recommendations;
};