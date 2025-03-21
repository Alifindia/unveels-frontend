import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { ColorPalette } from "../../../../components/color-palette";
import { ContourProvider, useContourContext } from "./contour-context";
import { useEffect, useRef, useState } from "react";
import { useMakeup } from "../../../../context/makeup-context";
import { useQuery } from "@tanstack/react-query";
import {
  faceMakeupProductTypesFilter,
  getFaceMakeupProductTypeIds,
} from "../../../../api/attributes/makeups";
import {
  baseApiUrl,
  baseUrl,
  buildSearchParams,
  extractUniqueCustomAttributes,
  getProductAttributes,
  mediaUrl,
} from "../../../../utils/apiUtils";
import { defaultHeaders, Product } from "../../../../api/shared";
import { useCountdown } from "../../../../hooks/useCountdown";
import { LoadingProducts } from "../../../../components/loading";
import { BrandName } from "../../../../components/product/brand";
import { filterTextures } from "../../../../api/attributes/texture";
import Textures from "three/src/renderers/common/Textures.js";
import { useContourQuery } from "./contour-query";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function ContourSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <ColorSelector />
      <ModeSelector />
      <ShapeSelector />
      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const {
    setContourColors,
    setContourMode,
    setShowContour,
    showContour,
    contourColors,
  } = useMakeup();
  const { selectedColors, setSelectedColors, selectedMode } =
    useContourContext();

  const { data } = useContourQuery({
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const handleColorClick = (color: string) => {
    if (!showContour) {
      setShowContour(true);
    }
    // Handle color deselection
    if (selectedColors.includes(color)) {
      const newColors = selectedColors.filter((c) => c !== color);
      setSelectedColors(newColors);
      setContourColors(newColors);
      return;
    }

    // Handle different modes
    const isMultiColorMode = selectedMode === "Dual";
    const maxColors = isMultiColorMode ? 2 : 1;

    setContourMode(isMultiColorMode ? "Dual" : "One");

    // Update colors by either adding new color or replacing the oldest one
    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color]; // Remove oldest, add new

    setSelectedColors(newColors);
    setContourColors(newColors);
  };

  const handleClearSelection = () => {
    setSelectedColors([]);
    setShowContour(false);
  };

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2.5 no-scrollbar",
        isRTL ? "space-x-reverse space-x-4" : "space-x-4"
      )}>
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
          onClick={handleClearSelection}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            size="large"
            palette={{ color }}
            selected={selectedColors.includes(color)}
            key={color}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
      {/* Removed the error message since all buttons are enabled */}
    </div>
  );
}

const modes = ["One", "Dual"];

function ModeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedMode, setSelectedMode, selectedColors, setSelectedColors } =
    useContourContext();
  const { setContourMode, contourColors, setContourColors } = useMakeup();

  function setMode(mode: string) {
    setSelectedMode(mode);

    if (mode == "One") {
      setContourMode(mode);
      if (selectedMode === "One" && contourColors.length > 1) {
        setSelectedColors([contourColors[0]]);
        setContourColors([contourColors[0]]);
      }
    }
  }

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-reverse space-x-4" : "space-x-4"
      )}>
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={clsx(
              "relative inline-flex items-center rounded-full px-1 py-1 text-center text-sm transition-transform",
              {
                "-translate-y-0.5 text-white": selectedMode === mode,
                "text-white/80": selectedMode !== mode,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
            )}
            onClick={() => setMode(mode)}
          >
            {selectedMode === mode ? (
              <div className="absolute inset-0 flex items-center justify-center text-white blur-sm backdrop-blur-sm">
                {mode}
              </div>
            ) : null}
            <span className="relative text-[9.8px] sm:text-xs">{mode}</span>
          </button>
        ))}

        <div className="h-5 border border-r"></div>
      </div>
    </div>
  );
}

const contours = [
  "/media/unveels/vto/contours/contour-1.png",
  "/media/unveels/vto/contours/contour-2.png",
  "/media/unveels/vto/contours/contour-3.png",
  "/media/unveels/vto/contours/contour-4.png",
  "/media/unveels/vto/contours/contour-5.png",
  "/media/unveels/vto/contours/contour-6.png",
];

function ShapeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedShape, setSelectedShape } = useContourContext();
  const { setContourShape } = useMakeup();

  function setShape(shape: string) {
    setContourShape(shape);
    setSelectedShape(shape);
  }

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2.5 no-scrollbar",
        isRTL ? "space-x-reverse space-x-4" : "space-x-4"
      )}>
        {contours.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === index.toString(),
              }
            )}
            onClick={() => setShape(index.toString())}
          >
            <img
              src={path}
              alt="Eyebrow"
              className="size-[25px] rounded sm:size-[30px] lg:size-[35px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

function TextureSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedTexture, setSelectedTexture } = useContourContext();
  const { highlighterMaterial, setHighlighterMaterial } = useMakeup();

  function setMaterial(
    material: number,
    texture: { label: string; value: string },
  ) {
    if (selectedTexture === texture.value) {
      setSelectedTexture(null);
    } else {
      setSelectedTexture(texture.value);
    }
    setHighlighterMaterial(material);
  }

  return (
    <div className="mx-auto w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-2 no-scrollbar",
        isRTL ? "space-x-reverse space-x-4" : "space-x-4"
      )}>
        {textures.map((texture, index) => (
          <button
            key={texture.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
            )}
            onClick={() => setMaterial(index, texture)}
          >
            <span className="text-[9.8px] lg:text-xs">{t("texture." + texture.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { selectedProductNumber, setSelectedProductNumber, addCartProductNumber, setAddCartProductNumber } = useSelecProductNumberContext()
  const { addItemToCart, setDataItem, setType } = useCartContext();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    selectedColors,
    selectedMode,
    selectedTexture,
    setSelectedColors,
    setSelectedTexture,
  } = useContourContext();

  const { setContourColors, setContourShape, setShowContour, setContourMode } =
    useMakeup();
  const { data, isLoading } = useContourQuery({
    texture: selectedTexture,
  });

  useEffect(() => {
    setContourColors(selectedColors);
    setContourMode(selectedMode as "One" | "Dual");
    setShowContour(selectedColors.length > 0);
  }, [selectedColors, selectedMode, selectedColors]);

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColors([
          matchedProduct.custom_attributes
            .find((item) => item.attribute_code === "hexacode")
            ?.value.split(",")[0],
        ]);
        setSelectedTexture(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "texture",
          )?.value,
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
            setType("unit")
            setDataItem(matchedProduct);
            setAddCartProductNumber(null)
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
      setSelectedColors([])
      setSelectedTexture(null)
      return
    }
    console.log(product);
    setSelectedProduct(product);
    setSelectedColors([
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(",")[0],
    ]);
    setSelectedTexture(
      product.custom_attributes.find(
        (item) => item.attribute_code === "texture",
      )?.value,
    );
  };

  return (
    <>
      <div className={clsx("w-full", isRTL ? "text-left" : "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Contouring: {
                attributeName: "face_makeup_product_types",
                values: getFaceMakeupProductTypeIds(["Contouring"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Contouring", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Contour");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div className={clsx(
        "flex w-full overflow-x-auto border-none pb-2 pt-1 no-scrollbar active:cursor-grabbing",
        isRTL ? "gap-2 sm:gap-4" : "gap-2 sm:gap-4"
      )} dir={isRTL ? "rtl" : "ltr"}>
        {isLoading ? (
          <LoadingProducts />
        ) : (
          data?.items.map((product, index) => {
            return (
              <VTOProductCard
                product={product}
                productNumber={index+1}
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