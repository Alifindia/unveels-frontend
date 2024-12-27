import clsx from "clsx";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CirclePlay,
  Heart,
  PauseCircle,
  Plus,
  StopCircle,
  X,
} from "lucide-react";
import {
  CSSProperties,
  Dispatch,
  Fragment,
  SetStateAction,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { skin_tones, tone_types } from "../api/attributes/skin_tone";
import { getBrandName, useBrandsQuerySuspense } from "../api/brands";
import { Product } from "../api/shared";
import { useSkinToneProductQuery } from "../api/skin-tone";
import { Footer } from "../components/footer";
import { Icons } from "../components/icons";
import { LoadingProducts } from "../components/loading";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { VideoStream } from "../components/recorder/video-stream";
import { ShareModal } from "../components/share-modal";
import {
  SkinColorProvider,
  useSkinColor,
} from "../components/skin-tone-finder-scene/skin-color-context";
import { SkinToneFinderScene } from "../components/skin-tone-finder-scene/skin-tone-finder-scene";
import { useRecordingControls } from "../hooks/useRecorder";
import { useScrollContainer } from "../hooks/useScrollContainer";
import {
  baseApiUrl,
  extractUniqueCustomAttributes,
  getProductAttributes,
  mediaUrl,
} from "../utils/apiUtils";
import { MakeupProvider, useMakeup } from "../context/makeup-context";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import { TopNavigation } from "../components/top-navigation";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { ScreenshotPreview } from "../components/screenshot-preview";
import {
  FindTheLookProvider,
  useFindTheLookContext,
} from "../context/find-the-look-context";
import { FindTheLookItems } from "../types/findTheLookItems";
import { getFaceMakeupProductTypeIds } from "../api/attributes/makeups";
import { useProducts } from "../api/get-product";
import { useCartContext } from "../context/cart-context";
import { Rating } from "../components/rating";
import { BrandName } from "../components/product/brand";
import { useTranslation } from "react-i18next";

export function SkinToneFinder() {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage("en"); // Mengatur bahasa ke Arab saat komponen di-mount
  }, [i18n]);

  return (
    <CameraProvider>
      <InferenceProvider>
        <SkinColorProvider>
          <MakeupProvider>
            <FindTheLookProvider>
              <div className="h-full min-h-dvh">
                <Main />
              </div>
            </FindTheLookProvider>
          </MakeupProvider>
        </SkinColorProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias, status, setRunningMode } = useCamera();
  const [collapsed, setCollapsed] = useState(false);
  const { isInferenceFinished } = useInferenceContext();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const steps = [
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
      );
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "IMAGE",
          numFaces: 1,
        },
      );
      faceLandmarkerRef.current = faceLandmarkerInstance;
    },
  ];

  const {
    progress,
    isLoading: modelLoading,
    loadModels,
  } = useModelLoader(steps);

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      {criterias.screenshotImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <ScreenshotPreview />
        </div>
      )}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
        <div className="absolute inset-0">
          <VideoStream debugMode={false} />
          <SkinToneFinderScene faceLandmarker={faceLandmarkerRef.current} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
            }}
          ></div>
        </div>
        <TopNavigation cart={isInferenceFinished} />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {criterias.isCaptured ? "" : <VideoScene />}
          {isInferenceFinished && <Sidebar setCollapsed={setCollapsed} />}
          <MainContent collapsed={collapsed} setCollapsed={setCollapsed} />
          <Footer />
        </div>
      </div>
    </>
  );
}

interface MainContentProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

function MainContent({ collapsed, setCollapsed }: MainContentProps) {
  const { criterias, exit } = useCamera();
  const [shareOpen, setShareOpen] = useState(false);

  const onClose = () => {
    setShareOpen(false);
  };

  if (criterias.isFinished) {
    return shareOpen ? (
      <ShareModal onClose={onClose} />
    ) : (
      <div className="flex space-x-5 px-5 pb-10 font-serif">
        <button
          onClick={exit}
          type="button"
          className="h-10 w-full rounded border border-[#CA9C43] text-white"
        >
          Exit
        </button>
        <button
          type="button"
          className="h-10 w-full rounded bg-gradient-to-r from-[#CA9C43] to-[#92702D] text-white"
          onClick={() => setShareOpen(true)}
        >
          Share <Icons.share className="ml-4 inline-block size-6" />
        </button>
      </div>
    );
  }

  return (
    <>
      {collapsed ? null : <BottomContent />}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <ChevronUp className="size-6 text-white" />
          ) : (
            <ChevronDown className="size-6 text-white" />
          )}
        </button>
      </div>
    </>
  );
}

