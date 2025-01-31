import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as tflite from "@tensorflow/tfjs-tflite";
import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFragrancesProductQuery } from "../api/fragrances";
import { useLipsProductQuery } from "../api/lips";
import { useLookbookProductQuery } from "../api/lookbook";
import { Footer } from "../components/footer";
import { Icons } from "../components/icons";
import { LoadingProducts } from "../components/loading";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { BrandName } from "../components/product/brand";
import { Rating } from "../components/rating";
import { VideoScene } from "../components/recorder/recorder";
import { VideoStream } from "../components/recorder/video-stream";
import { Scanner } from "../components/scanner";
import { TopNavigation } from "../components/top-navigation";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { useModelLoader } from "../hooks/useModelLoader";
import { personalityInference } from "../inference/personalityInference";
import { Classifier } from "../types/classifier";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import {
  loadTFLiteModel,
  preprocessTFLiteImage,
  runTFLiteInference,
} from "../utils/tfliteInference";
import { useCartContext } from "../context/cart-context";
import { LinkButton } from "../App";
import { useTranslation } from "react-i18next";
import { getCookie, getCurrencyAndRate } from "../utils/other";
import { exchangeRates } from "../utils/constants";
import { RecommendationsTab } from "../components/personality-analyzer/recomendations-tab";
import SuccessPopup from "../components/popup-add-to-cart";

export function FaceAnalyzer() {
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
        <div className="h-full min-h-dvh">
          <MainContent isArabic={isArabic} />
        </div>
      </InferenceProvider>
    </CameraProvider>
  );
}

function MainContent({ isArabic }: { isArabic?: boolean }) {
  const modelFaceShapeRef = useRef<tflite.TFLiteModel | null>(null);
  const modelPersonalityFinderRef = useRef<tflite.TFLiteModel | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const { criterias } = useCamera();
  const {
    isInferenceFinished,
    setIsLoading,
    setIsInferenceFinished,
    setInferenceError,
    setIsInferenceRunning,
  } = useInferenceContext();

  const [inferenceResult, setInferenceResult] = useState<Classifier[] | null>(
    null,
  );

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  const steps = [
    async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: `/media/unveels/models/face-landmarker/face_landmarker.task`,
            delegate: "CPU",
          },
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.7,
          minFacePresenceConfidence: 0.7,
          minTrackingConfidence: 0.7,
          runningMode: "IMAGE",
          numFaces: 1,
        },
      );
      faceLandmarkerRef.current = faceLandmarkerInstance;
    },
    async () => {
      const model = await loadTFLiteModel(
        "/media/unveels/models/personality-finder/face-analyzer.tflite",
      );
      modelFaceShapeRef.current = model;
    },
    async () => {
      const model = await loadTFLiteModel(
        "/media/unveels/models/personality-finder/personality_finder.tflite",
      );
      modelPersonalityFinderRef.current = model;
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
    const performInference = async () => {
      if (criterias.isCaptured && criterias.capturedImage) {
        setIsInferenceRunning(true);
        setIsLoading(true);
        setInferenceError(null);

        // Tambahkan delay sebelum inferensi
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          if (
            modelFaceShapeRef.current &&
            modelPersonalityFinderRef.current &&
            faceLandmarkerRef.current
          ) {
            // Preprocess gambar
            const preprocessedImage = await preprocessTFLiteImage(
              criterias.capturedImage,
              224,
              224,
            );
            const predFaceShape = await runTFLiteInference(
              modelFaceShapeRef.current,
              preprocessedImage,
              224,
              224,
            );
            const predPersonality = await runTFLiteInference(
              modelPersonalityFinderRef.current,
              preprocessedImage,
              224,
              224,
            );

            const personalityResult: Classifier[] = await personalityInference(
              faceLandmarkerRef.current,
              predFaceShape,
              predPersonality,
              criterias.capturedImage,
            );
            setInferenceResult(personalityResult);
            setIsInferenceFinished(true);
            setIsInferenceCompleted(true);

            setTimeout(() => {
              setShowScannerAfterInference(false); // Hentikan scanner setelah 2 detik
            }, 2000);
          }
        } catch (error: any) {
          setIsInferenceFinished(false);
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

    performInference();
  }, [criterias.isCaptured]);

  if (inferenceResult) {
    return <Result inferenceResult={inferenceResult} isArabic={isArabic} />;
  }

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-pink-950">
        <div className="absolute inset-0">
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
                <VideoStream faceScannerColor="210, 223, 53" />
              </>
            )}
          </>
        </div>
        <TopNavigation />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {!criterias.isCaptured && <VideoScene isArabic={isArabic}/>}
          <Footer />
        </div>
      </div>
    </>
  );
}

