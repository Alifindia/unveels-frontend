import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshBasicMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { HAND_OCCLUDER } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";

interface HandOccluderProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const HandOccluderInner: React.FC<HandOccluderProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const occluderRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        HAND_OCCLUDER,
        (gltf) => {
          const occluder = gltf.scene;
          occluder.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              mesh.material = new MeshBasicMaterial({
                depthTest: true,
                depthWrite: true,
                colorWrite: false,
              });
              mesh.renderOrder = 4;
            }
          });

          occluderRef.current = occluder;
          scene.add(occluder);
          console.log("Occluder model loaded successfully");
        },
        undefined,
        (error) => {
          console.error(
            "An error occurred loading the occluder model: ",
            error,
          );
        },
      );

      return () => {
        if (occluderRef.current) {
          scene.remove(occluderRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!handLandmarks.current || !occluderRef.current) return;
      if (handLandmarks.current.length > 0) {
        occluderRef.current.visible = true;
        const wrist = handLandmarks.current[0];
        const thumbBase = handLandmarks.current[1];

        const wristSize = calculateDistance(wrist, thumbBase);

        const wristX = (1 - wrist.x - 0.5) * outputWidth;
        const wristY = -(wrist.y - 0.5) * outputHeight;
        const wristZ = -wrist.z * Math.max(outputHeight, outputWidth);

        const scaleFactor = (wristSize * Math.max(outputHeight, outputWidth)) / 3.5;

        occluderRef.current.position.set(wristX, wristY, wristZ);
        occluderRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = handQuaternion(handLandmarks.current);

        if (quaternion) {
          occluderRef.current.setRotationFromQuaternion(quaternion);
        }
      } else {
        occluderRef.current.visible = false;
      }
    });

    return null;
  },
);

const HandOccluder: React.FC<HandOccluderProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <HandOccluderInner {...props} />
    </Suspense>
  );
};

export default HandOccluder;
