import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../../context/recorder-context";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { Canvas } from "@react-three/fiber";
import { useSkinColor } from "./skin-color-context"; // Pastikan path ini benar
import { Landmark } from "../../types/landmark";
import { extractSkinColor } from "../../utils/imageProcessing";
import SkinToneFinderThreeScene from "./skin-tone-finder-three-scene";
import { SRGBColorSpace } from "three";
import { useMakeup } from "../../context/makeup-context";
import { Rnd } from "react-rnd";
import { useInferenceContext } from "../../context/inference-context";
import { Scanner } from "../scanner";

interface ImageCanvasProps {
  image: HTMLImageElement;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

function ImageCanvas({ image, canvasRef }: ImageCanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Gagal mendapatkan konteks 2D untuk overlay canvas.");
      return;
    }

    const drawImage = () => {
      const { innerWidth: width, innerHeight: height } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const imgAspect = image.naturalWidth / image.naturalHeight;
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
    };

    drawImage();
    window.addEventListener("resize", drawImage);

    return () => {
      window.removeEventListener("resize", drawImage);
    };
  }, [image, canvasRef]);

  return null;
}

interface SkinToneFinderSceneProps {
  debugMode?: boolean; // Opsional untuk mode debug
  faceLandmarker: FaceLandmarker | null; // Model diterima sebagai prop
}

export function SkinToneFinderScene({
  debugMode = false,
  faceLandmarker,
}: SkinToneFinderSceneProps) {
  return (
    <SkinToneFinderInnerScene
      debugMode={debugMode}
      faceLandmarker={faceLandmarker}
    />
  );
}

interface SkinToneFinderInnerSceneProps {
  debugMode: boolean;
  faceLandmarker: FaceLandmarker | null;
}

function SkinToneFinderInnerScene({
  debugMode,
  faceLandmarker,
}: SkinToneFinderInnerSceneProps) {
  const { criterias } = useCamera();
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);

  // Replace useState with useRef for landmarks
  const landmarksRef = useRef<Landmark[]>([]);

  const { setSkinColor, setHexColor } = useSkinColor();
  const { setFoundationColor } = useMakeup();

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef<HTMLCanvasElement>(null);

  const { setIsInferenceFinished } = useInferenceContext();

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  useEffect(() => {
    if (criterias.capturedImage) {
      const image = new Image();
      image.src = criterias.capturedImage;
      image.crossOrigin = "anonymous";
      image.onload = () => {
        setImageLoaded(image);
      };
      image.onerror = (err) => {
        console.error("Gagal memuat gambar:", err);
      };
    }
  }, [criterias.capturedImage]);

  // for flutter webView
  function changeHex(data: string) {
    setHexColor(data);
    setFoundationColor(data);
  }

  // Memproses gambar dan mendeteksi landmark
  useEffect(() => {
    const processImage = async () => {
      if (imageLoaded && faceLandmarker) {
        // for flutter webview comunication
        console.log("Detection Running Skin Tone Finder");
        if ((window as any).flutter_inappwebview) {
          (window as any).flutter_inappwebview
            .callHandler("detectionRun", "Detection Running Skin Tone Finder")
            .then((result: any) => {
              console.log("Flutter responded with:", result);
            })
            .catch((error: any) => {
              console.error("Error calling Flutter handler:", error);
            });
        }
        try {
          // Tambahkan delay sebelum inferensi
          await new Promise((resolve) => setTimeout(resolve, 2000));

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
            // Update landmarksRef instead of state
            landmarksRef.current = normalizedLandmarks;

            const indices = [101, 50, 330, 280, 108, 69, 151, 337, 299];
            // Ekstrak warna kulit
            const extractedSkinColor = extractSkinColor(
              imageLoaded,
              landmarksRef.current, // Use landmarksRef.current
              indices,
              5,
            );

            // set skin color and type
            setSkinColor(
              extractedSkinColor.hexColor,
              extractedSkinColor.skinType,
            );

            setIsInferenceFinished(true);
            setIsInferenceCompleted(true);

            if (extractedSkinColor) {
              console.log("Skin Tone Finder Result:", extractedSkinColor);

              const resultString = JSON.stringify(extractedSkinColor);
              console.log("Skon Tone Finder Result as JSON:", resultString);

              if ((window as any).flutter_inappwebview) {
                (window as any).flutter_inappwebview
                  .callHandler("detectionResult", resultString)
                  .then((result: any) => {
                    console.log("Flutter responded with:", result);
                  })
                  .catch((error: any) => {
                    console.error("Error calling Flutter handler:", error);
                  });
              }
              setShowScannerAfterInference(false);
            }
          }
        } catch (error) {
          setIsInferenceFinished(false);
          if ((window as any).flutter_inappwebview) {
            (window as any).flutter_inappwebview
              .callHandler("detectionError", error)
              .then((result: any) => {
                console.log("Flutter responded with:", result);
              })
              .catch((error: any) => {
                console.error("Error calling Flutter handler:", error);
              });
          }
          console.error("Inference error:", error);
          console.error("Gagal mendeteksi wajah:", error);
        }
      }
    };

    processImage();
  }, [imageLoaded, faceLandmarker]);

  // Jika tidak ada gambar yang ditangkap, render hanya canvas overlay
  if (!criterias.capturedImage || !imageLoaded) {
    return null;
  }

  return (
    <>
      {criterias.isCaptured ? (
        <>
          {showScannerAfterInference || !isInferenceCompleted ? (
            <Scanner />
          ) : (
            <div className="fixed inset-0 flex">
              {/* Render kondisional overlay canvas */}
              {/* Overlay Canvas */}
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
                  ref={overlayCanvasRef}
                  className="pointer-events-none absolute left-0 top-0 h-full w-screen"
                  style={{ zIndex: 50 }}
                >
                  {/* Komponen untuk menggambar gambar di overlay canvas */}
                  <ImageCanvas
                    image={imageLoaded}
                    canvasRef={overlayCanvasRef}
                  />
                </canvas>
              </Rnd>

              {/* 3D Canvas */}
              <Canvas
                className="absolute left-0 top-0 h-full w-full"
                ref={divRef}
                style={{ zIndex: 0 }}
                orthographic
                camera={{
                  zoom: 1,
                  position: [0, 0, 10],
                  near: -1000,
                  far: 1000,
                }}
                gl={{ toneMapping: 1, outputColorSpace: SRGBColorSpace }}
              >
                <SkinToneFinderThreeScene
                  imageSrc={criterias.capturedImage}
                  landmarks={landmarksRef} // Pass landmarksRef.current
                />
              </Canvas>
            </div>
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default SkinToneFinderScene;
