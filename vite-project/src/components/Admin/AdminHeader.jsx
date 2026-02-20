import { useAdmin } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

const AdminHeader = () => {
  const { logout, admin } = useAdmin();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center bg-white p-4 shadow">
      <h2 className="text-xl font-semibold">Welcome, {admin?.email}</h2>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={async () => {
          try {
            // notify server to clear admin session
            await API.post('/admin/logout');
          } catch (e) {
            // ignore server errors
          }
          logout();
          navigate("/admin/login");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default AdminHeader;
