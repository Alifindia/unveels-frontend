import * as tf from "@tensorflow/tfjs";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";
import { FaceResults } from "../types/faceResults";
import { ImageSegmenter } from "@mediapipe/tasks-vision";
const labels = [
  "acne",
  "blackhead",
  "dark circles",
  "droopy lower eyelid",
  "droopy upper eyelid",
  "dry",
  "eyebags",
  "moisture",
  "oily",
  "pores",
  "redness",
  "spots",
  "whitehead",
  "wrinkles",
]

export const renderBoxes = (
  ctx: CanvasRenderingContext2D,
  boxesToDraw: FaceResults[]
): void => {
  // font configs
  const font = `10px Roboto, sans-serif`;
  ctx.font = font;
  ctx.textBaseline = "top";

  boxesToDraw.forEach((detection: FaceResults) => {
    // filter based on class threshold
    const score = Math.ceil(detection.score * 100);

    const [y1, x1, height, width] = detection.box;

    // draw border box
    // ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
    // ctx.strokeRect(x1, y1, width, height);

    const [x2, y2] = [x1 + width / 2, y1 + height / 2,];
    ctx.beginPath();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.arc(x2, y2, 5, 0, 2 * Math.PI);
    ctx.moveTo(x2 + 3, y2 + 3);
    ctx.lineTo(x2 + 30, (y2 - (7 + ctx.lineWidth)) + 30);
    ctx.stroke();

    ctx.stroke();
    // Draw the label background
    // ctx.fillStyle = detection.color;
    // const textWidth = ctx.measureText(`${detection.label} - ${score}%`).width;
    const textHeight = parseInt(font, 7); // base 10
    const yText = (y2 - (textHeight + ctx.lineWidth)) + 30;
    // ctx.fillRect(
    //   x1 - 1,
    //   yText < 0 ? 0 : yText, // handle overflow label box
    //   textWidth + ctx.lineWidth,
    //   textHeight + ctx.lineWidth
    // );

    // Draw labels
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `${detection.label} - ${score}%`,
      x2 + 30,
      yText < 0 ? 0 : yText
    );
  });
};

export class Colors {
  private readonly palette: string[];
  private readonly n: number;

  /**
   * Create a new Colors instance with the ultralytics color palette
   * https://ultralytics.com/
   */
  constructor() {
    this.palette = [
      "#F72585", // acne
      "#4A4A4A", // blackhead
      "#6B13B1", // dark circle
      "#14A086", // droopy lower eyelid
      "#F72585", // droopy upper eyelid
      "#FFE4B5", // dry
      "#00E0FF", // eyebag
      "#5DD400", // moistures
      "#B5179E", // oily
      "#F4EB24", // pore
      "#BD8EFF", // skinredness
      "#0F38CC", // spots
      "#FFFFFF", // whitehead
      "#00FF38", // wrinkles
    ];
    this.n = this.palette.length;
  }

  /**
   * Get color for given index
   * @param {number} i Index to get color for
   * @returns {string} Color in hex format
   */
  get = (i: number): string => {
    return this.palette[Math.floor(i) % this.n];
  };

  /**
   * Convert hex color to RGB array
   * @param {string} hex Hex color string
   * @param {number} [alpha] Optional alpha value
   * @returns {number[] | null} RGB array or null if invalid hex
   */
  static hexToRgba = (hex: string, alpha?: number): number[] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
      : null;
  };
}

interface Model {
  net: tf.GraphModel;
  inputShape: number[];
  outputShape: tf.Shape[];
}

const numClass: number = labels.length;
const colors = new Colors();

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {number} modelWidth
 * @param {number} modelHeight
 * @returns input tensor, xRatio and yRatio
 * @throws {Error} If source is invalid or tensor operations fail
 */
