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
import { Rnd } from "react-rnd";

interface BeforeAfterCanvasProps {
  image: HTMLImageElement | HTMLVideoElement;
  mode: "IMAGE" | "VIDEO" | "LIVE";
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

function BeforeAfterCanvas({ image, canvasRef, mode }: BeforeAfterCanvasProps) {
  useEffect(() => {
    console.log("Canvas mode:", mode, "Image element:", image);

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
    let isMounted = true;
    const initializeFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm",
        );
        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "CPU",
            },
            runningMode: mode == "LIVE" || mode == "VIDEO" ? "VIDEO" : "IMAGE",
            numFaces: 1,
            minFaceDetectionConfidence: 0.2,
            minTrackingConfidence: 0.1,
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
            runningMode: mode == "LIVE" || mode == "VIDEO" ? "VIDEO" : "IMAGE",
            numHands: 1,
            minHandDetectionConfidence: 0.2,
            minTrackingConfidence: 0.1,
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
            runningMode: mode == "LIVE" || mode == "VIDEO" ? "VIDEO" : "IMAGE",
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
  }, []);

  const detectLiveStream = async () => {
    if (
      faceLandmarkerRef.current &&
      handLandmarkerRef.current &&
      hairSegmenterRef.current &&
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

          const startTimeMs = performance.now();
          try {
            const results = faceLandmarkerRef.current.detectForVideo(
              video,
              startTimeMs,
            );

            const handResults = handLandmarkerRef.current.detectForVideo(
              video,
              startTimeMs,
            );

            // const hairResults = hairSegmenterRef.current.segmentForVideo(
            //   video,
            //   startTimeMs,
            // );

            // if (hairResults?.categoryMask) {
            //   hairRef.current = hairResults.categoryMask.getAsFloat32Array();
            //   let imageData = ctx.getImageData(
            //     0,
            //     0,
            //     video.videoWidth,
            //     video.videoHeight,
            //   ).data;

            //   let j = 0;
            //   for (let i = 0; i < hairRef.current.length; ++i) {
            //     const maskVal = Math.round(hairRef.current[i] * 255.0);

            //     // Proses hanya untuk label index 1
            //     if (maskVal === 1) {
            //       const legendColor =
            //         legendColors[maskVal % legendColors.length];
            //       imageData[j] = (legendColor[0] + imageData[j]) / 2;
            //       imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
            //       imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
            //       imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
            //     }
            //     j += 4;
            //   }

            //   const uint8Array = new Uint8ClampedArray(imageData.buffer);
            //   const dataNew = new ImageData(
            //     uint8Array,
            //     video.videoWidth,
            //     video.videoHeight,
            //   );

            //   hairMaskRef.current = dataNew;
            // }

            if (results.facialTransformationMatrixes.length > 0) {
              faceTransformRef.current =
                results.facialTransformationMatrixes[0].data;
            }

            if (results.faceBlendshapes.length > 0) {
              blendshapeRef.current = results.faceBlendshapes[0].categories;
            }

            if (handResults.landmarks && handResults.landmarks.length > 0) {
              handLandmarksRef.current = handResults.landmarks[0];
            }
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              landmarksRef.current = results.faceLandmarks[0];
            }
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        }
      }
    }

    if (isDetectingRef.current) {
      requestAnimationFrame(detectLiveStream);
    }
  };

  // Video Detection Function
  const detectUploadedVideo = async () => {
    if (
      faceLandmarkerRef.current &&
      handLandmarkerRef.current &&
      hairSegmenterRef.current &&
      videoUploadRef.current &&
      videoUploadRef.current.readyState === 3
    ) {
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

          const startTimeMs = performance.now();
          try {
            const results = faceLandmarkerRef.current.detectForVideo(
              video,
              startTimeMs,
            );

            const handResults = handLandmarkerRef.current.detectForVideo(
              video,
              startTimeMs,
            );

            // const hairResults = hairSegmenterRef.current.segmentForVideo(
            //   video,
            //   startTimeMs,
            // );

            // if (hairResults?.categoryMask) {
            //   hairRef.current = hairResults.categoryMask.getAsFloat32Array();
            //   let imageData = ctx.getImageData(
            //     0,
            //     0,
            //     video.videoWidth,
            //     video.videoHeight,
            //   ).data;

            //   let j = 0;
            //   for (let i = 0; i < hairRef.current.length; ++i) {
            //     const maskVal = Math.round(hairRef.current[i] * 255.0);

            //     // Proses hanya untuk label index 1
            //     if (maskVal === 1) {
            //       const legendColor =
            //         legendColors[maskVal % legendColors.length];
            //       imageData[j] = (legendColor[0] + imageData[j]) / 2;
            //       imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
            //       imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
            //       imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
            //     }
            //     j += 4;
            //   }

            //   const uint8Array = new Uint8ClampedArray(imageData.buffer);
            //   const dataNew = new ImageData(
            //     uint8Array,
            //     video.videoWidth,
            //     video.videoHeight,
            //   );

            //   hairMaskRef.current = dataNew;
            // }

            if (results.facialTransformationMatrixes.length > 0) {
              faceTransformRef.current =
                results.facialTransformationMatrixes[0].data;
            }

            if (results.faceBlendshapes.length > 0) {
              blendshapeRef.current = results.faceBlendshapes[0].categories;
            }

            if (handResults.landmarks && handResults.landmarks.length > 0) {
              handLandmarksRef.current = handResults.landmarks[0];
            }
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              landmarksRef.current = results.faceLandmarks[0];
            }
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        }
      }
    }

    if (isDetectingRef.current && mode === "VIDEO") {
      requestAnimationFrame(detectUploadedVideo);
    }
  };

  // Image Detection Function
  const detectImage = async () => {
    if (
      faceLandmarkerRef.current &&
      handLandmarkerRef.current &&
      imageUploadRef.current
    ) {
      const img = imageUploadRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;

          // Get the dimensions of the canvas and image
          const canvasWidth = canvas.clientWidth;
          const canvasHeight = canvas.clientHeight;
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          try {
            const results = faceLandmarkerRef.current.detect(img);

            const handResults = handLandmarkerRef.current.detect(img);

            if (results.facialTransformationMatrixes.length > 0) {
              faceTransformRef.current =
                results.facialTransformationMatrixes[0].data;
            }

            if (results.faceBlendshapes.length > 0) {
              blendshapeRef.current = results.faceBlendshapes[0].categories;
            }

            if (handResults.landmarks && handResults.landmarks.length > 0) {
              handLandmarksRef.current = handResults.landmarks[0];
            }
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              landmarksRef.current = results.faceLandmarks[0];
            }
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

  // Function to start the detection loop
  const startDetection = useCallback(() => {
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;

    if (mode === "LIVE") {
      faceLandmarkerRef.current?.setOptions({ runningMode: "VIDEO" });
      handLandmarkerRef.current?.setOptions({ runningMode: "VIDEO" });
      hairSegmenterRef.current?.setOptions({ runningMode: "VIDEO" });
      console.log("detect live");
      detectLiveStream();
    } else if (mode === "VIDEO") {
      faceLandmarkerRef.current?.setOptions({ runningMode: "VIDEO" });
      handLandmarkerRef.current?.setOptions({ runningMode: "VIDEO" });
      hairSegmenterRef.current?.setOptions({ runningMode: "VIDEO" });
      console.log("detect video");
      detectUploadedVideo();
    } else if (mode === "IMAGE") {
      faceLandmarkerRef.current?.setOptions({ runningMode: "IMAGE" });
      handLandmarkerRef.current?.setOptions({ runningMode: "IMAGE" });
      hairSegmenterRef.current?.setOptions({ runningMode: "IMAGE" });
      console.log("detect image");
      detectImage();
    }
  }, [mode]);

  // Function to stop detection
  const stopDetection = () => {
    isDetectingRef.current = false;
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

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
          onLoad={() => {
            isDetectingRef.current = false;
            console.log("Image loaded");
            startDetection();
          }}
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
          onLoad={() => {
            isDetectingRef.current = false;
            console.log("Image loaded");
            startDetection();
          }}
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
          onLoadedData={() => {
            isDetectingRef.current = false;
            console.log("Webcam loaded");
            startDetection();
          }}
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
