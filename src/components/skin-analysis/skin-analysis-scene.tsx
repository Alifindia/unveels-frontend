import React, { useEffect, useRef, useState } from "react";
import { useCamera } from "../../context/recorder-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Canvas } from "@react-three/fiber";
import { Landmark } from "../../types/landmark";
import SkinAnalysisThreeScene from "./skin-analysis-three-scene";
import OverlayCanvas from "./overlay-canvas";
import { useSkinAnalysis } from "../../context/skin-analysis-context";
import { SRGBColorSpace } from "three";
import { FaceResults } from "../../types/faceResults";
import { normalize } from "three/src/math/MathUtils.js";
import { applyStretchedLandmarks } from "../../utils/scannerUtils";

interface SkinAnalysisSceneProps {
  data: FaceResults[];
  maskCanvas?: React.RefObject<HTMLCanvasElement> | null;
}

export function SkinAnalysisScene({
  data,
  maskCanvas,
}: SkinAnalysisSceneProps) {
  const { criterias } = useCamera();
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);
  const { tab, setTab, setView, view } = useSkinAnalysis();

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null,
  );
  const [isLandmarkerReady, setIsLandmarkerReady] = useState<boolean>(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const landmarkRef = useRef<Landmark[]>([]);

  const [isReady, setIsReady] = useState<boolean>(false);

  // Memuat gambar ketika capturedImage berubah
  useEffect(() => {
    console.log("scene ", data);
    if (criterias.capturedImage) {
      const image = new Image();
      image.src = criterias.capturedImage;
      image.crossOrigin = "anonymous"; // Menghindari masalah CORS
      image.onload = () => {
        console.log("image loaded");
        setImageLoaded(image);
      };
      image.onerror = (err) => {
        console.error("Gagal memuat gambar:", err);
      };
    }
  }, [criterias.capturedImage, data]);

  // Inisialisasi FaceLandmarker
  useEffect(() => {
    let isMounted = true; // Untuk mencegah pembaruan state setelah unmount

    const initializeFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        );
        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "/media/unveels/models/face-landmarker/face_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "IMAGE",
            numFaces: 1,
          },
        );
        if (isMounted) {
          setFaceLandmarker(landmarker);
          setIsLandmarkerReady(true);
        }
      } catch (error) {
        console.error("Gagal menginisialisasi FaceLandmarker:", error);
      }
    };

    initializeFaceLandmarker();

    // Cleanup pada unmount
    return () => {
      isMounted = false;
      if (faceLandmarker) {
        faceLandmarker.close();
      }
    };
  }, []);

  // Memproses gambar dan mendeteksi landmark
  useEffect(() => {
    const processImage = async () => {
      if (imageLoaded && faceLandmarker && isLandmarkerReady) {
        const outerLipIndices = [
          308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 62, 78, 95, 88, 178, 87,
          14, 317, 402, 319,
        ];

        const leftEyeIndices = [
          246, 161, 160, 159, 158, 157, 173, 155, 154, 153, 145, 144, 163, 7,
        ];
        const rightEyeIndices = [
          263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373,
          390, 249,
        ];
        const faceContourIndices = [
          338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
          378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
          127, 162, 21, 54, 103, 67, 109,
        ];

        try {
          const results = await faceLandmarker.detect(imageLoaded);
          if (results && results.faceLandmarks.length > 0) {
            // Asumsikan wajah pertama
            const firstFace = results.faceLandmarks[0];

            // Konversi landmark ke koordinat normal dengan z
            const normalizedLandmarks = firstFace.map((landmark) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z,
            }));
            setLandmarks(normalizedLandmarks);
            landmarkRef.current = normalizedLandmarks; // Update the ref with the latest landmarks

            const flippedLandmark = applyStretchedLandmarks(
              firstFace.map((landmark) => ({
                x: 1 - landmark.x,
                y: landmark.y,
                z: landmark.z,
              })),
            );

            const ctx = maskCanvas?.current?.getContext("2d");
            if (ctx) {
              const width = ctx.canvas.width;
              const height = ctx.canvas.height;

              // Simpan state canvas saat ini
              ctx.save();

              // Set operation to clear instead of draw
              ctx.globalCompositeOperation = "destination-out";

              // Clear outside face area
              ctx.beginPath();
              // Start with full canvas rect
              ctx.rect(0, 0, width, height);

              // Cut out face shape (making a hole in our "eraser")
              if (flippedLandmark[faceContourIndices[0]]) {
                ctx.moveTo(
                  flippedLandmark[faceContourIndices[0]].x * width,
                  flippedLandmark[faceContourIndices[0]].y * height,
                );

                for (let i = 1; i < faceContourIndices.length; i++) {
                  const idx = faceContourIndices[i];
                  if (flippedLandmark[idx]) {
                    ctx.lineTo(
                      flippedLandmark[idx].x * width,
                      flippedLandmark[idx].y * height,
                    );
                  }
                }
                ctx.closePath();
              }

              // Fill to clear outside face area
              ctx.fill();

              // Clear mouth area (outer lip)
              ctx.beginPath();
              if (flippedLandmark[outerLipIndices[0]]) {
                ctx.moveTo(
                  flippedLandmark[outerLipIndices[0]].x * width,
                  flippedLandmark[outerLipIndices[0]].y * height,
                );

                for (let i = 1; i < outerLipIndices.length; i++) {
                  const idx = outerLipIndices[i];
                  if (flippedLandmark[idx]) {
                    ctx.lineTo(
                      flippedLandmark[idx].x * width,
                      flippedLandmark[idx].y * height,
                    );
                  }
                }
                ctx.closePath();
                ctx.fill();
              }

              // Clear left eye area
              ctx.beginPath();
              if (flippedLandmark[leftEyeIndices[0]]) {
                ctx.moveTo(
                  flippedLandmark[leftEyeIndices[0]].x * width,
                  flippedLandmark[leftEyeIndices[0]].y * height,
                );

                for (let i = 1; i < leftEyeIndices.length; i++) {
                  const idx = leftEyeIndices[i];
                  if (flippedLandmark[idx]) {
                    ctx.lineTo(
                      flippedLandmark[idx].x * width,
                      flippedLandmark[idx].y * height,
                    );
                  }
                }
                ctx.closePath();
                ctx.fill();
              }

              // Clear right eye area
              ctx.beginPath();
              if (flippedLandmark[rightEyeIndices[0]]) {
                ctx.moveTo(
                  flippedLandmark[rightEyeIndices[0]].x * width,
                  flippedLandmark[rightEyeIndices[0]].y * height,
                );

                for (let i = 1; i < rightEyeIndices.length; i++) {
                  const idx = rightEyeIndices[i];
                  if (flippedLandmark[idx]) {
                    ctx.lineTo(
                      flippedLandmark[idx].x * width,
                      flippedLandmark[idx].y * height,
                    );
                  }
                }
                ctx.closePath();
                ctx.fill();
              }

              // Restore original composite operation
              ctx.restore();
            }
          }
        } catch (error) {
          console.error("Gagal mendeteksi wajah:", error);
        }
      }
    };

    processImage();
  }, [imageLoaded, faceLandmarker, isLandmarkerReady]);

  useEffect(() => {
    if (imageLoaded && landmarks.length > 0) {
      setIsReady(true);
    }
  }, [imageLoaded, landmarks]);

  const handleLabelClick = (label: string | null) => {
    if (label != null) {
      if ((window as any).flutter_inappwebview) {
        (window as any).flutter_inappwebview
          .callHandler(
            "getLabel",
            JSON.stringify({ skinAnalysisLabelClick: label }),
          )
          .then((result: any) => {
            console.log("Flutter responded with:", result);
          })
          .catch((error: any) => {
            console.error("Error calling Flutter handler:", error);
          });
      }
      setTab(label);
      setView("problems");
      console.log(label);
    }
  };

  if (!criterias.capturedImage || !imageLoaded) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 0 }}
    >
      {/* Three.js Canvas */}
      {/* <Canvas
        className="absolute left-0 top-0 h-full w-full"
        style={{ zIndex: 99 }}
        orthographic
        camera={{ zoom: 1, position: [0, 0, 10], near: -1000, far: 1000 }}
        gl={{ toneMapping: 1, outputColorSpace: SRGBColorSpace }}
      >
        <SkinAnalysisThreeScene
          imageSrc={criterias.capturedImage}
          landmarks={landmarks}
          landmarksRef={landmarkRef}
        />
      </Canvas> */}

      {/* Overlay Canvas untuk Labels */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute left-0 top-0 h-full w-full"
        style={{ zIndex: 100 }}
      />
      {/* Komponen untuk menggambar gambar di overlay canvas */}
      <OverlayCanvas
        image={imageLoaded}
        canvasRef={overlayCanvasRef}
        data={data}
        landmarks={landmarks}
        onLabelClick={handleLabelClick}
      />
    </div>
  );
}

export default SkinAnalysisScene;