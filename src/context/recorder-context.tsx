// recorder-context.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  MutableRefObject,
} from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import Webcam from "react-webcam";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type RunningMode = "LIVE_CAMERA" | "IMAGE" | "VIDEO";

interface CameraState {
  facePosition: boolean;
  lighting: boolean;
  orientation: boolean;
  flipped: boolean;
  isFinished: boolean;
  isCaptured: boolean;
  capturedImage: string | null;
  capturedImageCut: string | null;
  isCompare: boolean;
  lastBoundingBox: BoundingBox | null;
  runningMode: RunningMode; // New Property
}

interface SkinToneThreeSceneRef {
  callFunction: () => void;
}

interface CameraContextType {
  skinToneThreeSceneRef: MutableRefObject<SkinToneThreeSceneRef | null>;
  webcamRef: MutableRefObject<Webcam | null>;
  imageRef: MutableRefObject<HTMLImageElement | null>;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  criterias: CameraState;
  setCriterias: (newState: Partial<CameraState>) => void;
  flipCamera: () => void;
  finish: () => void;
  captureImage: (image: string) => void;
  captureImageCut: (image: string) => void;
  compareCapture: () => void;
  resetCapture: () => void;
  setBoundingBox: (box: BoundingBox) => void;
  screenShoot: () => void;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  downloadVideo: () => void;
  exit: () => void;
  status: string;
  mediaBlobUrl: string | undefined;
  runningMode: RunningMode; // New Property
  setRunningMode: (mode: RunningMode) => void; // New Setter
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const skinToneThreeSceneRef = useRef<SkinToneThreeSceneRef | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    screen: !isMobile,
  });

  const [state, setState] = useState<CameraState>({
    facePosition: false,
    lighting: false,
    orientation: false,
    flipped: false,
    isFinished: false,
    isCaptured: false,
    capturedImage: null,
    capturedImageCut: null,
    isCompare: false,
    lastBoundingBox: null,
    runningMode: "LIVE_CAMERA", // Default Mode
  });

  function setCriterias(newState: Partial<CameraState>) {
    setState((prevState) => ({ ...prevState, ...newState }));
  }

  function flipCamera() {
    setState((prevState) => ({ ...prevState, flipped: !prevState.flipped }));
  }

  function finish() {
    setState((prevState) => ({ ...prevState, isFinished: true }));
  }

  function captureImage(image: string) {
    setState((prevState) => ({
      ...prevState,
      isCaptured: true,
      capturedImage: image,
    }));
  }

  function captureImageCut(image: string) {
    setState((prevState) => ({
      ...prevState,
      isCaptured: true,
      capturedImageCut: image,
    }));
  }

  function compareCapture() {
    setState((prevState) => ({
      ...prevState,
      isCompare: !state.isCompare,
    }));
  }

  function resetCapture() {
    setState((prevState) => ({
      ...prevState,
      isCaptured: false,
      capturedImage: null,
      lastBoundingBox: null,
    }));
  }

  function setBoundingBox(box: BoundingBox) {
    setState((prevState) => ({ ...prevState, lastBoundingBox: box }));
  }

  function screenShoot() {
    if (skinToneThreeSceneRef.current) {
      skinToneThreeSceneRef.current.callFunction();
    }
  }

  const downloadVideo = async () => {
    if (mediaBlobUrl) {
      const link = document.createElement("a");
      link.href = mediaBlobUrl;
      link.download = "recorded_video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("No video available for download");
    }
  };

  function exit() {
    // Reset to default mode on exit
    setRunningMode("LIVE_CAMERA");
    setState((prevState) => ({
      ...prevState,
      isFinished: false,
      isCaptured: false,
      capturedImage: null,
      capturedImageCut: null,
      lastBoundingBox: null,
    }));
  }

  function setRunningMode(mode: RunningMode) {
    setState((prevState) => ({ ...prevState, runningMode: mode }));
  }

  return (
    <CameraContext.Provider
      value={{
        skinToneThreeSceneRef,
        webcamRef,
        imageRef,
        videoRef,
        criterias: state,
        setCriterias,
        flipCamera,
        finish,
        captureImage,
        captureImageCut,
        compareCapture,
        resetCapture,
        setBoundingBox,
        screenShoot,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        downloadVideo,
        exit,
        status,
        mediaBlobUrl,
        runningMode: state.runningMode, // Provide runningMode
        setRunningMode, // Provide setRunningMode
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error("useCamera must be used within a CameraProvider");
  }
  return context;
};
