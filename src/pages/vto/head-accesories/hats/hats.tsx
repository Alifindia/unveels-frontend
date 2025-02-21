import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { colors } from "../../../../api/attributes/color";
import { filterFabrics } from "../../../../api/attributes/fabric";
import { filterOccasions } from "../../../../api/attributes/occasion";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { HatsProvider, useHatsContext } from "./hats-context";
import { useHatsQuery } from "./hats-query";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { ColorPalette } from "../../../../components/color-palette";
import { useAccesories } from "../../../../context/accesories-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { headAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

export function HatsSelector() {
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
      <ModeSelector />
      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useHatsContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
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
  const { colorFamily, selectedColor, setSelectedColor } = useHatsContext();
  const { setShowHat } = useAccesories();

  const { data } = useHatsQuery({
    color: colorFamily,
    fabric: null,
    occasion: null,
  });

  useEffect(() => {
    if (selectedColor === null) {
      setShowHat(false);
    } else {
      setShowHat(true);
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

function ModeSelector() {
  const { selectedMode, setSelectedMode } = useHatsContext();

  return (
    <>
      <div className="flex h-[35px] w-full items-center justify-between text-center sm:h-10">
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "occasions",
              "text-white/60": selectedMode !== "occasions",
            },
          )}
          onClick={() => setSelectedMode("occasions")}
        >
          Occasions
        </button>
        <div className="h-5 border-r border-white"></div>
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "fabrics",
              "text-white/60": selectedMode !== "fabrics",
            },
          )}
          onClick={() => setSelectedMode("fabrics")}
        >
          Fabrics
        </button>
      </div>

      {selectedMode === "occasions" ? <OccasionSelector /> : <FabricSelector />}
    </>
  );
}

const occasions = filterOccasions(["Casual", "Formal", "Sports"]);

function OccasionSelector() {
  const { selectedOccasion, setSelectedOccasion } = useHatsContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto !border-t-0 py-2 no-scrollbar">
      {occasions.map((occasion, index) => (
        <button
          key={occasion.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedOccasion === occasion.value,
            },
          )}
          onClick={() => setSelectedOccasion(occasion.value)}
        >
          <span className="text-[9.8px] xl:text-xs 2xl:text-sm">{occasion.label}</span>
        </button>
      ))}
    </div>
  );
}

const fabrics = filterFabrics(["Polyester", "Cotton", "Leather", "Denim"]);

function FabricSelector() {
  const { selectedFabric, setSelectedFabric } = useHatsContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto !border-t-0 py-2 no-scrollbar">
      {fabrics.map((fabric, index) => (
        <button
          key={fabric.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedFabric === fabric.value,
            },
          )}
          onClick={() => setSelectedFabric(fabric.value)}
        >
          <span className="text-[9.8px] xl:text-xs 2xl:text-sm">{fabric.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProductList() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    setSelectedColor,
    selectedOccasion,
    selectedFabric,
    setSelectedFabric,
    setSelectedOccasion,
  } = useHatsContext();

  const { setShowHat } = useAccesories();

  useEffect(() => {
    if (selectedProduct == null && colorFamily == null) return;
    setShowHat(true);
  }, [selectedProduct]);

  const { data, isLoading } = useHatsQuery({
    color: colorFamily,
    occasion: selectedOccasion,
    fabric: selectedFabric,
  });

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
    setSelectedOccasion(
      product.custom_attributes.find(
        (item) => item.attribute_code === "occasion",
      )?.value,
    );
    setSelectedFabric(
      product.custom_attributes.find((item) => item.attribute_code === "fabric")
        ?.value,
    );
  };

  return (
    <>
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Hats: {
                attributeName: "head_accessories_product_type",
                values: headAccessoriesProductTypeFilter(["Hats"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Hats", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Hats");
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
