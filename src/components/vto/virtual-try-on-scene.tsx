import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FaceLandmarker,
  HandLandmarker,
  ImageSegmenter,
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
import { Rnd } from "react-rnd";
// new
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import "@mediapipe/hands";
import * as tf from "@tensorflow/tfjs";

interface BeforeAfterCanvasProps {
  image: HTMLImageElement | HTMLVideoElement;
  mode: "IMAGE" | "VIDEO" | "LIVE";
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

function BeforeAfterCanvas({ image, canvasRef, mode }: BeforeAfterCanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Gagal mendapatkan konteks 2D untuk overlay canvas.");
      return;
    }

    let animationFrameId: number;

    const setupCanvasSize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      const { innerWidth: width, innerHeight: height } = window;

      let imgAspect = 0;
      if (mode === "IMAGE" && image instanceof HTMLImageElement) {
        imgAspect = image.naturalWidth / image.naturalHeight;
      } else if (
        (mode === "VIDEO" || mode == "LIVE") &&
        image instanceof HTMLVideoElement
      ) {
        imgAspect = image.videoWidth / image.videoHeight;
      }

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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        -offsetX - drawWidth,
        offsetY,
        drawWidth,
        drawHeight,
      );
      ctx.restore();

      if (
        (mode === "VIDEO" || mode === "LIVE") &&
        image instanceof HTMLVideoElement
      ) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const startRendering = () => {
      setupCanvasSize();
      draw();

      if (mode === "IMAGE") {
        window.addEventListener("resize", () => {
          setupCanvasSize();
          draw();
        });
      }
    };

    startRendering();

    return () => {
      if (mode === "VIDEO" || mode === "LIVE") {
        cancelAnimationFrame(animationFrameId);
      }
      if (mode === "IMAGE") {
        window.removeEventListener("resize", setupCanvasSize);
      }
    };
  }, [image, canvasRef, mode]);

  return null;
}

