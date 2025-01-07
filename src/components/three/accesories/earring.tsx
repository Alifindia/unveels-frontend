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

      if (landmarks.current.length > 0) {
        leftEarringRef.current.visible = true;
        rightEarringRef.current.visible = true;
        // Earring kiri menggunakan landmark 132
        const leftBottomEar = currentLandmarks[132];

        // Earring kanan menggunakan landmark 323
        const rightBottomEar = currentLandmarks[361];

        // Posisi kiri
        const leftBottomEarX = (1 - leftBottomEar.x - 0.5) * outputWidth;
        const leftBottomEarY = -(leftBottomEar.y - 0.5) * outputHeight;
        const leftBottomEarZ = -leftBottomEar.z * 100;

        // Posisi kanan
        const rightBottomEarX = (1 - rightBottomEar.x - 0.5) * outputWidth;
        const rightBottomEarY = -(rightBottomEar.y - 0.5) * outputHeight;
        const rightBottomEarZ = -rightBottomEar.z * 100;

        const faceSize = calculateDistance(
          currentLandmarks[447],
          currentLandmarks[454],
        );

        // Set posisi dan skala untuk left earring
        leftEarringRef.current.position.set(
          leftBottomEarX,
          leftBottomEarY,
          leftBottomEarZ,
        );

        const leftScaleFactor = (faceSize * outputWidth) / 4;
        leftEarringRef.current.scale.set(
          leftScaleFactor,
          leftScaleFactor,
          leftScaleFactor,
        );

        // Set posisi dan skala untuk right earring
        rightEarringRef.current.position.set(
          rightBottomEarX, // Tambahkan offset jika diperlukan
          rightBottomEarY,
          rightBottomEarZ, // Tambahkan offset jika diperlukan
        );

        const rightScaleFactor = (faceSize * outputWidth) / 4;
        rightEarringRef.current.scale.set(
          rightScaleFactor,
          rightScaleFactor,
          rightScaleFactor,
        );

        // Menghitung rotasi wajah menggunakan fungsi terpisah
        const quaternion = calculateFaceOrientation(currentLandmarks);
        if (quaternion) {
          leftEarringRef.current.setRotationFromQuaternion(quaternion);
          rightEarringRef.current.setRotationFromQuaternion(quaternion);
          if (quaternion?.z < -0.011) {
            leftEarringRef.current.visible = false;
          }
          if (quaternion?.z > 0.011) {
            rightEarringRef.current.visible = false;
          }
        }

        rightEarringRef.current.translateX(-(rightScaleFactor * 0.8));
        rightEarringRef.current.translateY(-(rightScaleFactor * 1.8));
        rightEarringRef.current.translateZ(-(rightScaleFactor * 2));
        leftEarringRef.current.translateX(leftScaleFactor * 0.8);
        leftEarringRef.current.translateY(-(leftScaleFactor * 1.8));
        leftEarringRef.current.translateZ(-(leftScaleFactor * 2));
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
