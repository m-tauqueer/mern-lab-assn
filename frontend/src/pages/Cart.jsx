import { Link } from "react-router-dom";
import CartItem from "../components/CartItem";
import useCart from "../hooks/useCart";
import useCustomer from "../hooks/useCustomer";
import { formatPrice } from "../utils/formatProduct";

export default function Cart() {
  const customer = useCustomer();
  const { cart, status, itemCount, subtotal, refresh } = useCart();

  if (!customer) {
    return (
      <main className="cart-page">
        <p>Checking your account...</p>
      </main>
    );
  }

  if (status === "loading") {
    return (
      <main className="cart-page">
        <h1>My cart</h1>
        <p className="catalog-status">Loading your cart...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="cart-page">
        <h1>My cart</h1>
        <p className="catalog-status form-error" role="alert">
          Unable to load your cart.
        </p>
        <button className="button cart-action" type="button" onClick={() => refresh({ showLoading: true })}>
          Try again
        </button>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <h1>My cart</h1>
        <p className="customer-name">Your cart is empty.</p>
        <p className="lede">Looks like you haven't added anything yet.</p>
        <Link className="button cart-action" to="/products">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>My cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {cart.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </ul>
        <aside className="order-summary">
          <h2>Order summary</h2>
          <p>
            Items: <strong>{itemCount}</strong>
          </p>
          <p>
            Subtotal: <strong>{formatPrice(subtotal)}</strong>
          </p>
          <Link className="button" to="/checkout">
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}
