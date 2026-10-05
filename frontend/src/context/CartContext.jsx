import { useEffect, useMemo, useRef, useState } from "react";
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from "../services/cart";
import { cartItemCount, cartSubtotal } from "../utils/cartTotals";
import { CartContext as CartStore } from "./cart-context";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState("loading");
  const [pendingId, setPendingId] = useState(null);
  const refreshGeneration = useRef(0);

  function applyCart(nextCart) {
    refreshGeneration.current += 1;
    setCart(nextCart);
    setStatus("ready");
  }

  async function refresh({ showLoading = false } = {}) {
    const generation = ++refreshGeneration.current;

    if (showLoading) {
      setStatus("loading");
    }

    try {
      const data = await fetchCart();

      if (generation !== refreshGeneration.current) {
        return;
      }

      setCart(data.cart || []);
      setStatus("ready");
    } catch (error) {
      if (generation !== refreshGeneration.current) {
        return;
      }

      if (error.response?.status === 401) {
        setCart([]);
        setStatus("ready");
        return;
      }

      setStatus("error");
    }
  }

  useEffect(() => {
    const generation = ++refreshGeneration.current;

    fetchCart()
      .then((data) => {
        if (generation !== refreshGeneration.current) {
          return;
        }

        setCart(data.cart || []);
        setStatus("ready");
      })
      .catch((error) => {
        if (generation !== refreshGeneration.current) {
          return;
        }

        if (error.response?.status === 401) {
          setCart([]);
          setStatus("ready");
          return;
        }

        setStatus("error");
      });
  }, []);

  async function changeItem(productId, request) {
    setPendingId(productId);

    try {
      const data = await request();
      applyCart(data.cart || []);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || "Could not update the cart.",
      };
    } finally {
      setPendingId((current) => (current === productId ? null : current));
    }
  }

  async function addToCart(productId) {
    return changeItem(productId, () => addCartItem(productId));
  }

  async function updateQuantity(productId, quantity) {
    return changeItem(productId, () => updateCartItem(productId, quantity));
  }

  async function removeFromCart(productId) {
    return changeItem(productId, () => removeCartItem(productId));
  }

  function clearCart() {
    applyCart([]);
  }

  const value = useMemo(
    () => ({
      cart,
      status,
      pendingId,
      itemCount: cartItemCount(cart),
      subtotal: cartSubtotal(cart),
      refresh,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [cart, status, pendingId]
  );

  return <CartStore.Provider value={value}>{children}</CartStore.Provider>;
}
