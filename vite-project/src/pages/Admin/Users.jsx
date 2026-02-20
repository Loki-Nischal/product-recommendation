import { useEffect, useState, useCallback } from "react";
import Sidebar from "../../components/Admin/Sidebar";
import API from "../../api/api";
import {
  Search, Trash2, ChevronRight, X, ShoppingBag,
  Heart, Eye, ShoppingCart, RefreshCw, Users as UsersIcon,
} from "lucide-react";

const ROLE_FILTER = ["all", "customer", "admin"];

const STATUS_COLORS = {
  pending:    "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

function Avatar({ name, size = "md" }) {
  const colors = ["from-blue-400 to-indigo-500", "from-purple-400 to-pink-500", "from-green-400 to-teal-500", "from-orange-400 to-red-500", "from-yellow-400 to-orange-500"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white font-bold shrink-0`}>
      {name?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

function ProductGrid({ products, emptyLabel }) {
  if (!products?.length) return <p className="text-sm text-gray-400 py-4 text-center">{emptyLabel}</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {products.slice(0, 9).map((p) => (
        <div key={p._id} className="border rounded-lg p-2 bg-white hover:shadow text-xs">
          <img src={p.image} alt={p.name || p.title} className="w-full h-16 object-cover rounded mb-1"
            onError={(e) => (e.target.src = "https://via.placeholder.com/80?text=?")} />
          <p className="font-medium truncate text-gray-800">{p.name || p.title}</p>
          <p className="text-green-600 font-semibold">Rs {p.price}</p>
        </div>
      ))}
    </div>
  );
}

export default function Users() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [selected, setSelected]         = useState(null); // { user, orders }
  const [panelLoading, setPanelLoading] = useState(false);
  const [activeTab, setActiveTab]       = useState("overview");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.users || []);
    } catch (err) {
      console.error("Fetch users error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openPanel = async (user) => {
    setActiveTab("overview");
    setPanelLoading(true);
    setSelected({ user, orders: [] });
    try {
      const res = await API.get(`/admin/users/${user._id}`);
      setSelected({ user: res.user, orders: res.orders || [] });
    } catch (err) {
      console.error("Fetch user detail error", err);
    } finally {
      setPanelLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    setDeleting(true);
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSelected(null);
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "admin" ? u.role === "admin" : u.role !== "admin");
    return matchSearch && matchRole;
  });

  const TABS = ["overview", "activity", "orders"];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 pb-0 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Users</h1>
              <p className="text-gray-500 text-sm mt-0.5">{users.length} registered users</p>
            </div>
            <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:shadow text-sm font-medium text-gray-600 transition">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-2">
              {ROLE_FILTER.map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
                    roleFilter === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden px-6 pb-6 max-w-7xl mx-auto w-full gap-4">
          {/* User Grid */}
          <div className={`overflow-y-auto transition-all ${selected ? "w-1/2 hidden md:block" : "w-full"}`}>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow">
                <UsersIcon size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => openPanel(u)}
                    className={`bg-white rounded-xl p-4 shadow hover:shadow-lg cursor-pointer transition border-2 ${
                      selected?.user?._id === u._id ? "border-blue-500" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={u.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.role || "customer"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="font-bold text-gray-700">{u.orderStats?.count || 0}</p>
                        <p className="text-gray-400">Orders</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="font-bold text-gray-700">{u.likedProducts?.length || 0}</p>
                        <p className="text-gray-400">Liked</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="font-bold text-gray-700">Rs {(u.orderStats?.totalSpent || 0).toLocaleString()}</p>
                        <p className="text-gray-400">Spent</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Side Panel */}
          {selected && (
            <div className="w-full md:w-1/2 bg-white rounded-xl shadow overflow-y-auto flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center gap-3 p-5 border-b sticky top-0 bg-white z-10">
                <Avatar name={selected.user?.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-lg leading-tight">{selected.user?.name}</p>
                  <p className="text-sm text-gray-500">{selected.user?.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${selected.user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {selected.user?.role || "customer"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selected.user?.role !== "admin" && (
                    deleteConfirm === selected.user?._id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button onClick={() => deleteUser(selected.user._id)} disabled={deleting}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                          {deleting ? "…" : "Yes"}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(selected.user._id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    )
                  )}
                  <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {panelLoading ? (
                <div className="flex justify-center items-center flex-1 py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b px-5">
                    {TABS.map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition ${
                          activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 flex-1">
                    {/* ── Overview Tab ── */}
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Total Orders", value: selected.orders?.length || 0, icon: ShoppingBag, color: "text-indigo-600" },
                            { label: "Total Spent (paid)", value: `Rs ${selected.orders?.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}`, icon: ShoppingBag, color: "text-green-600" },
                            { label: "Liked Products", value: selected.user?.likedProducts?.length || 0, icon: Heart, color: "text-pink-500" },
                            { label: "Viewed Products", value: selected.user?.viewedProducts?.length || 0, icon: Eye, color: "text-blue-500" },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                              <Icon size={20} className={color} />
                              <div>
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="font-bold text-gray-800">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {selected.user?.bio && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Bio</p>
                            <p className="text-sm text-gray-700">{selected.user.bio}</p>
                          </div>
                        )}
                        {selected.user?.phone && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Phone</p>
                            <p className="text-sm text-gray-700">{selected.user.phone}</p>
                          </div>
                        )}
                        {selected.user?.lastSearchQueries?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">Recent Searches</p>
                            <div className="flex flex-wrap gap-2">
                              {selected.user.lastSearchQueries.slice(0, 10).map((q, i) => (
                                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{q}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">Member since {new Date(selected.user?.createdAt).toLocaleDateString()}</p>
                      </div>
                    )}

                    {/* ── Activity Tab ── */}
                    {activeTab === "activity" && (
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Heart size={14} className="text-pink-500" /> Liked Products
                          </p>
                          <ProductGrid products={selected.user?.likedProducts} emptyLabel="No liked products" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Eye size={14} className="text-blue-500" /> Recently Viewed
                          </p>
                          <ProductGrid products={selected.user?.viewedProducts} emptyLabel="No viewed products" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <ShoppingCart size={14} className="text-purple-500" /> Cart Products
                          </p>
                          <ProductGrid products={selected.user?.cartProducts} emptyLabel="Cart is empty" />
                        </div>
                      </div>
                    )}

                    {/* ── Orders Tab ── */}
                    {activeTab === "orders" && (
                      <div className="space-y-3">
                        {selected.orders?.length === 0 && (
                          <p className="text-center text-gray-400 py-8 text-sm">No orders placed yet</p>
                        )}
                        {selected.orders?.map((order) => (
                          <div key={order._id} className="bg-gray-50 rounded-xl p-3 border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs text-gray-400">#{order._id.slice(-8).toUpperCase()}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Rs {order.total?.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{order.items?.length || 0} item(s) · {order.paymentStatus}</p>
                              </div>
                              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
