import { mapBoxToRenderedVideo } from "./mapping";
import { FaceResults } from "../types/faceResults";
import { Landmark } from "../types/landmark";
import { BboxLandmark } from "../types/bboxLandmark";
import { MappedBox } from "../types/mappedBox";

export function processBoundingBox(
  box: any, // Replace with actual type
  video: HTMLVideoElement | HTMLImageElement,
  videoRect: DOMRect,
  flipped: boolean,
  setBoundingBox: (box: MappedBox) => void,
  isDebugMode: boolean,
  ctx: CanvasRenderingContext2D | null,
): { relativePosition: { x: number; y: number } } {
  const mappedBox = mapBoxToRenderedVideo(box, video, videoRect, flipped);
  setBoundingBox(mappedBox);

  if (isDebugMode && ctx) {
    drawBoundingBox(ctx, mappedBox);
  }

  const faceCenter = {
    x: mappedBox.x + mappedBox.width / 2,
    y: mappedBox.y + mappedBox.height / 2,
  };
  const frameCenter = {
    x: videoRect.width / 2,
    y: videoRect.height / 2,
  };
  const relativePosition = {
    x: faceCenter.x - frameCenter.x,
    y: faceCenter.y - frameCenter.y,
  };

  return { relativePosition };
}

function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
) {
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
}

// Fungsi adjustBoundingBoxes yang telah diperbarui
export function adjustBoundingBoxes(
  data: FaceResults[],
  landmarks: Landmark[],
  imageWidth: number,
  imageHeight: number,
  threshold: number = 50, // Threshold diperbesar menjadi 50
): BboxLandmark[] {
  const adjustedResults: BboxLandmark[] = [];

  data.forEach((result, index) => {
    const [origX, origY, origWidth, origHeight] = result.box;

    // Swap x dan y, serta width dan height sesuai dengan output YOLO
    const x = origY;
    const y = origX;
    const boxWidth = origHeight;
    const boxHeight = origWidth;

    // Titik referensi
    const leftX = x;
    const leftY = y + boxHeight / 2;

    const topX = x + boxWidth / 2;
    const topY = y;

    const rightX = x + boxWidth;
    const rightY = y + boxHeight / 2;

    const bottomX = x + boxWidth / 2;
    const bottomY = y + boxHeight;

    // Fungsi untuk mencari landmark terdekat ke suatu titik dengan ambang batas dan mengembalikan indeks
    const findNearestLandmark = (
      refX: number,
      refY: number,
      threshold: number,
      landmarks: Landmark[],
    ): { nearest: Landmark | null; distance: number; index: number | null } => {
      let minDist = Infinity;
      let nearest: Landmark | null = null;
      let nearestIndex: number | null = null;

      landmarks.forEach((landmark, idx) => {
        const landmarkX = landmark.x * imageWidth;
        const landmarkY = landmark.y * imageHeight;
        const dist = Math.sqrt(
          Math.pow(landmarkX - refX, 2) + Math.pow(landmarkY - refY, 2),
        );
        if (dist < minDist && dist <= threshold) {
          minDist = dist;
          nearest = landmark;
          nearestIndex = idx;
        }
      });

      return { nearest, distance: minDist, index: nearestIndex };
    };

    const nearestLeft = findNearestLandmark(leftX, leftY, threshold, landmarks);
    const nearestTop = findNearestLandmark(topX, topY, threshold, landmarks);
    const nearestRight = findNearestLandmark(
      rightX,
      rightY,
      threshold,
      landmarks,
    );
    const nearestBottom = findNearestLandmark(
      bottomX,
      bottomY,
      threshold,
      landmarks,
    );

    // Membuat rectangle berdasarkan landmark terdekat
    if (
      nearestLeft.nearest &&
      nearestTop.nearest &&
      nearestRight.nearest &&
      nearestBottom.nearest
    ) {
      adjustedResults.push({
        box: [
          nearestLeft.index!,
          nearestTop.index!,
          nearestRight.index!,
          nearestBottom.index!,
        ],
        class: result.class,
        label: result.label,
        color: result.color,
        score: result.score,
      });

      // Contoh penggunaan indeks
      console.log(`Adjusted Bounding Box for ${result.label}:`);
      console.log(`Left Landmark Index: ${nearestLeft.index}`);
      console.log(`Top Landmark Index: ${nearestTop.index}`);
      console.log(`Right Landmark Index: ${nearestRight.index}`);
      console.log(`Bottom Landmark Index: ${nearestBottom.index}`);
    }

    console.log(
      `Label: ${result.label} , BBox ${index + 1}: 
      x=${x}, y=${y}, boxWidth=${boxWidth}, boxHeight=${boxHeight}, 
      Nearest Left Landmark: x=${nearestLeft.nearest?.x.toFixed(2)}, y=${nearestLeft.nearest?.y.toFixed(2)}, Distance=${nearestLeft.distance.toFixed(2)}, Index=${nearestLeft.index}, 
      Nearest Top Landmark: x=${nearestTop.nearest?.x.toFixed(2)}, y=${nearestTop.nearest?.y.toFixed(2)}, Distance=${nearestTop.distance.toFixed(2)}, Index=${nearestTop.index}, 
      Nearest Right Landmark: x=${nearestRight.nearest?.x.toFixed(2)}, y=${nearestRight.nearest?.y.toFixed(2)}, Distance=${nearestRight.distance.toFixed(2)}, Index=${nearestRight.index}, 
      Nearest Bottom Landmark: x=${nearestBottom.nearest?.x.toFixed(2)}, y=${nearestBottom.nearest?.y.toFixed(2)}, Distance=${nearestBottom.distance.toFixed(2)}, Index=${nearestBottom.index}`,
    );
  });

  return adjustedResults;
}
