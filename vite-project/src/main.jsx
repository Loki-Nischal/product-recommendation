import './index.css';

import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
       <AuthProvider>

       <BrowserRouter>
          <App />
       </BrowserRouter>

      </AuthProvider>
    </AdminAuthProvider>
   
  </React.StrictMode>
  
);