function Result({ inferenceResult, isArabic }: { inferenceResult: Classifier[], isArabic?: boolean }) {
  const { t } = useTranslation();
  const tabs = [
    {
      title: "Attributes",
    },
    {
      title: "Recommendations",
    },
  ];

  const [selectedTab, setTab] = useState(tabs[0].title);

  const navigate = useNavigate();
  const { criterias } = useCamera();
  const { dataItem, type } = useCartContext();

  return (
    <div className="relative flex h-screen flex-col bg-black font-sans text-white">
      <SuccessPopup product={dataItem} type={type} />
      {/* Navigation */}
      <div className="mb-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <TopNavigation cart={inferenceResult.length > 0} />
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-start space-x-1 px-5 py-6">
        <div className="shrink-0 px-5">
          <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-[#CA9C43] to-[#644D21] p-1">
            {criterias.capturedImage ? (
              <img
                className="size-24 rounded-full object-fill transform scale-x-[-1]"
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
          <div className="flex items-center gap-x-1">
            <Icons.hashtagCircle className="size-4" />
            <div className="text-sm sm:text-base">{t("viewpersonality.aiFaceAnalyzer")} :</div>{" "}
            {/* Adjusted text size */}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto w-full max-w-[430px] px-5">
        <div className="flex border-b-2 border-white/50">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={clsx(
                "w-full translate-y-0.5 border-b-2 py-2",
                tab.title === selectedTab
                  ? "border-[#CA9C43] bg-gradient-to-r from-[#92702D] to-[#CA9C43] bg-clip-text text-transparent"
                  : "border-transparent text-[#9E9E9E]",
              )}
              onClick={() => setTab(tab.title)}
            >
              {t(
                `tabsmenupf.${tab.title.toLocaleLowerCase().replace(" ", "_")}`,
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {selectedTab === "Attributes" ? (
        <AttributesTab data={inferenceResult} isArabic={isArabic} />
      ) : null}
      {selectedTab === "Recommendations" ? (
        <RecommendationsTab
          faceShape={inferenceResult ? inferenceResult[14].outputLabel : ""}
          isArabic={isArabic}
        />
      ) : null}
    </div>
  );
}

function AttributesTab({ data, isArabic }: { data: Classifier[] | null, isArabic?: boolean }) {
  const { t } = useTranslation();
  if (!data) {
    return <div></div>;
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-2 space-y-4 overflow-auto px-10 py-3 text-xs md:grid-cols-2 md:gap-4 md:space-y-0 md:px-40 md:py-6 md:text-base">
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.face className="size-6 md:size-12" />}
        title={t("attributepf.face.title")}
        features={[
          {
            name: t("attributepf.face.faceattribute.faceshape"),
            value: t(
              `faceshapelabels.${data[14].outputLabel.toLocaleLowerCase()}`,
            ),
          },
          {
            name: t("attributepf.face.faceattribute.skintone"),
            value: t(
              `skin_tones.${data[17].outputLabel.toLowerCase().replace(" ", "_")}`,
            ),
          },
        ]}
      />
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.eye className="size-6 md:size-12" />}
        title={t("attributepf.eyes.title")}
        features={[
          {
            name: t("attributepf.eyes.eyesattribute.eyeshape"),
            value: t(`eyeshapeLabels.${data[3].outputLabel.toLowerCase()}`),
          },
          {
            name: t("attributepf.eyes.eyesattribute.eyesize"),
            value: t(`eyesizeLabels.${data[4].outputLabel.toLowerCase()}`),
          },
          {
            name: t("attributepf.eyes.eyesattribute.eyeangle"),
            value: t(`eyeangleLabels.${data[1].outputLabel.toLowerCase()}`),
          },
          {
            name: t("attributepf.eyes.eyesattribute.eyedistance"),
            value: t(
              `eyedistanceLabels.${data[2].outputLabel.toLowerCase().replace("-", "_")}`,
            ),
          },
          {
            name: t("attributepf.eyes.eyesattribute.eyelid"),
            value: t(
              `eyelidLabels.${data[6].outputLabel.toLowerCase().replace("-", "_")}`,
            ),
          },
          {
            name: t("attributepf.eyes.eyesattribute.eyecolor"),
            value: "",
            color: true,
            hex: data[18].outputColor,
          },
        ]}
      />
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.brows className="size-6 md:size-12" />}
        title={t("attributepf.brows.title")}
        features={[
          {
            name: t("attributepf.brows.browsattribute.eyebrowshape"),
            value: t(
              `eyebrowshapelabels.${data[13].outputLabel.toLowerCase().replace("-", "_")}`,
            ),
          },
          {
            name: t("attributepf.brows.browsattribute.thickness"),
            value: t(`thickness.${data[11].outputLabel.toLowerCase()}`),
          },
          {
            name: t("attributepf.brows.browsattribute.eyebrowdistance"),
            value: t(
              `eyebrowdistanceLabels.${data[5].outputLabel.toLowerCase()}`,
            ),
          },
          {
            name: t("attributepf.brows.browsattribute.eyebrowcolor"),
            value: "",
            color: true,
            hex: data[18].outputColor,
          },
        ]}
      />
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.lips className="size-6 md:size-12" />}
        title={t("attributepf.lips.title")}
        features={[
          {
            name: t("attributepf.lips.lipsattribute.lipshape"),
            value: t(
              `liplabels.${data[7].outputLabel.toLowerCase().replace("-", "_")}`,
            ),
          },
          {
            name: t("attributepf.lips.lipsattribute.lipcolor"),
            value: "",
            color: true,
            hex: data[17].outputColor,
          },
        ]}
      />
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.cheekbones className="size-6 md:size-12" />}
        title={t("attributepf.cheekbones.title")}
        features={[
          {
            name: t("attributepf.cheekbones.cheekbonesattribute.cheeckbones"),
            value: t(
              `cheeksbonesLabels.${data[0].outputLabel.toLowerCase().replace(" ", "_")}`,
            ),
          },
        ]}
      />
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.nose className="size-6 md:size-12" />}
        title={t("attributepf.nose.title")}
        features={[
          {
            name: t("attributepf.nose.noseattribute.noseshape"),
            value: t(
              `nosewidthlabels.${data[9].outputLabel.toLocaleLowerCase()}`,
            ),
          },
        ]}
      />
      <FeatureSection
        isArabic={isArabic}
        icon={<Icons.hair className="size-6 md:size-12" />}
        title={t("attributepf.hair.title")}
        features={[
          {
            name: t("attributepf.hair.hairattribute.haircolor"),
            value: t(
              `hairLabels.${data[10].outputLabel.toLowerCase().replace(" ", "_")}`,
            ),
          },
        ]}
      />
    </div>
  );
}

