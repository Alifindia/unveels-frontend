import clsx from "clsx";
import { ColorPalette } from "../../../../components/color-palette";
import { Icons } from "../../../../components/icons";
import { EyeLinerProvider, useEyeLinerContext } from "./eye-liner-context";
import { colors } from "../../../../api/attributes/color";
import { useEyelinerQuery } from "./eye-liner-query";
import { baseApiUrl, extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { patterns } from "../../../../api/attributes/pattern";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { useMakeup } from "../../../../context/makeup-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getEyeMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function EyeLinerSelector() {
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

      <ShapeSelector />

      <ProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useEyeLinerContext();

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
            <span className="text-[0.625rem]">{item.label}</span>
          </button>
        ))}
    </div>
  );
}

function ColorSelector() {
  const { colorFamily, selectedColor, setSelectedColor } = useEyeLinerContext();
  const { data } = useEyelinerQuery({
    color: colorFamily,
    pattern: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1">
      <div className="flex w-full items-center space-x-4 overflow-x-auto py-1 2xl:py-2.5 no-scrollbar">
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

const eyeliners = [
  "/media/unveels/vto/eyeliners/eyeliners_arabic-down 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_arabic-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_arabic-up 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_double-mod 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_down-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_middle-light 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_open-wings 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-basic 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-bold 1.png",
  "/media/unveels/vto/eyeliners/eyeliners_up-light 1.png",
];

function ShapeSelector() {
  const { selectedShape, setSelectedShape } = useEyeLinerContext();
  return (
    <div className="mx-auto w-full py-2">
      <div className="flex w-full items-center space-x-4 overflow-x-auto no-scrollbar">
        {patterns.eyeliners.map((pattern, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === pattern.value,
              },
            )}
            onClick={() => {
              if (selectedShape === pattern.value) {
                setSelectedShape(null);
              } else {
                setSelectedShape(pattern.value);
              }
            }}
          >
            <img
              src={eyeliners[index % eyeliners.length]}
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { selectedProductNumber, setSelectedProductNumber, addCartProductNumber, setAddCartProductNumber } = useSelecProductNumberContext()
  const { addItemToCart, setDataItem, setType } = useCartContext();
  const { t } = useTranslation();
  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    selectedColor,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    selectedShape,
  } = useEyeLinerContext();

  const { data, isLoading } = useEyelinerQuery({
    color: colorFamily,
    pattern: null,
  });

  const { setEyelinerColor, setEyelinerPattern, setShowEyeliner } = useMakeup();

  useEffect(() => {
    setEyelinerColor(selectedColor || "#ffffff");
    var pattern = patterns["eyeliners"].findIndex(
      (e) => e.value == selectedShape,
    );
    setEyelinerPattern(pattern != -1 ? pattern : 0);
    setShowEyeliner(selectedColor != null);
  }, [selectedColor, selectedShape]);
  
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

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
    );
  }

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
      <div className="w-full text-right">
        <button
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Eyeliners: {
                attributeName: "eye_makeup_product_type",
                values: getEyeMakeupProductTypeIds(["Eyeliners"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Eyeliners", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Eyeliners");
            setView("all_categories");
          }}
        >
          {t("view_all")}
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
