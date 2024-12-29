import { Product } from "../../api/shared";
import { getProductAttributes, mediaUrl } from "../../utils/apiUtils";
import { BrandName } from "../product/brand";

export function VTOProductCard({
  product,
  selectedProduct,
  setSelectedProduct,
  onClick,
}: {
  product: Product;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  onClick: () => void;
}) {
  const imageUrl = mediaUrl(product.media_gallery_entries?.[0]?.file);

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
      className="w-[50px] cursor-pointer sm:w-[70px] md:w-[90px] lg:w-[100px]"
      onClick={onClick} // Memanggil onClick saat produk diklik
    >
      {/* Gambar responsif */}
      <div className="relative h-[35px] w-[50px] overflow-hidden sm:h-[50px] sm:w-[70px] md:h-[65px] md:w-[90px] lg:h-[75px] lg:w-[100px]">
        <img
          src={imageUrl}
          alt="Product"
          className="h-full w-full rounded object-cover"
        />
      </div>

      {/* Nama Produk */}
      <h3 className="line-clamp-2 h-4 py-1 text-[0.35rem] font-semibold text-white sm:h-6 sm:py-1 sm:text-[0.5rem] md:h-8 md:text-[0.55rem] lg:text-[0.625rem]">
        {product.name}
      </h3>

      {/* Brand */}
      <p className="h-3 text-[0.35rem] text-white/60 sm:h-3 sm:text-[0.45rem] md:h-4 md:text-[0.5rem] lg:text-[0.55rem]">
        <BrandName brandId={getProductAttributes(product, "brand")} />
      </p>

      {/* Harga dan Tombol */}
      <div className="flex items-end justify-between space-x-1 pt-1">
        {/* Harga */}
        <div className="bg-gradient-to-r from-[#CA9C43] to-[#92702D] bg-clip-text text-[0.35rem] text-transparent sm:text-[0.45rem] md:text-[0.5rem] lg:text-[0.55rem]">
          ${product.price}
        </div>
        {/* Tombol */}
        <button
          type="button"
          className="flex h-3 items-center justify-center bg-gradient-to-r from-[#CA9C43] to-[#92702D] px-0.5 text-[0.3rem] font-semibold text-white sm:h-4 sm:px-1 sm:text-[0.45rem] md:h-5 md:px-1 md:text-[0.5rem] lg:h-6 lg:px-1.5 lg:text-[0.55rem]"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
