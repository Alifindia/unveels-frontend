import React, { useEffect, useRef, useState } from "react";
import { useCamera } from "../context/recorder-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export function Scanner() {
  const { criterias } = useCamera();
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);

  // Path Web Worker berdasarkan environment
  const workerPath =
    import.meta.env.MODE === "development"
      ? new URL("../workers/scannerWorker.ts", import.meta.url) // Path relatif untuk dev
      : "/static/frontend/Smartwave/porto/en_US/Unveels_Tech/js/scannerWorker-C0zh0GnA.js"; // Path untuk build/produksi

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;

    async function loadLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
      if (isMounted) {
        setLandmarker(faceLandmarker);
      }
    }
    loadLandmarker();

    return () => {
      isMounted = false;
      if (landmarker) {
        landmarker.close();
      }
    };
  }, []);

  // Memuat gambar ketika capturedImage berubah
  useEffect(() => {
    if (criterias.capturedImage) {
      const image = new Image();
      image.src = criterias.capturedImage;
      image.crossOrigin = "anonymous";
      image.onload = () => setImageLoaded(image);
      image.onerror = (err) => console.error("Gagal memuat gambar:", err);
    }
  }, [criterias.capturedImage]);

  // Menginisialisasi Web Worker dan OffscreenCanvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || !landmarker) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    // Update ukuran canvas saat pertama kali dan ketika ukuran layar berubah
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const offscreen = canvas.transferControlToOffscreen();

    createImageBitmap(imageLoaded).then((imageBitmap) => {
      const result = landmarker.detect(imageBitmap);

      const worker = new Worker(workerPath, { type: "module" });

      workerRef.current = worker;

      worker.postMessage(
        {
          imageData: imageBitmap,
          width: canvas.width,
          height: canvas.height,
          canvas: offscreen,
          landmarks: result.faceLandmarks[0] || [],
        },
        [offscreen, imageBitmap],
      );

      worker.onmessage = (e) => {
        // Optional: Handle worker messages
      };
    });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [imageLoaded, landmarker]);

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          width: "100vw",
          height: "100vh",
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0 h-full w-full"
          style={{}}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
        }}
      ></div>
    </>
  );
}
