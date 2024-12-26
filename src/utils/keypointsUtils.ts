import { mapPointToRenderedVideo } from "./mapping";

export function drawKeypoints(
  keypoints: any[], // Replace with actual type
  video: HTMLVideoElement | HTMLImageElement,
  videoRect: DOMRect,
  flipped: boolean,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null,
) {
  keypoints.forEach((keypoint, index) => {
    const mappedPoint = mapPointToRenderedVideo(
      keypoint,
      video,
      videoRect,
      flipped,
    );

    // Ensure keypoint is within canvas bounds
    if (
      mappedPoint.x >= 0 &&
      mappedPoint.x <= canvas.width &&
      mappedPoint.y >= 0 &&
      mappedPoint.y <= canvas.height
    ) {
      if (ctx) {
        ctx.fillStyle = "blue"; // Change color for visibility
        ctx.beginPath();
        ctx.arc(mappedPoint.x, mappedPoint.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      console.warn(`Keypoint ${index} is out of bounds:`, mappedPoint);
    }
  });
}
