import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { Link } from "react-router-dom";
import { colors } from "../../../../api/attributes/color";
import { ColorPalette } from "../../../../components/color-palette";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import {
  baseApiUrl,
  extractUniqueCustomAttributes,
} from "../../../../utils/apiUtils";
import { MascaraProvider, useMascaraContext } from "./mascara-context";
import { useMascaraQuery } from "./mascara-query";
import { useEffect, useState } from "react";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getLashMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";
import { useMakeup } from "../../../../context/makeup-context";

export function MascaraSelector() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2">
      <FamilyColorSelector />

      <ColorSelector />

      <div className="flex h-[30px] w-full items-center justify-between text-center sm:h-[35px]">
        <Link
          className={`relative grow text-xs lg:text-[14px]`}
          to="/virtual-try-on/lashes"
        >
          <span className={"text-white/60"}>Lashes</span>
        </Link>
        <div className="h-5 border-r border-white"></div>
        <Link
          className={`relative grow text-xs lg:text-[14px]`}
          to="/virtual-try-on/mascara"
        >
          <span className={"text-white"}>Mascara</span>
        </Link>
      </div>

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t } = useTranslation()
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useMascaraContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-1 no-scrollbar 2xl:py-2"
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
            <span className="text-[0.625rem]">{t("color." + item.label)}</span>
          </button>
        ))}
    </div>
  );
}

function ColorSelector() {
  const { colorFamily, selectedColor, setSelectedColor } = useMascaraContext();
  const { data } = useMascaraQuery({
    color: colorFamily,
    sub_color: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-1 no-scrollbar sm:space-x-4 2xl:py-2">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
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
            selected={selectedColor === color}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductList() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const {
    selectedProductNumber,
    setSelectedProductNumber,
    addCartProductNumber,
    setAddCartProductNumber,
  } = useSelecProductNumberContext();

  const { addItemToCart, setDataItem, setType } = useCartContext();
  const { setShowMascara, setMascaraColor, setShowLashes } = useMakeup();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedColor,
  } = useMascaraContext();

  useEffect(() => {
    setMascaraColor(selectedColor || "#000000");
    setShowMascara(selectedColor != null);
    setShowLashes(false);
  }, [selectedColor]);

  const { data, isLoading } = useMascaraQuery({
    color: colorFamily,
    sub_color: null,
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
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.550rem] text-white sm:py-0.5 2xl:text-[0.625rem]"
          onClick={() => {
            setMapTypes({
              Mascara: {
                attributeName: "brow_makeup_product_type",
                values: getLashMakeupProductTypeIds(["Mascaras"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Mascara", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Lashes");
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
