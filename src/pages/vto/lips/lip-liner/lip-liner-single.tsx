import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useLipLinerContext } from "./lip-liner-context";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { useEffect, useState } from "react";

export function SingleLipLinerSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>

      <SizeSelector product={product} />

      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { colorFamily, selectedColor, setSelectedColor } = useLipLinerContext();
  const { setLiplinerColor, showLipliner, setShowLipliner } = useMakeup();

  function resetColor() {
    if (showLipliner) {
      setShowLipliner(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showLipliner) {
      setShowLipliner(true);
    }

    setSelectedColor(color);
    setLiplinerColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    [product],
    "hexacode",
  ).flatMap((color) => color.split(","));

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={resetColor}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColor === color}
            onClick={() => setColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

const lipLinerSizes = [
  "Small",
  "Upper Lip",
  "Large Lower",
  "Large Narrower",
  "Large & Full",
  "Wider",
];

function SizeSelector({ product }: { product: Product }) {
  const { selectedSize, setSelectedSize } = useLipLinerContext();
  const { liplinerPattern, setLiplinerPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setLiplinerPattern(pattern);
    setSelectedSize(patternName);
  }

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {lipLinerSizes.map((size, index) => (
          <button
            key={size}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": selectedSize === size,
              },
            )}
            onClick={() => setPattern(index, size)}
          >
            <img
              src={`/media/unveels/vto/lipliners/lipliner ${size.toLowerCase()}.png`}
              alt={size}
              className="size-[35px] shrink-0 sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList({ product }: { product: Product }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedSize: selectedShade,
  } = useLipLinerContext();

  const { setLiplinerColor, setLiplinerPattern, setShowLipliner } = useMakeup();

  useEffect(() => {
    setLiplinerColor(selectedColor || "#ffffff");
    const pattern = lipLinerSizes.findIndex((s) => s == selectedShade);
    setLiplinerPattern(pattern != -1 ? pattern : 1);
    setShowLipliner(selectedColor != null);
  }, [selectedColor, selectedShade]);

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
      {[product].map((item) => (
        <VTOProductCard
          product={item}
          key={item.id}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
