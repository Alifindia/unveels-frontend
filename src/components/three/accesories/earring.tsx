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
      if (
        !currentLandmarks ||
        !leftEarringRef.current ||
        !rightEarringRef.current
      )
        return;
    
      if (currentLandmarks.length > 0) {
        const leftEarLandmark = currentLandmarks[132]; // Landmark telinga kiri
        const rightEarLandmark = currentLandmarks[361]; // Landmark telinga kanan
    
        if (!leftEarLandmark || !rightEarLandmark) {
          leftEarringRef.current.visible = false;
          rightEarringRef.current.visible = false;
          return;
        }
    
        // Periksa apakah wajah menghadap langsung ke depan
        const faceOrientationThreshold = 0.05; // Toleransi untuk orientasi wajah
        const isFacingFront = Math.abs(leftEarLandmark.z - rightEarLandmark.z) < faceOrientationThreshold;
    
        // Transformasi posisi landmark ke koordinat dunia
        const leftEarX = (1 - leftEarLandmark.x - 0.5) * outputWidth;
        const leftEarY = -(leftEarLandmark.y - 0.52) * outputHeight;
        const leftEarZ = -leftEarLandmark.z * 100;
    
        const rightEarX = (1 - rightEarLandmark.x - 0.5) * outputWidth;
        const rightEarY = -(rightEarLandmark.y - 0.52) * outputHeight;
        const rightEarZ = -rightEarLandmark.z * 100;
    
        // Hitung ukuran wajah untuk skala anting
        const faceSize = calculateDistance(
          currentLandmarks[447],
          currentLandmarks[454]
        );
        const baseScaleFactor = (faceSize * outputWidth) / 4.9;
    
        // Hitung rotasi wajah
        const quaternion = calculateFaceOrientation(currentLandmarks);
        if (quaternion) {
          // Tentukan visibilitas anting berdasarkan orientasi wajah
          leftEarringRef.current.visible = isFacingFront || leftEarLandmark.z <= rightEarLandmark.z;
          rightEarringRef.current.visible = isFacingFront || rightEarLandmark.z <= leftEarLandmark.z;
    
          // Tentukan skala anting jika wajah menghadap depan
          const scaleFactor = isFacingFront ? baseScaleFactor * 0.7 : baseScaleFactor;
    
          // Update posisi, skala, dan rotasi anting jika terlihat
          if (leftEarringRef.current.visible) {
            leftEarringRef.current.position.set(leftEarX, leftEarY, leftEarZ);
            leftEarringRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
            leftEarringRef.current.setRotationFromQuaternion(quaternion);
    
            // Terapkan offset kecil untuk akurasi
            leftEarringRef.current.translateX(scaleFactor * 0.5);
            leftEarringRef.current.translateY(-scaleFactor * 1.5);
            leftEarringRef.current.translateZ(-scaleFactor * 1.5);
          }
    
          if (rightEarringRef.current.visible) {
            rightEarringRef.current.position.set(rightEarX, rightEarY, rightEarZ);
            rightEarringRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
            rightEarringRef.current.setRotationFromQuaternion(quaternion);
    
            // Terapkan offset kecil untuk akurasi
            rightEarringRef.current.translateX(-scaleFactor * 0.5);
            rightEarringRef.current.translateY(-scaleFactor * 1.5);
            rightEarringRef.current.translateZ(-scaleFactor * 1.5);
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
