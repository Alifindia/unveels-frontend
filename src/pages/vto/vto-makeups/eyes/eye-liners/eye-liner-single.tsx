import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { patterns } from "../../../../api/attributes/pattern";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useEyeLinerContext } from "./eye-liner-context";

export function SingleEyeLinerSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />
        <ColorSelector product={product} />
      </div>

      <ShapeSelector />
      <ProductList product={product} />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useEyeLinerContext();

  return (
    <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
      {colors.map((item) => (
        <button
          key={item.value}
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-white/80",
            {
              "border-white/80": colorFamily === item.value,
            },
          )}
          onClick={() => setColorFamily(item.value)}
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: item.hex }}
          />
          <span className="text-[0.625rem]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useEyeLinerContext();
  // const { setEyelinerColor, showEyeliner, setShowEyeliner } = useMakeup();

  const handleClearSelection = () => {
    // if (showEyeliner) {
    //   setShowEyeliner(false);
    // }
    setSelectedColor(null);
  };

  const handleColorSelection = (color: string) => {
    // if (!showEyeliner) {
    //   setShowEyeliner(true);
    // }
    setSelectedColor(color);
    // setEyelinerColor(color);
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
          <button
            type="button"
            key={index}
            onClick={() => handleColorSelection(color)}
          >
            <ColorPalette
              size="large"
              palette={{ color }}
              selected={selectedColor === color}
            />
          </button>
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
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
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
              setSelectedShape(pattern.value);
            }}
          >
            <img
              src={eyeliners[index % eyeliners.length]}
              alt="Eyeliner shape"
              className="size-[35px] rounded sm:size-[50px] lg:size-[65px]"
            />
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
