import clsx from "clsx";
import {
  ChevronLeft,
  CirclePlay,
  Heart,
  PauseCircle,
  StopCircle,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useSkincareProductQuery } from "../api/skin-care";
import { CircularProgressRings } from "../components/circle-progress-rings";
import { Footer } from "../components/footer";
import { Icons } from "../components/icons";
import { LoadingProducts } from "../components/loading";
import { BrandName } from "../components/product/brand";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { VideoStream } from "../components/recorder/video-stream";
import { ShareModal } from "../components/share-modal";
import { SkinAnalysisScene } from "../components/skin-analysis/skin-analysis-scene";
import { useRecordingControls } from "../hooks/useRecorder";
import { skinAnalysisInference } from "../inference/skinAnalysisInference";
import { FaceResults } from "../types/faceResults";
import {
  SkinAnalysisProvider,
  useSkinAnalysis,
} from "../context/skin-analysis-context";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { labelsDescription } from "../utils/constants";
import { TopNavigation } from "../components/top-navigation";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import * as tf from "@tensorflow/tfjs-core";
import * as tflite from "@tensorflow/tfjs-tflite";
import { loadTFLiteModel } from "../utils/tfliteInference";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { Scanner } from "../components/scanner";

export function SkinAnalysis() {
  return (
    <CameraProvider>
      <InferenceProvider>
        <SkinAnalysisProvider>
          <div className="h-full min-h-dvh">
            <Main />
          </div>
        </SkinAnalysisProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();

  const modelSkinAnalysisRef = useRef<tflite.TFLiteModel | null>(null);

  const {
    isLoading,
    setIsLoading,
    setIsInferenceFinished,
    isInferenceFinished,
    setInferenceError,
    setIsInferenceRunning,
  } = useInferenceContext();

  const [inferenceResult, setInferenceResult] = useState<FaceResults[] | null>(
    null,
  );

  const { setSkinAnalysisResult } = useSkinAnalysis();

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  const steps = [
    async () => {
      const model = await loadTFLiteModel(
        "/media/unveels/models/skin-analysis/best_skin_float16.tflite",
      );

      modelSkinAnalysisRef.current = model;
    },
    async () => {
      if (modelSkinAnalysisRef.current) {
        console.log("warming up model");

        const warmupModel = await modelSkinAnalysisRef.current.predict(
          tf.zeros([1, 640, 640, 3], "float32"),
        );
        tf.dispose([warmupModel]);
      }
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

  useEffect(() => {
    const faceAnalyzerInference = async () => {
      if (
        criterias.isCaptured &&
        criterias.capturedImage &&
        !isLoading &&
        !isInferenceCompleted
      ) {
        setIsInferenceRunning(true);
        setIsLoading(true);
        setInferenceError(null);

        // Tambahkan delay sebelum inferensi
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          if (modelSkinAnalysisRef.current) {
            const skinAnalysisResult: [FaceResults[], SkinAnalysisResult[]] =
              await skinAnalysisInference(
                criterias.capturedImage,
                modelSkinAnalysisRef.current,
              );

            setInferenceResult(skinAnalysisResult[0]);
            setSkinAnalysisResult(skinAnalysisResult[1]);
            setIsInferenceCompleted(true);

            console.log(skinAnalysisResult[1]);

            setTimeout(() => {
              setShowScannerAfterInference(false); // Hentikan scanner setelah 2 detik
            }, 2000);
          }
        } catch (error: any) {
          console.error("Inference error:", error);
          setInferenceError(
            error.message || "An error occurred during inference.",
          );
        } finally {
          setIsLoading(false);
          setIsInferenceRunning(false);
        }
      }
    };

    faceAnalyzerInference();
  }, [criterias.isCaptured, criterias.capturedImage]);

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
        <div className="absolute inset-0">
          <>
            {!isLoading && inferenceResult != null ? (
              <SkinAnalysisScene data={inferenceResult} />
            ) : (
              <>
                {criterias.isCaptured ? (
                  <>
                    {showScannerAfterInference || !isInferenceCompleted ? (
                      <Scanner />
                    ) : (
                      <></>
                    )}
                  </>
                ) : (
                  <>
                    <VideoStream />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
                        zIndex: 0,
                      }}
                    ></div>
                  </>
                )}
              </>
            )}
          </>
        </div>
        <RecorderStatus />
        <TopNavigation cart={isInferenceCompleted} />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          <MainContent isInferenceCompleted={isInferenceCompleted} />
          <Footer />
        </div>
      </div>
    </>
  );
}

