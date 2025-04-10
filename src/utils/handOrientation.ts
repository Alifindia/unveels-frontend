import { Matrix4, Quaternion, Vector3 } from "three";
import { Landmark } from "../types/landmark";

export function handQuaternion(
  landmarks: Landmark[],
  indexFingerIndex: number = 16,
  pinkyFingerIndex: number = 12,
  handType: HandType = HandType.LEFT // Default to LEFT for backward compatibility
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

  // Tentukan arah vektor berdasarkan jenis tangan
  let v1, v2;

  if (handType === HandType.LEFT) {
    // Untuk tangan kiri, gunakan urutan original
    v1 = new Vector3().subVectors(indexFinger, wrist).normalize();
    v2 = new Vector3().subVectors(pinkyFinger, wrist).normalize();
  } else {
    // Untuk tangan kanan, tukar urutan untuk menghasilkan normal yang benar
    v1 = new Vector3().subVectors(pinkyFinger, wrist).normalize();
    v2 = new Vector3().subVectors(indexFinger, wrist).normalize();
  }

  // Cross product menghasilkan vektor normal yang berbeda arah tergantung urutan
  const handNormal = new Vector3().crossVectors(v1, v2).normalize();

  // Gunakan lookAt untuk membuat matriks rotasi
  const rotationMatrix = new Matrix4().lookAt(wrist, pinkyFinger, handNormal);

  // Konversi matriks rotasi ke quaternion
  const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);

  return quaternion;
}

export function ringFingerQuatternion(
  landmarks: Landmark[],
  handType: HandType = HandType.LEFT // Default to LEFT for backward compatibility
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

  // Vektor samping untuk orientasi cincin berdasarkan jenis tangan
  let sideVector;

  if (handType === HandType.LEFT) {
    // Untuk tangan kiri, dari kelingking ke tengah
    sideVector = new Vector3().subVectors(middleFingerBase, pinkyFingerBase).normalize();
  } else {
    // Untuk tangan kanan, dari tengah ke kelingking
    sideVector = new Vector3().subVectors(pinkyFingerBase, middleFingerBase).normalize();
  }

  // Hitung vektor normal tangan (tegak lurus terhadap permukaan jari)
  // Cross product berbeda untuk tangan kiri dan kanan
  let handNormal;

  if (handType === HandType.LEFT) {
    handNormal = new Vector3().crossVectors(mainDirection, sideVector).normalize();
  } else {
    // Untuk tangan kanan, balik urutan untuk mendapatkan normal yang benar
    handNormal = new Vector3().crossVectors(sideVector, mainDirection).normalize();
  }

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
  // Untuk tangan kanan, arah tilt harus dibalik
  const handnessFactor = handType === HandType.LEFT ? 1 : -1;
  const tiltAngle = Math.PI * 0.05 * handnessFactor; // Sekitar 9 derajat, disesuaikan dengan jenis tangan
  const tiltQuaternion = new Quaternion().setFromAxisAngle(rightVector, tiltAngle);

  // Gabungkan rotasi
  return quaternion.multiply(tiltQuaternion);
}

export enum FingerType {
  THUMB = 0,
  INDEX = 1,
  MIDDLE = 2,
  RING = 3,
  PINKY = 4
}

export enum HandType {
  LEFT = 'Left',
  RIGHT = 'Right'
}