function ShadesSelector() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("matched" as "matched" | "other");

  const activeClassNames =
    "border-white inline-block text-transparent bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)] bg-clip-text";

  return (
    <div className="space-y-2 px-4">
      <div className="flex h-10 w-full items-center justify-between border-b border-gray-600 text-center">
        {["matched", "other"].map((shadeTab) => {
          const isActive = tab === shadeTab;
          return (
            <Fragment key={shadeTab}>
              <button
                key={shadeTab}
                className={`relative h-10 grow border-b text-sm md:text-lg ${
                  isActive
                    ? activeClassNames
                    : "border-transparent text-gray-500"
                }`}
                onClick={() => setTab(shadeTab as "matched" | "other")}
              >
                <span
                  className={clsx("capitalize", {
                    "text-white/70 blur-sm": isActive,
                  })}
                >
                  {t(`tabOptions.${shadeTab}`)}
                </span>
                {isActive ? (
                  <>
                    <div
                      className={clsx(
                        "absolute inset-0 flex items-center justify-center blur-sm",
                        activeClassNames,
                      )}
                    >
                      <span className="text-center text-sm capitalize md:text-lg">
                        {t("tabOptions.matched")}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-center text-sm capitalize text-white/70 md:text-lg">
                        {t("tabOptions.other")}
                      </span>
                    </div>
                  </>
                ) : null}
              </button>
              {shadeTab === "matched" && (
                <div className="h-10 px-px py-2">
                  <div className="h-full border-r border-white"></div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {tab === "matched" ? <MatchedShades /> : <OtherShades />}
    </div>
  );
}

const isShadeSelected = (product: Product, selectedShade: string) => {
  const attribute = getProductAttributes(product, "hexacode");
  return attribute?.includes(selectedShade ?? "");
};

function MatchedShades() {
  const { t } = useTranslation();
  const [selectedTne, setSelectedTone] = useState(tone_types[0]);
  const { skinType, hexSkin } = useSkinColor();
  const { setView } = useFindTheLookContext();

  const skinToneId = skin_tones.find((tone) => tone.name === skinType)?.id;

  const { data } = useSkinToneProductQuery({
    skintone: skinToneId,
    tonetype: selectedTne.id,
  });

  return (
    <>
      <div className="flex flex-col items-start">
        <div className="inline-flex h-6 items-center gap-x-2 rounded-full border border-white/80 px-2 py-1 text-white/80">
          <div
            className="size-3 rounded-full"
            style={{ backgroundColor: hexSkin }}
          ></div>
          <span className="text-sm">
            {t(`skin_types.${skinType?.split(" ")[0].toLocaleLowerCase()}`)}
          </span>
        </div>
        <div className="flex w-full justify-center pt-2">
          <div className="flex w-full max-w-md">
            {tone_types.map((option, index) => (
              <button
                key={option.id}
                className={`flex h-[26px] w-full items-center justify-center border border-transparent py-2 text-xs text-white transition-all data-[selected=true]:scale-[1.15] data-[selected=true]:border-white`}
                data-selected={selectedTne.name === option.name}
                style={{
                  background: option.color,
                }}
                onClick={() => setSelectedTone(option)}
              >
                {t(
                  `tone_types.${option.name.toLocaleLowerCase().replace(" ", "_")}`,
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full text-left">
          <button
            className="text-[0.625rem] text-white sm:py-2"
            onClick={() => {
              setView("all_categories");
            }}
          >
            {t("view_all")}
          </button>
        </div>

        {data ? (
          <Suspense fallback={<LoadingProducts />}>
            <ProductList products={data.items} />
          </Suspense>
        ) : (
          <LoadingProducts />
        )}
      </div>
    </>
  );
}

function OtherShades() {
  const { t } = useTranslation();
  const [selectedTone, setSelectedTone] = useState(skin_tones[0]);

  const [selectedShade, setSelectedShade] = useState(null as string | null);

  const { setHexColor } = useSkinColor();

  const { setFoundationColor, setShowFoundation } = useMakeup();

  const { setView } = useFindTheLookContext();

  const { data } = useSkinToneProductQuery({
    skintone: selectedTone.id,
  });

  const hexCodes = data
    ? extractUniqueCustomAttributes(data.items, "hexacode")
    : [];

  const shadesOptions = hexCodes
    .filter(Boolean)
    .map((hexes: string) => hexes.split(","))
    .flat();

  const filteredProducts = selectedShade
    ? (data?.items.filter((i: Product) => isShadeSelected(i, selectedShade)) ??
      [])
    : (data?.items ?? []);

  function setSelectedColor(option: string) {
    setSelectedShade(option);
    setHexColor(option);
    setFoundationColor(option);
    setShowFoundation(true);
  }

  function resetColor() {
    setShowFoundation(false);
    setSelectedShade(null);
    setHexColor("#FFFF");
    setFoundationColor("#FFFF");
  }

  return (
    <div className="flex w-full flex-col items-start gap-1">
      <div className="flex w-full items-center gap-3 overflow-x-auto no-scrollbar">
        {skin_tones.map((tone, index) => (
          <div
            key={index}
            className={clsx(
              "inline-flex h-[26px] shrink-0 items-center gap-x-2 rounded-full border px-2 py-1 text-white",
              selectedTone.name === tone.name
                ? "border-white"
                : "border-transparent",
            )}
            onClick={() => setSelectedTone(tone)}
          >
            <div
              className="size-3 rounded-full"
              style={{ background: tone.color }}
            ></div>
            <span className="text-sm">
              {t(
                `skin_tones.${tone.name.toLocaleLowerCase().replace(" ", "_")}`,
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="flex w-full gap-4 overflow-x-auto py-2 no-scrollbar">
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center transition-all data-[selected=true]:scale-[1.15] data-[selected=true]:border-white"
          data-selected={selectedShade === null}
          onClick={() => resetColor()}
        >
          <Icons.unselect className="size-7 text-white" />
        </button>
        {shadesOptions.map((option, index) => (
          <button
            key={index}
            className={`size-8 shrink-0 rounded-full border border-transparent transition-all data-[selected=true]:scale-[1.15] data-[selected=true]:border-white`}
            data-selected={selectedShade === option}
            style={{
              background: option,
            }}
            onClick={() => {
              setSelectedColor(option);
            }}
          ></button>
        ))}
      </div>
      <div className="w-full text-left">
        <button
          className="text-[0.625rem] text-white sm:py-2"
          onClick={() => {
            setView("all_categories");
          }}
        >
          {t("view_all")}
        </button>
      </div>

      {data ? (
        <Suspense fallback={<LoadingProducts />}>
          <ProductList products={filteredProducts} />
        </Suspense>
      ) : (
        <LoadingProducts />
      )}
    </div>
  );
}

function ProductList({ products }: { products: Array<Product> }) {
  const { scrollContainerRef, handleMouseDown } = useScrollContainer();
  const { data } = useBrandsQuerySuspense();
  const [selected, setSelected] = useState(null as Product | null);

  return (
    <div
      className="flex w-full gap-4 overflow-x-auto no-scrollbar active:cursor-grabbing"
      ref={scrollContainerRef}
      onMouseDown={handleMouseDown}
    >
      {products.map((product, index) => {
        const imageUrl =
          mediaUrl(product.media_gallery_entries[0].file) ??
          "https://picsum.photos/id/237/200/300";

        const brand = getBrandName(
          data.options,
          product.custom_attributes.find(
            (attr) => attr.attribute_code === "brand",
          )?.value as string,
        );

        return (
          <button
            key={index}
            className="relative block w-[80px] text-left shadow sm:w-[110px]"
            onClick={() => {
              setSelected(product);
              window.open(
                `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                "_blank",
              );
            }}
          >
            <div className="relative h-[58px] w-[80px] overflow-hidden sm:h-[80px] sm:w-[110px]">
              <img
                src={imageUrl}
                alt="Product"
                className="h-full w-full rounded object-cover"
              />
            </div>

            <div className="px-2 pb-1">
              <h3 className="line-clamp-2 h-10 py-2 text-[0.625rem] font-semibold text-white">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-[0.5rem] text-white/60">{brand}</p>
                <div className="flex flex-wrap items-center justify-end gap-x-1">
                  <span className="text-[0.625rem] font-bold text-white">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {selected?.id === product.id ? (
              <div
                className="absolute inset-0 border-4 border-transparent"
                style={{
                  borderImage:
                    "linear-gradient(90deg, #CA9C43 0%, #916E2B 27.4%, #6A4F1B 59.4%, #473209 100%) 1",
                  borderWidth: "4px",
                  borderStyle: "solid",
                  // padding: "4px",
                }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function BottomContent() {
  const { criterias } = useCamera();
  const { skinType } = useSkinColor();

  const { view, setView } = useFindTheLookContext();

  const [groupedItemsData, setGroupedItemsData] = useState<{
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  }>({
    makeup: [{ label: "Foundation", section: "makeup" }],
    accessories: [],
  });

  if (criterias.isCaptured && skinType != null && view === "face") {
    return <ShadesSelector />;
  }

  if (view === "all_categories") {
    return (
      <AllProductsPage
        onClose={() => {
          setView("face");
        }}
        groupedItemsData={groupedItemsData}
      />
    );
  }

  return <div></div>;
}

interface SidebarProps {
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

function Sidebar({ setCollapsed }: SidebarProps) {
  const { flipCamera, compareCapture, resetCapture, screenShoot } = useCamera();
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
              "-webkit-mask-composite": "destination-out",
              "mask-composite": "exclude",
            } as CSSProperties
          }
        />

        <div className="flex flex-col gap-4 rounded-full bg-black/25 px-1.5 py-2 backdrop-blur-md">
          <button className="" onClick={screenShoot}>
            <Icons.camera className="size-4 text-white sm:size-6" />
          </button>
          <button className="" onClick={flipCamera}>
            <Icons.flipCamera className="size-4 text-white sm:size-6" />
          </button>
          <button
            className=""
            onClick={() => setCollapsed((prevState) => !prevState)}
          >
            <Icons.expand className="size-4 text-white sm:size-6" />
          </button>
          <button className="" onClick={compareCapture}>
            <Icons.compare className="size-4 text-white sm:size-6" />
          </button>
          <button className="">
            <Icons.reset
              onClick={resetCapture}
              className="size-4 text-white sm:size-6"
            />
          </button>
          <button className="hidden">
            <Icons.upload className="size-4 text-white sm:size-6" />
          </button>
          <button className="hidden">
            <Icons.share className="size-4 text-white sm:size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

const mapTypes: {
  [key: string]: {
    attributeName: string;
    values: string[];
  };
} = {
  Foundation: {
    attributeName: "face_makeup_product_type",
    values: getFaceMakeupProductTypeIds(["Foundations"]),
  },
};

function AllProductsPage({
  onClose,
  groupedItemsData,
}: {
  onClose: () => void;
  groupedItemsData: {
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  };
}) {
  const [tab, setTab] = useState<"makeup" | "accessories">("makeup");
  const { selectedItems: cart, dispatch } = useFindTheLookContext();

  return (
    <div
      className={clsx(
        "fixed inset-0 flex h-dvh flex-col bg-black font-sans text-white",
      )}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" className="size-6" onClick={() => onClose()}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-end space-x-2.5">
          <Heart className="size-6" />
          <Icons.bag className="size-6" />
        </div>
      </div>

      {cart.items.length > 0 ? (
        <div className="mx-auto my-4 flex w-fit space-x-2.5 rounded-lg bg-white/25 p-4">
          {cart.items.map((product) => {
            const imageUrl = mediaUrl(
              product.media_gallery_entries[0].file,
            ) as string;
            return (
              <div className="relative size-9">
                <img src={imageUrl} className="h-full w-full object-cover" />

                <div className="absolute right-0 top-0">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "remove", payload: product });
                    }}
                  >
                    <X className="size-5 text-black" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[480px] px-4 py-3">
        {["makeup", "accessories"].map((item) => (
          <button
            key={item}
            type="button"
            className={clsx(
              "flex h-8 w-full items-center justify-center border text-xs uppercase",
              item === tab
                ? "border-white bg-white text-black"
                : "border-white text-white",
            )}
            onClick={() => {
              dispatch({ type: "reset" });
              setTab(item as "makeup" | "accessories");
            }}
          >
            Similar {item}
          </button>
        ))}
      </div>

      {tab === "makeup" ? (
        <MakeupAllView makeups={groupedItemsData.makeup} />
      ) : (
        <AccessoriesAllView accessories={groupedItemsData.accessories} />
      )}
    </div>
  );
}

function MakeupAllView({ makeups }: { makeups: FindTheLookItems[] }) {
  const validMakeups = makeups.filter((category) => mapTypes[category.label]);

  return (
    <div className="h-full flex-1 overflow-y-auto px-5">
      <div className="space-y-14">
        {validMakeups.map((category) => (
          <ProductHorizontalList
            category={category.label}
            key={category.section}
          />
        ))}
      </div>
    </div>
  );
}

function AccessoriesAllView({
  accessories,
}: {
  accessories: FindTheLookItems[];
}) {
  const validAccessories = accessories.filter(
    (category) => mapTypes[category.label],
  );

  return (
    <div className="h-full flex-1 overflow-y-auto px-5">
      <div className="space-y-14">
        {validAccessories.map((category) => (
          <ProductHorizontalList
            category={category.label}
            key={category.section}
          />
        ))}
      </div>
    </div>
  );
}

function ProductHorizontalList({ category }: { category: string }) {
  const { selectedItems: cart, dispatch } = useFindTheLookContext(); // Assuming dispatch is here

  if (!mapTypes[category]) {
    console.warn(`Category "${category}" is not defined in mapTypes.`);
    return null;
  }

  const { attributeName, values } = mapTypes[category];
  const { data } = useProducts({
    product_type_key: attributeName,
    type_ids: values,
  });

  const { addItemToCart } = useCartContext();

  const handleAddToCart = async (id: string, url: string) => {
    try {
      await addItemToCart(id, url);
      console.log(`Product ${id} added to cart!`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  return (
    <div key={category}>
      <div className="py-4">
        <h2 className="text-base text-[#E6E5E3]">{category}</h2>
      </div>
      <div className="flex w-full gap-4 overflow-x-auto no-scrollbar active:cursor-grabbing">
        {data ? (
          data.items.map((product, index) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0].file) ??
              "https://picsum.photos/id/237/200/300";

            return (
              <div
                key={product.id}
                className="w-[calc(50%-0.5rem)] shrink-0 rounded shadow lg:w-[calc(16.667%-0.5rem)]"
                onClick={() => {
                  window.open(
                    `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                    "_blank",
                  );
                }}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="h-full w-full rounded object-cover"
                  />
                </div>

                <h3 className="line-clamp-2 h-10 pt-2.5 text-xs font-semibold text-white">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60">
                    <BrandName
                      brandId={getProductAttributes(product, "brand")}
                    />
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-x-1">
                    <span className="text-sm font-bold text-white">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Rating rating={4} />
                <div className="flex space-x-1 pt-1">
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center border border-white text-xs font-semibold text-white"
                    onClick={() => {
                      handleAddToCart(
                        product.id.toString(),
                        `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                      );
                    }}
                  >
                    ADD TO CART
                  </button>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center border border-white bg-white text-xs font-semibold text-black"
                    onClick={() => {
                      dispatch({ type: "add", payload: product });
                    }}
                  >
                    SELECT
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <LoadingProducts />
        )}
      </div>
    </div>
  );
}
