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



export function ringFingerQuatternion(
  landmarks: Landmark[]
): Quaternion | null {
  // Indeks landmark untuk jari manis (ring finger)
  // 13: Pangkal jari manis (MCP)
  // 14: Sendi tengah jari manis (PIP)
  // 9: Pangkal jari tengah (middle finger MCP)
  // 17: Pangkal jari kelingking (pinky MCP)

  // Jika landmarks tidak lengkap, kembalikan null
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  // Ambil titik-titik penting pada jari manis
  const ringBase = new Vector3(landmarks[13].x, landmarks[13].y, landmarks[13].z);
  const ringPIP = new Vector3(landmarks[14].x, landmarks[14].y, landmarks[14].z);

  // Ambil titik dari jari tengah dan kelingking untuk orientasi samping
  const middleFingerBase = new Vector3(landmarks[9].x, landmarks[9].y, landmarks[9].z);
  const pinkyFingerBase = new Vector3(landmarks[17].x, landmarks[17].y, landmarks[17].z);

  // Vektor arah utama (dari MCP ke PIP)
  const mainDirection = new Vector3().subVectors(ringPIP, ringBase).normalize();

  // Vektor samping untuk orientasi cincin (dari kelingking ke tengah)
  const sideVector = new Vector3().subVectors(middleFingerBase, pinkyFingerBase).normalize();

  // Hitung vektor normal tangan (tegak lurus terhadap permukaan jari)
  const handNormal = new Vector3().crossVectors(mainDirection, sideVector).normalize();

  // Hitung vektor kanan yang benar-benar tegak lurus
  const rightVector = new Vector3().crossVectors(mainDirection, handNormal).normalize();

  // Buat matriks rotasi
  const rotationMatrix = new Matrix4();

  // Set kolom-kolom matriks untuk menghasilkan rotasi yang tepat
  // Kolom X - Gunakan mainDirection sebagai arah utama
  rotationMatrix.elements[0] = mainDirection.x;
  rotationMatrix.elements[1] = mainDirection.y;
  rotationMatrix.elements[2] = mainDirection.z;

  // Kolom Y - Gunakan handNormal untuk orientasi atas
  rotationMatrix.elements[4] = handNormal.x;
  rotationMatrix.elements[5] = handNormal.y;
  rotationMatrix.elements[6] = handNormal.z;

  // Kolom Z - Gunakan rightVector untuk orientasi samping
  rotationMatrix.elements[8] = rightVector.x;
  rotationMatrix.elements[9] = rightVector.y;
  rotationMatrix.elements[10] = rightVector.z;

  // Cek jika ada deformasi berlebihan pada matriks
  const determinant =
    rotationMatrix.elements[0] * (rotationMatrix.elements[5] * rotationMatrix.elements[10] - rotationMatrix.elements[6] * rotationMatrix.elements[9]) -
    rotationMatrix.elements[1] * (rotationMatrix.elements[4] * rotationMatrix.elements[10] - rotationMatrix.elements[6] * rotationMatrix.elements[8]) +
    rotationMatrix.elements[2] * (rotationMatrix.elements[4] * rotationMatrix.elements[9] - rotationMatrix.elements[5] * rotationMatrix.elements[8]);

  // Jika determinan terlalu jauh dari 1, kembalikan null
  if (Math.abs(determinant - 1) > 0.1) {
    return null;
  }

  // Kalkulasi quaternion dari matriks rotasi
  const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

  // Tambahkan sedikit tilt ke atas (rotasi sekitar rightVector)
  const tiltAngle = Math.PI * 0.05; // Sekitar 9 derajat
  const tiltQuaternion = new Quaternion().setFromAxisAngle(rightVector, tiltAngle);

  // Gabungkan rotasi
  return quaternion.multiply(tiltQuaternion);
}