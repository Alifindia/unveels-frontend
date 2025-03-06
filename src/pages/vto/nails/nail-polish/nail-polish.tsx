import clsx from "clsx";
import { useEffect, useState } from "react";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";
import {
  NailPolishProvider,
  useNailPolishContext,
} from "./nail-polish-context";
import { colors } from "../../../../api/attributes/color";
import { useNailPolishQuery } from "./nail-polish-query";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { filterTextures } from "../../../../api/attributes/texture";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { Product } from "../../../../api/shared";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getNailPolishProductTypeIds } from "../../../../api/attributes/makeups";
import { useMakeup } from "../../../../context/makeup-context";
import { useAccesories } from "../../../../context/accesories-context";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

export function NailPolishSelector() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

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
    useNailPolishContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar"
      data-mode="lip-color"
    >
      {colors
        .filter((c) => colorFamilyToInclude?.includes(c.value))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-white/80",
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
    useNailPolishContext();

  const { setShowNails } = useMakeup();
  const { data } = useNailPolishQuery({
    color: colorFamily,
    texture: null,
  });

  useEffect(() => {
    if (selectedColor === null) {
      setShowNails(false);
    } else {
      setShowNails(true);
    }
  }, [selectedColor]);

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            setSelectedColor(null);
          }}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>

        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColor == color}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Glossy", "Matte", "Shimmer"]);

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useNailPolishContext();
  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-2 overflow-x-auto no-scrollbar">
        {textures.map((texture, index) => (
          <button
            key={texture.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center gap-x-2 rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
            )}
            onClick={() => {
              if (selectedTexture === texture.value) {
                setSelectedTexture(null);
              } else {
                setSelectedTexture(texture.value);
              }
            }}
          >
            <span className="text-[9.8px] lg:text-xs">{texture.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    setSelectedTexture,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedTexture,
  } = useNailPolishContext();

  const { setShowNails, setNailsColor, setNailsTexture, setShowPressOnNails } = useMakeup();
  const { data, isLoading } = useNailPolishQuery({
    color: colorFamily,
    texture: selectedTexture,
  });

  useEffect(() => {
    setNailsTexture(selectedTexture as "Matte" | "Shimmer" | "Glossy");
    if (selectedColor) {
      setNailsColor(selectedColor);
      setShowNails(selectedColor.length > 0);
      setShowPressOnNails(false);
    }
  }, [selectedColor, selectedTexture]);

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
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Nail: {
                attributeName: "nail_polish_product_types",
                values: getNailPolishProductTypeIds([
                  "Nail Color",
                  "Gel Color",
                  "Glossy Top Coats",
                ]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Nail", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Nails Polish");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div className="flex w-full gap-4 overflow-x-auto pb-2 pt-4 no-scrollbar active:cursor-grabbing">
        {isLoading ? (
          <LoadingProducts />
        ) : (
          data?.items.map((product, index) => {
            return (
              <VTOProductCard
                product={product}
                productNumber={index+1}
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
