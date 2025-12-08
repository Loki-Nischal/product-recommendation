import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/AdminHeader";
import { useState } from "react";

const AddProduct = () => {
  const [form, setForm] = useState({ name: "", price: "", image: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Product added (backend needed)");
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <AdminHeader />

        <div className="p-6 max-w-lg">
          <h1 className="text-2xl font-bold mb-4">Add New Product</h1>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-6 rounded-xl">
            <input
              type="text"
              placeholder="Product Name"
              className="w-full border p-3 rounded-lg"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="number"
              placeholder="Product Price"
              className="w-full border p-3 rounded-lg"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <input
              type="text"
              placeholder="Image URL"
              className="w-full border p-3 rounded-lg"
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
              Add Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
