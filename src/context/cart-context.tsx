import React, { createContext, useContext, useState, useEffect } from "react";

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
  summaryCount: number;
  updateCartItemCount: () => void;
  addItemToCart: (id: string, url: string) => void;
  reloadMiniCart: () => void;
}

// CartContext
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider untuk CartContext
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [guestCartId, setGuestCartId] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [summaryCount, setSummaryCount] = useState<number>(0); // Initialize with 0

  // Fungsi untuk memperbarui jumlah item di cart
  const updateCartItemCount = async () => {
    if (guestCartId) {
      try {
        // Memanggil endpoint untuk mendapatkan item di cart
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
        const itemCount = data.items.reduce(
          (acc: number, item: CartItem) => acc + item.qty,
          0,
        );
        setCartItemCount(itemCount);
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
      }
    }
  };

  // Fungsi untuk mendapatkan form_key dari cookie
  const getFormKey = () => {
    const name = "form_key=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1); // Trim any leading spaces
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
  };

  // Fungsi untuk menambahkan item ke cart
  const addItemToCart = async (id: string, url: string) => {
    try {
      const formKey = getFormKey();
      const encodedUrl = btoa(url); // Enkode URL

      const actionUrl = `/en/checkout/cart/add/uenc/${encodedUrl}/product/${id}/`;

      const formData = new FormData();
      formData.append("product", id);
      formData.append("selected_configurable_option", "");
      formData.append("related_product", "");
      formData.append("item", id);
      formData.append("form_key", formKey);
      formData.append("qty", "1");

      const response = await fetch(actionUrl, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to add product to cart.");
      }

      // Memperbarui jumlah item setelah penambahan produk
      await updateCartItemCount();

      // Memanggil fungsi reloadMiniCart setelah produk ditambahkan
      reloadMiniCart();
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  // Fungsi untuk memuat ulang mini cart dari Magento
  const reloadMiniCart = async () => {
    try {
      // Memanggil endpoint untuk memuat ulang mini cart
      const response = await fetch(
        "/en/customer/section/load/?sections=cart&force_new_section_timestamp=true",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reload mini cart.");
      }

      const data = await response.json();
      const updatedCart = data.cart;

      if (updatedCart) {
        setCartItemCount(updatedCart.items_count);
        setSummaryCount(updatedCart.summary_count);
        updateLocalStorage(updatedCart);
      }
    } catch (error) {
      console.error("Error reloading mini cart:", error);
    }
  };

  // Fungsi untuk memperbarui localStorage
  const updateLocalStorage = (updatedCart: any) => {
    try {
      const mageCacheStorage = localStorage.getItem("mage-cache-storage");
      let cacheData = mageCacheStorage ? JSON.parse(mageCacheStorage) : {};

      // Memperbarui cache data dengan data keranjang yang terbaru
      cacheData.cart = {
        ...cacheData.cart,
        items_count: updatedCart.items_count,
        summary_count: updatedCart.summary_count,
      };

      // Menyimpan kembali data yang diperbarui ke localStorage
      localStorage.setItem("mage-cache-storage", JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error updating localStorage:", error);
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
        summaryCount,
        updateCartItemCount,
        addItemToCart,
        reloadMiniCart, // Berikan akses untuk reloadMiniCart
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
