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
import { useNavigate } from "react-router-dom";
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
import { personalityAnalysisResult } from "../utils/constants";
import {
  loadTFLiteModel,
  preprocessTFLiteImage,
  runTFLiteInference,
} from "../utils/tfliteInference";
import { TopNavigation } from "./virtual-try-on";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { Scanner } from "../components/scanner";

export function PersonalityFinder() {
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
            delegate: "GPU",
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
        "/models/personality-finder/face-analyzer.tflite",
      );
      modelFaceShapeRef.current = model;
    },
    async () => {
      const model = await loadTFLiteModel(
        "/models/personality-finder/personality_finder.tflite",
      );
      modelPersonalityFinderRef.current = model;
    },
    async () => {
      // Warmup for modelFaceShape
      if (modelFaceShapeRef.current) {
        const warmupFace = modelFaceShapeRef.current.predict(
          tf.zeros([1, 224, 224, 3], "float32"),
        );

        tf.dispose([warmupFace]);
      }
      // Warmup for modelPersonalityFinder
      if (modelPersonalityFinderRef.current) {
        const warmupPersonality = modelPersonalityFinderRef.current.predict(
          tf.zeros([1, 224, 224, 3], "float32"),
        );

        tf.dispose([warmupPersonality]);
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
        </div>
        <RecorderStatus />
        <TopNavigation cart={isInferenceFinished} />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          <VideoScene />
          <Footer />
        </div>
      </div>
    </>
  );
}

function Result({ inferenceResult }: { inferenceResult: Classifier[] }) {
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

  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-black font-sans text-white">
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="size-6 flex-shrink-0">
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex-grow text-center">
          <RecorderStatus />
        </div>

        <button
          type="button"
          className="size-6 flex-shrink-0"
          onClick={() => {
            navigate("/");
          }}
        >
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

          <div className="pt-2 text-center text-sm">
            {inferenceResult ? inferenceResult[15].outputLabel : ""}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-x-1">
            <Icons.hashtagCircle className="size-4" />
            <div className="text-sm">AI Personality Analysis :</div>
          </div>
          <div className="mt-1 pl-5 text-xs">
            {inferenceResult?.[15]?.outputIndex !== undefined
              ? personalityAnalysisResult[inferenceResult[15].outputIndex]
              : ""}
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
                  : "border-transparent",
              )}
              onClick={() => setTab(tab.title)}
            >
              {tab.title}
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
  if (!data) {
    return <div></div>;
  }

  return (
    <div className="flex-1 space-y-6 overflow-auto px-10 py-6">
      <h2 className="text-center text-xl font-medium">
        Main 5 Personality Traits
      </h2>

      <CircularProgressRings
        data={
          data[15].outputData !== undefined
            ? [
                { percentage: data[15].outputData[0] * 100, color: "#B5179E" }, // Cyan
                { percentage: data[15].outputData[1] * 100, color: "#5ED400" }, // Magenta
                { percentage: data[15].outputData[2] * 100, color: "#4CC9F0" }, // Yellow
                { percentage: data[15].outputData[3] * 100, color: "#F72585" }, // Green
                { percentage: data[15].outputData[4] * 100, color: "#FFC300" }, // Magenta
              ]
            : [
                { percentage: 90, color: "#B5179E" }, // Cyan
                { percentage: 75, color: "#5ED400" }, // Magenta
                { percentage: 60, color: "#4CC9F0" }, // Yellow
                { percentage: 45, color: "#F72585" }, // Green
                { percentage: 30, color: "#FFC300" }, // Magenta
              ]
        }
        className="mx-auto size-96"
      />
      <div className="flex items-start justify-between space-x-4 bg-black text-white">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Extraversion */}
          <div className="flex items-center space-x-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFC300] text-sm font-bold text-white">
              {data?.[15]?.outputData !== undefined
                ? (data[15].outputData[0] * 100).toFixed(1)
                : ""}
            </div>
            <span>Extraversion</span>
          </div>

          {/* Conscientiousness */}
          <div className="flex items-center space-x-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F72585] text-sm font-bold text-white">
              {data?.[15]?.outputData !== undefined
                ? (data[15].outputData[3] * 100).toFixed(1)
                : ""}
            </div>
            <span>Conscientiousness</span>
          </div>

          {/* Openness to Experience */}
          <div className="flex items-center space-x-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4CC9F0] text-sm font-bold text-white">
              {data?.[15]?.outputData !== undefined
                ? (data[15].outputData[4] * 100).toFixed(1)
                : ""}
            </div>
            <span>Openness to Experience</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Agreeableness */}
          <div className="flex items-center space-x-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5DD400] text-sm font-bold text-white">
              {data?.[15]?.outputData !== undefined
                ? (data[15].outputData[2] * 100).toFixed(1)
                : ""}
            </div>
            <span>Agreeableness</span>
          </div>

          {/* Neuroticism */}
          <div className="flex items-center space-x-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#B5179E] text-sm font-bold text-white">
              {data?.[15]?.outputData !== undefined
                ? (data[15].outputData[1] * 100).toFixed(1)
                : ""}
            </div>
            <span>Neuroticism</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/50">
        <PersonalitySection
          title="Openness"
          description="People with an open personality are known for their vibrant imagination, curiosity, and eagerness to explore new ideas and experiences. You have a strong desire for novelty and diversity, and you're open to different perspectives and ways of thinking. With the trait of openness, you tend to be creative, flexible, and adaptable and are often receptive to change and innovation. 
