import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as tf from "@tensorflow/tfjs-core";
import * as tflite from "@tensorflow/tfjs-tflite";
import clsx from "clsx";
import {
  ChevronLeft,
  CirclePlay,
  PauseCircle,
  StopCircle,
  X,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFragrancesProductQuery } from "../api/fragrances";
import { useLipsProductQuery } from "../api/lips";
import { useLookbookProductQuery } from "../api/lookbook";
import { CircularProgressRings } from "../components/circle-progress-rings";
import { Footer } from "../components/footer";
import { Icons } from "../components/icons";
import { LoadingProducts } from "../components/loading";
import { BrandName } from "../components/product/brand";
import { Rating } from "../components/rating";
import { VideoScene } from "../components/recorder/recorder";
import { VideoStream } from "../components/recorder/video-stream";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { useRecordingControls } from "../hooks/useRecorder";
import { personalityInference } from "../inference/personalityInference";
import { Classifier } from "../types/classifier";
import { baseApiUrl, getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { exchangeRates, personalityAnalysisResult } from "../utils/constants";
import {
  loadTFLiteModel,
  preprocessTFLiteImage,
  runTFLiteInference,
} from "../utils/tfliteInference";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { Scanner } from "../components/scanner";
import { TopNavigation } from "../components/top-navigation";
import { useTranslation } from "react-i18next";
import { getCookie, getCurrencyAndRate } from "../utils/other";
import { RecommendationsTab } from "../components/personality-analyzer/recomendations-tab";

export function PersonalityFinder() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <CameraProvider>
      <InferenceProvider>
        <div className="h-full min-h-dvh">
          <MainContent />
        </div>
      </InferenceProvider>
    </CameraProvider>
  );
}

function MainContent() {
  const modelFaceShapeRef = useRef<tflite.TFLiteModel | null>(null);
  const modelPersonalityFinderRef = useRef<tflite.TFLiteModel | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const { criterias } = useCamera();
  const {
    setIsLoading,
    setIsInferenceFinished,
    isInferenceFinished,
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
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
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

  if (inferenceResult && !showScannerAfterInference) {
    return <Result inferenceResult={inferenceResult} />;
  }

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-pink-950">
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
              <TopNavigation />
            </>
          )}
        </>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {!criterias.isCaptured && <VideoScene />}
          <Footer />
        </div>
      </div>
    </>
  );
}

