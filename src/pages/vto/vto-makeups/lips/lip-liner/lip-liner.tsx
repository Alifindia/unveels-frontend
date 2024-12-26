import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { useMakeup } from "../../../../context/makeup-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useLipLinerContext } from "./lip-liner-context";
import { useLipLinerQuery } from "./lip-liner-query";
import { ColorPalette } from "../../../../components/color-palette";

export function LipLinerSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <SizeSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useLipLinerContext();
  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar"
      data-mode="lip-color"
    >
      {colors.map((item, index) => (
        <button
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
            {
              "border-white/80": colorFamily === item.value,
            },
          )}
          onClick={() => setColorFamily(item.value)}
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
  const { colorFamily, selectedColor, setSelectedColor } = useLipLinerContext();
  const { setLiplinerColor, showLipliner, setShowLipliner } = useMakeup();

  const { data } = useLipLinerQuery({
    color: colorFamily,
    sub_color: null,
    texture: null,
  });

  function resetColor() {
    if (showLipliner) {
      setShowLipliner(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showLipliner) {
      setShowLipliner(true);
    }

    setSelectedColor(color);
    setLiplinerColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  );

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={resetColor}
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

// Todo: Update the sizes to match the actual sizes
const lipLinerSizes = [
  "Small",
  "Upper Lip",
  "Large Lower",
  "Large Narrower",
  "Large & Full",
  "Wider",
];

function SizeSelector() {
  const { selectedSize, setSelectedSize } = useLipLinerContext();
  const { liplinerPattern, setLiplinerPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setLiplinerPattern(pattern);
    setSelectedSize(patternName);
  }

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {lipLinerSizes.map((size, index) => (
          <button
            key={size}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": selectedSize === size,
              },
            )}
            onClick={() => setPattern(index, size)}
          >
            <img
              src={`/media/unveels/vto/lipliners/lipliner ${size.toLowerCase()}.png`}
              alt={size}
              className="size-[35px] shrink-0 sm:size-[50px] lg:size-[65px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { colorFamily, selectedSize: selectedShade } = useLipLinerContext();

  const { data, isLoading } = useLipLinerQuery({
    color: colorFamily,
    sub_color: null,
    texture: null,
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
