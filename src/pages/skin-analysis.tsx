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
// import { skinAnalysisInference } from "../inference/skinAnalysisInference";
import { FaceResults } from "../types/faceResults";
import {
  SkinAnalysisProvider,
  useSkinAnalysis,
} from "../context/skin-analysis-context";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { exchangeRates, labelsDescription } from "../utils/constants";
import { TopNavigation } from "../components/top-navigation";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import * as tf from "@tensorflow/tfjs";
import * as tflite from "@tensorflow/tfjs-tflite";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { Scanner } from "../components/scanner";
import { useCartContext } from "../context/cart-context";
import { useTranslation } from "react-i18next";
import { getCookie, getCurrencyAndRate } from "../utils/other";
import { GraphModel } from "@tensorflow/tfjs-converter";
import { base64ToImage } from "../utils/imageProcessing";
import { detectFrame } from "../inference/skinAnalysisInference";
import { Link } from "react-router-dom";
import { FindTheLookItems } from "../types/findTheLookItems";
import { FilterProvider, useFilterContext } from "../context/filter-context";
import {
  FindTheLookProvider,
  useFindTheLookContext,
} from "../context/find-the-look-context";
import { getSkinConcernProductTypeIds } from "../api/attributes/skin_concern";
import { Rating } from "../components/rating";
import { useProducts, useProductsVTOAll } from "../api/get-product";
import { LinkButton } from "../App";
import {
  loadTFLiteModel,
  preprocessTFLiteImage,
  runTFLiteInference,
} from "../utils/tfliteInference";
import { useModelLoader } from "../hooks/useModelLoader";
import SuccessPopup from "../components/popup-add-to-cart";

interface Model {
  net: tf.GraphModel;
  inputShape: number[];
  outputShape: tf.Shape[];
}

