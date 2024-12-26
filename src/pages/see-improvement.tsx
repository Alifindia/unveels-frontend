import { Fragment, useEffect, useRef, useState } from "react";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { VideoStream } from "../components/recorder/video-stream";
import { RecorderStatus } from "../components/assistant";
import { TopNavigation } from "./virtual-try-on";
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
import { labelsDescription } from "../utils/constants";
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

export function SeeImprovement() {
  return (
    <CameraProvider>
      <SkinAnalysisProvider>
        <SkinImprovementProvider>
          <div className="h-full min-h-dvh">
            <Main />
          </div>
        </SkinImprovementProvider>
      </SkinAnalysisProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [collapsed, setCollapsed] = useState(false);

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
            delegate: "GPU",
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
      <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
        <div className="absolute inset-0">
          {criterias.capturedImage ? (
            <SkinImprovementScene />
          ) : (
            <VideoStream debugMode={false} />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
            }}
          ></div>
        </div>
        <TopNavigation cart={false} />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
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

const tabs = [
  "acne",
  "blackhead",
  "dark circle",
  "droopy eyelid lower",
  "droopy eyelid upper",
  "dry",
  "eyebag",
  "firmness",
  "moistures",
  "oily",
  "pore",
  "radiance",
  "skinredness",
  "spots",
  "texture",
  "whitehead",
  "wrinkles",
] as const;

function SkinProblems({ onClose }: { onClose: () => void }) {
  const { tab, setTab, getTotalScoreByLabel } = useSkinAnalysis();

  return (
    <>
      <div className="relative space-y-2 px-4 pb-4">
        <div className="flex w-full items-center space-x-3.5 overflow-x-auto overflow-y-visible pt-7 no-scrollbar">
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
                  {problemTab}

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
                    ${product.price.toFixed(2)}
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
                    );
                  }}
                >
                  ADD TO CART
                </button>
                <button
                  type="button"
                  className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.45rem] font-semibold text-black"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  SEE IMPROVEMENT
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

function BottomContent() {
  const { criterias, setCriterias } = useCamera();
  const { view, setView } = useSkinAnalysis();

  if (criterias.isCaptured) {
    return (
      <SkinProblems
        onClose={() => {
          setView("face");
        }}
      />
    );
  }

  return <VideoScene />;
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
