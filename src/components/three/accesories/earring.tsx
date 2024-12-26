// EarringInner.tsx
import React, { useMemo, useEffect, useRef, Suspense } from "react";
import { Object3D, Mesh, MeshStandardMaterial } from "three";
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
    const { envMapAccesories } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    // Menggunakan useMemo untuk menentukan scaleMultiplier
    const { scaleMultiplier, bottomEarPosX, bottomEarPosY } = useMemo(() => {
      if (viewport.width > 1200) {
        return {
          scaleMultiplier: 800,
          bottomEarPosX: 1.05,
          bottomEarPosY: 3,
        };
      }

      if (viewport.width > 500 && viewport.width < 800) {
        return {
          scaleMultiplier: 200,
          bottomEarPosX: 2,
          bottomEarPosY: 1.3,
        };
      }

      if (viewport.width > 800 && viewport.width < 1200) {
        return {
          scaleMultiplier: 200,
          bottomEarPosX: 1.08,
          bottomEarPosY: 1.7,
        };
      }

      return { scaleMultiplier: 200, bottomEarPosX: 1.8, bottomEarPosY: 1.3 };
    }, [viewport.width]);

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

      // Earring kiri menggunakan landmark 132
      const leftBottomEar = currentLandmarks[93];

      // Earring kanan menggunakan landmark 323
      const rightBottomEar = currentLandmarks[323];

      // Skala koordinat proporsional dengan viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      // Posisi kiri
      const leftBottomEarX =
        (1 - leftBottomEar.x) * outputWidth * scaleX - viewport.width / 2;
      const leftBottomEarY =
        -leftBottomEar.y * outputHeight * scaleY + viewport.height / 2;
      const leftBottomEarZ = -leftBottomEar.z * 100;

      // Posisi kanan
      const rightBottomEarX =
        (1 - rightBottomEar.x) * outputWidth * scaleX - viewport.width / 2;
      const rightBottomEarY =
        -rightBottomEar.y * outputHeight * scaleY + viewport.height / 2;
      const rightBottomEarZ = -rightBottomEar.z * 100;

      const faceSize = calculateDistance(
        currentLandmarks[447],
        currentLandmarks[454],
      );

      // Set posisi dan skala untuk left earring
      leftEarringRef.current.position.set(
        leftBottomEarX * bottomEarPosX,
        leftBottomEarY * bottomEarPosY,
        leftBottomEarZ - 40,
      );

      const leftScaleFactor =
        faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;
      leftEarringRef.current.scale.set(
        leftScaleFactor,
        leftScaleFactor,
        leftScaleFactor,
      );

      // Set posisi dan skala untuk right earring
      rightEarringRef.current.position.set(
        rightBottomEarX * bottomEarPosX, // Tambahkan offset jika diperlukan
        rightBottomEarY * bottomEarPosY,
        rightBottomEarZ - 40, // Tambahkan offset jika diperlukan
      );

      const rightScaleFactor =
        faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;
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
