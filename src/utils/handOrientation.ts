import { Matrix4, Quaternion, Vector3 } from "three";
import { Landmark } from "../types/landmark";

export function handQuaternion(landmarks: Landmark[]): Quaternion | null {
  const wrist = new Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);

  const indexFinger = new Vector3(
    landmarks[5].x,
    landmarks[5].y,
    landmarks[5].z,
  );
  const pinkyFinger = new Vector3(
    landmarks[17].x,
    landmarks[17].y,
    landmarks[17].z,
  );

  const v1 = new Vector3().subVectors(indexFinger, wrist).normalize();

  const v2 = new Vector3().subVectors(pinkyFinger, wrist).normalize();

  const handNormal = new Vector3().crossVectors(v1, v2).normalize();

  const rotationMatrix = new Matrix4().lookAt(wrist, pinkyFinger, handNormal);

  const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

  return quaternion;
}