const preprocess = (
  source: HTMLVideoElement | HTMLImageElement,
  modelWidth: number,
  modelHeight: number
): [tf.Tensor4D, number, number] => {
  if (!source.width || !source.height) {
    throw new Error("Source element has no dimensions");
  }

  // Initialize variables with default values
  let xRatio = 1;
  let yRatio = 1;
  let input: tf.Tensor4D | null = null;

  try {
    input = tf.tidy(() => {
      const img = tf.browser.fromPixels(source);
      if (!img) {
        throw new Error("Failed to create tensor from source");
      }

      const [h, w] = img.shape.slice(0, 2);
      const maxSize = Math.max(w, h);

      // Calculate ratios before padding
      xRatio = maxSize / w;
      yRatio = maxSize / h;

      const imgPadded = img.pad([
        [0, maxSize - h],
        [0, maxSize - w],
        [0, 0],
      ]) as tf.Tensor3D;

      return tf.image
        .resizeBilinear(imgPadded, [modelWidth, modelHeight])
        .div(255.0)
        .expandDims(0) as tf.Tensor4D;
    });

    if (!input) {
      throw new Error("Failed to preprocess image");
    }

    return [input, xRatio, yRatio];
  } catch (error) {
    // Clean up if there's an error
    if (input) {
      input.dispose();
    }
    throw error;
  }
};

/**
 * Function to detect image.
 * @param {HTMLImageElement|HTMLVideoElement} source Source
 * @param {Model} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 * @param {() => void} callback Callback function to run after detect frame is done
 * @throws {Error} If any required element is null or operation fails
 */
