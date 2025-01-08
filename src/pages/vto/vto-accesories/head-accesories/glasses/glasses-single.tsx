import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { colors } from "../../../../api/attributes/color";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useGlassesContext } from "./glasses-context";
import {
  filterShapes,
  filterShapesByValue,
} from "../../../../api/attributes/shape";
import {
  filterMaterials,
  filterMaterialsByValue,
} from "../../../../api/attributes/material";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { useGlassesQuery } from "./glasses-query";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useEffect, useState } from "react";
import { useAccesories } from "../../../../context/accesories-context";

export function SingleGlassesSelector({ product }: { product: Product }) {
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
  const { selectedColor, setSelectedColor } = useGlassesContext();

  const { data } = useGlassesQuery({
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
  const { selectedMode, setSelectedMode } = useGlassesContext();

  return (
    <>
      <div className="flex h-[35px] w-full items-center justify-between text-center sm:h-10">
        <button
          className={clsx(
            "relative grow text-[11.2px] sm:text-base lg:text-[20.8px]",
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
            "relative grow text-[11.2px] sm:text-base lg:text-[20.8px]",
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

function ShapeSelector({ product }: { product: Product }) {
  const { selectedShape, setSelectedShape } = useGlassesContext();
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
          <span className="text-[9.8px] sm:text-sm">{shape.label}</span>
        </button>
      ))}
    </div>
  );
}

function MaterialSelector({ product }: { product: Product }) {
  const { selectedMaterial, setSelectedMaterial } = useGlassesContext();

  const productMaterials = extractUniqueCustomAttributes([product], "material");
  const materials = filterMaterialsByValue(productMaterials);

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
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
    colorFamily,
    setColorFamily,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    setSelectedMaterial,
    selectedMaterial,
    selectedShape,
    setSelectedShape,
  } = useGlassesContext();

  const { setShowGlasess } = useAccesories();

  useEffect(() => {
    if (selectedProduct != null) {
      setShowGlasess(true);
    }
  }, [selectedProduct]);

  if (colorFamilyToInclude == null && product != null) {
    setColorFamilyToInclude(
      product.custom_attributes.find((c) => c.attribute_code === "color")
        ?.value,
    );
  }

  const handleProductClick = (product: Product) => {
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
    setSelectedShape(
      product.custom_attributes.find((item) => item.attribute_code === "shape")
        ?.value,
    );
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
