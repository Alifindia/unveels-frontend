export interface BboxLandmark {
  box: [number, number, number, number];
  class: number;
  label: string;
  color: string;
  score: number;
}
