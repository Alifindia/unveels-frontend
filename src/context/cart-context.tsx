import React, { createContext, useContext, useState, useEffect } from "react";
import { addProductToCart } from "../api/addProductToCart";

// Tipe untuk item di keranjang
export interface CartItem {
  item_id: number;
  sku: string;
  qty: number;
  name: string;
  price: number;
}

// Tipe untuk CartContext
interface CartContextType {
  guestCartId: string | null;
  setGuestCartId: (id: string | null) => void;
  cartItemCount: number;
  updateCartItemCount: () => void;
  addItemToCart: (sku: string) => void;
}

// CartContext
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider untuk CartContext
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [guestCartId, setGuestCartId] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState<number>(0);

  // Fungsi untuk mengambil data item di cart
  const getCartItems = async (guestCartId: string): Promise<CartItem[]> => {
    const response = await fetch(`/rest/V1/guest-carts/${guestCartId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cart items");
    }

    const data = await response.json();
    return data.items || [];
  };

  // Fungsi untuk memperbarui jumlah item di cart
  const updateCartItemCount = async () => {
    if (guestCartId) {
      try {
        const cartItems = await getCartItems(guestCartId);
        const itemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
        setCartItemCount(itemCount);
        console.log(cartItemCount);
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
      }
    }
  };

  // Fungsi untuk menambahkan item ke cart
  const addItemToCart = async (sku: string) => {
    if (!guestCartId) {
      console.log("Guest Cart ID is not available. Please try again.");
      return;
    }

    try {
      await addProductToCart(guestCartId, sku, 1);
      console.log(`Product ${sku} added to cart!`);
      updateCartItemCount();
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  // Mengupdate jumlah item di cart ketika guestCartId berubah
  useEffect(() => {
    if (guestCartId) {
      updateCartItemCount();
    }
  }, [guestCartId]);

  return (
    <CartContext.Provider
      value={{
        guestCartId,
        setGuestCartId,
        cartItemCount,
        updateCartItemCount,
        addItemToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook untuk mengakses CartContext
export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
