import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { useState } from "react";
import { useAdminProducts } from "../../context/AdminProductContext";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const navigate = useNavigate();
  const { addProduct, error: contextError } = useAdminProducts();
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
    tags: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

      await addProduct(productData);
      setSuccess(true);
      setForm({
        title: "",
        name: "",
        price: "",
        category: "Electronics",
        description: "",
        image: "",
        brand: "",
        rating: 4,
        stock: 10,
        tags: [],
      });

      setTimeout(() => {
        navigate("/admin/products");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <AdminHeader />

        <div className="p-6 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Add New Product</h1>

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
              Product added successfully! Redirecting...
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
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Adding..." : "Add Product"}
            </button>     
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;