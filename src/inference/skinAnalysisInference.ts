import * as tf from "@tensorflow/tfjs";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";
import { labels } from "../utils/constants";

interface DetectionBox {
  box: number[];
  score: number;
  klass: number;
  label: string;
  color: string;
}

export const renderBoxes = (
  ctx: CanvasRenderingContext2D,
  boxesToDraw: DetectionBox[]
): void => {
  // font configs
  const font = `10px Roboto, sans-serif`;
  ctx.font = font;
  ctx.textBaseline = "top";

  boxesToDraw.forEach((detection: DetectionBox) => {
    // filter based on class threshold
    const score = (detection.score * 100).toFixed(1);

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
      "#FF7F7F", // acne
      "#4A4A4A", // blackhead
      "#8B4513", // dark circle
      "#FFD700", // droopy lower eyelid
      "#FF6347", // droopy upper eyelid
      "#FFE4B5", // dry
      "#D2B48C", // eyebag
      "#00CED1", // moistures
      "#FFA07A", // oily
      "#8A2BE2", // pore
      "#FF4500", // skinredness
      "#DA70D6", // spots
      "#FFFFFF", // whitehead
      "#708090", // wrinkles
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
): Promise<SkinAnalysisResult[]> => {
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

    const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.5, 0.01);
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

    const toDraw: DetectionBox[] = [];
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
          score,
          klass: label,
          label: labels[label] ?? 'Unknown',
          color,
        });

        skinAnalysisResult.push({
          label: labels[label] ?? 'Unknown',
          score: score * 100,
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
    renderBoxes(ctx, toDraw);

    callback();
    return skinAnalysisResult;
  } catch (error) {
    console.error("Detection error:", error);
    throw error;
  } finally {
    tf.engine().endScope();
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