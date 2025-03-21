import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { useEffect, useRef, useState } from "react";
import { filterTextures } from "../../../../api/attributes/texture";
import { ColorPalette } from "../../../../components/color-palette";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { useMakeup } from "../../../../context/makeup-context";
import { useBlushContext } from "./blush-context";
import { useBlushQuery } from "./blush-query";
import { baseApiUrl, extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { Product } from "../../../../api/shared";
import { useSelecProductNumberContext } from "../../select-product-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { getFaceMakeupProductTypeIds } from "../../../../api/attributes/makeups";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";
import { useCartContext } from "../../../../context/cart-context";

export function BlushSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-2" dir={isRTL ? "rtl" : "ltr"}>
      <ColorSelector />

      <TextureSelector />

      <ShapeSelector />

      <ShadesSelector />

      <ProductList />
    </div>
  );
}

function ColorSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const {
    selectedColor,
    setSelectedColor,
    selectedColors,
    setSelectedColors,
    selectedMode,
  } = useBlushContext();
  const { setBlushColor, setShowBlush, showBlush, setBlushMode } = useMakeup();
  const replaceIndexRef = useRef(0);

  const { data } = useBlushQuery({
    texture: null,
  });

  const extracted_sub_colors = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  function resetColor() {
    if (showBlush) {
      setShowBlush(false);
    }

    setSelectedColors([]);
  }

  const handleColorClick = (color: string) => {
    if (!showBlush) {
      setShowBlush(true);
    }
    if (selectedColors.includes(color)) {
      // Deselect the color if it's already selected
      setSelectedColors(selectedColors.filter((c) => c !== color));
      setBlushColor(selectedColors.filter((c) => c !== color));
    } else if (selectedMode === "One") {
      setBlushMode("One");
      // In "One" mode, only one color can be selected
      setSelectedColors([color]);
      setBlushColor([color]);
    } else if (selectedMode === "Dual") {
      setBlushMode("Dual");
      if (selectedColors.length < 2) {
        // Add the color if less than two are selected
        setSelectedColors([...selectedColors, color]);
        setBlushColor([...selectedColors, color]);
      } else {
        // Replace the color based on replaceIndexRef
        const newSelectedColors = [...selectedColors];
        newSelectedColors[replaceIndexRef.current] = color;
        setSelectedColors(newSelectedColors);
        setBlushColor(newSelectedColors);
        // Update replaceIndexRef to alternate between 0 and 1
        replaceIndexRef.current = (replaceIndexRef.current + 1) % 2;
      }
    } else if (selectedMode === "Tri") {
      setBlushMode("Tri");
      if (selectedColors.length < 3) {
        setSelectedColors([...selectedColors, color]);
        setBlushColor([...selectedColors, color]);
      } else {
        const newSelectedColors = [...selectedColors];
        newSelectedColors[replaceIndexRef.current] = color;
        setSelectedColors(newSelectedColors);
        setBlushColor(newSelectedColors);
        replaceIndexRef.current =
          replaceIndexRef.current > 1 ? 0 : replaceIndexRef.current + 1;
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-none" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto py-0.5 no-scrollbar",
        isRTL ? "space-x-reverse space-x-3 sm:space-x-reverse sm:space-x-4" : "space-x-3 sm:space-x-4"
      )}>
        <button
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-transparent text-white/80",
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
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
            palette={{
              color: color,
            }}
            selected={selectedColors.includes(color)}
            onClick={() => handleColorClick(color)}
          />
        ))}
      </div>
    </div>
  );
}

