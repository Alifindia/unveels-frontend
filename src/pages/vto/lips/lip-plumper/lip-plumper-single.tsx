import clsx from "clsx";
import {
  filterTexturesByValue,
  textures,
} from "../../../../api/attributes/texture";
import { Icons } from "../../../../components/icons";
import { useMakeup } from "../../../../context/makeup-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useLipPlumperContext } from "./lip-plumper-context";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function SingleLipPlumperSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>

      <TextureSelector product={product} />

      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useLipPlumperContext();
  const { setLipplumperColor, showLipplumper, setShowLipplumper } = useMakeup();

  function resetColor() {
    if (showLipplumper) {
      setShowLipplumper(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showLipplumper) {
      setShowLipplumper(true);
    }

    setSelectedColor(color);
    setLipplumperColor(color);
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
            resetColor();
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

function TextureSelector({ product }: { product: Product }) {
  const { selectedTexture, setSelectedTexture } = useLipPlumperContext();

  const productTextures = extractUniqueCustomAttributes([product], "texture");

  const textures = filterTexturesByValue(productTextures);
  const { t, i18n } = useTranslation();
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
    selectedColor,
    setSelectedColor,
    selectedTexture,
    setSelectedTexture,
  } = useLipPlumperContext();

  const { setShowLipplumper, setLipplumperColor } = useMakeup();

  useEffect(() => {
    setLipplumperColor(selectedColor || "#ffffff");
    setShowLipplumper(selectedColor != null);
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
          key={item.id}
          product={item}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
