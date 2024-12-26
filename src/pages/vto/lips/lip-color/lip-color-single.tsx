import clsx from "clsx";
import { filterTexturesByValue } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { useMakeup } from "../../../../context/makeup-context";
import { useLipColorContext } from "./lip-color-context";

import { Product } from "../../../../api/shared";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";

export function SingleLipColorSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>

      <TextureSelector product={product} />

      <ShadesSelector product={product} />

      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const {
    setLipColors,
    setLipColorMode,
    setShowLipColor,
    showLipColor,
    lipColors,
  } = useMakeup();
  const { selectedColors, setSelectedColors, selectedMode, colorFamily } =
    useLipColorContext();

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

  const extracted_sub_colors = extractUniqueCustomAttributes(
    [product],
    "hexacode",
  ).flatMap((color) => color.split(","));

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
            key={color}
            onClick={() => handleColorClick(color)}
            size="large"
            palette={{ color }}
            selected={selectedColors.includes(color)}
          />
        ))}
      </div>
      {/* Removed the error message since all buttons are enabled */}
    </div>
  );
}

function TextureSelector({ product }: { product: Product }) {
  const { selectedTexture, setSelectedTexture } = useLipColorContext();

  const productTextures = extractUniqueCustomAttributes([product], "texture");

  const textures = filterTexturesByValue(productTextures);

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
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

function ShadesSelector({ product }: { product: Product }) {
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

function ProductList({ product }: { product: Product }) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {[product].map((product, index) => {
        return <VTOProductCard product={product} key={product.id} />;
      })}
    </div>
  );
}
