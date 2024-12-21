import clsx from "clsx";
import { useState } from "react";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";
import { LenseProvider, useLenseContext } from "./lense-context";

import { colors } from "../../../../api/attributes/color";
import { useLenseQuery } from "./lense-query";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { Product } from "../../../../api/shared";

export function LenseSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <FamilyColorSelector />

      <ColorSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useLenseContext();

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
          onClick={() => {
            if (colorFamily === item.value) {
              setColorFamily(null);
            } else {
              setColorFamily(colorFamily === item.value ? null : item.value);
            }
          }}
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

const lenses = [
  "/media/unveels/vto/lenses/Group-4.png",
  "/media/unveels/vto/lenses/Group.png",
  "/media/unveels/vto/lenses/Group-1.png",
  "/media/unveels/vto/lenses/Group-2.png",
  "/media/unveels/vto/lenses/Group-3.png",
];

function ColorSelector() {
  const { selectedColor, setSelectedColor } = useLenseContext();
  const { showLens, setShowLens, setLensPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    if (!showLens) {
      setShowLens(true);
    }
    setSelectedColor(patternName);
    setLensPattern(pattern);
  }

  function reset() {
    setShowLens(false);
    setSelectedColor(null);
  }

  return (
    <div className="mx-auto w-full !border-b-0 lg:max-w-xl">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        <button
          type="button"
          className="inline-flex size-[1.875rem] shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80 sm:size-10"
          onClick={() => {
            reset();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {lenses.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80 transition-all",
              {
                "scale-[1.3] border-white/80":
                  selectedColor === index.toString(),
              },
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img src={path} alt="Eyebrow" className="size-[1.875rem] rounded" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    colorFamily,
    setColorFamily,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
  } = useLenseContext();

  const { data, isLoading } = useLenseQuery({
    color: colorFamily,
    // TODO: API doesn't have pattern for lenses
    pattern: null,
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
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
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
