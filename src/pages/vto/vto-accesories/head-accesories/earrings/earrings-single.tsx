import clsx from "clsx";
import { cloneElement, useEffect, useState } from "react";
import { colors } from "../../../../api/attributes/color";
import { filterShapesByValue } from "../../../../api/attributes/shape";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useEarringsContext } from "./earrings-context";
import { useEarringsQuery } from "./earrings-query";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { ColorPalette } from "../../../../components/color-palette";
import { useAccesories } from "../../../../context/accesories-context";

export function SingleEarringsSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>
      <ShapeSelector product={product} />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useEarringsContext();

  const { data } = useEarringsQuery({
    color: product.custom_attributes.find(
      (item) => item.attribute_code === "color",
    )?.value,
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    colorFamily,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    setColorFamily,
    setSelectedColor,
    selectedShape,
    setSelectedShape,
  } = useEarringsContext();

  const { setShowEarring } = useAccesories();

  useEffect(() => {
    if (selectedProduct != null) {
      setShowEarring(true);
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
