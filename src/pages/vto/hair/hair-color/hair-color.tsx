import clsx from "clsx";

import { colors } from "../../../../api/attributes/color";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useHairColorContext } from "./hair-color-context";
import { useHairColorQuery } from "./hair-color-query";
import { useMakeup } from "../../../../context/makeup-context";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getHairColorProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";
import { baseApiUrl } from "../../../../utils/apiUtils";

export function HairColorSelector() {
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
    useHairColorContext();

  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
      )}
      data-mode="lip-color"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {colors
        .filter((c) => colorFamilyToInclude?.includes(c.value))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-full border border-transparent px-3 py-1 text-sm text-white/80",
              {
                "border-white/80": colorFamily === item.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
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
            <span className="text-[0.625rem]">{t("color." + item.label)}</span>
          </button>
        ))}
    </div>
  );
}

const haircolors = [
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 1.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 2.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 3.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 4.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 5.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 6.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 7.png",
  "/media/unveels/vto/haircolors/fcb451ec-5284-476f-9872-5b749dfee8d9 8.png",
];

const colorList = [
  "#d9be95",
  "#784405",
  "#403007",
  "#181305",
  "#181305",
  "#b7a189",
  "#483209",
];

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { hairColor, setHairColor, showHair, setShowHair } = useMakeup();
  const { selectedColor, setSelectedColor } = useHairColorContext();

  function setColor(color: number) {
    setSelectedColor(color.toString());
  }

  return (
    <div className="mx-auto w-full" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-0.5 no-scrollbar",
        isRTL ? "space-x-reverse space-x-3 sm:space-x-reverse sm:space-x-4" : "space-x-3 sm:space-x-4"
      )}>
        {haircolors.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedColor === index.toString(),
              }
            )}
            onClick={() => setColor(index)}
          >
            <img
              src={path}
              alt="Hair Color"
              className="h-[31.5px] w-[41.3px] rounded object-cover xl:h-[45px] xl:w-[59px] 2xl:h-[58.5px] 2xl:w-[76.7px]"
            />
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
    setSelectedColor,
    selectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
  } = useHairColorContext();

  const { setShowHair, setHairColor, hairColor } = useMakeup();

  useEffect(() => {
    if (selectedColor) {
      if (selectedColor.length == 7) {
        setHairColor(selectedColor);
      } else {
        setHairColor(colorList[parseInt(selectedColor)]);
        console.log(colorList[parseInt(selectedColor)]);
      }
      setShowHair(true);
    }
  }, [selectedColor]);

  const { data, isLoading } = useHairColorQuery({
    color: colorFamily,
    shape: null,
  });

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
    );
  }

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
          )?.value || null
        );
        setColorFamily(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "color",
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
      setColorFamily(null);
      setSelectedColor(null);
      return
    }
    console.log(product);
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(",")[0],
    );
  };

  return (
    <>
      <div className={clsx("w-full", isRTL ? "text-left" : "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Hair: {
                attributeName: "hair_color_product_type",
                values: getHairColorProductTypeIds([
                  "Permanent Color",
                  "Semi Permanent Color",
                  "Free Ammonia Color",
                ]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Hair", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Hair Color");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div className={clsx(
        "flex w-full overflow-x-auto border-none pb-2 pt-1 no-scrollbar active:cursor-grabbing",
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