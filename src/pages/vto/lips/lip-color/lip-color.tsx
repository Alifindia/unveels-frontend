import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { textures } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { useMakeup } from "../../../../context/makeup-context";
import { LipColorProvider, useLipColorContext } from "./lip-color-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useLipColorQuery } from "./lip-color-query";
import {
  baseApiUrl,
  extractUniqueCustomAttributes,
} from "../../../../utils/apiUtils";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useCartContext } from "../../../../context/cart-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getLipsMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";

export function LipColorSelector() {
  console.log("render LipColorSelector");
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <TextureSelector />

      <ShadesSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useLipColorContext();

  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto py-1 no-scrollbar 2xl:py-2",
        isRTL ? "space-x-2 space-x-reverse" : "space-x-2",
      )}
      data-mode="lip-color"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {colors
        .filter((c) => colorFamilyToInclude?.includes(c.value))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
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
            <span className="text-[0.625rem]">{t("color." + item.label)}</span>
          </button>
        ))}
    </div>
  );
}

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const {
    setLipColors,
    setLipColorMode,
    setShowLipColor,
    showLipColor,
    lipColors,
  } = useMakeup();
  const { selectedColors, setSelectedColors, selectedMode, colorFamily } =
    useLipColorContext();

  const { data } = useLipColorQuery({
    color: colorFamily,
    sub_color: null,
    texture: null,
  });

  if (!colorFamily) {
    return null;
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const handleColorClick = (color: string) => {
    console.log("handleColorClick");
    console.log(data, "data");

    if (!showLipColor) setShowLipColor(true);

    // Handle color deselection
    if (selectedColors.includes(color)) {
      const newColors = selectedColors.filter((c) => c !== color);
      console.log(newColors, "newColors");
      setSelectedColors(newColors);
      setLipColors(newColors);
      return;
    }

    // Handle different modes
    const isMultiColorMode =
      selectedMode === "Dual" || selectedMode === "Ombre";
    const maxColors = isMultiColorMode ? 2 : 1;
    setLipColorMode(isMultiColorMode ? "Dual" : "One");

    // Update colors by either adding new color or replacing the oldest one
    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color]; // Remove oldest, add new
    console.log(newColors, "newColors");

    setSelectedColors(newColors);
    setLipColors(newColors);
  };

  const handleClearSelection = () => {
    setSelectedColors([]);

    setShowLipColor(false);
  };

  return (
    <div
      className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto py-0.5 no-scrollbar",
          isRTL
            ? "space-x-3 space-x-reverse sm:space-x-4 sm:space-x-reverse"
            : "space-x-3 sm:space-x-4",
        )}
      >
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
          )}
          onClick={handleClearSelection}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColors.includes(color)}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
      {/* Removed the error message since all buttons are enabled */}
    </div>
  );
}

function TextureSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { selectedTexture, setSelectedTexture } = useLipColorContext();

  return (
    <div
      className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto py-1 no-scrollbar",
          isRTL
            ? "space-x-1 space-x-reverse xl:space-x-2 xl:space-x-reverse"
            : "space-x-1 xl:space-x-2",
        )}
      >
        {textures.map((texture, index) => (
          <button
            key={texture.label}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
            )}
            onClick={() => {
              if (selectedTexture === texture.value) {
                setSelectedTexture(null);
              } else {
                setSelectedTexture(texture.value);
              }
            }}
          >
            <span className="text-[9.8px] lg:text-xs">
              {t("texture." + texture.label)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const shades = ["One", "Dual", "Ombre"];

function ShadesSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { setSelectedMode, selectedMode, setSelectedColors, setReplaceIndex } =
    useLipColorContext();
  const { setLipColorMode, lipColors, setLipColors } = useMakeup();

  function setMode(mode: string) {
    setSelectedMode(mode);
    if (mode == "Dual") {
      setLipColorMode(mode);
    }
    if (mode == "Ombre") {
      setLipColorMode(mode);
    }

    if (mode === "One" && lipColors.length > 1) {
      const newColors = [lipColors[0]];
      setSelectedColors(newColors);
      setLipColors(newColors);
      setReplaceIndex(0);
    }
  }

  return (
    <div
      className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto no-scrollbar",
          isRTL ? "space-x-4 space-x-reverse" : "space-x-4",
        )}
      >
        {shades.map((shade, index) => (
          <button
            key={shade}
            type="button"
            className={clsx(
              "relative inline-flex items-center rounded-full px-1 py-1 text-center text-sm transition-transform",
              {
                "-translate-y-0.5 text-white": selectedMode === shade,
                "text-white/80": selectedMode !== shade,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
            )}
            onClick={() => setMode(shade)}
          >
            {selectedMode === shade ? (
              <div className="absolute inset-0 flex items-center justify-center text-white blur-sm backdrop-blur-sm">
                {shade}
              </div>
            ) : null}
            <span className="relative text-[9.8px] sm:text-xs">{shade}</span>
          </button>
        ))}

        <div className="h-5 border border-r"></div>
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

  const {
    colorFamily,
    selectedTexture,
    selectedColors,
    setColorFamily,
    setSelectedColors,
    setSelectedTexture,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedMode,
  } = useLipColorContext();

  const { setLipColors, setLipColorMode, setShowLipColor, setLipTexture } =
    useMakeup();

  useEffect(() => {
    setLipColors(selectedColors);
    setLipColorMode(selectedMode as "One" | "Dual" | "Ombre");
    setSelectedColors(selectedColors);
    setShowLipColor(selectedColors.length > 0);
    const texture = textures.find((t) => t.value == selectedTexture);
    setLipTexture(
      texture?.label as
        | "Matte"
        | "Gloss"
        | "Satin"
        | "Sheer"
        | "Shimmer"
        | "Metalic"
        | "Holographic",
    );
  }, [selectedColors, selectedMode, selectedColors, selectedTexture]);

  const { data, isLoading } = useLipColorQuery({
    color: colorFamily,
    sub_color: selectedColors[0],
    texture: selectedTexture,
  });

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(matchedProduct);
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColors(
          matchedProduct.custom_attributes
            .find((item) => item.attribute_code === "hexacode")
            ?.value.split(","),
        );
        setColorFamily(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "color",
          )?.value || null,
        );
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

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
    );
  }

  const handleProductClick = (product: Product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setSelectedProductNumber(null);
      setColorFamily(null);
      setSelectedColors([]);
      setSelectedTexture(null);
      return;
    }
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColors(
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(","),
    );
    setSelectedTexture(
      product.custom_attributes.find(
        (item) => item.attribute_code === "texture",
      )?.value,
    );
  };

  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

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
              Lipcolors: {
                attributeName: "lips_makeup_product_type",
                values: "5726,5727,5728,5731".split(","),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Lipcolors", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Lip Color");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div
        className={clsx(
          "flex w-full overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing",
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