export function SkinAnalysis() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);
  const isArabic = i18n.language === "ar";

  return (
    <CameraProvider>
      <InferenceProvider>
        <SkinAnalysisProvider>
          <FindTheLookProvider>
            <FilterProvider>
              <div className="h-full min-h-dvh">
                <Main isArabic={isArabic} />
              </div>
            </FilterProvider>
          </FindTheLookProvider>
        </SkinAnalysisProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main({ isArabic }: { isArabic: boolean }) {
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

  const { view, setView, tab, skinAnalysisData } = useSkinAnalysis();

  const [inferenceResult, setInferenceResult] = useState<FaceResults[] | null>(
    null,
  );

  const { setSkinAnalysisResult } = useSkinAnalysis();

  const isVideoDetectorReady = useRef(false);
  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  const steps = [
    async () => {
      const model = await loadTFLiteModel(
        "/media/unveels/models/age/model_age_q.tflite",
      );

      modelSkinAnalysisRef.current = model;
    },
  ];

  const {
    progress,
    isLoading: modelLoading,
    loadModels,
  } = useModelLoader(steps);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [model, setModel] = useState<Model | null>(null);
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const [groupedItemsData, setGroupedItemsData] = useState<{
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  }>({
    makeup: [],
    accessories: [],
  });
  const mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  } = {
    "Oily Skin": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Oily Skin"]),
    },
    "Dark Circles": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Dark Circles"]),
    },
    "Anti Aging": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Anti Aging"]),
    },
    Wrinkles: {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Wrinkles"]),
    },
    "Damaged Skin": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Damaged Skin"]),
    },
    "Fine Lines": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Fine Lines"]),
    },
    "Sensitive Skin": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Sensitive Skin"]),
    },
    Redness: {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Redness"]),
    },
    Acne: {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Acne"]),
    },
    Spots: {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Spots"]),
    },
    "Uneven Skintone": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Uneven Skintone"]),
    },
    "Dry Skin": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Dry Skin"]),
    },
    Pores: {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Pores"]),
    },
    "Black Heads": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Black Heads"]),
    },
    Blemishes: {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Blemishes"]),
    },
    "Lip Lines": {
      attributeName: "skin_concern",
      values: getSkinConcernProductTypeIds(["Lip Lines"]),
    },
  };

  useEffect(() => {
    setGroupedItemsData({
      makeup: [
        { label: "Oily Skin", section: "makeup" },
        { label: "Dark Circles", section: "makeup" },
        { label: "Anti Aging", section: "makeup" },
        { label: "Wrinkles", section: "makeup" },
        { label: "Damaged Skin", section: "makeup" },
        { label: "Fine Lines", section: "makeup" },
        { label: "Sensitive Skin", section: "makeup" },
        { label: "Redness", section: "makeup" },
        { label: "Acne", section: "makeup" },
        { label: "Spots", section: "makeup" },
        { label: "Uneven Skintone", section: "makeup" },
        { label: "Dry Skin", section: "makeup" },
        { label: "Pores", section: "makeup" },
        { label: "Black Heads", section: "makeup" },
        { label: "Blemishes", section: "makeup" },
        { label: "Lip Lines", section: "makeup" },
      ],
      accessories: [],
    });
  }, [tab]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();

        const yolov8: GraphModel = await tf.loadGraphModel(
          `/media/unveels/models/skin-analysis/best_web_model/model.json`,
          {
            onProgress: (fractions: number) => {
              setLoading({ loading: true, progress: fractions });
            },
          },
        );

        if (!yolov8.inputs[0]?.shape) {
          throw new Error("Invalid model input shape");
        }

        const dummyInput: tf.Tensor = tf.randomUniform(
          yolov8.inputs[0].shape,
          0,
          1,
          "float32",
        );

        const warmupResult = yolov8.execute(dummyInput);
        const warmupResults: tf.Tensor[] = Array.isArray(warmupResult)
          ? warmupResult
          : [warmupResult as tf.Tensor];

        setLoading({ loading: false, progress: 1 });
        setModel({
          net: yolov8,
          inputShape: yolov8.inputs[0].shape,
          outputShape: warmupResults.map((e) => e.shape),
        });

        tf.dispose([...warmupResults, dummyInput]);
      } catch (error) {
        setLoading({ loading: false, progress: 0 });
        console.error("Error loading model:", error);
      }
    };

    loadModel();
    loadModels();

    return () => {
      if (model?.net) {
        model.net.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const skinAnalisisInference = async () => {
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
          if (model != null) {
            const image = await base64ToImage(criterias.capturedImage, true);
            console.log("converting success");

            if (canvasRef.current == null) {
              throw new Error("Canvas ref is null");
            }
            let age = 30;
            if (modelSkinAnalysisRef.current != null) {
              const preprocessedImage = await preprocessTFLiteImage(
                criterias.capturedImage,
                200,
                200,
              );
              const ageData = await runTFLiteInference(
                modelSkinAnalysisRef.current,
                preprocessedImage,
                200,
                200,
              );
              if (ageData instanceof tf.Tensor) {
                const data = await ageData.data();
                age = data[0] * 77;
                ageData.dispose();
              }
            }
            const skinAnalysisResult: [FaceResults[], SkinAnalysisResult[]] =
              await detectFrame(image, model, canvasRef.current);

            // const skinAnalysisResult: [FaceResults[], SkinAnalysisResult[]] =
            // await skinAnalysisInference(
            //   criterias.capturedImage,
            //   modelSkinAnalysisRef.current,
            // );

            if (skinAnalysisResult) {
              setInferenceResult(skinAnalysisResult[0]);
              setSkinAnalysisResult([
                ...skinAnalysisResult[1],
                {
                  class: 1000,
                  score: 0,
                  data: criterias.capturedImage,
                  label: "",
                },
                {
                  label: "age",
                  class: 1001,
                  score: Math.round(age),
                },
              ]);
              setIsInferenceCompleted(true);

              // console.log(skinAnalysisResult[1]);

              setTimeout(() => {
                setShowScannerAfterInference(false); // Hentikan scanner setelah 2 detik
              }, 2000);
            }
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

    skinAnalisisInference();
  }, [criterias.isCaptured, criterias.capturedImage]);

  const setIsVideoDetectorReady = (ready: boolean) => {
    console.log("Video detector is ready: ", ready);
    isVideoDetectorReady.current = ready;
  };
  const { dataItem, type } = useCartContext();

  return (
    <>
      {(isVideoDetectorReady.current == false || model == null || modelLoading) && (
        <ModelLoadingScreen progress={loading.progress} />
      )}
      <div className="relative mx-auto h-full min-h-dvh w-full overflow-hidden bg-black">
        <SuccessPopup product={dataItem} type={type} />
        {isInferenceCompleted &&
          criterias.capturedImage != null &&
          model != null && (
            <div className="absolute inset-0">
              <img
                src={criterias.capturedImage}
                width={model.inputShape[2]}
                height={model.inputShape[1]}
                className="h-full w-full scale-x-[-1] transform object-cover"
              />
            </div>
          )}
        <div className="absolute inset-0">
          <>
            {model != null && (
              <canvas
                width={model.inputShape[2]}
                height={model.inputShape[1]}
                ref={canvasRef}
                className="h-full w-full object-cover blur-sm"
                style={{ opacity: 0.5 }}
              />
            )}
            {!isLoading && inferenceResult != null ? (
              <>
                <SkinAnalysisScene data={inferenceResult} />
              </>
            ) : (
              <>
                {isInferenceCompleted ? (
                  <>
                    {/* {showScannerAfterInference || !isInferenceCompleted ? (
                      <Scanner />
                    ) : (
                      <></>
                    )} */}
                  </>
                ) : (
                  <>
                    <VideoStream onVideoReady={setIsVideoDetectorReady} />
                  </>
                )}
              </>
            )}
          </>
        </div>
        <TopNavigation cart={isInferenceCompleted} />
        {view === "all_categories" && (
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
            <AllProductsPage
              onClose={() => {
                setView("face");
              }}
              groupedItemsData={groupedItemsData}
              mapTypes={mapTypes}
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {!criterias.isCaptured && <VideoScene isArabic={isArabic} />}
          <MainContent
            isInferenceCompleted={isInferenceCompleted}
            isArabic={isArabic}
          />
          {!criterias.isCaptured && <Footer />}
        </div>
      </div>
    </>
  );
}

function MainContent({
  isInferenceCompleted = false,
  isArabic,
}: {
  isInferenceCompleted: boolean;
  isArabic?: boolean;
}) {
  return (
    <BottomContent
      isInferenceCompleted={isInferenceCompleted}
      isArabic={isArabic}
    />
  );
}

const tabs = [
  "acne",
  "blackhead",
  "dark circles",
  "droopy lower eyelid",
  "droopy upper eyelid",
  "dry",
  "eyebags",
  "firmness",
  "moisture",
  "oily",
  "pores",
  "radiance",
  "redness",
  "spots",
  "texture",
  "whitehead",
  "wrinkles",
] as const;

function SkinProblems({ onClose }: { onClose: () => void }) {
  const { tab, setTab, getTotalScoreByLabel, setView } = useSkinAnalysis();
  const { t } = useTranslation();
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    if (tabRefs.current[tab]) {
      tabRefs.current[tab]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [tab]);

  return (
    <>
      <div className="relative space-y-1 bg-black/10 p-2 px-4 pb-2 shadow-lg backdrop-blur-sm sm:space-y-2">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex h-3 w-full items-center justify-center bg-transparent"
          >
            <div className="h-1 w-10 rounded-full bg-gray-400" />
          </button>
        </div>
        <div className="flex w-full items-center space-x-3.5 overflow-x-auto overflow-y-visible pt-7 no-scrollbar">
          {tabs.map((problemTab) => {
            const isActive = tab === problemTab;
            return (
              <Fragment key={problemTab}>
                <button
                  ref={(el) => (tabRefs.current[problemTab] = el)}
                  className={clsx(
                    "relative flex h-6 shrink-0 items-center rounded-full border border-white px-3 py-1 text-xs capitalize text-white sm:text-sm",
                    {
                      "bg-[linear-gradient(90deg,#CA9C43_0%,#916E2B_27.4%,#6A4F1B_59.4%,#473209_100%)]":
                        isActive,
                    },
                  )}
                  onClick={() => setTab(problemTab)}
                >
                  {t(`skinlabel.${problemTab}`)}

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

        <div className="px-4">
          {tab && <DescriptionText text={labelsDescription[tab]} />}
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

        {tab && <ProductList skinConcern={tab} />}

        <Footer />
      </div>
    </>
  );
}

function DescriptionText({ text }: { text: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="py-2">
      <h4 className="pb-1 font-bold text-white sm:text-xl">
        {" "}
        {t("viewskinan.description")}
      </h4>
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
        {expanded ? t("viewskinan.Less") : t("viewskinan.Readmore")}
      </button>
    </div>
  );
}

function ProductList({ skinConcern }: { skinConcern: string }) {
  const { t } = useTranslation();
  const { data } = useSkincareProductQuery({
    skinConcern,
  });
  console.log(data);
  const { addItemToCart, setDataItem, setType } = useCartContext();

  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  const handleAddToCart = async (id: string, url: string, dataProduct: any) => {
    try {
      await addItemToCart(id, url);
      setType("unit")
      setDataItem(dataProduct)
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
                    {currencySymbol}
                    {(product.price * rate).toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1 pt-1">
                <button
                  type="button"
                  className="flex h-4 w-full items-center justify-center border border-white text-[0.28875rem] font-semibold text-white sm:h-5 sm:text-[0.375rem]"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddToCart(
                      product.id.toString(),
                      `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                      product
                    );
                  }}
                >
                  {t("viewskinan.addcart")}
                </button>
                <button
                  type="button"
                  className="flex h-4 w-full items-center justify-center border border-white bg-white text-[0.3465rem] font-semibold leading-none text-black sm:h-5 sm:text-[0.45rem]"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <Link to={`/see-improvement?skinConcern=${skinConcern}`}>
                    {t("viewskinan.seeimprovement")}
                  </Link>
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
  isArabic,
}: {
  isInferenceCompleted: boolean;
  isArabic?: boolean;
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
        isArabic={isArabic}
      />
    );
  }

  return <></>;
}

function ProblemResults({
  isInferenceCompleted = false,
}: {
  isInferenceCompleted: boolean;
}) {
  const { t } = useTranslation();
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
              {t("viewskinan.analysis_result")}
            </button>
          </div>
        </>
      )}
      {view == "face" && <Footer />}
    </>
  );
}

function AnalysisResults({
  onClose,
  isArabic,
}: {
  onClose: () => void;
  isArabic?: boolean;
}) {
  const {
    calculateSkinHealthScore,
    calculateAverageSkinConditionScore,
    calculateAverageSkinProblemsScore,
    getTotalScoreByLabel,
  } = useSkinAnalysis();

  const { t } = useTranslation();
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
          {t("viewskinan.analysis_result")}
        </h1>
      </div>

      {/* Profile Section */}
      <div className="flex items-center space-x-1 px-5 py-2">
        <div className="shrink-0 px-5">
          <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-[#CA9C43] to-[#644D21] p-1">
            {criterias.capturedImage ? (
              <img
                className="size-24 scale-x-[-1] transform rounded-full object-fill"
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
              {t("viewskinan.skin_health")} : {calculateSkinHealthScore()}%
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            <Icons.hashtagCircle className="size-5" />
            <div className="text-lg">
              {t("viewskinan.skin_age")}:{" "}
              {getTotalScoreByLabel("age")}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <h2 className="text-center text-xl font-medium">
          {t("viewskinan.detected_skin")}
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
                { percentage: getTotalScoreByLabel("pores"), color: "#F4EB24" },
                { percentage: getTotalScoreByLabel("spots"), color: "#0F38CC" },
                {
                  percentage: getTotalScoreByLabel("eyebags"),
                  color: "#00E0FF",
                },
                {
                  percentage: getTotalScoreByLabel("dark circles"),
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
              <div className="">{t("viewskinan.skin_problem")}</div>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-4 bg-black px-10 capitalize text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00FF38] text-sm font-bold text-white">
                  {getTotalScoreByLabel("texture")}%
                </div>
                <span>{t("skinlabel.texture")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6B13B1] text-sm font-bold text-white">
                  {getTotalScoreByLabel("dark circles")}%
                </div>
                <span>{t("skinlabel.dark circles")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00E0FF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("eyebags")}%
                </div>
                <span>{t("skinlabel.eyebags")}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0F38CC] text-sm font-bold text-white">
                  {getTotalScoreByLabel("wrinkles")}%
                </div>
                <span>{t("skinlabel.wrinkles")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EB24] text-sm font-bold text-white">
                  {getTotalScoreByLabel("pores")}%
                </div>
                <span>{t("skinlabel.pores")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E9A0DD] text-sm font-bold text-white">
                  {getTotalScoreByLabel("spots")}%
                </div>
                <span>{t("skinlabel.spots")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("acne")}%
                </div>
                <span>{t("skinlabel.acne")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-3xl items-center gap-x-4 capitalize md:flex">
          <div className="flex flex-1 items-start justify-between space-x-4 bg-black px-10 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0F38CC] text-sm font-bold text-white">
                  {getTotalScoreByLabel("wrinkles")}%
                </div>
                <span>{t("skinlabel.wrinkles")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4EB24] text-sm font-bold text-white">
                  {getTotalScoreByLabel("pores")}%
                </div>
                <span>{t("skinlabel.pores")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E9A0DD] text-sm font-bold text-white">
                  {getTotalScoreByLabel("spots")}%
                </div>
                <span>{t("skinlabel.spots")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("acne")}%
                </div>
                <span>{t("skinlabel.acne")}</span>
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
                { percentage: getTotalScoreByLabel("pores"), color: "#F4EB24" },
                { percentage: getTotalScoreByLabel("spots"), color: "#0F38CC" },
                {
                  percentage: getTotalScoreByLabel("eyebags"),
                  color: "#00E0FF",
                },
                {
                  percentage: getTotalScoreByLabel("dark circles"),
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
              <div className="">{t("viewskinan.skin_problem")}</div>
            </div>
          </div>

          <div className="flex flex-1 items-start justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00FF38] text-sm font-bold text-white">
                  {getTotalScoreByLabel("texture")}%
                </div>
                <span>{t("skinlabel.texture")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6B13B1] text-sm font-bold text-white">
                  {getTotalScoreByLabel("dark circles")}%
                </div>
                <span>{t("skinlabel.dark circles")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#00E0FF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("eyebags")}%
                </div>
                <span>{t("skinlabel.eyebags")}</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="pt-12 text-center text-xl font-medium capitalize">
          {t("viewskinan.detected_skin_con")}
        </h2>

        <div className="md:hidden">
          <div className="relative pt-8">
            <CircularProgressRings
              className="mx-auto w-full max-w-96"
              data={[
                {
                  percentage: getTotalScoreByLabel("moisture"),
                  color: "#4CC9F0",
                },
                {
                  percentage: getTotalScoreByLabel("redness"),
                  color: "#BD8EFF",
                },
                { percentage: getTotalScoreByLabel("oily"), color: "#B5179E" },
                {
                  percentage: getTotalScoreByLabel("moisture"),
                  color: "#5DD400",
                },
                {
                  percentage: getTotalScoreByLabel("droopy lower eyelid"),
                  color: "#14A086",
                },
                {
                  percentage: getTotalScoreByLabel("droopy upper eyelid"),
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
              <div className="">{t("viewskinan.skin_problem")}</div>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F1B902] text-sm font-bold text-white">
                  {getTotalScoreByLabel("firmness")}%
                </div>
                <span>{t("skinlabel.firmness")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy upper eyelid")}%
                </div>
                <span>{t("skinlabel.droopy upper eyelid")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#14A086] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy lower eyelid")}%
                </div>
                <span>{t("skinlabel.droopy lower eyelid")}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5DD400] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moisture")}%
                </div>
                <span>{t("skinlabel.moisture")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#B5179E] text-sm font-bold text-white">
                  {getTotalScoreByLabel("oily")}%
                </div>
                <span>{t("skinlabel.oily")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#BD8EFF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("redness")}%
                </div>
                <span>{t("skinlabel.redness")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4CC9F0] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moisture")}%
                </div>
                <span>{t("skinlabel.radiance")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-3xl items-center gap-x-4 capitalize md:flex">
          <div className="flex flex-1 items-start justify-between space-x-4 bg-black px-10 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5DD400] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moisture")}%
                </div>
                <span>{t("skinlabel.moisture")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#B5179E] text-sm font-bold text-white">
                  {getTotalScoreByLabel("oily")}%
                </div>
                <span>{t("skinlabel.oily")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#BD8EFF] text-sm font-bold text-white">
                  {getTotalScoreByLabel("redness")}%
                </div>
                <span>{t("skinlabel.redness")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4CC9F0] text-sm font-bold text-white">
                  {getTotalScoreByLabel("moisture")}%
                </div>
                <span>{t("skinlabel.radiance")}</span>
              </div>
            </div>
          </div>

          <div className="relative pt-8">
            <CircularProgressRings
              className="mx-auto size-96"
              data={[
                {
                  percentage: getTotalScoreByLabel("moisture"),
                  color: "#4CC9F0",
                },
                {
                  percentage: getTotalScoreByLabel("redness"),
                  color: "#BD8EFF",
                },
                { percentage: getTotalScoreByLabel("oily"), color: "#B5179E" },
                {
                  percentage: getTotalScoreByLabel("moisture"),
                  color: "#5DD400",
                },
                {
                  percentage: getTotalScoreByLabel("droopy lower eyelid"),
                  color: "#14A086",
                },
                {
                  percentage: getTotalScoreByLabel("droopy upper eyelid"),
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
              <div className="">{t("viewskinan.skin_problem")}</div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-4 bg-black px-10 text-white">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F1B902] text-sm font-bold text-white">
                  {getTotalScoreByLabel("firmness")}%
                </div>
                <span>{t("skinlabel.firmness")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy upper eyelid")}%
                </div>
                <span>{t("skinlabel.droopy upper eyelid")}</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#14A086] text-sm font-bold text-white">
                  {getTotalScoreByLabel("droopy lower eyelid")}%
                </div>
                <span>{t("skinlabel.droopy lower eyelid")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/50 px-2 py-10 text-white">
          <ProblemSection
            isArabic={isArabic}
            title="Wrinkles"
            detected="Forehead: Mild spots observed, likely due to sun exposure.Cheeks: A few dark spots noted on both cheeks, possibly post-inflammatory hyperpigmentation"
            description="Wrinkles are a natural part of aging, but they can also develop as a result of sun exposure, dehydration, and smoking. They can be treated with topical creams, botox, and fillers."
            score={getTotalScoreByLabel("wrinkles")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Spots"
            detected="Forehead: Mild spots observed, likely due to sun exposure.Cheeks: A few dark spots noted on both cheeks, possibly post-inflammatory hyperpigmentation"
            description="Spots can be caused by sun exposure, hormonal changes, and skin inflammation. They can be treated with topical creams, laser therapy, and chemical peels."
            score={getTotalScoreByLabel("spots")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Texture"
            detected="Detected"
            description="Uneven skin texture can be caused by acne, sun damage, and aging. It can be treated with exfoliation, laser therapy, and microneedling."
            score={getTotalScoreByLabel("texture")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Dark Circles"
            detected="Detected"
            description="Dark circles can be caused by lack of sleep, dehydration, and genetics. They can be treated with eye creams, fillers, and laser therapy."
            score={getTotalScoreByLabel("dark circle")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Redness"
            detected="Detected"
            description="Redness can be caused by rosacea, sunburn, and skin sensitivity. It can be treated with topical creams, laser therapy, and lifestyle changes."
            score={getTotalScoreByLabel("redness")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="oily"
            detected="Detected"
            description="Oiliness can be caused by hormonal changes, stress, and genetics. It can be treated with oil-free skincare products, medication, and lifestyle changes."
            score={getTotalScoreByLabel("oily")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Moisture"
            detected="Detected"
            description="Dry skin can be caused by cold weather, harsh soaps, and aging. It can be treated with moisturizers, humidifiers, and lifestyle changes."
            score={getTotalScoreByLabel("moisture")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Pores"
            detected="Detected"
            description="Large pores can be caused by genetics, oily skin, and aging. They can be treated with topical creams, laser therapy, and microneedling."
            score={getTotalScoreByLabel("pores")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Eyebags"
            detected="Detected"
            description="Eye bags can be caused by lack of sleep, allergies, and aging. They can be treated with eye creams, fillers, and surgery."
            score={getTotalScoreByLabel("eyebags")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Radiance"
            detected="Detected"
            description="Dull skin can be caused by dehydration, poor diet, and lack of sleep. It can be treated with exfoliation, hydration, and lifestyle changes."
            score={getTotalScoreByLabel("radiance")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Firmness"
            detected="Detected"
            description="Loss of firmness can be caused by aging, sun exposure, and smoking. It can be treated with topical creams, botox, and fillers."
            score={getTotalScoreByLabel("firmness")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Droopy Upper Eyelid"
            detected="Detected"
            description="Droopy  can  eyelidbe caused by aging, genetics, and sun exposure. They can be treated with eyelid surgery, botox, and fillers."
            score={getTotalScoreByLabel("droopy upper eyelid")}
          />
          <ProblemSection
            isArabic={isArabic}
            title="Droopy Lower Eyelid"
            detected="Detected"
            description="Droopy  can  eyelidbe caused by aging, genetics, and sun exposure. They can be treated with eyelid surgery, botox, and fillers."
            score={getTotalScoreByLabel("droopy lower eyelid")}
          />
          <ProblemSection
            isArabic={isArabic}
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
  isArabic,
}: {
  title: string;
  detected: string;
  description: string;
  score: number;
  isArabic?: boolean;
}) {
  const { t } = useTranslation();
  // High -> 70% - 100%
  // Moderate -> above 40% - 69%
  // low -> 0% - 39%
  const scoreType = score < 40 ? "Low" : score < 70 ? "Moderate" : "High";
  return (
    <div className="py-5" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex items-center gap-x-3 pb-6">
        <Icons.personalityTriangle className="size-8 shrink-0" />

        <h2 className="text-3xl font-bold capitalize text-white">
          {t(`skinlabel.${title.toLocaleLowerCase()}`)}
        </h2>
      </div>
      <span className="text-xl font-bold">{t("viewskinan.detected")}</span>
      <p className="pb-6 pt-1 text-sm">{detected}</p>
      <div className="pt-6"></div>
      <span className="text-xl font-bold">{t("viewskinan.description")}</span>
      <p className="pb-6 pt-1 text-sm">{description}</p>
      <span className="text-xl font-bold">{t("viewskinan.score")}</span>
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
        {t(`scoreTypes.${scoreType.toLocaleLowerCase()}`)} {score}%
      </div>

      <div className="py-8">
        <h2 className="pb-4 text-xl font-bold lg:text-2xl">
          {t("viewskinan.recomend")}
        </h2>

        <ProductList skinConcern={title} />
      </div>
    </div>
  );
}

export function AllProductsPage({
  onClose,
  groupedItemsData,
  mapTypes,
}: {
  onClose: () => void;
  groupedItemsData: {
    makeup: FindTheLookItems[];
    accessories: FindTheLookItems[];
  };
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const [tab] = useState<"makeup" | "accessories">("makeup");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [sorting, setSorting] = useState(false);
  const { sort, setSort } = useFilterContext();
  const { selectedItems: cart, dispatch } = useFindTheLookContext();
  const { t } = useTranslation();
  const { addItemToCart, setDataItem, dataItem, type, setType } = useCartContext();

  const allProducts = [
    ...groupedItemsData.makeup.flatMap((category) => {
      const { attributeName, values } = mapTypes[category.label] || {};
      return values ? useProducts({ product_type_key: attributeName, type_ids: values }).data?.items || [] : [];
    }),
  ];
  
  const handleAddAllItemTocart = async () => {
    try {
      if (!allProducts.length) {
        console.warn("No products found to add to cart.");
        return;
      }
      for (const product of allProducts) {
        await addItemToCart(
          product.id.toString(),
          `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`
        );
      }
      setType("all")
      console.log("All products added to cart!");
    } catch (error) {
      console.error("Failed to add all products to cart:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black px-2 font-sans text-white">
      <SuccessPopup product={dataItem} type={type}/>
      {isFilterVisible && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-50"
          onClick={() => setIsFilterVisible(false)}
        ></div>
      )}
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

      {/* Makeup Tab */}
      {tab === "makeup" ? (
        <MakeupAllView makeups={groupedItemsData.makeup} mapTypes={mapTypes} />
      ) : (
        <></>
      )}
      <div className="h-20">
        <div className="mx-auto flex max-w-sm space-x-2.5 pb-6 pt-4 lg:space-x-6">
          {cart.items.length > 0 ? (
            <>
              <LinkButton
                to={`/virtual-try-on-product?sku=${cart.items
                  .map((product) => product.sku)
                  .join(",")}`}
                className="flex h-10 w-full items-center justify-center border border-white text-xs font-semibold text-white"
              >
                {t("viewftl.try_now")}
              </LinkButton>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center border border-white text-xs font-semibold text-white"
              >
                {t("viewftl.try_now")}
              </button>
            </>
          )}

          <button
            type="button"
            className="flex h-10 w-full items-center justify-center border border-white bg-white text-xs font-semibold text-black"
            onClick={() => {
              handleAddAllItemTocart();
            }}
          >
            {t("viewftl.add_all_to_cart")}
          </button>
        </div>
      </div>
    </div>
  );
}

function MakeupAllView({
  makeups,
  mapTypes,
}: {
  makeups: FindTheLookItems[];
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const validMakeups = makeups.filter((category) => mapTypes[category.label]);

  return (
    <div className="h-full flex-1 overflow-y-auto px-5">
      <div className="space-y-14">
        {validMakeups.map((category) => (
          <ProductHorizontalList
            category={category.label}
            key={category.section}
            mapTypes={mapTypes}
          />
        ))}
      </div>
    </div>
  );
}

function ProductHorizontalList({
  category,
  mapTypes,
}: {
  category: string;
  mapTypes: {
    [key: string]: {
      attributeName: string;
      values: string[];
    };
  };
}) {
  const { selectedItems: cart, dispatch } = useFindTheLookContext();
  const {
    selectedBrand,
    selectedCountry,
    selectedSizeOne,
    selectedSizeTwo,
    minPrice,
    maxPrice,
    selectedFormation,
    sort,
  } = useFilterContext();

  if (!mapTypes[category]) {
    console.warn(`Category "${category}" is not defined in mapTypes.`);
    return null;
  }
  const { t } = useTranslation();
  const { attributeName, values } = mapTypes[category];
  const { currency, rate, currencySymbol } = getCurrencyAndRate(exchangeRates);

  // Using useProductsVTOAll hook with dependencies that trigger data refetch
  const { data, refetch, isLoading, isFetching } = useProducts({
    product_type_key: attributeName,
    type_ids: values,
  });

  // Whenever a filter context value changes, trigger refetch
  useEffect(() => {
    refetch();
  }, [
    selectedBrand,
    selectedCountry,
    selectedSizeOne,
    selectedSizeTwo,
    minPrice,
    maxPrice,
    selectedFormation,
    sort,
    refetch, // Ensure refetch is included to avoid stale closures
  ]);

  const { addItemToCart, setDataItem, setType } = useCartContext();

  const handleAddToCart = async (id: string, url: string, dataProduct: any) => {
    try {
      await addItemToCart(id, url);
      setType("unit")
      setDataItem(dataProduct)
      console.log(`Product ${id} added to cart!`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };
  if (!data?.items?.length) {
    return null;
  }
  return (
    <div key={category}>
      <div className="py-4">
        <h2 className="text-base text-[#E6E5E3]">{category}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {isLoading || isFetching ? (
          <LoadingProducts /> // Show loading spinner when data is being fetched
        ) : (
          data?.items.map((product) => {
            const imageUrl =
              mediaUrl(product.media_gallery_entries[0].file) ??
              "https://picsum.photos/id/237/200/300";

            return (
              <div
                key={product.id}
                className="rounded-xl shadow"
              >
                <div
                className="cursor-pointer"              
                  onClick={() => {
                    window.open(
                      `${baseApiUrl}/${product.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value as string}.html`,
                      "_blank",
                    );
                  }}
                >
                  <div className="relative aspect-square w-full overflow-hidden" >
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="h-full w-full rounded object-cover"
                    />
                  </div>

                  <h3 className="line-clamp-2 h-10 pt-2.5 text-xs font-semibold text-white">
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60">
                    <BrandName
                      brandId={getProductAttributes(product, "brand")}
                    />
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-x-1">
                    <span className="text-sm font-bold text-white">
                      {currencySymbol}{(product.price * rate).toFixed(3)}
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
                        product
                      );
                    }}
                  >
                    {t("viewftl.addcart")}
                  </button>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center border border-white bg-white text-xs font-semibold text-black"
                    onClick={() => {
                      dispatch({ type: "add", payload: product });
                    }}
                  >
                    {t("viewftl.select")}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
