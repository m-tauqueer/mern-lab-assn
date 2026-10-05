import { Link } from "react-router-dom";
import useCustomer from "../hooks/useCustomer";

export default function Checkout() {
  const customer = useCustomer();

  if (!customer) {
    return (
      <main className="cart-page">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Checkout</h1>
      <p className="lede">Shipping and payment are the next step. Your cart stays saved until then.</p>
      <Link className="button cart-action" to="/cart">
        Back to cart
      </Link>
    </main>
  );
}
