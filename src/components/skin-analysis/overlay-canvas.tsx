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
          image.naturalWidth,
          image.naturalHeight,
          50, // Threshold diperbesar menjadi 50
        );

        const validLabels = [
          "spots",
          "acne",
          "blackhead",
          "whitehead",
          "texture",
        ];

        // Store occupied areas to check for overlaps
        const occupiedAreas: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
        }> = [];

        // Calculate all centers first to prepare for label placement
        const centers: Array<{
          centerX: number;
          centerY: number;
          label: string;
          score: number;
        }> = [];

        adjustedResults.forEach((bbox) => {
          const [leftIndex, topIndex, rightIndex, bottomIndex] = bbox.box;
          if (
            leftIndex === null ||
            topIndex === null ||
            rightIndex === null ||
            bottomIndex === null
          ) {
            return;
          }

          // Calculate center positions
          const centerX =
            ((landmarks[leftIndex].x + landmarks[rightIndex].x) / 2) *
              drawWidth +
            offsetX;
          const centerY =
            ((landmarks[topIndex].y + landmarks[bottomIndex].y) / 2) *
              drawHeight +
            offsetY;

          centers.push({
            centerX,
            centerY,
            label: bbox.label,
            score: bbox.score,
          });
        });

        // Sort centers from top to bottom, left to right to handle placement better
        centers.sort((a, b) => {
          if (Math.abs(a.centerY - b.centerY) > 30) {
            return a.centerY - b.centerY;
          }
          return a.centerX - b.centerX;
        });

        // Font settings for measurement
        ctx.font = "12px Arial";
        const textHeight = 20; // Approximate text height
        const padding = 5; // Padding around labels

        // Draw all centers and labels with collision avoidance
        centers.forEach(({ centerX, centerY, label, score }) => {
          const rgbColor = featureColors[label] || "255, 255, 255";

          // Draw the highlight gradient
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

          // Measure text width for this label
          const textWidth = ctx.measureText(`${label} ${score}%`).width;

          // Starting position - always bottom right
          const baseOffsetX = 25;
          const baseOffsetY = 25;

          // Initial position
          let labelX = centerX + baseOffsetX;
          let labelY = centerY + baseOffsetY;

          // Find minimum vertical offset needed to avoid collisions
          let minVerticalOffset = 0;
          let horizontalOffset = 0;

          // First, check if default position has collision
          const checkCollision = (testX: number, testY: number) => {
            const testArea = {
              x: testX - padding,
              y: testY - textHeight - padding,
              width: textWidth + padding * 2,
              height: textHeight + padding * 2,
            };

            for (const area of occupiedAreas) {
              if (
                testArea.x < area.x + area.width &&
                testArea.x + testArea.width > area.x &&
                testArea.y < area.y + area.height &&
                testArea.y + testArea.height > area.y
              ) {
                return true; // Collision detected
              }
            }
            return false; // No collision
          };

          // Check default position first
          if (!checkCollision(labelX, labelY)) {
            // No collision at default position - great!
          } else {
            // Try to find minimal vertical offset
            // First try small increments to keep labels close
            for (let offset = 5; offset <= 100; offset += 5) {
              if (!checkCollision(labelX, centerY + baseOffsetY + offset)) {
                minVerticalOffset = offset;
                break;
              }
            }

            // If still colliding, try horizontal offset
            if (minVerticalOffset === 0) {
              for (let hOffset = 10; hOffset <= 100; hOffset += 10) {
                if (!checkCollision(labelX + hOffset, labelY)) {
                  horizontalOffset = hOffset;
                  break;
                }

                // Try combinations of horizontal and minimal vertical offsets
                for (let vOffset = 5; vOffset <= 30; vOffset += 5) {
                  if (
                    !checkCollision(
                      labelX + hOffset,
                      centerY + baseOffsetY + vOffset,
                    )
                  ) {
                    horizontalOffset = hOffset;
                    minVerticalOffset = vOffset;
                    break;
                  }
                }

                if (horizontalOffset > 0) break;
              }
            }

            // If all above fails, use more aggressive spacing as last resort
            if (minVerticalOffset === 0 && horizontalOffset === 0) {
              // Start with larger vertical jumps
              for (let offset = 15; offset <= 200; offset += 15) {
                if (!checkCollision(labelX, centerY + baseOffsetY + offset)) {
                  minVerticalOffset = offset;
                  break;
                }
              }

              // If still no solution, combine larger horizontal and vertical offsets
              if (minVerticalOffset === 0) {
                horizontalOffset = 50;
                minVerticalOffset = 10;
              }
            }
          }

          // Apply the calculated offsets
          labelX += horizontalOffset;
          labelY = centerY + baseOffsetY + minVerticalOffset;

          // Add this label's area to occupied areas
          occupiedAreas.push({
            x: labelX - padding,
            y: labelY - textHeight - padding,
            width: textWidth + padding * 2,
            height: textHeight + padding * 2,
          });

          // Draw the label and line
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(labelX, labelY);
          ctx.strokeStyle = "white";
          ctx.stroke();

          // Draw text with shadow
          ctx.shadowColor = "black";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = "white";
          ctx.fillText(`${label} ${score}%`, labelX, labelY - 5);

          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Draw underline
          const underlineEndX = labelX + textWidth;
          const underlineY = labelY;

          ctx.beginPath();
          ctx.moveTo(labelX, labelY);
          ctx.lineTo(underlineEndX, underlineY);
          ctx.strokeStyle = "white";
          ctx.stroke();

          // Store label for click detection
          labelBoundingBoxesRef.current.push({
            label: label,
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
