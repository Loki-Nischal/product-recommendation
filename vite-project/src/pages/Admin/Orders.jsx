import { useEffect, useState, useCallback } from "react";
import Sidebar from "../../components/Admin/Sidebar";
import API from "../../api/api";
import {
  Truck, CheckCircle, XCircle, ChevronDown, ChevronUp,
  RefreshCw, Package, MapPin, Phone, User,
} from "lucide-react";

const STATUS_COLORS = {
  pending:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped:    "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered:  "bg-green-100 text-green-800 border-green-200",
  cancelled:  "bg-red-100 text-red-800 border-red-200",
};

const PAYMENT_COLORS = {
  paid:     "text-green-700 bg-green-50",
  unpaid:   "text-yellow-700 bg-yellow-50",
  failed:   "text-red-700 bg-red-50",
  refunded: "text-gray-700 bg-gray-100",
};

const FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");
  const [expanded, setExpanded]     = useState(null);
  const [confirming, setConfirming] = useState({});
  const [actionBusy, setActionBusy] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders/admin/all");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Fetch orders error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const requestAction = (orderId, newStatus) =>
    setConfirming((prev) => ({ ...prev, [orderId]: newStatus }));

  const cancelAction = (orderId) =>
    setConfirming((prev) => { const n = { ...prev }; delete n[orderId]; return n; });

  const confirmAction = async (orderId, newStatus) => {
    setActionBusy((prev) => ({ ...prev, [orderId]: true }));
    cancelAction(orderId);
    try {
      const res = await API.put(`/orders/admin/update-status/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: res.data?.status || newStatus } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status");
    } finally {
      setActionBusy((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts  = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? orders.length : orders.filter((o) => o.status === f).length;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
            <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:shadow text-sm font-medium text-gray-600 transition">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                <span className="capitalize">{f}</span>
                {counts[f] > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {counts[f]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Loading orders…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No {filter !== "all" ? filter : ""} orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((order) => {
                const isOpen  = expanded === order._id;
                const busy    = !!actionBusy[order._id];
                const pending = confirming[order._id];

                return (
                  <div key={order._id} className="bg-white rounded-xl shadow overflow-hidden">
                    {/* Order Row */}
                    <div
                      className="flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setExpanded(isOpen ? null : order._id)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-gray-400">#{order._id.slice(-8).toUpperCase()}</p>
                        <p className="font-semibold text-gray-800 truncate">
                          {order.user?.name || order.deliveryInfo?.fullName || "Guest"}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-gray-700">{order.items?.length || 0}</p>
                        <p className="text-xs text-gray-400">items</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">Rs {order.total?.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                          {order.paymentStatus}
                        </span>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                        {order.status}
                      </span>

                      <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        {pending ? (
                          <>
                            <span className="text-xs text-gray-600 self-center">Confirm?</span>
                            <button onClick={() => confirmAction(order._id, pending)} disabled={busy}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                              Yes
                            </button>
                            <button onClick={() => cancelAction(order._id)} disabled={busy}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 disabled:opacity-50">
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            {(order.status === "pending" || order.status === "processing") && (
                              <>
                                <button disabled={busy} onClick={() => requestAction(order._id, "shipped")}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                                  <Truck size={12} /> Ship
                                </button>
                                <button disabled={busy} onClick={() => requestAction(order._id, "cancelled")}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium">
                                  <XCircle size={12} /> Cancel
                                </button>
                              </>
                            )}
                            {order.status === "shipped" && (
                              <button disabled={busy} onClick={() => requestAction(order._id, "delivered")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
                                <CheckCircle size={12} /> Mark Delivered
                              </button>
                            )}
                            {(order.status === "delivered" || order.status === "cancelled") && (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </>
                        )}
                        {busy && <RefreshCw size={16} className="animate-spin text-gray-400 self-center" />}
                      </div>

                      <div className="text-gray-400">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Detail Panel */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Items */}
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Package size={16} /> Order Items
                          </h3>
                          <div className="space-y-2">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm">
                                <img
                                  src={item.image || item.product?.image}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg border"
                                  onError={(e) => (e.target.src = "https://via.placeholder.com/48?text=?")}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity} × Rs {item.price?.toLocaleString()}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-700 shrink-0">
                                  Rs {((item.quantity || 1) * (item.price || 0)).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 bg-white rounded-lg p-3 shadow-sm text-sm space-y-1">
                            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs {order.subtotal?.toLocaleString()}</span></div>
                            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>Rs {order.shippingFee?.toLocaleString()}</span></div>
                            <div className="flex justify-between font-bold text-gray-800 border-t pt-1 mt-1"><span>Total</span><span>Rs {order.total?.toLocaleString()}</span></div>
                            <div className="flex justify-between text-xs text-gray-500 pt-1">
                              <span>Payment</span>
                              <span className="capitalize">{order.paymentMethod} — {order.paymentStatus}</span>
                            </div>
                            {order.transactionId && (
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Txn ID</span><span className="font-mono">{order.transactionId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Customer + Delivery */}
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><User size={16} /> Customer</h3>
                            <p className="text-sm font-medium text-gray-800">{order.user?.name || "—"}</p>
                            <p className="text-xs text-gray-500">{order.user?.email || "—"}</p>
                          </div>
                          {order.deliveryInfo && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><MapPin size={16} /> Delivery Address</h3>
                              <p className="text-sm font-semibold text-gray-800">{order.deliveryInfo.fullName}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{order.deliveryInfo.address}</p>
                              <p className="text-xs text-gray-600">
                                {[order.deliveryInfo.city, order.deliveryInfo.region].filter(Boolean).join(", ")}
                              </p>
                              {order.deliveryInfo.phoneNumber && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <Phone size={11} /> {order.deliveryInfo.phoneNumber}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
