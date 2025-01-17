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
      className="w-[70px] lg:w-[80px] xl:w-[100px] 2xl:w-[120px] cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-[40px] w-[70px] lg:h-[45px] lg:w-[80px] xl:h-[55px] xl:w-[100px] 2xl:h-[70px] 2xl:w-[120px] overflow-hidden">
        <img
          src={imageUrl}
          alt="Product"
          className="h-full w-full rounded object-cover"
        />
      </div>

      <h3 className="line-clamp-2 h-5 py-1 text-[0.325rem] lg:h-6 lg:py-2 xl:h-7 xl:py-2 2xl:h-10 2xl:py-2 lg:text-[0.35rem] xl:text-[0.45rem] 2xl:text-[0.625rem] font-semibold text-white">
        {product.name}
      </h3>
      <p className="line-clamp-1 h-2 text-[0.325rem] pt-0.5 pb-1 text-white/60 md:h-3 lg:h-3 2xl:h-4 lg:text-[0.35rem] xl:text-[0.45rem] 2xl:text-[0.625rem]">
        <BrandName brandId={getProductAttributes(product, "brand")} />
      </p>
      <div className="flex items-end gap-1 justify-between space-x-1 pt-1">
        <div className="bg-gradient-to-r from-[#CA9C43] to-[#92702D] w-24 bg-clip-text text-[0.28rem] lg:text-[0.325rem] xl:text-[0.425rem] 2xl:text-[0.525rem] font-semibold text-white">
          {currencySymbol}{(product.price * rate).toFixed(3)}
        </div>
        <button
          type="button"
          className="flex w-[100px] h-3 items-center justify-center bg-gradient-to-r from-[#CA9C43] to-[#92702D] px-1 text-[0.28rem] lg:h-3 lg:text-[0.325rem] xl:h-4 xl:text-[0.425rem] 2xl:h-5 2xl:text-[0.525rem] text-white font-semibold"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
