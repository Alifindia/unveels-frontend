import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { filterShapes } from "../../../../api/attributes/shape";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { usePressOnNailsContext } from "./press-on-nails-context";
import { ColorPalette } from "../../../../components/color-palette";

export function SinglePressOnNailsSelector({ product }: { product: Product }) {
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
  const { colorFamily, setColorFamily } = usePressOnNailsContext();

  return (
    <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
      {colors.map((item) => (
        <button
          key={item.value}
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
            style={{ background: item.hex }}
          />
          <span className="text-[0.625rem]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = usePressOnNailsContext();
  // const { setPressOnNailsColor, showPressOnNails, setShowPressOnNails } =
  //   useMakeup();

  const handleClearSelection = () => {
    // if (showPressOnNails) {
    //   setShowPressOnNails(false);
    // }
    setSelectedColor(null);
  };

  const handleColorSelection = (color: string) => {
    // if (!showPressOnNails) {
    //   setShowPressOnNails(true);
    // }
    setSelectedColor(color);
    // setPressOnNailsColor(color);
  };

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

const nailshapes = [
  "/media/unveels/vto/nailshapes/press on nails-1.png",
  "/media/unveels/vto/nailshapes/press on nails-2.png",
  "/media/unveels/vto/nailshapes/press on nails-3.png",
];

const shapes = filterShapes(["Triangle", "Square", "Oval"]);

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = usePressOnNailsContext();

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        {shapes.map((shape, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === shape.value,
              },
            )}
            onClick={() => setSelectedShape(shape.value)}
          >
            <img
              src={nailshapes[index]}
              alt="Nail shape"
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
