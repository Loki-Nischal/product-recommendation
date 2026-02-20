import { useEffect, useState } from "react";
import Sidebar from "../../components/Admin/Sidebar";
import { useAdminProducts } from "../../context/AdminProductContext";
import {
  Package, TrendingUp, Plus, Users,
  ShoppingCart, CheckCircle, XCircle, Truck, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

const STATUS_COLORS = {
  pending:    "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-lg transition">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold mt-2 ${color}`}>{value}</p>
      </div>
      <Icon className={`${color} shrink-0`} size={36} />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { products, loading: prodLoading } = useAdminProducts();

  const [orders, setOrders]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, statsRes, usersRes] = await Promise.all([
          API.get("/orders/admin/all"),
          API.get("/admin/stats"),
          API.get("/admin/users"),
        ]);
        setOrders(ordersRes.data || []);
        setStats(statsRes.stats || null);
        setRecentUsers((usersRes.users || []).slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await API.put(`/orders/admin/update-status/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: res.data?.status || newStatus } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const [alertsOpen, setAlertsOpen] = useState(true);

  const totalProducts  = products.length;
  const totalValue     = products.reduce((s, p) => s + (p.price || 0), 0).toFixed(2);
  const outOfStock     = products.filter((p) => (p.stock || 0) === 0);
  const lowStockItems  = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10);
  const lowStock       = outOfStock.length + lowStockItems.length;

  const loading = prodLoading || dataLoading;
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto min-w-0">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500">Loading dashboard…</p>
            </div>
          ) : (
            <>
              {/* ── Low Stock Alerts ── */}
              {lowStock > 0 && (
                <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setAlertsOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left"
                  >
                    <div className="flex items-center gap-2 font-semibold text-orange-800">
                      <AlertTriangle size={18} className="shrink-0" />
                      <span>
                        {outOfStock.length > 0 && (
                          <span className="text-red-700">{outOfStock.length} out-of-stock</span>
                        )}
                        {outOfStock.length > 0 && lowStockItems.length > 0 && <span className="text-orange-600"> · </span>}
                        {lowStockItems.length > 0 && (
                          <span className="text-orange-700">{lowStockItems.length} low stock</span>
                        )}
                        <span className="font-normal text-orange-700"> — immediate attention needed</span>
                      </span>
                    </div>
                    {alertsOpen ? <ChevronUp size={16} className="text-orange-600" /> : <ChevronDown size={16} className="text-orange-600" />}
                  </button>

                  {alertsOpen && (
                    <div className="border-t border-orange-200 px-5 py-3 space-y-2 max-h-64 overflow-y-auto">
                      {outOfStock.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => navigate(`/admin/edit-product/${p._id}`)}
                          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-100 transition"
                        >
                          <img
                            src={p.image}
                            alt={p.name || p.title}
                            className="w-9 h-9 rounded object-cover border border-red-200 shrink-0"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/36?text=?")}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-800 truncate">{p.name || p.title}</p>
                            <p className="text-xs text-red-500">Rs {p.price}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">OUT OF STOCK</span>
                        </div>
                      ))}
                      {lowStockItems.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => navigate(`/admin/edit-product/${p._id}`)}
                          className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-orange-100 transition"
                        >
                          <img
                            src={p.image}
                            alt={p.name || p.title}
                            className="w-9 h-9 rounded object-cover border border-orange-200 shrink-0"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/36?text=?")}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-orange-800 truncate">{p.name || p.title}</p>
                            <p className="text-xs text-orange-500">Rs {p.price}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">{p.stock} left</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Product + Order Stats ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
                <StatCard label="Products"       value={totalProducts}                          icon={Package}     color="text-blue-600" />
                <StatCard label="Inventory Value" value={`Rs ${parseFloat(totalValue).toLocaleString()}`} icon={TrendingUp}   color="text-green-600" />
                <StatCard label="Low Stock"       value={<span className={lowStock > 0 ? "text-orange-600" : "text-gray-700"}>{lowStock}</span>} icon={AlertTriangle} color={lowStock > 0 ? "text-orange-500" : "text-gray-400"} />
                <StatCard label="Total Orders"    value={stats?.totalOrders ?? orders.length}    icon={ShoppingCart} color="text-purple-600" />
                <StatCard label="Revenue (paid)"  value={`Rs ${(stats?.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} color="text-emerald-600" />
                <StatCard label="Customers"       value={stats?.userCount ?? "—"}                icon={Users}       color="text-sky-600" />
              </div>

              {/* ── Order Status Breakdown ── */}
              {stats?.byStatus && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className={`rounded-xl px-4 py-3 flex flex-col items-center shadow ${STATUS_COLORS[status]}`}>
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs font-medium capitalize mt-1">{status}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* ── Recent Orders ── */}
                <div className="xl:col-span-2 bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                    <button onClick={() => navigate("/admin/orders")} className="text-blue-600 text-sm hover:underline">
                      View all →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 pr-3">Customer</th>
                          <th className="pb-2 pr-3">Total</th>
                          <th className="pb-2 pr-3">Status</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 pr-3">
                              <p className="font-medium text-gray-800 truncate max-w-[120px]">
                                {order.user?.name || order.deliveryInfo?.fullName || "Guest"}
                              </p>
                              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="py-2 pr-3 font-semibold text-gray-700">Rs {order.total?.toLocaleString()}</td>
                            <td className="py-2 pr-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2">
                              <div className="flex gap-1 flex-wrap">
                                {order.status === "pending" && (
                                  <button
                                    disabled={actionLoading[order._id]}
                                    onClick={() => updateOrderStatus(order._id, "shipped")}
                                    className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    <Truck size={12} /> Ship
                                  </button>
                                )}
                                {order.status === "shipped" && (
                                  <button
                                    disabled={actionLoading[order._id]}
                                    onClick={() => updateOrderStatus(order._id, "delivered")}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    <CheckCircle size={12} /> Delivered
                                  </button>
                                )}
                                {["pending", "processing"].includes(order.status) && (
                                  <button
                                    disabled={actionLoading[order._id]}
                                    onClick={() => updateOrderStatus(order._id, "cancelled")}
                                    className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 disabled:opacity-50"
                                  >
                                    <XCircle size={12} /> Cancel
                                  </button>
                                )}
                                {order.status === "processing" && (
                                  <button
                                    disabled={actionLoading[order._id]}
                                    onClick={() => updateOrderStatus(order._id, "shipped")}
                                    className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    <Truck size={12} /> Ship
                                  </button>
                                )}
                                {(order.status === "delivered" || order.status === "cancelled") && (
                                  <span className="text-xs text-gray-400 italic">No actions</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {recentOrders.length === 0 && (
                          <tr><td colSpan={4} className="py-6 text-center text-gray-400">No orders yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Recent Users ── */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Customers</h2>
                    <button onClick={() => navigate("/admin/users")} className="text-blue-600 text-sm hover:underline">
                      View all →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentUsers.map((u) => (
                      <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate("/admin/users")}>
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <span className="ml-auto text-xs text-gray-400 shrink-0">{u.orderStats?.count || 0} orders</span>
                      </div>
                    ))}
                    {recentUsers.length === 0 && (
                      <p className="text-center text-gray-400 py-6 text-sm">No customers yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Quick Actions ── */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow mb-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => navigate("/admin/add-product")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold bg-linear-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow transition">
                    <Plus size={16} /> Add Product
                  </button>
                  <button onClick={() => navigate("/admin/products")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold border border-gray-200 hover:shadow transition text-gray-700">
                    <Package size={16} /> All Products
                  </button>
                  <button onClick={() => navigate("/admin/orders")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold border border-gray-200 hover:shadow transition text-gray-700">
                    <ShoppingCart size={16} /> All Orders
                  </button>
                  <button onClick={() => navigate("/admin/users")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold border border-gray-200 hover:shadow transition text-gray-700">
                    <Users size={16} /> All Users
                  </button>
                </div>
              </div>

              {/* ── Recent Products ── */}
              {products.length > 0 && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Products</h2>
                    <button onClick={() => navigate("/admin/products")} className="text-blue-600 text-sm hover:underline">View all →</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {products.slice(0, 6).map((p) => (
                      <div key={p._id || p.id} className="border rounded-lg p-3 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/admin/edit-product/${p._id}`)}>
                        <img src={p.image} alt={p.name || p.title}
                          className="h-24 w-full object-cover rounded-lg mb-2"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/200?text=No+Image")} />
                        <p className="font-semibold text-gray-800 text-xs line-clamp-2">{p.name || p.title}</p>
                        <p className="text-green-600 font-bold text-sm mt-1">Rs {p.price}</p>
                        <p className="text-xs text-gray-400">Stock: {p.stock || 0}</p>
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