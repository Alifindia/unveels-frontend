import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { ColorPalette } from "../../../../components/color-palette";

import {
  HighlighterProvider,
  useHighlighterContext,
} from "./highlighter-context";
import { useMakeup } from "../../../../context/makeup-context";
import { useQuery } from "@tanstack/react-query";
import {
  faceMakeupProductTypesFilter,
  getFaceMakeupProductTypeIds,
} from "../../../../api/attributes/makeups";
import {
  baseApiUrl,
  baseUrl,
  buildSearchParams,
  extractUniqueCustomAttributes,
  getProductAttributes,
  mediaUrl,
} from "../../../../utils/apiUtils";
import { defaultHeaders, Product } from "../../../../api/shared";
import { BrandName } from "../../../../components/product/brand";
import { LoadingProducts } from "../../../../components/loading";
import { filterTextures } from "../../../../api/attributes/texture";
import { useFaceHighlighterQuery } from "./highlighter-query";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useSelecProductNumberContext } from "../../select-product-context";
import { SetStateAction, useEffect, useState } from "react";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function HighlighterSelector() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);
  
  return (
    <div className="mx-auto w-full px-2">
      <ColorSelector />

      <TextureSelector />

      <ShapeSelector />

      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const { selectedColor, setSelectedColor } = useHighlighterContext();
  const {
    highlighterColor,
    setHighlighterColor,
    showHighlighter,
    setShowHighlighter,
  } = useMakeup();

  const { data, isLoading } = useFaceHighlighterQuery({
    hexacode: null,
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((color) => color.split(","));

  function reset() {
    if (showHighlighter) {
      setShowHighlighter(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showHighlighter) {
      setShowHighlighter(true);
    }

    setHighlighterColor(color);
    setSelectedColor(color);
  }

  return (
    <div className="mx-auto w-full border-b">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-1 2xl:py-2.5 no-scrollbar">
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
            key={color}
            size="large"
            palette={{
              color: color,
            }}
            selected={selectedColor === color}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useHighlighterContext();
  const { highlighterMaterial, setHighlighterMaterial } = useMakeup();

  function setMaterial(
    material: number,
    texture: { label: string; value: string },
  ) {
    if (selectedTexture === texture.value) {
      setSelectedTexture(null);
    } else {
      setSelectedTexture(texture.value);
    }
    setHighlighterMaterial(material);
  }

  return (
    <div className="mx-auto w-full border-b">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4">
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
            <span className="text-[9.8px] lg:text-xs">{texture.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const highlighters = [
  "/media/unveels/vto/highlighters/highlighter-1.png",
  "/media/unveels/vto/highlighters/highlighter-2.png",
  "/media/unveels/vto/highlighters/highlighter-3.png",
  "/media/unveels/vto/highlighters/highlighter-4.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useHighlighterContext();
  const { setHighlighterPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setSelectedShape(patternName);
    setHighlighterPattern(pattern);
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-1 2xl:py-2.5 no-scrollbar">
        {highlighters.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === index.toString(),
              },
            )}
            onClick={() => setPattern(index, index.toString())}
          >
            <img
              src={path}
              alt="Highlighter"
              className="size-[25px] rounded sm:size-[30px] lg:size-[35px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { selectedProductNumber, setSelectedProductNumber, addCartProductNumber, setAddCartProductNumber } = useSelecProductNumberContext()
  const { addItemToCart, setDataItem } = useCartContext();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    selectedTexture,
    selectedColor,
    setSelectedColor,
    setSelectedTexture,
    selectedShape,
  } = useHighlighterContext();

  const { data, isLoading } = useFaceHighlighterQuery({
    hexacode: selectedColor,
    texture: selectedTexture,
  });

  const {
    setShowHighlighter,
    setHighlighterColor,
    setHighlighterPattern,
    setHighlighterMaterial,
  } = useMakeup();

  useEffect(() => {
    setShowHighlighter(selectedColor != null && selectedProduct != null);
    setHighlighterColor(selectedColor ?? "#ffffff");
    if (selectedShape == null) {
      setHighlighterPattern(0);
    }
    setHighlighterMaterial(
      selectedTexture != null
        ? textures.findIndex((item) => item.value === selectedTexture)
        : 0,
    );
  }, [selectedProduct]);

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColor(
          matchedProduct.custom_attributes
            .find((item) => item.attribute_code === "hexacode")
            ?.value.split(",")[0],
        );
        setSelectedTexture(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "texture",
          )?.value,
        );
      }
    }
  }, [data, selectedProductNumber]);

  useEffect(() => {
    const handleAddToCart = async () => {
      if (data?.items && addCartProductNumber) {
        const adjustedIndex = addCartProductNumber - 1;
        const matchedProduct = data.items[adjustedIndex];
        console.log(matchedProduct);
  
        if (matchedProduct) {
          const url = `${baseApiUrl}/${matchedProduct.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`;
          const id = matchedProduct.id.toString();
          try {
            await addItemToCart(id, url);
            setDataItem(matchedProduct);
            setAddCartProductNumber(null)
            console.log(`Product ${id} added to cart!`);
          } catch (error) {
            console.error("Failed to add product to cart:", error);
          }
        }
      }
    };
  
    handleAddToCart();
  }, [data, addCartProductNumber]);

  const handleProductClick = (product: Product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setSelectedProductNumber(null);
      setSelectedTexture(null);
      setSelectedColor(null);
      return
    }
    console.log(product);
    setSelectedProduct(product);
    setSelectedColor(
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(",")[0],
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
          className="p-0 text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Highlighters: {
                attributeName: "face_makeup_product_types",
                values: getFaceMakeupProductTypeIds(["Highlighters"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Highlighters", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Highlighter");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto border-none pb-2 pt-1 no-scrollbar active:cursor-grabbing sm:gap-4">
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
