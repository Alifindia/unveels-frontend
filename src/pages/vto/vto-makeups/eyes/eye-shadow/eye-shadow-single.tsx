import clsx from "clsx";
import { useEffect } from "react";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useEyeShadowContext } from "./eye-shadow-context";
import { useMakeup } from "../../../../context/makeup-context";
import { filterTextures } from "../../../../api/attributes/texture";
import { Product } from "../../../../api/shared";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { ColorPalette } from "../../../../components/color-palette";

export function SingleEyeShadowSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>
      <TextureSelector product={product} />
      <ModeSelector />
      <ProductList product={product} />
    </div>
  );
}

const maxColorsMap: { [key: string]: number } = {
  One: 1,
  Dual: 2,
  Tri: 3,
  Quadra: 4,
  Tetra: 5,
};

function ColorSelector({ product }: { product: Product }) {
  const { selectedMode, selectedColors, setSelectedColors } =
    useEyeShadowContext();
  // const { setEyeshadowColors, showEyeshadow, setShowEyeshadow } = useMakeup();

  const maxColors = maxColorsMap[selectedMode] || 1;

  const handleClearSelection = () => {
    // if (showEyeshadow) {
    //   setShowEyeshadow(false);
    // }
    setSelectedColors([]);
  };

  const handleColorClick = (color: string) => {
    // if (!showEyeshadow) {
    //   setShowEyeshadow(true);
    // }

    if (selectedColors.includes(color)) {
      const newColors = selectedColors.filter((c) => c !== color);
      setSelectedColors(newColors);
      // setEyeshadowColors(newColors);
      return;
    }

    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color];

    setSelectedColors(newColors);
    // setEyeshadowColors(newColors);
  };

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
    </div>
  );
}

function TextureSelector({ product }: { product: Product }) {
  const { selectedTexture, setSelectedTexture } = useEyeShadowContext();
  // const { setEyeshadowMaterial } = useMakeup();

  const productTextures = extractUniqueCustomAttributes([product], "texture");
  const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
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
                // setEyeshadowMaterial(index);
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
  // const { setEyeshadowPattern } = useMakeup();

  const currentMode = modes.find((m) => m.name === selectedMode) ?? null;

  return (
    <>
      <div className="mx-auto w-full py-1 sm:py-2">
        <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
          {modes.map((mode) => (
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
      {currentMode && (
        <div className="mx-auto w-full py-1 sm:py-2">
          <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
            {[...Array(currentMode.count)].map((_, index) => (
              <button
                key={index}
                type="button"
                className={clsx(
                  "inline-flex shrink-0 items-center gap-x-2 text-white/80",
                  {
                    "border-white/80":
                      modeIndex.toString() === index.toString(),
                  },
                )}
                onClick={() => {
                  setSelectModeIndex(index + 1);
                  // setEyeshadowPattern(index);
                }}
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
      )}
    </>
  );
}

function ProductList({ product }: { product: Product }) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {[product].map((item) => (
        <VTOProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
