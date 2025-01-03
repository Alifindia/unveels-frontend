import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { Landmark } from "../../../types/landmark";
import { WATCH } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";
import { useAccesories } from "../../../context/accesories-context";

interface WatchProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const WatchInner: React.FC<WatchProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const watchRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories, showWatch } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        WATCH,
        (gltf) => {
          const watch = gltf.scene;
          watch.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
                mesh.material.visible = showWatch;
              }
              child.renderOrder = 4;
            }
          });

          watchRef.current = watch;
          scene.add(watch);
          console.log("watch model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the watch model: ", error);
        },
      );

      return () => {
        if (watchRef.current) {
          scene.remove(watchRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!handLandmarks.current || !watchRef.current) return;
      if (handLandmarks.current.length > 0) {
        watchRef.current.visible = true;
    
        const wrist = handLandmarks.current[0]; // Landmark untuk pergelangan tangan
        const thumbBase = handLandmarks.current[1]; // Landmark untuk pangkal ibu jari
        const indexBase = handLandmarks.current[5]; // Landmark untuk pangkal jari telunjuk
    
        const wristSize = calculateDistance(wrist, thumbBase);
        const wristX = (1 - wrist.x - 0.5) * outputWidth;
        const wristY = -(wrist.y - 0.5) * outputHeight;
        const wristZ = 200;
    
        const scaleFactor = (wristSize * outputWidth) / 3;
    
        watchRef.current.position.set(wristX, wristY, wristZ);
        watchRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
        // Deteksi apakah tangan kiri atau tangan kanan
        const isRightHand = thumbBase.x < indexBase.x;
    
        const quaternion = handQuaternion(handLandmarks.current);
    
        if (quaternion) {
          // Set quaternion berdasarkan sisi tangan
          if (isRightHand) {
            const adjustment = new Quaternion().setFromAxisAngle(
              new Vector3(0, 0, 1), // Rotasi di sekitar sumbu Z
              Math.PI, // Rotasi 180 derajat
            );
            watchRef.current.quaternion.copy(quaternion).multiply(adjustment);
          } else {
            watchRef.current.setRotationFromQuaternion(quaternion);
          }
        }

        // Memeriksa apakah pergelangan tangan menekuk
        const isWristBent = wristSize < 0.1; // Jika pergelangan tangan menekuk lebih tajam dari threshold ini
        if (isWristBent) {
          watchRef.current.visible = false; // Sembunyikan jam tangan jika pergelangan tangan menekuk
        } else {
          watchRef.current.visible = true; // Tampilkan jam tangan jika pergelangan tangan tidak menekuk
        }

      } else {
        watchRef.current.visible = false;
      }
    });

    return null;
  },
);

const Watch: React.FC<WatchProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <WatchInner {...props} />
    </Suspense>
  );
};

export default Watch;
