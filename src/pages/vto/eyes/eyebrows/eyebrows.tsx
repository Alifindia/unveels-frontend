import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { EyebrowsProvider, useEyebrowsContext } from "./eyebrows-context";
import { useMakeup } from "../../../../context/makeup-context";
import { events } from "@react-three/fiber";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useEyeLinerContext } from "../eye-liners/eye-liner-context";
import { useEyebrowsQuery } from "./eyebrows-query";
import { getPatternByIndex } from "../../../../api/attributes/pattern";
import {
  baseApiUrl,
  extractUniqueCustomAttributes,
} from "../../../../utils/apiUtils";
import { filterColors } from "../../../../api/attributes/color";
import { ColorPalette } from "../../../../components/color-palette";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getBrowMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

const colorFamilies = filterColors(["Brown", "Black"]);

export function EyebrowsSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <PatternSelector />

      <BrightnessSlider />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { colorFamily, setColorFamily } = useEyebrowsContext();
  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-2 space-x-reverse" : "space-x-2",
      )}
      data-mode="lip-color"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {colorFamilies.map((item, index) => (
        <button
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-white/80",
            {
              "border-white/80": colorFamily === item.value,
            },
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
          )}
          onClick={() =>
            setColorFamily(colorFamily === item.value ? null : item.value)
          }
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{
              background: item.hex,
            }}
          />
          <span className="text-[0.625rem]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { colorFamily, selectedColor, setSelectedColor } = useEyebrowsContext();
  const { setEyebrowsColor, showEyebrows, setShowEyebrows } = useMakeup();

  const { data, isLoading } = useEyebrowsQuery({
    color: colorFamily,
    pattern: null,
  });

  function reset() {
    if (showEyebrows) {
      setShowEyebrows(false);
    }
    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showEyebrows) {
      setShowEyebrows(true);
    }
    setSelectedColor(color);
    setEyebrowsColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-2" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto no-scrollbar",
          isRTL ? "space-x-2 space-x-reverse" : "space-x-2",
        )}
      >
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
          )}
          onClick={() => {
            reset();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>

        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColor === color}
            onClick={() => setColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function PatternSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { selectedPattern, setSelectedPattern } = useEyebrowsContext();
  const { setEyebrowsPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    console.log(pattern);

    setSelectedPattern(patternName);
    setEyebrowsPattern(pattern);
  }
  return (
    <div className="mx-auto w-full py-2" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto no-scrollbar",
          isRTL ? "space-x-2 space-x-reverse" : "space-x-2",
        )}
      >
        {[...Array(14)].map((_, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
              {
                "border-white/80": selectedPattern === index.toString(),
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img
              src={`/media/unveels/vto/eyebrows/${index % 8}.png`}
              alt="Eyebrow"
              className="h-[12px] w-[35px] rounded sm:h-[18px] sm:w-[45px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function BrightnessSlider() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { setEyebrowsVisibility, eyebrowsVisibility } = useMakeup();
  return (
    <div className="py-2" dir={isRTL ? "rtl" : "ltr"}>
      <input
        id="minmax-range"
        type="range"
        min="0.1"
        max="1"
        step="0.1"
        className="h-1 w-full cursor-pointer rounded-lg bg-gray-200 accent-[#CA9C43]"
        onChange={(e) => {
          setEyebrowsVisibility(parseFloat(e.currentTarget.value));
        }}
        value={eyebrowsVisibility}
      />
      <div
        className={clsx(
          "flex justify-between text-[0.5rem]",
          isRTL ? "flex-row-reverse" : "",
        )}
      >
        <label htmlFor="minmax-range" className="text-white/80">
          {isRTL ? t("dark") : t("light")}
        </label>
        <label htmlFor="minmax-range" className="text-white/80">
          {isRTL ? t("light") : t("dark")}
        </label>
      </div>
    </div>
  );
}

function ProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const {
    selectedProductNumber,
    setSelectedProductNumber,
    addCartProductNumber,
    setAddCartProductNumber,
  } = useSelecProductNumberContext();
  const { addItemToCart, setDataItem, setType } = useCartContext();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    selectedPattern,
  } = useEyebrowsContext();

  const { data, isLoading } = useEyebrowsQuery({
    color: colorFamily,
    pattern: selectedPattern
      ? getPatternByIndex("eyebrows", parseInt(selectedPattern)).value
      : null,
  });
  const { setEyebrowsColor, setEyebrowsPattern, setShowEyebrows } = useMakeup();

  useEffect(() => {
    setEyebrowsColor(selectedColor || "#ffffff");
    setEyebrowsPattern(parseInt(selectedPattern || "0"));
    setShowEyebrows(selectedColor != null && selectedPattern != null);
  }, [selectedColor, selectedPattern, selectedProduct]);

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber);
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
          )?.value || null,
        );
        setColorFamily(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "color",
          )?.value || null,
        );
      }
    }
  }, [data, selectedProductNumber]);

  useEffect(() => {
    const handleAddToCart = async () => {
      if (data?.items && addCartProductNumber) {
        const adjustedIndex = addCartProductNumber - 1;
        const matchedProduct = data.items[adjustedIndex];
        console.log(matchedProduct);

        if (matchedProduct) {
          const url = `${baseApiUrl}/${matchedProduct.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`;
          const id = matchedProduct.id.toString();
          try {
            await addItemToCart(id, url);
            setType("unit");
            setDataItem(matchedProduct);
            setAddCartProductNumber(null);
            console.log(`Product ${id} added to cart!`);
          } catch (error) {
            console.error("Failed to add product to cart:", error);
          }
        }
      }
    };

    handleAddToCart();
  }, [data, addCartProductNumber]);

  const handleProductClick = (product: Product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setSelectedProductNumber(null);
      setColorFamily(null);
      setSelectedColor(null);
      return;
    }
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    );
  };

  return (
    <>
      <div
        className={clsx("w-full", isRTL ? "text-left" : "text-right")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <button
          className="p-0 text-[0.550rem] text-white sm:py-0.5 2xl:text-[0.625rem]"
          onClick={() => {
            setMapTypes({
              Eyebrows: {
                attributeName: "brow_makeup_product_type",
                values: getBrowMakeupProductTypeIds([
                  "Brow Gels",
                  "Brow Pencils",
                  "Brow Waxes",
                ]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Eyebrows", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Eyebrows");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div
        className={clsx(
          "flex w-full overflow-x-auto border-none pb-2 pt-1 no-scrollbar active:cursor-grabbing",
          isRTL ? "gap-2 sm:gap-4" : "gap-2 sm:gap-4",
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {isLoading ? (
          <LoadingProducts />
        ) : (
          data?.items.map((product, index) => {
            return (
              <VTOProductCard
                product={product}
                productNumber={index + 1}
                key={product.id}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                onClick={() => handleProductClick(product)}
              />
            );
          })
        )}
      </div>
    </>
  );
}
