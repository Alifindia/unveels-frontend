import { Fragment, useEffect, useRef, useState } from "react";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { VideoStream } from "../components/recorder/video-stream";
import { RecorderStatus } from "../components/assistant";
import { Footer } from "../components/footer";
import { Icons } from "../components/icons";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ShareModal } from "../components/share-modal";
import { VideoScene } from "../components/recorder/recorder";
import { SkinAnalysis } from "./skin-analysis";
import {
  SkinAnalysisProvider,
  useSkinAnalysis,
} from "../context/skin-analysis-context";
import clsx from "clsx";
import { exchangeRates, labelsDescription } from "../utils/constants";
import { useSkincareProductQuery } from "../api/skin-care";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { BrandName } from "../components/product/brand";
import { LoadingProducts } from "../components/loading";
import SkinImprovementScene from "../components/skin-improvement/skin-improvement-scene";
import {
  SkinImprovementProvider,
  useSkinImprovement,
} from "../context/see-improvement-context";
import { useCartContext } from "../context/cart-context";
import { useTranslation } from "react-i18next";
import { getCookie, getCurrencyAndRate } from "../utils/other";
import { useSearchParams } from "react-router-dom";
import SuccessPopup from "../components/popup-add-to-cart";
import { FacialFeatureType } from "../components/skin-improvement/skin-improvement-three-scene";
import { TopNavigation } from "../components/top-navigation";

export function SeeImprovement() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);
  const isArabic = i18n.language === "ar";

  return (
    <CameraProvider>
      <SkinAnalysisProvider>
        <SkinImprovementProvider>
          <div className="h-full min-h-dvh">
            <Main isArabic={isArabic} />
          </div>
        </SkinImprovementProvider>
      </SkinAnalysisProvider>
    </CameraProvider>
  );
}

function Main({ isArabic }: { isArabic?: boolean }) {
  const { criterias } = useCamera();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const steps = [
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/face-landmarker/face_landmarker.task",
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
  const { dataItem, type } = useCartContext();

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
        <SuccessPopup product={dataItem} type={type} />
        <div className="absolute inset-0">
          {criterias.capturedImage ? (
            <SkinImprovementScene />
          ) : (
            <VideoStream debugMode={false} />
          )}
        </div>
        <TopNavigation />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          <div className="bg-black/10 p-2 shadow-lg backdrop-blur-sm">
            <MainContent
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              isArabic={isArabic}
            />
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}

interface MainContentProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isArabic?: boolean;
}

function MainContent({ collapsed, setCollapsed, isArabic }: MainContentProps) {
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
      {collapsed ? null : (
        <BottomContent setCollapsed={setCollapsed} isArabic={isArabic} />
      )}
    </>
  );
}

const tabs = ["acne", "dark circle", "spots", "texture", "wrinkles"] as const;

function SkinProblems({
  onClose,
  setCollapsed,
  skinConcerns,
}: {
  onClose: () => void;
  setCollapsed: (collapsed: boolean) => void;
  skinConcerns?: string | null;
}) {
  const { tab, setTab, getTotalScoreByLabel } = useSkinAnalysis();
  const { setFeatureType } = useSkinImprovement();

  useEffect(() => {
    setFeatureType(tab as FacialFeatureType);
  }, [tab]);

  useEffect(() => {
    if (skinConcerns) setTab(skinConcerns);
  }, [skinConcerns]);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language == "ar";

  return (
    <>
      <div className="relative space-y-2 px-4">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setCollapsed(true);
            }}
            className="flex hidden h-3 w-full items-center justify-center bg-transparent"
          >
            <div className="h-1 w-10 rounded-full bg-gray-400" />
          </button>
        </div>
        <div
          className="flex w-full items-center space-x-3.5 overflow-x-auto overflow-y-visible no-scrollbar"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {tabs.map((problemTab) => {
            const isActive = tab === problemTab;
            return (
              <Fragment key={problemTab}>
                <button
                  key={problemTab}
                  className={clsx(
                    "overflow relative shrink-0 rounded-full border border-white px-3 py-1 text-sm text-white",
                    {
                      "bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]":
                        isActive,
                    },
                  )}
                  onClick={() => setTab(problemTab)}
                >
                  {t("skinlabel." + problemTab)}

                  <div
                    className={clsx(
                      "absolute inset-x-0 -top-6 text-center text-white",
                      {
                        hidden: !isActive,
                      },
                    )}
                  ></div>
                </button>
              </Fragment>
            );
          })}
        </div>

        {tab && <Slider valueSlider={50} />}
        {tab && <ProductList skinConcern={tab} />}
      </div>
    </>
  );
}