const textures = filterTextures(["Metallic", "Matte", "Shimmer"]);
function TextureSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedTexture, setSelectedTexture } = useBlushContext();
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
    <div className="mx-auto w-full py-2" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
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
            <span className="text-[9.8px] lg:text-xs">{t("texture." + texture.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const blushes = [
  "/media/unveels/vto/blushes/blusher-1.png",
  "/media/unveels/vto/blushes/blusher-2.png",
  "/media/unveels/vto/blushes/blusher-3.png",
  "/media/unveels/vto/blushes/blusher-4.png",
  "/media/unveels/vto/blushes/blusher-5.png",
];

function ShapeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedShape, setSelectedShape } = useBlushContext();
  const { setBlushPattern } = useMakeup();

  function setPattern(pattern: number, patternName: string) {
    setBlushPattern(pattern);
    setSelectedShape(patternName);
  }

  return (
    <div className="mx-auto w-full py-2" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-reverse space-x-4" : "space-x-4"
      )}>
        {blushes.map((path, index) => (
          <button
            key={index}
            type="button"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-sm border border-transparent text-white/80",
              {
                "border-white/80": selectedShape === index.toString(),
              }
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

const shades: Array<"One" | "Dual" | "Tri"> = ["One", "Dual", "Tri"];

function ShadesSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { setSelectedMode, selectedMode, setSelectedColors, setReplaceIndex } =
    useBlushContext();
  const { setBlushMode, lipColors, setLipColors } = useMakeup();

  function setMode(mode: "One" | "Dual" | "Tri") {
    setSelectedMode(mode);
    if (mode === "One") {
      setBlushMode(mode);
    }
    if (mode == "Tri") {
      setBlushMode(mode);
    }

    if (mode === "One" && lipColors.length > 1) {
      const newColors = [lipColors[0]];
      setSelectedColors(newColors);
      setLipColors(newColors);
      setReplaceIndex(0);
    }
  }

  return (
    <div className="mx-auto w-full py-2" dir={isRTL ? "rtl" : "ltr"}>
      <div className={clsx(
        "flex w-full items-center overflow-x-auto no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
      )}>
        {shades.map((shade, index) => (
          <button
            key={shade}
            type="button"
            className={clsx(
              "relative inline-flex items-center rounded-full px-1 py-1 text-center text-sm transition-transform",
              {
                "-translate-y-0.5 text-white": selectedMode === shade,
                "text-white/80": selectedMode !== shade,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
            )}
            onClick={() => setMode(shade)}
          >
            {selectedMode === shade ? (
              <div className="absolute inset-0 flex items-center justify-center text-white blur-sm backdrop-blur-sm">
                {shade}
              </div>
            ) : null}
            <span className="relative text-[9.8px] sm:text-xs">{shade}</span>
          </button>
        ))}

        <div className="h-5 border border-r"></div>
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
    selectedColors,
    selectedTexture,
    setSelectedColors,
    setSelectedTexture,
    selectedMode,
  } = useBlushContext();

  const { setShowBlush, setBlushColor, setBlushMode, setBlushMaterial } =
    useMakeup();

  const { data, isLoading } = useBlushQuery({
    texture: selectedTexture,
  });

  useEffect(() => {
    setBlushColor(selectedColors);
    setBlushMode(selectedMode as "One" | "Dual" | "Tri");
    setBlushMaterial(
      textures.findIndex((item) => item.value === selectedTexture),
    );
    setShowBlush(selectedColors.length > 0);
  }, [selectedColors, selectedMode, selectedColors]);

  useEffect(() => {
    if (data?.items && selectedProductNumber) {
      const adjustedIndex = selectedProductNumber - 1;
      const matchedProduct = data.items[adjustedIndex];
      console.log(selectedProductNumber)
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setSelectedColors([
          matchedProduct.custom_attributes
            .find((item) => item.attribute_code === "hexacode")
            ?.value.split(",")[0],
        ]);
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

  const handleProductClick = (product: Product) => {
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
      setSelectedProductNumber(null);
      setSelectedColors([])
      setSelectedTexture(null)
      return
    }
    console.log(product);
    setSelectedProduct(product);
    setSelectedColors([
      product.custom_attributes
        .find((item) => item.attribute_code === "hexacode")
        ?.value.split(",")[0],
    ]);
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
          className="p-0 text-[0.550rem] 2xl:text-[0.625rem] text-white sm:py-0.5"
          onClick={() => {
            setMapTypes({
              Blushes: {
                attributeName: "face_makeup_product_types",
                values: getFaceMakeupProductTypeIds(["Blushes"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Blushes", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Blushes");
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