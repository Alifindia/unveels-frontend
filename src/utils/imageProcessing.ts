import {
  calculateAverageColor,
  classifySkinType,
  rgbToHex,
  SkinType,
} from "./colorUtils"; // Pastikan path ini benar
import { Landmark } from "../types/landmark";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as tflite from "@tensorflow/tfjs-tflite";

/**
 * Calculates the average brightness of the video frame.
 */
export const calculateLighting = async (
  video: HTMLVideoElement | HTMLImageElement,
): Promise<number> => {
  const offscreenCanvas = document.createElement("canvas");
  const ctx = offscreenCanvas.getContext("2d");
  if (!ctx) return 0;

  const width = 160; // Reduced resolution for performance
  const height = 120;
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  ctx.drawImage(video, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let total = 0;
  const numPixels = width * height;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    total += luminance;
  }

  return total / numPixels;
};

/**
 * Crops the captured image based on the bounding box.
 */
export const cropImage = (
  imageSrc: string,
  box: { x: number; y: number; width: number; height: number },
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = box.width;
      canvas.height = box.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }
      ctx.drawImage(
        img,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        box.width,
        box.height,
      );
      const croppedImageSrc = canvas.toDataURL("image/jpeg");
      resolve(croppedImageSrc);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = imageSrc;
  });
};

/**
 * Fungsi untuk mengkonversi string base64 menjadi objek Image
 * @param {string} base64Str - String base64 gambar
 * @returns {Promise<HTMLImageElement>} - Promise yang menghasilkan objek Image
 */
export const base64ToImage = async (
  base64Str: string,
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `${base64Str}`;
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Gagal memuat gambar."));
  });
};

// Function to compute Convex Hull using Andrew's Monotone Chain algorithm
export function computeConvexHull(points: [number, number][]) {
  points.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ) => {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  };

  const lower: [number, number][] = [];
  for (let point of points) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: [number, number][] = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Mengekstrak warna kulit dari landmark tertentu.
 * @param image - Gambar yang dimuat.
 * @param landmarks - Array dari koordinat {x, y, z} yang dinormalisasi.
 */
export const extractSkinColor = (
  image: HTMLImageElement,
  landmarks: Landmark[],
  landmarkIndices: number[],
  samplingRadius: number = 5,
): { hexColor: string; skinType: SkinType } => {
  // Definisikan indeks landmark untuk ekstraksi warna kulit
  const targetLandmarkIndices = landmarkIndices;

  // Buat canvas off-screen untuk mengakses data piksel
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error(
      "Gagal mendapatkan konteks canvas untuk ekstraksi warna kulit.",
    );
    return { hexColor: "", skinType: "Medium Skin" };
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const sampledColors: Array<{ r: number; g: number; b: number }> = [];

  targetLandmarkIndices.forEach((index) => {
    const landmark = landmarks[index];
    if (!landmark) {
      console.warn(`Indeks landmark ${index} tidak ditemukan.`);
      return { hexColor: "", skinType: "Medium Skin" };
    }

    const { x: normX, y: normY } = landmark;
    const x = Math.round(normX * canvas.width);
    const y = Math.round(normY * canvas.height);

    // Sampling area persegi di sekitar landmark
    for (let dx = -samplingRadius; dx <= samplingRadius; dx++) {
      for (let dy = -samplingRadius; dy <= samplingRadius; dy++) {
        const sampleX = x + dx;
        const sampleY = y + dy;

        // Pastikan koordinat sampling berada dalam batas gambar
        if (
          sampleX < 0 ||
          sampleX >= canvas.width ||
          sampleY < 0 ||
          sampleY >= canvas.height
        ) {
          continue;
        }

        const pixelIndex = (sampleY * canvas.width + sampleX) * 4;
        const r = imageData[pixelIndex];
        const g = imageData[pixelIndex + 1];
        const b = imageData[pixelIndex + 2];
        const a = imageData[pixelIndex + 3];

        // Opsional: filter piksel transparan atau bukan kulit
        if (a < 128) continue; // Lewati piksel semi-transparan

        sampledColors.push({ r, g, b });
      }
    }
  });

  if (sampledColors.length === 0) {
    console.warn(
      "Tidak ada warna yang disampling untuk ekstraksi warna kulit.",
    );
    return { hexColor: "", skinType: "Medium Skin" };
  }

  // Hitung warna rata-rata
  const avgColor = calculateAverageColor(sampledColors);
  const hexColor = rgbToHex(avgColor.r, avgColor.g, avgColor.b);

  // Klasifikasikan tipe kulit
  const skinType = classifySkinType(avgColor);

  // Perbarui konteks
  return { hexColor, skinType };
};

export const preprocess = (
  source: HTMLImageElement,
  modelWidth: number,
  modelHeight: number,
): [tf.Tensor, number, number] => {
  let xRatio: number = 0;
  let yRatio: number = 0;

  const input: tf.Tensor = tf.tidy(() => {
    let input;
    const img = tf.browser.fromPixels(source);

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2); // get source width and height
    const maxSize = Math.max(w, h); // get max size
    input = tf.pad(img, [
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]);

    xRatio = maxSize / w; // update xRatio
    yRatio = maxSize / h; // update yRatio

    input = tf.image.resizeBilinear(input, [modelWidth, modelHeight]);
    input = tf.cast(input, "float32");
    input = tf.div(input, 255.0);
    input = tf.expandDims(input);

    return input;
  });

  return [input, xRatio, yRatio];
};
