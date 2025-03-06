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
import { hexToRgb } from "../../utils/colorUtils";
import { ModelLoadingScreen } from "../model-loading-screen";

export enum VtoDefaultDetection {
  FACE_LANDMARKER,
  HAND_LANDMARKER,
  HAIR_SEGMENTER,
  NAIL_SEGMENTER,
}

export function VirtualTryOnScene({
  mediaFile,
  mode = "LIVE",
  modelImageSrc,
  defaultDetection,
}: {
  mediaFile: File | null;
  mode: "IMAGE" | "VIDEO" | "LIVE";
  modelImageSrc?: string | null;
  defaultDetection?: VtoDefaultDetection;
}) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const nailBackgroundRef = useRef<HTMLImageElement>(null);

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
  const nailsSegmenterRef = useRef<ImageSegmenter | null>(null);

  const hairRef = useRef<Float32Array | null>(null);
  const hairMaskRef = useRef<ImageData | null>(null);

  const isDetectingRef = useRef<boolean>(false);

  // Using CameraContext
  const { criterias, flipCamera } = useCamera();
  const { envMapAccesories, setEnvMapAccesories } = useAccesories();
  const { envMapMakeup, setEnvMapMakeup } = useMakeup();

  const {
    showHair,
    hairColor,
    showFoundation,
    foundationColor,
    showMakeup,
    showNails,
    nailsColor
  } = useMakeup();
  const { showHand, showFace } = useAccesories();

  const showHairRef = useRef(showHair);
  const showFoundationRef = useRef(showFoundation);
  const foundationColorRef = useRef(foundationColor);
  const hairColorRef = useRef(hairColor);
  const nailColorRef = useRef(nailsColor);
  const showFaceRef = useRef(showMakeup || showFace);
  const showHandRef = useRef(showHand || showHand);
  const showHairSegmenterRef = useRef(showHair || showFoundation);
  const showNailsRef = useRef(showNails);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const initializeFaceLandmarker = async () => {
    if (faceLandmarkerRef.current) return;
    setLoadingModel(true);
    setLoadingMessage("Loading for face detector...");
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
    );
    const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: mode === "IMAGE" ? "IMAGE" : "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.9,
      minTrackingConfidence: 0.9,
      minFacePresenceConfidence: 0.9,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });
    faceLandmarkerRef.current = landmarker;
    setLoadingModel(false);
  };

  const initializeHandLandmarker = async () => {
    if (handLandmarkerRef.current) return;
    setLoadingModel(true);
    setLoadingMessage("Loading for hand detector...");
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
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
        minHandDetectionConfidence: 0.9,
        minTrackingConfidence: 0.9,
      },
    );
    handLandmarkerRef.current = handLandmarker;
    setLoadingModel(false);
  };

  const initializeImageSegmenter = async () => {
    if (hairSegmenterRef.current) return;
    setLoadingModel(true);
    setLoadingMessage("Loading for selfie detector...");
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
    );

    const hairSegmenter = await ImageSegmenter.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: "/media/unveels/models/hair/selfie_multiclass.tflite",
          delegate: "GPU",
        },
        runningMode: mode === "IMAGE" ? "IMAGE" : "VIDEO",
        outputCategoryMask: true,
      },
    );

    hairSegmenterRef.current = hairSegmenter;
    setLoadingModel(false);
  };

  const initializeNailSegmenter = async () => {
    if (nailsSegmenterRef.current) return;
    setLoadingModel(true);
    setLoadingMessage("Loading for nail detector...");
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
    );

    nailsSegmenterRef.current = await ImageSegmenter.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: "/media/unveels/models/nails/nails.tflite",
          delegate: "GPU",
        },
        runningMode: mode === "IMAGE" ? "IMAGE" : "VIDEO",
        outputConfidenceMasks: true,
      },
    );

    setLoadingModel(false);
  };

  useEffect(() => {
    // tf.enableDebugMode();
    showHairRef.current = showHair;
    showFoundationRef.current = showFoundation;
    foundationColorRef.current = foundationColor;
    hairColorRef.current = hairColor;
    nailColorRef.current = nailsColor;

    showFaceRef.current = showMakeup || showFace;
    showHandRef.current = showHand || showNails;
    showHairSegmenterRef.current = showHair || showFoundation;
    showNailsRef.current = showNails;
    if (showFaceRef.current) {
      initializeFaceLandmarker();
    }
    if (showHandRef.current) {
      initializeHandLandmarker();
    }
    if (showHairSegmenterRef.current) {
      initializeImageSegmenter();
    }
    if (showNails) {
      initializeNailSegmenter();
    }
  }, [
    showHair,
    showFoundation,
    foundationColor,
    hairColor,
    showMakeup,
    showHand,
    showFace,
    showNails,
  ]);

  useEffect(() => {
    let isMounted = true;
    const startLandmarker = async () => {
      try {
        if (isMounted) {
          if (defaultDetection === VtoDefaultDetection.FACE_LANDMARKER) {
            initializeFaceLandmarker();
          } else if (defaultDetection === VtoDefaultDetection.HAND_LANDMARKER) {
            initializeHandLandmarker();
          }
          startDetection();
        }
      } catch (error) {
        console.error("ERRORRR:", error);
        if (isMounted) setError(error as Error);
      }
    };

    startLandmarker();

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
      const canvas = canvasRef.current;
      const bgCanvas = backgroundCanvasRef.current;
      if (canvas && bgCanvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const bgCtx = bgCanvas?.getContext("2d", {
          willReadFrequently: true,
        });
        if (ctx && bgCtx) {
          let sourceElement: HTMLVideoElement | HTMLImageElement | null = null;

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
            const sourceWidth =
              sourceElement instanceof HTMLVideoElement
                ? sourceElement.videoWidth
                : sourceElement.naturalWidth;

            const sourceHeight =
              sourceElement instanceof HTMLVideoElement
                ? sourceElement.videoHeight
                : sourceElement.naturalHeight;

            canvas.width = sourceWidth;
            canvas.height = sourceHeight;
            bgCanvas.width = sourceWidth;
            bgCanvas.height = sourceHeight;

            const startTimeMs = performance.now();
            try {
              if (showHairSegmenterRef.current) {
                if (hairSegmenterRef.current != null) {
                  ctx.drawImage(sourceElement, 0, 0, sourceWidth, sourceHeight);

                  const hairResults =
                    sourceElement instanceof HTMLVideoElement
                      ? hairSegmenterRef.current.segmentForVideo(
                          sourceElement,
                          startTimeMs,
                        )
                      : hairSegmenterRef.current.segment(sourceElement);

                  if (hairResults?.categoryMask) {
                    hairRef.current =
                      hairResults.categoryMask.getAsFloat32Array();
                    let imageData = ctx.getImageData(
                      0,
                      0,
                      sourceWidth,
                      sourceHeight,
                    ).data;

                    const hairColor = hexToRgb(hairColorRef.current);
                    const hairLegend = [
                      [hairColor.r, hairColor.g, hairColor.b, 0.15],
                    ];
                    const foundationColor = hexToRgb(
                      foundationColorRef.current,
                    );
                    const skinColorLegend = [
                      [
                        foundationColor.r,
                        foundationColor.g,
                        foundationColor.b,
                        0.08,
                      ],
                    ];

                    let j = 0;
                    for (let i = 0; i < hairRef.current.length; ++i) {
                      const maskVal = Math.round(hairRef.current[i] * 255.0);
                      if (maskVal === 1) {
                        if (showHairRef.current) {
                          const legendColor =
                            hairLegend[maskVal % hairLegend.length];
                          imageData[j] =
                            legendColor[0] * 0.15 + imageData[j] * 0.9;
                          imageData[j + 1] =
                            legendColor[1] * 0.15 + imageData[j + 1] * 0.9;
                          imageData[j + 2] =
                            legendColor[2] * 0.15 + imageData[j + 2] * 0.9;
                          imageData[j + 3] = 255;
                        }
                      } else if (maskVal === 3) {
                        if (showFoundationRef.current) {
                          const skinColor =
                            skinColorLegend[maskVal % hairLegend.length];
                          imageData[j] =
                            skinColor[0] * 0.08 + imageData[j] * 0.9;
                          imageData[j + 1] =
                            skinColor[1] * 0.08 + imageData[j + 1] * 0.9;
                          imageData[j + 2] =
                            skinColor[2] * 0.08 + imageData[j + 2] * 0.9;
                          imageData[j + 3] = 255;
                        }
                      } else {
                        // imageData[j] = 0;
                        // imageData[j + 1] = 0;
                        // imageData[j + 2] = 0;
                        // imageData[j + 3] = 0;
                      }
                      j += 4;
                    }

                    hairMaskRef.current = new ImageData(
                      new Uint8ClampedArray(imageData.buffer),
                      sourceWidth,
                      sourceHeight,
                    );
                    ctx?.putImageData(hairMaskRef.current, 0, 0);
                    hairResults.close();
                  }
                }
              }

              if (showNailsRef.current) {
                if (nailsSegmenterRef.current != null) {
                  ctx.drawImage(sourceElement, 0, 0, sourceWidth, sourceHeight);
                  if (nailBackgroundRef.current) {
                    bgCtx.drawImage(
                      nailBackgroundRef.current,
                      0,
                      0,
                      sourceWidth,
                      sourceHeight,
                    );
                  } else {
                    console.log("nailBackgroundRef.current is null");
                  }

                  const nailResults =
                    sourceElement instanceof HTMLVideoElement
                      ? nailsSegmenterRef.current.segmentForVideo(
                          sourceElement,
                          startTimeMs,
                        )
                      : nailsSegmenterRef.current.segment(sourceElement);

                  if (nailResults?.confidenceMasks) {
                    const overlayColor = hexToRgb(nailColorRef.current);
                    const confidenceMask =
                      nailResults.confidenceMasks[0].getAsFloat32Array();
                    const textureData = bgCtx.getImageData(
                      0,
                      0,
                      canvas.width,
                      canvas.height,
                    );
                    const imageData = ctx.getImageData(
                      0,
                      0,
                      canvas.width,
                      canvas.height,
                    );
                    for (let i = 0; i < confidenceMask.length; i++) {
                      const alpha =
                        confidenceMask[i] > 0.5
                          ? 1
                          : confidenceMask[i] > 0.2
                            ? confidenceMask[i]
                            : 0;

                      const pixelIndex = i * 4;

                      // Blend texture with color
                      const textureR = textureData.data[pixelIndex];
                      const textureG = textureData.data[pixelIndex + 1];
                      const textureB = textureData.data[pixelIndex + 2];

                      // Apply color tint to texture
                      const coloredTextureR = (textureR * overlayColor.r) / 255;
                      const coloredTextureG = (textureG * overlayColor.g) / 255;
                      const coloredTextureB = (textureB * overlayColor.b) / 255;

                      // Blend with video
                      imageData.data[pixelIndex] =
                        imageData.data[pixelIndex] * (1 - alpha) +
                        coloredTextureR * alpha;
                      imageData.data[pixelIndex + 1] =
                        imageData.data[pixelIndex + 1] * (1 - alpha) +
                        coloredTextureG * alpha;
                      imageData.data[pixelIndex + 2] =
                        imageData.data[pixelIndex + 2] * (1 - alpha) +
                        coloredTextureB * alpha;
                    }
                    ctx.putImageData(imageData, 0, 0);
                  }
                } else {
                  console.log("NailsSegmenter is not loaded yet.");
                }
              } else {
                console.log("NOT SHOW NAIL");
              }

              if (showFaceRef.current) {
                if (faceLandmarkerRef.current != null) {
                  const faceResults =
                    sourceElement instanceof HTMLVideoElement
                      ? faceLandmarkerRef.current.detectForVideo(
                          sourceElement,
                          startTimeMs,
                        )
                      : faceLandmarkerRef.current.detect(sourceElement);
                  if (faceResults.facialTransformationMatrixes.length > 0) {
                    faceTransformRef.current =
                      faceResults.facialTransformationMatrixes[0].data;
                  }

                  if (faceResults.faceBlendshapes.length > 0) {
                    blendshapeRef.current =
                      faceResults.faceBlendshapes[0].categories;
                  }

                  landmarksRef.current = faceResults.faceLandmarks[0];
                }
              }

              if (showHandRef.current) {
                if (handLandmarkerRef.current != null) {
                  const handResults =
                    sourceElement instanceof HTMLVideoElement
                      ? handLandmarkerRef.current.detectForVideo(
                          sourceElement,
                          startTimeMs,
                        )
                      : handLandmarkerRef.current.detect(sourceElement);

                  handLandmarksRef.current = handResults.landmarks[0];
                }
              }
            } catch (err) {
              // console.error("Detection error:", err);
              // setError(err as Error);
            }
          }
        }
      }

      if (isDetectingRef.current) {
        requestAnimationFrame(detect);
      }
    };

    detect();
  }, []);

  return (
    <div className={`justify-center"} fixed inset-0 flex items-center`}>
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
            className="pointer-events-none absolute left-0 top-0 h-full w-screen scale-x-[-1] transform"
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
            className="pointer-events-none absolute left-0 top-0 h-full w-screen scale-x-[-1] transform"
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

      <img
        className="hidden w-full h-full"
        ref={nailBackgroundRef}
        src="media/unveels/vto-assets/nails/k.jpg"
      />

      {mode == "IMAGE" && (mediaFile || modelImageSrc) && (
        <img
          className="hidden"
          ref={imageUploadRef}
          src={
            mediaFile
              ? URL.createObjectURL(mediaFile)
              : modelImageSrc
                ? modelImageSrc
                : ""
          }
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
          playsInline
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
            // width: isDesktop ? VIDEO_WIDTH : videoDimensions.height,
            // height: isDesktop ? VIDEO_HEIGHT : videoDimensions.width,
            // width: VIDEO_WIDTH,
            // height: VIDEO_HEIGHT,
            facingMode: criterias.flipped ? "environment" : "user",
            frameRate: { ideal: 60 },
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
        className={`absolute left-0 top-0 h-full w-full ${mode == "LIVE" && !criterias.flipped ? "" : "scale-x-[-1] transform"}`}
        style={{ zIndex: 50 }}
        orthographic
        camera={{ zoom: 1, position: [0, 0, 0], near: -1000, far: 1000 }}
        gl={{
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1,
          antialias: false,
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
        className={`pointer-events-none absolute`}
        style={{
          zIndex: 40,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          transform: mode == "LIVE" && !criterias.flipped ? "scaleX(-1)" : "",
        }}
      />
      <canvas ref={backgroundCanvasRef} className={`pointer-events-none absolute`} />
      {loadingModel && (
        <ModelLoadingScreen progress={0} loadingMessage={loadingMessage} />
      )}
      {/* Error Display */}
      {error && <ErrorOverlay message={error.message} />}
    </div>
  );
}