export function VirtualTryOnScene({
  mediaFile,
  mode = "LIVE",
}: {
  mediaFile: File | null;
  mode: "IMAGE" | "VIDEO" | "LIVE";
}) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeAfterCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageUploadRef = useRef<HTMLImageElement>(null);
  const videoUploadRef = useRef<HTMLVideoElement>(null);

  const [error, setError] = useState<Error | null>(null);

  const faceTransformRef = useRef<number[] | null>(null);
  const landmarksRef = useRef<Landmark[]>([]);
  const handLandmarksRef = useRef<Landmark[]>([]);
  const blendshapeRef = useRef<Blendshape[]>([]);

  // Using CameraContext
  const { criterias, flipCamera } = useCamera();
  const { envMapAccesories, setEnvMapAccesories } = useAccesories();
  const { envMapMakeup, setEnvMapMakeup } = useMakeup();

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

  const processLiveStream = async (
    faces: [{ x: number; y: number; z: number; name?: string | [] }],
    hands: handPoseDetection.Hand[],
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

            if (hands.length > 0) {
              const normalizedHandLandmarks = normalizeLandmarks(
                hands[0].keypoints,
                video.videoWidth,
                video.videoHeight,
                drawWidth,
                drawHeight,
              );

              for (let i = 0; i < normalizedHandLandmarks.length; i++) {
                normalizedHandLandmarks[i].z = hands[0].keypoints3D[i].z || 0;
              }
              handLandmarksRef.current = normalizedHandLandmarks;
            } else {
              handLandmarksRef.current = [];
            }

            landmarksRef.current = normalizedFaceLandmarks;
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        }
      }
    }
  };

  // Image Detection Function
  const processImage = async (
    faces: [{ x: number; y: number; z: number; name?: string | null }],
    hands: handPoseDetection.Hand[],
  ) => {
    if (imageUploadRef.current) {
      const img = imageUploadRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { innerWidth: width, innerHeight: height } = window;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          const imgAspect = img.width / img.height;
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

          try {
            const normalizedFaceLandmarks = normalizeLandmarks(
              faces,
              img.width,
              img.height,
              drawWidth,
              drawHeight,
            );

            const normalizedHandLandmarks = normalizeLandmarks(
              hands[0].keypoints,
              video.videoWidth,
              video.videoHeight,
              drawWidth,
              drawHeight,
            );
            for (let i = 0; i < normalizedHandLandmarks.length; i++) {
              normalizedHandLandmarks[i].z = hands[0].keypoints3D[i].z || 0;
            }
            landmarksRef.current = normalizedFaceLandmarks;
            handLandmarksRef.current = normalizedHandLandmarks;
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        } else {
          console.error("Canvas element is not properly initialized");
        }
      }
    }
  };

  // Video Detection Function
  const processVideo = async (
    faces: [{ x: number; y: number; z: number; name?: string | [] }],
    hands: [{ x: number; y: number; z: number; name?: string | [] }],
  ) => {
    if (videoUploadRef.current && videoUploadRef.current.readyState === 4) {
      const video = videoUploadRef.current;
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
              hands[0].keypoints,
              video.videoWidth,
              video.videoHeight,
              drawWidth,
              drawHeight,
            );
            for (let i = 0; i < normalizedHandLandmarks.length; i++) {
              normalizedHandLandmarks[i].z = hands[0].keypoints3D[i].z || 0;
            }
            landmarksRef.current = normalizedFaceLandmarks;
            handLandmarksRef.current = normalizedHandLandmarks;
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        }
      }
    }
  };

  const runDetector = async (
    media: HTMLVideoElement | HTMLImageElement,
    mode: "LIVE" | "VIDEO" | "IMAGE",
  ) => {
    // Initialize face detector
    const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const faceDetector = await faceLandmarksDetection.createDetector(
      faceModel,
      {
        runtime: "mediapipe",
        refineLandmarks: true,
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
      },
    );

    // Initialize hand detector
    const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
    const handDetector = await handPoseDetection.createDetector(handModel, {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
      modelType: "full",
      maxHands: 1,
    });

    const detect = async (
      faceNet: faceLandmarksDetection.FaceLandmarksDetector,
      handNet: handPoseDetection.HandDetector,
    ) => {
      const inputTensor = tf.browser.fromPixels(media);

      try {
        // Run both detections
        const faces = await faceNet.estimateFaces(inputTensor, {
          flipHorizontal: false,
        });

        const hands = await handNet.estimateHands(media, {
          flipHorizontal: false,
        });

        // Process if faces or hands are detected
        if (
          (faces.length > 0 && faces[0].keypoints.length > 0) ||
          hands.length > 0
        ) {
          if (mode === "LIVE") {
            processLiveStream(faces[0]?.keypoints || [], hands || []);
          }
          if (mode === "IMAGE") {
            processImage(faces[0]?.keypoints || [], hands || []);
          }
          if (mode === "VIDEO") {
            processVideo(faces[0]?.keypoints || [], hands || []);
          }
        }

        // Always call detect recursively to continue the video feed processing
        requestAnimationFrame(() => detect(faceDetector, handDetector));
      } catch (err) {
        console.error("Error during detection", err);
      } finally {
        inputTensor.dispose(); // Clean up memory for input tensor
      }
    };

    detect(faceDetector, handDetector); // Start the initial detection loop
  };

  const handleLiveStreamLoad = () => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      if (video) {
        if (video.readyState === 4) {
          console.log("Video ready, starting detection.");
          runDetector(video, "LIVE");
        } else {
          console.log("Video not ready yet.");
        }
      }
    }
  };

  const handleImageUpload = () => {
    if (imageUploadRef.current) {
      console.log("image uploaded");
      runDetector(imageUploadRef.current, "IMAGE");
    }
  };

  const handleVideoUpload = () => {
    if (videoUploadRef.current) {
      const video = videoUploadRef.current;
      if (video) {
        if (video.readyState === 4) {
          console.log("Video ready, starting detection.");
          runDetector(video, "VIDEO");
        } else {
          console.log("Video not ready yet.");
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4 &&
        mode == "LIVE" && (
          <Rnd
            style={{
              display: criterias.isCompare ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0f0f0",
              zIndex: 9999,
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: "50%",
              overflow: "hidden",
              borderRight: "2px solid black",
            }}
            default={{
              x: 0,
              y: 0,
              width: "50%",
              height: "100%",
            }}
            enableResizing={{
              top: false,
              right: true,
              bottom: false,
              left: false,
            }}
            disableDragging={true}
          >
            <canvas
              ref={beforeAfterCanvasRef}
              className="pointer-events-none absolute left-0 top-0 h-full w-screen"
              style={{ zIndex: 50 }}
            >
              <BeforeAfterCanvas
                mode={mode}
                image={webcamRef.current.video}
                canvasRef={beforeAfterCanvasRef}
              />
            </canvas>
          </Rnd>
        )}

      {videoUploadRef.current && mode == "VIDEO" && (
        <Rnd
          style={{
            display: criterias.isCompare ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0f0f0",
            zIndex: 9999,
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "50%",
            overflow: "hidden",
            borderRight: "2px solid black",
          }}
          default={{
            x: 0,
            y: 0,
            width: "50%",
            height: "100%",
          }}
          enableResizing={{
            top: false,
            right: true,
            bottom: false,
            left: false,
          }}
          disableDragging={true}
        >
          <canvas
            ref={beforeAfterCanvasRef}
            className="pointer-events-none absolute left-0 top-0 h-full w-screen"
            style={{ zIndex: 50 }}
          >
            <BeforeAfterCanvas
              mode={mode}
              image={videoUploadRef.current}
              canvasRef={beforeAfterCanvasRef}
            />
          </canvas>
        </Rnd>
      )}

      {imageUploadRef.current && mode == "IMAGE" && (
        <Rnd
          style={{
            display: criterias.isCompare ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0f0f0",
            zIndex: 9999,
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "50%",
            overflow: "hidden",
            borderRight: "2px solid black",
          }}
          default={{
            x: 0,
            y: 0,
            width: "50%",
            height: "100%",
          }}
          enableResizing={{
            top: false,
            right: true,
            bottom: false,
            left: false,
          }}
          disableDragging={true}
        >
          <canvas
            ref={beforeAfterCanvasRef}
            className="pointer-events-none absolute left-0 top-0 h-full w-screen"
            style={{ zIndex: 50 }}
          >
            <BeforeAfterCanvas
              mode={mode}
              image={imageUploadRef.current}
              canvasRef={beforeAfterCanvasRef}
            />
          </canvas>
        </Rnd>
      )}

      {mode == "IMAGE" && mediaFile && (
        <img
          className="hidden"
          ref={imageUploadRef}
          src={URL.createObjectURL(mediaFile)}
          onLoad={handleImageUpload}
        />
      )}

      {mode == "VIDEO" && mediaFile && (
        <video
          className="hidden"
          ref={videoUploadRef}
          src={URL.createObjectURL(mediaFile)}
          controls
          autoPlay
          loop
          onLoadedData={handleVideoUpload}
        />
      )}

      {mode == "LIVE" && (
        <Webcam
          className="hidden"
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          mirrored={false}
          videoConstraints={{
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            facingMode: criterias.flipped ? "environment" : "user",
            frameRate: { ideal: 30 },
          }}
          onUserMediaError={(err) =>
            setError(
              err instanceof Error ? err : new Error("Webcam error occurred."),
            )
          }
          onLoadedData={handleLiveStreamLoad}
        />
      )}

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
          videoRef={
            mode === "IMAGE"
              ? imageUploadRef
              : mode === "VIDEO"
                ? videoUploadRef
                : webcamRef
          }
          landmarks={landmarksRef}
          handlandmarks={handLandmarksRef}
          faceTransform={faceTransformRef}
          blendshape={blendshapeRef}
          sourceType={mode}
        />
      </Canvas>

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
