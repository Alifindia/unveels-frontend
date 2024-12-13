import clsx from "clsx";
import { textures } from "../../../../api/attributes/texture";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { useMakeup } from "../../../../context/makeup-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useLipPlumperContext } from "./lip-plumper-context";
import { useLipPlumperQuery } from "./lip-plumper-query";
import { ColorPalette } from "../../../../components/color-palette";

export function LipPlumperSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector />
      </div>

      <TextureSelector />

      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const { selectedColor, setSelectedColor } = useLipPlumperContext();

  const { setLipplumperColor, showLipplumper, setShowLipplumper } = useMakeup();

  const { data } = useLipPlumperQuery({
    hexacode: null,
    texture: null,
  });

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
    console.log(color, "setColor");
    
    setSelectedColor(color);
    setLipplumperColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  );

  console.log({
    extracted_sub_colors,
  });

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

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useLipPlumperContext();
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

function ProductList() {
  const { selectedColor, selectedTexture } = useLipPlumperContext();

  const { data, isLoading } = useLipPlumperQuery({
    hexacode: selectedColor,
    texture: selectedTexture,
  });

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {isLoading ? (
        <LoadingProducts />
      ) : (
        data?.items.map((product, index) => {
          return <VTOProductCard key={product.id} product={product} />;
        })
      )}
    </div>
  );
}
