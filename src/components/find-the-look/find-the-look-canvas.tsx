import { useEffect, useRef, useState } from "react";
import {
  ObjectDetector,
  ObjectDetectorResult,
  FaceLandmarker,
  BoundingBox,
} from "@mediapipe/tasks-vision";
import { Landmark } from "../../types/landmark";
import { extractSkinColor } from "../../utils/imageProcessing";
import { useFindTheLookContext } from "../../context/find-the-look-context";
import { useCamera } from "../../context/recorder-context";

interface FindTheLookCanvasProps {
  image: HTMLImageElement;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isFlip?: boolean;
  onLabelClick?: (label: string | null, section: string | null) => void;
  onDetectDone?: (isDetectFinished: boolean) => void;
  models: {
    faceLandmarker: FaceLandmarker | null;
    accesoriesDetector: ObjectDetector | null;
    makeupDetector: ObjectDetector | null;
    earringDetector: ObjectDetector | null;
  };
}

interface Hitbox {
  label: string;
  section: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function FindTheLookCanvas({
  image,
  canvasRef,
  isFlip = false,
  onDetectDone,
  onLabelClick,
  models,
}: FindTheLookCanvasProps) {
  const { selectedItems: cart } = useFindTheLookContext();
  const { findTheLookItems, addFindTheLookItem } = useFindTheLookContext();
  const { runningMode } = useCamera();

  const hitboxesRef = useRef<Hitbox[]>([]);

  const [isInferenceCompleted, setIsInferenceCompleted] = useState(false);
  const [showScannerAfterInference, setShowScannerAfterInference] =
    useState(true);

  // Gunakan models dari props
  const { faceLandmarker, accesoriesDetector, makeupDetector, earringDetector } = models;

  const [handResult, setHandResult] = useState<ObjectDetectorResult | null>(
    null,
  );
  const [ringResult, setRingResult] = useState<ObjectDetectorResult | null>(
    null,
  );
  const [neckResult, setNeckResult] = useState<ObjectDetectorResult | null>(
    null,
  );
  const [earringResult, setEarringResult] =
    useState<ObjectDetectorResult | null>(null);
  const [glassResult, setGlassResult] = useState<ObjectDetectorResult | null>(
    null,
  );
  const [headResult, setHeadResult] = useState<ObjectDetectorResult | null>(
    null,
  );
  const [makeupResult, setMakeupResult] = useState<ObjectDetectorResult | null>(
    null,
  );
  const [faceLandmark, setFaceLandmark] = useState<Landmark[] | null>(null);

  const categoriesMap = {
    head: ["Cap", "Hat", "Headband"],
    hand: ["Bracelet", "Watch"],
    neck: ["Necklace", "Neckless", "Scarf"],
    ring: ["rings"],
    earring: ["earring"],
    glasses: ["Glasses"],
  };

  const categorizeResults = (detections: any) => {
    const categorizedResults = {
      handResult: null,
      ringResult: null,
      neckResult: null,
      earringResult: null,
      glassResult: null,
      headResult: null,
    };

    // Periksa apakah detections adalah array dan memiliki data
    if (Array.isArray(detections.detections)) {
      // Untuk tiap kategori, simpan objek dengan skor tertinggi
      const categoryScores = {
        hand: { maxScore: -Infinity, bestDetection: null },
        ring: { maxScore: -Infinity, bestDetection: null },
        neck: { maxScore: -Infinity, bestDetection: null },
        earring: { maxScore: -Infinity, bestDetection: null },
        glasses: { maxScore: -Infinity, bestDetection: null },
        head: { maxScore: -Infinity, bestDetection: null },
      };

      detections.detections.forEach((detection: any) => {
        const categoryName = detection.categories[0].categoryName;
        const score = detection.categories[0].score;

        // Periksa apakah skor lebih tinggi dari skor tertinggi yang sudah ditemukan untuk kategori tersebut
        if (categoriesMap.head.includes(categoryName)) {
          if (score > categoryScores.head.maxScore) {
            categoryScores.head.maxScore = score;
            categoryScores.head.bestDetection = detection;
          }
        } else if (categoriesMap.hand.includes(categoryName)) {
          if (score > categoryScores.hand.maxScore) {
            categoryScores.hand.maxScore = score;
            categoryScores.hand.bestDetection = detection;
          }
        } else if (categoriesMap.neck.includes(categoryName)) {
          if (score > categoryScores.neck.maxScore) {
            categoryScores.neck.maxScore = score;
            categoryScores.neck.bestDetection = detection;
          }
        } else if (categoriesMap.ring.includes(categoryName)) {
          if (score > categoryScores.ring.maxScore) {
            categoryScores.ring.maxScore = score;
            categoryScores.ring.bestDetection = detection;
          }
        } else if (categoriesMap.earring.includes(categoryName)) {
          if (score > categoryScores.earring.maxScore) {
            categoryScores.earring.maxScore = score;
            categoryScores.earring.bestDetection = detection;
          }
        } else if (categoriesMap.glasses.includes(categoryName)) {
          if (score > categoryScores.glasses.maxScore) {
            categoryScores.glasses.maxScore = score;
            categoryScores.glasses.bestDetection = detection;
          }
        }
      });

      // Menetapkan hasil deteksi untuk setiap kategori berdasarkan nilai tertinggi
      categorizedResults.headResult = categoryScores.head.bestDetection;
      categorizedResults.handResult = categoryScores.hand.bestDetection;
      categorizedResults.neckResult = categoryScores.neck.bestDetection;
      categorizedResults.ringResult = categoryScores.ring.bestDetection;
      categorizedResults.earringResult = categoryScores.earring.bestDetection;
      categorizedResults.glassResult = categoryScores.glasses.bestDetection;
    } else {
      console.error("Detections is not an array or is empty:", detections);
    }

    return categorizedResults;
  };

  useEffect(() => {
    let isInferenceRunning = false; // Flag untuk memastikan inferensi tidak berjalan dua kali

    const detectObjects = async () => {
      if (
        !isInferenceRunning && // Periksa apakah inferensi sudah berjalan
        accesoriesDetector &&
        makeupDetector &&
        faceLandmarker &&
        earringDetector
      ) {
        isInferenceRunning = true; // Set flag saat inferensi dimulai
        try {
          // Tambahkan delay 2 detik
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const resultsAccesories = await accesoriesDetector.detect(image);
          const categorizedResults = categorizeResults(resultsAccesories);
          console.log(categorizedResults);

          // Memperbarui state berdasarkan kategori yang sesuai
          setHandResult(categorizedResults.handResult);
          setRingResult(categorizedResults.ringResult);
          setNeckResult(categorizedResults.neckResult);
          setGlassResult(categorizedResults.glassResult);
          setHeadResult(categorizedResults.headResult);
          accesoriesDetector.close();

          await new Promise((resolve) => setTimeout(resolve, 500));

          const resultsMakeup = await makeupDetector.detect(image);
          setMakeupResult(resultsMakeup);
          makeupDetector.close();

          try {
            const resultsEarring = await earringDetector.detect(image);
            console.log(resultsEarring.detections);
            setEarringResult(resultsEarring.detections.at(0));
            earringDetector.close();
          } catch (error) {
            console.log(error);
          }
          const resultsFaceLandmark = await faceLandmarker.detect(image);
          setFaceLandmark(resultsFaceLandmark.faceLandmarks[0] || null);
          faceLandmarker.close();

          console.log(resultsAccesories);

          console.log(handResult);
          console.log(ringResult);
          console.log(neckResult);
          console.log(earringResult);
          console.log(glassResult);
          console.log(headResult);


          setIsInferenceCompleted(true);

          setTimeout(() => {
            setShowScannerAfterInference(false);
            if (onDetectDone) {
              onDetectDone(true);
              console.log("Inference Finished");
            }
            accesoriesDetector.close();
            makeupDetector.close();
            faceLandmarker.close();
          }, 1000);
        } catch (error) {
          console.error("Error during detection: ", error);
        } finally {
          isInferenceRunning = false; // Reset flag jika inferensi selesai atau terjadi error
        }
      }
    };

    detectObjects();

    return () => {
      isInferenceRunning = false; // Reset flag saat komponen di-unmount
    };
  }, [accesoriesDetector, makeupDetector, faceLandmarker, image]);

  // send detection to webview
  useEffect(() => {
    if (findTheLookItems) {
      console.log("Detected Items: ", findTheLookItems);
      if ((window as any).flutter_inappwebview) {
        const resultString = JSON.stringify(findTheLookItems);
        (window as any).flutter_inappwebview
          .callHandler("detectionResult", resultString)
          .then((result: any) => {
            console.log("Flutter responded with:", result);
          })
          .catch((error: any) => {
            console.error("Error calling Flutter handler:", error);
          });
      }
    }
  }, [findTheLookItems]);

  // Draw detections on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context for overlay canvas.");
      return;
    }

