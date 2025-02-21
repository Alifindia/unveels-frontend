import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { useLocation } from "react-router-dom";

import { colors } from "../../../../api/attributes/color";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { NeckwearProvider, useNeckwearContext } from "./neckwear-context";
import { useNeckwearQuery } from "./neckwear-query";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { ColorPalette } from "../../../../components/color-palette";
import { useAccesories } from "../../../../context/accesories-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import {
  headAccessoriesProductTypeFilter,
  neckAccessoriesProductTypeFilter,
} from "../../../../api/attributes/accessories";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

function useActiveNeckwear(): "Chokers" | "Necklaces" | "Pendants" {
  const location = useLocation();

  // Extract the neckwear type from the path
  const pathSegments = location.pathname.split("/");
  const activeNeckwear = pathSegments.includes("virtual-try-on")
    ? pathSegments[2]
    : null;

  if (
    activeNeckwear === null ||
    !["chokers", "necklaces", "pendants"].includes(activeNeckwear)
  ) {
    throw new Error("No active neckwear found");
  }

  // capitalize the first letter
  return (activeNeckwear.charAt(0).toUpperCase() + activeNeckwear.slice(1)) as
    | "Chokers"
    | "Necklaces"
    | "Pendants";
}

export function NeckwearSelector() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2">
      <FamilyColorSelector />
      <ColorSelector />
      <NeckwearProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useNeckwearContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar"
      data-mode="lip-color"
    >
      {colors
        .filter((c) => colorFamilyToInclude?.includes(c.value))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-white/80",
              {
                "border-white/80": colorFamily === item.value,
              },
            )}
            onClick={() =>
              setColorFamily(colorFamily == item.value ? null : item.value)
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
  const { colorFamily, selectedColor, setSelectedColor } = useNeckwearContext();
  const neckwearType = useActiveNeckwear();
  const { setShowNecklace } = useAccesories();

  const { data } = useNeckwearQuery(neckwearType, {
    color: colorFamily,
  });

  useEffect(() => {
    if (selectedColor === null) {
      setShowNecklace(false);
    } else {
      setShowNecklace(true);
    }
  }, [selectedColor]);

  const extractHexa = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const extractSubColor = extractUniqueCustomAttributes(
    data?.items ?? [],
    "sub_color",
  ).flatMap((item) => getHexCodeSubColor(item) ?? "");

  const extracted_sub_colors =
    extractHexa.length > 0 ? extractHexa : extractSubColor;

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 xl:py-1">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-0.5 no-scrollbar sm:space-x-4">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => setSelectedColor(null)}
        >
          <Icons.empty className="size-5 sm:size-[1.375rem] xl:size-[1rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={color == selectedColor}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function NeckwearProductList() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeNeckwear, setActiveNeckwear] = useState<
    "Chokers" | "Necklaces" | "Pendants" | null
  >(null);

  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
  } = useNeckwearContext();

  const { setShowNecklace } = useAccesories();

  useEffect(() => {
    if (selectedProduct != null) {
      setShowNecklace(true);
    }
  }, [selectedProduct]);

  const neckwearType = useActiveNeckwear();

  const { data, isLoading } = useNeckwearQuery(neckwearType, {
    color: colorFamily,
  });

  useEffect(() => {
    if (activeNeckwear === neckwearType) return;
    setActiveNeckwear(neckwearType);
    setSelectedProduct(null);
    setSelectedColor(null);
    setColorFamily(null);
    console.log("HandwearProductList");
  }, [neckwearType]);

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
    );
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      getHexCodeSubColor(
        product.custom_attributes.find(
          (item) => item.attribute_code === "sub_color",
        )?.value,
      ) ?? null,
    );
  };

  return (
    <>
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Chokers: {
                attributeName: "neck_accessories_product_type",
                values: neckAccessoriesProductTypeFilter(["Chokers"]),
              },
              Necklace: {
                attributeName: "neck_accessories_product_type",
                values: headAccessoriesProductTypeFilter(["Necklaces"]),
              },
            });
            setGroupedItemsData({
              makeup: [
                { label: "Chokers", section: "makeup" },
                { label: "Necklace", section: "makeup" },
              ],
              accessories: [],
            });
            setSectionName("Neckwear");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
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
