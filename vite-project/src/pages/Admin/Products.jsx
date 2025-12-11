import React, { useState,useEffect} from "react";
import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { useAdminProducts } from "../../context/AdminProductContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";


const Products = () => {
  const navigate = useNavigate();
  const { products, loading, error, deleteProduct, fetchProducts } = useAdminProducts();
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    // This ensures that whenever you land on this page, it grabs the latest list
    fetchProducts(); 
  }, []);
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setDeleting(productId);
    try {
      await deleteProduct(productId);
      alert("Product deleted successfully!");
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <AdminHeader />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Products</h1>
            <button
              onClick={() => navigate("/admin/add-product")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add New Product
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-gray-500 text-lg">No products yet.</p>
              <button
                onClick={() => navigate("/admin/add-product")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white shadow rounded-xl">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left font-semibold">Product Name</th>
                    <th className="p-4 text-left font-semibold">Category</th>
                    <th className="p-4 text-left font-semibold">Price</th>
                    <th className="p-4 text-left font-semibold">Stock</th>
                    <th className="p-4 text-left font-semibold">Rating</th>
                    <th className="p-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id || p.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name || p.title}
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/40?text=No+Image")}
                          />
                          <span className="font-medium">{p.name || p.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{p.category || "N/A"}</td>
                      <td className="p-4 font-semibold text-green-600">${p.price}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            p.stock > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.stock || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {p.rating || 0}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(p._id || p.id)}
                          disabled={deleting === p._id || deleting === p.id}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                            deleting === p._id || deleting === p.id
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
                        >
                          <Trash2 size={16} />
                          {deleting === p._id || deleting === p.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;