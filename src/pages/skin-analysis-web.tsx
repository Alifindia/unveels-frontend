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
import { detectFrame } from "../inference/skinAnalysisInference";
import { base64ToImage } from "../utils/imageProcessing";
import { useTranslation } from "react-i18next";
import { getCookie } from "../utils/other";
import { label } from "three/webgpu";
import SkinAnalysisScene from "../components/skin-analysis/skin-analysis-scene";

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

  const [model, setModel] = useState<Model | null>(null);

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

    return () => {
      if (model?.net) {
        model.net.dispose();
      }
    };
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

        // Tambahkan delay sebelum inferensi
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          if (model != null) {
            const image = await base64ToImage(criterias.capturedImage, true);
            console.log("converting success");

            if (canvasRef.current == null) {
              throw new Error("Canvas ref is null");
            }
            const skinAnalysisResult: [FaceResults[], SkinAnalysisResult[]] =
              await detectFrame(image, model, canvasRef.current);

            if (skinAnalysisResult) {
              setInferenceResult(skinAnalysisResult[0]);
              console.log("Skin Analysis Result:", skinAnalysisResult);
              const resultString = JSON.stringify([
                ...skinAnalysisResult[1],
                {
                  label: "imageData",
                  class: 1000,
                  score: 0,
                  data: criterias.capturedImage,
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
      {loading.loading && !isVideoDetectorReady && (
        <ModelLoadingScreen progress={loading.progress} />
      )}
      <div className="relative mx-auto h-full min-h-dvh w-full overflow-hidden bg-black">
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
