import React, { useEffect, useRef, useState } from "react";
import { useCamera } from "../../context/recorder-context";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Canvas } from "@react-three/fiber";
import { Landmark } from "../../types/landmark";
import { SRGBColorSpace } from "three";
import SkinImprovementThreeScene from "./skin-improvement-three-scene";

export function SkinImprovementScene() {
  const { criterias } = useCamera();
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);

  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null,
  );
  const [isLandmarkerReady, setIsLandmarkerReady] = useState<boolean>(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const landmarkRef = useRef<Landmark[]>([]);

  const [isReady, setIsReady] = useState<boolean>(false);

  // Memuat gambar ketika capturedImage berubah
  useEffect(() => {
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
  }, [criterias.capturedImage]);

  // Inisialisasi FaceLandmarker
  useEffect(() => {
    let isMounted = true; // Untuk mencegah pembaruan state setelah unmount

    const initializeFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
        );
        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU", // Opsional: gunakan "GPU" jika didukung
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

  if (!criterias.capturedImage || !imageLoaded) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 0 }}
    >
      {/* Three.js Canvas */}
      <Canvas
        className="absolute left-0 top-0 h-full w-full"
        style={{ zIndex: 99 }}
        orthographic
        camera={{ zoom: 1, position: [0, 0, 10], near: -1000, far: 1000 }}
        gl={{ toneMapping: 1, outputColorSpace: SRGBColorSpace }}
      >
        <SkinImprovementThreeScene
          imageSrc={criterias.capturedImage}
          landmarks={landmarks}
        />
      </Canvas>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.9) 100%)`,
          zIndex: 200,
          pointerEvents: "none",
        }}
      ></div>
    </div>
  );
}

export default SkinImprovementScene;
