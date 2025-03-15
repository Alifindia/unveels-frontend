// EarringInner.tsx
import React, { useMemo, useEffect, useRef, Suspense } from "react";
import { Object3D, Mesh, MeshStandardMaterial, Quaternion } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Landmark } from "../../../types/landmark";
import { EARRING } from "../../../utils/constants";
import { useAccesories } from "../../../context/accesories-context";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface EarringProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const EarringInner: React.FC<EarringProps> = React.memo(
  ({ landmarks, planeSize }) => {
    const leftEarringRef = useRef<Object3D | null>(null);
    const rightEarringRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories, showEarring } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        EARRING,
        (gltf) => {
          const originalEarring = gltf.scene;

          // Fungsi untuk mengkloning dan mengatur setiap earring
          const setupEarring = (earring: Object3D) => {
            earring.traverse((child) => {
              if ((child as Mesh).isMesh) {
                const mesh = child as Mesh;
                if (mesh.material instanceof MeshStandardMaterial) {
                  mesh.material.envMap = envMapAccesories;
                  mesh.material.needsUpdate = true;
                  mesh.material.visible = showEarring;
                }
                child.renderOrder = 2;
              }
            });
            return earring;
          };

          // Clone untuk left earring
          const leftEarring = originalEarring.clone();
          setupEarring(leftEarring);
          leftEarringRef.current = leftEarring;
          scene.add(leftEarring);

          // Clone untuk right earring
          const rightEarring = originalEarring.clone();
          setupEarring(rightEarring);
          rightEarringRef.current = rightEarring;
          scene.add(rightEarring);

          console.log("Earring models loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the earring model: ", error);
        },
      );

      return () => {
        if (leftEarringRef.current) {
          scene.remove(leftEarringRef.current);
        }
        if (rightEarringRef.current) {
          scene.remove(rightEarringRef.current);
        }
      };
    }, [scene, envMapAccesories]);

    useFrame(() => {
      const currentLandmarks = landmarks.current;
      if (!leftEarringRef.current || !rightEarringRef.current) return;
      if (!currentLandmarks) {
        leftEarringRef.current.visible = false;
        rightEarringRef.current.visible = false;
        return;
      } else {
        leftEarringRef.current.visible = true;
        rightEarringRef.current.visible = true;
      }

      if (currentLandmarks.length > 0) {
        const leftEarLandmark = currentLandmarks[177]; // Landmark telinga kiri
        const rightEarLandmark = currentLandmarks[401]; // Landmark telinga kanan

        if (!leftEarLandmark || !rightEarLandmark) {
          leftEarringRef.current.visible = false;
          rightEarringRef.current.visible = false;
          return;
        }
        // Periksa apakah wajah menghadap langsung ke depan
        const faceOrientationThreshold = 0.08; // Toleransi untuk orientasi wajah
        const isFacingFront =
          Math.abs(leftEarLandmark.z - rightEarLandmark.z) <
          faceOrientationThreshold;

        // Transformasi posisi landmark ke koordinat dunia
        const leftEarX = (1 - leftEarLandmark.x - 0.5) * outputWidth;
        const leftEarY = -(leftEarLandmark.y - 0.5) * outputHeight;
        const leftEarZ =
          -leftEarLandmark.z * Math.max(outputHeight, outputWidth);

        const rightEarX = (1 - rightEarLandmark.x - 0.5) * outputWidth;
        const rightEarY = -(rightEarLandmark.y - 0.5) * outputHeight;
        const rightEarZ =
          -rightEarLandmark.z * Math.max(outputHeight, outputWidth);

        // Hitung ukuran wajah untuk skala anting
        const faceSize = calculateDistance(
          currentLandmarks[447],
          currentLandmarks[454],
        );
        const scaleFactor = (faceSize * outputWidth) / 4.9;

        // Hitung rotasi wajah
        const quaternion = calculateFaceOrientation(currentLandmarks);
        if (quaternion) {
          // Update posisi, skala, dan rotasi anting jika terlihat
          if (leftEarringRef.current.visible) {
            leftEarringRef.current.position.set(leftEarX, leftEarY, leftEarZ);
            leftEarringRef.current.scale.set(
              scaleFactor,
              scaleFactor,
              scaleFactor,
            );
            leftEarringRef.current.setRotationFromQuaternion(quaternion);
          }

          if (rightEarringRef.current.visible) {
            rightEarringRef.current.position.set(
              rightEarX,
              rightEarY,
              rightEarZ,
            );
            rightEarringRef.current.scale.set(
              scaleFactor,
              scaleFactor,
              scaleFactor,
            );
            rightEarringRef.current.setRotationFromQuaternion(quaternion);
          }

          if (isFacingFront) {
            leftEarringRef.current.translateY(-scaleFactor * 1.7);
            rightEarringRef.current.translateY(-scaleFactor * 1.7);
            leftEarringRef.current.translateX(scaleFactor * 1);
            rightEarringRef.current.translateX(-scaleFactor * 1);
          }
        } else {
          // Sembunyikan anting jika rotasi tidak dapat dihitung
          leftEarringRef.current.visible = false;
          rightEarringRef.current.visible = false;
        }
      } else {
        leftEarringRef.current.visible = false;
        rightEarringRef.current.visible = false;
      }
    });

    return null;
  },
);

const Earring: React.FC<EarringProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <EarringInner {...props} />
    </Suspense>
  );
};

export default Earring;
