import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../../context/recorder-context";
import {
  FaceLandmarker,
  ImageSegmenter,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
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
import { hexToRgb } from "../../utils/colorUtils";

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
  imageSegmenter: ImageSegmenter | null;
}

export function SkinToneFinderScene({
  debugMode = false,
  faceLandmarker,
  imageSegmenter,
}: SkinToneFinderSceneProps) {
  return (
    <SkinToneFinderInnerScene
      debugMode={debugMode}
      faceLandmarker={faceLandmarker}
      imageSegmenter={imageSegmenter}
    />
  );
}

interface SkinToneFinderInnerSceneProps {
  debugMode: boolean;
  faceLandmarker: FaceLandmarker | null;
  imageSegmenter: ImageSegmenter | null;
}

function SkinToneFinderInnerScene({
  debugMode,
  faceLandmarker,
  imageSegmenter,
}: SkinToneFinderInnerSceneProps) {
  const { criterias } = useCamera();
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);

  const { flipCamera, compareCapture, resetCapture, screenShoot } = useCamera();

  const landmarksRef = useRef<Landmark[]>([]);

  const { setSkinColor, hexColor } = useSkinColor();
  const { setFoundationColor, setShowFoundation } = useMakeup();

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const categoryMask = useRef<Float32Array<ArrayBufferLike> | null>(null);
  const firstFaceRef = useRef<NormalizedLandmark[] | null>(null);
  const divRef = useRef<HTMLCanvasElement>(null);

  const { setIsInferenceFinished } = useInferenceContext();

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  const [data, setData] = useState<any>(null);

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

  useEffect(() => {
    if (data?.beforeAfter !== undefined) {
      compareCapture();
    }

    if (data?.flipCamera !== undefined) {
      console.log("FLIPING CAMERA");
      flipCamera();
    }

    if (data?.screenShoot !== undefined) {
      screenShoot();
    }
  }, [data]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Message received:", event);

      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          setData(data);
          console.log("Parsed data:", data);

          if (data.showFoundation !== undefined) {
            setShowFoundation(data.showFoundation);
          }

          if (data.foundationColor !== undefined) {
            setFoundationColor(data.foundationColor);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      } else {
        console.warn("No data received in message event");
      }
    };

    // Menambahkan event listener untuk menerima pesan
    window.addEventListener("message", handleMessage);

    // Membersihkan event listener saat komponen unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
  const { foundationColor, showFoundation } = useMakeup();

  useEffect(() => {
    if (criterias.screenshotImage) {
      // Jika screenshotImage adalah URL objek Blob, ambil Blob-nya menggunakan fetch
      fetch(criterias.screenshotImage)
        .then((response) => response.blob())
        .then((blob) => {
          const fileReader = new FileReader();

          fileReader.onloadend = () => {
            const resultString = JSON.stringify(fileReader.result);
            if ((window as any).flutter_inappwebview) {
              (window as any).flutter_inappwebview
                .callHandler("screenshootResult", resultString)
                .then((result: any) => {
                  console.log("Flutter responded with:", result);
                })
                .catch((error: any) => {
                  console.error("Error calling Flutter handler:", error);
                });
            }
          };

          fileReader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error("Error fetching Blob:", error);
        });
    }
  }, [criterias.screenshotImage]);

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
          const hairResults = await imageSegmenter?.segment(imageLoaded);

          if (results && results.faceLandmarks.length > 0) {
            // Asumsikan wajah pertama
            const firstFace = results.faceLandmarks[0];
            firstFaceRef.current = firstFace;
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

            if (hairResults?.categoryMask) {
              categoryMask.current =
                hairResults.categoryMask.getAsFloat32Array();
              hairResults.close();
            }

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

  useEffect(() => {
    const leftEye = [
      246, 161, 160, 159, 158, 157, 173, 155, 154, 153, 145, 144, 163, 7,
    ];
    const rightEye = [
      263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390,
      249,
    ];
    const mounth = [
      308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 62, 78, 95, 88, 178, 87, 14,
      317, 402, 319,
    ];

    const isInsideEyeArea = (
      x: number,
      y: number,
      landmarks: any[],
      eyePoints: number[],
      sourceWidth: number,
      sourceHeight: number,
    ) => {
      let inside = false;
      let j = eyePoints.length - 1;
      for (let i = 0; i < eyePoints.length; i++) {
        let xi = landmarks[eyePoints[i]].x * sourceWidth;
        let yi = landmarks[eyePoints[i]].y * sourceHeight;
        let xj = landmarks[eyePoints[j]].x * sourceWidth;
        let yj = landmarks[eyePoints[j]].y * sourceHeight;

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
        j = i;
      }
      return inside;
    };
    const changeColor = () => {
      if (!imageLoaded) return;

      const bgCanvas = backgroundCanvasRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      const bgCtx = bgCanvas?.getContext("2d", {
        willReadFrequently: true,
      });

      if (!canvas) return;
      if (!bgCanvas) return;
      const { innerWidth: width, innerHeight: height } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      bgCanvas.width = imageLoaded.naturalHeight;
      bgCanvas.height = imageLoaded.naturalHeight;
      ctx?.scale(dpr, dpr);

      ctx?.drawImage(
        imageLoaded,
        0,
        0,
        imageLoaded.naturalWidth / dpr,
        imageLoaded.naturalHeight / dpr,
      );

      let imageData = ctx?.getImageData(
        0,
        0,
        imageLoaded.naturalWidth,
        imageLoaded.naturalHeight,
      ).data;

      if (!imageData) return;
      const colorRgb = hexToRgb(foundationColor);
      const skinColorLegend = [[colorRgb.r, colorRgb.g, colorRgb.b, 0.08]];

      let j = 0;
      if (!categoryMask.current) return;
      if (!firstFaceRef.current) return;
      if (foundationColor != "") {
        for (let i = 0; i < categoryMask.current.length; ++i) {
          const x = i % imageLoaded.naturalWidth;
          const y = Math.floor(i / imageLoaded.naturalWidth);
          const maskVal = Math.round(categoryMask.current[i] * 255.0);

          const insideLeftEye = isInsideEyeArea(
            x,
            y,
            firstFaceRef.current,
            leftEye,
            imageLoaded.naturalWidth,
            imageLoaded.naturalHeight,
          );
          const insideRightEye = isInsideEyeArea(
            x,
            y,
            firstFaceRef.current,
            rightEye,
            imageLoaded.naturalWidth,
            imageLoaded.naturalHeight,
          );
          const insideMounth = isInsideEyeArea(
            x,
            y,
            firstFaceRef.current,
            mounth,
            imageLoaded.naturalWidth,
            imageLoaded.naturalHeight,
          );

          if (insideLeftEye || insideRightEye || insideMounth) {
            // Jika dalam area mata, buat transparan
          } else {
            if (maskVal === 3) {
              const skinColor = skinColorLegend[0];
              imageData[j] = skinColor[0] * 0.08 + imageData[j] * 0.9;
              imageData[j + 1] = skinColor[1] * 0.08 + imageData[j + 1] * 0.9;
              imageData[j + 2] = skinColor[2] * 0.08 + imageData[j + 2] * 0.9;
              imageData[j + 3] = 255;
            } else {
              // imageData[j] = 0;
              // imageData[j + 1] = 0;
              // imageData[j + 2] = 0;
              // imageData[j + 3] = 0;
            }
          }
          j += 4;
        }
      }

      const image = new ImageData(
        new Uint8ClampedArray(imageData.buffer),
        imageLoaded.naturalWidth,
        imageLoaded.naturalHeight,
      );

      bgCtx?.putImageData(image, 0, 0);
    };
    changeColor();
  }, [showFoundation, foundationColor, imageLoaded, isInferenceCompleted]);
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
            <div className="fixed inset-0 flex" style={{zIndex: 1}}>
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
                className="absolute left-0 top-0 hidden h-full w-full"
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

      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute left-0 top-0 hidden h-full w-full`}
        style={{ zIndex: 0 }}
      />

      <canvas
        ref={backgroundCanvasRef}
        className={`pointer-events-none absolute left-1/2 top-1/2 scale-x-[-1] transform`}
        style={{
          zIndex: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "translate(-50%, -50%) scaleX(-1)",
        }}
      />
    </>
  );
}

export default SkinToneFinderScene;
