import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { ColorPalette } from "../../../../components/color-palette";
import { ContourProvider, useContourContext } from "./contour-context";
import { useRef, useState } from "react";
import { useMakeup } from "../../../../context/makeup-context";
import { useQuery } from "@tanstack/react-query";
import { faceMakeupProductTypesFilter } from "../../../../api/attributes/makeups";
import {
  baseUrl,
  buildSearchParams,
  extractUniqueCustomAttributes,
  getProductAttributes,
  mediaUrl,
} from "../../../../utils/apiUtils";
import { defaultHeaders, Product } from "../../../../api/shared";
import { useCountdown } from "../../../../hooks/useCountdown";
import { LoadingProducts } from "../../../../components/loading";
import { BrandName } from "../../../../components/product/brand";
import { filterTextures } from "../../../../api/attributes/texture";
import Textures from "three/src/renderers/common/Textures.js";
import { useContourQuery } from "./contour-query";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";

export function ContourSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <ColorSelector />
      <ModeSelector />
      <ShapeSelector />
      <TextureSelector />
      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const {
    setContourColors,
    setContourMode,
    setShowContour,
    showContour,
    contourColors,
  } = useMakeup();
  const { selectedColors, setSelectedColors, selectedMode } =
    useContourContext();

  const { data } = useContourQuery({
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const handleColorClick = (color: string) => {
    if (!showContour) {
      setShowContour(true);
    }
    // Handle color deselection
    if (selectedColors.includes(color)) {
      const newColors = selectedColors.filter((c) => c !== color);
      setSelectedColors(newColors);
      setContourColors(newColors);
      return;
    }

    // Handle different modes
    const isMultiColorMode = selectedMode === "Dual";
    const maxColors = isMultiColorMode ? 2 : 1;

    setContourMode(isMultiColorMode ? "Dual" : "One");

    // Update colors by either adding new color or replacing the oldest one
    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color]; // Remove oldest, add new

    setSelectedColors(newColors);
    setContourColors(newColors);
  };

  const handleClearSelection = () => {
    setSelectedColors([]);
    setShowContour(false);
  };

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={handleClearSelection}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            size="large"
            palette={{ color }}
            selected={selectedColors.includes(color)}
            key={color}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
      {/* Removed the error message since all buttons are enabled */}
    </div>
  );
}

const modes = ["One", "Dual"];

function ModeSelector() {
  const { selectedMode, setSelectedMode, selectedColors, setSelectedColors } =
    useContourContext();
  const { setContourMode, contourColors, setContourColors } = useMakeup();

  function setMode(mode: string) {
    setSelectedMode(mode);

    if (mode == "One") {
      setContourMode(mode);
      if (selectedMode === "One" && contourColors.length > 1) {
        setSelectedColors([contourColors[0]]);
        setContourColors([contourColors[0]]);
      }
    }
  }

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={clsx(
              "relative inline-flex items-center gap-x-2 rounded-full px-1 py-1 text-center text-sm transition-transform",
              {
                "-translate-y-0.5 text-white": selectedMode === mode,
                "text-white/80": selectedMode !== mode,
              },
            )}
            onClick={() => setMode(mode)}
          >
            {selectedMode === mode ? (
              <div className="absolute inset-0 flex items-center justify-center text-white blur-sm backdrop-blur-sm">
                {mode}
              </div>
            ) : null}
            <span className="relative text-[9.8px] sm:text-sm">{mode}</span>
          </button>
        ))}

        <div className="h-5 border border-r"></div>
      </div>
    </div>
  );
}

const contours = [
  "/media/unveels/vto/contours/contour-1.png",
  "/media/unveels/vto/contours/contour-2.png",
  "/media/unveels/vto/contours/contour-3.png",
  "/media/unveels/vto/contours/contour-4.png",
  "/media/unveels/vto/contours/contour-5.png",
  "/media/unveels/vto/contours/contour-6.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useContourContext();
  const { setContourShape } = useMakeup();

  function setShape(shape: string) {
    setContourShape(shape);
    setSelectedShape(shape);
  }

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        {contours.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === index.toString(),
              },
            )}
            onClick={() => setShape(index.toString())}
          >
            <img
              src={path}
              alt="Eyebrow"
              className="size-[35px] rounded sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useContourContext();
  const { highlighterMaterial, setHighlighterMaterial } = useMakeup();

  function setMaterial(
    material: number,
    texture: { label: string; value: string },
  ) {
    if (selectedTexture === texture.value) {
      setSelectedTexture(null);
    } else {
      setSelectedTexture(texture.value);
    }
    setHighlighterMaterial(material);
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2 no-scrollbar">
        {textures.map((texture, index) => (
          <button
            key={texture.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
            )}
            onClick={() => setMaterial(index, texture)}
          >
            <span className="text-[9.8px] sm:text-sm">{texture.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { selectedTexture, setSelectedColors, setSelectedTexture } = useContourContext();

  const { data, isLoading } = useContourQuery({
    texture: selectedTexture,
  });

  const handleProductClick = (product: Product) => {
    console.log(product);
    setSelectedProduct(product);
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
