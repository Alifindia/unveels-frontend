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

const colorFamilies = [{ name: "Black", value: "#000000" }];

export function LashesSelector() {
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

      <div className="flex h-[35px] w-full items-center justify-between text-center sm:h-10">
        <Link
          className={`relative grow text-[10.4px] sm:text-base lg:text-[20px]`}
          to="/virtual-try-on/lashes"
        >
          <span className={"text-white"}>Lashes</span>
        </Link>
        <div className="h-5 border-r border-white"></div>
        <Link
          className={`relative grow text-[10.4px] sm:text-base lg:text-[20px]`}
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
  const { colorFamily, setColorFamily } = useLashesContext();

  return (
    <div
      className="flex w-full items-center space-x-2 overflow-x-auto py-2 no-scrollbar"
      data-mode="lip-color"
    >
      {colorFamilies.map((item, index) => (
        <button
          type="button"
          className={clsx(
            "inline-flex h-5 shrink-0 items-center gap-x-2 rounded-full border border-transparent px-2 py-1 text-white/80",
            {
              "border-white/80": colorFamily === item.name,
            },
          )}
          onClick={() => setColorFamily(item.name)}
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{
              background: item.value,
            }}
          />
          <span className="text-[9.8px] xl:text-xs 2xl:text-sm">{item.name}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSelector() {
  return (
    <div className="mx-auto w-full">
      <div className="flex w-full items-center space-x-3 overflow-x-auto py-2 no-scrollbar sm:space-x-4">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-x-2 rounded-full border border-transparent text-white/80"
        >
          <Icons.empty className="size-5 sm:size-[1.875rem]" />
        </button>
        {["#000000"].map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{
              color: color,
            }}
            selected={true}
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
  const { selectedPattern, setSelectedPattern } = useLashesContext();
  return (
    <div className="mx-auto w-full !border-t-0 py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {patterns.eyelashes.map((pattern, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedPattern === pattern.value,
              },
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
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { selectedProductNumber, setSelectedProductNumber, addCartProductNumber, setAddCartProductNumber } = useSelecProductNumberContext()
  const { addItemToCart, setDataItem } = useCartContext();
  
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const { colorFamily, selectedPattern } = useLashesContext();

  const { data, isLoading } = useLashesQuery({
    color: colorFamily,
    pattern: selectedPattern,
  });

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
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
      return
    }
    console.log(product);
    setSelectedProduct(product);
  };

  return (
    <>
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.625rem] text-white sm:py-0.5"
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
