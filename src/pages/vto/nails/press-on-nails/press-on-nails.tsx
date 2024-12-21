import clsx from "clsx";
import { useState } from "react";
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

export function PressOnNailsSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
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
  const { colorFamily, setColorFamily, colorFamilyToInclude } = usePressOnNailsContext();

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
          onClick={() => setColorFamily(colorFamily === item.value ? null : item.value)}
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
  const { colorFamily, selectedColor, setSelectedColor } =
    usePressOnNailsContext();

  const { data } = usePressOnNailsQuery({
    color: colorFamily,
    shape: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className="inline-flex size-[1.875rem] shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80 sm:size-10"
          onClick={() => {
            setSelectedColor(null);
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>

        {extracted_sub_colors.map((color, index) => (
          <button
            key={color}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80",
              {
                "border-white/80": selectedColor === color,
              },
            )}
            style={{ background: color }}
            onClick={() => {
              if (selectedColor === color) {
                setSelectedColor(null);
              } else {
                setSelectedColor(color);
              }
            }}
          ></button>
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { colorFamily, setColorFamily, setSelectedColors, setSelectedTexture, colorFamilyToInclude, setColorFamilyToInclude, selectedShape } = usePressOnNailsContext();

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
    setSelectedColors([
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    ]);
    setSelectedTexture(
      product.custom_attributes.find(
        (item) => item.attribute_code === "texture",
      )?.value,
    );
  };

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {isLoading ? (
        <LoadingProducts />
      ) : (
        data?.items.map((product, index) => {
          return (
            <VTOProductCard
              product={product}
              key={product.id}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              onClick={() => handleProductClick(product)}
            />
          );
        })
      )}
    </div>
  );
}
