import { useEffect, useRef, useState } from "react";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { SkinImprovementProvider } from "../context/see-improvement-context";
import { SkinAnalysisProvider } from "../context/skin-analysis-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useModelLoader } from "../hooks/useModelLoader";
import { ModelLoadingScreen } from "../components/model-loading-screen";
import SkinImprovementScene from "../components/skin-improvement/skin-improvement-scene";
import { VideoStream } from "../components/recorder/video-stream";
import { Footer } from "../components/footer";
import { VideoScene } from "../components/recorder/recorder";

export function SeeImprovementWeb() {
  return (
    <CameraProvider>
      <SkinAnalysisProvider>
        <SkinImprovementProvider>
          <div className="h-full min-h-dvh">
            <Main />
          </div>
        </SkinImprovementProvider>
      </SkinAnalysisProvider>
    </CameraProvider>
  );
}

function Main() {
  const { criterias } = useCamera();
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const steps = [
    async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "/media/unveels/wasm",
      );
      const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/face-landmarker/face_landmarker.task",
            delegate: "CPU",
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
          {criterias.capturedImage ? (
            <SkinImprovementScene />
          ) : (
            <VideoStream debugMode={false} />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0">
          {!criterias.isCaptured && <VideoScene />}
          <Footer />
        </div>
      </div>
    </>
  );
}
