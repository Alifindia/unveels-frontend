import clsx from "clsx";
import { Icons } from "../../../../components/icons";

import { filterOccasions } from "../../../../api/attributes/occasion";
import { LoadingProducts } from "../../../../components/loading";
import { VTOProductCard } from "../../../../components/vto/vto-product-card";
import { extractUniqueCustomAttributes } from "../../../../utils/apiUtils";
import { TiaraProvider, useTiaraContext } from "./tiaras-context";
import { useTiarasQuery } from "./tiaras-query";
import { colors } from "../../../../api/attributes/color";
import { Product } from "../../../../api/shared";
import { useEffect, useState } from "react";
import { getHexCodeSubColor } from "../../../../api/attributes/sub_color";
import { ColorPalette } from "../../../../components/color-palette";
import { useAccesories } from "../../../../context/accesories-context";
import { useFindTheLookContext } from "../../../../context/find-the-look-context";
import { headAccessoriesProductTypeFilter } from "../../../../api/attributes/accessories";
import { useTranslation } from "react-i18next";
import { getCookie } from "../../../../utils/other";

export function TiaraSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  useEffect(() => {
    const storeLang = getCookie("store");
    const lang = storeLang === "ar" ? "ar" : "en";
    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <div className="mx-auto w-full divide-y px-4" dir={isRTL ? "rtl" : "ltr"}>
      <FamilyColorSelector />
      <ColorSelector />
      <ModeSelector />
      <TiaraProductList />
    </div>
  );
}

