export const addProductToCart = async (
  guestCartId: string,
  sku: string,
  qty: number,
) => {
  const url = `/rest/V1/guest-carts/${guestCartId}/items`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        cartItem: {
          quote_id: guestCartId,
          sku: sku,
          qty: qty,
        },
      }),
    });

    console.log("Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response Error Text:", errorText);
      throw new Error("Failed to add product to cart");
    }

    const data = await response.json();
    console.log("Response Data:", data);
    return data;
  } catch (error) {
    console.error("Error adding product to cart:", error);
    throw error;
  }
};