You're obsessed with discovering new cultures, concepts, and opportunities, and are willing to challenge conventional norms and beliefs. Overall, those with an open personality bring a sense of wonder and enthusiasm to their interactions and endeavours. Thus, here is your recommendation list from Unveels based on having an Open Personality"
          score={
            data?.[15]?.outputData !== undefined
              ? parseFloat((data[15].outputData[4] * 100).toFixed(1))
              : 0
          }
        />
        <PersonalitySection
          title="Neuroticism"
          description="Neuroticism , as a personality trait, reflects an individual's tendency to experience negative emotions such as anxiety, depression, and moodiness. People high in neuroticism may be more prone to worry, stress, and self-doubt, they often react strongly to perceived threats or challenges. Those low in neuroticism, on the other hand, tend to be more emotionally stable and resilient in the face of adversity. Thus, here's your bespoke recommendation list from Unveels based on your Neuroticism."
          score={
            data?.[15]?.outputData !== undefined
              ? parseFloat((data[15].outputData[1] * 100).toFixed(1))
              : 0
          }
        />
        <PersonalitySection
          title="Agreeableness"
          description="People with an Agreeable personality reveal their kind-hearted and compassionate nature; characterized by a strong desire to maintain harmonious relationships. People, high in agreeableness, are often cooperative, empathetic, and considerate towards others; making them valuable team players and supportive friends. They prioritize the needs of others and are willing to go out of their way to help and support those around them. Their warm and nurturing behaviour makes them approachable and easy to get along with, fostering a sense of trust and camaraderie in their social interactions. In short, your agreeable personality is a key aspect of your character and it influences your interactions and relationships with others. Unveels has prepared a customized recommendation list based on your agreeable personality."
          score={
            data?.[15]?.outputData !== undefined
              ? parseFloat((data[15].outputData[3] * 100).toFixed(1))
              : 0
          }
        />
        <PersonalitySection
          title="Extraversion"
          description="An extravert personality provides insights into an individual's social behaviour and interaction preferences. Extraverts are known for their outgoing, energetic, and talkative nature. They thrive in social settings, seek excitement, and enjoy being the center of attention. Extraverts are often described as sociable, assertive, and enthusiastic individuals who are comfortable in group settings and have a wide circle of friends. This also delves into the extraversion traits; highlighting that they're strong in communication, leadership, and relationship-building skills. Therefore, here's what Unveels suggests for you based on your Extraversion"
          score={
            data?.[15]?.outputData !== undefined
              ? parseFloat((data[15].outputData[0] * 100).toFixed(1))
              : 0
          }
        />
        <PersonalitySection
          title="Conscientiousness"
          description="Conscientiousness is a key personality trait that reflects an individual's tendency to be organized, responsible, and goal-oriented. People high in conscientiousness are known for their reliability, diligence, and attention to detail; moreover, they're often diligent in their work, follow through on tasks, and are typically well-prepared. Unveels has unveiled the Conscientious side of your personality; and here's your recommended list based on it."
          score={
            data?.[15]?.outputData !== undefined
              ? parseFloat((data[15].outputData[2] * 100).toFixed(1))
              : 0
          }
        />
      </div>
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

