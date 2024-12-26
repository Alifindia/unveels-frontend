export interface Orientation {
  yaw: number;
  pitch: number;
}

export function calculateOrientation(keypoints: any[]): Orientation {
  if (keypoints.length < 3) {
    return { yaw: 0, pitch: 0 };
  }

  // **Ensure keypoint indices match MediaPipe documentation**
  const leftEye = keypoints[0];
  const rightEye = keypoints[1];
  const nose = keypoints[2];

  // Calculate yaw and pitch based on eye and nose positions
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Simple pitch estimation based on nose position relative to eyes
  const noseY = nose.y;
  const eyesY = (leftEye.y + rightEye.y) / 2;
  const pitchAngle = (eyesY - noseY) * 0.1; // Scaling factor

  return {
    yaw: angle,
    pitch: pitchAngle,
  };
}
