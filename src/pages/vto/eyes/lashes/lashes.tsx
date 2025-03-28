import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { LashesProvider, useLashesContext } from "./lashes-context";
import { ColorPalette } from "../../../../components/color-palette";
import { Link } from "react-router-dom";
import { useLashesQuery } from "./lashes-query";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { patterns } from "../../../../api/attributes/pattern";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getLashMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";
import { baseApiUrl } from "../../../../utils/apiUtils";
import { useMakeup } from "../../../../context/makeup-context";

const colorFamilies = [{ name: "Black", value: "#000000" }];

export function LashesSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <FamilyColorSelector />

      <ColorSelector />

      <div className="flex h-[30px] w-full items-center justify-between text-center sm:h-[35px]">
        <Link
          className={`relative grow text-[10.4px] lg:text-[13px] 2xl:text-[20px]`}
          to="/virtual-try-on/lashes"
        >
          <span className={"text-white"}>Lashes</span>
        </Link>
        <div className="h-5 border-r border-white"></div>
        <Link
          className={`relative grow text-[10.4px] lg:text-[13px] 2xl:text-[20px]`}
          to="/virtual-try-on/mascara"
        >
          <span className={"text-white/60"}>Mascara</span>
        </Link>
      </div>

      <ShapeSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, setColorFamily } = useLashesContext();

  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2 no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
      )}
      data-mode="lip-color"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {colorFamilies.map((item, index) => (
        <button
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-white/80",
            {
              "border-white/80": colorFamily === item.name,
            },
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
          onClick={() => setColorFamily(item.name)}
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{
              background: item.value,
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
  const { selectedColor, setSelectedColor } = useLashesContext();
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
            setSelectedColor(null);
          }}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>
        {["#000000"].map((color, index) => (
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

const eyelashes = [
  "/media/unveels/vto/eyelashesh/eyelashes-1.png",
  "/media/unveels/vto/eyelashesh/eyelashes-2.png",
  "/media/unveels/vto/eyelashesh/eyelashes-3.png",
  "/media/unveels/vto/eyelashesh/eyelashes-4.png",
  "/media/unveels/vto/eyelashesh/eyelashes-5.png",
  "/media/unveels/vto/eyelashesh/eyelashes-6.png",
  "/media/unveels/vto/eyelashesh/eyelashes-7.png",
  "/media/unveels/vto/eyelashesh/eyelashes-8.png",
  "/media/unveels/vto/eyelashesh/eyelashes-9.png",
];

function ShapeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedPattern, setSelectedPattern } = useLashesContext();
  return (
    <div className="mx-auto w-full !border-t-0 py-1 2xl:py-2" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-reverse space-x-4" : "space-x-4"
      )}>
        {patterns.eyelashes.map((pattern, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedPattern === pattern.value,
              }
            )}
            onClick={() => {
              if (selectedPattern === pattern.value) {
                setSelectedPattern(null);
              } else {
                setSelectedPattern(pattern.value);
              }
            }}
          >
            <img
              src={eyelashes[index % eyelashes.length]}
              alt="Eyebrow"
              className="size-[25px] rounded sm:size-[30px] lg:size-[35px]"
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

  const { setColorFamily, colorFamily, selectedPattern, setSelectedColor, selectedColor } = useLashesContext();

  const { data, isLoading } = useLashesQuery({
    color: colorFamily,
    pattern: selectedPattern,
  });
  const { setLashesColor, setLashesPattern, setShowLashes, setShowMascara } = useMakeup();

  useEffect(() => {
    setLashesColor(selectedColor || "#ffffff");
    var pattern = patterns["eyelashes"].findIndex(
      (e) => e.value == selectedPattern,
    );
    console.log(pattern)
    setLashesPattern(pattern != -1 ? pattern : 0);
    setShowLashes(selectedColor != null);
    console.log(selectedColor)
    setShowMascara(false);
  }, [selectedColor, selectedPattern]);

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setColorFamily(
          matchedProduct.custom_attributes.find((item) => item.attribute_code === "color")
            ?.value,
        );
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
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
      product.custom_attributes.find(
        (item) => item.attribute_code === "hexacode",
      )?.value,
    );
  };

  return (
    <>
      <div className={clsx("w-full", isRTL ? "text-left" : "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Lash: {
                attributeName: "brow_makeup_product_type",
                values: getLashMakeupProductTypeIds([
                  "Individual False Lashes",
                  "Full Line Lashes",
                  "Lash Curlers",
                ]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Lash", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Lashes");
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