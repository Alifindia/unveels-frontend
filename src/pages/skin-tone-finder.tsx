import clsx from "clsx";
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
import { useTranslation } from "react-i18next";
import { getCookie, getCurrencyAndRate } from "../utils/other";
import { exchangeRates } from "../utils/constants";
import { AllProductsPage } from "../components/all-product/all-product-page";
import { FilterProvider } from "../context/filter-context";
import { getFaceMakeupProductTypeIds } from "../api/attributes/makeups";
import { LinkButton } from "../App";

export function SkinToneFinder() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <CameraProvider>
      <InferenceProvider>
        <SkinColorProvider>
          <MakeupProvider>
            <FindTheLookProvider>
              <FilterProvider>
                <div className="h-full min-h-dvh">
                  <Main />
                </div>
              </FilterProvider>
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

  const { view, setView } = useFindTheLookContext();

  const [groupedItemsData, setGroupedItemsData] = useState<{
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  }>({
    makeup: [{ label: "Foundations", section: "makeup" }],
    accessories: [],
  });

  const mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  } = {
    Foundations: {
      attributeName: "category_id",
      values: getFaceMakeupProductTypeIds(["Foundations"]),
    },
  };

  if (view === "all_categories") {
    return (
      <AllProductsPage
        onClose={() => {
          setView("face");
        }}
        groupedItemsData={groupedItemsData}
        name={"Foundation"}
        mapTypes={mapTypes}
      />
    );
  }

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
        </div>
        <TopNavigation cart={isInferenceFinished} />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {criterias.isCaptured ? "" : <VideoScene />}
          {isInferenceFinished && <Sidebar setCollapsed={setCollapsed} />}
          {isInferenceFinished && (
            <div className="bg-black/10 p-2 shadow-lg backdrop-blur-sm">
              <MainContent collapsed={collapsed} setCollapsed={setCollapsed} />
              <Footer />
            </div>
          )}
          {!isInferenceFinished && <Footer />}
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
  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setCollapsed(!collapsed);
          }}
          className="flex h-3 w-full items-center justify-center bg-transparent"
        >
          <div className="h-1 w-10 rounded-full bg-gray-400" />
        </button>
      </div>
      {collapsed ? null : <BottomContent />}
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

        <div className="w-full text-right">
          <button
            className="text-end text-[0.625rem] text-white sm:py-2"
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
      <div className="w-full text-right">
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

  const { currency, rate } = getCurrencyAndRate(exchangeRates);

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
                    {currency} {product.price * rate}
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
  return <ShadesSelector />;
}

interface SidebarProps {
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

function Sidebar({ setCollapsed }: SidebarProps) {
  const { flipCamera, compareCapture, resetCapture, screenShoot } = useCamera();
  return (
    <div className="pointer-events-none flex flex-col items-center justify-center place-self-end pb-4 pr-5 [&_button]:pointer-events-auto">
      <div className="relative p-0.5">
        <div className="absolute inset-0 rounded-full border-2 border-transparent" />

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
          <button className="" onClick={resetCapture}>
            <Icons.reset className="size-4 text-white sm:size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
