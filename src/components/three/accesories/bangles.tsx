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
import { BANGLE } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";
import { useAccesories } from "../../../context/accesories-context";

interface BangleProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const BangleInner: React.FC<BangleProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const bangleRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories, showBracelet } = useAccesories();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        BANGLE,
        (gltf) => {
          const bangle = gltf.scene;
          bangle.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
                mesh.material.visible = showBracelet;
              }
              child.renderOrder = 5;
            }
          });

          bangleRef.current = bangle;
          scene.add(bangle);
          console.log("bangle model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the bangle model: ", error);
        },
      );

      return () => {
        if (bangleRef.current) {
          scene.remove(bangleRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!bangleRef.current) return;
      if (!handLandmarks.current) {
        bangleRef.current.visible = false
        return;
      }
      if (handLandmarks.current.length > 0) {
        const wrist = handLandmarks.current[0]; // Pergelangan tangan
        const thumbBase = handLandmarks.current[1]; // Pangkal ibu jari
        const indexBase = handLandmarks.current[5]; // Pangkal jari telunjuk
        const pinkyBase = handLandmarks.current[17]; // Pangkal jari kelingking

        const isPalmFacingBack = thumbBase.z > pinkyBase.z;

        const wristSize = calculateDistance(wrist, thumbBase);
        const wristX = (1 - wrist.x - 0.5) * outputWidth;
        const wristY = -(wrist.y - 0.5) * outputHeight;
        const wristZ = -wrist.z * Math.max(outputHeight, outputWidth);
        const scaleFactor = wristSize * outputWidth;

        bangleRef.current.position.set(wristX, wristY, wristZ);
        bangleRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = handQuaternion(handLandmarks.current);

        if (quaternion) {
          bangleRef.current.setRotationFromQuaternion(quaternion);
        }

        const isWristBent = wristSize < 0.1;
        bangleRef.current.visible = true;
      }
    });

    return null;
  },
);

const Bangle: React.FC<BangleProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <BangleInner {...props} />
    </Suspense>
  );
};

export default Bangle;
