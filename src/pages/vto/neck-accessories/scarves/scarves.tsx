import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { colors } from "../../../../api/attributes/color";
import { filterFabrics } from "../../../../api/attributes/fabric";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { ScarvesProvider, useScarvesContext } from "./scarves-context";
import { useScarvesQuery } from "./scarves-query";

export function ScarvesSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <FamilyColorSelector />
      <ColorSelector />
      <FabricSelector />
      <ScarvesProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useScarvesContext();

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
  const { colorFamily, selectedColor, setSelectedColor } = useScarvesContext();

  const { data } = useScarvesQuery({
    color: colorFamily,
    fabric: null,
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

const fabrics = filterFabrics(["Polyester", "Cotton", "Leather", "Denim"]);

function FabricSelector() {
  const { selectedFabric, setSelectedFabric } = useScarvesContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
      {fabrics.map((material, index) => (
        <button
          key={material.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedFabric === material.value,
            },
          )}
          onClick={() => setSelectedFabric(material.value)}
        >
          <span className="text-[9.8px] sm:text-sm">{material.label}</span>
        </button>
      ))}
    </div>
  );
}

function ScarvesProductList() {
  const { colorFamily, selectedFabric } = useScarvesContext();

  const { data, isLoading } = useScarvesQuery({
    color: colorFamily,
    fabric: selectedFabric,
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
