import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { ColorPalette } from "../../../../components/color-palette";
import { useBronzerContext } from "./bronzer-context";
import { useMakeup } from "../../../../context/makeup-context";
import { filterTextures } from "../../../../api/attributes/texture";
import { Product } from "../../../../api/shared";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function SingleBronzerSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>
      <ShapeSelector />
      <TextureSelector product={product} />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useBronzerContext();
  const { setBronzerColor, showBronzer, setShowBronzer } = useMakeup();

  function setColor(color: string) {
    if (!showBronzer) {
      setShowBronzer(true);
    }
    setSelectedColor(color);
    setBronzerColor(color);
  }

  function reset() {
    setSelectedColor(null);
    setShowBronzer(false);
  }

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
            onClick={() => {
              setColor(color);
            }}
          />
        ))}
      </div>
    </div>
  );
}

const bronzers = [
  "/media/unveels/vto/bronzers/bronzer-1.png",
  "/media/unveels/vto/bronzers/bronzer-2.png",
  "/media/unveels/vto/bronzers/bronzer-3.png",
  "/media/unveels/vto/bronzers/bronzer-4.png",
  "/media/unveels/vto/bronzers/bronzer-5.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useBronzerContext();
  const { setBronzerPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setBronzerPattern(pattern);
    setSelectedShape(patternName);
  }

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        {bronzers.map((path, index) => (
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
              alt="Eyebrow"
              className="size-[35px] rounded sm:size-[50px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

function TextureSelector({ product }: { product: Product }) {
  const { selectedTexture, setSelectedTexture } = useBronzerContext();
  const { highlighterMaterial, setHighlighterMaterial } = useMakeup();
  const { t, i18n } = useTranslation();
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
            <span className="text-[9.8px] sm:text-sm">{t("texture."+texture.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList({ product }: { product: Product }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const {
    selectedTexture,
    selectedColor,
    setSelectedColor,
    setSelectedTexture,
    selectedShape,
  } = useBronzerContext();

  const { setBronzerColor, setShowBronzer, setBronzerPattern } = useMakeup();

  useEffect(() => {
    setBronzerColor(selectedColor ?? "#ffffff");
    if (selectedShape == null) {
      setBronzerPattern(0);
    }
    setShowBronzer(selectedColor != null);
  }, [selectedColor]);

  const handleProductClick = (product: Product) => {
    console.log(product);
    setSelectedProduct(product);
    setSelectedColor(
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    );
    setSelectedTexture(
      product.custom_attributes.find(
        (item) => item.attribute_code === "texture",
      )?.value,
    );
  };

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {[product].map((item) => (
        <VTOProductCard
          product={product}
          key={product.id}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