function ProductList({ skinConcern }: { skinConcern: string }) {
  const { data } = useSkincareProductQuery({
    skinConcern,
  });

  const { addItemToCart, setDataItem, setType } = useCartContext();

  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

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
    <div className="flex w-full gap-4 overflow-x-auto no-scrollbar active:cursor-grabbing">
      {data ? (
        data.items.map((product, index) => {
          const imageUrl =
            mediaUrl(product.media_gallery_entries[0].file) ??
            "https://picsum.photos/id/237/200/300";

          return (
            <div
              key={product.id}
              className="w-[115px] rounded shadow"
              onClick={() => {
                window.open(
                  `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                  "_blank",
                );
              }}
            >
              <div className="relative h-[80px] w-[115px] overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Product"
                  className="rounded object-cover"
                />
              </div>

              <h3 className="line-clamp-2 h-10 py-2 text-[0.625rem] font-semibold text-white">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-[0.5rem] text-white/60">
                  <BrandName brandId={getProductAttributes(product, "brand")} />
                </p>
                <div className="flex flex-wrap items-center justify-end gap-x-1">
                  <span className="text-[0.625rem] font-bold text-white">
                    {currencySymbol}
                    {(product.price * rate).toFixed(3)}
                  </span>
                  {/* <span className="text-[0.5rem] text-white/50 line-through">
                ${product.originalPrice.toFixed(2)}
              </span> */}
                </div>
              </div>
              <div className="flex space-x-1 pt-1">
                <button
                  type="button"
                  className="flex h-7 w-full items-center justify-center border border-white text-[0.375rem] font-semibold text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddToCart(
                      product.id.toString(),
                      `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                      product,
                    );
                  }}
                >
                  ADD TO CART
                </button>
                <button
                  type="button"
                  className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.45rem] font-semibold text-black"
                  onClick={() => {
                    window.open(
                      `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                      "_blank",
                    );
                  }}
                >
                  Detail
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <LoadingProducts />
      )}
    </div>
  );
}

interface BottomContentProps {
  setCollapsed: (collapsed: boolean) => void;
  isArabic?: boolean;
}

function BottomContent({ setCollapsed, isArabic }: BottomContentProps) {
  const { criterias, setCriterias } = useCamera();
  const { view, setView } = useSkinAnalysis();
  const [searchParams] = useSearchParams();
  const skinConcern = searchParams.get("skinConcern"); // Mengambil parameter "skinConcern"=
  if (criterias.isCaptured || skinConcern) {
    return (
      <SkinProblems
        onClose={() => {
          setView("face");
        }}
        setCollapsed={setCollapsed}
        skinConcerns={skinConcern}
      />
    );
  }

  return <VideoScene isArabic={isArabic} />;
}

function Slider({ valueSlider }: { valueSlider: number }) {
  const [value, setValue] = useState(valueSlider); // Nilai slider (0-100)
  const { smoothingStrength, setSmoothingStrength } = useSkinImprovement(); // Ambil nilai smoothingStrength dan setSmoothingStrength dari context

  // Rentang nilai smoothingStrength
  const minSmoothing = 0.01;
  const maxSmoothing = 1.25;

  // Hitung nilai smoothingStrength berdasarkan nilai slider
  useEffect(() => {
    const mappedValue =
      minSmoothing + ((value - 0) / (100 - 0)) * (maxSmoothing - minSmoothing);
    setSmoothingStrength(mappedValue);
    console.log(smoothingStrength);
  }, [value]);

  // Labels di atas slider
  const labels = ["00", 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="flex w-full flex-col items-center">
      {/* Labels di atas slider */}
      <div className="relative mb-1 mt-8 flex w-full max-w-md justify-between">
        {labels.map((label, index) => (
          <div
            key={index}
            className={`relative text-sm ${
              value === Number(label)
                ? "scale-110 font-bold text-white"
                : "text-gray-400"
            }`}
            style={{
              transform: value === Number(label) ? "translateY(-0.25rem)" : "",
              transition: "all 0.2s ease",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Slider Container */}
      <div className="relative w-full max-w-md">
        {/* Background bar */}
        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 transform rounded-full bg-gray-300"></div>

        {/* Highlighted bar */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 transform rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(to right, #CA9C43, #916E2B, #6A4F1B, #473209)`,
          }}
        ></div>

        {/* Slider track */}
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="relative h-2 w-full cursor-pointer opacity-0"
        />

        {/* Slider thumb */}
        <div
          className="absolute top-1/2 flex h-8 w-8 -translate-y-1/2 translate-x-[-50%] transform items-center justify-center rounded-xl border-2 border-white shadow-lg"
          style={{
            left: `${value}%`,
            background: `linear-gradient(to right, #CA9C43, #916E2B, #6A4F1B, #473209)`,
          }}
        >
          <span className="text-xs font-bold text-white">Day</span>
        </div>
      </div>
    </div>
  );
}
