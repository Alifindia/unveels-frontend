import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";

import {
  HighlighterProvider,
  useHighlighterContext,
} from "./highlighter-context";
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
import { BrandName } from "../../../../components/product/brand";
import { LoadingProducts } from "../../../../components/loading";
import { filterTextures } from "../../../../api/attributes/texture";
import { useFaceHighlighterQuery } from "./highlighter-query";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";

export function HighlighterSelector() {
  return (
    <div className="mx-auto w-full px-4">
      <ColorSelector />

      <TextureSelector />

      <ShapeSelector />

      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const { selectedColor, setSelectedColor } = useHighlighterContext();
  const {
    highlighterColor,
    setHighlighterColor,
    showHighlighter,
    setShowHighlighter,
  } = useMakeup();

  const { data, isLoading } = useFaceHighlighterQuery({
    hexacode: null,
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((color) => color.split(","));

  function reset() {
    if (showHighlighter) {
      setShowHighlighter(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showHighlighter) {
      setShowHighlighter(true);
    }

    setHighlighterColor(color);
    setSelectedColor(color);
  }

  return (
    <div className="mx-auto w-full border-b">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
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
            palette={{
              color: color,
            }}
            selected={selectedColor === color}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useHighlighterContext();
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
    <div className="mx-auto w-full border-b">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4">
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

const highlighters = [
  "/media/unveels/vto/highlighters/highlighter-1.png",
  "/media/unveels/vto/highlighters/highlighter-2.png",
  "/media/unveels/vto/highlighters/highlighter-3.png",
  "/media/unveels/vto/highlighters/highlighter-4.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useHighlighterContext();
  const { setHighlighterPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setSelectedShape(patternName);
    setHighlighterPattern(pattern);
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        {highlighters.map((path, index) => (
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

function ProductList() {
  const { selectedTexture, selectedColor } = useHighlighterContext();

  const { data, isLoading } = useFaceHighlighterQuery({
    hexacode: selectedColor,
    texture: selectedTexture,
  });

  return (
    <div className="flex w-full gap-2 overflow-x-auto no-scrollbar active:cursor-grabbing sm:gap-4">
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
