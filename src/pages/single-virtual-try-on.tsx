import {
  ChevronDown,
  ChevronLeft,
  Heart,
  HeartIcon,
  Plus,
  PlusIcon,
  X,
} from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { Icons } from "../components/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";

import clsx from "clsx";
import {
  handAccessoriesProductTypeFilter,
  headAccessoriesProductTypeFilter,
  neckAccessoriesProductTypeFilter,
} from "../api/attributes/accessories";
import {
  faceMakeupProductTypesFilter,
  getEyeMakeupProductTypeIds,
  getFaceMakeupProductTypeIds,
  getLashMakeupProductTypeIds,
  lipsMakeupProductTypesFilter,
} from "../api/attributes/makeups";
import { useMultipleProductsQuery } from "../api/get-product";
import { Product } from "../api/shared";
import { Footer } from "../components/footer";
import { SkinColorProvider } from "../components/skin-tone-finder-scene/skin-color-context";
import { VirtualTryOnScene } from "../components/vto/virtual-try-on-scene";
import {
  AccesoriesProvider,
  useAccesories,
} from "../context/accesories-context";
import { MakeupProvider, useMakeup } from "../context/makeup-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { useVirtualTryOnProduct } from "../context/virtual-try-on-product-context";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { VirtualTryOnProvider } from "./virtual-try-on";
import { SingleEyeLinerSelector } from "./vto/eyes/eye-liners/eye-liner-single";
import { SingleEyeShadowSelector } from "./vto/eyes/eye-shadow/eye-shadow-single";
import { SingleEyebrowsSelector } from "./vto/eyes/eyebrows/eyebrows-single";
import { SingleLashesSelector } from "./vto/eyes/lashes/lashes-single";
import { SingleLenseSelector } from "./vto/eyes/lenses/lense-single";
import { SingleMascaraSelector } from "./vto/eyes/mascara/mascara-single";
import { SingleBlushSelector } from "./vto/face/blush/blush-single";
import { SingleBronzerSelector } from "./vto/face/bronzer/bronzer-single";
import { SingleConcealerSelector } from "./vto/face/concealer/concealer-single";
import { SingleContourSelector } from "./vto/face/contour/contour-single";
import { SingleFoundationSelector } from "./vto/face/foundation/foundation-single";
import { SingleHighlighterSelector } from "./vto/face/highlighter/highlighter-single";
import { SingleHairColorSelector } from "./vto/hair/hair-color/hair-color-single";
import { SingleHandwearSelector } from "./vto/hand-accessories/handwear/handwear-single";
import { SingleWatchesSelector } from "./vto/hand-accessories/watches/watches-single";
import { SingleEarringsSelector } from "./vto/head-accesories/earrings/earrings-single";
import { SingleGlassesSelector } from "./vto/head-accesories/glasses/glasses-single";
import { SingleHatsSelector } from "./vto/head-accesories/hats/hats-single";
import { SingleHeadbandSelector } from "./vto/head-accesories/headband/headband-single";
import { SingleTiaraSelector } from "./vto/head-accesories/tiaras/tiaras-single";
import { SingleLipColorSelector } from "./vto/lips/lip-color/lip-color-single";
import { SingleLipLinerSelector } from "./vto/lips/lip-liner/lip-liner-single";
import { SingleLipPlumperSelector } from "./vto/lips/lip-plumper/lip-plumper-single";
import { SingleNailPolishSelector } from "./vto/nails/nail-polish/nail-polish-single";
import { SinglePressOnNailsSelector } from "./vto/nails/press-on-nails/press-on-nails-single";
import { SingleNeckwearSelector } from "./vto/neck-accessories/neckwear/neckwear-single";
import { SingleScarvesSelector } from "./vto/neck-accessories/scarves/scarves-single";
import { BrandName } from "../components/product/brand";
import {
  FindTheLookProvider,
  useFindTheLookContext,
} from "../context/find-the-look-context";

import { useTranslation } from "react-i18next";
import { getCurrencyAndRate } from "../utils/other";
import { exchangeRates } from "../utils/constants";
import { useCartContext } from "../context/cart-context";
import { textures } from "../api/attributes/texture";
import SuccessPopup from "../components/popup-add-to-cart";
import DialogPopup from "../components/dialog-popup";

