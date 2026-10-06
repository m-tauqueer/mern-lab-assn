import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Field from "../components/Field";
import useCart from "../hooks/useCart";
import useCustomer from "../hooks/useCustomer";
import { createPaymentOrder, verifyPayment } from "../services/orders";
import { loadRazorpay } from "../services/razorpayCheckout";
import { formatPrice } from "../utils/formatProduct";
import { validateShipping } from "../utils/validateShipping";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Checkout() {
  const customer = useCustomer();
  const { cart, status, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState(emptyAddress);
  const [filledFromAccount, setFilledFromAccount] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (customer && !filledFromAccount) {
    setFilledFromAccount(true);
    setAddress((current) => ({
      ...current,
      fullName: current.fullName || customer.fullName,
      phone: current.phone || customer.phone,
    }));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateShipping(address);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payment = await createPaymentOrder({
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine1: address.addressLine1.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
      });
      const loaded = await loadRazorpay();

      if (!loaded || !window.Razorpay) {
        setFormError("Payment could not be opened. Try again.");
        return;
      }

      const checkout = new window.Razorpay({
        key: payment.key,
        amount: payment.amount,
        currency: payment.currency,
        name: "ShopKart",
        description: "ShopKart order",
        order_id: payment.razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              shopKartOrderId: payment.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            navigate(`/order-success/${payment.shopKartOrderId}`);
          } catch (error) {
            setFormError(error.response?.data?.message || "Payment could not be verified.");
            setSubmitting(false);
          }
        },
        prefill: {
          name: address.fullName.trim(),
          contact: address.phone.trim(),
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      checkout.on("payment.failed", () => {
        setFormError("Payment was not completed. Your cart is still saved.");
        setSubmitting(false);
      });
      checkout.open();
    } catch (error) {
      setFormError(error.response?.data?.message || "Could not start checkout.");
      setSubmitting(false);
    }
  }

  if (!customer || status === "loading") {
    return (
      <main className="cart-page">
        <p>{customer ? "Loading your cart..." : "Checking your account..."}</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <h1>Checkout</h1>
        <p className="lede">Your cart is empty.</p>
        <Link className="button cart-action" to="/products">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Checkout</h1>
      <div className="cart-layout">
        <form className="order-summary" onSubmit={handleSubmit} noValidate>
          <h2>Shipping details</h2>
          {formError ? <p className="form-error">{formError}</p> : null}
          <Field label="Full name" name="fullName" value={address.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name" />
          <Field label="Phone" name="phone" value={address.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" />
          <Field label="Address" name="addressLine1" value={address.addressLine1} onChange={handleChange} error={errors.addressLine1} autoComplete="street-address" />
          <Field label="City" name="city" value={address.city} onChange={handleChange} error={errors.city} autoComplete="address-level2" />
          <Field label="State" name="state" value={address.state} onChange={handleChange} error={errors.state} autoComplete="address-level1" />
          <Field label="Pincode" name="pincode" value={address.pincode} onChange={handleChange} error={errors.pincode} autoComplete="postal-code" />
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Opening payment..." : "Place order"}
          </button>
        </form>
        <aside className="order-summary">
          <h2>Order summary</h2>
          <ul className="summary-lines">
            {cart.map((item) => (
              <li key={item.product._id}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <strong>{formatPrice(item.product.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
          <p>
            Total: <strong>{formatPrice(subtotal)}</strong>
          </p>
        </aside>
      </div>
    </main>
  );
}
