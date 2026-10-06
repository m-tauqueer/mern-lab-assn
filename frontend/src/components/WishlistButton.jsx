import { useState } from "react";
import { emitWishlistChange } from "../services/wishlistEvents";
import { toggleWishlist } from "../services/wishlist";

export default function WishlistButton({ productId, saved, onSaved, className = "text-button wishlist-button" }) {
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  async function handleClick() {
    setPending(true);
    setNote("");

    try {
      const data = await toggleWishlist(productId);
      onSaved(productId, data.saved);
      emitWishlistChange();
    } catch (error) {
      setNote(error.response?.data?.message || "Could not update the wishlist.");
    } finally {
      setPending(false);
    }
  }

  let label = saved ? "♥ Remove from wishlist" : "♡ Add to wishlist";

  if (pending) {
    label = "Saving...";
  }

  return (
    <>
      <button className={className} type="button" disabled={pending} onClick={handleClick}>
        {label}
      </button>
      {note ? <p className="form-error">{note}</p> : null}
    </>
  );
}