export const productTypeCheckers = {
  isLipColorProduct: (data: Product) => {
    const lipColorsTypes = ["Lipsticks", "Lip Stains", "Lip Tints"];
    const productType = getProductAttributes(data, "lips_makeup_product_type");
    return productType && lipsMakeupProductTypesFilter(lipColorsTypes)
      .split(",")
      .includes(productType);
  },
  isLipLinerProduct: (data: Product) => {
    const productType = getProductAttributes(data, "lips_makeup_product_type");
    return productType && lipsMakeupProductTypesFilter(["Lip Liners"])
      .split(",")
      .includes(productType);
  },
  isContourProduct: (data: Product) => {
    const productType = getProductAttributes(data, "face_makeup_product_type");
    return productType && getFaceMakeupProductTypeIds(["Contour"]).includes(productType);
  },
  isHighlighterProduct: (data: Product) => {
    const productType = getProductAttributes(data, "face_makeup_product_type");
    return productType && getFaceMakeupProductTypeIds(["Highlighter"]).includes(productType);
  },
  isNailPolishProduct: (data: Product) => {
    const productTypes = getProductAttributes(data, "product_types");
    return productTypes && productTypes.includes("Nail Polish");
  },
  isPressOnNailsProduct: (data: Product) => {
    const productTypes = getProductAttributes(data, "product_types");
    return productTypes && productTypes.includes("Press-On Nails");
  },
  isEarringsProduct: (data: Product) => {
    const productType = getProductAttributes(data, "head_accessories_product_type");
    return productType && headAccessoriesProductTypeFilter(["Earrings"]).includes(productType);
  },
  isScarvesProduct: (data: Product) => {
    const productType = getProductAttributes(data, "neck_accessories_product_type");
    return productType && neckAccessoriesProductTypeFilter(["Scarves"]).includes(productType);
  },
  isGlassesProduct: (data: Product) => {
    const productType = getProductAttributes(data, "head_accessories_product_type");
    return productType && headAccessoriesProductTypeFilter(["Glasses"]).includes(productType);
  },
  isTiarasProduct: (data: Product) => {
    const productType = getProductAttributes(data, "head_accessories_product_type");
    return productType && headAccessoriesProductTypeFilter(["Tiaras"]).includes(productType);
  },
  isHatsProduct: (data: Product) => {
    const productType = getProductAttributes(data, "head_accessories_product_type");
    return productType && headAccessoriesProductTypeFilter(["Hats"]).includes(productType);
  },
  isHeadbandProduct: (data: Product) => {
    const productType = getProductAttributes(data, "head_accessories_product_type");
    return productType && headAccessoriesProductTypeFilter(["Head Bands"]).includes(productType);
  },
  isWatchesProduct: (data: Product) => {
    const productType = getProductAttributes(data, "hand_accessories_product_type");
    return productType && handAccessoriesProductTypeFilter(["Watches"]).includes(productType);
  },
  isNeckwearProduct: (data: Product) => {
    const productType = getProductAttributes(data, "neck_accessories_product_type");
    return productType && neckAccessoriesProductTypeFilter([
      "Chokers",
      "Necklaces",
      "Pendants",
    ]).includes(productType);
  },
  isLashesProduct: (data: Product) => {
    const productType = getProductAttributes(data, "lash_makeup_product_type");
    return productType && getLashMakeupProductTypeIds([
      "Lash Curlers",
      "Individual False Lashes",
      "Full Line Lashes",
    ]).includes(productType);
  },
  isMascaraProduct: (data: Product) => {
    const productType = getProductAttributes(data, "lash_makeup_product_type");
    return productType && getLashMakeupProductTypeIds(["Mascaras"]).includes(productType);
  },
  isEyeLinerProduct: (data: Product) => {
    const productType = getProductAttributes(data, "eye_makeup_product_type");
    return productType && getEyeMakeupProductTypeIds(["Eyeliners"]).includes(productType);
  },
  isEyeShadowProduct: (data: Product) => {
    const productType = getProductAttributes(data, "eye_makeup_product_type");
    return productType && getEyeMakeupProductTypeIds(["Eyeshadows"]).includes(productType);
  },
  isEyebrowsProduct: (data: Product) => {
    return !!getProductAttributes(data, "brow_makeup_product_type");
  },
  isFoundationProduct: (data: Product) => {
    const productType = getProductAttributes(data, "face_makeup_product_type");
    return productType && faceMakeupProductTypesFilter(["Foundations"]).includes(productType);
  },
  isBlushProduct: (data: Product) => {
    const productType = getProductAttributes(data, "face_makeup_product_type");
    return productType && faceMakeupProductTypesFilter(["Blushes"]).includes(productType);
  },
  isBronzerProduct: (data: Product) => {
    const productType = getProductAttributes(data, "face_makeup_product_type");
    return productType && faceMakeupProductTypesFilter(["Bronzers"]).includes(productType);
  },
  isLipPlumperProduct: (data: Product) => {
    const productType = getProductAttributes(data, "lips_makeup_product_type");
    return productType && lipsMakeupProductTypesFilter([
      "Lip Plumpers",
      "Lip Glosses",
    ]).includes(productType);
  },
  isConcealerProduct: (data: Product) => {
    const productType = getProductAttributes(data, "face_makeup_product_type");
    return productType && getEyeMakeupProductTypeIds(["Concealers"]).includes(productType);
  },
  isLenseProduct: (data: Product) => {
    return !!getProductAttributes(data, "lenses_product_type");
  },
  isHairColorProduct: (data: Product) => {
    return !!getProductAttributes(data, "hair_color_product_type");
  },
  isHandwearProduct: (data: Product) => {
    const productType = getProductAttributes(data, "hand_accessories_product_type");
    return productType && handAccessoriesProductTypeFilter(["Bracelets", "Bangles"]).includes(productType);
  },
  isRingProduct: (data: Product) => {
    const productType = getProductAttributes(data, "hand_accessories_product_type");
    return productType && handAccessoriesProductTypeFilter(["Rings"]).includes(productType);
  },
};

