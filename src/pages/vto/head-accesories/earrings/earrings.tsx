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

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);
  
  return (
    <div className="mx-auto w-full divide-y px-2">
      <FamilyColorSelector />
      <ColorSelector />
      <ShapeSelector />
      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useEarringsContext();

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
    <div className="mx-auto w-full py-1 lg:py-1.5">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => setSelectedColor(null)}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
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
  const { selectedShape, setSelectedShape } = useEarringsContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
      {shapes.map((shape, index) => (
        <button
          key={shape.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedShape === shape.value,
            },
          )}
          onClick={() =>
            setSelectedShape(selectedShape == shape.value ? null : shape.value)
          }
        >
          {cloneElement(shapeIcons[shape.label] ?? <Icons.earringStuds />, {
            className: "size-6",
          })}
          <span className="text-[9.8px] xl:text-xs 2xl:text-sm">{shape.label}</span>
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
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.625rem] text-white sm:py-0.5"
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
