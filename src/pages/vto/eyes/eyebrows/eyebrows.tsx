import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { EyebrowsProvider, useEyebrowsContext } from "./eyebrows-context";
import { useMakeup } from "../../../../context/makeup-context";
import { events } from "@react-three/fiber";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useEyeLinerContext } from "../eye-liners/eye-liner-context";
import { useEyebrowsQuery } from "./eyebrows-query";
import { getPatternByIndex } from "../../../../api/attributes/pattern";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { filterColors } from "../../../../api/attributes/color";
import { ColorPalette } from "../../../../components/color-palette";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";

const colorFamilies = filterColors(["Brown", "Black"]);

export function EyebrowsSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <PatternSelector />

      <BrightnessSlider />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useEyebrowsContext();
  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar"
      data-mode="lip-color"
    >
      {colorFamilies.map((item, index) => (
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
          <span className="text-[0.625rem]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector() {
  const { colorFamily, selectedColor, setSelectedColor } = useEyebrowsContext();
  const { setEyebrowsColor, showEyebrows, setShowEyebrows } = useMakeup();

  const { data, isLoading } = useEyebrowsQuery({
    color: colorFamily,
    pattern: null,
  });

  function reset() {
    if (showEyebrows) {
      setShowEyebrows(false);
    }
    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showEyebrows) {
      setShowEyebrows(true);
    }
    setSelectedColor(color);
    setEyebrowsColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            reset();
          }}
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

function PatternSelector() {
  const { selectedPattern, setSelectedPattern } = useEyebrowsContext();
  const { setEyebrowsPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setSelectedPattern(patternName);
    setEyebrowsPattern(pattern);
  }
  return (
    <div className="mx-auto w-full py-4">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
        {[...Array(14)].map((_, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80",
              {
                "border-white/80": selectedPattern === index.toString(),
              },
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img
              src={`/media/unveels/vto/eyebrows/${index % 8}.png`}
              alt="Eyebrow"
              className="h-[14px] w-[38.5px] rounded sm:h-[20px] sm:w-[55px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function BrightnessSlider() {
  const { setEyebrowsVisibility, eyebrowsVisibility } = useMakeup();
  return (
    <div className="py-2">
      <input
        id="minmax-range"
        type="range"
        min="0.1"
        max="1"
        step="0.1"
        className="h-1 w-full cursor-pointer rounded-lg bg-gray-200 accent-[#CA9C43]"
        onChange={(e) => {
          setEyebrowsVisibility(parseFloat(e.currentTarget.value));
        }}
        value={eyebrowsVisibility}
      />
      <div className="flex justify-between text-[0.5rem]">
        <label htmlFor="minmax-range" className="text-white/80">
          Light
        </label>
        <label htmlFor="minmax-range" className="text-white/80">
          Dark
        </label>
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    selectedPattern,
  } = useEyebrowsContext();

  const { data, isLoading } = useEyebrowsQuery({
    color: colorFamily,
    pattern: selectedPattern
      ? getPatternByIndex("eyebrows", parseInt(selectedPattern)).value
      : null,
  });

  const { setEyebrowsColor, setEyebrowsPattern, setShowEyebrows } = useMakeup();

  useEffect(() => {
    setEyebrowsColor(selectedColor || "#ffffff");
    setEyebrowsPattern(parseInt(selectedPattern || "0"));
    setShowEyebrows(selectedColor != null && selectedPattern != null);
  }, [selectedColor, selectedPattern]);

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
