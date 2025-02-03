import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FaceLandmarker,
  FilesetResolver,
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
import { BeforeAfterCanvas } from "./before-after-canvas";

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

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const hairSegmenterRef = useRef<ImageSegmenter | null>(null);
  // const nailsSegmenterRef = useRef<ImageSegmenter | null>(null);

  const hairRef = useRef<Float32Array | null>(null);
  const hairMaskRef = useRef<ImageData | null>(null);

  const isDetectingRef = useRef<boolean>(false);

  // Using CameraContext
  const { criterias, flipCamera } = useCamera();
  const { envMapAccesories, setEnvMapAccesories } = useAccesories();
  const { envMapMakeup, setEnvMapMakeup } = useMakeup();

  const {
    showHair,
    setShowHair,
    setLipColors,
    setShowLipColor,
    setLipColorMode,
    setLipTexture,
  } = useMakeup();

  const { setShowGlasess, setShowWatch, setShowRing } = useAccesories();
  const showHairRef = useRef(showHair);

  useEffect(() => {
    // tf.enableDebugMode();
    showHairRef.current = showHair;
  }, [showHair]);

  useEffect(() => {
    setLipColors(["#ff0000"]);
    setShowLipColor(true);
    setLipColorMode("One");
    setLipTexture("Matte");
    setShowGlasess(true);
    setShowWatch(true);
    setShowRing(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initializeFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
        );
        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: mode === "IMAGE" ? "IMAGE" : "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          },
        );

        const handLandmarker = await HandLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU",
            },
            runningMode: mode === "IMAGE" ? "IMAGE" : "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          },
        );

        const hairSegmenter = await ImageSegmenter.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "/media/unveels/models/hair/hair_segmenter.tflite",
              delegate: "GPU",
            },
            runningMode: mode === "IMAGE" ? "IMAGE" : "VIDEO",
            outputCategoryMask: true,
            outputConfidenceMasks: false,
          },
        );

        if (isMounted) {
          faceLandmarkerRef.current = landmarker;
          handLandmarkerRef.current = handLandmarker;
          hairSegmenterRef.current = hairSegmenter;
          startDetection();
        }
      } catch (error) {
        console.error("Gagal menginisialisasi FaceLandmarker:", error);
        if (isMounted) setError(error as Error);
      }
    };

    initializeFaceLandmarker();

    // Cleanup pada unmount
    return () => {
      isMounted = false;
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
      if (hairSegmenterRef.current) {
        hairSegmenterRef.current.close();
      }

      isDetectingRef.current = false;
    };
  }, [mode]);

  const startDetection = useCallback(() => {
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;
    const detect = async () => {
      if (
        faceLandmarkerRef.current &&
        handLandmarkerRef.current &&
        hairSegmenterRef.current
      ) {
        const canvas = canvasRef.current;

        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const { innerWidth: width, innerHeight: height } = window;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            let sourceElement: HTMLVideoElement | HTMLImageElement | null =
              null;

            if (
              webcamRef.current &&
              webcamRef.current.video &&
              webcamRef.current.video.readyState === 4
            ) {
              sourceElement = webcamRef.current.video;
            } else if (
              videoUploadRef.current &&
              videoUploadRef.current.readyState === 4
            ) {
              sourceElement = videoUploadRef.current;
            } else if (imageUploadRef.current) {
              sourceElement = imageUploadRef.current;
            }

            if (sourceElement) {
              const imgAspect =
                sourceElement instanceof HTMLVideoElement
                  ? sourceElement.videoWidth / sourceElement.videoHeight
                  : sourceElement.naturalWidth / sourceElement.naturalHeight;
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

              const startTimeMs = performance.now();
              try {
                const hairResults =
                  sourceElement instanceof HTMLVideoElement
                    ? hairSegmenterRef.current.segmentForVideo(
                        sourceElement,
                        startTimeMs,
                      )
                    : hairSegmenterRef.current.segment(sourceElement);

                const faceResults =
                  sourceElement instanceof HTMLVideoElement
                    ? faceLandmarkerRef.current.detectForVideo(
                        sourceElement,
                        startTimeMs,
                      )
                    : faceLandmarkerRef.current.detect(sourceElement);
                ctx.drawImage(sourceElement, 0, 0, 480 / dpr, 480 / dpr);

                if (hairResults?.categoryMask) {
                  hairRef.current =
                    hairResults.categoryMask.getAsFloat32Array();
                  let imageData = ctx.getImageData(
                    0,
                    0,
                    sourceElement instanceof HTMLVideoElement
                      ? sourceElement.videoWidth
                      : sourceElement.naturalWidth,
                    sourceElement instanceof HTMLVideoElement
                      ? sourceElement.videoHeight
                      : sourceElement.naturalHeight,
                  ).data;

                  const legendColors = [[0, 255, 0, 0.1]]; // Ubah alpha menjadi 0.1 (10%)
                  let j = 0;
                  for (let i = 0; i < hairRef.current.length; ++i) {
                    const maskVal = Math.round(hairRef.current[i] * 255.0);

                    // Proses hanya untuk label index 1
                    if (maskVal === 1) {
                      const legendColor =
                        legendColors[maskVal % legendColors.length];
                      // Blend warna dengan alpha yang sangat rendah
                      imageData[j] = legendColor[0] * 0.1 + imageData[j] * 0.9; // Red
                      imageData[j + 1] =
                        legendColor[1] * 0.1 + imageData[j + 1] * 0.9; // Green
                      imageData[j + 2] =
                        legendColor[2] * 0.1 + imageData[j + 2] * 0.9; // Blue
                      imageData[j + 3] = 255; // Keep full opacity for the final result
                    }
                    j += 4;
                  }

                  hairMaskRef.current = new ImageData(
                    new Uint8ClampedArray(imageData.buffer),
                    sourceElement instanceof HTMLVideoElement
                      ? sourceElement.videoWidth
                      : sourceElement.naturalWidth,
                    sourceElement instanceof HTMLVideoElement
                      ? sourceElement.videoHeight
                      : sourceElement.naturalHeight,
                  );

                  hairResults.close();
                }

                // const handResults =
                //   sourceElement instanceof HTMLVideoElement
                //     ? handLandmarkerRef.current.detectForVideo(
                //         sourceElement,
                //         startTimeMs,
                //       )
                //     : handLandmarkerRef.current.detect(sourceElement);

                if (faceResults.facialTransformationMatrixes.length > 0) {
                  faceTransformRef.current =
                    faceResults.facialTransformationMatrixes[0].data;
                }

                if (faceResults.faceBlendshapes.length > 0) {
                  blendshapeRef.current =
                    faceResults.faceBlendshapes[0].categories;
                }

                if (
                  faceResults.faceLandmarks &&
                  faceResults.faceLandmarks.length > 0
                ) {
                  landmarksRef.current = faceResults.faceLandmarks[0];
                }

                // if (handResults.landmarks && handResults.landmarks.length > 0) {
                //   handLandmarksRef.current = handResults.landmarks[0];
                // }
              } catch (err) {
                console.error("Detection error:", err);
                setError(err as Error);
              }
            }
          }
        }
      }

      if (isDetectingRef.current) {
        requestAnimationFrame(detect);
      }
    };

    detect();
    setShowHair(true);
  }, []);

  const isDesktop =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) == false;
  const [videoDimensions, setVideoDimensions] = useState({
    width: 480,
    height: 480,
  });

  const updateVideoDimensions = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const aspectRatio = screenWidth / screenHeight;

    let width = Math.min(screenWidth, 480);
    let height = width / aspectRatio;

    if (height > 480) {
      height = 480;
      width = height * aspectRatio;
    }

    setVideoDimensions({
      width: Math.round(width),
      height: Math.round(height),
    });
  };

  useEffect(() => {
    updateVideoDimensions();

    window.addEventListener("resize", updateVideoDimensions);
    return () => window.removeEventListener("resize", updateVideoDimensions);
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${mode === "LIVE" ? "" : "scale-x-[-1] transform"}`}
    >
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
            width: 480,
            height: 480,
            facingMode: criterias.flipped ? "environment" : "user",
            frameRate: { ideal: 30 },
          }}
          onUserMediaError={(err) =>
            setError(
              err instanceof Error ? err : new Error("Webcam error occurred."),
            )
          }
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
          hairMask={hairMaskRef}
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
