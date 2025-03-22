import clsx from "clsx";
import { colors } from "../../../../api/attributes/color";
import { Icons } from "../../../../components/icons";
import { LoadingProducts } from "../../../../components/loading";
import { useMakeup } from "../../../../context/makeup-context";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import {
  baseApiUrl,
  extractUniqueCustomAttributes,
} from "../../../../utils/apiUtils";
import { useLipLinerContext } from "./lip-liner-context";
import { useLipLinerQuery } from "./lip-liner-query";
import { ColorPalette } from "../../../../components/color-palette";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getLipsMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function LipLinerSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";

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

      <SizeSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useLipLinerContext();
  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto py-1 no-scrollbar 2xl:py-2",
        isRTL ? "space-x-2 space-x-reverse" : "space-x-2",
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
              "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": colorFamily === item.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
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

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { colorFamily, selectedColor, setSelectedColor } = useLipLinerContext();
  const { setLiplinerColor, showLipliner, setShowLipliner } = useMakeup();

  const { data } = useLipLinerQuery({
    color: colorFamily,
    sub_color: null,
    texture: null,
  });

  function resetColor() {
    if (showLipliner) {
      setShowLipliner(false);
    }

    setSelectedColor(null);
  }

  function setColor(color: string) {
    if (!showLipliner) {
      setShowLipliner(true);
    }

    setSelectedColor(color);
    setLiplinerColor(color);
  }

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  );

  return (
    <div
      className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto py-0.5 no-scrollbar",
          isRTL
            ? "space-x-3 space-x-reverse sm:space-x-4 sm:space-x-reverse"
            : "space-x-3 sm:space-x-4",
        )}
      >
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
          )}
          onClick={resetColor}
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

// Todo: Update the sizes to match the actual sizes
const lipLinerSizes = [
  "Small",
  "Upper Lip",
  "Large Lower",
  "Large Narrower",
  "Large & Full",
  "Wider",
];

function SizeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const { selectedSize, setSelectedSize } = useLipLinerContext();
  const { liplinerPattern, setLiplinerPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setLiplinerPattern(pattern);
    setSelectedSize(patternName);
  }

  return (
    <div
      className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={clsx(
          "flex w-full items-center overflow-x-auto no-scrollbar",
          isRTL ? "space-x-4 space-x-reverse" : "space-x-4",
        )}
      >
        {lipLinerSizes.map((size, index) => (
          <button
            key={size}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded border border-transparent px-2 py-1 text-[0.625rem] text-white/80",
              {
                "border-white/80": selectedSize === size,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2",
            )}
            onClick={() => setPattern(index, size)}
          >
            <img
              src={`/media/unveels/vto/lipliners/lipliner ${size.toLowerCase()}.png`}
              alt={size}
              className="size-[25px] shrink-0 sm:size-[30px] lg:size-[40px]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const {
    selectedProductNumber,
    setSelectedProductNumber,
    addCartProductNumber,
    setAddCartProductNumber,
  } = useSelecProductNumberContext();
  const { addItemToCart, setDataItem, setType } = useCartContext();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedSize: selectedShade,
  } = useLipLinerContext();

  const { data, isLoading } = useLipLinerQuery({
    color: colorFamily,
    sub_color: null,
    texture: null,
  });

  const { setLiplinerColor, setLiplinerPattern, setShowLipliner } = useMakeup();

  useEffect(() => {
    setLiplinerColor(selectedColor || "#ffffff");
    const pattern = lipLinerSizes.findIndex((s) => s == selectedShade);
    setLiplinerPattern(pattern != -1 ? pattern : 1);
    setShowLipliner(selectedColor != null);
  }, [selectedColor, selectedShade]);

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
      console.log(selectedProductNumber);
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColor(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "hexacode",
          )?.value || null,
        );
        setColorFamily(
          matchedProduct.custom_attributes.find(
            (item) => item.attribute_code === "color",
          )?.value || null,
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
            setType("unit");
            setDataItem(matchedProduct);
            setAddCartProductNumber(null);
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
      return;
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
      <div
        className={clsx("w-full", isRTL ? "text-left" : "text-right")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <button
          className="p-0 text-[0.550rem] text-white sm:py-0.5 2xl:text-[0.625rem]"
          onClick={() => {
            setMapTypes({
              Lipliners: {
                attributeName: "lips_makeup_product_type",
                values: getLipsMakeupProductTypeIds(["Lip Liners"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Lipliners", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Lipliners");
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>
      <div
        className={clsx(
          "flex w-full overflow-x-auto border-none pb-2 pt-1 no-scrollbar active:cursor-grabbing",
          isRTL ? "gap-2 sm:gap-4" : "gap-2 sm:gap-4",
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {isLoading ? (
          <LoadingProducts />
        ) : (
          data?.items.map((product, index) => {
            return (
              <VTOProductCard
                product={product}
                productNumber={index + 1}
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
