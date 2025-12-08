import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-lg h-screen p-5">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>

      <ul className="space-y-4">
        <li><Link to="/admin/dashboard" className="block p-2 hover:bg-gray-200 rounded">Dashboard</Link></li>
        <li><Link to="/admin/products" className="block p-2 hover:bg-gray-200 rounded">Products</Link></li>
        <li><Link to="/admin/add-product" className="block p-2 hover:bg-gray-200 rounded">Add Product</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
