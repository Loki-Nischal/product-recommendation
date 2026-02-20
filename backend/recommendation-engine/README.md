# Content-Based Recommendation Engine

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd recommendation-engine
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Test the Recommendation Engine

```bash
python recommend.py <product_id>
```

Example:
```bash
python recommend.py 693d487784f5346670d3e26a
```

Output:
```json
[
  {"productId": "693e2c054782e1625455891d", "similarity": 0.8521},
  {"productId": "6943852887dfb87bed4e6f4b", "similarity": 0.7234}
]
```

## How It Works

1. **Data Preparation**: Combines product name, category, description, tags, and brand into text documents
2. **TF-IDF Vectorization**: Converts text into numerical vectors using Term Frequency-Inverse Document Frequency
3. **Cosine Similarity**: Computes similarity between all product pairs
4. **Recommendations**: Returns top N most similar products

## Configuration

Edit `recommend.py` to change:
- `MONGO_URI`: MongoDB connection string (default: `mongodb://127.0.0.1:27017/`)
- `DATABASE_NAME`: Database name (default: `estore`)
- `COLLECTION_NAME`: Collection name (default: `products`)

## Integration with Node.js

The Node.js backend calls this Python script via child_process and returns results to the frontend.

Endpoint: `GET /api/products/recommend/:id`
