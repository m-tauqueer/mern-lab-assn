import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useCustomer from "../hooks/useCustomer";
import { fetchOrder } from "../services/orders";
import { formatPrice } from "../utils/formatProduct";

export default function OrderDetails({ placed = false }) {
  const customer = useCustomer();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!customer) {
      return undefined;
    }

    let active = true;
    fetchOrder(id)
      .then((next) => {
        if (active) {
          setOrder(next);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setStatus(error.response?.status === 400 || error.response?.status === 404 ? "missing" : "error");
      });

    return () => {
      active = false;
    };
  }, [customer, id]);

  if (!customer || status === "loading") {
    return (
      <main className="cart-page">
        <p>{customer ? "Loading your order..." : "Checking your account..."}</p>
      </main>
    );
  }

  if (status === "missing") {
    return (
      <main className="cart-page">
        <p className="catalog-status">This order could not be found.</p>
        <Link to="/orders">Back to orders</Link>
      </main>
    );
  }

  if (status === "error" || !order) {
    return (
      <main className="cart-page">
        <p className="catalog-status form-error" role="alert">
          Unable to load your orders.
        </p>
        <Link to="/orders">Back to orders</Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      {placed ? <p className="customer-name">Order placed</p> : null}
      <h1>{placed ? "Order placed successfully" : "Order details"}</h1>
      <p>Order ID: {order._id}</p>
      <p>
        Total: <strong>{formatPrice(order.totalAmount)}</strong>
      </p>
      <p>Status: {order.status}</p>
      <ul className="summary-lines">
        {order.items.map((item) => (
          <li key={`${item.product}-${item.name}`}>
            <span>
              {item.name} × {item.quantity}
            </span>
            <strong>{formatPrice(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>
      <p>
        {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{" "}
        {order.shippingAddress.state} {order.shippingAddress.pincode}
      </p>
      <div className="summary-actions">
        <Link className="button cart-action" to="/orders">
          View my orders
        </Link>
        <Link className="text-link" to="/products">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
