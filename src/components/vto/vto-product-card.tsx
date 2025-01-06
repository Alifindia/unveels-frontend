import { Product } from "../../api/shared";
import { getProductAttributes, mediaUrl } from "../../utils/apiUtils";
import { exchangeRates } from "../../utils/constants";
import { getCurrencyAndRate } from "../../utils/other";
import { BrandName } from "../product/brand";

export function VTOProductCard({
  product,
  productNumber,
  selectedProduct,
  setSelectedProduct,
  onClick,
}: {
  product: Product;
  productNumber?: number;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  onClick: () => void;
}) {
  const imageUrl = mediaUrl(product.media_gallery_entries?.[0]?.file);

  const { currency, rate } = getCurrencyAndRate(exchangeRates);

  const isSelected = selectedProduct?.id === product.id;

  const cardStyle = isSelected
    ? {
        border: "1.5px solid transparent", // Atur border dengan warna transparan
        borderImage:
          "linear-gradient(90deg, #CA9C43 0%, #916E2B 27.4%, #6A4F1B 59.4%, #473209 100%)", // Terapkan gradien pada border
        borderImageSlice: 1, // Pastikan border menggunakan gradien sepenuhnya
      }
    : {};

  const truncateText = (text: string, charLimit: number) => {
    return text.length > charLimit ? text.slice(0, charLimit) + "..." : text;
  };

  return (
    <div
      style={cardStyle}
      className="w-[100px] cursor-pointer sm:w-[130px]"
      onClick={onClick} // Memanggil onClick saat produk diklik
    >
      <div className="relative h-[68px] w-[100px] overflow-hidden sm:h-[88.4px] sm:w-[130px]">
        <img
          src={imageUrl}
          alt="Product"
          className="h-full w-full rounded object-cover"
        />
      </div>

      <h3 className="mb-3 line-clamp-2 h-6 py-1 text-[0.6rem] font-semibold text-white sm:h-10 sm:py-2 sm:text-[0.75rem]">
        {truncateText(product.name || "", 20)}
      </h3>

      <div className="flex items-end justify-between space-x-1 pt-1">
        <div className="bg-gradient-to-r bg-clip-text text-[0.6rem] text-transparent text-white sm:text-[0.85rem]">
          {currency} {product.price * rate}
        </div>
        <button
          type="button"
          className="flex h-5 items-center justify-center bg-gradient-to-r from-[#CA9C43] to-[#92702D] px-1.5 text-[0.55rem] font-semibold text-white sm:h-8 sm:px-2 sm:text-[0.75rem]"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
