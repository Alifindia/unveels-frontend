// src/workers/scannerWorker.ts

import { Landmark } from "../types/landmark";
import { faces } from "../utils/constants";
import {
  applyStretchedLandmarks,
  clamp,
  drawConnectorsFromFaces,
} from "../utils/scannerUtils";

// Interface untuk pesan yang diterima dari main thread
interface WorkerMessage {
  imageData: ImageBitmap;
  width: number;
  height: number;
  canvas: OffscreenCanvas;
  landmarks: Landmark[];
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { imageData, width, height, canvas, landmarks } = event.data;

  let glowOffset = 0;
  const glowSpeed = 0.03;

  if (!(canvas instanceof OffscreenCanvas)) {
    console.error("Canvas yang diterima bukan OffscreenCanvas.");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Gagal mendapatkan konteks 2D untuk OffscreenCanvas.");
    return;
  }

  // Perhitungan ukuran dan posisi gambar dengan mempertimbangkan offset
  const imgAspect = imageData.width / imageData.height;
  const canvasAspect = width / height;

  let drawWidth, drawHeight, offsetX, offsetY;

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

  // Gambar gambar awal dengan transformasi dan offset
  const drawImageWithTransform = () => {
    ctx.save(); // Simpan state canvas
    // Gambar tanpa flip
    ctx.drawImage(
      imageData,
      offsetX, // Offset X langsung digunakan
      offsetY,
      drawWidth,
      drawHeight,
    );
    ctx.restore(); // Pulihkan state canvas
  };

  const animateScanner = () => {
    ctx.clearRect(0, 0, width, height); // Bersihkan canvas
    ctx.imageSmoothingEnabled = false;

    // Gambar gambar awal dengan transformasi dan offset
    drawImageWithTransform();

    glowOffset += glowSpeed;
    if (glowOffset > 1.5) glowOffset = 0;

    const faceLandmarks = applyStretchedLandmarks(landmarks);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    // Pastikan semua nilai berada dalam rentang [0, 1]
    gradient.addColorStop(
      clamp(glowOffset - 0.1, 0, 1),
      "rgba(42, 96, 176, 0.1)",
    );
    gradient.addColorStop(clamp(glowOffset, 0, 1), "rgba(44, 98, 180, 0.46)");
    gradient.addColorStop(
      clamp(glowOffset + 0.1, 0, 1),
      "rgba(42, 96, 176, 0.1)",
    );

    // Gambar landmarks dengan warna gradient  // Gambar connectors berdasarkan `faces`
    drawConnectorsFromFaces(
      faceLandmarks,
      gradient,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
      faces,
      ctx,
    );

    // Minta frame berikutnya
    self.requestAnimationFrame(animateScanner);
  };

  // Mulai animasi
  animateScanner();
};
