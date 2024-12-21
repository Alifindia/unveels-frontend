import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { useRef, useState } from "react";
import { filterTextures } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { useBlushContext } from "./blush-context";
import { useBlushQuery } from "./blush-query";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { Product } from "../../../../api/shared";

export function BlushSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <ColorSelector />

      <TextureSelector />

      <ShapeSelector />

      <ShadesSelector />

      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const {
    selectedColor,
    setSelectedColor,
    selectedColors,
    setSelectedColors,
    selectedMode,
  } = useBlushContext();
  const { setBlushColor, setShowBlush, showBlush, setBlushMode } = useMakeup();
  const replaceIndexRef = useRef(0);

  const { data } = useBlushQuery({
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  function resetColor() {
    if (showBlush) {
      setShowBlush(false);
    }

    setSelectedColors([]);
  }

  const handleColorClick = (color: string) => {
    if (!showBlush) {
      setShowBlush(true);
    }
    if (selectedColors.includes(color)) {
      // Deselect the color if it's already selected
      setSelectedColors(selectedColors.filter((c) => c !== color));
      setBlushColor(selectedColors.filter((c) => c !== color));
    } else if (selectedMode === "One") {
      setBlushMode("One");
      // In "One" mode, only one color can be selected
      setSelectedColors([color]);
      setBlushColor([color]);
    } else if (selectedMode === "Dual") {
      setBlushMode("Dual");
      if (selectedColors.length < 2) {
        // Add the color if less than two are selected
        setSelectedColors([...selectedColors, color]);
        setBlushColor([...selectedColors, color]);
      } else {
        // Replace the color based on replaceIndexRef
        const newSelectedColors = [...selectedColors];
        newSelectedColors[replaceIndexRef.current] = color;
        setSelectedColors(newSelectedColors);
        setBlushColor(newSelectedColors);
        // Update replaceIndexRef to alternate between 0 and 1
        replaceIndexRef.current = (replaceIndexRef.current + 1) % 2;
      }
    } else if (selectedMode === "Tri") {
      setBlushMode("Tri");
      if (selectedColors.length < 3) {
        setSelectedColors([...selectedColors, color]);
        setBlushColor([...selectedColors, color]);
      } else {
        const newSelectedColors = [...selectedColors];
        newSelectedColors[replaceIndexRef.current] = color;
        setSelectedColors(newSelectedColors);
        setBlushColor(newSelectedColors);
        replaceIndexRef.current =
          replaceIndexRef.current > 1 ? 0 : replaceIndexRef.current + 1;
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-none">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            resetColor();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{
              color: color,
            }}
            selected={selectedColors.includes(color)}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);
function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useBlushContext();
  const { setBlushMaterial } = useMakeup();

  function setMaterial(
    material: number,
    texture: { label: string; value: string },
  ) {
    if (selectedTexture === texture.value) {
      setSelectedTexture(null);
    } else {
      setSelectedTexture(texture.value);
    }
    setBlushMaterial(material);
  }

  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
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

const blushes = [
  "/media/unveels/vto/blushes/blusher-1.png",
  "/media/unveels/vto/blushes/blusher-2.png",
  "/media/unveels/vto/blushes/blusher-3.png",
  "/media/unveels/vto/blushes/blusher-4.png",
  "/media/unveels/vto/blushes/blusher-5.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useBlushContext();
  const { setBlushPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setBlushPattern(pattern);
    setSelectedShape(patternName);
  }

  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {blushes.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === index.toString(),
              },
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img
              src={path}
              alt="Highlighter"
              className="size-[35px] rounded sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const shades: Array<"One" | "Dual" | "Tri"> = ["One", "Dual", "Tri"];

function ShadesSelector() {
  const { setSelectedMode, selectedMode, setSelectedColors, setReplaceIndex } =
    useBlushContext();
  const { setBlushMode, lipColors, setLipColors } = useMakeup();

  function setMode(mode: "One" | "Dual" | "Tri") {
    setSelectedMode(mode);
    if (mode === "One") {
      setBlushMode(mode);
    }
    if (mode == "Tri") {
      setBlushMode(mode);
    }

    if (mode === "One" && lipColors.length > 1) {
      const newColors = [lipColors[0]];
      setSelectedColors(newColors);
      setLipColors(newColors);
      setReplaceIndex(0);
    }
  }

  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
        {shades.map((shade, index) => (
          <button
            key={shade}
            type="button"
            className={clsx(
              "relative inline-flex items-center gap-x-2 rounded-full px-1 py-1 text-center text-sm transition-transform",
              {
                "-translate-y-0.5 text-white": selectedMode === shade,
                "text-white/80": selectedMode !== shade,
              },
            )}
            onClick={() => setMode(shade)}
          >
            {selectedMode === shade ? (
              <div className="absolute inset-0 flex items-center justify-center text-white blur-sm backdrop-blur-sm">
                {shade}
              </div>
            ) : null}
            <span className="relative text-[9.8px] sm:text-sm">{shade}</span>
          </button>
        ))}

        <div className="h-5 border border-r"></div>
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { selectedTexture, setSelectedColors, setSelectedTexture } = useBlushContext();

  const { data, isLoading } = useBlushQuery({
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
