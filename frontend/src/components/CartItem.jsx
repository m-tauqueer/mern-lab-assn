import { useState } from "react";
import useCart from "../hooks/useCart";
import { formatPrice } from "../utils/formatProduct";

export default function CartItem({ item }) {
  const { pendingId, updateQuantity, removeFromCart } = useCart();
  const [note, setNote] = useState("");
  const { product, quantity } = item;
  const pending = pendingId === String(product._id);

  async function change(nextQuantity) {
    setNote("");
    const result = await updateQuantity(product._id, nextQuantity);

    if (!result.ok) {
      setNote(result.message);
    }
  }

  async function remove() {
    setNote("");
    const result = await removeFromCart(product._id);

    if (!result.ok) {
      setNote(result.message);
    }
  }

  return (
    <li className="cart-item">
      <img src={product.image} alt="" />
      <div className="cart-item-body">
        <h2>{product.name}</h2>
        <p className="price-tag">{formatPrice(product.price)}</p>
        <div className="qty">
          <button
            type="button"
            aria-label={`Decrease ${product.name}`}
            disabled={pending || quantity <= 1}
            onClick={() => change(quantity - 1)}
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            aria-label={`Increase ${product.name}`}
            disabled={pending || quantity >= product.stock}
            onClick={() => change(quantity + 1)}
          >
            +
          </button>
        </div>
        <button className="text-button" type="button" disabled={pending} onClick={remove}>
          Remove
        </button>
        {note ? <p className="form-error">{note}</p> : null}
      </div>
      <p className="line-total">{formatPrice(product.price * quantity)}</p>
    </li>
  );
}
