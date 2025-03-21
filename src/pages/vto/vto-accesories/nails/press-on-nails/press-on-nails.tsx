import clsx from "clsx";
import { useEffect, useState } from "react";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";
import {
  PressOnNailsProvider,
  usePressOnNailsContext,
} from "./press-on-nails-context";
import { usePressOnNailsQuery } from "./press-on-nails-query";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { patterns } from "../../../../api/attributes/pattern";
import { colors } from "../../../../api/attributes/color";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { filterShapes } from "../../../../api/attributes/shape";
import { Product } from "../../../../api/shared";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getNailsProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../../utils/other";

export function PressOnNailsSelector() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <ShapeSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t } = useTranslation()
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    usePressOnNailsContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar"
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
  const { colorFamily, selectedColor, setSelectedColor } =
    usePressOnNailsContext();

  const { data } = usePressOnNailsQuery({
    color: colorFamily,
    shape: null,
  });

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
    <div className="mx-auto w-full py-1 sm:py-2">
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

const nailshapes = [
  "/media/unveels/vto/nailshapes/press on nails-1.png",
  "/media/unveels/vto/nailshapes/press on nails-2.png",
  "/media/unveels/vto/nailshapes/press on nails-3.png",
];

const shapes = filterShapes(["Triangle", "Square", "Oval"]);

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = usePressOnNailsContext();
  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {shapes.map((shape, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === shape.value,
              },
            )}
            onClick={() => setSelectedShape(shape.value)}
          >
            <img
              src={nailshapes[index]}
              alt="Highlighter"
              className="size-[35px] rounded sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
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
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedShape,
  } = usePressOnNailsContext();

  const { data, isLoading } = usePressOnNailsQuery({
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
    console.log(product);
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(",")[0],
    );
  };

  return (
    <>
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.625rem] text-white sm:py-2"
          onClick={() => {
            setMapTypes({
              Nail: {
                attributeName: "nails_product_types",
                values: getNailsProductTypeIds(["Press on Nails"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Nail", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Press On Nails");
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
