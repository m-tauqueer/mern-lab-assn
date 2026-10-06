import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useCustomer from "../hooks/useCustomer";
import { fetchWishlist, removeWishlistItem } from "../services/wishlist";
import { emitWishlistChange } from "../services/wishlistEvents";
import { formatPrice, stockLabel } from "../utils/formatProduct";

export default function Wishlist() {
  const customer = useCustomer();
  const [wishlist, setWishlist] = useState([]);
  const [status, setStatus] = useState("loading");
  const [pendingId, setPendingId] = useState("");
  const [note, setNote] = useState("");

  function applyWishlist(data) {
    const next = data.wishlist || [];
    setWishlist(next);
    setStatus(next.length === 0 ? "empty" : "ready");
  }

  function load() {
    setStatus("loading");
    fetchWishlist().then(applyWishlist).catch(() => setStatus("error"));
  }

  useEffect(() => {
    if (!customer) {
      return undefined;
    }

    let active = true;
    fetchWishlist()
      .then((data) => {
        if (active) {
          applyWishlist(data);
        }
      })
      .catch(() => {
        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, [customer]);

  async function remove(productId) {
    setPendingId(productId);
    setNote("");

    try {
      await removeWishlistItem(productId);
      const next = wishlist.filter((product) => product._id !== productId);
      setWishlist(next);
      setStatus(next.length === 0 ? "empty" : "ready");
      emitWishlistChange();
    } catch (error) {
      setNote(error.response?.data?.message || "Could not remove this product.");
    } finally {
      setPendingId("");
    }
  }

  if (!customer) {
    return (
      <main className="cart-page">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Wishlist</h1>
      {status === "loading" && <p className="catalog-status">Loading your wishlist...</p>}
      {status === "error" && (
        <>
          <p className="catalog-status form-error" role="alert">
            Unable to load wishlist.
          </p>
          <button className="button cart-action" type="button" onClick={load}>
            Try again
          </button>
        </>
      )}
      {status === "empty" && (
        <>
          <p className="customer-name">Your wishlist is empty.</p>
          <p className="lede">Start saving products you love.</p>
          <Link className="button cart-action" to="/products">
            Browse products
          </Link>
        </>
      )}
      {status === "ready" && (
        <ul className="cart-list">
          {wishlist.map((product) => (
            <li className="cart-item" key={product._id}>
              <img src={product.image} alt="" />
              <div className="cart-item-body">
                <h2>{product.name}</h2>
                <p className="product-category">{product.category}</p>
                <p className="price-tag">{formatPrice(product.price)}</p>
                <p className={product.stock === 0 ? "stock stock-empty" : "stock"}>{stockLabel(product.stock)}</p>
                <Link className="text-link" to={`/products/${product._id}`}>
                  View details
                </Link>
                <button
                  className="text-button"
                  type="button"
                  disabled={pendingId === product._id}
                  onClick={() => remove(product._id)}
                >
                  Remove from wishlist
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="form-error">{note}</p> : null}
    </main>
  );
}
