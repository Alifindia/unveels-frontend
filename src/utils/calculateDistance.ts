import { Landmark } from "../types/landmark";

export function calculateDistance(landmark1: Landmark, landmark2: Landmark) {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = landmark1.z - landmark2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
