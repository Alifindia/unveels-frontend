import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { filterOccasions } from "../../../../api/attributes/occasion";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { TiaraProvider, useTiaraContext } from "./tiaras-context";
import { useTiarasQuery } from "./tiaras-query";
import { colors } from "../../../../api/attributes/color";

export function TiaraSelector() {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <FamilyColorSelector />
      <ColorSelector />
      <ModeSelector />
      <TiaraProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily } = useTiaraContext();

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
  const { colorFamily, selectedColor, setSelectedColor } = useTiaraContext();
  const { data } = useTiarasQuery({
    color: colorFamily,
    material: null,
    occasion: null,
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
          className="inline-flex size-[1.875rem] shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80 sm:size-10"
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

function ModeSelector() {
  const { selectedMode, setSelectedMode } = useTiaraContext();

  return (
    <>
      <div className="flex h-[35px] w-full items-center justify-between text-center sm:h-10">
        <button
          className={clsx(
            "relative grow text-[11.2px] sm:text-base lg:text-[20.8px]",
            {
              "text-white": selectedMode === "occasions",
              "text-white/60": selectedMode !== "occasions",
            },
          )}
          onClick={() => setSelectedMode("occasions")}
        >
          Occasion
        </button>
        <div className="h-5 border-r border-white"></div>
        <button
          className={clsx(
            "relative grow text-[11.2px] sm:text-base lg:text-[20.8px]",
            {
              "text-white": selectedMode === "materials",
              "text-white/60": selectedMode !== "materials",
            },
          )}
          onClick={() => setSelectedMode("materials")}
        >
          Material
        </button>
      </div>

      {selectedMode === "occasions" ? <OccasionSelector /> : <FabricSelector />}
    </>
  );
}

const occasions = filterOccasions(["Bridal", "Soiree"]);

function OccasionSelector() {
  const { selectedOccasion, setSelectedOccasion } = useTiaraContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto !border-t-0 py-2 no-scrollbar">
      {occasions.map((occasion, index) => (
        <button
          key={occasion.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedOccasion === occasion.value,
            },
          )}
          onClick={() => setSelectedOccasion(occasion.value)}
        >
          <span className="text-[9.8px] sm:text-sm">{occasion.label}</span>
        </button>
      ))}
    </div>
  );
}

const materials = [
  {
    name: "Pearls",
    image:
      "/media/unveels/vto/tiara-materials/e4108386-f7a9-4342-ba51-c163dd965967 1.png",
  },
  {
    name: "Crystals",
    image:
      "/media/unveels/vto/tiara-materials/7a9885af-a00a-4a07-8a3b-b8f8e5eb059d 1.png",
  },
  {
    name: "Rubies",
    image:
      "/media/unveels/vto/tiara-materials/d9dbfba7-fa55-4aa9-9281-908381b4296e 1.png",
  },
];

function FabricSelector() {
  const { selectedMaterial, setSelectedMaterial } = useTiaraContext();

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto !border-t-0 py-2 no-scrollbar">
      {materials.map((material, index) => (
        <button
          key={material.name}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedMaterial === material.name,
            },
          )}
          onClick={() => setSelectedMaterial(material.name)}
        >
          <img
            src={material.image}
            alt={material.name}
            className="size-6 shrink-0"
          />
          <span className="text-[9.8px] sm:text-sm">{material.name}</span>
        </button>
      ))}
    </div>
  );
}

function TiaraProductList() {
  const { colorFamily, selectedMaterial, selectedOccasion } = useTiaraContext();

  const { data, isLoading } = useTiarasQuery({
    color: colorFamily,
    occasion: selectedOccasion,
    material: null,
  });

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
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
