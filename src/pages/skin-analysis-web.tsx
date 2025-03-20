import React, { useEffect, useRef, useState } from "react";
import { Footer } from "../components/footer";
import { VideoStream } from "../components/recorder/video-stream";
import {
  InferenceProvider,
  useInferenceContext,
} from "../context/inference-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import {
  SkinAnalysisProvider,
  useSkinAnalysis,
} from "../context/skin-analysis-context";
import { FaceResults } from "../types/faceResults";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";
// import { skinAnalysisInference } from "../inference/skinAnalysisInference";
import { VideoScene } from "../components/recorder/recorder";
import * as tf from "@tensorflow/tfjs";
import * as tflite from "@tensorflow/tfjs-tflite";
import { ModelLoadingScreen } from "../components/model-loading-screen";
// import { Scanner } from "../components/scanner";
import { GraphModel } from "@tensorflow/tfjs";
import { detectFrame, detectSegment } from "../inference/skinAnalysisInference";
import { base64ToImage } from "../utils/imageProcessing";
import { useTranslation } from "react-i18next";
import { getCookie } from "../utils/other";
import { label } from "three/webgpu";
import SkinAnalysisScene from "../components/skin-analysis/skin-analysis-scene";
import {
  loadTFLiteModel,
  preprocessTFLiteImage,
  runTFLiteInference,
} from "../utils/tfliteInference";
import { useModelLoader } from "../hooks/useModelLoader";
import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import { Scanner } from "../components/scanner";

interface Model {
  net: tf.GraphModel;
  inputShape: number[];
  outputShape: tf.Shape[];
}

export function SkinAnalysisWeb() {
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
          <div className="h-full min-h-dvh">
            <Main isArabic={isArabic} />
          </div>
        </SkinAnalysisProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main({ isArabic }: { isArabic?: boolean }) {
  const { criterias } = useCamera();

  const modelSkinAnalysisRef = useRef<tflite.TFLiteModel | null>(null);
  const modelOneRef = useRef<ImageSegmenter | null>(null);
  const modelTwoRef = useRef<ImageSegmenter | null>(null);
  const modelThreeRef = useRef<ImageSegmenter | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isLoading,
    setIsLoading,
    setIsInferenceFinished,
    setInferenceError,
    setIsInferenceRunning,
  } = useInferenceContext();

  const [inferenceResult, setInferenceResult] = useState<FaceResults[] | null>(
    null,
  );

  const [isVideoDetectorReady, setIsVideoDetectorReady] = useState(false);
  const { setSkinAnalysisResult } = useSkinAnalysis();

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  const [loading, setLoading] = useState({ loading: true, progress: 0 });

  const steps = [
    async () => {
      const model = await loadTFLiteModel(
        "/media/unveels/models/age/model_age_q.tflite",
      );

      modelSkinAnalysisRef.current = model;
    },
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
      );
      modelOneRef.current = await ImageSegmenter.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/skin-analysis/skin-1.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        },
      );
      modelTwoRef.current = await ImageSegmenter.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/hair/selfie_multiclass.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        },
      );
      modelThreeRef.current = await ImageSegmenter.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/skin-analysis/skin-3.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: true,
        },
      );
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
    const skinAnalysisInference = async () => {
      if (
        criterias.isCaptured &&
        criterias.capturedImage &&
        !isLoading &&
        !isInferenceCompleted
      ) {
        if ((window as any).flutter_inappwebview) {
          (window as any).flutter_inappwebview
            .callHandler("detectionRun", "Detection Running Skin Analysis")
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

        try {
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
          if (modelOneRef.current == null) throw new Error("Model ref is null");
          if (modelTwoRef.current == null) throw new Error("Model ref is null");
          if (modelThreeRef.current == null)
            throw new Error("Model ref is null");

          const skin1: [FaceResults[], SkinAnalysisResult[]] =
            await detectSegment(
              image,
              canvasRef.current,
              modelOneRef.current,
              0,
              0,
            );

          // const skin2: [FaceResults[], SkinAnalysisResult[]] =
          //   await detectSegment(image, canvasRef.current, modelOneRef.current, [
          //     "background",
          //     "class1",
          //     "class1",
          //     "class1",
          //     "class1",
          //     "class1",
          //     "class1",
          //     "class1",
          //   ], 1);
          const skin3: [FaceResults[], SkinAnalysisResult[]] =
            await detectSegment(
              image,
              canvasRef.current,
              modelThreeRef.current,
              2,
              1,
            );

          if (skin1) {
            setInferenceResult([...skin1[0], ...skin3[0]]);
            console.log("Skin Analysis Result:", skin1);
            const resultString = JSON.stringify([
              ...skin1[1],
              // ...skin2[1],
              ...skin3[1],
              {
                label: "imageData",
                class: 1000,
                score: 0,
                data: criterias.capturedImage,
              },
              {
                label: "age",
                class: 1001,
                score: Math.round(age),
              },
            ]);
            console.log("Skin Analysis Result as JSON:", resultString);

            setIsInferenceCompleted(true);

            if ((window as any).flutter_inappwebview) {
              (window as any).flutter_inappwebview
                .callHandler("detectionResult", resultString)
                .then((result: any) => {
                  console.log("Flutter responded with:", result);
                })
                .catch((error: any) => {
                  console.error("Error calling Flutter handler:", error);
                });

              setTimeout(() => {
                setShowScannerAfterInference(false); // Hentikan scanner setelah 2 detik
              }, 2000);
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

    skinAnalysisInference();
  }, [criterias.isCaptured, criterias.capturedImage]);

  return (
    <>
      {(!isVideoDetectorReady || modelLoading) && (
        <ModelLoadingScreen progress={progress} />
      )}
      <div className="relative mx-auto h-full min-h-dvh w-full overflow-hidden bg-black">
        {isInferenceCompleted && criterias.capturedImage != null && (
          <div className="absolute inset-0">
            <img
              src={criterias.capturedImage}
              className="h-full w-full scale-x-[-1] transform object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0">
          <>
            <canvas
              ref={canvasRef}
              className={`pointer-events-none absolute left-1/2 top-1/2 blur-[1px]`}
              style={{
                zIndex: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "translate(-50%, -50%)",
              }}
            />
            {!isLoading && inferenceResult != null ? (
              <>
                <SkinAnalysisScene data={inferenceResult} maskCanvas={canvasRef}/>
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
                    <VideoStream onCanvasReady={setIsVideoDetectorReady} />
                  </>
                )}
              </>
            )}
          </>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {!criterias.capturedImage && <VideoScene isArabic={isArabic} />}
          <Footer />
        </div>
      </div>
    </>
  );
}