function MainContent({
  isInferenceCompleted = false,
}: {
  isInferenceCompleted: boolean;
}) {
  const { criterias } = useCamera();
  const [shareOpen, setShareOpen] = useState(false);

  if (criterias.isFinished) {
    return shareOpen ? (
      <ShareModal
        onClose={() => {
          setShareOpen(false);
        }}
      />
    ) : (
      <div className="flex space-x-5 px-5 pb-10 font-serif">
        <button
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

  return <BottomContent isInferenceCompleted={isInferenceCompleted} />;
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

  const activeClassNames =
    "border-white inline-block text-transparent bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)] bg-clip-text";

  return (
    <>
      <div
        className="fixed inset-0 h-full w-full"
        onClick={() => {
          onClose();
        }}
      ></div>
      <div className="relative space-y-1 px-4 pb-2 sm:space-y-2">
        <div className="flex w-full items-center space-x-3.5 overflow-x-auto overflow-y-visible pt-7 no-scrollbar">
          {tabs.map((problemTab) => {
            const isActive = tab === problemTab;
            return (
              <Fragment key={problemTab}>
                <button
                  key={problemTab}
                  className={clsx(
                    "relative flex h-6 shrink-0 items-center rounded-full border border-white px-3 py-1 text-xs capitalize text-white sm:text-sm",
                    {
                      "bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]":
                        isActive,
                    },
                  )}
                  onClick={() => setTab(problemTab)}
                >
                  {problemTab}

                  {isActive ? (
                    <>
                      <div
                        className={clsx(
                          "absolute inset-0 flex items-center justify-center blur-sm",
                          activeClassNames,
                        )}
                      >
                        <span className="text-center text-sm capitalize md:text-lg">
                          {problemTab}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-center text-sm capitalize text-white/70 md:text-lg">
                          {problemTab}
                        </span>
                      </div>
                    </>
                  ) : null}

                  <div
                    className={clsx(
                      "absolute inset-x-0 -top-6 text-center text-white",
                      {
                        hidden: !isActive,
                      },
                    )}
                  >
                    {tab ? `${getTotalScoreByLabel(tab)}%` : "0%"}
                  </div>
                </button>
              </Fragment>
            );
          })}
        </div>

        <div className="px-8">
          {tab && <DescriptionText text={labelsDescription[tab]} />}
        </div>

        {tab && <ProductList skinConcern={tab} />}
      </div>
    </>
  );
}

function DescriptionText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="py-2">
      <h4 className="pb-1 font-bold text-white sm:text-xl">Description</h4>
      <p
        className={clsx("text-[9.4px] text-white sm:text-sm", {
          "line-clamp-3": !expanded,
        })}
      >
        {text}
      </p>
      <button
        type="button"
        className="inline-block text-[9.4px] text-[#CA9C43] sm:text-sm"
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        {expanded ? "Less" : "More"}
      </button>
    </div>
  );
}