function RecommendationsTab({ personality }: { personality: string }) {
  const { data: fragrances } = useFragrancesProductQuery({
    personality,
  });
  const { data: lips } = useLipsProductQuery({
    personality,
  });

  const { data: items } = useLookbookProductQuery({
    personality,
  });

  return (
    <div className="w-full overflow-auto px-4 py-8">
      <div className="pb-14">
        <h2 className="pb-4 text-xl font-bold">Perfumes Recommendations</h2>
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
                      ADD TO CART
                    </button>
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      SEE IMPROVEMENT
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
        <h2 className="text-xl font-bold">Look Recommendations</h2>
        <p className="pb-4 text-sm font-bold">
          A bold red lipstick and defined brows, mirror your strong, vibrant
          personality
        </p>
        {items ? (
          <div className="flex w-full gap-4 overflow-x-auto no-scrollbar">
            {items.profiles.map((profile, index) => {
              const imageUrl = baseApiUrl + "/media/" + profile.image;
              return (
                <div key={profile.identifier} className="w-[150px] rounded">
                  <div className="relative h-[150px] w-[150px] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="h-full w-full rounded object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between py-2">
                    <div className="w-full">
                      <h3 className="line-clamp-2 h-10 text-sm font-semibold text-white">
                        {profile.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-1">
                      <span className="text-sm font-bold text-white">
                        $
                        {profile.products.reduce(
                          (acc, product) => acc + product.price,
                          0,
                        )}
                      </span>
                    </div>
                  </div>

                  <Rating rating={4} />

                  <div className="flex space-x-1">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white text-[0.5rem] font-semibold"
                    >
                      ADD TO CART
                    </button>
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      SEE IMPROVEMENT
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
        <h2 className="text-xl font-bold">Lip Color Recommendations</h2>
        <p className="pb-4 text-sm font-bold">
          The best lip color for you are orange shades
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
                      ADD TO CART
                    </button>
                    <button
                      type="button"
                      className="flex h-7 w-full items-center justify-center border border-white bg-white text-[0.5rem] font-semibold text-black"
                    >
                      SEE IMPROVEMENT
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
  if (!data) {
    return <div></div>;
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 space-y-6 overflow-auto px-10 py-6 md:grid-cols-2">
      <FeatureSection
        icon={<Icons.face className="size-12" />}
        title="Face"
        features={[
          { name: "Face Shape", value: data[14].outputLabel },
          { name: "Skin Tone", value: data[16].outputLabel },
        ]}
      />
      <FeatureSection
        icon={<Icons.eye className="size-12" />}
        title="Eyes"
        features={[
          { name: "Eye Shape", value: data[3].outputLabel },
          { name: "Eye Size", value: data[4].outputLabel },
          { name: "Eye Angle", value: data[1].outputLabel },
          { name: "Eye Distance", value: data[2].outputLabel },
          { name: "Eyelid", value: data[6].outputLabel },
          {
            name: "Eye Color",
            value: "",
            color: true,
            hex: data[18].outputColor,
          },
        ]}
      />
      <FeatureSection
        icon={<Icons.brows className="size-12" />}
        title="Brows"
        features={[
          { name: "Eyebrow Shape", value: data[13].outputLabel },
          { name: "Thickness", value: data[11].outputLabel },
          { name: "Eyebrow Distance", value: data[5].outputLabel },
          {
            name: "Eyebrow color",
            value: "",
            color: true,
            hex: data[18].outputColor,
          },
        ]}
      />
      <FeatureSection
        icon={<Icons.lips className="size-12" />}
        title="Lips"
        features={[
          { name: "Lip shape", value: data[14].outputLabel },
          {
            name: "Lip color",
            value: "",
            color: true,
            hex: data[17].outputColor,
          },
        ]}
      />
      <FeatureSection
        icon={<Icons.cheekbones className="size-12" />}
        title="Cheekbones"
        features={[{ name: "cheekbones", value: data[0].outputLabel }]}
      />
      <FeatureSection
        icon={<Icons.nose className="size-12" />}
        title="Nose"
        features={[{ name: "Nose Shape", value: data[9].outputLabel }]}
      />
      <FeatureSection
        icon={<Icons.hair className="size-12" />}
        title="Hair"
        features={[{ name: "Face Shape", value: data[10].outputLabel }]}
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
