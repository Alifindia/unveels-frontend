import clsx from "clsx";
import { patterns } from "../../../../api/attributes/pattern";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useLashesContext } from "./lashes-context";

export function SingleLashesSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector />
      </div>

      <ShapeSelector />
      <ProductList product={product} />
    </div>
  );
}

const colorFamilies = [{ name: "Black", value: "#000000" }];

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useLashesContext();

  return (
    <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
      {colorFamilies.map((item) => (
        <button
          key={item.name}
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-white/80",
            {
              "border-white/80": colorFamily === item.name,
            },
          )}
          onClick={() => setColorFamily(item.name)}
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: item.value }}
          />
          <span className="text-[9.8px] sm:text-sm">{item.name}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector() {
  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {["#000000"].map((color, index) => (
          <button type="button" key={index}>
            <ColorPalette
              key={index}
              size="large"
              palette={{
                color: color,
              }}
              selected={true}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const eyelashes = [
  "/media/unveels/vto/eyelashesh/eyelashes-1.png",
  "/media/unveels/vto/eyelashesh/eyelashes-2.png",
  "/media/unveels/vto/eyelashesh/eyelashes-3.png",
  "/media/unveels/vto/eyelashesh/eyelashes-4.png",
  "/media/unveels/vto/eyelashesh/eyelashes-5.png",
  "/media/unveels/vto/eyelashesh/eyelashes-6.png",
  "/media/unveels/vto/eyelashesh/eyelashes-7.png",
  "/media/unveels/vto/eyelashesh/eyelashes-8.png",
  "/media/unveels/vto/eyelashesh/eyelashes-9.png",
];

function ShapeSelector() {
  const { selectedPattern, setSelectedPattern } = useLashesContext();

  return (
    <div className="mx-auto w-full !border-t-0 py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        {patterns.eyelashes.map((pattern, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedPattern === pattern.value,
              },
            )}
            onClick={() => {
              if (selectedPattern === pattern.value) {
                setSelectedPattern(null);
              } else {
                setSelectedPattern(pattern.value);
                // setLashesPattern(index);
              }
            }}
          >
            <img
              src={eyelashes[index % eyelashes.length]}
              alt="Lashes shape"
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
