import { useState, useEffect } from 'react';
import api from '../api/api';
import { recommendationAlgorithms, generateExplanation } from '../utils/recommendationAlgorithms';

// Accept `products` as the first argument so we can use live data from the API
export const useRecommendation = (products = [], userPreferences, userBehavior = []) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchFromBackend = async () => {
      try {
        const aiSemanticEnabled = localStorage.getItem('aiSemantic') === 'true';
        // If AI semantic is not enabled, do not call backend personalized endpoint
        if (!aiSemanticEnabled) return null;

        // Build views query from guest storage when user not logged in
        const token = localStorage.getItem('token');
        let viewsQuery = '';
        if (!token) {
          try {
            const raw = localStorage.getItem('guestViewedProducts') || '[]';
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const ids = parsed.slice(0, 12).map((s) => s.toString());
              viewsQuery = `&views=${encodeURIComponent(ids.join(','))}`;
            }
          } catch (e) {
            viewsQuery = '';
          }
        }

        // Query backend personalized recommender (no search query here)
        const res = await api.get(`/recommend/personalized?limit=12${viewsQuery}`);
        if (res && res.success && Array.isArray(res.products)) {
          return res.products;
        }
        return null;
      } catch (err) {
        // network/backend errors -> fall back to client-side
        console.debug('Backend personalized recommendations failed:', err?.message || err);
        return null;
      }
    };

    const generateClientSide = () => {
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

    const run = async () => {
      // Prefer backend when available and enabled; otherwise use local scoring
      const backend = await fetchFromBackend();
      if (!mounted) return;

      if (backend && backend.length > 0) {
        // Attach explanations where possible, then return top 6
        const enriched = backend.slice(0, 12).map((p) => ({
          ...p,
          explanation: generateExplanation(p, userPreferences, userBehavior)
        }));
        setRecommendations(enriched.slice(0, 6));
        setIsPersonalized(true);
        return;
      }

      // Fallback to client-side algorithm
      setIsPersonalized(false);
      setRecommendations(generateClientSide());
    };

    run();

    return () => { mounted = false; };
  }, [products, userPreferences, userBehavior]);

  return [recommendations, isPersonalized];
};