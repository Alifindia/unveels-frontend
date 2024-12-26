import { useState, useEffect, useRef } from "react";
import { Footer } from "../components/footer";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { VideoStream } from "../components/recorder/video-stream";
import { personalityInference } from "../inference/personalityInference";
import { Classifier } from "../types/classifier";
import { InferenceProvider } from "../context/inference-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as tf from "@tensorflow/tfjs-core";
import * as tflite from "@tensorflow/tfjs-tflite";
import {
  loadTFLiteModel,
  preprocessTFLiteImage,
  runTFLiteInference,
} from "../utils/tfliteInference";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { Scanner } from "../components/scanner";

export function PersonalityFinderWeb() {
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

  const [inferenceResult, setInferenceResult] = useState<Classifier[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isInferenceRunning, setIsInferenceRunning] = useState<boolean>(false);

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
        if ((window as any).flutter_inappwebview) {
          (window as any).flutter_inappwebview
            .callHandler(
              "detectionRun",
              "Detection Running Personality Finder / Face Analyzer",
            )
            .then((result: any) => {
              console.log("Flutter responded with:", result);
            })
            .catch((error: any) => {
              console.error("Error calling Flutter handler:", error);
            });
        }
        setIsInferenceRunning(true);
        setIsLoading(true);
        setInferenceError(null);

        // Tambahkan delay sebelum inferensi
        await new Promise((resolve) => setTimeout(resolve, 3000));

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
            setIsInferenceCompleted(true);

            if (personalityResult != null) {
              console.log("Personality Result:", personalityResult);

              // Coba stringify hasilnya
              const resultString = JSON.stringify(personalityResult);
              console.log("Personality Result as JSON:", resultString);

              if ((window as any).flutter_inappwebview) {
                // Kirim data sebagai JSON string
                (window as any).flutter_inappwebview
                  .callHandler("detectionResult", resultString)
                  .then((result: any) => {
                    console.log("Flutter responded with:", result);
                  })
                  .catch((error: any) => {
                    console.error("Error calling Flutter handler:", error);
                  });
              }

              setTimeout(() => {
                setShowScannerAfterInference(false); // Hentikan scanner setelah 2 detik
              }, 3000);
            }
          }
        } catch (error: any) {
          if ((window as any).flutter_inappwebview) {
            (window as any).flutter_inappwebview
              .callHandler("detectionError", error)
              .then((result: any) => {
                console.log("Flutter responded with:", result);
              })
              .catch((error: any) => {
                console.error("Error calling Flutter handler:", error);
              });
          }
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

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-pink-950">
        <div className="absolute inset-0">
          {criterias.isCaptured ? (
            <>
              {showScannerAfterInference || !isInferenceCompleted ? (
                <Scanner />
              ) : (
                <>
                  {criterias.capturedImage && (
                    <>
                      <img
                        src={criterias.capturedImage}
                        alt="Captured"
                        className="h-full w-full object-cover"
                      />
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
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          <VideoScene />
          <Footer />
        </div>
      </div>
    </>
  );
}
