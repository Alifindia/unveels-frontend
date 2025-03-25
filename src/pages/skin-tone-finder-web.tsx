import { Footer } from "../components/footer";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { VideoStream } from "../components/recorder/video-stream";
import { SkinToneFinderScene } from "../components/skin-tone-finder-scene/skin-tone-finder-scene";
import { SkinColorProvider } from "../components/skin-tone-finder-scene/skin-color-context";
import { MakeupProvider } from "../context/makeup-context";
import { InferenceProvider } from "../context/inference-context";
import { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  ImageSegmenter,
} from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { useTranslation } from "react-i18next";
import { getCookie } from "../utils/other";

export function SkinToneFinderWeb() {
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
        <SkinColorProvider>
          <MakeupProvider>
            <div className="h-full min-h-dvh">
              <Main isArabic={isArabic} />
            </div>
          </MakeupProvider>
        </SkinColorProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main({ isArabic }: { isArabic: boolean }) {
  const { criterias } = useCamera();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const imageSegmenterRef = useRef<ImageSegmenter | null>(null);

  const steps = [
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/face-landmarker/face_landmarker.task",
            delegate: "CPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "IMAGE",
          numFaces: 1,
        },
      );
      faceLandmarkerRef.current = faceLandmarkerInstance;
    },
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const imageSegmenter = await ImageSegmenter.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/hair/selfie_multiclass.tflite",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        },
      );
      imageSegmenterRef.current = imageSegmenter;
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

  if (modelLoading) {
    return <ModelLoadingScreen progress={progress} />;
  }
  return (
    <>
      <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
        <div className="absolute inset-0">
          <VideoStream debugMode={false} faceScannerColor="43, 221, 217" />
          <SkinToneFinderScene
            faceLandmarker={faceLandmarkerRef.current}
            imageSegmenter={imageSegmenterRef.current}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {criterias.isCaptured ? "" : <VideoScene isArabic={isArabic} />}
          <Footer />
        </div>
      </div>
    </>
  );
}
