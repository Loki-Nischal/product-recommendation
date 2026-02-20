# 🎯 Content-Based Recommendation System Setup Guide

## Overview

This project implements a **Content-Based Recommendation System** using:
- **Python**: TF-IDF (Term Frequency-Inverse Document Frequency) + Cosine Similarity
- **Node.js**: Backend API integration
- **React**: Frontend display

## 📋 Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- MongoDB running locally

## 🚀 Quick Start

### Step 1: Setup Python Environment

```powershell
# Navigate to recommendation engine directory
cd backend/recommendation-engine

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**For macOS/Linux:**
```bash
source venv/bin/activate
```

### Step 2: Test Python Script

```powershell
# Test with a product ID from your database
python recommend.py <your-product-id>

# Example:
python recommend.py 693d487784f5346670d3e26a
```

**Expected Output:**
```json
[
  {"productId": "693e2c054782e1625455891d", "similarity": 0.8521},
  {"productId": "6943852887dfb87bed4e6f4b", "similarity": 0.7234}
]
```

### Step 3: Start Backend Server

```powershell
cd backend
npm install  # if not already done
npm start
```

### Step 4: Start Frontend

```powershell
cd vite-project
npm install  # if not already done
npm run dev
```

## 📊 How It Works

### 1. Data Preparation
The system combines product fields into text documents:
```
"Gaming Laptop Electronics High performance gaming laptop RTX 3060 16GB RAM gaming performance laptop"
```

### 2. TF-IDF Vectorization
Converts text into numerical vectors that capture word importance:
- **TF (Term Frequency)**: How often a word appears in the document
- **IDF (Inverse Document Frequency)**: How unique/rare a word is across all documents

### 3. Cosine Similarity
Measures similarity between two vectors (0 to 1):
- **1.0**: Identical products
- **0.8-0.9**: Very similar
- **0.5-0.7**: Somewhat similar
- **<0.3**: Not very similar

### 4. Recommendation Flow

```
User views Product A
    ↓
Frontend calls: GET /api/products/similar/:id
    ↓
Node.js spawns Python process
    ↓
Python:
  - Fetches all products from MongoDB
  - Combines text fields (name, category, description, tags)
  - Applies TF-IDF vectorization
  - Computes cosine similarity
  - Returns top N similar product IDs
    ↓
Node.js:
  - Fetches full product details
  - Adds similarity scores
  - Returns to frontend
    ↓
Frontend displays similar products with match %
```

## 🔧 Configuration

### Python Script (`recommend.py`)

```python
# MongoDB Configuration
MONGO_URI = "mongodb://127.0.0.1:27017/"
DATABASE_NAME = "estore"
COLLECTION_NAME = "products"
```

### TF-IDF Parameters

```python
vectorizer = TfidfVectorizer(
    stop_words='english',  # Remove common words (the, a, an, etc.)
    ngram_range=(1, 2),    # Use 1-word and 2-word phrases
    max_df=0.8,            # Ignore words in >80% of docs
    min_df=1,              # Include words in at least 1 doc
    lowercase=True         # Convert to lowercase
)
```

## 🎨 Features Implemented

### Backend (Node.js)
✅ `/api/products/similar/:id` - Get content-based recommendations
✅ Python process spawning with error handling
✅ Similarity score enrichment
✅ Fallback mechanism if Python fails

### Frontend (React)
✅ **ProductDetails Page**: Shows similar products
✅ **Similarity Badge**: Displays match percentage (e.g., "85% match")
✅ **Loading State**: Shows spinner while loading recommendations
✅ **Responsive Grid**: 2-4 columns based on screen size
✅ **Fallback**: Shows random products if recommendation fails

## 📝 API Endpoints

### Get Similar Products
```
GET /api/products/similar/:id?limit=10
```

**Parameters:**
- `id` (required): Product ID
- `limit` (optional): Number of recommendations (default: 10)

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "693e2c054782e1625455891d",
      "name": "Gaming Laptop",
      "category": "Electronics",
      "price": 1299.99,
      "similarityScore": 0.8521
    }
  ],
  "count": 8,
  "basedOn": {
    "productId": "693d487784f5346670d3e26a",
    "productName": "Mac"
  }
}
```

## 🐛 Troubleshooting

### Python not found
```powershell
# Add Python to PATH or use full path in Node.js spawn
const pythonProcess = spawn("C:\\Python\\python.exe", [...]);
```

### Virtual environment not activated
```powershell
# Windows
backend\recommendation-engine\venv\Scripts\activate

# macOS/Linux
source backend/recommendation-engine/venv/bin/activate
```

### Module not found
```powershell
# Ensure you're in activated venv
pip install -r requirements.txt

# Verify installation
pip list
```

### MongoDB connection failed
- Ensure MongoDB is running: `mongod`
- Check connection string in `recommend.py`
- Verify database name matches your setup

### No recommendations returned
- Ensure products exist in database
- Check product has text fields (name, description, tags)
- Verify product ID is correct

## 🎯 Testing Recommendations

### Test Script
```powershell
# Activate venv
cd backend/recommendation-engine
venv\Scripts\activate

# Test with product ID
python recommend.py 693d487784f5346670d3e26a 5
```

### Test via API
```bash
# Using curl
curl http://localhost:4000/api/products/similar/693d487784f5346670d3e26a?limit=5

# Using browser
http://localhost:4000/api/products/similar/693d487784f5346670d3e26a
```

### Test via Frontend
1. Navigate to any product details page
2. Scroll down to "Similar Products" section
3. Should see products with similarity badges

## 🚀 Performance Optimization (Optional)

### Cache Similarity Matrix
Store pre-computed matrix in memory to avoid recalculation:

```python
import pickle

# Save matrix
with open('similarity_matrix.pkl', 'wb') as f:
    pickle.dump(cosine_sim, f)

# Load matrix
with open('similarity_matrix.pkl', 'rb') as f:
    cosine_sim = pickle.load(f)
```

### Rebuild on Product Changes
- Hook into product creation/update events
- Regenerate similarity matrix
- Store in Redis for faster access

## 📚 For Viva/Presentation

### Key Points to Explain

1. **Why TF-IDF?**
   - Captures word importance
   - Reduces noise from common words
   - Industry-standard for text similarity

2. **Why Cosine Similarity?**
   - Measures angle between vectors (direction matters, not magnitude)
   - Perfect for text comparison
   - Scale-invariant (long vs short descriptions)

3. **Advantages over Collaborative Filtering:**
   - Works for new products (no cold start)
   - Doesn't need user ratings
   - Explainable (similar description/category/tags)

4. **Real-world Applications:**
   - Amazon: "Customers who viewed this also viewed"
   - Netflix: Content-based genre/actor matching
   - Spotify: Song feature similarity

### Demo Flow

1. Show product with detailed description/tags
2. Click to view details
3. Scroll to "Similar Products"
4. Point out similarity percentages
5. Click similar product → repeats process

## 📦 Deployment Considerations

### Production Setup
- Use separate Python service (Flask/FastAPI)
- Cache recommendations in Redis
- Use CDN for product images
- Monitor Python process health
- Add rate limiting

### Environment Variables
```env
PYTHON_PATH=/usr/bin/python3
MONGO_URI=mongodb://localhost:27017/
DATABASE_NAME=estore
```

## 🎉 Success!

You now have a fully functional content-based recommendation system!

Visit any product page and see similar products based on content similarity.
