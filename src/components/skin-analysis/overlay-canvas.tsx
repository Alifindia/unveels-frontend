import React, { useEffect, useRef } from "react";
import { Landmark } from "../../types/landmark";
import { BboxLandmark } from "../../types/bboxLandmark";
import { adjustBoundingBoxes } from "../../utils/boundingBoxUtils";
import { skinAnalysisDataItem } from "../../utils/constants";
import { FaceResults } from "../../types/faceResults";

interface OverlayCanvasProps {
  image: HTMLImageElement;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  data: FaceResults[];
  landmarks: Landmark[];
  onLabelClick?: (label: string | null) => void; // Diperbarui
}

interface LabelBoundingBox {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function OverlayCanvas({
  image,
  canvasRef,
  data,
  landmarks,
  onLabelClick,
}: OverlayCanvasProps) {
  const featureColors: { [key: string]: string } = {
    spots: "255, 0, 0", // Merah
    acne: "9, 183, 26", // Hijau
    blackhead: "0, 0, 0", // Hitam
    pore: "0, 0, 255", // Biru
  };

  const innerRadius = 0;
  const outerRadius = 10;

  const labelBoundingBoxesRef = useRef<LabelBoundingBox[]>([]);

  useEffect(() => {
    const drawImage = () => {
      console.log(skinAnalysisDataItem);

      if (landmarks.length === 0) return;

      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error("Canvas tidak ditemukan.");
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.error("Gagal mendapatkan konteks 2D untuk overlay canvas.");
          return;
        }

        const { innerWidth: width, innerHeight: height } = window;
        const dpr = window.devicePixelRatio || 1;

        ctx.setTransform(-1, 0, 0, 1, width * dpr, 0); // Flip the canvas horizontally

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

        labelBoundingBoxesRef.current = [];

        const adjustedResults: BboxLandmark[] = adjustBoundingBoxes(
          data,
          landmarks as Landmark[],
          640,
          640,
          50, // Threshold diperbesar menjadi 50
        );

        const validLabels = [
          "spots",
          "acne",
          "blackhead",
          "whitehead",
          "texture",
        ];

        adjustedResults.forEach((bbox) => {
          if (!validLabels.includes(bbox.label)) return;

          const [leftIndex, topIndex, rightIndex, bottomIndex] = bbox.box;
          if (
            leftIndex === null ||
            topIndex === null ||
            rightIndex === null ||
            bottomIndex === null
          ) {
            return;
          }

          // Calculate center positions without mirroring for landmarks and labels
          const centerX =
            ((landmarks[leftIndex].x + landmarks[rightIndex].x) / 2) *
              drawWidth +
            offsetX;
          const centerY =
            ((landmarks[topIndex].y + landmarks[bottomIndex].y) / 2) *
              drawHeight +
            offsetY;

          const rgbColor = featureColors[bbox.label] || "255, 255, 255";

          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            innerRadius,
            centerX,
            centerY,
            outerRadius,
          );
          gradient.addColorStop(0, `rgba(${rgbColor}, 0.8)`);
          gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);

          ctx.fillStyle = gradient;

          // Draw the landmark circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();

          // Draw the label and line (not mirrored)
          const labelX = centerX + 50;
          const labelY = centerY + 50;

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(labelX, labelY);
          ctx.strokeStyle = "white";
          ctx.stroke();

          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(bbox.label, labelX, labelY - 5);

          const textWidth = ctx.measureText(bbox.label).width;
          const underlineEndX = labelX + textWidth;
          const underlineY = labelY + 5;

          ctx.beginPath();
          ctx.moveTo(labelX, labelY);
          ctx.lineTo(underlineEndX, underlineY);
          ctx.strokeStyle = "white";
          ctx.stroke();

          labelBoundingBoxesRef.current.push({
            label: bbox.label,
            x: labelX,
            y: labelY - 20,
            width: textWidth,
            height: 20,
          });
        });

        skinAnalysisDataItem.forEach((dataItem) => {
          const rgbColor = featureColors[dataItem.label] || "255, 255, 255";

          // Calculate center position for each landmark point
          const centerX = landmarks[dataItem.point].x * drawWidth + offsetX;
          const centerY = landmarks[dataItem.point].y * drawHeight + offsetY;

          // Create a gradient for each data point
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            innerRadius,
            centerX,
            centerY,
            outerRadius,
          );

          gradient.addColorStop(0, `rgba(${rgbColor}, 0.8)`);
          gradient.addColorStop(1, `rgba(${rgbColor}, 0)`);

          ctx.fillStyle = gradient;

          // Draw outer circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();

          // Draw small white center dot
          ctx.beginPath();
          ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
          ctx.fillStyle = "white";
          ctx.fill();
          ctx.closePath();

          // Position label text slightly offset from center position
          const labelX = centerX + 50;
          const labelY = centerY + 50;

          // Draw line from center to label
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(labelX, labelY);
          ctx.strokeStyle = "white";
          ctx.stroke();

          // Draw label text
          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(dataItem.label, labelX, labelY - 5);

          // Draw underline for label text
          const textWidth = ctx.measureText(dataItem.label).width;
          const underlineEndX = labelX + textWidth;
          const underlineY = labelY + 5;

          ctx.beginPath();
          ctx.moveTo(labelX, labelY);
          ctx.lineTo(underlineEndX, underlineY);
          ctx.strokeStyle = "white";
          ctx.stroke();

          // Store label bounding box for click detection
          labelBoundingBoxesRef.current.push({
            label: dataItem.label,
            x: labelX,
            y: labelY - 20,
            width: textWidth,
            height: 20,
          });
        });

        console.log("Adjusted Results:", adjustedResults);
        console.log("Label Bounding Boxes:", labelBoundingBoxesRef.current);
      } catch (error) {
        console.error("Failed Detect Landmark: ", error);
      }
    };

    drawImage();
    const resizeListener = () => drawImage();
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
    };
  }, [image, data, landmarks]);

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

      for (const bbox of labelBoundingBoxesRef.current) {
        if (
          x >= bbox.x &&
          x <= bbox.x + bbox.width &&
          y >= bbox.y &&
          y <= bbox.y + bbox.height
        ) {
          labelClicked = bbox.label;
          break;
        }
      }

      if (onLabelClick) {
        onLabelClick(labelClicked);
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

export default OverlayCanvas;
