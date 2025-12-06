import { getRecommendations } from "../ai/recommendationEngine.js";

export const getRecommendationsController = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const recommendedProducts = await getRecommendations(productId, userId);

    res.json(recommendedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Recommendation error" });
  }
};
