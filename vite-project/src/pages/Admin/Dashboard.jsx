import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { useAdminProducts } from "../../context/AdminProductContext";
import { BarChart3, Package, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { products, loading } = useAdminProducts();

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2);
  const lowStockProducts = products.filter((p) => (p.stock || 0) < 10).length;
  const averageRating = (
    products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts || 0
  ).toFixed(1);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <AdminHeader />

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Products</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{totalProducts}</p>
                    </div>
                    <Package className="text-blue-500" size={40} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Inventory Value</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">${totalValue}</p>
                    </div>
                    <TrendingUp className="text-green-500" size={40} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Low Stock Items</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">{lowStockProducts}</p>
                    </div>
                    <BarChart3 className="text-orange-500" size={40} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Avg Rating</p>
                      <p className="text-3xl font-bold text-yellow-500 mt-2">
                        {isNaN(averageRating) ? "N/A" : averageRating} ★
                      </p>
                    </div>
                    <div className="text-yellow-400 text-4xl">★</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate("/admin/add-product")}
                    className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    + Add New Product
                  </button>
                  <button
                    onClick={() => navigate("/admin/products")}
                    className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                  >
                    View All Products
                  </button>
                </div>
              </div>

              {/* Recent Products */}
              {products.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow">
                  <h2 className="text-2xl font-bold mb-4">Recent Products</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.slice(0, 6).map((p) => (
                      <div
                        key={p._id || p.id}
                        className="border rounded-lg p-4 hover:shadow-lg transition"
                      >
                        <img
                          src={p.image}
                          alt={p.name || p.title}
                          className="h-32 w-full object-cover rounded-lg mb-3"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/200?text=No+Image")}
                        />
                        <h3 className="font-bold text-gray-800 line-clamp-2">{p.name || p.title}</h3>
                        <p className="text-green-600 font-semibold mt-1">${p.price}</p>
                        <p className="text-xs text-gray-500">Stock: {p.stock || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;