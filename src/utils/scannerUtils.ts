import { Landmark } from "../types/landmark";

export function calculateHeadRotation(faceLandmarks: Landmark[]) {
  const nose = faceLandmarks[33];
  const chin = faceLandmarks[152];
  const leftTemple = faceLandmarks[234];
  const rightTemple = faceLandmarks[454];

  const deltaY = chin.y - nose.y;
  const deltaZ = chin.z - nose.z;
  const pitch = Math.atan2(deltaY, deltaZ);

  const deltaX = rightTemple.x - leftTemple.x;
  const roll = Math.atan2(deltaY, deltaX);

  return { pitch, roll };
}

export function applyStretchedLandmarks(faceLandmarks: Landmark[]) {
  return faceLandmarks.map((landmark, index) => {
    const isForehead = [54, 103, 67, 109, 10, 338, 297, 332, 284].includes(
      index,
    );

    if (isForehead) {
      const { pitch } = calculateHeadRotation(faceLandmarks);
      const foreheadShiftY = Math.sin(pitch) * 0.06;
      const foreheadShiftZ = Math.cos(pitch) * 0.1;

      return {
        x: landmark.x,
        y: landmark.y - foreheadShiftY,
        z: landmark.z + foreheadShiftZ,
      };
    }
    return landmark;
  });
}

export const drawConnectorsFromFaces = (
  faceLandmarks: Landmark[],
  gradient: CanvasGradient,
  offsetX: number,
  offsetY: number,
  drawWidth: number,
  drawHeight: number,
  faces: number[],
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  // Iterasi setiap 3 angka di dalam `faces` untuk membentuk segitiga
  for (let i = 0; i < faces.length; i += 3) {
    const indexA = faces[i];
    const indexB = faces[i + 1];
    const indexC = faces[i + 2];

    const pointA = faceLandmarks[indexA];
    const pointB = faceLandmarks[indexB];
    const pointC = faceLandmarks[indexC];

    // Membalikkan posisi X karena kita telah membalik canvas secara horizontal
    const ax = offsetX + (1 - pointA.x) * drawWidth; // Menggunakan (1 - x) untuk membalikkan koordinat
    const ay = offsetY + pointA.y * drawHeight;

    const bx = offsetX + (1 - pointB.x) * drawWidth;
    const by = offsetY + pointB.y * drawHeight;

    const cx = offsetX + (1 - pointC.x) * drawWidth;
    const cy = offsetY + pointC.y * drawHeight;

    // Gambar segitiga
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();

    // Stroke segitiga dengan gradient
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export const calculateOrientation = (landmarks: Landmark[]) => {
  const leftEye = landmarks[468]; // Landmark mata kiri
  const rightEye = landmarks[473]; // Landmark mata kanan
  const nose = landmarks[1]; // Landmark hidung
  const mouth = landmarks[0]; // Landmark mulut

  // Hitung sudut pitch (kemiringan ke atas/bawah)
  const pitch = Math.atan2(mouth.y - nose.y, Math.abs(mouth.x - nose.x));

  // Hitung sudut yaw (putaran ke kiri/kanan)
  const yaw = Math.atan2(
    rightEye.x - leftEye.x,
    Math.abs(rightEye.y - leftEye.y),
  );

  return { yaw, pitch };
};

export const calculatePosition = (
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
) => {
  const nose = landmarks[1]; // Landmark 1 sering kali adalah hidung (cek dokumentasi model)
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Jarak relatif dari pusat layar
  const offsetX = (nose.x * canvasWidth - centerX) / centerX; // Nilai antara -1 dan 1
  const offsetY = (nose.y * canvasHeight - centerY) / centerY; // Nilai antara -1 dan 1

  return { x: offsetX, y: offsetY };
};
