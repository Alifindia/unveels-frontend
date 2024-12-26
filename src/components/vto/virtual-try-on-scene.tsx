import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  ImageSegmenter,
  MPMask,
} from "@mediapipe/tasks-vision";
import { useCamera } from "../../context/recorder-context";
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  HDR_ACCESORIES,
  HDR_MAKEUP,
} from "../../utils/constants";
import { ErrorOverlay } from "../error-overlay";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import VirtualTryOnThreeScene from "./virtual-try-on-three-scene";
import { Landmark } from "../../types/landmark";
import { useAccesories } from "../../context/accesories-context";
import HDREnvironment from "../three/hdr-environment";
import { Blendshape } from "../../types/blendshape";
import { useMakeup } from "../../context/makeup-context";

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import "@mediapipe/hands";
import * as tf from "@tensorflow/tfjs";

export function VirtualTryOnScene() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<Error | null>(null);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const hairSegmenterRef = useRef<ImageSegmenter | null>(null);

  const faceTransformRef = useRef<number[] | null>(null);
  const landmarksRef = useRef<Landmark[]>([]);
  const handLandmarksRef = useRef<Landmark[]>([]);
  const blendshapeRef = useRef<Blendshape[]>([]);
  const hairRef = useRef<Float32Array | null>(null);
  const hairMaskRef = useRef<ImageData | null>(null);

  const isDetectingRef = useRef<boolean>(false);

  // Using CameraContext
  const { criterias, flipCamera } = useCamera();
  const { envMapAccesories, setEnvMapAccesories } = useAccesories();
  const { envMapMakeup, setEnvMapMakeup } = useMakeup();

  const legendColors = [[128, 62, 117, 255]];

  useEffect(() => {
    // tf.enableDebugMode();
  }, []);

  const normalizeLandmarks = (
    landmarks: { x: number; y: number; z: number }[],
    videoWidth: number,
    videoHeight: number,
    canvasWidth: number,
    canvasHeight: number,
  ) => {
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    const scale =
      videoAspect > canvasAspect
        ? canvasWidth / videoWidth
        : canvasHeight / videoHeight;

    const xOffset =
      videoAspect > canvasAspect ? 0 : (canvasWidth - videoWidth * scale) / 2;
    const yOffset =
      videoAspect > canvasAspect ? (canvasHeight - videoHeight * scale) / 2 : 0;

    const scaleFactor = 0.5;
    const xShift = 0.5;
    const yShift = 0.5;

    return landmarks.map(({ x, y, z }) => {
      const normalizedX = x * scale + xOffset;
      const normalizedY = y * scale + yOffset;

      const threeX =
        ((normalizedX / canvasWidth) * 2 - 1) * scaleFactor + xShift;
      const threeY =
        ((normalizedY / canvasHeight) * 2 - 1) * scaleFactor + yShift;
      const threeZ = z !== undefined ? -z * 0.1 : 0;

      return { x: threeX, y: threeY, z: threeZ };
    });
  };

  const normalizedLandmark = async (
    faces: [{ x: number; y: number; z: number; name?: string | null }],
    hands: [{ x: number; y: number; z: number; name?: string | null }],
  ) => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { innerWidth: width, innerHeight: height } = window;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          const imgAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = width / height;

          let drawWidth: number;
          let drawHeight: number;
          let offsetX: number;
          let offsetY: number;

          if (imgAspect < canvasAspect) {
            drawWidth = width;
            drawHeight = width / imgAspect;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
          } else {
            drawWidth = height * imgAspect;
            drawHeight = height;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
          }

          ctx.clearRect(0, 0, width, height);

          try {
            const normalizedFaceLandmarks = normalizeLandmarks(
              faces,
              video.videoWidth,
              video.videoHeight,
              drawWidth,
              drawHeight,
            );

            const normalizedHandLandmarks = normalizeLandmarks(
              hands,
              video.videoWidth,
              video.videoHeight,
              drawWidth,
              drawHeight,
            );

            landmarksRef.current = normalizedFaceLandmarks;
            handLandmarksRef.current = normalizedHandLandmarks;

            console.log('Face landmarks:', landmarksRef);
            console.log('Hand landmarks:', handLandmarksRef);
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        }
      }
    }
  };

  const runDetector = async (video: HTMLVideoElement) => {
    // Initialize face detector
    const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const faceDetector = await faceLandmarksDetection.createDetector(faceModel, {
      runtime: "mediapipe",
      refineLandmarks: true,
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    });

    // Initialize hand detector
    const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
    const handDetector = await handPoseDetection.createDetector(handModel, {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
      modelType: 'full'
    });

    const detect = async (
      faceNet: faceLandmarksDetection.FaceLandmarksDetector,
      handNet: handPoseDetection.HandDetector,
    ) => {
      const inputTensor = tf.browser.fromPixels(video);

      // Run both detections
      const faces = await faceNet.estimateFaces(inputTensor, {
        flipHorizontal: false,
      });
      const hands = await handNet.estimateHands(video, {
        flipHorizontal: false
      });

      if ((faces.length > 0 && faces[0].keypoints.length > 0) || hands.length > 0) {
        requestAnimationFrame(() =>
          normalizedLandmark(
            faces[0]?.keypoints || [],
            hands[0]?.keypoints || []
          )
        );
      }

      detect(faceDetector, handDetector);
      inputTensor.dispose();
    };

    detect(faceDetector, handDetector);
  };

  const handleVideoLoad = () => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      if (video) {
        if (video.readyState === 4) {
          console.log("Video ready, starting detection.");
          runDetector(video);
        } else {
          console.log("Video not ready yet.");
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* 3D Canvas */}
      <Canvas
        className="absolute left-0 top-0 h-full w-full"
        style={{ zIndex: 50 }}
        orthographic
        camera={{ zoom: 1, position: [0, 0, 0], near: -1000, far: 1000 }}
        gl={{
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1,
          antialias: true,
          outputColorSpace: SRGBColorSpace,
        }}
      >
        <HDREnvironment
          hdrPath={HDR_ACCESORIES}
          onLoaded={setEnvMapAccesories}
        />

        <HDREnvironment hdrPath={HDR_MAKEUP} onLoaded={setEnvMapMakeup} />

        <VirtualTryOnThreeScene
          videoRef={webcamRef}
          landmarks={landmarksRef}
          handlandmarks={handLandmarksRef}
          faceTransform={faceTransformRef}
          blendshape={blendshapeRef}
          //hairMask={hairMaskRef}
        />
      </Canvas>

      <Webcam
        className="hidden"
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        mirrored={false}
        videoConstraints={{
          width: 320,
          height: 240,
          facingMode: criterias.flipped ? "environment" : "user",
          frameRate: { exact: 25, ideal: 25, max: 25 },
        }}
        onUserMediaError={(err) =>
          setError(
            err instanceof Error ? err : new Error("Webcam error occurred."),
          )
        }
        onLoadedData={handleVideoLoad}
      />

      {/* Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute left-0 top-0 hidden h-full w-full`}
        style={{ zIndex: 40 }}
      />

      {/* Error Display */}
      {error && <ErrorOverlay message={error.message} />}
    </div>
  );
}