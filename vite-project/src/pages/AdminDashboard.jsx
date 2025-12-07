import React from "react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h2 className="text-xl font-bold text-blue-600 mb-6">Admin Panel</h2>

        <ul className="space-y-4">
          <li className="font-medium hover:text-blue-600 cursor-pointer">Dashboard</li>
          <li className="font-medium hover:text-blue-600 cursor-pointer">Products</li>
          <li className="font-medium hover:text-blue-600 cursor-pointer">Users</li>
          <li className="font-medium hover:text-blue-600 cursor-pointer">Orders</li>
          <li className="font-medium hover:text-blue-600 cursor-pointer">Settings</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold">Total Users</h2>
            <p className="text-3xl font-bold mt-2">1,245</p>
          </div>

          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold">Total Orders</h2>
            <p className="text-3xl font-bold mt-2">540</p>
          </div>

          <div className="p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold">Revenue</h2>
            <p className="text-3xl font-bold mt-2">$12,400</p>
          </div>
        </div>

        {/* Placeholder for future charts, tables */}
        <div className="p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <p className="text-gray-500">Charts or tables will go here...</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
