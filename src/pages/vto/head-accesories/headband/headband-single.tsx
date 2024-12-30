import clsx from "clsx";
import { Icons } from "../../../../components/icons";
import { colors } from "../../../../api/attributes/color";
import {
  filterFabrics,
  filterFabricsByValue,
} from "../../../../api/attributes/fabric";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useHeadbandContext } from "./headband-context";
import { Product } from "../../../../api/shared";
import { ColorPalette } from "../../../../components/color-palette";
import { useHeadbandQuery } from "./headband-query";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useEffect, useState } from "react";
import { useAccesories } from "../../../../context/accesories-context";

export function SingleHeadbandSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-4">
      <div>
        <ColorSelector product={product} />
      </div>
      <FabricSelector product={product} />
      <ProductList product={product} />
    </div>
  );
}

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useHeadbandContext();
  const { data } = useHeadbandQuery({
    color: product.custom_attributes.find(
      (item) => item.attribute_code === "color",
    )?.value,
    fabric: null,
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

function FabricSelector({ product }: { product: Product }) {
  const { selectedFabric, setSelectedFabric } = useHeadbandContext();

  const productFabrics = extractUniqueCustomAttributes([product], "fabric");
  const fabrics = filterFabricsByValue(productFabrics);

  return (
    <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
      {fabrics.map((fabric) => (
        <button
          key={fabric.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
            {
              "bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedFabric === fabric.value,
            },
          )}
          onClick={() => setSelectedFabric(fabric.value)}
        >
          <span className="text-[9.8px] sm:text-sm">{fabric.label}</span>
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
    selectedFabric,
    setSelectedFabric,
  } = useHeadbandContext();

  const { setShowHeadband } = useAccesories();

  useEffect(() => {
    if (selectedProduct != null) {
      setShowHeadband(true);
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
    setSelectedFabric(
      product.custom_attributes.find((item) => item.attribute_code === "fabric")
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
