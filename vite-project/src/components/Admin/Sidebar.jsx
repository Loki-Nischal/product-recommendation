import { Link, useLocation } from "react-router-dom";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/products",  label: "Products" },
  { to: "/admin/orders",   label: "Orders" },
  { to: "/admin/users",    label: "Users" },
  { to: "/admin/add-product", label: "Add Product" },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  return (
    <div className="w-64 shrink-0 bg-white shadow-lg sticky top-0 h-screen overflow-y-auto flex flex-col p-5">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">Admin Panel</h1>

      <ul className="space-y-1 flex-1">
        {NAV.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`block px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to))
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
