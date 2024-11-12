import { ReactNode, useState, useEffect } from "react";
import { Icons } from "../components/icons";
import clsx from "clsx";
import {
  ChevronLeft,
  CirclePlay,
  PauseCircle,
  StopCircle,
  X,
} from "lucide-react";
import { Footer } from "../components/footer";
import { Rating } from "../components/rating";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { VideoStream } from "../components/recorder/video-stream";
import { useRecordingControls } from "../hooks/useRecorder";
import { personalityInference } from "../inference/personalityInference";
import { Classifier } from "../types/classifier";
import { usePage } from "../hooks/usePage";
import { LoadingProducts } from "../components/loading";
import { useFragrancesProductQuery } from "../api/fragrances";
import { useLipsProductQuery } from "../api/lips";
import { useLookbookProductQuery } from "../api/lookbook";
import { getProductAttributes, mediaUrl } from "../utils/apiUtils";
import { BrandName } from "../components/product/brand";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import { TopNavigation } from "../components/top-navigation";
import * as tf from "@tensorflow/tfjs-core";
import * as tflite from "@tensorflow/tfjs-tflite";
import { loadTFLiteModel } from "../utils/tfliteInference";
import { useTranslation } from "react-i18next";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export function FaceAnalyzer() {
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
  const [modelFaceShape, setModelFaceShape] =
    useState<tflite.TFLiteModel | null>(null);

  const [modelPersonalityFinder, setModelPersonalityFinder] =
    useState<tflite.TFLiteModel | null>(null);

  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null,
  );

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

  useEffect(() => {
    let isMounted = true;
    const dummyInput = tf.zeros([1, 224, 224, 3], "float32");

    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.7,
          minFacePresenceConfidence: 0.7,
          minTrackingConfidence: 0.7,
          runningMode: "IMAGE",
          numFaces: 1,
        });

        setModelFaceShape(
          await loadTFLiteModel(
            "/models/personality-finder/face-analyzer.tflite",
          ),
        );
        setModelPersonalityFinder(
          await loadTFLiteModel(
            "/models/personality-finder/personality_finder.tflite",
          ),
        );

        if (isMounted) {
          setFaceLandmarker(faceLandmarker);
          // warmup
          modelFaceShape?.predict(dummyInput);
          modelPersonalityFinder?.predict(dummyInput);
          modelFaceShape?.predict(dummyInput);
          modelPersonalityFinder?.predict(dummyInput);
        }
      } catch (error) {
        console.error("Failed to initialize: ", error);
      }
    };

    loadModel();

    return () => {
      isMounted = false;
      if (faceLandmarker) {
        faceLandmarker.close();
      }
      if (modelPersonalityFinder && modelFaceShape) {
        dummyInput.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const performInference = async () => {
      if (criterias.isCaptured && criterias.capturedImage) {
        setIsInferenceRunning(true);
        setIsLoading(true);
        setInferenceError(null);
        try {
          if (modelFaceShape && modelPersonalityFinder && faceLandmarker) {
            const personalityResult: Classifier[] = await personalityInference(
              modelFaceShape,
              modelPersonalityFinder,
              faceLandmarker,
              criterias.capturedImage,
              224,
              224,
            );
            setInferenceResult(personalityResult);
            setIsInferenceFinished(true);
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
    return <Result inferenceResult={inferenceResult} />;
  }

  return (
    <div className="relative mx-auto h-full min-h-dvh w-full bg-pink-950">
      <div className="absolute inset-0">
        <VideoStream debugMode={false} />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
          }}
        ></div>
      </div>
      <RecorderStatus />
      <TopNavigation cart={isInferenceFinished} />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
        <VideoScene />
        <Footer />
      </div>
    </div>
  );
}

const Result = ({ inferenceResult }: { inferenceResult: Classifier[] }) => {
  const { t } = useTranslation();
  const tabs = [
    { title: t("tabsmenupf.attributes"), key: "Attributes" },
    { title: t("tabsmenupf.recommendations"), key: "Recommendations" },
  ];

  // Use state to keep track of selected tab key for consistency
  const [selectedTab, setTab] = useState(tabs[0].key);

  const { setPage } = usePage();
  const { criterias } = useCamera();

  return (
    <div className="flex h-screen flex-col bg-black font-sans text-white">
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="size-6">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" className="size-6" onClick={() => setPage(null)}>
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="flex items-start space-x-1 px-5 py-6">
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
          <div className="flex items-center gap-x-1">
            <Icons.hashtagCircle className="size-4" />
            <div className="text-sm">{t("viewpersonality.aiFaceAnalyzer")}:</div>
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
                tab.key === selectedTab
                  ? "border-[#CA9C43] bg-gradient-to-r from-[#92702D] to-[#CA9C43] bg-clip-text text-transparent"
                  : "border-transparent",
              )}
              onClick={() => setTab(tab.key)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {selectedTab === "Attributes" && (
        <AttributesTab data={inferenceResult} />
      )}
      {selectedTab === "Recommendations" && (
        <RecommendationsTab
          faceShape={inferenceResult ? inferenceResult[14]?.outputLabel || "" : ""}
        />
      )}
    </div>
  );
};


function PersonalitySection({
  title,
  description,
  score,
}: {
  title: string;
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
        <Icons.personalityTriangle className="size-8" />

        <h2 className="text-3xl font-bold text-white">{title}</h2>
      </div>

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
    </div>
  );
}

function RecommendationsTab({ faceShape }: { faceShape: string }) {
  const { t } = useTranslation();
  const { data: fragrances } = useFragrancesProductQuery({
    faceShape,
  });
  const { data: lips } = useLipsProductQuery({
    faceShape,
  });

  const { data: items } = useLookbookProductQuery({
    faceShape,
  });

  return (
    <div className="w-full overflow-auto px-4 py-8">
      <div className="pb-14">
        <h2 className="pb-4 text-xl font-bold">{t("viewpersonality.perfumerec")}</h2>
        {fragrances ? (
          <div className="flex w-full gap-4 overflow-x-auto no-scrollbar">
            {fragrances.items.map((product, index) => {
              const imageUrl =
                mediaUrl(product.media_gallery_entries[0].file) ??
                "https://picsum.photos/id/237/200/300";

              return (
                <div key={product.id} className="w-[150px] rounded">
                  <div className="relative h-[150px] w-[150px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="rounded object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between py-2">
                    <div className="w-full">
                      <h3 className="line-clamp-2 h-10 text-sm font-semibold text-white">
                        {product.name}
                      </h3>
                      <p className="text-[0.625rem] text-white/60">
                        <BrandName
                          brandId={getProductAttributes(product, "brand")}
                        />
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-1">
                      <span className="text-sm font-bold text-white">
                        ${product.price}
                      </span>
                    </div>
                  </div>

                  <Rating rating={4} />

                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                    >
                       {t("viewpersonality.addcart")}
                    </button>
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      {t("viewpersonality.seeimprovement")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <LoadingProducts />
        )}
      </div>
      <div className="pb-14">
        <h2 className="text-xl font-bold">{t("viewpersonality.lookrec")}</h2>
        <p className="pb-4 text-sm font-bold">
          {t("viewpersonality.lookdec")}
        </p>
        {items ? (
          <div className="flex w-full gap-4 overflow-x-auto no-scrollbar">
            {items.items.map((product, index) => {
              const imageUrl =
                mediaUrl(product.media_gallery_entries[0].file) ??
                "https://picsum.photos/id/237/200/300";

              return (
                <div key={product.id} className="w-[150px] rounded">
                  <div className="relative h-[150px] w-[150px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="rounded object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between py-2">
                    <div className="w-full">
                      <h3 className="line-clamp-2 h-10 text-sm font-semibold text-white">
                        {product.name}
                      </h3>
                      <p className="text-[0.625rem] text-white/60">
                        <BrandName
                          brandId={getProductAttributes(product, "brand")}
                        />
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-1">
                      <span className="text-sm font-bold text-white">
                        ${product.price}
                      </span>
                    </div>
                  </div>

                  <Rating rating={4} />

                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                    >
                       {t("viewpersonality.addcart")}
                    </button>
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      {t("viewpersonality.seeimprovement")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <LoadingProducts />
        )}
      </div>
      <div className="pb-14">
        <h2 className="text-xl font-bold">{t("viewpersonality.lipcolorrec")}</h2>
        <p className="pb-4 text-sm font-bold">
          {t("viewpersonality.lipcolordec")}
        </p>
        {lips ? (
          <div className="flex w-full gap-4 overflow-x-auto no-scrollbar">
            {lips.items.map((product, index) => {
              const imageUrl =
                mediaUrl(product.media_gallery_entries[0].file) ??
                "https://picsum.photos/id/237/200/300";

              return (
                <div key={product.id} className="w-[150px] rounded">
                  <div className="relative h-[150px] w-[150px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="rounded object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between py-2">
                    <div className="w-full">
                      <h3 className="line-clamp-2 h-10 text-sm font-semibold text-white">
                        {product.name}
                      </h3>
                      <p className="text-[0.625rem] text-white/60">
                        <BrandName
                          brandId={getProductAttributes(product, "brand")}
                        />
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-1">
                      <span className="text-sm font-bold text-white">
                        ${product.price}
                      </span>
                    </div>
                  </div>

                  <Rating rating={4} />

                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                    >
                       {t("viewpersonality.addcart")}
                    </button>
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      {t("viewpersonality.seeimprovement")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <LoadingProducts />
        )}
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
    <div className="grid flex-1 grid-cols-1 gap-4 space-y-6 overflow-auto px-10 py-6 md:grid-cols-2">
      <FeatureSection
        icon={<Icons.face className="size-12" />}
        title={t("attributepf.face.title")}
        features={[
          { name: t("attributepf.face.faceattribute.faceshape"),value:t(`faceshapelabels.${data[14].outputLabel.toLocaleLowerCase()}`) },
          { name: t("attributepf.face.faceattribute.skintone"), value:  t(`skin_tones.${data[16].outputLabel.toLowerCase().replace(" ", '_')}`) },
        ]}
      />
      <FeatureSection
        icon={<Icons.eye className="size-12" />}
        title={t("attributepf.eyes.title")}
        features={[
          { name: t("attributepf.eyes.eyesattribute.eyeshape"), value: t(`eyeshapeLabels.${data[3].outputLabel.toLowerCase()}` ) },
          { name: t("attributepf.eyes.eyesattribute.eyesize"),  value: t(`eyesizeLabels.${data[4].outputLabel.toLowerCase()}` ) },
          { name: t("attributepf.eyes.eyesattribute.eyeangle"), value: t(`eyeangleLabels.${data[1].outputLabel.toLowerCase()}` ) },
          { name: t("attributepf.eyes.eyesattribute.eyedistance"), value: t(`eyedistanceLabels.${data[2].outputLabel.toLowerCase().replace("-","_")}` ) },
          { name: t("attributepf.eyes.eyesattribute.eyelid"), value: t(`eyelidLabels.${data[6].outputLabel.toLowerCase().replace("-","_")}` ) },
          {
            name: t("attributepf.eyes.eyesattribute.eyecolor"),
            value: "",
            color: true,
            hex: data[18].outputColor,
          },
        ]}
      />
      <FeatureSection
        icon={<Icons.brows className="size-12" />}
        title={t("attributepf.brows.title")}
        features={[
          { name: t("attributepf.brows.browsattribute.eyebrowshape"), value: t(`eyebrowshapelabels.${data[13].outputLabel.toLowerCase().replace("-","_")}` ) },
          { name: t("attributepf.brows.browsattribute.thickness"),value: t(`thickness.${data[11].outputLabel.toLowerCase()}` ) },
          { name: t("attributepf.brows.browsattribute.eyebrowdistance"), value: t(`eyebrowdistanceLabels.${data[5].outputLabel.toLowerCase()}` ) },
          {
            name: t("attributepf.brows.browsattribute.eyebrowcolor"),
            value: "",
            color: true,
            hex: data[18].outputColor,
          },
        ]}
      />
      <FeatureSection
        icon={<Icons.lips className="size-12" />}
        title={t("attributepf.lips.title")}
        features={[
          { name: t("attributepf.lips.lipsattribute.lipshape"), value: t(`liplabels.${data[7].outputLabel.toLowerCase().replace("-", '_')}`) },
          {
            name: t("attributepf.lips.lipsattribute.lipcolor"),
            value: "",
            color: true,
            hex: data[17].outputColor,
          },
        ]}
      />
      <FeatureSection
        icon={<Icons.cheekbones className="size-12" />}
        title={t("attributepf.cheekbones.title")}
        features={[{ name: t("attributepf.cheekbones.cheekbonesattribute.cheeckbones"), value: t(`cheeksbonesLabels.${data[0].outputLabel.toLowerCase().replace(" ", '_')}`) }]}
      />
      <FeatureSection
        icon={<Icons.nose className="size-12" />}
        title={t("attributepf.nose.title")}
        features={[{ name: t("attributepf.nose.noseattribute.noseshape"), value:t(`nosewidthlabels.${data[9].outputLabel.toLocaleLowerCase()}`)  }]}
      />
      <FeatureSection
        icon={<Icons.hair className="size-12" />}
        title={t("attributepf.hair.title")}
        features={[{ name: t("attributepf.hair.hairattribute.haircolor"), value: t(`hairLabels.${data[10].outputLabel.toLowerCase().replace(" ", '_')}`) }]}
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
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 pb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-3xl font-semibold">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="">
            <div className="text-xl font-bold">{feature.name}</div>
            {feature.color ? (
              <div
                className="w-ful h-6"
                style={{ backgroundColor: feature.hex }}
              ></div>
            ) : (
              <div className="text-sm">{feature.value}</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 border-b border-white/50 py-4"></div>
    </div>
  );
}

function RecorderStatus() {
  const { isRecording, formattedTime, handleStartPause, handleStop, isPaused } =
    useRecordingControls();

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
        onClick={isRecording ? handleStop : handleStartPause}
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