export const detectFrame = async (
  source: HTMLImageElement | HTMLVideoElement,
  model: Model,
  canvasRef: HTMLCanvasElement,
  callback: () => void = () => { }
): Promise<[FaceResults[], SkinAnalysisResult[]]> => {
  if (!model?.net || !model.inputShape || !model.outputShape) {
    throw new Error("Invalid model structure");
  }

  const [modelHeight, modelWidth] = model.inputShape.slice(1, 3);
  const [modelSegHeight, modelSegWidth, modelSegChannel] = model.outputShape[1]?.slice(1) ?? [];

  if (!modelHeight || !modelWidth || !modelSegHeight || !modelSegWidth || !modelSegChannel) {
    throw new Error("Invalid model dimensions");
  }

  tf.engine().startScope();

  try {
    const [input, xRatio, yRatio] = preprocess(source, modelWidth, modelHeight);

    const res = model.net.execute(input) as tf.Tensor[];
    if (!res || res.length < 2) {
      throw new Error("Model execution failed");
    }

    const transRes = tf.tidy(() => {
      const result = res[0].transpose([0, 2, 1])?.squeeze() as tf.Tensor2D;
      if (!result) throw new Error("Failed to transpose main result");
      return result;
    });

    const transSegMask = tf.tidy(() => {
      const result = res[1].transpose([0, 3, 1, 2])?.squeeze() as tf.Tensor3D;
      if (!result) throw new Error("Failed to transpose segmentation mask");
      return result;
    });

    const boxes = tf.tidy(() => {
      const w = transRes.slice([0, 2], [-1, 1]);
      const h = transRes.slice([0, 3], [-1, 1]);
      const x1 = tf.sub(transRes.slice([0, 0], [-1, 1]), tf.div(w, 2));
      const y1 = tf.sub(transRes.slice([0, 1], [-1, 1]), tf.div(h, 2));

      if (!w || !h || !x1 || !y1) {
        throw new Error("Failed to compute boxes");
      }

      return tf.concat(
        [y1, x1, tf.add(y1, h), tf.add(x1, w)],
        1
      ).squeeze() as tf.Tensor2D;
    });

    if (!boxes) {
      throw new Error("Failed to create boxes tensor");
    }

    const [scores, classes] = tf.tidy(() => {
      const rawScores = transRes.slice([0, 4], [-1, numClass])?.squeeze() as tf.Tensor2D;
      if (!rawScores) throw new Error("Failed to compute scores");
      return [
        rawScores.max(1) as tf.Tensor1D,
        rawScores.argMax(1) as tf.Tensor1D
      ];
    });

    const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.3, 0.001);
    if (!nms) {
      throw new Error("Non-max suppression failed");
    }

    const detReady = tf.tidy(() => {
      const result = tf.concat(
        [
          boxes.gather(nms, 0),
          scores.gather(nms, 0).expandDims(1),
          classes.gather(nms, 0).expandDims(1),
        ],
        1
      ) as tf.Tensor2D;
      if (!result) throw new Error("Failed to prepare detection results");
      return result;
    });

    const masks = tf.tidy(() => {
      const sliced = transRes.slice([0, 4 + numClass], [-1, modelSegChannel])?.squeeze() as tf.Tensor2D;
      if (!sliced) throw new Error("Failed to slice masks");

      const gathered = sliced.gather(nms, 0);
      const reshaped = transSegMask.reshape([modelSegChannel, -1]);
      if (!gathered || !reshaped) throw new Error("Failed to process masks");

      return gathered
        .matMul(reshaped)
        .reshape([nms.shape[0], modelSegHeight, modelSegWidth]) as tf.Tensor3D;
    });

    const toDraw: FaceResults[] = [];
    let overlay: tf.Tensor3D | null = tf.zeros([modelHeight, modelWidth, 4]) as tf.Tensor3D;

    const skinAnalysisResult: SkinAnalysisResult[] = []

    for (let i = 0; i < detReady.shape[0]; i++) {
      const rowData = detReady.slice([i, 0], [1, 6]);
      const data = rowData.dataSync();
      if (data.length < 6) {
        console.warn(`Skipping invalid detection at index ${i}`);
        continue;
      }

      const [y1, x1, y2, x2, score, label] = data;
      const color = colors.get(label);

      const downSampleBox: number[] = [
        Math.floor((y1 * modelSegHeight) / modelHeight),
        Math.floor((x1 * modelSegWidth) / modelWidth),
        Math.round(((y2 - y1) * modelSegHeight) / modelHeight),
        Math.round(((x2 - x1) * modelSegWidth) / modelWidth),
      ];

      const upSampleBox: number[] = [
        Math.floor(y1 * yRatio),
        Math.floor(x1 * xRatio),
        Math.round((y2 - y1) * yRatio),
        Math.round((x2 - x1) * xRatio),
      ];

      try {
        const proto = tf.tidy(() => {
          const sliced = masks.slice(
            [
              i,
              Math.max(0, downSampleBox[0]),
              Math.max(0, downSampleBox[1]),
            ],
            [
              1,
              Math.min(downSampleBox[2], modelSegHeight - downSampleBox[0]),
              Math.min(downSampleBox[3], modelSegWidth - downSampleBox[1]),
            ]
          ) as tf.Tensor3D;

          if (!sliced) throw new Error("Failed to slice proto");
          return sliced.squeeze().expandDims(-1) as tf.Tensor3D;
        });

        if (!proto) continue;

        const upsampleProto = tf.image.resizeBilinear(proto, [upSampleBox[2], upSampleBox[3]]) as tf.Tensor3D;
        if (!upsampleProto) continue;

        const mask = tf.tidy(() => {
          const padded = upsampleProto.pad([
            [upSampleBox[0], modelHeight - (upSampleBox[0] + upSampleBox[2])],
            [upSampleBox[1], modelWidth - (upSampleBox[1] + upSampleBox[3])],
            [0, 0],
          ]) as tf.Tensor3D;

          if (!padded) throw new Error("Failed to pad mask");
          return padded.less(0.5) as tf.Tensor3D;
        });

        if (!mask || !overlay) continue;

        overlay = tf.tidy(() => {
          const rgba = Colors.hexToRgba(color);
          if (!rgba) throw new Error("Invalid color");

          const newOverlay = overlay!.where(mask, [...rgba, 150]) as tf.Tensor3D;
          overlay!.dispose();
          return newOverlay;
        });

        toDraw.push({
          box: upSampleBox,
          score: Math.ceil(score * 100),
          class: label,
          label: labels[label] ?? 'Unknown',
          color,
        });

        skinAnalysisResult.push({
          label: labels[label] ?? 'Unknown',
          score: Math.ceil(score * 100),
          class: label
        })
        tf.dispose([rowData, proto, upsampleProto, mask]);
      } catch (err) {
        console.warn(`Error processing detection at index ${i}:`, err);
        continue;
      }
    }

    if (!overlay) {
      throw new Error("Failed to create overlay");
    }

    const overlayData = await overlay.data();
    const maskImg = new ImageData(
      new Uint8ClampedArray(overlayData),
      modelHeight,
      modelWidth
    );
    const ctx = canvasRef.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.putImageData(maskImg, 0, 0);
    // renderBoxes(ctx, toDraw);

    callback();
    return [toDraw, skinAnalysisResult];
  } catch (error) {
    console.error("Detection error:", error);
    throw error;
  } finally {
    tf.engine().endScope();
  }
};

