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

export function FindTheLookWeb() {
  return (
    <CameraProvider>
      <SkinAnalysisProvider>
        <FindTheLookProvider>
          <div className="h-full min-h-dvh">
            <Main />
          </div>
        </FindTheLookProvider>
      </SkinAnalysisProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();
  const [selectionMade, setSelectionMade] = useState(false);

  const modelsRef = useRef<{
    faceLandmarker: FaceLandmarker | null;
    handDetector: ObjectDetector | null;
    ringDetector: ObjectDetector | null;
    neckDetector: ObjectDetector | null;
    earringDetector: ObjectDetector | null;
    glassDetector: ObjectDetector | null;
    headDetector: ObjectDetector | null;
    makeupDetector: ObjectDetector | null;
  }>({
    faceLandmarker: null,
    handDetector: null,
    ringDetector: null,
    neckDetector: null,
    earringDetector: null,
    glassDetector: null,
    headDetector: null,
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
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU",
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
      const handDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/hand.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 2,
          scoreThreshold: 0.63,
        },
      );
      modelsRef.current.handDetector = handDetectorInstance;
    },
    async () => {
      const ringDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/rings.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.9,
        },
      );
      modelsRef.current.ringDetector = ringDetectorInstance;
    },
    async () => {
      const neckDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/neck.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.9,
        },
      );
      modelsRef.current.neckDetector = neckDetectorInstance;
    },
    async () => {
      const earringDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/find-the-look/earrings.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.9,
        },
      );
      modelsRef.current.earringDetector = earringDetectorInstance;
    },
    async () => {
      const glassDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/glass.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.6,
        },
      );
      modelsRef.current.glassDetector = glassDetectorInstance;
    },
    async () => {
      const headDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/head.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 1,
          scoreThreshold: 0.63,
        },
      );
      modelsRef.current.headDetector = headDetectorInstance;
    },
    async () => {
      const makeupDetectorInstance = await ObjectDetector.createFromOptions(
        await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        ),
        {
          baseOptions: {
            modelAssetPath: "/media/unveels/models/find-the-look/makeup.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          maxResults: 4,
          scoreThreshold: 0.1,
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
      )}
    </>
  );
}
