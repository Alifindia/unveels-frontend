export interface FaceResults {
  box: number[];
  class: number;
  color: string;
  label: string;
  score: float;
  polygon?: { x: number; y: number }[];
}
