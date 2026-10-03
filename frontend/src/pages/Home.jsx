import { Link } from "react-router-dom";
import useCustomer from "../hooks/useCustomer";

export default function Home() {
  const customer = useCustomer();

  if (!customer) {
    return (
      <main className="slip">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="slip">
      <h1>Welcome</h1>
      <p className="customer-name">{customer.fullName}</p>
      <dl>
        <dt>Email</dt>
        <dd>{customer.email}</dd>
        <dt>Phone</dt>
        <dd>{customer.phone}</dd>
      </dl>
      <Link className="button home-shop" to="/products">
        Browse products
      </Link>
    </main>
  );
}
