import clsx from "clsx";
import { textures } from "../../../../api/attributes/texture";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { useMakeup } from "../../../../context/makeup-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { baseApiUrl, extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useLipPlumperContext } from "./lip-plumper-context";
import { useLipPlumperQuery } from "./lip-plumper-query";
import { ColorPalette } from "../../../../components/color-palette";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import Lipplumper from "../../../../components/three/makeup/lipplumper";
import { getLipsMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function LipPlumperSelector() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2">
      <div>
        <ColorSelector />
      </div>

      <TextureSelector />

      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const { selectedColor, setSelectedColor } = useLipPlumperContext();

  const { setLipplumperColor, showLipplumper, setShowLipplumper } = useMakeup();

  const { data } = useLipPlumperQuery({
    hexacode: null,
    texture: null,
  });

  function resetColor() {
    if (showLipplumper) {
      setShowLipplumper(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showLipplumper) {
      setShowLipplumper(true);
    }

    setSelectedColor(color);
    setLipplumperColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  );

  console.log({
    extracted_sub_colors,
  });

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-1 2xl:py-2.5 no-scrollbar">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
          onClick={() => {
            resetColor();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>

        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={selectedColor === color}
            onClick={() => setColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function TextureSelector() {
  const { selectedTexture, setSelectedTexture } = useLipPlumperContext();
  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1 sm:py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {textures.map((texture, index) => (
          <button
            key={texture.label}
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
            <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{texture.label}</span>
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
  const { addItemToCart, setDataItem, setType } = useCartContext();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    selectedColor,
    setSelectedColor,
    selectedTexture,
    setSelectedTexture,
  } = useLipPlumperContext();

  const { data, isLoading } = useLipPlumperQuery({
    hexacode: selectedColor,
    texture: selectedTexture,
  });

  const { setShowLipplumper, setLipplumperColor, setLipTexture } = useMakeup();

  useEffect(() => {
    setLipplumperColor(selectedColor || "#ffffff");
    setShowLipplumper(selectedColor != null);
    const texture = textures.find((t) => t.value == selectedTexture);
    setLipTexture(texture?.label as "Matte" | "Gloss" | "Satin" | "Sheer" | "Shimmer" | "Metalic" | "Holographic");
  }, [selectedColor, selectedTexture]);

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(matchedProduct, selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
          )?.value || null
        );
        setSelectedTexture(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "texture",
          )?.value || null
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
            setType("unit")
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
              Lipplumper: {
                attributeName: "lips_makeup_product_type",
                values: getLipsMakeupProductTypeIds([
                  "Lip Plumpers",
                  "Lip Glosses",
                ]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Lipplumper", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Lip Plumper");
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
