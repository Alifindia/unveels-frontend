import clsx from "clsx";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { EyeLinerProvider, useEyeLinerContext } from "./eye-liner-context";
import { colors } from "../../../../api/attributes/color";
import { useEyelinerQuery } from "./eye-liner-query";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { patterns } from "../../../../api/attributes/pattern";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";

export function EyeLinerSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <ShapeSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useEyeLinerContext();

  return (
    <div
      className="flex w-full items-center space-x-2 py-2 overflow-x-auto no-scrollbar"
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
  const { colorFamily, selectedColor, setSelectedColor } = useEyeLinerContext();
  const { data } = useEyelinerQuery({
    color: colorFamily,
    pattern: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        <button
          type="button"
          className="inline-flex size-[1.875rem] shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            setSelectedColor(null);
          }}
        >
          <Icons.empty className="size-[1.875rem]" />
        </button>

        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColor === color}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

const eyeliners = [
  "/media/unveels/vto/eyeliners/eyeliners_arabic-down 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_arabic-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_arabic-up 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_double-mod 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_open-wings 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-light 1.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useEyeLinerContext();
  return (
    <div className="mx-auto w-full py-4">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {patterns.eyeliners.map((pattern, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === pattern.value,
              },
            )}
            onClick={() => {
              if (selectedShape === pattern.value) {
                setSelectedShape(null);
              } else {
                setSelectedShape(pattern.value);
              }
            }}
          >
            <img
              src={eyeliners[index % eyeliners.length]}
              alt="Eyebrow"
              className="size-12 rounded"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { colorFamily, selectedShape } = useEyeLinerContext();

  const { data, isLoading } = useEyelinerQuery({
    color: colorFamily,
    pattern: selectedShape,
  });

  return (
    <div className="flex w-full gap-2 sm:gap-4 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing">
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
