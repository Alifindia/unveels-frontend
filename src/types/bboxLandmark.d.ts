export interface BboxLandmark {
  box: [number, number, number, number]; // [leftIndex, topIndex, rightIndex, bottomIndex]
  class: number;
  label: string;
  color: string;
  score: number;
}
