import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";
import { ConcealerProvider, useConcealerContext } from "./concealer-context";
import { useMakeup } from "../../../../context/makeup-context";
import { skin_tones } from "../../../../api/attributes/skin_tone";
import { useConcealerQuery } from "./concealer-query";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useFoundationContext } from "../foundation/foundation-context";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { colors } from "../../../../api/attributes/color";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getEyeMakeupProductTypeIds } from "../../../../api/attributes/makeups";

export function ConcealerSelector() {
  return (
    <div className="mx-auto w-full px-4">
      <FamilyColorSelector />

      <ColorSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useConcealerContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar"
      data-mode="lip-color"
    >
      {colors
        .filter((c) => colorFamilyToInclude?.includes(c.value))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": colorFamily === item.value,
              },
            )}
            onClick={() =>
              setColorFamily(colorFamily === item.value ? null : item.value)
            }
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
  const { colorFamily, selectedColor, setSelectedColor } =
    useConcealerContext();
  const { setConcealerColor, setShowConcealer, showConcealer } = useMakeup();

  const { data } = useConcealerQuery({
    skin_tone: colorFamily,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  function reset() {
    if (showConcealer) {
      setShowConcealer(false);
    }
    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showConcealer) {
      setShowConcealer(true);
    }
    setSelectedColor(color);
    setConcealerColor(color);
  }

  return (
    <div className="mx-auto w-full border-b">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-2.5 no-scrollbar">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            reset();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={index}
            size="large"
            palette={{
              color: color,
            }}
            selected={selectedColor === color}
            onClick={() => setColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    selectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    setSelectedColor,
    setColorFamily,
  } = useConcealerContext();

  const { data, isLoading } = useConcealerQuery({
    skin_tone: colorFamily,
  });

  const { setShowConcealer, setConcealerColor } = useMakeup();

  useEffect(() => {
    setConcealerColor(selectedColor ?? "#ffffff");
    setShowConcealer(selectedColor != null);
  }, [selectedColor]);

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
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
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    );
  };

  return (
    <>
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.625rem] text-white sm:py-2"
          onClick={() => {
            setMapTypes({
              Concealers: {
                attributeName: "eye_makeup_product_type",
                values: getEyeMakeupProductTypeIds(["Concealers"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Concealers", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Concealers");
            setView("all_categories");
          }}
        >
          View all
        </button>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto border-none pb-2 pt-2 no-scrollbar active:cursor-grabbing sm:gap-4">
        {isLoading ? (
          <LoadingProducts />
        ) : (
          data?.items.map((product, index) => {
            return (
              <VTOProductCard
                product={product}
                key={product.id}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                onClick={() => handleProductClick(product)}
              />
            );
          })
        )}
      </div>
    </>
  );
}
