import Sidebar from "../../components/Admin/Sidebar";
import { useState, useEffect } from "react";
import { useAdminProducts } from "../../context/AdminProductContext";
import { useNavigate, useParams } from "react-router-dom";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, updateProduct, fetchProducts, loading: loadingProducts, error: contextError } = useAdminProducts();

  const [form, setForm] = useState({
    title: "",
    name: "",
    price: "",
    category: "Electronics",
    description: "",
    image: "",
    brand: "",
    rating: 4,
    stock: 10,
    tags: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      let prod = (products || []).find((p) => p._id === id || p.id === id);
      if (!prod) {
        try {
          await fetchProducts();
        } catch (e) {
          // ignore here, context shows error
        }
        prod = (products || []).find((p) => p._id === id || p.id === id);
      }

      if (prod) {
        setForm({
          title: prod.title || prod.name || "",
          name: prod.name || prod.title || "",
          price: prod.price != null ? String(prod.price) : "",
          category: prod.category || "Electronics",
          description: prod.description || "",
          image: prod.image || prod.img || "",
          brand: prod.brand || "",
          rating: prod.rating != null ? prod.rating : 4,
          stock: prod.stock != null ? prod.stock : 0,
          tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : (prod.tags || ""),
        });
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // keep `name` and `title` in sync when user edits the visible Product Name field
    if (name === "title") {
      setForm((prev) => ({ ...prev, title: value, name: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.title && !form.name) {
      setError("Product name is required");
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setError("Valid price is required");
      return;
    }
    if (!form.image) {
      setError("Image URL is required");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        title: form.title || form.name,
        name: form.name || form.title,
        price: parseFloat(form.price),
        category: form.category,
        description: form.description || "",
        image: form.image,
        brand: form.brand || "Unknown",
        rating: parseFloat(form.rating) || 4,
        stock: parseInt(form.stock, 10) || 0,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      };

      await updateProduct(id, productData);
      // Refresh product list to ensure UI reflects backend state
      try {
        await fetchProducts();
      } catch (e) {
        // ignore fetch errors here; updateProduct already updated local state
      }
      setSuccess(true);

      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  // If product not found yet
  const productFound = (products || []).some((p) => p._id === id || p.id === id);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <div className="p-6 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Edit Product</h1>

          {!productFound && loadingProducts && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
          )}

          {!productFound && !loadingProducts && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg">
              Product not found. It may have been removed.
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {contextError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {contextError}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Product updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-6 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., iPhone 15"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price (USD) *</label>
                <input
                  type="number"
                  name="price"
                  placeholder="99.99"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Electronics</option>
                  <option>Clothing</option>
                  <option>Books</option>
                  <option>Home & Garden</option>
                  <option>Sports</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  placeholder="Brand name"
                  value={form.brand}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Product description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL *</label>
              <input
                type="url"
                name="image"
                placeholder="https://example.com/image.jpg"
                value={form.image}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.image && (
                <div className="mt-2">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=Image+Error")}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <input
                  type="number"
                  name="rating"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="tag1, tag2, tag3"
                  value={form.tags}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition transform focus:outline-none focus:ring-4 focus:ring-blue-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
