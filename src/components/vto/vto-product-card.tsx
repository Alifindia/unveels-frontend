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

  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  const isSelected = selectedProduct?.id === product.id;

  const cardStyle = isSelected
    ? {
        border: "1.5px solid transparent", // Atur border dengan warna transparan
        borderImage:
          "linear-gradient(90deg, #CA9C43 0%, #916E2B 27.4%, #6A4F1B 59.4%, #473209 100%)", // Terapkan gradien pada border
        borderImageSlice: 1, // Pastikan border menggunakan gradien sepenuhnya
      }
    : {};

  return (
    <div
      style={cardStyle}
      className="w-[65px] sm:w-[95px] cursor-pointer"
      onClick={onClick} // Memanggil onClick saat produk diklik
    >
      <div className="relative h-[42.6px] w-[65px] overflow-hidden sm:h-[65px] sm:w-[95px]">
        <img
          src={imageUrl}
          alt="Product"
          className="h-full w-full rounded object-cover"
        />
      </div>

      <h3 className="line-clamp-2 h-6 py-1 text-[0.425rem] font-semibold text-white sm:h-10 sm:py-2 sm:text-[0.625rem]">
        {product.name}
      </h3>
      <p className="line-clamp-1 h-3 text-[0.425rem] text-white/60 sm:h-4 sm:text-[0.625rem]">
        <BrandName brandId={getProductAttributes(product, "brand")} />
      </p>
      <div className="flex items-end justify-between space-x-1 pt-1">
        <div className="bg-gradient-to-r from-[#CA9C43] to-[#92702D] bg-clip-text text-[0.4385rem] text-white sm:text-[0.635rem] max-w-px">
          {currencySymbol}{(product.price * rate).toFixed(3)}
        </div>
        <button
          type="button"
          className="flex h-4 items-center justify-center bg-gradient-to-r from-[#CA9C43] to-[#92702D] px-0.5 text-[0.45rem] font-semibold text-white sm:h-7 sm:px-1.5 sm:text-[0.55rem]"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
