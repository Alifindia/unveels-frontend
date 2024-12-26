import clsx from "clsx";
import { useEffect, useState } from "react";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";
import { LenseProvider, useLenseContext } from "./lense-context";

import { colors } from "../../../../api/attributes/color";
import { useLenseQuery } from "./lense-query";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";

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
  const { colorFamily, setColorFamily } = useLenseContext();

  return (
    <div
      className="flex items-center w-full space-x-2 overflow-x-auto no-scrollbar py-2"
      data-mode="lip-color"
    >
      {colors.map((item, index) => (
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-white/80 h-5",
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
    console.log(pattern, patternName)
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
    <div className="w-full mx-auto lg:max-w-xl !border-b-0">
      <div className="flex items-center w-full space-x-4 overflow-x-auto no-scrollbar py-2.5">
        <button
          type="button"
          className="inline-flex size-[1.875rem] sm:size-10 shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
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
                "border-white/80 scale-[1.3]": selectedColor === index.toString(),
              },
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img src={path} alt="Eyebrow" className="rounded size-[1.875rem]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { selectedProductNumber, setSelectedProductNumber } = useSelecProductNumberContext()
  const { showLens, setShowLens, setLensPattern } = useMakeup();

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

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
          )?.value || null
        );
        setColorFamily(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "color",
          )?.value || null
        );
      }
    }
  }, [data, selectedProductNumber]);
  
  const handleProductClick = (product: Product) => {
    if (selectedProduct?.id === product.id) {
      setShowLens(false);
      setSelectedProduct(null);
      setSelectedProductNumber(null);
      setColorFamily(null);
      setSelectedColor(null);
      return
    }
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
    <div className="flex w-full gap-2 sm:gap-4 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing">
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
  );
}
