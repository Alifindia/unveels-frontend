import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  FaceDetector,
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useCamera } from "../../context/recorder-context";
import {
  BRIGHTNESS_THRESHOLD,
  POSITION_THRESHOLD_X,
  POSITION_THRESHOLD_Y,
  ORIENTATION_THRESHOLD_YAW,
  ORIENTATION_THRESHOLD_PITCH,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  faces,
} from "../../utils/constants";
import { calculateLighting, cropImage } from "../../utils/imageProcessing";
import { CountdownOverlay } from "../countdown-overlay";
import { ErrorOverlay } from "../error-overlay";
import { useCountdown } from "../../hooks/useCountdown";
import {
  calculateOrientation,
  Orientation,
} from "../../utils/orientationUtils";
import {
  applyStretchedLandmarks,
  calculatePosition,
  clamp,
  drawConnectorsFromFaces,
} from "../../utils/scannerUtils";

interface VideoStreamProps {
  debugMode?: boolean;
}

export function VideoStream({ debugMode = false }: VideoStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const isDetectingRef = useRef<boolean>(false);
  const faceLandmarRef = useRef<FaceLandmarker | null>(null);

  let glowOffset = 0;
  const glowSpeed = 0.03;

  // Using CameraContext
  const {
    webcamRef,
    imageRef,
    videoRef,
    runningMode,
    criterias,
    setCriterias,
    captureImage,
    setBoundingBox,
    captureImageCut,
    resetCapture,
  } = useCamera();

  // State Variables for Metrics
  const [lighting, setLighting] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [orientation, setOrientation] = useState<Orientation>({
    yaw: 0,
    pitch: 0,
  });

  // State for Captured Image
  const [capturedImageSrc, setCapturedImageSrc] = useState<string | null>(null);

  // Initialize Mediapipe Face Landmarker
  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode:
            runningMode == "LIVE_CAMERA" || runningMode == "VIDEO"
              ? "VIDEO"
              : "IMAGE",
        });

        faceLandmarRef.current = faceLandmarker;
        startDetection();
      } catch (err) {
        console.error("Failed to initialize FaceDetector:", err);
        setError(err as Error);
      }
    };

    initializeFaceLandmarker();

    return () => {
      if (faceLandmarRef.current) {
        faceLandmarRef.current.close;
      }
      isDetectingRef.current = false;
    };
  }, []);

  // Live Stream
  const detectLiveStream = async () => {
    if (
      faceLandmarRef.current &&
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
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

          const startTimeMs = performance.now();

          glowOffset += glowSpeed;
          if (glowOffset > 2) glowOffset = 0;

          try {
            const results = faceLandmarRef.current.detectForVideo(
              video,
              startTimeMs,
            );

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];

              const faceLandmarks = applyStretchedLandmarks(landmarks);
              const gradient = ctx.createLinearGradient(canvas.width, 0, 0, 0);

              gradient.addColorStop(
                Math.max(0, glowOffset - 0.1),
                "rgba(254, 238, 192, 0.1)",
              );
              gradient.addColorStop(glowOffset, "rgba(255, 220, 0, 0.5)");
              gradient.addColorStop(
                Math.min(1, glowOffset + 0.1),
                "rgba(245, 209, 86, 0.1)",
              );

              drawConnectorsFromFaces(
                faceLandmarks,
                gradient,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight,
                faces,
                ctx,
              );

              // Hitung posisi wajah relatif terhadap layar
              const position = calculatePosition(
                landmarks,
                canvas.width,
                canvas.height,
              );
              setPosition(position);

              // Hitung orientasi kepala
              const orientation = calculateOrientation(landmarks);
              setOrientation(orientation);

              if (video.readyState >= 3) {
                const avgBrightness = await calculateLighting(video);
                setLighting(avgBrightness);
              }
            } else {
              setPosition({ x: 0, y: 0 });
              setOrientation({ yaw: 0, pitch: 0 });
            }
          } catch (error) {}
        }
      } else {
        console.error("Video element is not properly initialized");
      }
    }

    if (isDetectingRef.current) {
      requestAnimationFrame(detectLiveStream);
    }
  };

  // Video Detection Function
  const detectUploadedVideo = async () => {
    if (
      faceLandmarRef.current &&
      videoRef.current &&
      videoRef.current.readyState >= 3 // HAVE_FUTURE_DATA
    ) {
      const video = videoRef.current;
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
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

          const startTimeMs = performance.now();

          glowOffset += glowSpeed;
          if (glowOffset > 1.5) glowOffset = 0;

          try {
            const results = faceLandmarRef.current.detectForVideo(
              video,
              startTimeMs,
            );

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];

              const faceLandmarks = applyStretchedLandmarks(landmarks);
              const gradient = ctx.createLinearGradient(canvas.width, 0, 0, 0);

              gradient.addColorStop(
                Math.max(0, glowOffset - 0.1),
                "rgba(254, 238, 192, 0.1)",
              );
              gradient.addColorStop(glowOffset, "rgba(255, 220, 0, 0.5)");
              gradient.addColorStop(
                Math.min(1, glowOffset + 0.1),
                "rgba(245, 209, 86, 0.1)",
              );

              drawConnectorsFromFaces(
                faceLandmarks,
                gradient,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight,
                faces,
                ctx,
              );

              // Hitung posisi wajah relatif terhadap layar
              const position = calculatePosition(
                landmarks,
                canvas.width,
                canvas.height,
              );
              setPosition(position);

              // Hitung orientasi kepala
              const orientation = calculateOrientation(landmarks);
              setOrientation(orientation);

              if (video.readyState >= 3) {
                const avgBrightness = await calculateLighting(video);
                setLighting(avgBrightness);
              }
            } else {
              setPosition({ x: 0, y: 0 });
              setOrientation({ yaw: 0, pitch: 0 });
            }
          } catch (error) {}
        }
      } else {
        console.error("Video element is not properly initialized");
      }
    }

    if (isDetectingRef.current && runningMode === "VIDEO") {
      requestAnimationFrame(detectUploadedVideo);
    }
  };

  // Image Detection Function
  const detectImage = async () => {
    if (faceLandmarRef.current && imageRef.current) {
      const img = imageRef.current;
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
            // Detect landmarks on the image
            const results = await faceLandmarRef.current.detect(img);

            // Calculate image and canvas aspect ratio
            const imgAspect = img.width / img.height;
            const canvasAspect = canvasWidth / canvasHeight;

            let drawWidth: number,
              drawHeight: number,
              offsetX: number,
              offsetY: number;

            // Maintain aspect ratio and calculate offsets
            if (imgAspect < canvasAspect) {
              drawWidth = canvasWidth;
              drawHeight = canvasWidth / imgAspect;
              offsetX = 0;
              offsetY = (canvasHeight - drawHeight) / 2;
            } else {
              drawWidth = canvasHeight * imgAspect;
              drawHeight = canvasHeight;
              offsetX = (canvasWidth - drawWidth) / 2;
              offsetY = 0;
            }

            // Draw the image on the canvas with calculated offsets
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];

              // Update glowOffset for animation
              glowOffset += glowSpeed;
              if (glowOffset > 1) glowOffset = 0;

              const gradient = ctx.createLinearGradient(canvas.width, 0, 0, 0);

              gradient.addColorStop(
                Math.max(0, glowOffset - 0.1),
                "rgba(254, 238, 192, 0.1)",
              );
              gradient.addColorStop(glowOffset, "rgba(255, 220, 0, 0.5)");
              gradient.addColorStop(
                Math.min(1, glowOffset + 0.1),
                "rgba(245, 209, 86, 0.1)",
              );

              // Draw connectors with scanner effect
              drawConnectorsFromFaces(
                landmarks,
                gradient,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight,
                faces,
                ctx,
              );

              // Calculate face position relative to the canvas
              const position = calculatePosition(
                landmarks,
                drawWidth,
                drawHeight,
              );
              setPosition(position);

              // Calculate head orientation
              const orientation = calculateOrientation(landmarks);
              setOrientation(orientation);

              // Calculate average brightness
              const avgBrightness = calculateLighting(img);
              setLighting(await avgBrightness);
            } else {
              // Reset metrics if no face is detected
              setPosition({ x: 0, y: 0 });
              setOrientation({ yaw: 0, pitch: 0 });
              setLighting(0);
            }
          } catch (err) {
            console.error("Detection error:", err);
            setError(err as Error);
          }
        }
      } else {
        console.error("Canvas element is not properly initialized");
      }
    }

    // Continue animation if runningMode is IMAGE
    if (isDetectingRef.current && runningMode === "IMAGE") {
      requestAnimationFrame(detectImage);
    }
  };

  // Function to start the detection loop
  const startDetection = useCallback(() => {
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;

    if (runningMode == "LIVE_CAMERA") {
      detectLiveStream();
    } else if (runningMode === "VIDEO") {
      detectUploadedVideo();
    } else if (runningMode == "IMAGE") {
      detectImage();
    }
  }, [criterias.flipped]);

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

  // Handle responsive resizing using ResizeObserver
  useEffect(() => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const updateCanvasSize = () => {
      const videoRect = video.getBoundingClientRect();
      canvas.width = videoRect.width;
      canvas.height = videoRect.height;
    };

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(video);

    // Update initial size
    updateCanvasSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Evaluates whether the current metrics meet the defined criteria.
   * Updates CameraContext with the evaluation results
   */
  const evaluateCriteria = useCallback(() => {
    const isBrightnessGood = lighting > BRIGHTNESS_THRESHOLD;

    const isPositionGood =
      Math.abs(position.x) < POSITION_THRESHOLD_X &&
      Math.abs(position.x) != 0 &&
      Math.abs(position.y) < POSITION_THRESHOLD_Y &&
      Math.abs(position.y) != 0;

    // Evaluasi orientasi kepala
    const isOrientationGood =
      Math.abs(orientation.yaw + 90) < ORIENTATION_THRESHOLD_YAW && // Yaw di sekitar -90
      Math.abs(orientation.pitch) < ORIENTATION_THRESHOLD_PITCH;

    setCriterias({
      lighting: isBrightnessGood,
      facePosition: isPositionGood,
      orientation: isOrientationGood,
    });

    return {
      brightness: isBrightnessGood,
      position: isPositionGood,
      orientation: isOrientationGood,
      allGood: isBrightnessGood && isPositionGood && isOrientationGood,
    };
  }, [
    lighting,
    position.x,
    position.y,
    orientation.pitch,
    orientation.yaw,
    setCriterias,
  ]);

  /**
   * Function to capture the current frame from the webcam and crop based on bounding box
   */
  const capture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          captureImage(imageSrc);
          setCapturedImageSrc(imageSrc);
          stopDetection();
        } catch (error) {
          console.error("Error cropping image:", error);
        }
      }
    }
    if (imageRef.current) {
      const imageSrc = imageRef.current.src;
      if (imageSrc) {
        try {
          captureImage(imageSrc);
          setCapturedImageSrc(imageSrc); // Set the captured image
          stopDetection(); // Optionally stop detection after capture
        } catch (error) {
          console.error("Error cropping image:", error);
        }
      }
    }
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas content to data URL (base64 encoded image)
        const imageSrc = canvas.toDataURL("image/png");

        if (imageSrc) {
          try {
            captureImage(imageSrc); // Simpan full image yang di-capture
            setCapturedImageSrc(imageSrc); // Set full captured image
            stopDetection(); // Optionally stop detection after capture
          } catch (error) {
            console.error("Error cropping image:", error);
          }
        }
      }
    }
  }, [captureImage, criterias.lastBoundingBox]);

  // Initialize useCountdown hook
  const {
    count: countdown,
    start: startCountdown,
    cancel: cancelCountdown,
    isActive: isCountdownActive,
  } = useCountdown({
    initialCount: 3,
    onComplete: capture,
  });

  // Use Effect to evaluate criteria and manage countdown
  useEffect(() => {
    const criteria = evaluateCriteria();

    if (criteria.allGood && !criterias.isCaptured && !isCountdownActive) {
      // Start the countdown
      startCountdown();
    } else if (!criteria.allGood && isCountdownActive) {
      // Criteria not met, cancel the countdown
      cancelCountdown();
    }
  }, [evaluateCriteria]);

  // Reset Capture state when new image is loaded
  useEffect(() => {
    if (!criterias.isCaptured) {
      setCapturedImageSrc(null);
      startDetection();
      resetCapture();
    }
  }, [criterias.isCaptured]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {capturedImageSrc ? (
        <div className="relative h-full w-full">
          <img
            src={capturedImageSrc}
            alt="Captured"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <>
          {runningMode === "LIVE_CAMERA" && (
            <>
              {/* Webcam Video */}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                mirrored={false}
                videoConstraints={{
                  width: VIDEO_WIDTH,
                  height: VIDEO_HEIGHT,
                  facingMode: criterias.flipped ? "environment" : "user",
                  frameRate: { exact: 25, ideal: 25, max: 25 },
                }}
                onUserMediaError={(err) =>
                  setError(
                    err instanceof Error
                      ? err
                      : new Error("Webcam error occurred."),
                  )
                }
              />
            </>
          )}

          {runningMode === "VIDEO" && (
            <video
              ref={videoRef}
              src={videoRef.current?.src}
              controls
              autoPlay
              loop
              className="h-full w-full object-cover"
            />
          )}

          {runningMode === "IMAGE" && (
            <img
              ref={imageRef}
              src={imageRef.current?.src}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
          )}

          {/* Overlay Canvas */}
          {(criterias.runningMode === "LIVE_CAMERA" ||
            criterias.runningMode === "VIDEO" ||
            criterias.runningMode === "IMAGE") && (
            <canvas
              ref={canvasRef}
              className={`pointer-events-none absolute left-0 top-0 h-full w-screen`}
            />
          )}

          {/* Countdown Overlay */}
          {countdown !== null && <CountdownOverlay count={countdown} />}

          {/* Error Display */}
          {error && <ErrorOverlay message={error.message} />}
        </>
      )}
    </div>
  );
}
