import { useTranslation } from "react-i18next";
import { useFragrancesProductQuery } from "../../api/fragrances";
import { useLipsProductQuery } from "../../api/lips";
import { useLookbookProductQuery } from "../../api/lookbook";
import { useCartContext } from "../../context/cart-context";
import { getCurrencyAndRate } from "../../utils/other";
import { exchangeRates } from "../../utils/constants";
import {
  baseApiUrl,
  getProductAttributes,
  mediaUrl,
} from "../../utils/apiUtils";
import { BrandName } from "../product/brand";
import { Rating } from "../rating";
import { LoadingProducts } from "../loading";
import { LinkButton } from "../../App";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from 'swiper/modules';

type RecommendationsTabProps = {
  personality?: string;
  faceShape?: string;
  isArabic?: boolean;
};
export function RecommendationsTab({
  personality,
  faceShape,
  isArabic
}: RecommendationsTabProps) {
  const { t } = useTranslation();

  // Menggunakan nilai default 'faceShape' jika tidak ada
  const queryParams = {
    faceShape: faceShape ?? "default", // default bisa diganti sesuai kebutuhan
    personality: personality ?? undefined, // Mengatur personality jika ada
  };

  const { data: fragrances } = useFragrancesProductQuery(queryParams);
  const { data: lips } = useLipsProductQuery(queryParams);
  const { data: items } = useLookbookProductQuery(queryParams);
  const { addItemToCart, setDataItem } = useCartContext();

  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  const handleAddToCart = async (id: string, url: string, dataProduct: any) => {
    try {
      await addItemToCart(id, url);
      setDataItem(dataProduct)
      console.log(`Product ${id} added to cart!`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  return (
    <div className="w-full overflow-auto px-4 py-8">
      <div className="pb-14" dir={isArabic ? "rtl" : "ltr"}>
        <h2 className="pb-4 text-xl font-bold lg:text-2xl">
          {t("viewpersonality.perfumerec")}
        </h2>
        {fragrances ? (
          <Swiper
            modules={[Navigation]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={2}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 2,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 2,
              },
              1024: {
                slidesPerView: 7,
                spaceBetween: 2,
              },
            }}
            wrapperClass={fragrances.items.length < 7 ? "lg:justify-center" : ""}
          >
          {fragrances.items.map((product, index) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0]?.file) ??
              "https://picsum.photos/id/237/200/300";
    
            return (
              <SwiperSlide key={product.id} className="rounded">
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    window.open(
                      `${baseApiUrl}/${product.custom_attributes.find(
                        (attr) => attr.attribute_code === "url_key"
                      )?.value as string}.html`,
                      "_blank"
                    );
                  }}
                >
                  <div className="relative h:[150px] lg:h-[180px] w:[150px] lg:w-[180px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="rounded object-cover"
                    />
                  </div>
    
                  <div className="flex items-start justify-between py-2">
                    <div className="w-full">
                      <h3 className="line-clamp-1 truncate text-[0.625rem] font-semibold text-white">
                        {product.name.length > 10
                          ? `${product.name.slice(0, 10)}...`
                          : product.name}
                      </h3>
                      <p className="truncate text-[0.5rem] text-white/60">
                        <BrandName
                          brandId={getProductAttributes(product, "brand")}
                        />
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-1 pt-1">
                      <span className="truncate text-[0.625rem] font-bold text-white">
                        {currencySymbol}
                        {(product.price * rate).toFixed(3)}
                      </span>
                    </div>
                  </div>
    
                  <Rating rating={4} />
    
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(
                          product.id.toString(),
                          `${baseApiUrl}/${product.custom_attributes.find(
                            (attr) => attr.attribute_code === "url_key"
                          )?.value as string}.html`,
                          product
                        );
                      }}
                    >
                      {t("viewpersonality.addcart")}
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
        ) : (
          <LoadingProducts />
        )}
      </div>
      <div className="pb-14" dir={isArabic ? "rtl" : "ltr"}>
        <h2 className="text-xl font-bold">{t("viewpersonality.lookrec")}</h2>
        <p className="pb-4 text-sm font-bold">{t("viewpersonality.lookdec")}</p>
        {items ? (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={2}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 2,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 2,
              },
              1024: {
                slidesPerView: 7,
                spaceBetween: 2,
              },
            }}
            wrapperClass={items.profiles.length < 7 ? "lg:justify-center" : ""}
          >
            {items.profiles.map((profile, index) => {
              const imageUrl = baseApiUrl + "/media/" + profile.image;
              return (
                <SwiperSlide key={profile.identifier} className="rounded">
                  <div>
                    <div className="relative h:[150px] lg:h-[180px] w:[150px] lg:w-[180px] overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Product"
                        className="h-full w-full rounded object-cover"
                      />
                    </div>

                    <div className="flex items-start justify-between py-2">
                      <div className="w-full">
                        <h3 className="line-clamp-1 truncate text-[0.625rem] font-semibold text-white">
                          {profile.name.length > 10
                            ? `${profile.name.slice(0, 10)}...`
                            : profile.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-x-1 pt-1">
                        <span className="truncate text-[0.625rem] font-bold text-white">
                          {currencySymbol}
                          {profile.products.reduce(
                            (acc, product) => acc + product.price,
                            0,
                          ) * rate}
                        </span>
                      </div>
                    </div>

                    <Rating rating={4} />

                    <div className="flex space-x-1">
                      <button
                        type="button"
                        className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                      >
                        {t("viewpersonality.addcart")}
                      </button>
                        <LinkButton
                        to={`/virtual-try-on-product?sku=${profile.products
                          .map((product) => product.sku)
                          .join(",")}`}
                        className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                      >
                        {t("viewftl.try_on")}
                      </LinkButton>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        ) : (
          <LoadingProducts />
        )}
      </div>
      <div className="pb-14" dir={isArabic ? "rtl" : "ltr"}>
        <h2 className="text-xl font-bold">
          {t("viewpersonality.lipcolorrec")}
        </h2>
        <p className="pb-4 text-sm font-bold">
          {t("viewpersonality.lipcolordec")}
        </p>
        {lips ? (
          <Swiper
            modules={[Navigation]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={2}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 2,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 2,
              },
              1024: {
                slidesPerView: 7,
                spaceBetween: 2,
              },
            }}
            wrapperClass={lips.items.length < 7 ? "lg:justify-center" : ""}
          >
          {lips.items.map((product) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0]?.file) ??
              "https://picsum.photos/id/237/200/300";
    
            return (
              <SwiperSlide key={product.id} className="rounded">
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    window.open(
                      `${baseApiUrl}/${product.custom_attributes.find(
                        (attr) => attr.attribute_code === "url_key"
                      )?.value as string}.html`,
                      "_blank"
                    );
                  }}
                >
                  <div className="relative h:[150px] lg:h-[180px] w:[150px] lg:w-[180px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="rounded object-cover"
                    />
                  </div>
    
                  <div className="flex items-start justify-between py-2">
                    <div className="w-full">
                      <h3 className="line-clamp-1 truncate text-[0.625rem] font-semibold text-white">
                        {product.name.length > 10
                          ? `${product.name.slice(0, 10)}...`
                          : product.name}
                      </h3>
                      <p className="truncate text-[0.5rem] text-white/60">
                        <BrandName
                          brandId={getProductAttributes(product, "brand")}
                        />
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-1 pt-1">
                      <span className="truncate text-[0.625rem] font-bold text-white">
                        {currencySymbol}
                        {(product.price * rate).toFixed(3)}
                      </span>
                    </div>
                  </div>
    
                  <Rating rating={4} />
    
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(
                          product.id.toString(),
                          `${baseApiUrl}/${product.custom_attributes.find(
                            (attr) => attr.attribute_code === "url_key"
                          )?.value as string}.html`,
                          product
                        );
                      }}
                    >
                      {t("viewpersonality.addcart")}
                    </button>
                    <LinkButton
                      to={`/virtual-try-on-product?sku=${product.sku}`}
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      {t("viewftl.try_on")}
                    </LinkButton>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
        ) : (
          <LoadingProducts />
        )}
      </div>
      <style>
        {`
          .swiper-button-next,
          .swiper-button-prev {
            color: rgb(209 213 219);
          }

          .swiper-button-next:hover,
          .swiper-button-prev:hover {
            color: rgb(107 114 128);
          }

          .swiper-slide {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 2;
          }
        `}
      </style>
    </div>
  );
}