function ProductList({ skinConcern }: { skinConcern: string }) {
  const { data } = useSkincareProductQuery({
    skinConcern,
  });

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
              className="relative w-[88.55px] rounded shadow sm:w-[115px]"
              onClick={() => {
                window.open(
                  `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                  "_blank",
                );
              }}
            >
              <div className="relative h-[53.9px] w-[88.55px] overflow-hidden sm:h-[70px] sm:w-[115px]">
                <img
                  src={imageUrl}
                  alt="Product"
                  className="rounded object-cover"
                />
              </div>

              <div className="absolute right-2 top-2">
                <Heart className="size-4 shrink-0 text-black" />
              </div>

              <h3 className="line-clamp-2 h-5 text-[0.48125rem] font-semibold text-white sm:h-10 sm:py-2 sm:text-[0.625rem]">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-[0.385rem] text-white/60 sm:text-[0.5rem]">
                  <BrandName brandId={getProductAttributes(product, "brand")} />
                </p>
                <div className="flex flex-wrap items-center justify-end gap-x-1">
                  <span className="text-[0.48125rem] font-bold text-white sm:text-[0.625rem]">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1 pt-1">
                <button
                  type="button"
                  className="flex h-4 w-full items-center justify-center border border-white text-[0.28875rem] font-semibold text-white sm:h-5 sm:text-[0.375rem]"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  ADD TO CART
                </button>
                <button
                  type="button"
                  className="flex h-4 w-full items-center justify-center border border-white bg-white text-[0.3465rem] font-semibold leading-none text-black sm:h-5 sm:text-[0.45rem]"
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

function BottomContent({
  isInferenceCompleted = false,
}: {
  isInferenceCompleted: boolean;
}) {
  const { criterias, setCriterias } = useCamera();
  const { view, setView } = useSkinAnalysis();

  if (criterias.isCaptured) {
    if (view === "face") {
      return <ProblemResults isInferenceCompleted={isInferenceCompleted} />;
    }

    if (view === "problems") {
      return (
        <SkinProblems
          onClose={() => {
            setView("face");
          }}
        />
      );
    }

    return (
      <AnalysisResults
        onClose={() => {
          setView("face");
        }}
      />
    );
  }

  return <VideoScene />;
}

function ProblemResults({
  isInferenceCompleted = false,
}: {
  isInferenceCompleted: boolean;
}) {
  const { view, setView } = useSkinAnalysis();
  return (
    <>
      {isInferenceCompleted && (
        <>
          <div className="absolute inset-x-0 bottom-32 flex items-center justify-center">
            <button
              type="button"
              className="bg-black px-10 py-3 text-sm text-white"
              onClick={() => {
                setView("results");
              }}
            >
              ANALYSIS RESULT
            </button>
          </div>
        </>
      )}
    </>
  );
}

function AnalysisResults({ onClose }: { onClose: () => void }) {
  const {
    calculateSkinHealthScore,
    calculateAverageSkinConditionScore,
    calculateAverageSkinProblemsScore,
    getTotalScoreByLabel,
  } = useSkinAnalysis();

  const { criterias } = useCamera();

  return (
    <div
      className={clsx(
        "fixed inset-0 flex h-dvh flex-col bg-black font-sans text-white",
      )}
    >
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="size-6">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" className="size-6" onClick={() => onClose()}>
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-end space-x-2.5 px-5">
          <Heart className="size-6" />
          <Icons.bag className="size-6" />
        </div>

        <h1 className="bg-[linear-gradient(89.39deg,#92702D_0.52%,#CA9C43_99.44%)] bg-clip-text text-3xl font-medium text-transparent">
          Analysis Results
        </h1>
      </div>

      {/* Profile Section */}
      <div className="flex items-center space-x-1 px-5 py-2">
        <div className="shrink-0 px-5">
          <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-[#CA9C43] to-[#644D21] p-1">
            {criterias.capturedImage ? (
              <img
                className="size-24 rounded-full object-fill"
                src={criterias.capturedImage}
                alt="Captured Profile"
              />
            ) : (
              <img
                className="size-24 rounded-full"
                src="https://avatar.iran.liara.run/public/30"
                alt="Profile"
              />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-x-2">
            <Icons.chart className="size-5" />
            <div className="text-lg">
              Skin Health Score : {calculateSkinHealthScore()}%
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            <Icons.hashtagCircle className="size-5" />
            <div className="text-lg">
              Skin Age: {Math.floor(Math.random() * (64 - 20 + 1)) + 20}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <h2 className="text-center text-xl font-medium">
          Detected Skin Problems
        </h2>

        <div className="md:hidden">
          <div className="relative pt-8">
            <CircularProgressRings
              className="mx-auto w-full max-w-96"
              data={[
                { percentage: getTotalScoreByLabel("acne"), color: "#F72585" },
                {
                  percentage: getTotalScoreByLabel("texture"),
                  color: "#E9A0DD",
                },
                { percentage: getTotalScoreByLabel("pore"), color: "#F4EB24" },
                { percentage: getTotalScoreByLabel("spots"), color: "#0F38CC" },
                {
                  percentage: getTotalScoreByLabel("eyebag"),
                  color: "#00E0FF",
                },
                {
                  percentage: getTotalScoreByLabel("dark circle"),
                  color: "#6B13B1",
                },
                {
                  percentage: getTotalScoreByLabel("wrinkles"),
                  color: "#00FF38",
                },
              ]}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <div className="text-xl font-bold">
                {calculateAverageSkinProblemsScore()}%
              </div>
              <div className="">Skin Problems</div>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00FF38] text-sm font-bold text-white">
                  {getTotalScoreByLabel("texture")}%
                </div>
                <span>Texture</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6B13B1] text-sm font-bold text-white">
                  {getTotalScoreByLabel("dark circle")}%
                </div>
                <span>Dark Circles</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00E0FF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("eyebag")}%
                </div>
                <span>Eyebags</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0F38CC] text-sm font-bold text-white">
                  {getTotalScoreByLabel("wrinkles")}%
                </div>
                <span>Wrinkles</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EB24] text-sm font-bold text-white">
                  {getTotalScoreByLabel("pore")}%
                </div>
                <span>Pores</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E9A0DD] text-sm font-bold text-white">
                  {getTotalScoreByLabel("spots")}%
                </div>
                <span>Spots</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("acne")}%
                </div>
                <span>Acne</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-3xl items-center gap-x-4 md:flex">
          <div className="flex flex-1 items-start justify-between space-x-4 bg-black px-10 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0F38CC] text-sm font-bold text-white">
                  {getTotalScoreByLabel("wrinkles")}%
                </div>
                <span>Wrinkles</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EB24] text-sm font-bold text-white">
                  {getTotalScoreByLabel("pore")}%
                </div>
                <span>Pores</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E9A0DD] text-sm font-bold text-white">
                  {getTotalScoreByLabel("spots")}%
                </div>
                <span>Spots</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("acne")}%
                </div>
                <span>Acne</span>
              </div>
            </div>
          </div>

          <div className="relative pt-8">
            <CircularProgressRings
              className="mx-auto size-96"
              data={[
                { percentage: getTotalScoreByLabel("acne"), color: "#F72585" },
                {
                  percentage: getTotalScoreByLabel("texture"),
                  color: "#E9A0DD",
                },
                { percentage: getTotalScoreByLabel("pore"), color: "#F4EB24" },
                { percentage: getTotalScoreByLabel("spots"), color: "#0F38CC" },
                {
                  percentage: getTotalScoreByLabel("eyebag"),
                  color: "#00E0FF",
                },
                {
                  percentage: getTotalScoreByLabel("dark circle"),
                  color: "#6B13B1",
                },
                {
                  percentage: getTotalScoreByLabel("wrinkles"),
                  color: "#00FF38",
                },
              ]}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <div className="text-xl font-bold">
                {calculateAverageSkinProblemsScore()}%
              </div>
              <div className="">Skin Problems</div>
            </div>
          </div>

          <div className="flex flex-1 items-start justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00FF38] text-sm font-bold text-white">
                  {getTotalScoreByLabel("texture")}%
                </div>
                <span>Texture</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6B13B1] text-sm font-bold text-white">
                  {getTotalScoreByLabel("dark circle")}%
                </div>
                <span>Dark Circles</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00E0FF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("eyebag")}%
                </div>
                <span>Eyebags</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="pt-12 text-center text-xl font-medium">
          Detected Skin Condition
        </h2>

        <div className="md:hidden">
          <div className="relative pt-8">
            <CircularProgressRings
              className="mx-auto w-full max-w-96"
              data={[
                {
                  percentage: getTotalScoreByLabel("moistures"),
                  color: "#4CC9F0",
                },
                {
                  percentage: getTotalScoreByLabel("skinredness"),
                  color: "#BD8EFF",
                },
                { percentage: getTotalScoreByLabel("oily"), color: "#B5179E" },
                {
                  percentage: getTotalScoreByLabel("moistures"),
                  color: "#5DD400",
                },
                {
                  percentage: getTotalScoreByLabel("droopy eyelid lower"),
                  color: "#14A086",
                },
                {
                  percentage: getTotalScoreByLabel("droopy eyelid upper"),
                  color: "#F72585",
                },
                {
                  percentage: getTotalScoreByLabel("firmness"),
                  color: "#F1B902",
                },
              ]}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <div className="text-xl font-bold">
                {calculateAverageSkinConditionScore()}%
              </div>
              <div className="">Skin Problems</div>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F1B902] text-sm font-bold text-white">
                  {getTotalScoreByLabel("firmness")}%
                </div>
                <span>Firmness</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy eyelid upper")}%
                </div>
                <span>Droopy Upper Eyelid</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#14A086] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy eyelid lower")}%
                </div>
                <span>Droopy Lower Eyelid</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5DD400] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moistures")}%
                </div>
                <span>Moisture Level</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#B5179E] text-sm font-bold text-white">
                  {getTotalScoreByLabel("oily")}%
                </div>
                <span>Oiliness</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#BD8EFF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("skinredness")}%
                </div>
                <span>Redness</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4CC9F0] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moistures")}%
                </div>
                <span>Radiance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-3xl items-center gap-x-4 md:flex">
          <div className="flex flex-1 items-start justify-between space-x-4 bg-black px-10 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5DD400] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moistures")}%
                </div>
                <span>Moisture Level</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#B5179E] text-sm font-bold text-white">
                  {getTotalScoreByLabel("oily")}%
                </div>
                <span>Oiliness</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#BD8EFF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("skinredness")}%
                </div>
                <span>Redness</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4CC9F0] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moistures")}%
                </div>
                <span>Radiance</span>
              </div>
            </div>
          </div>

          <div className="relative pt-8">
            <CircularProgressRings
              className="mx-auto size-96"
              data={[
                {
                  percentage: getTotalScoreByLabel("moistures"),
                  color: "#4CC9F0",
                },
                {
                  percentage: getTotalScoreByLabel("skinredness"),
                  color: "#BD8EFF",
                },
                { percentage: getTotalScoreByLabel("oily"), color: "#B5179E" },
                {
                  percentage: getTotalScoreByLabel("moistures"),
                  color: "#5DD400",
                },
                {
                  percentage: getTotalScoreByLabel("droopy eyelid lower"),
                  color: "#14A086",
                },
                {
                  percentage: getTotalScoreByLabel("droopy eyelid upper"),
                  color: "#F72585",
                },
                {
                  percentage: getTotalScoreByLabel("firmness"),
                  color: "#F1B902",
                },
              ]}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <div className="text-xl font-bold">
                {calculateAverageSkinConditionScore()}%
              </div>
              <div className="">Skin Problems</div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F1B902] text-sm font-bold text-white">
                  {getTotalScoreByLabel("firmness")}%
                </div>
                <span>Firmness</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy eyelid upper")}%
                </div>
                <span>Droopy Upper Eyelid</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#14A086] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy eyelid lower")}%
                </div>
                <span>Droopy Lower Eyelid</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/50 px-2 py-10 text-white">
          <ProblemSection
            title="Wrinkles"
            detected="Forehead: Mild spots observed, likely due to sun exposure.Cheeks: A few dark spots noted on both cheeks, possibly post-inflammatory hyperpigmentation"
            description="Wrinkles are a natural part of aging, but they can also develop as a result of sun exposure, dehydration, and smoking. They can be treated with topical creams, botox, and fillers."
            score={getTotalScoreByLabel("wrinkles")}
          />
          <ProblemSection
            title="Spots"
            detected="Forehead: Mild spots observed, likely due to sun exposure.Cheeks: A few dark spots noted on both cheeks, possibly post-inflammatory hyperpigmentation"
            description="Spots can be caused by sun exposure, hormonal changes, and skin inflammation. They can be treated with topical creams, laser therapy, and chemical peels."
            score={getTotalScoreByLabel("spots")}
          />
          <ProblemSection
            title="Texture"
            detected="Detected"
            description="Uneven skin texture can be caused by acne, sun damage, and aging. It can be treated with exfoliation, laser therapy, and microneedling."
            score={getTotalScoreByLabel("texture")}
          />
          <ProblemSection
            title="Dark Circles"
            detected="Detected"
            description="Dark circles can be caused by lack of sleep, dehydration, and genetics. They can be treated with eye creams, fillers, and laser therapy."
            score={getTotalScoreByLabel("dark circle")}
          />
          <ProblemSection
            title="Redness"
            detected="Detected"
            description="Redness can be caused by rosacea, sunburn, and skin sensitivity. It can be treated with topical creams, laser therapy, and lifestyle changes."
            score={getTotalScoreByLabel("redness")}
          />
          <ProblemSection
            title="Oiliness"
            detected="Detected"
            description="Oiliness can be caused by hormonal changes, stress, and genetics. It can be treated with oil-free skincare products, medication, and lifestyle changes."
            score={getTotalScoreByLabel("oily")}
          />
          <ProblemSection
            title="Moisture"
            detected="Detected"
            description="Dry skin can be caused by cold weather, harsh soaps, and aging. It can be treated with moisturizers, humidifiers, and lifestyle changes."
            score={getTotalScoreByLabel("moistures")}
          />
          <ProblemSection
            title="Pores"
            detected="Detected"
            description="Large pores can be caused by genetics, oily skin, and aging. They can be treated with topical creams, laser therapy, and microneedling."
            score={getTotalScoreByLabel("pore")}
          />
          <ProblemSection
            title="Eye Bags"
            detected="Detected"
            description="Eye bags can be caused by lack of sleep, allergies, and aging. They can be treated with eye creams, fillers, and surgery."
            score={getTotalScoreByLabel("eyebag")}
          />
          <ProblemSection
            title="Radiance"
            detected="Detected"
            description="Dull skin can be caused by dehydration, poor diet, and lack of sleep. It can be treated with exfoliation, hydration, and lifestyle changes."
            score={getTotalScoreByLabel("radiance")}
          />
          <ProblemSection
            title="Firminess"
            detected="Detected"
            description="Loss of firmness can be caused by aging, sun exposure, and smoking. It can be treated with topical creams, botox, and fillers."
            score={getTotalScoreByLabel("firmness")}
          />
          <ProblemSection
            title="Droopy Upper Eyelid"
            detected="Detected"
            description="Droopy eyelids can be caused by aging, genetics, and sun exposure. They can be treated with eyelid surgery, botox, and fillers."
            score={getTotalScoreByLabel("dropy upper eyelid")}
          />
          <ProblemSection
            title="Droopy Lower Eyelid"
            detected="Detected"
            description="Droopy eyelids can be caused by aging, genetics, and sun exposure. They can be treated with eyelid surgery, botox, and fillers."
            score={getTotalScoreByLabel("dropy lower eyelid")}
          />
          <ProblemSection
            title="Acne"
            detected="Detected"
            description="Acne can be caused by hormonal changes, stress, and genetics. It can be treated with topical creams, medication, and lifestyle changes."
            score={getTotalScoreByLabel("acne")}
          />
        </div>
      </div>
    </div>
  );
}

function ProblemSection({
  title,
  detected,
  description,
  score,
}: {
  title: string;
  detected: string;
  description: string;
  score: number;
}) {
  // High -> 70% - 100%
  // Moderate -> above 40% - 69%
  // low -> 0% - 39%
  const scoreType = score < 40 ? "Low" : score < 70 ? "Moderate" : "High";
  return (
    <div className="py-5">
      <div className="flex items-center space-x-2 pb-6">
        <Icons.personalityTriangle className="size-8 shrink-0" />

        <h2 className="text-3xl font-bold capitalize text-white">{title}</h2>
      </div>
      <span className="text-xl font-bold">Detected</span>
      <p className="pb-6 pt-1 text-sm">{detected}</p>
      <div className="pt-6"></div>
      <span className="text-xl font-bold">Description</span>
      <p className="pb-6 pt-1 text-sm">{description}</p>
      <span className="text-xl font-bold">Score</span>
      <div
        className={clsx(
          "text-sm",
          score < 40
            ? "text-[#FF0000]"
            : score < 70
              ? "text-[#FAFF00]"
              : "text-[#5ED400]",
        )}
      >
        {scoreType} {score}%
      </div>

      <div className="py-8">
        <h2 className="pb-4 text-xl font-bold lg:text-2xl">
          Recommended products
        </h2>

        <ProductList skinConcern={title} />
      </div>
    </div>
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