function FeatureSection({
  icon,
  title,
  features,
  isArabic
}: {
  icon: ReactNode;
  title: string;
  features: {
    name: string;
    value: string;
    color?: boolean;
    hex?: string;
  }[];
  isArabic?: boolean
}) {
  return (
    <div className="flex h-full flex-col border-white/50 md:py-4 md:even:border-l md:even:pl-4">
      <div className="flex flex-col space-y-2" dir={isArabic ? "rtl" : "ltr"}>
        {/* Section Title */}
        <div className={`flex items-center space-x-3 pb-4 ${isArabic ? "flex-row-reverse justify-end" : "flex-row"}`}>
          <span className="text-xl md:text-2xl">{icon}</span> {/* Icon size */}
          <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>{" "}
          {/* Title size */}
        </div>

        {/* Feature Items */}
        <div className="grid grid-cols-2 gap-y-4">
          {features.map((feature, index) => (
            <div key={index}>
              <div className="text-base font-bold md:text-lg">
                {feature.name}
              </div>{" "}
              {/* Feature name */}
              {feature.color ? (
                <div
                  className="h-6 w-full"
                  style={{ backgroundColor: feature.hex }}
                ></div>
              ) : (
                <ul>
                  <li className="list-inside list-disc text-xs md:text-sm">
                    {feature.value}
                  </li>
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mt-4 flex-1 border-b border-white/50"></div>
    </div>
  );
}
