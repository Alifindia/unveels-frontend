import {
  ChevronDown,
  ChevronLeft,
  CirclePlay,
  Heart,
  HeartIcon,
  PauseCircle,
  Plus,
  PlusIcon,
  StopCircle,
  X,
} from "lucide-react";
import { CSSProperties, useState } from "react";
import { Icons } from "../components/icons";

import * as Dialog from "@radix-ui/react-dialog";
import { Link, useNavigate } from "react-router-dom";

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
import { AccesoriesProvider } from "../context/accesories-context";
import { MakeupProvider } from "../context/makeup-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { useVirtualTryOnProduct } from "../context/virtual-try-on-product-context";
import { useRecordingControls } from "../hooks/useRecorder";
import { getProductAttributes, mediaUrl } from "../utils/apiUtils";
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

export const productTypeCheckers = {
  isLipColorProduct: (data: Product) => {
    const lipColorsTypes = [
      "Lipsticks",
      "Lip Stains",
      "Lip Tints",
      "Lip Glosses",
    ];
    return lipsMakeupProductTypesFilter(lipColorsTypes)
      .split(",")
      .includes(getProductAttributes(data, "lips_makeup_product_type"));
  },
  isLipLinerProduct: (data: Product) => {
    return getFaceMakeupProductTypeIds(["Lip Liners"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isContourProduct: (data: Product) => {
    return getFaceMakeupProductTypeIds(["Contour"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isHighlighterProduct: (data: Product) => {
    return getFaceMakeupProductTypeIds(["Highlighter"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isNailPolishProduct: (data: Product) => {
    return getProductAttributes(data, "product_types").includes("Nail Polish");
  },
  isPressOnNailsProduct: (data: Product) => {
    return getProductAttributes(data, "product_types").includes(
      "Press-On Nails",
    );
  },
  isEarringsProduct: (data: Product) => {
    return headAccessoriesProductTypeFilter(["Earrings"]).includes(
      getProductAttributes(data, "head_accessories_product_type"),
    );
  },
  isScarvesProduct: (data: Product) => {
    return neckAccessoriesProductTypeFilter(["Scarves"]).includes(
      getProductAttributes(data, "neck_accessories_product_type"),
    );
  },
  isGlassesProduct: (data: Product) => {
    return headAccessoriesProductTypeFilter(["Glasses"]).includes(
      getProductAttributes(data, "head_accessories_product_type"),
    );
  },
  isTiarasProduct: (data: Product) => {
    return headAccessoriesProductTypeFilter(["Tiaras"]).includes(
      getProductAttributes(data, "head_accessories_product_type"),
    );
  },
  isHatsProduct: (data: Product) => {
    return headAccessoriesProductTypeFilter(["Hats"]).includes(
      getProductAttributes(data, "head_accessories_product_type"),
    );
  },
  isHeadbandProduct: (data: Product) => {
    return headAccessoriesProductTypeFilter(["Head Bands"]).includes(
      getProductAttributes(data, "head_accessories_product_type"),
    );
  },
  isWatchesProduct: (data: Product) => {
    return handAccessoriesProductTypeFilter(["Watches"]).includes(
      getProductAttributes(data, "hand_accessories_product_type"),
    );
  },
  isNeckwearProduct: (data: Product) => {
    return neckAccessoriesProductTypeFilter([
      "Chokers",
      "Necklaces",
      "Pendants",
    ]).includes(getProductAttributes(data, "neck_accessories_product_type"));
  },
  isLashesProduct: (data: Product) => {
    return getLashMakeupProductTypeIds([
      "Lash Curlers",
      "Individual False Lashes",
      "Full Line Lashes",
    ]).includes(getProductAttributes(data, "lash_makeup_product_type"));
  },
  isMascaraProduct: (data: Product) => {
    return getLashMakeupProductTypeIds(["Mascaras"]).includes(
      getProductAttributes(data, "lash_makeup_product_type"),
    );
  },
  isEyeLinerProduct: (data: Product) => {
    return getEyeMakeupProductTypeIds(["Eyeliners"]).includes(
      getProductAttributes(data, "eye_makeup_product_type"),
    );
  },
  isEyeShadowProduct: (data: Product) => {
    return getEyeMakeupProductTypeIds(["Eyeshadows"]).includes(
      getProductAttributes(data, "eye_makeup_product_type"),
    );
  },
  isEyebrowsProduct: (data: Product) => {
    return getProductAttributes(data, "brow_makeup_product_type");
  },
  isFoundationProduct: (data: Product) => {
    return faceMakeupProductTypesFilter(["Foundations"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isBlushProduct: (data: Product) => {
    return faceMakeupProductTypesFilter(["Blushes"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isBronzerProduct: (data: Product) => {
    return faceMakeupProductTypesFilter(["Bronzers"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isLipPlumperProduct: (data: Product) => {
    return lipsMakeupProductTypesFilter([
      "Lip Plumpers",
      "Lip Glosses",
    ]).includes(getProductAttributes(data, "lips_makeup_product_type"));
  },
  isConcealerProduct: (data: Product) => {
    return getEyeMakeupProductTypeIds(["Concealers"]).includes(
      getProductAttributes(data, "face_makeup_product_type"),
    );
  },
  isLenseProduct: (data: Product) => {
    return getProductAttributes(data, "lenses_product_type");
  },
  isHairColorProduct: (data: Product) => {
    return getProductAttributes(data, "hair_color_product_type");
  },
  isHandwearProduct: (data: Product) => {
    return handAccessoriesProductTypeFilter([
      "Rings",
      "Bracelets",
      "Bangles",
    ]).includes(getProductAttributes(data, "hand_accessories_product_type"));
  },
};

export function SingleVirtualTryOn() {
  const [selectedSKU, setSelectedSKU] = useState<Product | null>(null);
  const { skus } = useVirtualTryOnProduct();

  const { data, isLoading } = useMultipleProductsQuery({
    skus: skus,
  });

  if (isLoading) {
    return (
      <div className="absolute inset-0">
        <div className="flex h-full items-center justify-center">
          Loading...
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
          }}
        ></div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="absolute inset-0">
        <div className="flex h-full items-center justify-center">
          No products found
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
          }}
        ></div>
      </div>
    );
  }

  return (
    <VTOProviders>
      <SKUSelector
        skus={data}
        selected={selectedSKU?.sku || null}
        onSelect={(selected) => {
          const product = data.find((d) => d.sku === selected);

          if (!product) {
            return;
          }
          setSelectedSKU(product);
        }}
      />
      <Main product={selectedSKU ?? data[0]} />
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
              <div className="h-full min-h-dvh">{children}</div>
            </VirtualTryOnProvider>
          </AccesoriesProvider>
        </MakeupProvider>
      </SkinColorProvider>
    </CameraProvider>
  );
}

export function SKUSelector({
  skus,
  selected,
  onSelect,
}: {
  skus: Product[];
  selected: string | null;
  onSelect: (selectedSKUs: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-10 flex flex-col items-center justify-center [&_button]:pointer-events-auto">
      <div className="flex max-h-64 flex-col items-center justify-center gap-4 overflow-y-auto rounded-lg bg-black/25 p-4 backdrop-blur-3xl">
        <div className="flex flex-col items-center justify-center gap-4">
          {skus.map((sku) => {
            const imageUrl = mediaUrl(sku.media_gallery_entries[0].file);
            return (
              <button
                key={sku.sku}
                type="button"
                onClick={() => {
                  onSelect(sku.sku);
                }}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 border-2 border-transparent p-1 transition-all",
                  {
                    "scale-125": sku.sku === selected,
                  },
                )}
              >
                <img
                  src={imageUrl}
                  alt={sku.name}
                  className="size-16 rounded-lg object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Main({ product }: { product: Product }) {
  return (
    <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
      <div className="absolute inset-0">
        <VirtualTryOnScene />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
          }}
        ></div>
      </div>
      <RecorderStatus />
      <TopNavigation />

      <div className="absolute inset-x-0 top-24 space-y-2.5 px-5">
        <div className="flex items-center">
          <button
            type="button"
            className="flex size-[1.875rem] items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl"
          >
            <HeartIcon className="size-4 text-white" />
          </button>
          <div className="w-full pl-4">
            <div className="font-semibold text-white">{product.name}</div>
            <div className="text-white/60">
              <BrandName brandId={getProductAttributes(product, "brand")} />
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            className="flex size-[1.875rem] items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl"
          >
            <PlusIcon className="size-4 text-white" />
          </button>
          <div className="w-full pl-4">
            <div className="font-medium text-white">${product.price}</div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
        <Sidebar />
        <MainContent product={product} />
        <Footer />
      </div>
    </div>
  );
}

function MainContent({ product }: { product: Product }) {
  const navigate = useNavigate();

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

  if (productTypeCheckers.isHandwearProduct(product)) {
    return <SingleHandwearSelector product={product} />;
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

function RecorderStatus() {
  const { isRecording, formattedTime, handleStartPause, handleStop, isPaused } =
    useRecordingControls();
  const { finish } = useCamera();

  return (
    <div className="absolute inset-x-0 top-14 flex items-center justify-center gap-4">
      <button
        className="flex size-8 items-center justify-center"
        onClick={handleStartPause}
      >
        {isPaused ? (
          <CirclePlay className="size-6 text-white" />
        ) : isRecording ? (
          <PauseCircle className="size-6 text-white" />
        ) : null}
      </button>
      <span className="relative flex size-4">
        {isRecording ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        ) : null}
        <span className="relative inline-flex size-4 rounded-full bg-red-500"></span>
      </span>
      <div className="font-serif text-white">{formattedTime}</div>
      <button
        className="flex size-8 items-center justify-center"
        onClick={
          isRecording
            ? () => {
                handleStop();
                finish();
              }
            : handleStartPause
        }
      >
        {isRecording || isPaused ? (
          <StopCircle className="size-6 text-white" />
        ) : (
          <CirclePlay className="size-6 text-white" />
        )}
      </button>
    </div>
  );
}

export function TopNavigation({
  item = false,
  cart = false,
}: {
  item?: boolean;
  cart?: boolean;
}) {
  const { flipCamera } = useCamera();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      <div className="flex flex-col gap-4">
        <Link
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          to="/virtual-try-on/makeups"
        >
          <ChevronLeft className="size-6 text-white" />
        </Link>

        {item ? (
          <div className="space-y-2 pt-10">
            <div className="flex gap-x-4">
              <button className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl">
                <Heart className="size-5 text-white" />
              </button>
              <div>
                <p className="font-semibold leading-4 text-white">
                  Pro Filt’r Soft Matte Longwear Liquid Found
                </p>
                <p className="text-white/60">Brand Name</p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <button className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/25 backdrop-blur-3xl">
                <Plus className="size-5 text-white" />
              </button>
              <p className="font-medium text-white">$52.00</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        <Link
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
          to="/"
        >
          <X className="size-6 text-white" />
        </Link>
        <div className="relative -m-0.5 p-0.5">
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={
              {
                background: `linear-gradient(148deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.77) 100%) border-box`,
                "-webkit-mask": `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
                WebkitMaskComposite: "destination-out",
                "mask-composite": "exclude",
              } as CSSProperties
            }
          />
          <button
            type="button"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
            onClick={flipCamera}
          >
            <Icons.flipCamera className="size-6 text-white" />
          </button>
        </div>
        <button
          type="button"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-black/25 backdrop-blur-3xl"
        >
          <Icons.myCart className="size-6 text-white" />
        </button>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="pointer-events-none flex flex-col items-center justify-center place-self-end pb-4 pr-5 [&_button]:pointer-events-auto">
      <div className="relative p-0.5">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={
            {
              background: `linear-gradient(148deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.77) 100%) border-box`,
              "-webkit-mask": `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
              mask: `linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)`,
              WebkitMaskComposite: "destination-out",
              "mask-composite": "exclude",
            } as CSSProperties
          }
        />

        <div className="flex flex-col gap-4 rounded-full bg-black/25 px-1.5 py-2 backdrop-blur-md">
          <button className="">
            <Icons.camera className="size-6 text-white" />
          </button>
          <button className="">
            <Icons.flipCamera className="size-6 text-white" />
          </button>
          <button className="">
            <Icons.expand className="size-6 text-white" />
          </button>
          <button className="">
            <Icons.compare className="size-6 text-white" />
          </button>
          <button className="">
            <Icons.reset className="size-6 text-white" />
          </button>
          <UploadMediaDialog />
          <button>
            <Icons.share className="size-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadMediaDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="flex items-center justify-center">
          <Icons.upload className="size-6 text-white" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 flex max-h-[85vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col justify-center rounded-lg bg-[#0000002E] px-2 py-4 text-white backdrop-blur">
          <div className="flex w-full flex-col justify-center">
            <Dialog.Title className="mb-2 text-center text-[14px] text-white">
              How would you like to try on the makeup ?
            </Dialog.Title>
            <div className="grid grid-cols-3 gap-2">
              <button className="upload-photo flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur">
                <Icons.uploadPhoto className="size-5 text-white" />

                <p className="mt-2 text-center text-[12px] text-white">
                  Upload Photo
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Upload a photo of yourself to see how different makeup shades
                  look on you.
                </p>
              </button>

              <button className="upload-video flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur">
                <Icons.uploadVideo className="size-5 text-white" />
                <p className="mt-2 text-center text-[12px] text-white">
                  Upload Video
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Upload a video to apply makeup dynamically and see how they
                  look in motion.
                </p>
              </button>

              <button className="choose-model flex w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-[#00000042] p-2 backdrop-blur">
                <Icons.chooseModel className="size-5 text-white" />
                <p className="mt-2 text-center text-[12px] text-white">
                  Choose model
                </p>
                <p className="mt-1 text-left text-[8px] text-white">
                  Choose a model to see how different makeup appear on a
                  pre-selected image.
                </p>
              </button>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
              aria-label="Close"
            >
              <X />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
