import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { filterMaterials } from "../../../../api/attributes/material";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useHandwearContext } from "./handwear-context";
import { ColorPalette } from "../../../../components/color-palette";

export function SingleHandwearSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>
      <MaterialSelector />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useHandwearContext();

  const handleClearSelection = () => {
    setSelectedColor(null);
  };

  const handleColorSelection = (color: string) => {
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
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
            selected={selectedColor === color}
            onClick={() => handleColorSelection(color)}
          />
        ))}
      </div>
    </div>
  );
}

const materials = filterMaterials([
  "Silver",
  "Silver Plated",
  "Gold Plated",
  "Brass",
  "Stainless",
]);

function MaterialSelector() {
  const { selectedMaterial, setSelectedMaterial } = useHandwearContext();

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {materials.map((material) => (
          <button
            key={material.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedMaterial === material.value,
              },
            )}
            onClick={() => {
              if (selectedMaterial === material.value) {
                setSelectedMaterial(null);
              } else {
                setSelectedMaterial(material.value);
              }
            }}
          >
            <span className="text-[9.8px] sm:text-sm">{material.label}</span>
          </button>
        ))}
      </div>
    </div>
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
