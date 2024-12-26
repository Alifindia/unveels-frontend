import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { ColorPalette } from "../../../../components/color-palette";
import { ContourProvider, useContourContext } from "./contour-context";
import { useMakeup } from "../../../../context/makeup-context";
import {
  filterTextures,
  filterTexturesByValue,
} from "../../../../api/attributes/texture";
import { Product } from "../../../../api/shared";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";

export function SingleContourSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>
      <ModeSelector />
      <ShapeSelector />
      <TextureSelector product={product} />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const {
    setContourColors,
    setContourMode,
    setShowContour,
    showContour,
    contourColors,
  } = useMakeup();
  const { selectedColors, setSelectedColors, selectedMode } =
    useContourContext();

  const extracted_sub_colors = extractUniqueCustomAttributes(
    [product],
    "hexacode",
  ).flatMap((color) => color.split(","));

  const handleColorClick = (color: string) => {
    if (!showContour) setShowContour(true);

    if (selectedColors.includes(color)) {
      const newColors = selectedColors.filter((c) => c !== color);
      setSelectedColors(newColors);
      setContourColors(newColors);
      return;
    }

    const isMultiColorMode = selectedMode === "Dual";
    const maxColors = isMultiColorMode ? 2 : 1;
    setContourMode(isMultiColorMode ? "Dual" : "One");

    const newColors =
      selectedColors.length < maxColors
        ? [...selectedColors, color]
        : [...selectedColors.slice(1), color];

    setSelectedColors(newColors);
    setContourColors(newColors);
  };

  const handleClearSelection = () => {
    setSelectedColors([]);
    setShowContour(false);
  };

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
            size="large"
            palette={{ color }}
            selected={selectedColors.includes(color)}
            key={color}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
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
    if (mode == "One" && contourColors.length > 1) {
      setContourMode(mode);
      setSelectedColors([contourColors[0]]);
      setContourColors([contourColors[0]]);
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

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
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
            onClick={() => {
              setContourShape(index.toString());
              setSelectedShape(index.toString());
            }}
          >
            <img
              src={path}
              alt="Contour shape"
              className="size-[35px] rounded sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function TextureSelector({ product }: { product: Product }) {
  const { selectedTexture, setSelectedTexture } = useContourContext();
  const { setHighlighterMaterial } = useMakeup();

  const productTextures = extractUniqueCustomAttributes([product], "texture");

  const textures = filterTexturesByValue(productTextures);

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
            onClick={() => {
              if (selectedTexture === texture.value) {
                setSelectedTexture(null);
              } else {
                setSelectedTexture(texture.value);
                setHighlighterMaterial(index);
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

function ProductList({ product }: { product: Product }) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {[product].map((product) => (
        <VTOProductCard product={product} key={product.id} />
      ))}
    </div>
  );
}
