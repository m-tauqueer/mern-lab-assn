import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get("/customers/me")
      .then((response) => {
        if (active) {
          setCustomer(response.data);
        }
      })
      .catch(() => {
        if (active) {
          navigate("/login", { replace: true });
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

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
    </main>
  );
}
