import { useState } from "react";
import useCart from "../hooks/useCart";

export default function AddToCartButton({ product, className }) {
  const { cart, pendingId, addToCart } = useCart();
  const [note, setNote] = useState("");
  const item = cart.find((entry) => String(entry.product._id) === String(product._id));
  const adding = pendingId === product._id;
  const blocked = product.stock === 0 || (item ? item.quantity >= product.stock : false);

  async function handleClick() {
    setNote("");
    const result = await addToCart(product._id);

    if (!result.ok) {
      setNote(result.message);
    }
  }

  let label = "Add to cart";

  if (adding) {
    label = "Adding...";
  } else if (item) {
    label = "Add another";
  }

  return (
    <>
      <button className={className} type="button" disabled={adding || blocked} onClick={handleClick}>
        {label}
      </button>
      {note ? <p className="form-error">{note}</p> : null}
    </>
  );
}
