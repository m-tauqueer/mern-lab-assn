import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useCart from "../hooks/useCart";
import api from "../services/api";
import { fetchWishlist } from "../services/wishlist";
import { onWishlistChange } from "../services/wishlistEvents";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount, status, clearCart } = useCart();
  const [wishlistCount, setWishlistCount] = useState(null);
  const inStore = ["/home", "/cart", "/checkout", "/wishlist", "/orders"].includes(location.pathname) ||
    location.pathname.startsWith("/products") ||
    location.pathname.startsWith("/order");

  useEffect(() => {
    if (!inStore) {
      return undefined;
    }

    let active = true;

    function loadWishlistCount() {
      fetchWishlist()
        .then((data) => {
          if (active) {
            setWishlistCount(data.count);
          }
        })
        .catch(() => {
          if (active) {
            setWishlistCount(null);
          }
        });
    }

    loadWishlistCount();
    const unsubscribe = onWishlistChange(loadWishlistCount);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [inStore, location.pathname]);

  async function handleLogout() {
    try {
      await api.post("/customers/logout");
    } finally {
      clearCart();
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
            <Link className="nav-link" to="/wishlist">
              {wishlistCount === null ? "Wishlist" : `Wishlist (${wishlistCount})`}
            </Link>
            <Link className="nav-link" to="/orders">
              Orders
            </Link>
            <Link className="nav-link" to="/cart">
              {status === "ready" ? `Cart (${itemCount})` : "Cart"}
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
