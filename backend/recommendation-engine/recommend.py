"""
Content-Based Recommendation System using TF-IDF + Cosine Similarity
Recommends products based on text similarity (name, category, description, tags)
"""

import sys
import json
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# MongoDB Configuration
MONGO_URI = "mongodb://127.0.0.1:27017/"
DATABASE_NAME = "estore"
COLLECTION_NAME = "products"

def get_products_from_db():
    """Fetch all products from MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        products_collection = db[COLLECTION_NAME]
        products = list(products_collection.find())
        client.close()
        return products
    except Exception as e:
        print(json.dumps({"error": f"Database connection failed: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

def prepare_text_data(products):
    """
    Combine product fields into text documents
    Returns: (product_texts, product_ids, product_map)
    """
    product_texts = []
    product_ids = []
    product_map = {}
    
    for product in products:
        # Combine all text fields into one document
        name = str(product.get('name', '') or product.get('title', ''))
        category = str(product.get('category', ''))
        description = str(product.get('description', ''))
        tags = product.get('tags', [])
        tags_text = ' '.join([str(tag) for tag in tags]) if isinstance(tags, list) else ''
        brand = str(product.get('brand', ''))
        
        # Create combined text document
        text_document = f"{name} {category} {description} {tags_text} {brand}".strip()
        
        product_id = str(product['_id'])
        product_texts.append(text_document)
        product_ids.append(product_id)
        product_map[product_id] = {
            'name': name,
            'category': category,
            'text': text_document
        }
    
    return product_texts, product_ids, product_map

def build_similarity_matrix(product_texts):
    """
    Build TF-IDF matrix and compute cosine similarity
    Returns: (tfidf_matrix, cosine_sim)
    """
    # TF-IDF Vectorization with improved parameters
    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),  # Unigrams and bigrams for better context
        max_df=0.8,          # Ignore terms that appear in >80% of documents
        min_df=1,            # Include terms that appear at least once
        lowercase=True
    )
    
    tfidf_matrix = vectorizer.fit_transform(product_texts)
    
    # Compute cosine similarity between all products
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    return tfidf_matrix, cosine_sim

def get_recommendations(product_id, product_ids, cosine_sim, top_n=10, min_similarity=0.10):
    """
    Get top N similar products for a given product ID.
    Only returns products with similarity >= min_similarity so
    completely unrelated results (jacket for an iPhone) are excluded.
    """
    try:
        # Find index of the product
        idx = product_ids.index(product_id)
        
        # Get similarity scores for this product
        similarity_scores = list(enumerate(cosine_sim[idx]))
        
        # Sort by similarity score (descending)
        similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
        
        # Exclude the product itself (index 0 after sort) AND enforce minimum threshold
        filtered = [
            (i, score)
            for i, score in similarity_scores[1:]
            if score >= min_similarity
        ]
        
        # Take top N after filtering
        top_results = filtered[:top_n]
        
        # Get product IDs and scores
        recommendations = []
        for i, score in top_results:
            recommendations.append({
                'productId': product_ids[i],
                'similarity': round(float(score), 4)
            })
        
        return recommendations
    except ValueError:
        return []

def main():
    """Main execution function"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Product ID required"}), file=sys.stderr)
        sys.exit(1)
    
    input_product_id = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    # Fetch products from database
    products = get_products_from_db()
    
    if not products:
        print(json.dumps([]))
        return
    
    # Prepare text data
    product_texts, product_ids, product_map = prepare_text_data(products)
    
    # Build similarity matrix
    tfidf_matrix, cosine_sim = build_similarity_matrix(product_texts)
    
    # Get recommendations
    recommendations = get_recommendations(input_product_id, product_ids, cosine_sim, top_n)
    
    # Output as JSON
    print(json.dumps(recommendations))

if __name__ == "__main__":
    main()