export function LoadingScreen() {
  const { t } = useTranslation();

  const progressImageUrl = "/media/unveels/images/loading.gif";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center text-white">
        <p className="mb-4 animate-pulse text-lg font-semibold">
          {t("model_loading.label")}
        </p>
        <div className="mt-4">
          <img
            src={progressImageUrl}
            alt={`Progresss`}
            className="mx-auto w-full max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}

export function SingleVirtualTryOn() {
  const [selectedSKU, setSelectedSKU] = useState<Product | null>(null);
  const { skus } = useVirtualTryOnProduct();

  const { data, isLoading } = useMultipleProductsQuery({
    skus: skus,
  });

  useEffect(() => {
    console.log("Data from useQuery:", data);
  }, [data]);

  if (isLoading) {
    return (
      <div className="absolute inset-0">
        <div className="flex h-full items-center justify-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="absolute inset-0">
        <div className="flex h-full items-center justify-center">
          No products found
        </div>
      </div>
    );
  }

  return (
    <VTOProviders>
      <Main
        product={selectedSKU ?? data[0]}
        skus={data}
        setSelectedSKU={setSelectedSKU}
      />
    </VTOProviders>
  );
}

function VTOProviders({ children }: { children: React.ReactNode }) {
  return (
    <CameraProvider>
      <SkinColorProvider>
        <MakeupProvider>
          <AccesoriesProvider>
            <VirtualTryOnProvider>
              <FindTheLookProvider>
                <div className="h-full min-h-dvh">{children}</div>
              </FindTheLookProvider>
            </VirtualTryOnProvider>
          </AccesoriesProvider>
        </MakeupProvider>
      </SkinColorProvider>
    </CameraProvider>
  );
}

function Main({
  product,
  skus,
  setSelectedSKU,
}: {
  product: Product;
  skus: Product[];
  setSelectedSKU: React.Dispatch<React.SetStateAction<Product | null>>;
}) {
  const { criterias } = useCamera();
  const [isMainContentVisible, setMainContentVisible] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"IMAGE" | "VIDEO" | "LIVE">("LIVE");
  const [showChangeModel, setShowChangeModel] = useState(false);
  const { view, setView, sectionName, mapTypes, groupedItemsData } =
    useFindTheLookContext();
  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  const {
    setFoundationColor,
    setShowFoundation,
    setBlushColor,
    setBlushPattern,
    setBlushMaterial,
    setShowBlush,
    setBlushMode,
    setEyeShadowColor,
    setEyeShadowPattern,
    setEyeShadowMaterial,
    setShowEyeShadow,
    setEyeShadowMode,
    setShowEyeliner,
    setEyelinerColor,
    setEyelinerPattern,
    setShowLashes,
    setLashesColor,
    setLashesPattern,
    setShowMascara,
    setMascaraColor,
    setShowConcealer,
    setConcealerColor,
    setShowHighlighter,
    setHighlighterPattern,
    setHighlighterColor,
    setHighlighterMaterial,
    setShowContour,
    setContourMode,
    setContourColors,
    setContourShape,
    setShowLipliner,
    setLiplinerColor,
    setLiplinerPattern,
    setShowLipplumper,
    setLipplumperColor,
    setShowLipColor,
    setLipColorMode,
    setLipColors,
    setLipTexture,
    setShowBronzer,
    setBronzerColor,
    setBronzerPattern,
    setShowLens,
    setLensPattern,
    setShowEyebrows,
    setEyebrowsPattern,
    setEyebrowsVisibility,
    setEyebrowsColor,
    setShowHair,
    setHairColor,
    setShowNails,
    setShowPressOnNails,
    setNailsColor,
    setNailsTexture,
  } = useMakeup();
  const {
    setShowHat,
    setShowGlasess,
    setShowHeadband,
    setShowEarring,
    setShowNecklace,
    setShowWatch,
    setShowBracelet,
    setShowRing,
  } = useAccesories();

  useEffect(() => {
    skus.forEach((sku) => {
      if (productTypeCheckers.isLipColorProduct(sku)) {
        setShowLipColor(true);
        setLipColors(getProductAttributes(sku, "hexacode").split(","));
        setLipColorMode("One");
      }

      if (productTypeCheckers.isLipLinerProduct(sku)) {
        setShowLipliner(true);
        setLiplinerColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        setLiplinerPattern(1);
      }

      if (productTypeCheckers.isLipPlumperProduct(sku)) {
        setShowLipplumper(true);
        setLipplumperColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        const texture = textures.find(
          (t) => t.value == getProductAttributes(sku, "texture"),
        );
        setLipTexture(
          texture?.label as
            | "Matte"
            | "Shimmer"
            | "Satin"
            | "Sheer"
            | "Gloss"
            | "Metalic"
            | "Holographic",
        );
      }

      if (productTypeCheckers.isBlushProduct(sku)) {
        setShowBlush(true);
        setBlushColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        setBlushPattern(1);
        setBlushMaterial(0);
        setBlushMode("One");
      }

      if (productTypeCheckers.isEyeShadowProduct(sku)) {
        setShowEyeShadow(true);
        setEyeShadowColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        setEyeShadowPattern(1);
        setEyeShadowMaterial(0);
        setEyeShadowMode("One");
      }

      if (productTypeCheckers.isEyeLinerProduct(sku)) {
        setShowEyeliner(true);
        setEyelinerColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        setEyelinerPattern(1);
      }

      if (productTypeCheckers.isLashesProduct(sku)) {
        setShowLashes(true);
        setLashesColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        setLashesPattern(1);
      }

      if (productTypeCheckers.isMascaraProduct(sku)) {
        setShowMascara(true);
        setMascaraColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      if (productTypeCheckers.isFoundationProduct(sku)) {
        setShowFoundation(true);
        setFoundationColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      if (productTypeCheckers.isConcealerProduct(sku)) {
        setShowConcealer(true);
        setConcealerColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      if (productTypeCheckers.isHighlighterProduct(sku)) {
        setShowHighlighter(true);
        setHighlighterColor(
          getProductAttributes(sku, "hexacode").split(",")[0],
        );
        setHighlighterPattern(1);
        setHighlighterMaterial(0);
      }

      if (productTypeCheckers.isContourProduct(sku)) {
        setShowContour(true);
        setContourMode("One");
        setContourColors([getProductAttributes(sku, "hexacode").split(",")[0]]);
      }

      if (productTypeCheckers.isBronzerProduct(sku)) {
        setShowBronzer(true);
        setBronzerColor(getProductAttributes(sku, "hexacode").split(",")[0]);
        setBronzerPattern(1);
      }

      if (productTypeCheckers.isLenseProduct(sku)) {
        setShowLens(true);
        setLensPattern(1);
      }

      if (productTypeCheckers.isEyebrowsProduct(sku)) {
        setShowEyebrows(true);
        setEyebrowsPattern(1);
        setEyebrowsVisibility(1);
        setEyebrowsColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      if (productTypeCheckers.isHairColorProduct(sku)) {
        setShowHair(true);
        setHairColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      if (productTypeCheckers.isNailPolishProduct(sku)) {
        setShowNails(true);
        setNailsColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      if (productTypeCheckers.isPressOnNailsProduct(sku)) {
        setShowPressOnNails(true);
        setNailsColor(getProductAttributes(sku, "hexacode").split(",")[0]);
      }

      // Accessories
      if (productTypeCheckers.isHatsProduct(sku)) {
        setShowHat(true);
      }

      if (productTypeCheckers.isGlassesProduct(sku)) {
        setShowGlasess(true);
      }

      if (productTypeCheckers.isHeadbandProduct(sku)) {
        setShowHeadband(true);
      }

      if (productTypeCheckers.isEarringsProduct(sku)) {
        setShowEarring(true);
      }

      if (productTypeCheckers.isNeckwearProduct(sku)) {
        setShowNecklace(true);
      }

      if (productTypeCheckers.isWatchesProduct(sku)) {
        setShowWatch(true);
      }

      if (productTypeCheckers.isHandwearProduct(sku)) {
        setShowBracelet(true);
      }

      if (productTypeCheckers.isRingProduct(sku)) {
        setShowRing(true);
      }
    });
  }, [skus]);

  const { addItemToCart, setDataItem, setType, dataItem, type} = useCartContext();

  const handleAddToCart = async (id: string, url: string, dataProduct: any) => {
    try {
      await addItemToCart(id, url);
      setType("unit");
      setDataItem(dataProduct);
      console.log(`Product ${id} added to cart!`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  return (
    <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
      <div className="absolute inset-0">
        <SuccessPopup product={dataItem} type={type} />
        <VirtualTryOnScene mediaFile={mediaFile} mode={mode} />
      </div>
      <TopNavigation />

      <div className="absolute inset-x-0 top-24 space-y-2 px-4 sm:px-5">
        <div className="flex items-center">
          <button
            type="button"
            className="flex size-[1.25rem] items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl sm:size-[1.5rem]"
          >
            <HeartIcon className="text-[0.75rem] text-white sm:text-[1rem]" />
          </button>
          <div className="w-full pl-3 sm:pl-4">
            <div className="text-[0.75rem] font-semibold text-white sm:text-xs md:text-sm">
              {product.name}
            </div>
            <div className="text-[0.75rem] text-white/60 sm:text-xs md:text-sm">
              <BrandName brandId={getProductAttributes(product, "brand")} />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => {
              handleAddToCart(
                product.id.toString(),
                `${baseApiUrl}/${
                  product.custom_attributes.find(
                    (attr) => attr.attribute_code === "url_key",
                  )?.value as string
                }.html`,
                product,
              );
            }}
            type="button"
            className="flex size-[1.25rem] items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl sm:size-[1.5rem]"
          >
            <PlusIcon className="text-[0.75rem] text-white sm:text-[1rem]" />
          </button>
          <div className="w-full pl-3 sm:pl-4">
            <div className="text-[0.75rem] font-medium text-white sm:text-xs md:text-sm">
              {currencySymbol}
              {(product.price * rate).toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
        <div className="flex w-full">
          {/* SKUSelector Component */}
          <SKUSelector
            skus={skus}
            product={product}
            setSelectedSKU={setSelectedSKU}
          />

          {/* Sidebar Component */}
          <Sidebar
            onExpandClick={() => setMainContentVisible(!isMainContentVisible)}
            setMediaFile={setMediaFile}
            setMode={setMode}
            setShowChangeModel={setShowChangeModel}
          />
        </div>

        <div className="bg-black/10 p-1 shadow-lg backdrop-blur-sm">
          {isMainContentVisible && <MainContent product={product} />}
          <Footer />
        </div>
      </div>
    </div>
  );
}

function MainContent({ product }: { product: Product }) {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("product load ", product);
  });

  if (productTypeCheckers.isLipColorProduct(product)) {
    return <SingleLipColorSelector product={product} />;
  }

  if (productTypeCheckers.isLipLinerProduct(product)) {
    return <SingleLipLinerSelector product={product} />;
  }

  if (productTypeCheckers.isContourProduct(product)) {
    return <SingleContourSelector product={product} />;
  }

  if (productTypeCheckers.isHighlighterProduct(product)) {
    return <SingleHighlighterSelector product={product} />;
  }

  if (productTypeCheckers.isNailPolishProduct(product)) {
    return <SingleNailPolishSelector product={product} />;
  }

  if (productTypeCheckers.isPressOnNailsProduct(product)) {
    return <SinglePressOnNailsSelector product={product} />;
  }

  if (productTypeCheckers.isEarringsProduct(product)) {
    return <SingleEarringsSelector product={product} />;
  }

  if (productTypeCheckers.isScarvesProduct(product)) {
    return <SingleScarvesSelector product={product} />;
  }

  if (productTypeCheckers.isGlassesProduct(product)) {
    return <SingleGlassesSelector product={product} />;
  }

  if (productTypeCheckers.isTiarasProduct(product)) {
    return <SingleTiaraSelector product={product} />;
  }

  if (productTypeCheckers.isHatsProduct(product)) {
    return <SingleHatsSelector product={product} />;
  }

  if (productTypeCheckers.isHeadbandProduct(product)) {
    return <SingleHeadbandSelector product={product} />;
  }

  if (productTypeCheckers.isWatchesProduct(product)) {
    return <SingleWatchesSelector product={product} />;
  }

  if (productTypeCheckers.isNeckwearProduct(product)) {
    return <SingleNeckwearSelector product={product} />;
  }

  if (productTypeCheckers.isLashesProduct(product)) {
    return <SingleLashesSelector product={product} />;
  }

  if (productTypeCheckers.isMascaraProduct(product)) {
    return <SingleMascaraSelector product={product} />;
  }

  if (productTypeCheckers.isEyeLinerProduct(product)) {
    return <SingleEyeLinerSelector product={product} />;
  }

  if (productTypeCheckers.isEyeShadowProduct(product)) {
    return <SingleEyeShadowSelector product={product} />;
  }

  if (productTypeCheckers.isEyebrowsProduct(product)) {
    return <SingleEyebrowsSelector product={product} />;
  }

  if (productTypeCheckers.isHandwearProduct(product)) {
    return <SingleHandwearSelector product={product} />;
  }

  if (productTypeCheckers.isFoundationProduct(product)) {
    return <SingleFoundationSelector product={product} />;
  }

  if (productTypeCheckers.isBlushProduct(product)) {
    return <SingleBlushSelector product={product} />;
  }

  if (productTypeCheckers.isBronzerProduct(product)) {
    return <SingleBronzerSelector product={product} />;
  }

  if (productTypeCheckers.isLipPlumperProduct(product)) {
    return <SingleLipPlumperSelector product={product} />;
  }

  if (productTypeCheckers.isConcealerProduct(product)) {
    return <SingleConcealerSelector product={product} />;
  }

  if (productTypeCheckers.isLenseProduct(product)) {
    return <SingleLenseSelector product={product} />;
  }

  if (productTypeCheckers.isHairColorProduct(product)) {
    return <SingleHairColorSelector product={product} />;
  }

  return (
    <>
      <div>No product found</div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            navigate("/virtual-try-on/makeups");
          }}
        >
          <ChevronDown className="size-6 text-white" />
        </button>
      </div>
    </>
  );
}

export function TopNavigation({ cart = true }: { cart?: boolean }) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const navigate = useNavigate();
  const location = useLocation();
  const { summaryCount } = useCartContext();

  const handleBackClick = () => {
    if (location.pathname !== "/virtual-try-on/makeups") {
      navigate("/virtual-try-on/makeups");
    } else {
      if (isDevelopment) {
        window.location.href = "/";
      } else {
        window.location.href =
          import.meta.env.VITE_API_BASE_URL + "/technologies";
        return;
      }
    }
  };

  const handleCloseClick = () => {
    if (process.env.NODE_ENV === "production") {
      window.location.href =
        import.meta.env.VITE_API_BASE_URL + "/technologies";
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      <div className="flex flex-col gap-3">
        <button
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          onClick={handleBackClick}
        >
          <ChevronLeft className="size-4 text-white" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          onClick={handleCloseClick}
        >
          <X className="size-4 text-white" />
        </button>

        {cart && (
          <button
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          >
            <Icons.myCart className="size-6 text-white" />
            <span className="absolute bottom-[5px] right-[5px] flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {summaryCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

interface SKUSelectorProps {
  skus: Product[];
  product: Product;
  setSelectedSKU: React.Dispatch<React.SetStateAction<Product | null>>;
}

const SKUSelector: React.FC<SKUSelectorProps> = ({
  skus,
  product,
  setSelectedSKU,
}) => {
  return (
    <div className="ms-3 flex flex-1 flex-col items-start justify-start pb-4 pr-5 [&_button]:pointer-events-auto">
      {/* Kontainer scrollable */}
      <div className="flex max-h-64 flex-col items-center justify-center gap-4 overflow-y-auto bg-black/25 px-2 pb-2 backdrop-blur-3xl [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-1">
        {/* Daftar item SKU */}
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
          {skus.map((sku) => {
            const imageUrl = mediaUrl(sku.media_gallery_entries[0].file);
            return (
              <button
                key={sku.sku}
                type="button"
                onClick={() => setSelectedSKU(sku)}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 border-2 border-transparent p-1 transition-all",
                  {
                    "scale-125": sku.sku === product.sku,
                  },
                )}
              >
                <img
                  src={imageUrl}
                  alt={sku.name}
                  className="h-7 w-7 object-cover sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  onExpandClick: () => void;
  setMediaFile: (file: File | null) => void;
  setMode: (mode: "IMAGE" | "VIDEO" | "LIVE") => void;
  setShowChangeModel: (isShow: boolean) => void;
}

function Sidebar({
  onExpandClick,
  setMediaFile,
  setMode,
  setShowChangeModel,
}: SidebarProps) {
  const { flipCamera, compareCapture, resetCapture, screenShoot } = useCamera();
  const { t } = useTranslation();
  const { resetAccessories } = useAccesories();
  const { resetMakeup } = useMakeup();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleResetConfirm = () => {
    resetAccessories();
    resetMakeup();
  };

  return (
    <div className="pointer-events-none flex flex-col items-center justify-center place-self-end pb-4 pr-5 [&_button]:pointer-events-auto">
      <DialogPopup
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title={t("message.resetVto")}
        positiveButtonText={t("general.remove")}
        negativeButtonText={t("general.cancel")}
      />
      <div className="relative p-0.5">
        <div className="absolute inset-0 rounded-full border-2 border-transparent" />

        <div className="flex flex-col gap-4 rounded-full bg-black/25 px-1.5 py-2 backdrop-blur-md">
          <button className="" onClick={screenShoot}>
            <Icons.camera className="size-4 text-white sm:size-6" />
          </button>

          <button className="" onClick={onExpandClick}>
            <Icons.expand className="size-4 text-white sm:size-6" />
          </button>
          <button className="" onClick={compareCapture}>
            <Icons.compare className="size-4 text-white sm:size-6" />
          </button>
          <button className="" onClick={() => setIsResetDialogOpen(true)}>
            <Icons.reset className="size-3 text-white xl:size-4 2xl:size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
