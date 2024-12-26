import clsx from "clsx";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useHairColorContext } from "./hair-color-context";

export function SingleHairColorSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>

      <ProductList product={product} />
    </div>
  );
}

const haircolors = [
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 1.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 2.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 3.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 4.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 5.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 6.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 7.png",
  "/media/unvvels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 8.png",
];

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useHairColorContext();
  // const { setHairColor, showHairColor, setShowHairColor } = useMakeup();

  const handleClearSelection = () => {
    // if (showHairColor) {
    //   setShowHairColor(false);
    // }
    setSelectedColor(null);
  };

  const handleColorSelection = (index: string) => {
    // if (!showHairColor) {
    //   setShowHairColor(true);
    // }
    setSelectedColor(index);
    // setHairColor(index);
  };

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar py-2 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={handleClearSelection}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {haircolors.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedColor === index.toString(),
              },
            )}
            onClick={() => handleColorSelection(index.toString())}
          >
            <img src={path} alt="Hair Color" className="h-12 w-14 rounded" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList({ product }: { product: Product }) {
  return (
    <div className="flex w-full gap-2 sm:gap-4 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing">
      {[product].map((item) => (
        <VTOProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
