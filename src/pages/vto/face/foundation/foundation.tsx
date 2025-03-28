import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { skin_tones } from "../../../../api/attributes/skin_tone";
import { textures } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { baseApiUrl, extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { useFoundationContext } from "./foundation-context";
import { useFoundationQuery } from "./foundation-query";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getFaceMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function FoundationSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <FamilyColorSelector />

        <ColorSelector />
      </div>

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useFoundationContext();

  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
      )}
      data-mode="lip-color"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {skin_tones
        .filter((c) => colorFamilyToInclude?.includes(c.id))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": colorFamily === item.id,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
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
            <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{item.name}</span>
          </button>
        ))}
    </div>
  );
}

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
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
    <div className="mx-auto w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2 no-scrollbar",
        isRTL ? "space-x-reverse space-x-3 sm:space-x-reverse sm:space-x-4" : "space-x-3 sm:space-x-4"
      )}>
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
          onClick={() => {
            resetFoundation();
          }}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
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
    <div className="mx-auto w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2 no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
      )}>
        {textures.map((texture, index) => (
          <button
            key={texture.value}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
              {
                "border-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                  selectedTexture === texture.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
            )}
            onClick={() => setMaterial(index, texture)}
          >
            <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{t("texture."+texture.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { selectedProductNumber, setSelectedProductNumber, addCartProductNumber, setAddCartProductNumber } = useSelecProductNumberContext()
  const { addItemToCart, setDataItem, setType } = useCartContext();
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

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setColorFamily(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "skin_tone",
          )?.value,
        );
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
          )?.value,
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
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setSelectedProductNumber(null);
      setColorFamily(null);
      setSelectedColor(null);
      setSelectedTexture(null)
      return
    }
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
      <div className={clsx("w-full", isRTL ? "text-left" : "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <button
          className="p-0 text-[0.625rem] text-white sm:py-1"
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
          {t("view_all")}
        </button>
      </div>
      <div className={clsx(
        "flex w-full overflow-x-auto border-none pb-2 pt-2 no-scrollbar active:cursor-grabbing",
        isRTL ? "gap-2 sm:gap-4" : "gap-2 sm:gap-4"
      )} dir={isRTL ? "rtl" : "ltr"}>
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