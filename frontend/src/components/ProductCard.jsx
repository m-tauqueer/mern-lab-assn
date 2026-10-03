import { Link } from "react-router-dom";
import { formatPrice, stockLabel } from "../utils/formatProduct";

export default function ProductCard({ product }) {
  return (
    <li className="product-card">
      <img src={product.image} alt={product.name} />
      <div className="product-card-body">
        <h2>{product.name}</h2>
        <p className="product-category">{product.category}</p>
        <p className="price-tag">{formatPrice(product.price)}</p>
        <p className={product.stock === 0 ? "stock stock-empty" : "stock"}>{stockLabel(product.stock)}</p>
        <Link className="button" to={`/products/${product._id}`}>
          View Details
        </Link>
      </div>
    </li>
  );
}
