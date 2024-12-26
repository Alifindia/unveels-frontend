import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { useLocation } from "react-router-dom";

import { colors } from "../../../../api/attributes/color";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { NeckwearProvider, useNeckwearContext } from "./neckwear-context";
import { useNeckwearQuery } from "./neckwear-query";

function useActiveNeckwear(): "Chokers" | "Necklaces" | "Pendants" {
  const location = useLocation();

  // Extract the neckwear type from the path
  const pathSegments = location.pathname.split("/");
  const activeNeckwear = pathSegments.includes("virtual-try-on")
    ? pathSegments[2]
    : null;

  if (
    activeNeckwear === null ||
    !["chokers", "necklaces", "pendants"].includes(activeNeckwear)
  ) {
    throw new Error("No active neckwear found");
  }

  // capitalize the first letter
  return (activeNeckwear.charAt(0).toUpperCase() + activeNeckwear.slice(1)) as
    | "Chokers"
    | "Necklaces"
    | "Pendants";
}

export function NeckwearSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <FamilyColorSelector />
      <ColorSelector />
      <NeckwearProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useNeckwearContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar"
      data-mode="lip-color"
    >
      {colors.map((item, index) => (
        <button
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
  const { colorFamily, selectedColor, setSelectedColor } = useNeckwearContext();
  const neckwearType = useActiveNeckwear();
  const { data } = useNeckwearQuery(neckwearType, {
    color: colorFamily,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full !border-t-0">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            setSelectedColor(null);
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <button
            key={color}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80",
              {
                "border-white/80": selectedColor === color,
              },
            )}
            style={{ background: color }}
            onClick={() => {
              if (selectedColor === color) {
                setSelectedColor(null);
              } else {
                setSelectedColor(color);
              }
            }}
          ></button>
        ))}
      </div>
    </div>
  );
}

function NeckwearProductList() {
  const { colorFamily } = useNeckwearContext();
  const neckwearType = useActiveNeckwear();

  const { data, isLoading } = useNeckwearQuery(neckwearType, {
    color: colorFamily,
  });

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing">
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
