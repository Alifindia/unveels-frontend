import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";

import { WatchesProvider, useWatchesContext } from "./watches-context";
import { cloneElement, useEffect, useState } from "react";
import { useWatchesQuery } from "./watches-query";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { colors } from "../../../../api/attributes/color";
import { filterShapes } from "../../../../api/attributes/shape";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { filterMaterials } from "../../../../api/attributes/material";
import { Product } from "../../../../api/shared";
import { useGlassesContext } from "../../head-accesories/glasses/glasses-context";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useAccesories } from "../../../../context/accesories-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { handAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

export function WatchesSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <FamilyColorSelector />
      <ColorSelector />
      <ModeSelector />
      <WatchesProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useWatchesContext();

  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2 no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
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
              "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-white/80",
              {
                "border-white/80": colorFamily === item.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
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
            <span className="text-[0.625rem]">{t("color." + item.label)}</span>
          </button>
        ))}
    </div>
  );
}

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, selectedColor, setSelectedColor } = useWatchesContext();
  const { setShowWatch } = useAccesories();

  const { data } = useWatchesQuery({
    color: colorFamily,
    material: null,
    shape: null,
  });

  useEffect(() => {
    if (selectedColor === null) {
      setShowWatch(false);
    } else {
      setShowWatch(true);
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
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-0.5 no-scrollbar",
        isRTL ? "space-x-reverse space-x-3 sm:space-x-reverse sm:space-x-4" : "space-x-3 sm:space-x-4"
      )}>
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedMode, setSelectedMode } = useWatchesContext();

  return (
    <>
      <div className="flex h-[30px] w-full items-center justify-between text-center sm:h-[35px]" dir={isRTL ? "rtl" : "ltr"}>
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "shapes",
              "text-white/60": selectedMode !== "shapes",
            }
          )}
          onClick={() => setSelectedMode("shapes")}
        >
          Shapes
        </button>
        <div className="h-5 border-r border-white"></div>
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "material",
              "text-white/60": selectedMode !== "material",
            }
          )}
          onClick={() => setSelectedMode("material")}
        >
          Material
        </button>
      </div>

      {selectedMode === "shapes" ? <ShapeSelector /> : <MaterialSelector />}
    </>
  );
}

const shapes = filterShapes([
  "Round",
  "Square",
  "Oval",
  "Rectangular",
  "Tonneau",
  "Avantgarde",
]);

const shapeIcons: { [key: string]: JSX.Element } = {
  Round: <Icons.watchshapeCircle />,
  Square: <Icons.watchshapeSquare />,
  Oval: <Icons.watchshapeOval />,
  Rectangular: <Icons.watchshapeRectangle />,
  Tonneau: <Icons.watchshapeTonneau />,
  Avantgarde: <Icons.watchshapeAvantgarde />,
};

function ShapeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedShape, setSelectedShape } = useWatchesContext();

  return (
    <div className={clsx(
      "flex w-full items-center overflow-x-auto !border-t-0 py-2 no-scrollbar",
      isRTL ? "space-x-reverse space-x-2" : "space-x-2"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {shapes.map((shape, index) => (
        <button
          key={shape.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedShape === shape.value,
            },
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
          onClick={() => setSelectedShape(shape.value)}
        >
          {cloneElement(shapeIcons[shape.label] ?? <Icons.watchshapeCircle />, {
            className: "size-4 sm:size-6",
          })}
          <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{shape.label}</span>
        </button>
      ))}
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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedMaterial, setSelectedMaterial } = useWatchesContext();

  return (
    <div className={clsx(
      "flex w-full items-center overflow-x-auto !border-t-0 py-2 no-scrollbar",
      isRTL ? "space-x-reverse space-x-2" : "space-x-2"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {materials.map((material, index) => (
        <button
          key={material.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedMaterial === material.value,
            },
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
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

function WatchesProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamilyToInclude,
    setColorFamilyToInclude,
    colorFamily,
    setColorFamily,
    setSelectedColor,
    selectedShape,
    selectedMaterial,
    setSelectedMaterial,
  } = useWatchesContext();

  const { setShowWatch } = useAccesories();

  const { data, isLoading } = useWatchesQuery({
    color: colorFamily,
    material: selectedMaterial,
    shape: selectedShape,
  });

  useEffect(() => {
    if (selectedProduct == null && colorFamily == null) return;
    console.log("set product");

    setShowWatch(true);
  }, [selectedProduct]);

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
    );
  }

  const handleProductClick = (product: Product) => {
    console.log(product);
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
      <div className={clsx("w-full", isRTL ? "text-left" : "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Watches: {
                attributeName: "hand_accessories_product_type",
                values: handAccessoriesProductTypeFilter(["Watches"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Watches", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Watch");
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