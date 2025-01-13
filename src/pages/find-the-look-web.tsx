import { useEffect, useRef, useState } from "react";
import { FindTheLookProvider } from "../context/find-the-look-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { SkinAnalysisProvider } from "../context/skin-analysis-context";

import { FindTheLookScene } from "../components/find-the-look/find-the-look-scene";
import { VideoStream } from "../components/recorder/video-stream";
import { FindTheLookMainScreenWeb } from "../components/find-the-look/find-the-look-main-screen-web";
import { VideoScene } from "../components/recorder/recorder";
import { Footer } from "../components/footer";
import {
  FaceLandmarker,
  FilesetResolver,
  ObjectDetector,
} from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import { useTranslation } from "react-i18next";
import { getCookie } from "../utils/other";

export function FindTheLookWeb() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const storeLang = getCookie("store");

    const lang = storeLang === "ar" ? "ar" : "en";

    i18n.changeLanguage(lang);
  }, [i18n]);
  const isArabic = i18n.language === "ar";

  return (
    <CameraProvider>
      <SkinAnalysisProvider>
        <FindTheLookProvider>
          <div className="h-full min-h-dvh">
            <Main isArabic={isArabic}/>
          </div>
        </FindTheLookProvider>
      </SkinAnalysisProvider>
    </CameraProvider>
  );
}

function Main({ isArabic }: { isArabic?: boolean }) {
  const { criterias } = useCamera();
  const [selectionMade, setSelectionMade] = useState(false);

  const modelsRef = useRef<{
    faceLandmarker: FaceLandmarker | null;
    accesoriesDetector: ObjectDetector | null;
    makeupDetector: ObjectDetector | null;
  }>({
    faceLandmarker: null,
    accesoriesDetector: null,
    makeupDetector: null,
  });

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
          runningMode: "IMAGE",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
        },
      );
      modelsRef.current.faceLandmarker = faceLandmarkerInstance;
    },
    async () => {
      const accesoriesDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/find-the-look/accesories_model.tflite",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          maxResults: 20,
          scoreThreshold: 0.2,
        },
      );
      modelsRef.current.accesoriesDetector = accesoriesDetectorInstance;
    },
    async () => {
      const makeupDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/makeup.tflite",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          maxResults: 20,
          scoreThreshold: 0.05,
        },
      );
      modelsRef.current.makeupDetector = makeupDetectorInstance;
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

  // Fungsi ini akan dijalankan ketika pilihan sudah dibuat
  const handleSelection = () => {
    setSelectionMade(true);
  };

  if (modelLoading) {
    return <ModelLoadingScreen progress={progress} />;
  }

  return (
    <>
      {!selectionMade && (
        <FindTheLookMainScreenWeb onSelection={handleSelection} />
      )}
      {selectionMade && (
        <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
          <div className="absolute inset-0">
            {criterias.isCaptured && criterias.capturedImage ? (
              <FindTheLookScene models={modelsRef.current} />
            ) : (
              <>
                <VideoStream />
              </>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
            {!criterias.isCaptured && <VideoScene isArabic={isArabic}/>}
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
