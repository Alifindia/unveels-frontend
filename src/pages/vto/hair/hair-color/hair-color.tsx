import clsx from "clsx";

import { colors } from "../../../../api/attributes/color";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useHairColorContext } from "./hair-color-context";
import { useHairColorQuery } from "./hair-color-query";
import { useMakeup } from "../../../../context/makeup-context";
import { useState } from "react";
import { Product } from "../../../../api/shared";

export function HairColorSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } = useHairColorContext();

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
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent px-3 py-1 text-sm text-white/80",
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

const haircolors = [
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 1.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 2.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 3.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 4.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 5.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 6.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 7.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 8.png",
];

const colorList = [
  "#d9be95",
  "#784405",
  "#403007",
  "#403007",
  "#181305",
  "#181305",
  "#b7a189",
  "#483209",
];

function ColorSelector() {
  const { hairColor, setHairColor, showHair, setShowHair } = useMakeup();
  const { selectedColor, setSelectedColor } = useHairColorContext();

  function setColor(color: number) {
    if (!showHair) {
      setShowHair(true);
    }
    setSelectedColor(color.toString());
    setHairColor(colorList[color]);
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        {haircolors.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedColor === index.toString(),
              },
            )}
            onClick={() => setColor(index)}
          >
            <img
              src={path}
              alt="Hair Color"
              className="h-[31.5px] w-[41.3px] rounded object-cover sm:h-[45px] sm:w-[59px] lg:h-[58.5px] lg:w-[76.7px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { colorFamily } = useHairColorContext();

  const { data, isLoading } = useHairColorQuery({
    color: colorFamily,
    shape: null,
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