function Result({ inferenceResult }: { inferenceResult: Classifier[] }) {
  const { t } = useTranslation();
  const tabs = [
    {
      title: "Personality",
    },
    {
      title: "Attributes",
    },
    {
      title: "Recommendations",
    },
  ];

  const [selectedTab, setTab] = useState(tabs[0].title);

  const { criterias } = useCamera();

  return (
    <div className="flex h-screen flex-col bg-black font-sans text-white">
      {/* Navigation */}
      <div className="mb-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <TopNavigation cart={inferenceResult.length > 0} />
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex items-start space-x-1 px-3 py-4">
        <div className="shrink-0 px-3">
          <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-[#CA9C43] to-[#644D21] p-1">
            {criterias.capturedImage ? (
              <img
                className="size-16 rounded-full object-fill sm:size-20"
                src={criterias.capturedImage}
                alt="Captured Profile"
              />
            ) : (
              <img
                className="size-20 rounded-full"
                src="https://avatar.iran.liara.run/public/30"
                alt="Profile"
              />
            )}
          </div>

          <div className="pt-1 text-center text-xs">
            {t(
              `personalityLabels.${inferenceResult?.[15]?.outputLabel.toLocaleLowerCase() || ""}`,
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-x-1">
            <Icons.hashtagCircle className="size-3" />
            <div className="text-xs">
              {t("viewpersonality.aiPersonalityAnalysis")} :
            </div>
          </div>
          <div className="mt-1 pl-4 pr-6 text-[9px] sm:text-[10.8px] lg:pl-0 lg:pt-5">
            {inferenceResult?.[15]?.outputIndex !== undefined
              ? t(
                  `personalityAnalysisResult.${inferenceResult[15].outputIndex}`,
                ) || ""
              : ""}
          </div>
        </div>
      </div>

      {/* Tabs */}

      <div className="mx-auto w-full max-w-[400px] px-3">
        <div className="flex border-b-2 border-white/50">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={clsx(
                "w-full translate-y-0.5 border-b-2 py-1.5 text-xs md:text-sm", // text-xs untuk mobile, md:text-sm untuk layar lebih besar
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
      {selectedTab === "Personality" ? (
        <PersonalityTab data={inferenceResult ?? null} />
      ) : null}
      {selectedTab === "Attributes" ? (
        <AttributesTab data={inferenceResult ?? null} />
      ) : null}
      {selectedTab === "Recommendations" ? (
        <RecommendationsTab
          personality={inferenceResult?.[15]?.outputLabel ?? ""}
        />
      ) : null}
    </div>
  );
}

function PersonalityTab({ data }: { data: Classifier[] | null }) {
  const { t } = useTranslation();
  if (!data) {
    return <div></div>;
  }

  return (
    <div className="flex-1 space-y-6 overflow-auto px-5 py-6 md:px-5">
      <h2 className="text-center text-lg font-medium md:text-xl">
        {t("viewpersonality.personality_traits")}
      </h2>

      <div className="md:hidden">
        <CircularProgressRings
          data={
            data[15].outputData !== undefined
              ? [
                  {
                    percentage: data[15].outputData[0] * 100,
                    color: "#FFC300",
                  }, // Extraversion
                  {
                    percentage: data[15].outputData[1] * 100,
                    color: "#B5179E",
                  }, // Neuroticism
                  {
                    percentage: data[15].outputData[2] * 100,
                    color: "#5ED400",
                  }, // Agreeableness
                  {
                    percentage: data[15].outputData[3] * 100,
                    color: "#F72585",
                  }, // Conscientiousness
                  {
                    percentage: data[15].outputData[4] * 100,
                    color: "#4CC9F0",
                  }, // Openness to Experience
                ]
              : [
                  { percentage: 90, color: "#FFC300" }, // Extraversion
                  { percentage: 75, color: "#B5179E" }, // Neuroticism
                  { percentage: 60, color: "#5ED400" }, // Agreeableness
                  { percentage: 45, color: "#F72585" }, // Conscientiousness
                  { percentage: 30, color: "#4CC9F0" }, // Openness to Experience
                ]
          }
          className="mx-auto w-full max-w-96"
        />
        <div className="flex items-center justify-between space-x-4 bg-black text-white">
          <div className="space-y-3">
            <TraitItem
              color="#FFC300"
              score={data?.[15]?.outputData?.[0]}
              title={t("personality.extraversion.title")}
            />
            <TraitItem
              color="#F72585"
              score={data?.[15]?.outputData?.[3]}
              title={t("personality.conscientiousness.title")}
            />
            <TraitItem
              color="#4CC9F0"
              score={data?.[15]?.outputData?.[4]}
              title={t("personality.openness.title")}
            />
          </div>
          <div className="space-y-3">
            <TraitItem
              color="#5ED400"
              score={data?.[15]?.outputData?.[2]}
              title={t("personality.agreeableness.title")}
            />
            <TraitItem
              color="#B5179E"
              score={data?.[15]?.outputData?.[1]}
              title={t("personality.neuroticism.title")}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto hidden w-full max-w-3xl items-center gap-x-4 md:flex">
        <div className="flex flex-1 items-center justify-between space-x-4 bg-black text-white">
          <div className="space-y-4">
            <TraitItem
              color="#5ED400"
              score={data?.[15]?.outputData?.[2]}
              title={t("personality.agreeableness.title")}
            />
            <TraitItem
              color="#B5179E"
              score={data?.[15]?.outputData?.[1]}
              title={t("personality.neuroticism.title")}
            />
          </div>
        </div>

        <CircularProgressRings
          data={
            data[15].outputData !== undefined
              ? [
                  {
                    percentage: data[15].outputData[0] * 100,
                    color: "#FFC300",
                  },
                  {
                    percentage: data[15].outputData[1] * 100,
                    color: "#B5179E",
                  },
                  {
                    percentage: data[15].outputData[2] * 100,
                    color: "#5ED400",
                  },
                  {
                    percentage: data[15].outputData[3] * 100,
                    color: "#F72585",
                  },
                  {
                    percentage: data[15].outputData[4] * 100,
                    color: "#4CC9F0",
                  },
                ]
              : [
                  { percentage: 90, color: "#FFC300" },
                  { percentage: 75, color: "#B5179E" },
                  { percentage: 60, color: "#5ED400" },
                  { percentage: 45, color: "#F72585" },
                  { percentage: 30, color: "#4CC9F0" },
                ]
          }
          className="mx-auto size-96"
        />

        <div className="flex flex-1 items-center justify-between space-x-4 bg-black text-white">
          <div className="space-y-4">
            <TraitItem
              color="#FFC300"
              score={data?.[15]?.outputData?.[0]}
              title={t("personality.extraversion.title")}
            />
            <TraitItem
              color="#F72585"
              score={data?.[15]?.outputData?.[3]}
              title={t("personality.conscientiousness.title")}
            />
            <TraitItem
              color="#4CC9F0"
              score={data?.[15]?.outputData?.[4]}
              title={t("personality.openness.title")}
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/50">
        {[
          "openness",
          "neuroticism",
          "agreeableness",
          "extraversion",
          "conscientiousness",
        ].map((trait, index) => (
          <PersonalitySection
            key={trait}
            title={t(`personality.${trait}.title`)}
            description={t(`personality.${trait}.description`)}
            score={
              data?.[15]?.outputData
                ? parseFloat((data[15].outputData[index] * 100).toFixed(1))
                : 0
            }
          />
        ))}
      </div>
    </div>
  );
}

function TraitItem({
  color,
  score,
  title,
}: {
  color: string;
  score?: number;
  title: string;
}) {
  return (
    <div className="flex items-center space-x-2.5">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {score !== undefined ? (score * 100).toFixed(1) : ""}
      </div>
      <span className="text-xs md:text-sm">{title}</span>
    </div>
  );
}

function PersonalitySection({
  title,
  description,
  score,
}: {
  title: string;
  description: string;
  score: number;
}) {
  const { t } = useTranslation();
  const scoreType = score < 40 ? "Low" : score < 70 ? "Moderate" : "High";
  return (
    <div className="py-5">
      <div className="flex items-center space-x-2 pb-6">
        <Icons.personalityTriangle className="size-8" />
        <h2 className="text-lg font-bold text-white md:text-3xl">{title}</h2>
      </div>

      <span className="text-base font-bold md:text-xl">
        {t("viewpersonality.description")}
      </span>
      <p className="pb-6 pt-1 text-xs md:text-sm">{description}</p>

      <span className="text-base font-bold md:text-xl">
        {t("viewpersonality.score")}
      </span>
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
    </div>
  );
}

function AttributesTab({ data }: { data: Classifier[] | null }) {
  const { t } = useTranslation();
  if (!data) {
    return <div></div>;
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-2 space-y-4 overflow-auto px-10 py-3 text-xs md:grid-cols-2 md:gap-4 md:space-y-0 md:px-40 md:py-6 md:text-base">
      <FeatureSection
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
}: {
  icon: ReactNode;
  title: string;
  features: {
    name: string;
    value: string;
    color?: boolean;
    hex?: string;
  }[];
}) {
  return (
    <div className="flex h-full flex-col border-white/50 md:py-4 md:even:border-l md:even:pl-4">
      <div className="flex flex-col space-y-2">
        {/* Section Title */}
        <div className="flex items-center space-x-3 pb-4">
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
