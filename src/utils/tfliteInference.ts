// src/utils/tfliteInference.ts
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as tflite from "@tensorflow/tfjs-tflite";

export const loadTFLiteModel = async (
  modelUrl: string,
): Promise<tflite.TFLiteModel> => {
  console.log(modelUrl);
  try {
    let tfliteModel: tflite.TFLiteModel | null = null;

    tflite.setWasmPath(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/",
    );

    tfliteModel = await tflite.loadTFLiteModel(modelUrl);
    console.log("TFLite Model loaded successfully");
    return tfliteModel;
  } catch (error) {
    console.error("Error loading TFLite model:", error);
    throw error;
  }
};

/**
 * Preprocesses the image for TFLite model inference.
 * @param imageData Base64 string of the image
 * @returns Preprocessed Float32Array
 */
export const preprocessTFLiteImage = async (
  imageData: string,
  w: number,
  h: number,
): Promise<Float32Array> => {
  const img = new Image();
  img.src = imageData;
  await img.decode(); // Wait for the image to load

  const canvas = document.createElement("canvas");
  canvas.width = w; // Adjust size as per model
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas context");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Convert image data to Float32Array (RGB)
  const input = new Float32Array((imageDataObj.data.length / 4) * 3);
  for (let i = 0; i < imageDataObj.data.length; i += 4) {
    input[(i / 4) * 3] = imageDataObj.data[i] / 255; // R
    input[(i / 4) * 3 + 1] = imageDataObj.data[i + 1] / 255; // G
    input[(i / 4) * 3 + 2] = imageDataObj.data[i + 2] / 255; // B
  }

  return input;
};

/**
 * Performs inference using the loaded TFLite model.
 * @param preprocessedImage Preprocessed Float32Array
 * @returns Inference results as Float32Array
 */
export const runTFLiteInference = async (
  tfliteModel: tflite.TFLiteModel,
  preprocessedImage: Float32Array,
  w: number,
  h: number,
): Promise<tf.Tensor<tf.Rank> | tf.Tensor<tf.Rank>[] | tf.NamedTensorMap> => {
  if (!tfliteModel) {
    throw new Error("TFLite model is not loaded");
  }

  try {
    // Create Tensor from Float32Array
    const inputTensor = tf.tensor(preprocessedImage, [1, w, h, 3]);

    // Perform inference
    const outputTensor:
      | tf.Tensor<tf.Rank>
      | tf.Tensor<tf.Rank>[]
      | tf.NamedTensorMap = await tfliteModel.predict(inputTensor);

    return outputTensor;
  } catch (error) {
    console.error("Error during TFLite inference:", error);
    throw error;
  }
};
