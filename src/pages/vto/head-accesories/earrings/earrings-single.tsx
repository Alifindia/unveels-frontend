import clsx from "clsx";
import { cloneElement } from "react";
import { colors } from "../../../../api/attributes/color";
import { filterShapesByValue } from "../../../../api/attributes/shape";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useEarringsContext } from "./earrings-context";

export function SingleEarringsSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <FamilyColorSelector />
        <ColorSelector product={product} />
      </div>
      <ShapeSelector product={product} />
      <ProductList product={product} />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useEarringsContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
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
  const { selectedColor, setSelectedColor } = useEarringsContext();

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
  ).flatMap((item) => item.split(","));

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
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80",
              {
                "border-white/80": selectedColor === color,
              },
            )}
            style={{ background: color }}
            onClick={() => handleColorSelection(color)}
          />
        ))}
      </div>
    </div>
  );
}

const shapeIcons: { [key: string]: JSX.Element } = {
  Studs: <Icons.earringStuds />,
  Cuffs: <Icons.earringCuffs />,
  Hoops: <Icons.earringHoops />,
  Dangling: <Icons.earringDanglings />,
};

function ShapeSelector({ product }: { product: Product }) {
  const { selectedShape, setSelectedShape } = useEarringsContext();
  const productShapes = extractUniqueCustomAttributes([product], "shape");
  const shapes = filterShapesByValue(productShapes);

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
      {shapes.map((shape) => (
        <button
          key={shape.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedShape === shape.value,
            },
          )}
          onClick={() => setSelectedShape(shape.value)}
        >
          {cloneElement(shapeIcons[shape.label] ?? <Icons.earringStuds />, {
            className: "size-6",
          })}
          <span className="text-[9.8px] sm:text-sm">{shape.label}</span>
        </button>
      ))}
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
