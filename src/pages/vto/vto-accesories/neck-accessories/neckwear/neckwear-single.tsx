import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import {
  extractUniqueCustomAttributes,
  getProductAttributes,
} from "../../../../utils/apiUtils";
import { useNeckwearContext } from "./neckwear-context";
import { ColorPalette } from "../../../../components/color-palette";
import { useNeckwearQuery } from "./neckwear-query";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useEffect, useState } from "react";
import { useAccesories } from "../../../../context/accesories-context";

export function SingleNeckwearSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>

      <ProductList product={product} />
    </div>
  );
}

export const neck_accessories_product_type = [
  {
    label: "Necklaces",
    value: "6509",
  },
  {
    label: "Pendants",
    value: "6510",
  },
  {
    label: "Chokers",
    value: "6511",
  },
  {
    label: "Scarves",
    value: "6512",
  },
];

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useNeckwearContext();

  const productType = getProductAttributes(
    product,
    "neck_accessories_product_type",
  );
  const productTypeLabel = (neck_accessories_product_type.find(
    (item) => item.value === productType,
  )?.label ?? "Chokers") as "Chokers" | "Necklaces" | "Pendants"; // Type assertion

  const { data } = useNeckwearQuery(productTypeLabel, {
    color: product.custom_attributes.find(
      (item) => item.attribute_code === "color",
    )?.value,
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

function ProductList({ product }: { product: Product }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeNeckwear, setActiveNeckwear] = useState<
    "Chokers" | "Necklaces" | "Pendants" | null
  >(null);

  const {
    colorFamily,
    setColorFamily,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
  } = useNeckwearContext();

  const { setShowNecklace } = useAccesories();

  useEffect(() => {
    if (selectedProduct != null) {
      setShowNecklace(true);
    }
  }, [selectedProduct]);

  const productType = getProductAttributes(
    product,
    "neck_accessories_product_type",
  );
  const neckwearType = (neck_accessories_product_type.find(
    (item) => item.value === productType,
  )?.label ?? "Chokers") as "Chokers" | "Necklaces" | "Pendants"; // Type assertion

  useEffect(() => {
    if (activeNeckwear === neckwearType) return;
    setActiveNeckwear(neckwearType);
    setSelectedProduct(null);
    setSelectedColor(null);
    setColorFamily(null);
    console.log("HandwearProductList");
  }, [neckwearType]);

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
