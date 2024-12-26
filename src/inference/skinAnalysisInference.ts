import { labels, skinAnalysisDataItem } from "../utils/constants";
import { base64ToImage, preprocess } from "../utils/imageProcessing";
import { FaceResults } from "../types/faceResults";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as tflite from "@tensorflow/tfjs-tflite";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";

class Colors {
  palette: string[];
  n: number;

  // ultralytics color palette https://ultralytics.com/
  constructor() {
    this.palette = [
      "#FF3838",
      "#FF9D97",
      "#FF701F",
      "#FFB21D",
      "#CFD231",
      "#48F90A",
      "#92CC17",
      "#3DDB86",
      "#1A9334",
      "#00D4BB",
      "#2C99A8",
      "#00C2FF",
      "#344593",
      "#6473FF",
      "#0018EC",
      "#8438FF",
      "#520085",
      "#CB38FF",
      "#FF95C8",
      "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i: number): string => this.palette[Math.floor(i) % this.n];

  static hexToRgba = (hex: string): number[] | null => {
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

export const skinAnalysisInference = async (
  imageData: string,
  model: tflite.TFLiteModel,
): Promise<[FaceResults[], SkinAnalysisResult[]]> => {
  try {
    let inBatch: number | undefined;
    let modelHeight: number | undefined;
    let modelWidth: number | undefined;
    let modelDepth: number | undefined;
    let outBatch: number | undefined;
    let modelSegHeight: number | undefined;
    let modelSegWidth: number | undefined;
    let modelSegChannel: number | undefined;
    let input: tf.Tensor | undefined;
    let xRatio: number | undefined;
    let yRatio: number | undefined;
    const toDraw: FaceResults[] = [];
    const results: SkinAnalysisResult[] = [];
    const image = await base64ToImage(imageData);
    const colors = new Colors();

    if (model.inputs[0].shape) {
      [inBatch, modelHeight, modelWidth, modelDepth] = model.inputs[0].shape;
    }

    if (model.outputs[1].shape) {
      [outBatch, modelSegHeight, modelSegWidth, modelSegChannel] =
        model.outputs[1].shape;
    }

    if (
      image != undefined &&
      modelWidth != undefined &&
      modelHeight != undefined
    ) {
      [input, xRatio, yRatio] = preprocess(image, modelWidth, modelHeight);
    }

    if (
      input != undefined &&
      modelSegChannel != undefined &&
      modelHeight != undefined &&
      modelSegHeight != undefined &&
      modelSegWidth != undefined &&
      modelHeight != undefined &&
      modelWidth != undefined &&
      yRatio != undefined &&
      xRatio != undefined
    ) {
      tf.engine().startScope();

      let result:
        | tf.Tensor<tf.Rank>
        | tf.Tensor<tf.Rank>[]
        | tf.NamedTensorMap = await model.predict(input);

      const numClass: number = labels.length;

      const res = result[Object.keys(result)[0]];
      const segRes = result[Object.keys(result)[1]];

      const transRes = tf.tidy(() => tf.squeeze(tf.transpose(res, [0, 2, 1])));

      const transSegMask = tf.tidy(() =>
        tf.squeeze(tf.transpose(segRes, [0, 3, 1, 2])),
      );

      const boxes: tf.Tensor2D = tf.tidy(() => {
        const w = tf.slice(transRes, [0, 2], [-1, 1]);
        const h = tf.slice(transRes, [0, 3], [-1, 1]);
        const x1 = tf.sub(tf.slice(transRes, [0, 0], [-1, 1]), tf.div(w, 2)); //x1
        const y1 = tf.sub(tf.slice(transRes, [0, 1], [-1, 1]), tf.div(h, 2)); //y1
        return tf.squeeze(
          tf.concat(
            [
              y1,
              x1,
              tf.add(y1, h), //y2
              tf.add(x1, w), //x2
            ],
            1,
          ), // [y1, x1, y2, x2]
        ); // [n, 4]
      }); // get boxes [y1, x1, y2, x2]

      const [scores, classes] = tf.tidy(() => {
        const sliced = tf.slice(transRes, [0, 4], [-1, numClass]);
        const rawScores = tf.squeeze(sliced); // [n, 1]
        return [tf.max(rawScores, 1), tf.argMax(rawScores, 1)];
      }); // get scores and classes

      const nms = await tf.image.nonMaxSuppressionAsync(
        boxes,
        scores,
        100,
        0.25,
        0.01,
      ); // do nms to filter boxes

      const detReady = tf.tidy(() =>
        tf.concat(
          [
            tf.gather(boxes, nms, 0),
            tf.expandDims(tf.gather(scores, nms, 0), 1),
            tf.expandDims(tf.gather(classes, nms, 0), 1),
          ],
          1, // axis
        ),
      ); // indexing selected boxes, scores and classes from NMS result

      const masks = tf.tidy(() => {
        const sliced = tf.squeeze(
          tf.slice(transRes, [0, 4 + numClass], [-1, modelSegChannel]),
        );
        const gathered = tf.gather(sliced, nms, 0); // get selected mask from NMS result

        // matmul mask with segmentation mask result [n, mask_size] x [mask_size, h x w] => [n, h x w]
        const mul = tf.matMul(
          gathered,
          tf.reshape(transSegMask, [modelSegChannel, -1]),
        );

        // reshape back [n, h x w] => [n, h, w]
        const reshaped = tf.reshape(mul, [
          nms.shape[0],
          modelSegHeight,
          modelSegWidth,
        ]);
        return reshaped;
      }); // processing mask

      console.log(detReady.shape[0]);

      for (let i = 0; i < detReady.shape[0]; i++) {
        const rowData = tf.slice(detReady, [i, 0], [1, 6]); // get every first 6 element from every row
        let [y1, x1, y2, x2, score, label] = await rowData.data(); // [y1, x1, y2, x2, score, label]
        const color = colors.get(label); // get label color

        console.log("BBOX:", label, score, x1, y1, x2, y2);

        const downSampleBox = [
          Math.floor((y1 * modelSegHeight) / modelHeight), // y
          Math.floor((x1 * modelSegWidth) / modelWidth), // x
          Math.round(((y2 - y1) * modelSegHeight) / modelHeight), // h
          Math.round(((x2 - x1) * modelSegWidth) / modelWidth), // w
        ]; // downsampled box (box ratio at model output)

        const upSampleBox = [
          Math.floor(y1 * yRatio), // y
          Math.floor(x1 * xRatio), // x
          Math.round((y2 - y1) * yRatio), // h
          Math.round((x2 - x1) * xRatio), // w
        ]; // upsampled box (box ratio to draw)

        toDraw.push({
          box: upSampleBox,
          score: score,
          class: label,
          label: labels[label],
          color: color,
        }); // push box information to draw later

        tf.dispose([rowData]); // dispose unused tensor to free memory
      }

      console.log(toDraw);

      tf.engine().endScope();

      // Dispose tensors
      tf.dispose([
        res,
        segRes,
        transRes,
        transSegMask,
        boxes,
        scores,
        classes,
        detReady,
        masks,
        input,
      ]);
    }

    // combine data
    toDraw.forEach((data) => {
      results.push({
        class: data.class,
        label: data.label,
        score: data.score,
      });
    });

    skinAnalysisDataItem.forEach((data) => {
      results.push({
        class: data.class,
        label: data.label,
        score: data.score,
      });
    });

    results.push({
      class: 1000,
      label: "imageData",
      score: 0,
      data: imageData,
    });

    return [toDraw, results];
  } catch (e) {
    console.warn("Error occured durring inference : " + e);
  }

  return [[], []];
};
