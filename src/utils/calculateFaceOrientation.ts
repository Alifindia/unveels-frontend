// utils/faceOrientation.ts
import { Vector3, Matrix4, Quaternion } from "three";
import { Landmark } from "../types/landmark";

/**
 * Menghitung orientasi wajah berdasarkan landmark.
 * @param landmarks Array Landmark yang berisi titik-titik wajah.
 * @returns Quaternion yang mewakili rotasi wajah.
 */
export function calculateFaceOrientation(
  landmarks: Landmark[],
): Quaternion | null {
  // Pastikan landmark yang diperlukan tersedia
  const requiredIndices = [1, 152, 33, 263, 234, 454];
  for (const index of requiredIndices) {
    if (!landmarks[index]) {
      console.warn(`Landmark at index ${index} is missing.`);
      return null;
    }
  }

  // Ekstrak landmark penting
  const nose = landmarks[1];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];

  // Hitung titik tengah mata dan telinga
  const eyeMid = new Vector3(
    (leftEye.x + rightEye.x) / 2,
    (leftEye.y + rightEye.y) / 2,
    (leftEye.z + rightEye.z) / 2,
  );
  const earMid = new Vector3(
    (leftEar.x + rightEar.x) / 2,
    (leftEar.y + rightEar.y) / 2,
    (leftEar.z + rightEar.z) / 2,
  );

  // Hitung vektor forward dan up
  const forward = new Vector3().subVectors(nose, earMid).normalize();
  const up = new Vector3().subVectors(chin, eyeMid).normalize();

  // Hitung vektor right
  const right = new Vector3().crossVectors(up, forward).normalize();

  // Buat matriks rotasi
  const rotationMatrix = new Matrix4();
  rotationMatrix.makeBasis(right, up, forward);

  // Konversi matriks rotasi ke quaternion
  const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

  // Koreksi quaternion jika diperlukan
  const correctionQuaternion = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    Math.PI,
  );
  quaternion.multiply(correctionQuaternion);

  return quaternion;
}
