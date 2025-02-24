import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { useLocation } from "react-router-dom";
import { colors } from "../../../../api/attributes/color";
import { filterMaterials } from "../../../../api/attributes/material";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { HandwearProvider, useHandwearContext } from "./handwear-context";
import { useHandwearQuery } from "./handwear-query";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { ColorPalette } from "../../../../components/color-palette";
import { useAccesories } from "../../../../context/accesories-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { handAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

function useActiveHandwear(): "Rings" | "Bracelets" | "Bangles" {
  const location = useLocation();

  // Extract the neckwear type from the path
  const pathSegments = location.pathname.split("/");
  const activeNeckwear = pathSegments.includes("virtual-try-on") || pathSegments.includes("virtual-try-on-accesories")
    ? pathSegments[2]
    : null;

  if (
    activeNeckwear == null ||
    !["rings", "bracelets", "bangles"].includes(activeNeckwear)
  ) {
    throw new Error("No active neckwear found");
  }

  // capitalize the first letter
  return (activeNeckwear.charAt(0).toUpperCase() + activeNeckwear.slice(1)) as
    | "Rings"
    | "Bracelets"
    | "Bangles";
}

export function HandwearSelector() {
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
      <MaterialSelector />
      <HandwearProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useHandwearContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-1 2xl:py-2 no-scrollbar"
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
  const { colorFamily, selectedColor, setSelectedColor } = useHandwearContext();

  const { setShowRing } = useAccesories();

  const handwearType = useActiveHandwear();

  const { data } = useHandwearQuery(handwearType, {
    color: colorFamily,
    material: null,
  });

  useEffect(() => {
    if (selectedColor === null) {
      setShowRing(false);
    } else {
      setShowRing(true);
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
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-0.5 no-scrollbar sm:space-x-4">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => setSelectedColor(null)}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
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

const materials = filterMaterials([
  "Silver",
  "Silver Plated",
  "Gold Plated",
  "Brass",
  "Stainless",
]);

function MaterialSelector() {
  const { selectedMaterial, setSelectedMaterial } = useHandwearContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-1 2xl:py-2 no-scrollbar">
      {materials.map((material, index) => (
        <button
          key={material.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedMaterial === material.value,
            },
          )}
          onClick={() =>
            setSelectedMaterial(
              selectedMaterial == material.value ? null : material.value,
            )
          }
        >
          <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{material.label}</span>
        </button>
      ))}
    </div>
  );
}

function HandwearProductList() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeHandwear, setActiveHandwear] = useState<
    "Rings" | "Bracelets" | "Bangles" | null
  >(null);

  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    setColorFamilyToInclude,
    setColorFamily,
    setSelectedColor,
    setSelectedMaterial,
    colorFamily,
    selectedMaterial,
    selectedColor,
  } = useHandwearContext();

  const { setShowRing, setShowBracelet } = useAccesories();

  const handwearType = useActiveHandwear();
  const { data, isLoading } = useHandwearQuery(handwearType, {
    color: colorFamily,
    material: selectedMaterial,
  });

  useEffect(() => {
    if (activeHandwear === handwearType) return;
    setSelectedProduct(null);
    setSelectedColor(null);
    setSelectedMaterial(null);
    setColorFamily(null);
    console.log("HandwearProductList");
  }, [handwearType]);

  useEffect(() => {
    if (selectedProduct == null) return;
    if (handwearType === "Rings") {
      setShowRing(true);
    }
    if (handwearType === "Bangles") {
      setShowBracelet(true);
    }
  }, [selectedColor]);

  if (activeHandwear != handwearType && data?.items != null) {
    setActiveHandwear(handwearType);
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
    setSelectedMaterial(
      product.custom_attributes.find(
        (item) => item.attribute_code === "material",
      )?.value,
    );
  };

  return (
    <>
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Bracelet: {
                attributeName: "hand_accessories_product_type",
                values: handAccessoriesProductTypeFilter(["Bracelets"]),
              },
              Rings: {
                attributeName: "hand_accessories_product_type",
                values: handAccessoriesProductTypeFilter(["Rings"]),
              },

              Bangles: {
                attributeName: "hand_accessories_product_type",
                values: handAccessoriesProductTypeFilter(["Bangles"]),
              },
            });
            setGroupedItemsData({
              makeup: [
                { label: "Bracelet", section: "makeup" },
                { label: "Ring", section: "makeup" },
                { label: "Bangles", section: "makeup" },
              ],
              accessories: [],
            });
            setSectionName("Handwear");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto border-none pb-2 pt-1 no-scrollbar active:cursor-grabbing sm:gap-4">
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