function FamilyColorSelector() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, setColorFamily, colorFamilyToInclude } =
    useTiaraContext();

  return (
    <div
      className={clsx(
        "flex w-full items-center overflow-x-auto py-1 2xl:py-2 no-scrollbar",
        isRTL ? "space-x-reverse space-x-2" : "space-x-2"
      )}
      dir={isRTL ? "rtl" : "ltr"}
      data-mode="lip-color"
    >
      {colors
        .filter((c) => colorFamilyToInclude?.includes(c.value))
        .map((item, index) => (
          <button
            type="button"
            className={clsx(
              "inline-flex h-5 shrink-0 items-center rounded-full border border-transparent px-2 py-1 text-white/80",
              {
                "border-white/80": colorFamily === item.value,
              },
              isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
            )}
            onClick={() =>
              setColorFamily(colorFamily == item.value ? null : item.value)
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
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { colorFamily, selectedColor, setSelectedColor } = useTiaraContext();
  const { data } = useTiarasQuery({
    color: colorFamily,
    material: null,
    occasion: null,
  });

  const extractHexa = extractUniqueCustomAttributes(
    data?.items ?? [],
    "hexacode",
  ).flatMap((item) => item.split(","));

  const extractSubColor = extractUniqueCustomAttributes(
    data?.items ?? [],
    "sub_color",
  ).flatMap((item) => getHexCodeSubColor(item) ?? "");

  const extracted_sub_colors =
    extractHexa.length > 0 ? extractHexa : extractSubColor;

  return (
    <div className="mx-auto w-full py-[1px] lg:py-0.5 2xl:py-1" dir={isRTL ? "rtl" : "ltr"}>
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
          onClick={() => setSelectedColor(null)}
        >
          <Icons.empty className="size-5 sm:size-[1rem] 2xl:size-6" />
        </button>
        {extracted_sub_colors.map((color, index) => (
          <ColorPalette
            key={color}
            size="large"
            palette={{ color }}
            selected={color == selectedColor}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}

function ModeSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedMode, setSelectedMode } = useTiaraContext();

  return (
    <>
      <div className="flex h-[30px] w-full items-center justify-between text-center sm:h-[35px]" dir={isRTL ? "rtl" : "ltr"}>
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "occasions",
              "text-white/60": selectedMode !== "occasions",
            },
          )}
          onClick={() => setSelectedMode("occasions")}
        >
          Occasion
        </button>
        <div className="h-5 border-r border-white"></div>
        <button
          className={clsx(
            "relative grow text-[10.4px] sm:text-base lg:text-[20px]",
            {
              "text-white": selectedMode === "materials",
              "text-white/60": selectedMode !== "materials",
            },
          )}
          onClick={() => setSelectedMode("materials")}
        >
          Material
        </button>
      </div>

      {selectedMode === "occasions" ? <OccasionSelector /> : <FabricSelector />}
    </>
  );
}

const occasions = filterOccasions(["Bridal", "Soiree"]);

function OccasionSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedOccasion, setSelectedOccasion } = useTiaraContext();

  return (
    <div className={clsx(
      "flex w-full items-center overflow-x-auto !border-t-0 py-2 no-scrollbar",
      isRTL ? "space-x-reverse space-x-2" : "space-x-2"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {occasions.map((occasion, index) => (
        <button
          key={occasion.value}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedOccasion === occasion.value,
            },
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
          onClick={() => setSelectedOccasion(occasion.value)}
        >
          <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{occasion.label}</span>
        </button>
      ))}
    </div>
  );
}

const materials = [
  {
    name: "Pearls",
    image:
      "/media/unveels/vto/tiara-materials/e4108386-f7a9-4342-ba51-c163dd965967 1.png",
  },
  {
    name: "Crystals",
    image:
      "/media/unveels/vto/tiara-materials/7a9885af-a00a-4a07-8a3b-b8f8e5eb059d 1.png",
  },
  {
    name: "Rubies",
    image:
      "/media/unveels/vto/tiara-materials/d9dbfba7-fa55-4aa9-9281-908381b4296e 1.png",
  },
];

function FabricSelector() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { selectedMaterial, setSelectedMaterial } = useTiaraContext();

  return (
    <div className={clsx(
      "flex w-full items-center overflow-x-auto !border-t-0 py-2 no-scrollbar",
      isRTL ? "space-x-reverse space-x-2" : "space-x-2"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {materials.map((material, index) => (
        <button
          key={material.name}
          type="button"
          className={clsx(
            "inline-flex shrink-0 items-center rounded-full border border-white/80 px-1 py-[1px] text-white/80 sm:px-2 sm:py-0.5",
            {
              "selectedShape-white/80 bg-gradient-to-r from-[#CA9C43] to-[#473209]":
                selectedMaterial === material.name,
            },
            isRTL ? "gap-x-reverse gap-x-2" : "gap-x-2"
          )}
          onClick={() => setSelectedMaterial(material.name)}
        >
          <img
            src={material.image}
            alt={material.name}
            className="size-6 shrink-0"
          />
          <span className="text-[9.8px] xl:text-[10px] 2xl:text-sm">{material.name}</span>
        </button>
      ))}
    </div>
  );
}

function TiaraProductList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { setView, setSectionName, setMapTypes, setGroupedItemsData } =
    useFindTheLookContext();

  const {
    colorFamily,
    setColorFamily,
    setSelectedColor,
    colorFamilyToInclude,
    setColorFamilyToInclude,
    setSelectedMaterial,
    selectedOccasion,
    setSelectedOccasion,
  } = useTiaraContext();

  const { data, isLoading } = useTiarasQuery({
    color: colorFamily,
    occasion: selectedOccasion,
    material: null,
  });

  if (colorFamilyToInclude == null && data?.items != null) {
    setColorFamilyToInclude(
      data.items.map(
        (d) =>
          d.custom_attributes.find((c) => c.attribute_code === "color")?.value,
      ),
    );
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setColorFamily(
      product.custom_attributes.find((item) => item.attribute_code === "color")
        ?.value,
    );
    setSelectedColor(
      getHexCodeSubColor(
        product.custom_attributes.find(
          (item) => item.attribute_code === "sub_color",
        )?.value,
      ) ?? null,
    );
    setSelectedMaterial(
      product.custom_attributes.find(
        (item) => item.attribute_code === "material",
      )?.value,
    );
    setSelectedOccasion(
      product.custom_attributes.find(
        (item) => item.attribute_code === "occasion",
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
              Tiaras: {
                attributeName: "head_accessories_product_type",
                values: headAccessoriesProductTypeFilter(["Tiaras"]),
              },
            });
            setGroupedItemsData({
              makeup: [{ label: "Tiaras", section: "makeup" }],
              accessories: [],
            });
            setSectionName("Tiaras");
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