import { Product } from "../../api/shared";
import { baseApiUrl, mediaUrl } from "../../utils/apiUtils";

interface SuggestedGiftsProps {
  product: Product[];
}

const SuggestedGifts = ({ product }: SuggestedGiftsProps) => {
  return (
    <div className="w-full space-y-4 bg-gradient-to-b from-[#1B1404] to-[#2C1F06] py-4">
      <h3 className="px-8 text-2xl font-bold text-white">Suggested Gifts</h3>
      <div className="flex items-center space-x-3 overflow-x-auto px-8 no-scrollbar">
        {product.map((item, index) => {
          const imageUrl =
            mediaUrl(item.media_gallery_entries[0]?.file) ??
            "https://picsum.photos/id/237/200/300";
          return (
            <div
              className="flex h-[150px] w-[115px] shrink-0 flex-col overflow-hidden rounded-lg bg-[#2C1F06]"
              key={index}
              onClick={() => {
                window.open(
                  `${baseApiUrl}/${item.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                  "_blank",
                );
              }}
            >
              <img
                className="h-full w-full object-cover"
                src={imageUrl}
                alt={item.name}
              />
              <div className="line-clamp-2 py-2 text-left text-[0.625rem] font-semibold text-white">
                {item.name}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[0.5rem] text-white/60">Brand Name</p>
                <div className="flex flex-wrap items-center justify-end gap-x-1">
                  <span className="text-[0.625rem] font-bold text-white">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedGifts;