const legendColors = [
  [0, 0, 0, 0],
  [128, 62, 117, 255],
  [255, 104, 0, 255],
  [166, 189, 215, 255],
  [193, 0, 32, 255],
  [206, 162, 98, 255],
  [129, 112, 102, 255],
  [0, 125, 52, 255],
  [246, 118, 142, 255],
  [0, 83, 138, 255],
  [255, 112, 92, 255],
  [83, 55, 112, 255],
  [255, 142, 0, 255],
  [179, 40, 81, 255],
  [244, 200, 0, 255],
  [127, 24, 13, 255],
  [147, 170, 0, 255],
  [89, 51, 21, 255],
  [241, 58, 19, 255],
  [35, 44, 22, 255],
  [0, 161, 194, 255] // Vivid Blue
];

const calculateMean = (arr: Float32Array<ArrayBufferLike>) => {
  if (arr.length === 0) return 0;

  // Convert all values > 0.01 to 1.0, others to 0
  let count = 0;
  let total = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 0.005) {
      total += 1.0; // Assign 1.0 to values above threshold
      count++;
    }
  }

  // Calculate average of these binary values
  // This gives us the proportion of pixels above threshold
  return count > 0 ? total / (arr.length * 0.15) : 0;
};

const modelLabel1 = {
  labels: ["background", "acne", "pores", "spots", "wrinkles"],
  colors: [
    [0, 0, 0, 0],        // background
    [247, 37, 133, 255],   // acne
    [244, 235, 36, 255],   // pores
    [15, 56, 204, 255],    // spots
    [0, 255, 56, 255],     // wrinkles
  ],
};

const modelLabel2 = {
  labels: ["background"],
  colors: [[0, 0, 0, 0]], // background
};

const modelLabel3 = {
  labels: ["background", "dark circles", "eyebags", "oily", "redness"],
  colors: [
    [0, 0, 0, 0],        // background
    [107, 19, 177, 255],   // dark circles
    [0, 224, 255, 255],    // eyebags
    [181, 23, 158, 255],   // oily
    [189, 142, 255, 255],  // redness
  ],
};
const modelLabel: { labels: string[], colors: number[][] }[] = [
  modelLabel1,
  modelLabel2,
  modelLabel3,
]

