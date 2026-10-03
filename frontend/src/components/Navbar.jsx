import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const inStore = location.pathname === "/home" || location.pathname.startsWith("/products");

  async function handleLogout() {
    try {
      await api.post("/customers/logout");
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="store-nav">
      <Link className="wordmark" to={inStore ? "/home" : "/login"}>
        ShopKart
      </Link>
      <nav className="nav-actions">
        {inStore ? (
          <>
            <Link className="nav-link" to="/products">
              Products
            </Link>
            <Link className="nav-link" to="/home">
              Account
            </Link>
            <button className="nav-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="nav-link" to="/login">
              Log in
            </Link>
            <Link className="nav-link" to="/register">
              Create account
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
