import Sidebar from "../../components/Admin/Sidebar";
import AdminHeader from "../../components/Admin/AdminHeader";

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <AdminHeader />

        <div className="p-6">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>

          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-xl shadow">Total Products: 0</div>
            <div className="bg-white p-6 rounded-xl shadow">Users: 0</div>
            <div className="bg-white p-6 rounded-xl shadow">Orders: 0</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
