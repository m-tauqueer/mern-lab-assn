import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useCustomer from "../hooks/useCustomer";
import { fetchOrders } from "../services/orders";
import { formatPrice } from "../utils/formatProduct";

export default function Orders() {
  const customer = useCustomer();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");

  function applyOrders(data) {
    const next = data.orders || [];
    setOrders(next);
    setStatus(next.length === 0 ? "empty" : "ready");
  }

  function load() {
    setStatus("loading");
    fetchOrders().then(applyOrders).catch(() => setStatus("error"));
  }

  useEffect(() => {
    if (!customer) {
      return undefined;
    }

    let active = true;
    fetchOrders()
      .then((data) => {
        if (active) {
          applyOrders(data);
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

  if (!customer) {
    return (
      <main className="cart-page">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>My orders</h1>
      {status === "loading" && <p className="catalog-status">Loading your orders...</p>}
      {status === "error" && (
        <>
          <p className="catalog-status form-error" role="alert">
            Unable to load your orders.
          </p>
          <button className="button cart-action" type="button" onClick={load}>
            Try again
          </button>
        </>
      )}
      {status === "empty" && (
        <>
          <p className="lede">You have not placed any orders yet.</p>
          <Link className="button cart-action" to="/products">
            Start shopping
          </Link>
        </>
      )}
      {status === "ready" && (
        <ul className="cart-list">
          {orders.map((order) => (
            <li className="order-summary" key={order._id}>
              <h2>Order {order._id}</h2>
              <p>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              <ul className="summary-lines">
                {order.items.map((item) => (
                  <li key={`${order._id}-${item.product}`}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
              <p>
                Total: <strong>{formatPrice(order.totalAmount)}</strong>
              </p>
              <p>Status: {order.status}</p>
              <Link className="text-link" to={`/orders/${order._id}`}>
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
