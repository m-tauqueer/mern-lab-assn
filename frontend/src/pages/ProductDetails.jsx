import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddToCartButton from "../components/AddToCartButton";
import useCustomer from "../hooks/useCustomer";
import { fetchProduct } from "../services/products";
import { formatPrice, stockLabel } from "../utils/formatProduct";

export default function ProductDetails() {
  const customer = useCustomer();
  const { id } = useParams();
  const [result, setResult] = useState({ id: "", product: null, status: "loading" });

  useEffect(() => {
    if (!customer) {
      return undefined;
    }

    let active = true;

    fetchProduct(id)
      .then((nextProduct) => {
        if (active) {
          setResult({ id, product: nextProduct, status: "ready" });
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        const responseStatus = error.response?.status;
        setResult({
          id,
          product: null,
          status: responseStatus === 400 || responseStatus === 404 ? "missing" : "error",
        });
      });

    return () => {
      active = false;
    };
  }, [customer, id]);

  if (!customer) {
    return (
      <main className="catalog">
        <p>Checking your account...</p>
      </main>
    );
  }

  const pending = result.id !== id;
  const product = pending ? null : result.product;
  const status = pending ? "loading" : result.status;

  if (status === "loading") {
    return (
      <main className="catalog">
        <p className="catalog-status">Loading products...</p>
      </main>
    );
  }

  if (status === "missing") {
    return (
      <main className="catalog">
        <p className="catalog-status">This product could not be found.</p>
        <Link to="/products">Back to products</Link>
      </main>
    );
  }

  if (status === "error" || !product) {
    return (
      <main className="catalog">
        <p className="catalog-status form-error" role="alert">
          Something went wrong while loading products.
        </p>
        <Link to="/products">Back to products</Link>
      </main>
    );
  }

  return (
    <main className="detail">
      <img src={product.image} alt={product.name} />
      <div>
        <Link to="/products">Back to products</Link>
        <h1>{product.name}</h1>
        <p className="product-category">{product.category}</p>
        <p className="price-tag">{formatPrice(product.price)}</p>
        <p className="detail-copy">{product.description}</p>
        <p className={product.stock === 0 ? "stock stock-empty" : "stock"}>{stockLabel(product.stock)}</p>
        <AddToCartButton product={product} className="button detail-cart" />
      </div>
    </main>
  );
}
