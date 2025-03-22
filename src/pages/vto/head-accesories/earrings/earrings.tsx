import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";
import { Link } from "react-router-dom";
import { EarringsProvider, useEarringsContext } from "./earrings-context";
import { cloneElement, useEffect, useState } from "react";
import { useGlassesQuery } from "../glasses/glasses-query";
import { useGlassesContext } from "../glasses/glasses-context";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useEarringsQuery } from "./earrings-query";
import { filterShapes } from "../../../../api/attributes/shape";
import { colors } from "../../../../api/attributes/color";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { Product } from "../../../../api/shared";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useAccesories } from "../../../../context/accesories-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import {
  handAccessoriesProductTypeFilter,
  headAccessoriesProductTypeFilter,
} from "../../../../api/attributes/accessories";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

export function EarringsSelector() {
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
      <ShapeSelector />
      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useEarringsContext();

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
  const { colorFamily, selectedColor, setSelectedColor } = useEarringsContext();
  const { setShowEarring } = useAccesories();

  const { data } = useEarringsQuery({
    color: colorFamily,
    shape: null,
  });

  useEffect(() => {
    if (selectedColor === null) {
      setShowEarring(false);
    } else {
      setShowEarring(true);
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

const shapes = filterShapes(["Studs", "Cuffs", "Hoops", "Dangling"]);

const shapeIcons: { [key: string]: JSX.Element } = {
  Studs: <Icons.earringStuds />,
  Cuffs: <Icons.earringCuffs />,
  Hoops: <Icons.earringHoops />,
  Dangling: <Icons.earringDanglings />,
};

function ShapeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedShape, setSelectedShape } = useEarringsContext();

  return (
    <div className={clsx(
      "flex w-full items-center overflow-x-auto py-1 2xl:py-2 no-scrollbar",
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
          onClick={() =>
            setSelectedShape(selectedShape == shape.value ? null : shape.value)
          }
        >
          {cloneElement(shapeIcons[shape.label] ?? <Icons.earringStuds />, {
            className: "size-6",
          })}
          <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{shape.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    setColorFamily,
    setSelectedColor,
    selectedShape,
    setSelectedShape,
  } = useEarringsContext();

  const { setShowEarring } = useAccesories();

  useEffect(() => {
    if (selectedProduct != null) {
      setShowEarring(true);
    }
  }, [selectedProduct]);

  const { data, isLoading } = useEarringsQuery({
    color: colorFamily,
    shape: selectedShape,
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
    setSelectedShape(
      product.custom_attributes.find((item) => item.attribute_code === "shape")
        ?.value,
    );
  };

  return (
    <>
      <div className={clsx("w-full", isRTL ? "text-left" : "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Earrings: {
                attributeName: "head_accessories_product_type",
                values: headAccessoriesProductTypeFilter(["Earrings"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Earrings", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Earring");
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