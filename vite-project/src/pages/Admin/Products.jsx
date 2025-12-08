import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { useState } from "react";

const Products = () => {
  const [products, setProducts] = useState([
    { id: 1, name: "iPhone 14", price: 1200 },
    { id: 2, name: "Laptop", price: 900 },
  ]);

  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <AdminHeader />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Manage Products</h1>

          <table className="w-full bg-white shadow rounded-xl overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">${p.price}</td>
                  <td className="p-3">
                    <button
                      className="bg-red-500 text-white px-4 py-1 rounded"
                      onClick={() => deleteProduct(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;