export function fingerTipQuaternion(
  landmarks: Landmark[],
  fingerType: FingerType = FingerType.INDEX,
  handType: HandType = HandType.LEFT // Default to LEFT for backward compatibility
): Quaternion | null {
  // Jika landmarks tidak lengkap, kembalikan null
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  // Indeks landmark untuk jari berdasarkan tipe jari
  // Setiap jari memiliki 4 titik (MCP, PIP, DIP, TIP)
  const fingerIndices = {
    [FingerType.THUMB]: [1, 2, 3, 4],     // Ibu jari
    [FingerType.INDEX]: [5, 6, 7, 8],     // Telunjuk
    [FingerType.MIDDLE]: [9, 10, 11, 12], // Jari tengah
    [FingerType.RING]: [13, 14, 15, 16],  // Jari manis
    [FingerType.PINKY]: [17, 18, 19, 20]  // Kelingking
  };

  // Indeks jari yang dipilih
  const [mcpIndex, pipIndex, dipIndex, tipIndex] = fingerIndices[fingerType];

  // Ambil titik-titik penting pada jari yang dipilih
  const mcpPosition = new Vector3(landmarks[mcpIndex].x, landmarks[mcpIndex].y, landmarks[mcpIndex].z);
  const pipPosition = new Vector3(landmarks[pipIndex].x, landmarks[pipIndex].y, landmarks[pipIndex].z);
  const dipPosition = new Vector3(landmarks[dipIndex].x, landmarks[dipIndex].y, landmarks[dipIndex].z);
  const tipPosition = new Vector3(landmarks[tipIndex].x, landmarks[tipIndex].y, landmarks[tipIndex].z);

  // Dapatkan posisi MCP jari-jari lain untuk perhitungan orientasi
  const indexMCP = new Vector3(landmarks[5].x, landmarks[5].y, landmarks[5].z);
  const middleMCP = new Vector3(landmarks[9].x, landmarks[9].y, landmarks[9].z);
  const ringMCP = new Vector3(landmarks[13].x, landmarks[13].y, landmarks[13].z);
  const pinkyMCP = new Vector3(landmarks[17].x, landmarks[17].y, landmarks[17].z);

  // Titik tengah telapak tangan dan pergelangan tangan (untuk ibu jari)
  const wristPoint = new Vector3(landmarks[0].x, landmarks[0].y, landmarks[0].z);

  // Dapatkan titik tambahan untuk orientasi jempol yang lebih baik
  const thumbCMC = new Vector3(landmarks[1].x, landmarks[1].y, landmarks[1].z); // Carpometacarpal
  const indexDIP = new Vector3(landmarks[7].x, landmarks[7].y, landmarks[7].z); // DIP jari telunjuk

  // Vektor arah utama (dari DIP ke TIP) - fokus pada ujung jari
  const mainDirection = new Vector3().subVectors(tipPosition, dipPosition).normalize();

  // Vektor samping dan normal tergantung pada jenis jari
  let handNormal, sideVector;

  // Faktor untuk membalik perhitungan berdasarkan jenis tangan
  // Untuk tangan kanan, beberapa vektor perlu dibalik untuk mempertahankan orientasi yang konsisten
  const handnessFactor = handType === HandType.LEFT ? 1 : -1;

  switch (fingerType) {
    case FingerType.THUMB:
      // Untuk ibu jari, gunakan vektor dari CMC ke pergelangan tangan (wrist)
      // dan sesuaikan orientasinya dengan titik telunjuk
      sideVector = new Vector3().subVectors(indexDIP, thumbCMC).normalize();
      // Flip arah normal untuk orientasi yang benar, mempertimbangkan handedness
      handNormal = new Vector3().crossVectors(sideVector, mainDirection).normalize();
      handNormal.multiplyScalar(-1 * handnessFactor); // Balik arah normal, sesuaikan dengan jenis tangan
      break;

    case FingerType.INDEX:
      // Untuk telunjuk, gunakan vektor dari telunjuk ke jari tengah
      sideVector = new Vector3().subVectors(middleMCP, indexMCP).normalize();
      handNormal = new Vector3().crossVectors(mainDirection, sideVector).normalize();
      // Untuk tangan kanan, balik arah normal
      if (handType === HandType.RIGHT) {
        handNormal.multiplyScalar(-1);
      }
      break;

    case FingerType.MIDDLE:
      // Untuk jari tengah, gunakan vektor dari kelingking ke telunjuk (orientasi yang benar)
      // Untuk tangan kanan, arah dari telunjuk ke kelingking
      if (handType === HandType.LEFT) {
        sideVector = new Vector3().subVectors(indexMCP, pinkyMCP).normalize();
      } else {
        sideVector = new Vector3().subVectors(pinkyMCP, indexMCP).normalize();
      }
      handNormal = new Vector3().crossVectors(mainDirection, sideVector).normalize();
      break;

    case FingerType.RING:
      // Untuk jari manis, gunakan vektor dari kelingking ke jari tengah
      // Arah ini konsisten untuk kedua tangan
      sideVector = new Vector3().subVectors(middleMCP, pinkyMCP).normalize();
      handNormal = new Vector3().crossVectors(mainDirection, sideVector).normalize();
      // Untuk tangan kanan, balik arah normal
      if (handType === HandType.RIGHT) {
        handNormal.multiplyScalar(-1);
      }
      break;

    case FingerType.PINKY:
      // Untuk kelingking, gunakan vektor dari jari manis ke jari tengah
      sideVector = new Vector3().subVectors(middleMCP, ringMCP).normalize();
      handNormal = new Vector3().crossVectors(sideVector, mainDirection).normalize();
      // Untuk tangan kanan, balik arah normal
      if (handType === HandType.RIGHT) {
        handNormal.multiplyScalar(-1);
      }
      break;

    default:
      // Default case
      sideVector = new Vector3().subVectors(middleMCP, indexMCP).normalize();
      handNormal = new Vector3().crossVectors(mainDirection, sideVector).normalize();
      // Untuk tangan kanan, balik arah normal
      if (handType === HandType.RIGHT) {
        handNormal.multiplyScalar(-1);
      }
  }

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

  // Tambahkan sedikit tilt (rotasi sekitar rightVector)
  // Sesuaikan tilt untuk setiap jari
  let tiltAngle;

  switch (fingerType) {
    case FingerType.THUMB:
      tiltAngle = Math.PI * 0.12 * handnessFactor; // Sekitar 21.6 derajat, sesuaikan handedness
      break;
    case FingerType.INDEX:
      tiltAngle = Math.PI * 0.05 * handnessFactor; // Sekitar 9 derajat, sesuaikan handedness
      break;
    case FingerType.MIDDLE:
      tiltAngle = Math.PI * 0.05 * handnessFactor; // Sekitar 9 derajat, sesuaikan handedness
      break;
    case FingerType.RING:
      tiltAngle = Math.PI * 0.05 * handnessFactor; // Sekitar 9 derajat, sesuaikan handedness
      break;
    case FingerType.PINKY:
      tiltAngle = Math.PI * 0.08 * handnessFactor; // Sekitar 14.4 derajat, sesuaikan handedness
      break;
    default:
      tiltAngle = Math.PI * 0.05 * handnessFactor; // Default, sesuaikan handedness
  }

  const tiltQuaternion = new Quaternion().setFromAxisAngle(rightVector, tiltAngle);

  // Gabungkan rotasi
  return quaternion.multiply(tiltQuaternion);
}