export const detectSegment = async (
  source: HTMLImageElement,
  canvasRef: HTMLCanvasElement,
  segmenter: ImageSegmenter,
  labelId: number = 0,
  layerId: number = 0 // Parameter baru untuk mengidentifikasi layer
): Promise<[FaceResults[], SkinAnalysisResult[]]> => {
  const labels = modelLabel[labelId].labels;
  const colors = modelLabel[labelId].colors;
  const CONFIDENCE_THRESHOLD = labelId === 0 ? 0.005 : 0.05; // Minimum confidence score to include in mask

  try {
    // Sesuaikan ukuran canvas utama jika ini adalah layer pertama
    if (layerId === 0) {
      canvasRef.width = source.naturalWidth;
      canvasRef.height = source.naturalHeight;
    }

    // Buat offscreen canvas untuk proses segmentasi
    const offscreen = new OffscreenCanvas(source.naturalWidth, source.naturalHeight);
    const offscreenCtx = offscreen.getContext('2d');
    if (!offscreenCtx) throw "Offscreen canvas context not found";

    // Jika ini adalah layer pertama, clear dan gambar image source
    if (layerId === 0) {
      const canvasCtx = canvasRef.getContext('2d');
      if (!canvasCtx) throw "Canvas not found";
      canvasCtx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    }

    // Gambar source image ke offscreen canvas untuk mendapatkan pixel data awal
    // offscreenCtx.drawImage(source, 0, 0);
    let imageData = offscreenCtx.getImageData(0, 0, source.naturalWidth, source.naturalHeight);
    let pixels = imageData.data;

    // Perform segmentation
    const result = segmenter.segment(source);

    // Check if confidenceMasks are available
    if (!result.confidenceMasks || result.confidenceMasks.length === 0) {
      throw "Confidence masks not available";
    }

    const width = source.naturalWidth;
    const height = source.naturalHeight;

    // We'll create our own combined mask based on confidence thresholds
    const combinedMask = new Uint8Array(width * height);

    // Access confidence scores and calculate mean for each class
    const confidenceScores: { [key: number]: number } = {};
    const skinResult: SkinAnalysisResult[] = [];
    let firmness = 100;
    let moistures = 100;
    let texture = 100;
    let radiance = 100;

    // Process each confidence mask
    for (let numClass = 0; numClass < result.confidenceMasks.length; numClass++) {
      // Skip background class (index 0)
      if (numClass === 0) continue;

      const confidenceMask = result.confidenceMasks[numClass].getAsFloat32Array();

      // Calculate mean score for this class
      confidenceScores[numClass] = calculateMean(confidenceMask);

      skinResult.push({
        label: labels[numClass] ?? 'Unknown',
        score: Math.ceil(confidenceScores[numClass] * 100),
        class: numClass
      });

      // Adjust calculated skin metrics based on detected conditions
      if (labels[numClass] == "redness" || labels[numClass] == "pores" || labels[numClass] == "eyebags") {
        firmness -= Math.ceil(confidenceScores[numClass] * 100);
      }
      if (labels[numClass] == "redness" || labels[numClass] == "pores" || labels[numClass] == "acne" || labels[numClass] == "dry" || labels[numClass] == "oily") {
        moistures -= Math.ceil(confidenceScores[numClass] * 100);
      }
      if (labels[numClass] == "eyebags") {
        radiance -= Math.ceil(confidenceScores[numClass] * 100);
      }
      texture -= 5;

      // Create combined mask using confidence threshold
      for (let i = 0; i < confidenceMask.length; i++) {
        if (confidenceMask[i] >= CONFIDENCE_THRESHOLD) {
          // If this pixel exceeds our threshold, mark it with the class number
          // Only overwrite if this class has higher confidence than what's already there
          if (combinedMask[i] === 0 || confidenceMask[i] > confidenceScores[combinedMask[i]]) {
            combinedMask[i] = numClass;
          }
        }
      }
    }

    // Add derived skin metrics to results
    skinResult.push({
      label: 'firmness',
      score: Math.max(0, firmness),
      class: 14
    });
    skinResult.push({
      label: 'moisture',
      score: Math.max(0, moistures),
      class: 15
    });
    skinResult.push({
      label: 'radiance',
      score: Math.max(0, radiance - moistures - firmness),
      class: 16
    });
    skinResult.push({
      label: 'texture',
      score: Math.max(0, texture),
      class: 17
    });

    // Blend colors with image data on offscreen canvas based on our combined mask
    let j = 0;
    for (let i = 0; i < combinedMask.length; ++i) {
      const maskVal = combinedMask[i];
      if (maskVal > 0) { // Only apply color if not background
        const legendColor = colors[(maskVal % colors.length)] || [0, 0, 0, 0];
        pixels[j] = (legendColor[0] + pixels[j]) / 2;
        pixels[j + 1] = (legendColor[1] + pixels[j + 1]) / 2;
        pixels[j + 2] = (legendColor[2] + pixels[j + 2]) / 2;
        pixels[j + 3] = (legendColor[3] + pixels[j + 3]) / 2;
      }
      j += 4;
    }

    // Put modified image data back to offscreen canvas
    offscreenCtx.putImageData(imageData, 0, 0);

    // Get unique categories from our combined mask
    const uniqueCategories: Set<number> = new Set();
    for (let i = 0; i < combinedMask.length; ++i) {
      const maskVal = combinedMask[i];
      if (maskVal > 0) { // Ignore background (0)
        uniqueCategories.add(maskVal);
      }
    }

    // Untuk setiap kategori, cari connected components
    const faceResults: FaceResults[] = [];
    uniqueCategories.forEach(category => {
      // Buat array boolean untuk mask dari kategori ini
      const categoryMask = new Array(width * height).fill(false);
      for (let i = 0; i < combinedMask.length; i++) {
        if (combinedMask[i] === category) {
          categoryMask[i] = true;
        }
      }

      // Temukan connected components dengan flood fill
      const visited = new Array(width * height).fill(false);
      let components = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;

          if (categoryMask[idx] && !visited[idx]) {
            // Mulai flood fill untuk component baru
            const component = {
              pixels: [],
              minX: width,
              minY: height,
              maxX: 0,
              maxY: 0,
              score: 0
            };

            // Queue untuk flood fill
            const queue = [{ x, y }];
            visited[idx] = true;

            while (queue.length > 0) {
              const pixel = queue.shift();
              const px = pixel?.x || 0;
              const py = pixel?.y || 0;
              const pidx = py * width + px;

              // Tambahkan pixel ini ke component
              component.pixels.push({ x: px, y: py });

              // Update bounding box
              component.minX = Math.min(component.minX, px);
              component.minY = Math.min(component.minY, py);
              component.maxX = Math.max(component.maxX, px);
              component.maxY = Math.max(component.maxY, py);

              // Periksa 4 tetangga (atas, bawah, kiri, kanan)
              const neighbors = [
                { x: px, y: py - 1 }, // atas
                { x: px, y: py + 1 }, // bawah
                { x: px - 1, y: py }, // kiri
                { x: px + 1, y: py }  // kanan
              ];

              for (const neighbor of neighbors) {
                const nx = neighbor.x;
                const ny = neighbor.y;

                // Pastikan tetangga dalam batas gambar
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nidx = ny * width + nx;

                  // Jika tetangga adalah bagian dari kategori yang sama dan belum dikunjungi
                  if (categoryMask[nidx] && !visited[nidx]) {
                    queue.push({ x: nx, y: ny });
                    visited[nidx] = true;
                  }
                }
              }
            }

            // Tambahkan score dari confidenceScores
            component.score = confidenceScores[category] || 0;

            components.push(component);
          }
        }
      }

      // Gabungkan components yang berdekatan
      const DISTANCE_THRESHOLD = 20; // Jarak maksimal antar bounding box untuk digabungkan
      let mergedComponents = [];

      // Tandai komponen mana yang sudah digabungkan
      const merged = new Array(components.length).fill(false);

      for (let i = 0; i < components.length; i++) {
        if (merged[i]) continue; // Skip jika sudah digabungkan

        let mergedComponent = {
          minX: components[i].minX,
          minY: components[i].minY,
          maxX: components[i].maxX,
          maxY: components[i].maxY,
          pixels: [...components[i].pixels],
          score: components[i].score
        };

        merged[i] = true;

        // Periksa semua komponen lain untuk digabungkan
        let mergeHappened = true;

        // Lakukan iterasi hingga tidak ada lagi penggabungan
        while (mergeHappened) {
          mergeHappened = false;

          for (let j = 0; j < components.length; j++) {
            if (merged[j]) continue; // Skip yang sudah digabungkan

            // Hitung jarak antar bounding box
            const horizontalOverlap =
              !(mergedComponent.maxX < components[j].minX || components[j].maxX < mergedComponent.minX);
            const verticalOverlap =
              !(mergedComponent.maxY < components[j].minY || components[j].maxY < mergedComponent.minY);

            let minDistance = Infinity;

            // Jika overlap secara horizontal, hitung jarak vertikal
            if (horizontalOverlap) {
              if (mergedComponent.maxY < components[j].minY) {
                minDistance = components[j].minY - mergedComponent.maxY;
              } else if (components[j].maxY < mergedComponent.minY) {
                minDistance = mergedComponent.minY - components[j].maxY;
              } else {
                minDistance = 0; // Overlap
              }
            }
            // Jika overlap secara vertikal, hitung jarak horizontal
            else if (verticalOverlap) {
              if (mergedComponent.maxX < components[j].minX) {
                minDistance = components[j].minX - mergedComponent.maxX;
              } else if (components[j].maxX < mergedComponent.minX) {
                minDistance = mergedComponent.minX - components[j].maxX;
              } else {
                minDistance = 0; // Overlap
              }
            }
            // Jika tidak overlap sama sekali, hitung jarak Euclidean antar titik terdekat
            else {
              // Titik-titik sudut dari kedua bounding box
              const corners1 = [
                { x: mergedComponent.minX, y: mergedComponent.minY },
                { x: mergedComponent.maxX, y: mergedComponent.minY },
                { x: mergedComponent.minX, y: mergedComponent.maxY },
                { x: mergedComponent.maxX, y: mergedComponent.maxY }
              ];

              const corners2 = [
                { x: components[j].minX, y: components[j].minY },
                { x: components[j].maxX, y: components[j].minY },
                { x: components[j].minX, y: components[j].maxY },
                { x: components[j].maxX, y: components[j].maxY }
              ];

              // Cari jarak terdekat antara semua kemungkinan pasangan titik
              for (const c1 of corners1) {
                for (const c2 of corners2) {
                  const dist = Math.sqrt(
                    Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2)
                  );
                  minDistance = Math.min(minDistance, dist);
                }
              }
            }

            // Jika jarak cukup dekat, gabungkan
            if (minDistance <= DISTANCE_THRESHOLD) {
              mergedComponent.minX = Math.min(mergedComponent.minX, components[j].minX);
              mergedComponent.minY = Math.min(mergedComponent.minY, components[j].minY);
              mergedComponent.maxX = Math.max(mergedComponent.maxX, components[j].maxX);
              mergedComponent.maxY = Math.max(mergedComponent.maxY, components[j].maxY);
              mergedComponent.pixels = [...mergedComponent.pixels, ...components[j].pixels];

              // Gunakan score maksimal untuk komponen yang digabungkan
              mergedComponent.score = Math.max(mergedComponent.score, components[j].score);

              merged[j] = true;
              mergeHappened = true;
            }
          }
        }

        mergedComponents.push(mergedComponent);
      }

      // Add each merged component to results
      const legendColor = legendColors[category % legendColors.length];
      mergedComponents.forEach((component, index) => {
        const boxWidth = component.maxX - component.minX;
        const boxHeight = component.maxY - component.minY;

        faceResults.push({
          box: [component.minY, component.minX, boxHeight, boxWidth],
          score: Math.ceil(component.score * 100),
          class: category,
          label: labels[category] ?? 'Unknown',
          color: '#ffffff',
        });
      });
    });

    // Akhirnya, gambar hasil dari offscreen canvas ke canvas utama
    const canvasCtx = canvasRef.getContext('2d');
    if (!canvasCtx) throw "Canvas not found";

    // Gunakan composite operation yang sesuai berdasarkan layerId
    if (layerId === 0) {
      canvasCtx.globalCompositeOperation = 'source-over';
    } else {
      canvasCtx.globalCompositeOperation = 'screen'; // Atau 'lighter'
    }

    // Gambar hasil dari offscreen canvas ke canvas utama
    canvasCtx.drawImage(offscreen, 0, 0);
    segmenter.close();
    result.close();

    return [faceResults, skinResult];
  } catch (error) {
    console.log(error);
    throw new Error("Error in face detection");
  }
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {Model} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 * @throws {Error} If video source or canvas is invalid
 */
export const detectVideo = (
  vidSource: HTMLVideoElement,
  model: Model,
  canvasRef: HTMLCanvasElement
): void => {
  if (!vidSource || !model || !canvasRef) {
    throw new Error("Invalid parameters for video detection");
  }

  const detect = async (): Promise<void> => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
      const ctx = canvasRef.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      return;
    }

    try {
      await detectFrame(vidSource, model, canvasRef, () => {
        requestAnimationFrame(detect);
      });
    } catch (error) {
      console.error("Error in video detection:", error);
      // Optionally retry or handle error
    }
  };

  detect();
};