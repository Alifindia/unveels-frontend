export interface Classifier {
  name: string;
  outputName: string;
  labels?: string[];
  outputLabel: string;
  outputScore?: number;
  outputData?: number[];
  outputIndex?: number;
  outputColor?: string;
  imageData?: string;
}
