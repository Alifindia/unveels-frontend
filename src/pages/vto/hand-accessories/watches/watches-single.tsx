import clsx from "clsx";
import { cloneElement, useEffect, useState } from "react";
import { colors } from "../../../../api/attributes/color";
import { filterMaterialsByValue } from "../../../../api/attributes/material";
import {
  filterShapes,
  filterShapesByValue,
} from "../../../../api/attributes/shape";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useWatchesContext } from "./watches-context";
import { ColorPalette } from "../../../../components/color-palette";
import { useWatchesQuery } from "./watches-query";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useAccesories } from "../../../../context/accesories-context";

export function SingleWatchesSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>
      <ModeSelector product={product} />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useWatchesContext();

  const { data } = useWatchesQuery({
    color: product.custom_attributes.find(
      (item) => item.attribute_code === "color",
    )?.value,
    material: null,
    shape: null,
  });

  const extractHexa = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const extractSubColor = extractUniqueCustomAttributes(
    data?.items ?? [],
    "sub_color",
  ).flatMap((item) => getHexCodeSubColor(item) ?? "");

  const extracted_sub_colors =
    extractHexa.length > 0 ? extractHexa : extractSubColor;

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4 sm:py-2.5">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => setSelectedColor(null)}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={color == selectedColor}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function ModeSelector({ product }: { product: Product }) {
  const { selectedMode, setSelectedMode } = useWatchesContext();

  return (
    <>
      <div className="flex h-[35px] w-full items-center justify-between text-center sm:h-10">
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "shapes",
              "text-white/60": selectedMode !== "shapes",
            },
          )}
          onClick={() => setSelectedMode("shapes")}
        >
          Shapes
        </button>
        <div className="h-5 border-r border-white"></div>
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "material",
              "text-white/60": selectedMode !== "material",
            },
          )}
          onClick={() => setSelectedMode("material")}
        >
          Material
        </button>
      </div>

      {selectedMode === "shapes" ? (
        <ShapeSelector product={product} />
      ) : (
        <MaterialSelector product={product} />
      )}
    </>
  );
}

const shapes = filterShapes([
  "Round",
  "Square",
  "Oval",
  "Rectangular",
  "Tonneau",
  "Avantgarde",
]);

const shapeIcons: { [key: string]: JSX.Element } = {
  Round: <Icons.watchshapeCircle />,
  Square: <Icons.watchshapeSquare />,
  Oval: <Icons.watchshapeOval />,
  Rectangular: <Icons.watchshapeRectangle />,
  Tonneau: <Icons.watchshapeTonneau />,
  Avantgarde: <Icons.watchshapeAvantgarde />,
};

function ShapeSelector({ product }: { product: Product }) {
  const { selectedShape, setSelectedShape } = useWatchesContext();

  const productShapes = extractUniqueCustomAttributes([product], "shape");

  const shapes = filterShapesByValue(productShapes);

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto !border-t-0 py-2 no-scrollbar">
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
          {cloneElement(shapeIcons[shape.label] ?? <Icons.watchshapeCircle />, {
            className: "size-4 sm:size-6",
          })}
          <span className="text-[9.8px] sm:text-sm">{shape.label}</span>
        </button>
      ))}
    </div>
  );
}

function MaterialSelector({ product }: { product: Product }) {
  const { selectedMaterial, setSelectedMaterial } = useWatchesContext();

  const productMaterials = extractUniqueCustomAttributes([product], "texture");

  const materials = filterMaterialsByValue(productMaterials);

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto !border-t-0 py-2 no-scrollbar">
      {materials.map((material) => (
        <button
          key={material.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedMaterial === material.value,
            },
          )}
          onClick={() => setSelectedMaterial(material.value)}
        >
          <span className="text-[9.8px] sm:text-sm">{material.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProductList({ product }: { product: Product }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    colorFamilyToInclude,
    setColorFamilyToInclude,
    colorFamily,
    setColorFamily,
    setSelectedColor,
    selectedShape,
    selectedMaterial,
    setSelectedMaterial,
  } = useWatchesContext();
  const { setShowWatch } = useAccesories();

  useEffect(() => {
    if (selectedProduct == null) return;
    setShowWatch(true);
  }, [selectedProduct]);

  if (colorFamilyToInclude == null && product != null) {
    setColorFamilyToInclude(
      product.custom_attributes.find((c) => c.attribute_code === "color")
        ?.value,
    );
  }

  const handleProductClick = (product: Product) => {
    console.log(product);
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      getHexCodeSubColor(
        product.custom_attributes.find(
          (item) => item.attribute_code === "sub_color",
        )?.value,
      ) ?? null,
    );
    setSelectedMaterial(
      product.custom_attributes.find(
        (item) => item.attribute_code === "material",
      )?.value,
    );
    setShowWatch(true);
  };

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing sm:gap-4">
      {[product].map((item) => (
        <VTOProductCard
          key={item.id}
          product={item}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
