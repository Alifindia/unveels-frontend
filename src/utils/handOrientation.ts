import { Matrix4, Quaternion, Vector3 } from "three";
import { Landmark } from "../types/landmark";

export function handQuaternion(
  landmarks: Landmark[],
  indexFingerIndex: number = 16,
  pinkyFingerIndex: number = 12,
): Quaternion | null {
  const wrist = new Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);

  const indexFinger = new Vector3(
    landmarks[indexFingerIndex].x,
    landmarks[indexFingerIndex].y,
    landmarks[indexFingerIndex].z,
  );
  const pinkyFinger = new Vector3(
    landmarks[pinkyFingerIndex].x,
    landmarks[pinkyFingerIndex].y,
    landmarks[pinkyFingerIndex].z,
  );

  const v1 = new Vector3().subVectors(indexFinger, wrist).normalize();

  const v2 = new Vector3().subVectors(pinkyFinger, wrist).normalize();

  const handNormal = new Vector3().crossVectors(v1, v2).normalize();

  const rotationMatrix = new Matrix4().lookAt(wrist, pinkyFinger, handNormal);

  const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

  return quaternion;
}
