import { Footer } from "../components/footer";
import { VideoScene } from "../components/recorder/recorder";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { VideoStream } from "../components/recorder/video-stream";
import { SkinToneFinderScene } from "../components/skin-tone-finder-scene/skin-tone-finder-scene";
import { SkinColorProvider } from "../components/skin-tone-finder-scene/skin-color-context";
import { MakeupProvider } from "../context/makeup-context";
import { InferenceProvider } from "../context/inference-context";
import { useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";

export function SkinToneFinderWeb() {
  return (
    <CameraProvider>
      <InferenceProvider>
        <SkinColorProvider>
          <MakeupProvider>
            <div className="h-full min-h-dvh">
              <Main />
            </div>
          </MakeupProvider>
        </SkinColorProvider>
      </InferenceProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const steps = [
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
      );
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "IMAGE",
          numFaces: 1,
        },
      );
      faceLandmarkerRef.current = faceLandmarkerInstance;
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

  return (
    <>
      {modelLoading && <ModelLoadingScreen progress={progress} />}
      <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
        <div className="absolute inset-0">
          <VideoStream debugMode={false} />
          <SkinToneFinderScene faceLandmarker={faceLandmarkerRef.current} />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
            }}
          ></div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {criterias.isCaptured ? "" : <VideoScene />}
          <Footer />
        </div>
      </div>
    </>
  );
}
