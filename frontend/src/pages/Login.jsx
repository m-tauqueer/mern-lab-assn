import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Field from "../components/Field";
import useCart from "../hooks/useCart";
import api from "../services/api";
import { validateLogin } from "../utils/validateCustomer";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useCart();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/customers/login", {
        email: form.email.trim(),
        password: form.password,
      });
      await refresh();
      navigate("/home");
    } catch (error) {
      if (error.response?.status === 401) {
        setFormError("Invalid Credentials");
      } else {
        setFormError("Could not log in. Check that the API is running.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p>Sign in to see the name, email, and phone on your account.</p>
      </section>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1>Log in</h1>
        <p className="lede">Use the email and password from your account.</p>
        {location.state?.registered ? (
          <p className="form-note">Account created. Log in to continue.</p>
        ) : null}
        {formError ? <p className="form-error">{formError}</p> : null}
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
        <p className="form-note">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
