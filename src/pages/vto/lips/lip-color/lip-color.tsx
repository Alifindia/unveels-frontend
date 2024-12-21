import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { textures } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { useMakeup } from "../../../../context/makeup-context";
import { LipColorProvider, useLipColorContext } from "./lip-color-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useLipColorQuery } from "./lip-color-query";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";

export function LipColorSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <TextureSelector />

      <ShadesSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useLipColorContext();

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
              "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
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
  const {
    setLipColors,
    setLipColorMode,
    setShowLipColor,
    showLipColor,
    lipColors,
  } = useMakeup();
  const {
    selectedColors,
    setSelectedColors,
    selectedMode,
    colorFamily,
    selectedTexture,
  } = useLipColorContext();

  const handleColorClick = (color: string) => {
    if (!showLipColor) setShowLipColor(true);

    // Handle color deselection
    if (selectedColors.includes(color)) {
      const newColors = selectedColors.filter((c) => c !== color);
      setSelectedColors(newColors);
      setLipColors(newColors);
      return;
    }

    // Handle different modes
    const isMultiColorMode =
      selectedMode === "Dual" || selectedMode === "Ombre";
    const maxColors = isMultiColorMode ? 2 : 1;
    setLipColorMode(isMultiColorMode ? "Dual" : "One");

    // Update colors by either adding new color or replacing the oldest one
    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color]; // Remove oldest, add new

    setSelectedColors(newColors);
    setLipColors(newColors);
  };

  const handleClearSelection = () => {
    setSelectedColors([]);

    setShowLipColor(false);
  };

  const { data } = useLipColorQuery({
    color: colorFamily,
    sub_color: null,
    texture: selectedTexture,
  });

  if (!colorFamily) {
    return null;
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={handleClearSelection}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColors.includes(color)}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
      {/* Removed the error message since all buttons are enabled */}
    </div>
  );
}

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useLipColorContext();
  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-1 no-scrollbar">
        {textures.map((texture, index) => (
          <button
            key={texture.label}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
            )}
            onClick={() => {
              if (selectedTexture === texture.value) {
                setSelectedTexture(null);
              } else {
                setSelectedTexture(texture.value);
              }
            }}
          >
            <span className="text-[9.8px] sm:text-sm">{texture.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const shades = ["One", "Dual", "Ombre"];

function ShadesSelector() {
  const { setSelectedMode, selectedMode, setSelectedColors, setReplaceIndex } =
    useLipColorContext();
  const { setLipColorMode, lipColors, setLipColors } = useMakeup();

  function setMode(mode: string) {
    setSelectedMode(mode);
    if (mode == "Dual") {
      setLipColorMode(mode);
    }
    if (mode == "Ombre") {
      setLipColorMode(mode);
    }

    if (mode === "One" && lipColors.length > 1) {
      const newColors = [lipColors[0]];
      setSelectedColors(newColors);
      setLipColors(newColors);
      setReplaceIndex(0);
    }
  }

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
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

  const {
    colorFamily,
    selectedTexture,
    selectedColors,
    setColorFamily,
    setSelectedColors,
    setSelectedTexture,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedMode,
  } = useLipColorContext();

  const { setLipColors, setLipColorMode, setShowLipColor } = useMakeup();

  useEffect(() => {
    setLipColors(selectedColors);
    setLipColorMode(selectedMode as "One" | "Dual" | "Ombre");
    setSelectedColors(selectedColors);
    setShowLipColor(selectedColors.length > 0);
  }, [selectedColors, selectedMode, selectedColors]);

  const { data, isLoading } = useLipColorQuery({
    color: colorFamily,
    sub_color: selectedColors[0],
    texture: selectedTexture,
  });

  console.log({
    colorFamily,
    selectedTexture,
    selectedColors,
    isLoading,
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
    setSelectedColors(
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(","),
    );
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
