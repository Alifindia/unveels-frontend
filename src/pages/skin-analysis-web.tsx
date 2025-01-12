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
import { skinAnalysisInference } from "../inference/skinAnalysisInference";
import { VideoScene } from "../components/recorder/recorder";
import * as tf from "@tensorflow/tfjs-core";
import * as tflite from "@tensorflow/tfjs-tflite";
import { loadTFLiteModel } from "../utils/tfliteInference";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { Scanner } from "../components/scanner";
import SkinAnalysisScene from "../components/skin-analysis/skin-analysis-scene";
import { useTranslation } from "react-i18next";
import { getCookie } from "../utils/other";

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
            <Main isArabic={isArabic}/>
          </div>
        </SkinAnalysisProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main({ isArabic }: { isArabic?: boolean }) {
  const { criterias } = useCamera();

  const modelSkinAnalysisRef = useRef<tflite.TFLiteModel | null>(null);

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

  const { setSkinAnalysisResult } = useSkinAnalysis();

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  const steps = [
    async () => {
      const model = await loadTFLiteModel(
        "/media/unveels/models/skin-analysis/best_float16.tflite",
      );
      modelSkinAnalysisRef.current = model;
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
          if (modelSkinAnalysisRef.current) {
            const skinAnalysisResult: [FaceResults[], SkinAnalysisResult[]] =
              await skinAnalysisInference(
                criterias.capturedImage,
                modelSkinAnalysisRef.current,
              );

            if (skinAnalysisResult) {
              console.log("Skin Analysis Result:", skinAnalysisResult[1]);
              const resultString = JSON.stringify(skinAnalysisResult[1]);
              console.log("Skin Analysis Result as JSON:", resultString);

              setInferenceResult(skinAnalysisResult[0]);
              setSkinAnalysisResult(skinAnalysisResult[1]);
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

    faceAnalyzerInference();
  }, [criterias.isCaptured, criterias.capturedImage]);

  if (modelLoading) {
    return <ModelLoadingScreen progress={progress} />;
  }
  return (
    <>
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
