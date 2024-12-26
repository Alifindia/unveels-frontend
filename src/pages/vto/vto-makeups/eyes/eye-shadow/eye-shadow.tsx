import clsx from "clsx";
import { useEffect } from "react";
import { colors } from "../../../../api/attributes/color";
import { filterTextures } from "../../../../api/attributes/texture";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { EyeShadowProvider, useEyeShadowContext } from "./eye-shadow-context";
import { useEyeshadowsQuery } from "./eye-shadow-query";
import { ColorPalette } from "../../../../components/color-palette";

export function EyeShadowSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector />
      </div>

      <TextureSelector />

      <ModeSelector />

      <ProductList />
    </div>
  );
}

const maxColorsMap: {
  [key: string]: number;
} = {
  One: 1,
  Dual: 2,
  Tri: 3,
  Quadra: 4,
  Tetra: 5,
};

function ColorSelector() {
  const { selectedMode, colorFamily, selectedColors, setSelectedColors } =
    useEyeShadowContext();

  const { data } = useEyeshadowsQuery({
    color: null,
    hexcodes: null,
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const maxColors = maxColorsMap[selectedMode] || 1;

  const handleColorClick = (color: string) => {
    // Handle color deselection
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
      return;
    }

    // Update colors by either adding new color or replacing the oldest one
    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color]; // Remove oldest, add new

    setSelectedColors(newColors);
  };

  useEffect(() => {
    const maxColors = maxColorsMap[selectedMode] || 1;

    if (selectedColors.length > maxColors) {
      setSelectedColors(selectedColors.slice(0, maxColors));
    }
  }, [selectedMode, selectedColors, setSelectedColors]);

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            setSelectedColors([]);
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {/* {renderPaletteItems()} */}
        {extracted_sub_colors
          ? extracted_sub_colors.map((color, index) => (
              <ColorPalette
                key={color}
                size="large"
                selected={selectedColors.includes(color)}
                palette={{ color }}
                onClick={() => handleColorClick(color)}
              />
            ))
          : null}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useEyeShadowContext();
  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-1 no-scrollbar">
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

const modes = [
  { name: "One", count: 4 },
  { name: "Dual", count: 4 },
  { name: "Tri", count: 4 },
  { name: "Quadra", count: 4 },
  { name: "Tetra", count: 3 },
];

function ModeSelector() {
  const { setMode, selectedMode, modeIndex, setSelectModeIndex } =
    useEyeShadowContext();

  const currentMode = modes.find((m) => m.name === selectedMode) ?? null;

  return (
    <>
      <div className="mx-auto w-full py-1 sm:py-2">
        <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
          {modes.map((mode, index) => (
            <button
              key={mode.name}
              type="button"
              className={clsx(
                "relative inline-flex items-center gap-x-2 rounded-full px-1 py-1 text-center text-sm transition-transform",
                {
                  "-translate-y-0.5 text-white": selectedMode === mode.name,
                  "text-white/80": selectedMode !== mode.name,
                },
              )}
              onClick={() => setMode(mode.name)}
            >
              {selectedMode === mode.name ? (
                <div className="absolute inset-0 flex items-center justify-center text-white blur-sm backdrop-blur-sm">
                  {mode.name}
                </div>
              ) : null}
              <span className="relative text-[9.8px] sm:text-sm">
                {mode.name}
              </span>
            </button>
          ))}

          <div className="h-5 border border-r"></div>
        </div>
      </div>
      {currentMode ? (
        <div className="mx-auto w-full py-1 sm:py-2">
          <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
            {[...Array(currentMode.count)].map((_, index) => (
              <button
                key={index}
                type="button"
                className={clsx(
                  "inline-flex shrink-0 items-center gap-x-2 border border-transparent text-white/80",
                  {
                    "border-white/80":
                      modeIndex.toString() === index.toString(),
                  },
                )}
                onClick={() => setSelectModeIndex(index)}
              >
                <img
                  src={`/media/unveels/vto/eyeshadows/eyeshadow-${currentMode.name.toLowerCase()}-${index + 1}.png`}
                  alt="Eye shadow"
                  className="size-[35px] shrink-0 sm:size-[50px] lg:size-[65px]"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProductList() {
  const { selectedTexture, selectedColors } = useEyeShadowContext();

  const { data, isLoading } = useEyeshadowsQuery({
    color: null,
    hexcodes: selectedColors,
    texture: selectedTexture,
  });

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {isLoading ? (
        <LoadingProducts />
      ) : (
        data?.items.map((product, index) => {
          return <VTOProductCard product={product} key={product.id} />;
        })
      )}
    </div>
  );
}
