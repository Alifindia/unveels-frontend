import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { filterMaterials } from "../../../../api/attributes/material";
import { Product } from "../../../../api/shared";
import { Icons } from "../../../../components/icons";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import {
  extractUniqueCustomAttributes,
  getProductAttributes,
} from "../../../../utils/apiUtils";
import { useHandwearContext } from "./handwear-context";
import { ColorPalette } from "../../../../components/color-palette";
import { useHandwearQuery } from "./handwear-query";
import { handAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { useEffect, useState } from "react";
import { useAccesories } from "../../../../context/accesories-context";

export function SingleHandwearSelector({ product }: { product: Product }) {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector product={product} />
      </div>
      <MaterialSelector />
      <ProductList product={product} />
    </div>
  );
}

const hand_accessories_product_type = [
  {
    label: "Rings",
    value: "6500",
  },
  {
    label: "Watches",
    value: "6501",
  },
  {
    label: "Bracelets",
    value: "6502",
  },
  {
    label: "Bangles",
    value: "6503",
  },
];

function ColorSelector({ product }: { product: Product }) {
  const { selectedColor, setSelectedColor } = useHandwearContext();
  const productType = getProductAttributes(
    product,
    "hand_accessories_product_type",
  );

  const productTypeLabel = (hand_accessories_product_type.find(
    (item) => item.value === productType,
  )?.label ?? "Rings") as "Rings" | "Bracelets" | "Bangles"; // Type assertion

  const { data } = useHandwearQuery(productTypeLabel, {
    color: product.custom_attributes.find(
      (item) => item.attribute_code === "color",
    )?.value,
    material: null,
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

const materials = filterMaterials([
  "Silver",
  "Silver Plated",
  "Gold Plated",
  "Brass",
  "Stainless",
]);

function MaterialSelector() {
  const { selectedMaterial, setSelectedMaterial } = useHandwearContext();

  return (
    <div className="mx-auto w-full py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {materials.map((material) => (
          <button
            key={material.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedMaterial === material.value,
              },
            )}
            onClick={() => {
              if (selectedMaterial === material.value) {
                setSelectedMaterial(null);
              } else {
                setSelectedMaterial(material.value);
              }
            }}
          >
            <span className="text-[9.8px] sm:text-sm">{material.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList({ product }: { product: Product }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeHandwear, setActiveHandwear] = useState<
    "Rings" | "Bracelets" | "Bangles" | null
  >(null);

  const {
    setColorFamilyToInclude,
    setColorFamily,
    setSelectedColor,
    setSelectedMaterial,
    colorFamily,
    selectedMaterial,
    selectedColor,
  } = useHandwearContext();

  const { setShowRing, setShowBracelet } = useAccesories();

  const productType = getProductAttributes(
    product,
    "hand_accessories_product_type",
  );

  const productTypeLabel = (hand_accessories_product_type.find(
    (item) => item.value === productType,
  )?.label ?? "Rings") as "Rings" | "Bracelets" | "Bangles"; // Type assertion

  useEffect(() => {
    if (activeHandwear === productType) return;
    setSelectedProduct(null);
    setSelectedColor(null);
    setSelectedMaterial(null);
    setColorFamily(null);
    console.log("HandwearProductList");
  }, [productType]);

  useEffect(() => {
    if (selectedProduct == null) return;
    if (productTypeLabel === "Rings") {
      setShowRing(true);
    }
    if (productTypeLabel === "Bangles") {
      setShowBracelet(true);
    }
  }, [selectedColor]);

  if (activeHandwear != productTypeLabel && product != null) {
    setActiveHandwear(productTypeLabel);
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
