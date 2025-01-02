import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { skin_tones } from "../../../../api/attributes/skin_tone";
import { textures } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useFoundationContext } from "./foundation-context";
import { useFoundationQuery } from "./foundation-query";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getFaceMakeupProductTypeIds } from "../../../../api/attributes/makeups";

export function FoundationSelector() {
  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <TextureSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useFoundationContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar"
      data-mode="lip-color"
    >
      {skin_tones
        .filter((c) => colorFamilyToInclude?.includes(c.id))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": colorFamily === item.id,
              },
            )}
            onClick={() =>
              setColorFamily(colorFamily == item.id ? null : item.id)
            }
          >
            <div
              className="size-2.5 shrink-0 rounded-full"
              style={{
                background: item.color,
              }}
            />
            <span className="text-[9.8px] sm:text-sm">{item.name}</span>
          </button>
        ))}
    </div>
  );
}

function ColorSelector() {
  const { colorFamily, selectedColor, setSelectedColor } =
    useFoundationContext();
  const { setFoundationColor, showFoundation, setShowFoundation } = useMakeup();

  const { data } = useFoundationQuery({
    skin_tone: colorFamily,
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  function setColor(color: string) {
    if (!showFoundation) {
      setShowFoundation(true);
    }
    setSelectedColor(color);
    setFoundationColor(color);
  }

  function resetFoundation() {
    setSelectedColor(null);
    setShowFoundation(false);
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            resetFoundation();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
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

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useFoundationContext();
  const { setBlushMaterial } = useMakeup();

  function setMaterial(
    material: number,
    texture: { label: string; value: string },
  ) {
    if (selectedTexture === texture.value) {
      setSelectedTexture(null);
    } else {
      setSelectedTexture(texture.value);
    }
    setBlushMaterial(material);
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
        {textures.map((texture, index) => (
          <button
            key={texture.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-2 py-0.5 text-white/80 sm:px-3 sm:py-1",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
            )}
            onClick={() => setMaterial(index, texture)}
          >
            <span className="text-[9.8px] sm:text-sm">{texture.label}</span>
          </button>
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
    setColorFamily,
    selectedColor,
    setSelectedColor,
    setSelectedTexture,
    selectedTexture,
    colorFamilyToInclude,
    setColorFamilyToInclude,
  } = useFoundationContext();

  const { setShowFoundation, setFoundationColor } = useMakeup();

  useEffect(() => {
    setFoundationColor(selectedColor ?? "#ffffff");
    setShowFoundation(selectedColor != null);
  }, [selectedColor]);

  const { data, isLoading } = useFoundationQuery({
    skin_tone: colorFamily,
    texture: selectedTexture,
  });

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "skin_tone")
            ?.value,
      ),
    );
  }

  const handleProductClick = (product: Product) => {
    console.log(product);
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find(
        (item) => item.attribute_code === "skin_tone",
      )?.value,
    );
    setSelectedColor(
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    );
    setSelectedTexture(
      product.custom_attributes.find(
        (item) => item.attribute_code === "texture",
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
              Foundations: {
                attributeName: "face_makeup_product_types",
                values: getFaceMakeupProductTypeIds(["Foundations"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Foundations", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Foundations");
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