    const drawImage = () => {
      console.log("draw Image");

      const { innerWidth: width, innerHeight: height } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const imgAspect = image.naturalWidth / image.naturalHeight;
      const canvasAspect = width / height;

      let drawWidth, drawHeight, offsetX, offsetY, scaleX, scaleY;

      // Check for runningMode IMAGE and adjust accordingly
      if (runningMode === 'IMAGE') {
        if (imgAspect < canvasAspect) {
          // Scale based on height
          drawHeight = height;
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
          scaleX = drawWidth / image.naturalWidth;
          scaleY = drawHeight / image.naturalHeight;
        } else {
          // Scale based on width
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
          scaleX = drawWidth / image.naturalWidth;
          scaleY = drawHeight / image.naturalHeight;
        }
      } else {
        // Default behavior if not runningMode IMAGE
        if (imgAspect < canvasAspect) {
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
          scaleX = drawWidth / image.naturalWidth;
          scaleY = drawHeight / image.naturalHeight;
        } else {
          drawWidth = height * imgAspect;
          drawHeight = height;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
          scaleX = drawWidth / image.naturalWidth;
          scaleY = drawHeight / image.naturalHeight;
        }
      }

      ctx.clearRect(0, 0, width, height);

      if (!isFlip) {
        // Draw image normally
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        // Apply horizontal flip
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
      }

      // Reset hitboxes for each draw
      hitboxesRef.current = [];

      // Function to calculate the centerX based on isFlip
      const calculateCenterX = (bboxOriginX: number, bboxWidth: number) => {
        if (isFlip) {
          return (
            width - (bboxOriginX * scaleX + offsetX + (bboxWidth * scaleX) / 2)
          );
        }
        return bboxOriginX * scaleX + offsetX + (bboxWidth * scaleX) / 2;
      };

      // Function to calculate labelX based on isFlip
      const calculateLabelX = (centerX: number) => {
        return centerX + 50;
      };

      const drawDetections = (
        detections: any, // Gunakan 'any' agar tidak perlu mendefinisikan tipe secara eksplisit
        section: string,
      ) => {
        if (!detections) return; // Jika detections null, keluar dari fungsi

        const { categories, boundingBox } = detections; // Ambil categories dan boundingBox dari deteksi langsung
        if (!categories || categories.length === 0 || !boundingBox) return; // Jika tidak ada kategori atau bounding box, keluar

        // Ambil kategori dengan skor tertinggi (jika ada lebih dari satu kategori)
        const category = categories.reduce((max: any, current: any) => {
          return current.score > max.score ? current : max;
        });

        const { categoryName } = category; // Nama kategori dengan skor tertinggi

        // Hitung pusat dari bounding box
        const centerX = calculateCenterX(
          boundingBox.originX,
          boundingBox.width,
        );
        const centerY =
          boundingBox.originY * scaleY +
          offsetY +
          (boundingBox.height * scaleY) / 2;

        // Gambar lingkaran di pusat deteksi
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "white"; // Lingkaran putih
        ctx.fill();
        ctx.closePath();

        // Posisi label
        const labelX = calculateLabelX(centerX);
        const labelY = centerY + 50;

        // Gambar garis dari pusat ke label
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = "white";
        ctx.stroke();

        // Gambar label
        ctx.font = "12px Arial";
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(categoryName, labelX, labelY - 5);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        // Gambar garis bawah pada label
        const textWidth = ctx.measureText(categoryName).width;
        const underlineEndX = labelX + textWidth;
        const underlineY = labelY + 5;

        ctx.beginPath();
        ctx.moveTo(labelX, labelY);
        ctx.lineTo(underlineEndX, underlineY);
        ctx.strokeStyle = "white";
        ctx.stroke();

        // Menambahkan item pada 'FindTheLookItem' dan hitboxes
        addFindTheLookItem({
          label: categoryName,
          section: "accessories",
        });

        hitboxesRef.current.push({
          label: categoryName,
          section: section,
          x: labelX,
          y: labelY - 20,
          width: textWidth,
          height: 20,
        });
      };

      // Draw each detection type only if the result is not null
      if (handResult) drawDetections(handResult, "accessories");
      if (ringResult) drawDetections(ringResult, "accessories");
      if (neckResult) drawDetections(neckResult, "accessories");
      if (earringResult) drawDetections(earringResult, "accessories");
      if (glassResult) drawDetections(glassResult, "accessories");
      if (headResult) drawDetections(headResult, "accessories");

      if (makeupResult) {
        // Handle Makeup Detections Separately
        makeupResult.detections.forEach((result) => {
          const { categories } = result;

          categories.forEach((category) => {
            let drawX: number, drawY: number, label: string;

            // Define specific landmarks for each makeup category
            if (
              category.categoryName === "Lipstick" &&
              faceLandmark &&
              faceLandmark[407]
            ) {
              drawX = isFlip
                ? width -
                  (faceLandmark[407].x * image.naturalWidth * scaleX + offsetX)
                : faceLandmark[407].x * image.naturalWidth * scaleX + offsetX;
              drawY =
                faceLandmark[407].y * image.naturalHeight * scaleY + offsetY;
              label = "Lipstick";

              const averageLipColor = extractSkinColor(
                image,
                faceLandmark,
                [
                  14, 15, 16, 17, 87, 86, 85, 84, 317, 316, 315, 314, 178, 179,
                  180, 317, 316, 315,
                ],
                2,
              );

              addFindTheLookItem({
                label: label,
                section: "makeup",
                color: averageLipColor.hexColor,
              });

              // Draw landmark point
              ctx.beginPath();
              ctx.arc(drawX, drawY, 10, 0, 2 * Math.PI);
              ctx.fillStyle = "white"; // Red color
              ctx.fill();
              ctx.closePath();

              // Calculate label position
              const labelX = calculateLabelX(drawX);
              const labelY = drawY + 50;

              // Draw a line from the center to the label
              ctx.beginPath();
              ctx.moveTo(drawX, drawY);
              ctx.lineTo(labelX, labelY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              // Display the label
              ctx.font = "12px Arial";
              ctx.fillStyle = "white";

              ctx.shadowColor = "black";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;

              ctx.fillText(label, labelX, labelY - 5);
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw underline for label text
              const textWidth = ctx.measureText(label).width;
              const underlineEndX = labelX + textWidth;
              const underlineY = labelY + 5;

              ctx.beginPath();
              ctx.moveTo(labelX, labelY);
              ctx.lineTo(underlineEndX, underlineY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              hitboxesRef.current.push({
                label: label,
                section: "makeup",
                x: labelX,
                y: labelY - 20,
                width: textWidth,
                height: 20,
              });
            }

            if (
              category.categoryName === "Eyebrown" &&
              faceLandmark &&
              faceLandmark[52]
            ) {
              drawX = isFlip
                ? width -
                  (faceLandmark[52].x * image.naturalWidth * scaleX + offsetX)
                : faceLandmark[52].x * image.naturalWidth * scaleX + offsetX;
              drawY =
                faceLandmark[52].y * image.naturalHeight * scaleY + offsetY;
              label = "Eyebrow";

              const averageEyebrowsColor = extractSkinColor(
                image,
                faceLandmark,
                [70, 63, 105, 66, 46, 53, 52, 65, 296, 334, 293, 295, 282, 283],
                2,
              );

              addFindTheLookItem({
                label: label,
                section: "makeup",
                color: averageEyebrowsColor.hexColor,
              });

              // Draw landmark point
              ctx.beginPath();
              ctx.arc(drawX, drawY, 10, 0, 2 * Math.PI);
              ctx.fillStyle = "white"; // Red color
              ctx.fill();
              ctx.closePath();

              // Calculate label position
              const labelX = calculateLabelX(drawX);
              const labelY = drawY + 50;

              // Draw a line from the center to the label
              ctx.beginPath();
              ctx.moveTo(drawX, drawY);
              ctx.lineTo(labelX, labelY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              // Display the label
              ctx.font = "12px Arial";
              ctx.fillStyle = "white";
              ctx.shadowColor = "black";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;

              ctx.fillText(label, labelX, labelY - 5);
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw underline for label text
              const textWidth = ctx.measureText(label).width;
              const underlineEndX = labelX + textWidth;
              const underlineY = labelY + 5;

              ctx.beginPath();
              ctx.moveTo(labelX, labelY);
              ctx.lineTo(underlineEndX, underlineY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              hitboxesRef.current.push({
                label: label,
                section: "makeup",
                x: labelX,
                y: labelY - 20,
                width: textWidth,
                height: 20,
              });
            }

            if (
              category.categoryName === "Blusher" &&
              faceLandmark &&
              faceLandmark[280]
            ) {
              drawX = isFlip
                ? width -
                  (faceLandmark[280].x * image.naturalWidth * scaleX + offsetX)
                : faceLandmark[280].x * image.naturalWidth * scaleX + offsetX;
              drawY =
                faceLandmark[280].y * image.naturalHeight * scaleY + offsetY;
              label = "Blusher";

              const averageBlushColor = extractSkinColor(
                image,
                faceLandmark,
                [280, 80],
                2,
              );

              addFindTheLookItem({
                label: label,
                section: "makeup",
                color: averageBlushColor.hexColor,
              });

              // Draw landmark point
              ctx.beginPath();
              ctx.arc(drawX, drawY, 10, 0, 2 * Math.PI);
              ctx.fillStyle = "white"; // Red color
              ctx.fill();
              ctx.closePath();

              // Calculate label position
              const labelX = calculateLabelX(drawX);
              const labelY = drawY + 50;

              // Draw a line from the center to the label
              ctx.beginPath();
              ctx.moveTo(drawX, drawY);
              ctx.lineTo(labelX, labelY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              // Display the label
              ctx.font = "12px Arial";
              ctx.fillStyle = "white";
              ctx.shadowColor = "black";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;

              ctx.fillText(label, labelX, labelY - 5);
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw underline for label text
              const textWidth = ctx.measureText(label).width;
              const underlineEndX = labelX + textWidth;
              const underlineY = labelY + 5;

              ctx.beginPath();
              ctx.moveTo(labelX, labelY);
              ctx.lineTo(underlineEndX, underlineY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              hitboxesRef.current.push({
                label: label,
                section: "makeup",
                x: labelX,
                y: labelY - 20,
                width: textWidth,
                height: 20,
              });
            }

            if (
              category.categoryName === "Eyeshadow" &&
              faceLandmark &&
              faceLandmark[257]
            ) {
              drawX = isFlip
                ? width -
                  (faceLandmark[257].x * image.naturalWidth * scaleX + offsetX)
                : faceLandmark[257].x * image.naturalWidth * scaleX + offsetX;
              drawY =
                faceLandmark[257].y * image.naturalHeight * scaleY + offsetY;
              label = "Eyeshadow";

              const averageEyeshadowColor = extractSkinColor(
                image,
                faceLandmark,
                [29, 27],
                2,
              );

              addFindTheLookItem({
                label: label,
                section: "makeup",
                color: averageEyeshadowColor.hexColor,
              });

              // Draw landmark point
              ctx.beginPath();
              ctx.arc(drawX, drawY, 10, 0, 2 * Math.PI);
              ctx.fillStyle = "white"; // Red color
              ctx.fill();
              ctx.closePath();

              // Calculate label position
              const labelX = calculateLabelX(drawX);
              const labelY = drawY + 50;

              // Draw a line from the center to the label
              ctx.beginPath();
              ctx.moveTo(drawX, drawY);
              ctx.lineTo(labelX, labelY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              // Display the label
              ctx.font = "12px Arial";
              ctx.fillStyle = "white";
              ctx.shadowColor = "black";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;

              ctx.fillText(label, labelX, labelY - 5);
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw underline for label text
              const textWidth = ctx.measureText(label).width;
              const underlineEndX = labelX + textWidth;
              const underlineY = labelY + 5;

              ctx.beginPath();
              ctx.moveTo(labelX, labelY);
              ctx.lineTo(underlineEndX, underlineY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              hitboxesRef.current.push({
                label: label,
                section: "makeup",
                x: labelX,
                y: labelY - 20,
                width: textWidth,
                height: 20,
              });
            }

            if (
              category.categoryName === "Mascara" &&
              faceLandmark &&
              faceLandmark[386]
            ) {
              drawX = isFlip
                ? width -
                  (faceLandmark[386].x * image.naturalWidth * scaleX + offsetX)
                : faceLandmark[386].x * image.naturalWidth * scaleX + offsetX;
              drawY =
                faceLandmark[386].y * image.naturalHeight * scaleY + offsetY;
              label = "Mascara";

              const averageEyeshadowColor = extractSkinColor(
                image,
                faceLandmark,
                [29, 27],
                2,
              );

              addFindTheLookItem({
                label: label,
                section: "makeup",
                color: averageEyeshadowColor.hexColor,
              });

              // Draw landmark point
              ctx.beginPath();
              ctx.arc(drawX, drawY, 10, 0, 2 * Math.PI);
              ctx.fillStyle = "white"; // Red color
              ctx.fill();
              ctx.closePath();

              // Calculate label position
              const labelX = calculateLabelX(drawX);
              const labelY = drawY + 50;

              // Draw a line from the center to the label
              ctx.beginPath();
              ctx.moveTo(drawX, drawY);
              ctx.lineTo(labelX, labelY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              // Display the label
              ctx.font = "12px Arial";
              ctx.fillStyle = "white";
              ctx.shadowColor = "black";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;

              ctx.fillText(label, labelX, labelY - 5);
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw underline for label text
              const textWidth = ctx.measureText(label).width;
              const underlineEndX = labelX + textWidth;
              const underlineY = labelY + 5;

              ctx.beginPath();
              ctx.moveTo(labelX, labelY);
              ctx.lineTo(underlineEndX, underlineY);
              ctx.strokeStyle = "white";
              ctx.stroke();

              hitboxesRef.current.push({
                label: label,
                section: "makeup",
                x: labelX,
                y: labelY - 20,
                width: textWidth,
                height: 20,
              });
            }
          });
        });
      }
    };

    drawImage();
    window.addEventListener("resize", drawImage);

    return () => {
      window.removeEventListener("resize", drawImage);
    };
  }, [
    image,
    canvasRef,
    handResult,
    ringResult,
    neckResult,
    earringResult,
    glassResult,
    headResult,
    makeupResult,
    faceLandmark,
    isFlip,
  ]);

  // Handle click events on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas tidak ditemukan untuk menambahkan event listener.");
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = ((event.clientX - rect.left) * scaleX) / dpr;
      const y = ((event.clientY - rect.top) * scaleY) / dpr;

      let labelClicked: string | null = null;
      let sectionClicked: string | null = null;
      let hitboxFound = false; // Track if a hitbox is found

      for (const bbox of hitboxesRef.current) {
        if (
          x >= bbox.x &&
          x <= bbox.x + bbox.width &&
          y >= bbox.y &&
          y <= bbox.y + bbox.height
        ) {
          labelClicked = bbox.label;
          sectionClicked = bbox.section;
          hitboxFound = true; // A hitbox was clicked
          break;
        }
      }

      if (!hitboxFound) {
        // No hitbox clicked, set to null
        labelClicked = null;
        sectionClicked = null;
      }

      if (onLabelClick) {
        onLabelClick(labelClicked, sectionClicked); // Pass both label and section
      }
    };

    canvas.addEventListener("click", handleClick);
    console.log("Event listener untuk klik telah ditambahkan.");

    return () => {
      canvas.removeEventListener("click", handleClick);
      console.log("Event listener untuk klik telah dihapus.");
    };
  }, [onLabelClick]);

  return null;
}
