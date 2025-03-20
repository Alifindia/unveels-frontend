import React, { useEffect, useRef, useState } from "react";
import { useCamera } from "../context/recorder-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Landmark } from "../types/landmark";

export function Scanner({
  landmarksRef,
}: {
  landmarksRef?: React.RefObject<Landmark[] | null>;
}) {
  const { criterias, runningMode } = useCamera();
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);

  // Path Web Worker berdasarkan environment
  const workerPath: string | URL =
    import.meta.env.MODE === "development"
      ? new URL("../workers/scannerWorker.ts", import.meta.url) // Path relatif untuk dev
      : "/static/frontend/Smartwave/porto/en_US/Unveels_Tech/js/scannerWorker-C0zh0GnA.js"; // Path untuk build/produksi

  // Initialize MediaPipe Face Landmarker - hanya jika landmarksRef tidak tersedia
  useEffect(() => {
    let isMounted = true;

    // Skip landmarker loading jika landmarksRef sudah tersedia
    if (!landmarksRef || !landmarksRef.current) {
      async function loadLandmarker(): Promise<void> {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "/media/unveels/models/face-landmarker/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
        });
        if (isMounted) {
          setLandmarker(faceLandmarker);
        }
      }
      loadLandmarker();
    }

    return () => {
      isMounted = false;
      if (landmarker) {
        landmarker.close();
      }
    };
  }, [landmarksRef]);

  // Memuat gambar ketika capturedImage berubah
  useEffect(() => {
    if (criterias.capturedImage) {
      const image = new Image();
      image.src = criterias.capturedImage;
      image.crossOrigin = "anonymous";
      image.onload = () => setImageLoaded(image);
      image.onerror = (err: Event | string) =>
        console.error("Gagal memuat gambar:", err);
    }
  }, [criterias.capturedImage]);

  // Menginisialisasi Web Worker dan OffscreenCanvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    // Tidak perlu menunggu landmarker jika sudah ada landmarksRef
    const shouldSkipDetection = !!landmarksRef?.current;
    if (!shouldSkipDetection && !landmarker) return;

    const updateCanvasSize = (): void => {
      const dpr = window.devicePixelRatio || 1;
      if (runningMode === "IMAGE" && imageLoaded) {
        // Gunakan ukuran asli gambar untuk mode IMAGE
        const { naturalWidth, naturalHeight } = imageLoaded;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = naturalWidth / naturalHeight;
        let width, height;
        if (aspectRatio < screenWidth / screenHeight) {
          // Scale based on height
          height = screenHeight;
          width = screenHeight * aspectRatio;
        } else {
          // Scale based on width
          width = screenWidth;
          height = screenWidth / aspectRatio;
        }
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      } else {
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    };

    // Update ukuran canvas saat pertama kali dan ketika ukuran layar berubah
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const offscreen = canvas.transferControlToOffscreen();

    createImageBitmap(imageLoaded).then((imageBitmap) => {
      // Gunakan landmarks dari landmarksRef jika tersedia, jika tidak gunakan landmarker
      let landmarks: Landmark[] = [];
      if (landmarksRef?.current) {
        landmarks = landmarksRef.current;
      } else if (landmarker) {
        const result = landmarker.detect(imageBitmap);
        landmarks = result.faceLandmarks[0] || [];
      }

      const worker = new Worker(workerPath, { type: "module" });
      workerRef.current = worker;

      worker.postMessage(
        {
          imageData: imageBitmap,
          width: canvas.width,
          height: canvas.height,
          canvas: offscreen,
          landmarks: landmarks,
        },
        [offscreen, imageBitmap],
      );

      worker.onmessage = (e: MessageEvent<unknown>) => {
        // Optional: Handle worker messages
      };
    });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [imageLoaded, landmarker, landmarksRef, runningMode]);

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center ${runningMode === "IMAGE" ? "h-screen w-auto" : ""}`}
        style={
          runningMode !== "IMAGE" ? { width: "100vw", height: "100vh" } : {}
        }
      >
        <canvas
          ref={canvasRef}
          className={`${runningMode === "IMAGE" ? "h-full w-full" : "absolute left-0 top-0"}`}
          style={{
            objectFit: "contain",
            height: "100%",
            width: "100%",
          }}
        />
      </div>
    </>
  );
}
